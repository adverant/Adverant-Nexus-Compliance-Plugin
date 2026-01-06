-- Migration: 016_cross_analysis_tables.sql
-- Description: Cross-framework analysis and Z-Inspection control linking tables
-- Enables: Cross-framework control mapping, Z-Inspection → Control linking, visualization data
-- Author: Nexus Compliance Engine
-- Date: 2025-01-06

-- ============================================================================
-- CONTROL CROSS-REFERENCES (Framework-to-Framework Mapping)
-- ============================================================================

CREATE TABLE IF NOT EXISTS control_cross_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_control_id VARCHAR(100) NOT NULL REFERENCES compliance_controls(id) ON DELETE CASCADE,
    target_control_id VARCHAR(100) NOT NULL REFERENCES compliance_controls(id) ON DELETE CASCADE,

    -- Relationship
    relationship_type VARCHAR(50) NOT NULL, -- equivalent, partial, related, supersedes, superseded_by
    mapping_confidence DECIMAL(3,2) DEFAULT 0.8, -- 0.00 to 1.00

    -- Details
    mapping_rationale TEXT,
    coverage_notes TEXT,

    -- Provenance
    mapped_by VARCHAR(50) DEFAULT 'system', -- system, manual, ai
    verified BOOLEAN DEFAULT false,
    verified_by VARCHAR(255),
    verified_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(source_control_id, target_control_id)
);

CREATE INDEX IF NOT EXISTS idx_cross_ref_source ON control_cross_references(source_control_id);
CREATE INDEX IF NOT EXISTS idx_cross_ref_target ON control_cross_references(target_control_id);
CREATE INDEX IF NOT EXISTS idx_cross_ref_type ON control_cross_references(relationship_type);

-- ============================================================================
-- Z-INSPECTION CONTROL LINKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS z_inspection_control_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    z_inspection_finding_id UUID REFERENCES qualitative_findings(id) ON DELETE CASCADE,
    control_id VARCHAR(100) REFERENCES compliance_controls(id) ON DELETE CASCADE,
    framework_id VARCHAR(100) REFERENCES compliance_frameworks(id) ON DELETE CASCADE,

    -- Link Type
    link_type VARCHAR(50) NOT NULL, -- direct, indirect, recommended, monitoring

    -- Weight Adjustment
    weight_adjustment DECIMAL(3,2) DEFAULT 1.00, -- Multiplier for control priority

    -- Rationale
    rationale TEXT,
    source VARCHAR(50) DEFAULT 'z_inspection', -- z_inspection, qualitative_finding, tension

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255),

    UNIQUE(z_inspection_finding_id, control_id)
);

CREATE INDEX IF NOT EXISTS idx_z_link_finding ON z_inspection_control_links(z_inspection_finding_id);
CREATE INDEX IF NOT EXISTS idx_z_link_control ON z_inspection_control_links(control_id);
CREATE INDEX IF NOT EXISTS idx_z_link_framework ON z_inspection_control_links(framework_id);

-- ============================================================================
-- FRAMEWORK OVERLAP ANALYSIS (Cached)
-- ============================================================================

CREATE TABLE IF NOT EXISTS framework_overlap_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_a_id VARCHAR(100) NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
    framework_b_id VARCHAR(100) NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,

    -- Overlap Statistics
    total_controls_a INTEGER NOT NULL,
    total_controls_b INTEGER NOT NULL,
    equivalent_controls INTEGER DEFAULT 0,
    partial_overlap_controls INTEGER DEFAULT 0,
    related_controls INTEGER DEFAULT 0,

    -- Overlap Percentage
    overlap_percentage_a DECIMAL(5,2), -- Percentage of A covered by B
    overlap_percentage_b DECIMAL(5,2), -- Percentage of B covered by A

    -- Detailed Mapping
    control_mapping JSONB DEFAULT '[]'::jsonb, -- Array of {source, target, relationship}

    -- Cache Management
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    is_valid BOOLEAN DEFAULT true,

    UNIQUE(framework_a_id, framework_b_id)
);

CREATE INDEX IF NOT EXISTS idx_overlap_framework_a ON framework_overlap_cache(framework_a_id);
CREATE INDEX IF NOT EXISTS idx_overlap_framework_b ON framework_overlap_cache(framework_b_id);
CREATE INDEX IF NOT EXISTS idx_overlap_valid ON framework_overlap_cache(is_valid) WHERE is_valid = true;

