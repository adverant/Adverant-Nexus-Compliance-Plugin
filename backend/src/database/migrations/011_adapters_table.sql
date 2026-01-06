-- ============================================================================
-- Nexus Compliance Engine - Adapters Table Migration
-- Creates tables for evidence collection adapter configuration
-- ============================================================================

-- Evidence collection adapters configuration
CREATE TABLE IF NOT EXISTS compliance_adapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    adapter_type VARCHAR(50) NOT NULL CHECK (
        adapter_type IN (
            'qualys',
            'splunk',
            'aws-config',
            'vulnerability_scanner',
            'siem',
            'cloud_config',
            'code_scanner',
            'identity_provider',
            'endpoint_protection',
            'network_security',
            'container_security'
        )
    ),
    base_url TEXT NOT NULL,
    credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
    polling_interval_ms INTEGER DEFAULT 21600000, -- 6 hours default
    enabled BOOLEAN DEFAULT true,
    last_collection_at TIMESTAMPTZ,
    last_health_check_at TIMESTAMPTZ,
    health_status JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- Add comment
COMMENT ON TABLE compliance_adapters IS 'Configuration for evidence collection adapters that integrate with external security tools';
COMMENT ON COLUMN compliance_adapters.adapter_type IS 'Type of adapter: qualys, splunk, aws-config, etc.';
COMMENT ON COLUMN compliance_adapters.credentials IS 'Encrypted credentials for adapter authentication';
COMMENT ON COLUMN compliance_adapters.polling_interval_ms IS 'Interval between automatic evidence collection runs';
COMMENT ON COLUMN compliance_adapters.health_status IS 'Last health check result with latency and error details';

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_compliance_adapters_tenant ON compliance_adapters(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_adapters_type ON compliance_adapters(adapter_type);
CREATE INDEX IF NOT EXISTS idx_compliance_adapters_enabled ON compliance_adapters(tenant_id, enabled);

-- Control to evidence linkage table
CREATE TABLE IF NOT EXISTS control_evidence_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id UUID NOT NULL,
    control_id VARCHAR(50) NOT NULL,
    linked_at TIMESTAMPTZ DEFAULT NOW(),
    linked_by VARCHAR(255),
    confidence_score DECIMAL(3,2),
    link_type VARCHAR(50) DEFAULT 'automatic', -- 'automatic', 'manual', 'ai_suggested'
    notes TEXT,
    UNIQUE(evidence_id, control_id)
);

-- Add comment
COMMENT ON TABLE control_evidence_links IS 'Maps compliance evidence to controls for assessment and audit purposes';
COMMENT ON COLUMN control_evidence_links.confidence_score IS 'AI confidence that this evidence supports the control (0.0-1.0)';
COMMENT ON COLUMN control_evidence_links.link_type IS 'How the link was created: automatic (adapter), manual (user), ai_suggested';

-- Indexes for control_evidence_links
CREATE INDEX IF NOT EXISTS idx_control_evidence_links_evidence ON control_evidence_links(evidence_id);
CREATE INDEX IF NOT EXISTS idx_control_evidence_links_control ON control_evidence_links(control_id);
CREATE INDEX IF NOT EXISTS idx_control_evidence_links_type ON control_evidence_links(link_type);

-- Add external_id column to compliance_evidence for deduplication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'compliance_evidence' AND column_name = 'external_id'
    ) THEN
        ALTER TABLE compliance_evidence ADD COLUMN external_id VARCHAR(255);
    END IF;
END $$;

-- Create unique index for external_id deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_compliance_evidence_external
ON compliance_evidence(tenant_id, source_system, external_id)
WHERE external_id IS NOT NULL;

-- Add source_url column if not exists (for adapter reference)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'compliance_evidence' AND column_name = 'source_url'
    ) THEN
        ALTER TABLE compliance_evidence ADD COLUMN source_url TEXT;
    END IF;
END $$;

-- Adapter collection logs for audit trail
CREATE TABLE IF NOT EXISTS adapter_collection_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adapter_id UUID NOT NULL REFERENCES compliance_adapters(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
    evidence_collected INTEGER DEFAULT 0,
    evidence_stored INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]'::jsonb,
    duration_ms INTEGER,
    metadata JSONB
);

-- Add comment
COMMENT ON TABLE adapter_collection_logs IS 'Audit trail of evidence collection runs for each adapter';

-- Indexes for collection logs
CREATE INDEX IF NOT EXISTS idx_adapter_collection_logs_adapter ON adapter_collection_logs(adapter_id);
CREATE INDEX IF NOT EXISTS idx_adapter_collection_logs_tenant ON adapter_collection_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_adapter_collection_logs_status ON adapter_collection_logs(status);
CREATE INDEX IF NOT EXISTS idx_adapter_collection_logs_started ON adapter_collection_logs(started_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_compliance_adapters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS compliance_adapters_updated_at ON compliance_adapters;
CREATE TRIGGER compliance_adapters_updated_at
    BEFORE UPDATE ON compliance_adapters
    FOR EACH ROW
    EXECUTE FUNCTION update_compliance_adapters_updated_at();

-- Grant permissions (adjust as needed for your setup)
-- Note: In production, use specific roles instead of public
-- GRANT SELECT, INSERT, UPDATE, DELETE ON compliance_adapters TO nexus_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON control_evidence_links TO nexus_app;
-- GRANT SELECT, INSERT ON adapter_collection_logs TO nexus_app;

-- Sample adapter configurations (commented out - uncomment for testing)
/*
INSERT INTO compliance_adapters (tenant_id, name, adapter_type, base_url, credentials, enabled)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Qualys Production', 'qualys',
     'https://qualysapi.qualys.com', '{"authType": "basic", "username": "api_user"}'::jsonb, false),
    ('00000000-0000-0000-0000-000000000001', 'Splunk SIEM', 'splunk',
     'https://splunk.example.com:8089', '{"authType": "api_key"}'::jsonb, false),
    ('00000000-0000-0000-0000-000000000001', 'AWS Config - us-east-1', 'aws-config',
     'us-east-1', '{"authType": "iam_role"}'::jsonb, false)
ON CONFLICT (tenant_id, name) DO NOTHING;
*/

-- Verify migration
DO $$
BEGIN
    RAISE NOTICE 'Migration 011_adapters_table.sql completed successfully';
    RAISE NOTICE 'Created tables: compliance_adapters, control_evidence_links, adapter_collection_logs';
END $$;
