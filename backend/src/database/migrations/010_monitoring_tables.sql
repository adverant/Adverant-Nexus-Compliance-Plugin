-- Migration: 010_monitoring_tables.sql
-- Description: Monitoring baselines and scheduled check tables
-- Author: Adverant Compliance Service
-- Date: 2025-12-31

-- ============================================================================
-- COMPLIANCE BASELINES
-- Snapshot of compliance state for drift detection
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_baselines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    assessment_id UUID NOT NULL REFERENCES compliance_assessments(id) ON DELETE CASCADE,
    framework_id VARCHAR(50) NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,

    -- Baseline scores
    overall_score DECIMAL(5,2) NOT NULL,
    control_scores JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Capture metadata
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    captured_by VARCHAR(255) NOT NULL,
    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for baseline queries
CREATE INDEX IF NOT EXISTS idx_baselines_tenant ON compliance_baselines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_baselines_framework ON compliance_baselines(framework_id);
CREATE INDEX IF NOT EXISTS idx_baselines_captured ON compliance_baselines(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_baselines_assessment ON compliance_baselines(assessment_id);

-- ============================================================================
-- COMPLIANCE MONITORING CHECKS
-- Record of scheduled monitoring check results
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_monitoring_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,
    framework_id VARCHAR(50) NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,

    -- Check timing
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Score tracking
    previous_score DECIMAL(5,2),
    current_score DECIMAL(5,2),
    score_delta DECIMAL(5,2),

    -- Issue counts
    drift_count INTEGER DEFAULT 0,
    expired_evidence INTEGER DEFAULT 0,
    expiring_evidence INTEGER DEFAULT 0,
    overdue_remediations INTEGER DEFAULT 0,
    alerts_created INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for monitoring check queries
CREATE INDEX IF NOT EXISTS idx_monitoring_checks_tenant ON compliance_monitoring_checks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_checks_framework ON compliance_monitoring_checks(framework_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_checks_checked ON compliance_monitoring_checks(checked_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- Tenant isolation for monitoring tables
-- ============================================================================

ALTER TABLE compliance_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_monitoring_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_baselines ON compliance_baselines
    USING (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_monitoring_checks ON compliance_monitoring_checks
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- ============================================================================
-- FUNCTIONS
-- Helper functions for monitoring operations
-- ============================================================================

-- Function to get the latest baseline for a framework
CREATE OR REPLACE FUNCTION get_latest_baseline(
    p_tenant_id VARCHAR(255),
    p_framework_id VARCHAR(50)
) RETURNS compliance_baselines AS $$
DECLARE
    v_baseline compliance_baselines%ROWTYPE;
BEGIN
    SELECT * INTO v_baseline
    FROM compliance_baselines
    WHERE tenant_id = p_tenant_id
      AND framework_id = p_framework_id
    ORDER BY captured_at DESC
    LIMIT 1;

    RETURN v_baseline;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate compliance trend
CREATE OR REPLACE FUNCTION get_compliance_trend(
    p_tenant_id VARCHAR(255),
    p_framework_id VARCHAR(50),
    p_days INTEGER DEFAULT 90
) RETURNS TABLE (
    check_date DATE,
    avg_score DECIMAL(5,2),
    check_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE(checked_at) as check_date,
        AVG(current_score)::DECIMAL(5,2) as avg_score,
        COUNT(*)::INTEGER as check_count
    FROM compliance_monitoring_checks
    WHERE tenant_id = p_tenant_id
      AND framework_id = p_framework_id
      AND checked_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE(checked_at)
    ORDER BY check_date ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- VIEWS
-- Useful views for monitoring dashboards
-- ============================================================================

-- View for compliance health summary
CREATE OR REPLACE VIEW compliance_health_summary AS
SELECT
    a.tenant_id,
    a.framework_id,
    f.name as framework_name,
    a.overall_score as latest_score,
    a.risk_level,
    a.completed_at as last_assessment,
    (SELECT COUNT(*) FROM compliance_alerts al
     WHERE al.tenant_id = a.tenant_id
       AND al.framework_id = a.framework_id
       AND NOT al.resolved) as active_alerts,
    (SELECT COUNT(*) FROM compliance_evidence e
     WHERE e.tenant_id = a.tenant_id
       AND e.status = 'expired') as expired_evidence,
    (SELECT COUNT(*) FROM control_findings cf
     WHERE cf.tenant_id = a.tenant_id
       AND cf.assessment_id = a.id
       AND cf.remediation_status = 'in_progress'
       AND cf.remediation_due_date < NOW()) as overdue_remediations
FROM compliance_assessments a
JOIN compliance_frameworks f ON a.framework_id = f.id
WHERE a.status = 'completed'
  AND a.completed_at = (
      SELECT MAX(a2.completed_at)
      FROM compliance_assessments a2
      WHERE a2.tenant_id = a.tenant_id
        AND a2.framework_id = a.framework_id
        AND a2.status = 'completed'
  );

-- ============================================================================
-- COMMENTS
-- Table documentation
-- ============================================================================

COMMENT ON TABLE compliance_baselines IS 'Compliance state snapshots for drift detection';
COMMENT ON TABLE compliance_monitoring_checks IS 'Scheduled monitoring check results';
COMMENT ON COLUMN compliance_baselines.control_scores IS 'JSON map of control_id to {status, score, evidenceCount}';
COMMENT ON COLUMN compliance_monitoring_checks.score_delta IS 'Change in score from previous check (positive = improvement)';
COMMENT ON VIEW compliance_health_summary IS 'Summary view of compliance health across frameworks';