-- ============================================================================
-- REQUIREMENT-FRAMEWORK COVERAGE (7 EU Trustworthy AI Requirements)
-- ============================================================================

CREATE TABLE IF NOT EXISTS requirement_framework_coverage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id VARCHAR(100) NOT NULL REFERENCES trustworthy_ai_requirements(id) ON DELETE CASCADE,
    framework_id VARCHAR(100) NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,

    -- Coverage Statistics
    total_mapped_controls INTEGER DEFAULT 0,
    strong_mappings INTEGER DEFAULT 0,
    moderate_mappings INTEGER DEFAULT 0,
    weak_mappings INTEGER DEFAULT 0,

    -- Coverage Assessment
    coverage_level VARCHAR(20), -- comprehensive, substantial, partial, minimal, none
    coverage_gaps JSONB DEFAULT '[]'::jsonb, -- Areas not covered

    -- Key Controls
    primary_controls JSONB DEFAULT '[]'::jsonb, -- Most important control IDs

    -- Cache Management
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    is_valid BOOLEAN DEFAULT true,

    UNIQUE(requirement_id, framework_id)
);

CREATE INDEX IF NOT EXISTS idx_req_coverage_requirement ON requirement_framework_coverage(requirement_id);
CREATE INDEX IF NOT EXISTS idx_req_coverage_framework ON requirement_framework_coverage(framework_id);

-- ============================================================================
-- VISUALIZATION DATA CACHE
-- ============================================================================

CREATE TABLE IF NOT EXISTS visualization_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    ai_system_id UUID,

    -- Visualization Type
    visualization_type VARCHAR(50) NOT NULL, -- sankey, heatmap, network, radar, matrix

    -- Scope
    scope VARCHAR(50) NOT NULL, -- all_frameworks, single_framework, cross_framework, requirement_coverage

    -- Parameters
    parameters JSONB DEFAULT '{}'::jsonb, -- Framework IDs, requirement IDs, etc.

    -- Cached Data
    chart_data JSONB NOT NULL, -- Data formatted for visualization library

    -- Cache Management
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
    is_valid BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_viz_cache_tenant ON visualization_cache(tenant_id);
CREATE INDEX IF NOT EXISTS idx_viz_cache_type ON visualization_cache(visualization_type);
CREATE INDEX IF NOT EXISTS idx_viz_cache_valid ON visualization_cache(is_valid, expires_at) WHERE is_valid = true;

-- ============================================================================
-- CROSS-ANALYSIS QUERIES (Saved)
-- ============================================================================

CREATE TABLE IF NOT EXISTS saved_analysis_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Query Definition
    query_type VARCHAR(50) NOT NULL, -- cross_framework, requirement_gap, z_inspection_mapping, control_coverage
    query_parameters JSONB NOT NULL,

    -- Scheduling
    is_scheduled BOOLEAN DEFAULT false,
    schedule_cron VARCHAR(100), -- Cron expression for scheduled runs
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,

    -- Results
    last_result JSONB,
    last_result_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_saved_query_tenant ON saved_analysis_queries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_saved_query_scheduled ON saved_analysis_queries(is_scheduled, next_run_at) WHERE is_scheduled = true;

-- ============================================================================
-- SEED INITIAL CROSS-FRAMEWORK MAPPINGS
-- ============================================================================

-- ISO 27001 ↔ SOC 2 Mappings (Common security controls)
INSERT INTO control_cross_references (source_control_id, target_control_id, relationship_type, mapping_confidence, mapping_rationale, mapped_by)
VALUES
-- Access Control
('ISO27001-A.5.15', 'SOC2-CC6.1', 'equivalent', 0.85, 'Both address access control policies and procedures', 'system'),
('ISO27001-A.5.16', 'SOC2-CC6.2', 'equivalent', 0.85, 'Both address identity management', 'system'),
('ISO27001-A.5.17', 'SOC2-CC6.3', 'equivalent', 0.80, 'Both address authentication information', 'system'),

-- Change Management
('ISO27001-A.8.32', 'SOC2-CC8.1', 'equivalent', 0.90, 'Both address change management controls', 'system'),

-- Incident Management
('ISO27001-A.5.24', 'SOC2-CC7.4', 'equivalent', 0.85, 'Both address incident response planning', 'system'),
('ISO27001-A.5.25', 'SOC2-CC7.5', 'equivalent', 0.85, 'Both address incident assessment', 'system'),

