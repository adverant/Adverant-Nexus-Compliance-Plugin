-- Migration: 009_evidence_tables.sql
-- Description: Evidence collection and attestation tables
-- Author: Adverant Compliance Service
-- Date: 2025-12-31

-- ============================================================================
-- COMPLIANCE EVIDENCE
-- Evidence records linked to controls and findings
-- ============================================================================

CREATE TYPE evidence_type AS ENUM (
    'document',
    'screenshot',
    'configuration',
    'log',
    'attestation',
    'scan_result',
    'certificate',
    'interview',
    'observation',
    'api_export'
);

CREATE TYPE evidence_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'expired'
);

CREATE TABLE IF NOT EXISTS compliance_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,

    -- Related entities
    control_id VARCHAR(100) NOT NULL REFERENCES compliance_controls(id) ON DELETE CASCADE,
    finding_id UUID REFERENCES control_findings(id) ON DELETE SET NULL,
    assessment_id UUID REFERENCES compliance_assessments(id) ON DELETE SET NULL,

    -- Evidence details
    type evidence_type NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,

    -- File information (for uploaded documents)
    file_path TEXT,
    file_size BIGINT,
    mime_type VARCHAR(100),
    checksum VARCHAR(128),

    -- Source information
    source_system VARCHAR(255),
    source_url TEXT,

    -- Collection metadata
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    collected_by VARCHAR(255) NOT NULL,

    -- Validity period
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,

    -- Review status
    status evidence_status NOT NULL DEFAULT 'pending',
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,

    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for evidence queries
CREATE INDEX IF NOT EXISTS idx_evidence_tenant ON compliance_evidence(tenant_id);
CREATE INDEX IF NOT EXISTS idx_evidence_control ON compliance_evidence(control_id);
CREATE INDEX IF NOT EXISTS idx_evidence_finding ON compliance_evidence(finding_id);
CREATE INDEX IF NOT EXISTS idx_evidence_assessment ON compliance_evidence(assessment_id);
CREATE INDEX IF NOT EXISTS idx_evidence_type ON compliance_evidence(type);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON compliance_evidence(status);
CREATE INDEX IF NOT EXISTS idx_evidence_collected ON compliance_evidence(collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_expiring ON compliance_evidence(valid_until) WHERE valid_until IS NOT NULL;

-- ============================================================================
-- COMPLIANCE ATTESTATIONS
-- Manual attestation records
-- ============================================================================

CREATE TYPE attestation_type AS ENUM (
    'self',
    'manager',
    'auditor',
    'third_party'
);

CREATE TABLE IF NOT EXISTS compliance_attestations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(255) NOT NULL,

    -- Related entities
    control_id VARCHAR(100) NOT NULL REFERENCES compliance_controls(id) ON DELETE CASCADE,
    evidence_id UUID REFERENCES compliance_evidence(id) ON DELETE SET NULL,

    -- Attestation details
    attestation_type attestation_type NOT NULL,
    attested_by VARCHAR(255) NOT NULL,
    attested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Content
    statement TEXT NOT NULL,
    is_compliant BOOLEAN NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    supporting_notes TEXT,

    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for attestation queries
CREATE INDEX IF NOT EXISTS idx_attestations_tenant ON compliance_attestations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attestations_control ON compliance_attestations(control_id);
CREATE INDEX IF NOT EXISTS idx_attestations_evidence ON compliance_attestations(evidence_id);
CREATE INDEX IF NOT EXISTS idx_attestations_attested_by ON compliance_attestations(attested_by);
CREATE INDEX IF NOT EXISTS idx_attestations_valid_until ON compliance_attestations(valid_until);

-- ============================================================================
-- ROW LEVEL SECURITY
-- Tenant isolation for evidence tables
-- ============================================================================

ALTER TABLE compliance_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_attestations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_evidence ON compliance_evidence
    USING (tenant_id = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation_attestations ON compliance_attestations
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- ============================================================================
-- TRIGGERS
-- Auto-update timestamps
-- ============================================================================

CREATE TRIGGER update_compliance_evidence_updated_at
    BEFORE UPDATE ON compliance_evidence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANTS
-- Type permissions
-- ============================================================================

GRANT USAGE ON TYPE evidence_type TO PUBLIC;
GRANT USAGE ON TYPE evidence_status TO PUBLIC;
GRANT USAGE ON TYPE attestation_type TO PUBLIC;

-- ============================================================================
-- COMMENTS
-- Table documentation
-- ============================================================================

COMMENT ON TABLE compliance_evidence IS 'Evidence records supporting compliance controls';
COMMENT ON TABLE compliance_attestations IS 'Manual attestation records for compliance controls';
COMMENT ON COLUMN compliance_evidence.type IS 'Type of evidence: document, screenshot, config, log, etc.';
COMMENT ON COLUMN compliance_evidence.status IS 'Review status: pending, approved, rejected, expired';
COMMENT ON COLUMN compliance_attestations.attestation_type IS 'Who is attesting: self, manager, auditor, third_party';
