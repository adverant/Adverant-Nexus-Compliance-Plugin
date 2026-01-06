-- Migration: 017_learning_system_tables.sql
-- Description: Autonomous compliance learning system tables
-- Features: Regulatory monitoring, framework discovery, entity profiles, control generation
-- Author: Nexus Compliance Engine
-- Date: 2025-01-06

-- ============================================================================
-- REGULATORY SOURCE MONITORING
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_regulatory_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- official_journal, regulator_website, standards_body, rss, api

    -- Source Details
    url TEXT NOT NULL,
    jurisdiction VARCHAR(50), -- EU, US, UK, DE, FR, etc.
    category VARCHAR(100), -- privacy, cybersecurity, ai, financial, healthcare

    -- Related Frameworks
    related_frameworks JSONB DEFAULT '[]'::jsonb, -- Framework IDs this source relates to

    -- Monitoring Configuration
    check_frequency VARCHAR(50) DEFAULT 'daily', -- hourly, daily, weekly
    content_selectors JSONB DEFAULT '{}'::jsonb, -- CSS selectors or API paths for content extraction
    change_detection_method VARCHAR(50) DEFAULT 'hash', -- hash, text_diff, structured

    -- Status Tracking
    last_checked_at TIMESTAMPTZ,
    last_change_detected_at TIMESTAMPTZ,
    last_content_hash VARCHAR(64),
    consecutive_failures INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'active', -- active, paused, error, retired

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reg_source_active ON compliance_regulatory_sources(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_reg_source_jurisdiction ON compliance_regulatory_sources(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_reg_source_check ON compliance_regulatory_sources(check_frequency, last_checked_at);

-- ============================================================================
-- REGULATORY UPDATES (Detected Changes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_regulatory_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES compliance_regulatory_sources(id) ON DELETE CASCADE,
    framework_id VARCHAR(100) REFERENCES compliance_frameworks(id) ON DELETE SET NULL,

    -- Update Details
    update_type VARCHAR(50) NOT NULL, -- new_framework, amendment, guidance, enforcement, deadline, repeal
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    original_url TEXT,

    -- Dates
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    effective_date DATE,
    publication_date DATE,

    -- Impact Assessment
    impact_level VARCHAR(20) DEFAULT 'unknown', -- critical, high, medium, low, informational
    affected_sectors JSONB DEFAULT '[]'::jsonb,
    affected_entity_types JSONB DEFAULT '[]'::jsonb,

    -- AI Analysis
    ai_analysis JSONB DEFAULT '{}'::jsonb, -- MageAgent analysis of the update
    ai_summary TEXT,
    ai_recommended_actions JSONB DEFAULT '[]'::jsonb,

    -- Generated Controls
    generated_controls JSONB DEFAULT '[]'::jsonb, -- Controls generated from this update
    controls_implemented BOOLEAN DEFAULT false,

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, analyzed, implementing, implemented, rejected, archived

    -- Review
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,

    -- Notifications
    notifications_sent JSONB DEFAULT '[]'::jsonb, -- Tenant IDs notified

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reg_update_source ON compliance_regulatory_updates(source_id);
CREATE INDEX IF NOT EXISTS idx_reg_update_framework ON compliance_regulatory_updates(framework_id);
CREATE INDEX IF NOT EXISTS idx_reg_update_status ON compliance_regulatory_updates(status);
CREATE INDEX IF NOT EXISTS idx_reg_update_type ON compliance_regulatory_updates(update_type);
CREATE INDEX IF NOT EXISTS idx_reg_update_detected ON compliance_regulatory_updates(detected_at);

-- ============================================================================
-- DISCOVERED FRAMEWORKS (Not Yet Implemented)
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_discovered_frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    jurisdiction VARCHAR(50),
    category VARCHAR(100),

    -- Source Information
    official_url TEXT,
    discovery_source VARCHAR(255), -- How it was discovered
    discovered_at TIMESTAMPTZ DEFAULT NOW(),

    -- Relevance Assessment
    relevance_score DECIMAL(3,2), -- 0-1, how relevant to typical entities
    relevance_factors JSONB DEFAULT '{}'::jsonb, -- Why it's relevant

    -- AI Analysis
    ai_summary TEXT,
    estimated_controls INTEGER,
    estimated_effort VARCHAR(50), -- low, medium, high, very_high
    related_existing_frameworks JSONB DEFAULT '[]'::jsonb, -- Similar frameworks already implemented

    -- Processing Status
    status VARCHAR(50) DEFAULT 'discovered', -- discovered, analyzing, generating, active, rejected, deferred

    -- Implementation
    generated_framework_id VARCHAR(100), -- Links to compliance_frameworks when implemented
    implementation_notes TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discovered_status ON compliance_discovered_frameworks(status);
CREATE INDEX IF NOT EXISTS idx_discovered_jurisdiction ON compliance_discovered_frameworks(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_discovered_relevance ON compliance_discovered_frameworks(relevance_score DESC);

-- ============================================================================
-- ENTITY COMPLIANCE PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_entity_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL UNIQUE,

    -- Entity Information
    entity_name VARCHAR(255),
    entity_type VARCHAR(50), -- company, organization, government, nonprofit

    -- Industry Classification
    industry VARCHAR(100),
    sub_industry VARCHAR(100),
    naics_code VARCHAR(10),
    sic_code VARCHAR(10),

    -- Geographic Presence
    primary_jurisdiction VARCHAR(50),
    operating_jurisdictions JSONB DEFAULT '[]'::jsonb, -- All jurisdictions
    headquarters_country VARCHAR(50),

    -- Size and Scale
    entity_size VARCHAR(50), -- micro, small, medium, large, enterprise
    employee_count_range VARCHAR(50), -- 1-10, 11-50, 51-250, 251-1000, 1000+
    annual_revenue_range VARCHAR(50),

    -- Regulatory Status
    is_publicly_traded BOOLEAN DEFAULT false,
    stock_exchange VARCHAR(50),
    is_regulated_entity BOOLEAN DEFAULT false,
    regulatory_licenses JSONB DEFAULT '[]'::jsonb,

    -- Data Processing
    processes_personal_data BOOLEAN DEFAULT false,
    processes_sensitive_data BOOLEAN DEFAULT false,
    data_categories JSONB DEFAULT '[]'::jsonb, -- Types of data processed
    data_subject_types JSONB DEFAULT '[]'::jsonb, -- employees, customers, patients, etc.
    cross_border_transfers BOOLEAN DEFAULT false,

    -- AI Usage
    uses_ai_systems BOOLEAN DEFAULT false,
    ai_system_count INTEGER DEFAULT 0,
    has_high_risk_ai BOOLEAN DEFAULT false,

    -- Infrastructure
    is_critical_infrastructure BOOLEAN DEFAULT false,
    critical_infrastructure_sectors JSONB DEFAULT '[]'::jsonb,
    provides_essential_services BOOLEAN DEFAULT false,

    -- Determined Applicable Frameworks
    applicable_frameworks JSONB DEFAULT '[]'::jsonb, -- Framework IDs determined to apply
    framework_applicability_rationale JSONB DEFAULT '{}'::jsonb, -- framework_id -> why it applies

    -- Last Analysis
    last_profile_update TIMESTAMPTZ,
    last_framework_scan TIMESTAMPTZ,
    last_auto_assessment TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entity_profile_tenant ON compliance_entity_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_entity_profile_industry ON compliance_entity_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_entity_profile_jurisdiction ON compliance_entity_profiles(primary_jurisdiction);

-- ============================================================================
-- GENERATED CONTROLS (From Regulatory Updates or New Frameworks)
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_generated_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Source
    source_type VARCHAR(50) NOT NULL, -- regulatory_update, discovered_framework, manual
    source_id UUID, -- References regulatory_updates or discovered_frameworks
    source_url TEXT,

    -- Control Definition (mirrors compliance_controls structure)
    control_number VARCHAR(100),
    domain VARCHAR(100),
    subdomain VARCHAR(100),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    objective TEXT,
    implementation_guidance TEXT,
    risk_category VARCHAR(50) DEFAULT 'medium',
    implementation_priority INTEGER DEFAULT 50,
    ai_assessment_prompt TEXT,

    -- Target Framework
    target_framework_id VARCHAR(100), -- Where this control should be added
    target_framework_name VARCHAR(255), -- If framework doesn't exist yet

    -- Validation
    status VARCHAR(50) DEFAULT 'draft', -- draft, reviewing, approved, rejected, implemented
    validation_score DECIMAL(3,2), -- AI confidence in the control
    validation_notes TEXT,

    -- Human Review
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMPTZ,
    review_feedback TEXT,

    -- Implementation
    implemented_control_id VARCHAR(100), -- ID in compliance_controls after implementation
    implemented_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gen_control_source ON compliance_generated_controls(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_gen_control_status ON compliance_generated_controls(status);
CREATE INDEX IF NOT EXISTS idx_gen_control_framework ON compliance_generated_controls(target_framework_id);

-- ============================================================================
-- AUTO-ASSESSMENT SCHEDULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_auto_assessment_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    framework_id VARCHAR(100) REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
    ai_system_id UUID REFERENCES ai_system_registry(id) ON DELETE CASCADE,

    -- Schedule Configuration
    schedule_type VARCHAR(50) NOT NULL, -- one_time, recurring, on_change
    cron_expression VARCHAR(100), -- For recurring
    trigger_on_update BOOLEAN DEFAULT false, -- Trigger when framework updates

    -- Scope
    assessment_scope VARCHAR(50) DEFAULT 'full', -- full, incremental, targeted
    targeted_domains JSONB DEFAULT '[]'::jsonb, -- If targeted

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    last_run_status VARCHAR(50), -- success, partial, failed
    last_run_assessment_id UUID,

    -- Configuration
    auto_create_findings BOOLEAN DEFAULT true,
    notify_on_completion BOOLEAN DEFAULT true,
    notify_on_critical_findings BOOLEAN DEFAULT true,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_auto_schedule_tenant ON compliance_auto_assessment_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_auto_schedule_active ON compliance_auto_assessment_schedules(is_active, next_run_at) WHERE is_active = true;

-- ============================================================================
-- LEARNING FEEDBACK (Improve AI Over Time)
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_learning_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,

    -- What was assessed
    control_id VARCHAR(100),
    framework_id VARCHAR(100),
    assessment_id UUID,

    -- Feedback Type
    feedback_type VARCHAR(50) NOT NULL, -- rating_correction, prompt_improvement, false_positive, missing_finding

    -- Original Assessment
    original_rating VARCHAR(20),
    original_confidence DECIMAL(3,2),
    original_reasoning TEXT,

    -- Corrected Assessment
    corrected_rating VARCHAR(20),
    correction_reasoning TEXT,

    -- Learning Application
    applied_to_prompt BOOLEAN DEFAULT false,
    applied_at TIMESTAMPTZ,
    improvement_notes TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_learning_control ON compliance_learning_feedback(control_id);
CREATE INDEX IF NOT EXISTS idx_learning_framework ON compliance_learning_feedback(framework_id);
CREATE INDEX IF NOT EXISTS idx_learning_type ON compliance_learning_feedback(feedback_type);

-- ============================================================================
-- SEED REGULATORY SOURCES
-- ============================================================================

INSERT INTO compliance_regulatory_sources (name, source_type, url, jurisdiction, category, related_frameworks, check_frequency)
VALUES
-- EU Sources
('EUR-Lex', 'official_journal', 'https://eur-lex.europa.eu/homepage.html', 'EU', 'all', '["gdpr", "eu-ai-act", "nis2"]'::jsonb, 'daily'),
('EDPB Guidelines', 'regulator_website', 'https://edpb.europa.eu/our-work-tools/our-documents/guidelines_en', 'EU', 'privacy', '["gdpr"]'::jsonb, 'daily'),
('ENISA Publications', 'regulator_website', 'https://www.enisa.europa.eu/publications', 'EU', 'cybersecurity', '["nis2"]'::jsonb, 'daily'),
('EU AI Office', 'regulator_website', 'https://digital-strategy.ec.europa.eu/en/policies/european-approach-artificial-intelligence', 'EU', 'ai', '["eu-ai-act"]'::jsonb, 'daily'),

-- Standards Bodies
('ISO Standards', 'standards_body', 'https://www.iso.org/standards.html', 'INTL', 'standards', '["iso27001", "iso27701"]'::jsonb, 'weekly'),
('AICPA SOC', 'standards_body', 'https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2', 'US', 'audit', '["soc2"]'::jsonb, 'weekly'),

-- National DPAs (Sample)
('ICO UK', 'regulator_website', 'https://ico.org.uk/for-organisations/guidance-index/', 'UK', 'privacy', '["gdpr"]'::jsonb, 'daily'),
('CNIL France', 'regulator_website', 'https://www.cnil.fr/en/all-topics', 'FR', 'privacy', '["gdpr"]'::jsonb, 'daily'),
('BfDI Germany', 'regulator_website', 'https://www.bfdi.bund.de/EN/Home/home_node.html', 'DE', 'privacy', '["gdpr"]'::jsonb, 'daily')

ON CONFLICT DO NOTHING;

-- ============================================================================
-- FUNCTIONS FOR LEARNING SYSTEM
-- ============================================================================

-- Function to determine applicable frameworks for an entity
CREATE OR REPLACE FUNCTION determine_applicable_frameworks(p_tenant_id VARCHAR)
RETURNS JSONB AS $$
DECLARE
    v_profile compliance_entity_profiles%ROWTYPE;
    v_applicable JSONB := '[]'::jsonb;
BEGIN
    SELECT * INTO v_profile FROM compliance_entity_profiles WHERE tenant_id = p_tenant_id;

    IF NOT FOUND THEN
        RETURN v_applicable;
    END IF;

    -- GDPR applies if processing EU personal data
    IF v_profile.processes_personal_data AND
       (v_profile.primary_jurisdiction = 'EU' OR
        v_profile.operating_jurisdictions ? 'EU' OR
        v_profile.cross_border_transfers) THEN
        v_applicable := v_applicable || '["gdpr"]'::jsonb;
    END IF;

    -- EU AI Act applies if using AI in EU
    IF v_profile.uses_ai_systems AND
       (v_profile.primary_jurisdiction = 'EU' OR v_profile.operating_jurisdictions ? 'EU') THEN
        v_applicable := v_applicable || '["eu-ai-act"]'::jsonb;
    END IF;

    -- NIS2 applies if essential/important entity in EU
    IF (v_profile.is_critical_infrastructure OR v_profile.provides_essential_services) AND
       (v_profile.primary_jurisdiction = 'EU' OR v_profile.operating_jurisdictions ? 'EU') AND
       v_profile.entity_size IN ('medium', 'large', 'enterprise') THEN
        v_applicable := v_applicable || '["nis2"]'::jsonb;
    END IF;

    -- ISO 27001 - recommended for any organization
    IF v_profile.entity_size IN ('medium', 'large', 'enterprise') THEN
        v_applicable := v_applicable || '["iso27001"]'::jsonb;
    END IF;

    -- ISO 27701 - if GDPR applies
    IF v_applicable ? 'gdpr' THEN
        v_applicable := v_applicable || '["iso27701"]'::jsonb;
    END IF;

    -- SOC 2 - if B2B with US presence
    IF v_profile.operating_jurisdictions ? 'US' AND
       v_profile.entity_size IN ('small', 'medium', 'large', 'enterprise') THEN
        v_applicable := v_applicable || '["soc2"]'::jsonb;
    END IF;

    RETURN v_applicable;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR LEARNING SYSTEM
-- ============================================================================

CREATE OR REPLACE VIEW v_pending_regulatory_updates AS
SELECT
    ru.*,
    rs.name as source_name,
    cf.name as framework_name
FROM compliance_regulatory_updates ru
JOIN compliance_regulatory_sources rs ON ru.source_id = rs.id
LEFT JOIN compliance_frameworks cf ON ru.framework_id = cf.id
WHERE ru.status IN ('pending', 'analyzed')
ORDER BY ru.impact_level DESC, ru.detected_at DESC;

CREATE OR REPLACE VIEW v_entity_compliance_status AS
SELECT
    ep.tenant_id,
    ep.entity_name,
    ep.industry,
    ep.primary_jurisdiction,
    jsonb_array_length(ep.applicable_frameworks) as applicable_framework_count,
    (SELECT COUNT(*) FROM compliance_assessments ca
     WHERE ca.tenant_id = ep.tenant_id AND ca.status = 'completed') as completed_assessments,
    ep.last_auto_assessment,
    ep.updated_at as profile_updated
FROM compliance_entity_profiles ep;

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Learning system tables created successfully';
  RAISE NOTICE 'Tables: compliance_regulatory_sources, compliance_regulatory_updates, compliance_discovered_frameworks, compliance_entity_profiles, compliance_generated_controls, compliance_auto_assessment_schedules, compliance_learning_feedback';
  RAISE NOTICE 'Initial regulatory sources seeded';
END $$;