-- Business Continuity
('ISO27001-A.5.29', 'SOC2-A1.2', 'equivalent', 0.80, 'Both address business continuity planning', 'system'),
('ISO27001-A.5.30', 'SOC2-A1.3', 'equivalent', 0.80, 'Both address backup and recovery', 'system')

ON CONFLICT (source_control_id, target_control_id) DO UPDATE SET
  relationship_type = EXCLUDED.relationship_type,
  mapping_confidence = EXCLUDED.mapping_confidence,
  mapping_rationale = EXCLUDED.mapping_rationale;

-- ISO 27001 ↔ ISO 27701 Mappings (Privacy extension)
INSERT INTO control_cross_references (source_control_id, target_control_id, relationship_type, mapping_confidence, mapping_rationale, mapped_by)
VALUES
('ISO27001-A.5.34', 'ISO27701-A.7.2.1', 'related', 0.75, 'Information security policies extended to privacy', 'system'),
('ISO27001-A.5.10', 'ISO27701-A.7.4.1', 'related', 0.70, 'Acceptable use extended to PII processing', 'system'),
('ISO27001-A.5.31', 'ISO27701-A.7.2.6', 'related', 0.75, 'Legal requirements extended to privacy regulations', 'system')

ON CONFLICT (source_control_id, target_control_id) DO UPDATE SET
  relationship_type = EXCLUDED.relationship_type,
  mapping_confidence = EXCLUDED.mapping_confidence,
  mapping_rationale = EXCLUDED.mapping_rationale;

-- GDPR ↔ ISO 27701 Mappings
INSERT INTO control_cross_references (source_control_id, target_control_id, relationship_type, mapping_confidence, mapping_rationale, mapped_by)
VALUES
('GDPR-ART5-1a', 'ISO27701-A.7.2.2', 'partial', 0.80, 'Lawfulness principle mapped to lawful basis identification', 'system'),
('GDPR-ART5-1b', 'ISO27701-A.7.2.1', 'partial', 0.75, 'Purpose limitation mapped to purpose determination', 'system'),
('GDPR-ART5-1c', 'ISO27701-A.7.4.1', 'partial', 0.75, 'Data minimization mapped to collection limitation', 'system'),
('GDPR-ART32-1', 'ISO27701-B.8.2.1', 'equivalent', 0.85, 'Security of processing mapped to security controls', 'system')

ON CONFLICT (source_control_id, target_control_id) DO UPDATE SET
  relationship_type = EXCLUDED.relationship_type,
  mapping_confidence = EXCLUDED.mapping_confidence,
  mapping_rationale = EXCLUDED.mapping_rationale;

-- EU AI Act ↔ GDPR Mappings
INSERT INTO control_cross_references (source_control_id, target_control_id, relationship_type, mapping_confidence, mapping_rationale, mapped_by)
VALUES
('AIACT-10.1', 'GDPR-ART5-1d', 'related', 0.70, 'AI data governance relates to GDPR accuracy principle', 'system'),
('AIACT-10.5', 'GDPR-ART9-1', 'related', 0.75, 'Special category data processing in AI relates to GDPR Article 9', 'system'),
('AIACT-26.4', 'GDPR-ART35-1', 'equivalent', 0.85, 'AI Act DPIA requirement aligns with GDPR DPIA', 'system'),
('AIACT-13.1', 'GDPR-ART13-1', 'related', 0.70, 'AI transparency relates to GDPR transparency requirements', 'system')

ON CONFLICT (source_control_id, target_control_id) DO UPDATE SET
  relationship_type = EXCLUDED.relationship_type,
  mapping_confidence = EXCLUDED.mapping_confidence,
  mapping_rationale = EXCLUDED.mapping_rationale;

-- NIS2 ↔ ISO 27001 Mappings
INSERT INTO control_cross_references (source_control_id, target_control_id, relationship_type, mapping_confidence, mapping_rationale, mapped_by)
VALUES
('NIS2-21.2.a-1', 'ISO27001-A.5.1', 'equivalent', 0.85, 'Risk assessment requirements align', 'system'),
('NIS2-21.2.a-2', 'ISO27001-A.5.1', 'equivalent', 0.90, 'Security policy requirements align', 'system'),
('NIS2-21.2.b-1', 'ISO27001-A.5.24', 'equivalent', 0.85, 'Incident detection aligns', 'system'),
('NIS2-21.2.b-2', 'ISO27001-A.5.26', 'equivalent', 0.85, 'Incident response aligns', 'system'),
('NIS2-21.2.c-1', 'ISO27001-A.5.29', 'equivalent', 0.85, 'Business continuity aligns', 'system'),
('NIS2-21.2.c-2', 'ISO27001-A.5.30', 'equivalent', 0.90, 'Backup requirements align', 'system'),
('NIS2-21.2.d-1', 'ISO27001-A.5.19', 'equivalent', 0.85, 'Supply chain security aligns', 'system'),
('NIS2-21.2.e-3', 'ISO27001-A.8.8', 'equivalent', 0.85, 'Patch management aligns', 'system'),
('NIS2-21.2.h-1', 'ISO27001-A.8.24', 'equivalent', 0.85, 'Encryption requirements align', 'system'),
('NIS2-21.2.i-1', 'ISO27001-A.5.15', 'equivalent', 0.85, 'Access control policies align', 'system'),
('NIS2-21.2.j-1', 'ISO27001-A.8.5', 'equivalent', 0.85, 'MFA requirements align', 'system')

ON CONFLICT (source_control_id, target_control_id) DO UPDATE SET
  relationship_type = EXCLUDED.relationship_type,
  mapping_confidence = EXCLUDED.mapping_confidence,
  mapping_rationale = EXCLUDED.mapping_rationale;

-- ============================================================================
-- VIEWS FOR CROSS-ANALYSIS
-- ============================================================================

CREATE OR REPLACE VIEW v_framework_control_summary AS
SELECT
    f.id as framework_id,
    f.name as framework_name,
    f.category,
    f.jurisdiction,
    COUNT(DISTINCT c.id) as total_controls,
    COUNT(DISTINCT c.domain) as unique_domains,
    COUNT(DISTINCT ccr.target_control_id) as cross_referenced_controls,
    COUNT(DISTINCT rcm.requirement_id) as mapped_requirements
FROM compliance_frameworks f
LEFT JOIN compliance_controls c ON f.id = c.framework_id
LEFT JOIN control_cross_references ccr ON c.id = ccr.source_control_id
LEFT JOIN requirement_control_mappings rcm ON c.id = rcm.control_id
GROUP BY f.id, f.name, f.category, f.jurisdiction;

CREATE OR REPLACE VIEW v_requirement_control_coverage AS
SELECT
    tar.id as requirement_id,
    tar.name as requirement_name,
    tar.short_name,
    cf.id as framework_id,
    cf.name as framework_name,
    COUNT(rcm.control_id) as mapped_controls,
    COUNT(CASE WHEN rcm.mapping_strength = 'strong' THEN 1 END) as strong_mappings,
    COUNT(CASE WHEN rcm.mapping_strength = 'moderate' THEN 1 END) as moderate_mappings,
    COUNT(CASE WHEN rcm.mapping_strength = 'weak' THEN 1 END) as weak_mappings
FROM trustworthy_ai_requirements tar
CROSS JOIN compliance_frameworks cf
LEFT JOIN requirement_control_mappings rcm ON tar.id = rcm.requirement_id AND cf.id = rcm.framework_id
GROUP BY tar.id, tar.name, tar.short_name, cf.id, cf.name
ORDER BY tar.display_order, cf.name;

CREATE OR REPLACE VIEW v_cross_framework_matrix AS
SELECT
    cc1.framework_id as source_framework,
    cf1.name as source_framework_name,
    cc2.framework_id as target_framework,
    cf2.name as target_framework_name,
    COUNT(ccr.id) as connection_count,
    AVG(ccr.mapping_confidence) as avg_confidence,
    COUNT(CASE WHEN ccr.relationship_type = 'equivalent' THEN 1 END) as equivalent_count,
    COUNT(CASE WHEN ccr.relationship_type = 'partial' THEN 1 END) as partial_count,
    COUNT(CASE WHEN ccr.relationship_type = 'related' THEN 1 END) as related_count
FROM control_cross_references ccr
JOIN compliance_controls cc1 ON ccr.source_control_id = cc1.id
JOIN compliance_controls cc2 ON ccr.target_control_id = cc2.id
JOIN compliance_frameworks cf1 ON cc1.framework_id = cf1.id
JOIN compliance_frameworks cf2 ON cc2.framework_id = cf2.id
GROUP BY cc1.framework_id, cf1.name, cc2.framework_id, cf2.name;

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Cross-analysis tables created successfully';
  RAISE NOTICE 'Tables: control_cross_references, z_inspection_control_links, framework_overlap_cache, requirement_framework_coverage, visualization_cache, saved_analysis_queries';
  RAISE NOTICE 'Initial cross-framework mappings seeded';
END $$;
