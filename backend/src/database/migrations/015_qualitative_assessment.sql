-- Migration: 015_qualitative_assessment.sql
-- Description: Z-Inspection aligned qualitative assessment tables
-- Features: 7 EU Trustworthy AI Requirements, stakeholders, scenarios, tensions, qualitative assessments
-- Author: Nexus Compliance Engine
-- Date: 2025-01-06

-- ============================================================================
-- 7 EU TRUSTWORTHY AI REQUIREMENTS REFERENCE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS trustworthy_ai_requirements (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    assessment_guidance TEXT NOT NULL,
    key_considerations JSONB DEFAULT '[]'::jsonb,
    related_controls JSONB DEFAULT '[]'::jsonb, -- Links to control IDs
    display_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the 7 requirements
INSERT INTO trustworthy_ai_requirements (id, name, short_name, description, assessment_guidance, key_considerations, display_order)
VALUES
('human_agency_oversight',
 'Human Agency and Oversight',
 'Human Oversight',
 'AI systems should support human autonomy and decision-making. This includes the right not to be subject to a decision based solely on automated processing when this produces legal effects on users or similarly significantly affects them.',
 'Assess whether humans maintain meaningful control over the AI system. Evaluate if users can understand, intervene, and override AI decisions. Check for mechanisms preventing over-reliance on AI.',
 '["Human-in-the-loop mechanisms", "Override capabilities", "User autonomy preservation", "Meaningful human control", "Prevention of automation bias"]'::jsonb,
 1),

('technical_robustness_safety',
 'Technical Robustness and Safety',
 'Robustness & Safety',
 'AI systems should be developed with a preventative approach to risks and in a way that reliably behaves as intended while minimizing unintentional and unexpected harm.',
 'Evaluate system reliability, security, and resilience. Assess error handling, fail-safe mechanisms, and protection against adversarial attacks. Check for comprehensive testing.',
 '["Reliability and reproducibility", "Fail-safe mechanisms", "Adversarial robustness", "Security measures", "Accuracy and precision"]'::jsonb,
 2),

('privacy_data_governance',
 'Privacy and Data Governance',
 'Privacy & Data',
 'Privacy and data protection must be guaranteed throughout the system''s entire lifecycle. This includes data quality, integrity, and legitimate access.',
 'Assess data collection, storage, and processing practices. Evaluate privacy by design, data minimization, and user consent mechanisms. Check data quality controls.',
 '["Privacy by design", "Data minimization", "Consent management", "Data quality assurance", "Access controls and encryption"]'::jsonb,
 3),

('transparency',
 'Transparency',
 'Transparency',
 'The data, system, and AI business models should be transparent. Traceability mechanisms can help achieving this. AI systems should be identifiable as such.',
 'Evaluate explainability of AI decisions. Assess traceability of data and processes. Check for clear communication about AI use and limitations.',
 '["Explainability of decisions", "Traceability of processes", "AI system identification", "Communication of limitations", "Documentation completeness"]'::jsonb,
 4),

('diversity_fairness_nondiscrimination',
 'Diversity, Non-discrimination and Fairness',
 'Fairness & Diversity',
 'Unfair bias must be avoided as it could have multiple negative implications. AI systems should be accessible to all regardless of disability.',
 'Assess for bias in data, algorithms, and outputs. Evaluate fairness across demographic groups. Check accessibility features and inclusive design.',
 '["Bias detection and mitigation", "Fairness metrics", "Demographic parity", "Accessibility compliance", "Inclusive design"]'::jsonb,
 5),

('societal_environmental_wellbeing',
 'Societal and Environmental Well-being',
 'Societal Wellbeing',
 'AI systems should benefit all human beings, including future generations. Their environmental impact should be considered.',
 'Evaluate broader societal impact of the AI system. Assess environmental footprint and sustainability. Consider effects on social relationships and democracy.',
 '["Social impact assessment", "Environmental sustainability", "Democratic values", "Future generations", "Resource efficiency"]'::jsonb,
 6),

('accountability',
 'Accountability',
 'Accountability',
 'Mechanisms should be put in place to ensure responsibility and accountability for AI systems and their outcomes.',
 'Evaluate audit mechanisms and documentation. Assess responsibility assignment and grievance procedures. Check for appropriate governance structures.',
 '["Auditability", "Responsibility assignment", "Grievance mechanisms", "Governance structures", "Incident response"]'::jsonb,
 7)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  assessment_guidance = EXCLUDED.assessment_guidance,
  key_considerations = EXCLUDED.key_considerations,
  updated_at = NOW();

-- ============================================================================
-- STAKEHOLDER REGISTRY
-- ============================================================================

CREATE TABLE IF NOT EXISTS stakeholder_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    ai_system_id UUID REFERENCES ai_system_registry(id) ON DELETE CASCADE,

    -- Stakeholder Information
    name VARCHAR(255) NOT NULL,
    stakeholder_type VARCHAR(50) NOT NULL, -- end_user, affected_person, vulnerable_group, operator, provider, society, environment
    category VARCHAR(100), -- e.g., patients, employees, customers, general_public
    description TEXT,

    -- Impact Assessment
    impact_level VARCHAR(20) DEFAULT 'moderate', -- critical, high, moderate, low, minimal
    impact_description TEXT,
    power_level VARCHAR(20) DEFAULT 'low', -- high, medium, low (influence over system)
    interest_level VARCHAR(20) DEFAULT 'high', -- high, medium, low (interest in system)

    -- Vulnerability Assessment
    is_vulnerable_group BOOLEAN DEFAULT false,
    vulnerability_factors JSONB DEFAULT '[]'::jsonb, -- age, disability, economic, digital_literacy, etc.

    -- Engagement Tracking
    engagement_status VARCHAR(50) DEFAULT 'identified', -- identified, contacted, engaged, consulted, ongoing
    engagement_notes TEXT,
    last_engagement_date TIMESTAMPTZ,

    -- Concerns and Interests
    key_concerns JSONB DEFAULT '[]'::jsonb,
    key_interests JSONB DEFAULT '[]'::jsonb,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_stakeholder_tenant ON stakeholder_registry(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_ai_system ON stakeholder_registry(ai_system_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_type ON stakeholder_registry(stakeholder_type);
CREATE INDEX IF NOT EXISTS idx_stakeholder_vulnerable ON stakeholder_registry(is_vulnerable_group) WHERE is_vulnerable_group = true;

-- ============================================================================
-- SOCIO-TECHNICAL SCENARIOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS socio_technical_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    ai_system_id UUID REFERENCES ai_system_registry(id) ON DELETE CASCADE,

    -- Scenario Details
    title VARCHAR(500) NOT NULL,
    scenario_type VARCHAR(50) NOT NULL, -- use_case, failure_mode, edge_case, stakeholder_impact, adversarial, emergent
    description TEXT NOT NULL,
    narrative TEXT, -- Detailed narrative description

    -- Context
    context_setting TEXT, -- Where/when scenario occurs
    actors JSONB DEFAULT '[]'::jsonb, -- Stakeholders involved
    preconditions JSONB DEFAULT '[]'::jsonb, -- Conditions for scenario

    -- Trustworthy AI Mapping
    primary_requirement VARCHAR(100) REFERENCES trustworthy_ai_requirements(id),
    affected_requirements JSONB DEFAULT '[]'::jsonb, -- List of all affected requirements

    -- Impact Assessment
    likelihood VARCHAR(20) DEFAULT 'possible', -- certain, likely, possible, unlikely, rare
    severity VARCHAR(20) DEFAULT 'moderate', -- critical, high, moderate, low, minimal
    risk_score INTEGER, -- Calculated: likelihood * severity (1-25)

    -- Outcomes
    potential_harms JSONB DEFAULT '[]'::jsonb,
    potential_benefits JSONB DEFAULT '[]'::jsonb,
    mitigations JSONB DEFAULT '[]'::jsonb,

    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- draft, under_review, validated, archived
    review_notes TEXT,

    -- AI Generation
    is_ai_generated BOOLEAN DEFAULT false,
    generation_prompt TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_scenario_tenant ON socio_technical_scenarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scenario_ai_system ON socio_technical_scenarios(ai_system_id);
CREATE INDEX IF NOT EXISTS idx_scenario_type ON socio_technical_scenarios(scenario_type);
CREATE INDEX IF NOT EXISTS idx_scenario_requirement ON socio_technical_scenarios(primary_requirement);
CREATE INDEX IF NOT EXISTS idx_scenario_status ON socio_technical_scenarios(status);

-- ============================================================================
-- ETHICAL TENSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ethical_tensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    ai_system_id UUID REFERENCES ai_system_registry(id) ON DELETE CASCADE,
    scenario_id UUID REFERENCES socio_technical_scenarios(id) ON DELETE SET NULL,

    -- Tension Definition
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,

    -- Values in Tension
    value_a VARCHAR(255) NOT NULL, -- e.g., "Accuracy", "Efficiency"
    value_a_description TEXT,
    value_b VARCHAR(255) NOT NULL, -- e.g., "Privacy", "Fairness"
    value_b_description TEXT,

    -- Tension Type
    tension_type VARCHAR(50) NOT NULL, -- value_vs_value, stakeholder_vs_stakeholder, requirement_vs_requirement, short_term_vs_long_term

    -- Related Requirements
    requirement_a VARCHAR(100) REFERENCES trustworthy_ai_requirements(id),
    requirement_b VARCHAR(100) REFERENCES trustworthy_ai_requirements(id),

    -- Affected Stakeholders
    affected_stakeholders JSONB DEFAULT '[]'::jsonb, -- List of stakeholder IDs
    stakeholder_perspectives JSONB DEFAULT '{}'::jsonb, -- stakeholder_id -> perspective

    -- Severity and Status
    severity VARCHAR(20) DEFAULT 'moderate', -- critical, significant, moderate, minor
    status VARCHAR(50) DEFAULT 'identified', -- identified, under_review, mitigated, accepted, unresolved

    -- Resolution
    resolution_approach TEXT,
    resolution_rationale TEXT,
    trade_off_decision TEXT,
    residual_concerns TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(255),

    -- AI Analysis
    is_ai_identified BOOLEAN DEFAULT false,
    ai_analysis JSONB DEFAULT '{}'::jsonb,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_tension_tenant ON ethical_tensions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tension_ai_system ON ethical_tensions(ai_system_id);
CREATE INDEX IF NOT EXISTS idx_tension_scenario ON ethical_tensions(scenario_id);
CREATE INDEX IF NOT EXISTS idx_tension_status ON ethical_tensions(status);
CREATE INDEX IF NOT EXISTS idx_tension_severity ON ethical_tensions(severity);

-- ============================================================================
-- TRUSTWORTHINESS ASSESSMENTS (Qualitative)
-- ============================================================================

CREATE TABLE IF NOT EXISTS trustworthiness_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    ai_system_id UUID REFERENCES ai_system_registry(id) ON DELETE CASCADE,

    -- Assessment Info
    title VARCHAR(255) NOT NULL,
    assessment_type VARCHAR(50) DEFAULT 'comprehensive', -- comprehensive, targeted, periodic, z_inspection_import
    scope TEXT, -- What is being assessed

    -- Overall Rating
    overall_rating VARCHAR(50), -- trustworthy, conditionally_trustworthy, not_trustworthy, inconclusive
    overall_narrative TEXT,
    overall_confidence VARCHAR(20), -- high, medium, low

    -- Requirement-Level Assessments (stored as JSONB for flexibility)
    requirement_assessments JSONB DEFAULT '{}'::jsonb,
    -- Structure: { requirement_id: { rating, narrative, findings, evidence_refs, confidence } }

    -- Linked Elements
    scenarios_assessed JSONB DEFAULT '[]'::jsonb, -- List of scenario IDs
    tensions_identified JSONB DEFAULT '[]'::jsonb, -- List of tension IDs
    stakeholders_consulted JSONB DEFAULT '[]'::jsonb, -- List of stakeholder IDs

    -- Methodology
    methodology TEXT, -- Description of assessment methodology
    assessors JSONB DEFAULT '[]'::jsonb, -- List of assessor names/roles
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- draft, in_progress, review, final, archived

    -- Z-Inspection Import
    z_inspection_source_id UUID, -- Links to z_inspection_reports if imported

    -- Recommendations
    recommendations JSONB DEFAULT '[]'::jsonb,
    priority_actions JSONB DEFAULT '[]'::jsonb,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255),
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_trustworthiness_tenant ON trustworthiness_assessments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trustworthiness_ai_system ON trustworthiness_assessments(ai_system_id);
CREATE INDEX IF NOT EXISTS idx_trustworthiness_rating ON trustworthiness_assessments(overall_rating);
CREATE INDEX IF NOT EXISTS idx_trustworthiness_status ON trustworthiness_assessments(status);

-- ============================================================================
-- QUALITATIVE FINDINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS qualitative_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    assessment_id UUID REFERENCES trustworthiness_assessments(id) ON DELETE CASCADE,
    ai_system_id UUID REFERENCES ai_system_registry(id) ON DELETE CASCADE,

    -- Finding Details
    title VARCHAR(500) NOT NULL,
    finding_type VARCHAR(50) NOT NULL, -- strength, weakness, opportunity, threat, recommendation, observation
    description TEXT NOT NULL,

    -- Classification
    requirement_id VARCHAR(100) REFERENCES trustworthy_ai_requirements(id),
    category VARCHAR(100), -- Specific category within requirement

    -- Severity/Priority
    severity VARCHAR(20), -- critical, high, medium, low
    priority VARCHAR(20), -- immediate, short_term, medium_term, long_term

    -- Evidence
    evidence_description TEXT,
    evidence_sources JSONB DEFAULT '[]'::jsonb, -- Links to evidence IDs

    -- Recommendations
    recommendation TEXT,
    recommended_actions JSONB DEFAULT '[]'::jsonb,

    -- Status
    status VARCHAR(50) DEFAULT 'open', -- open, in_progress, addressed, accepted, deferred
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,

    -- Control Mapping
    related_controls JSONB DEFAULT '[]'::jsonb, -- Links to compliance_controls

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_finding_tenant ON qualitative_findings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_finding_assessment ON qualitative_findings(assessment_id);
CREATE INDEX IF NOT EXISTS idx_finding_type ON qualitative_findings(finding_type);
CREATE INDEX IF NOT EXISTS idx_finding_requirement ON qualitative_findings(requirement_id);
CREATE INDEX IF NOT EXISTS idx_finding_status ON qualitative_findings(status);

-- ============================================================================
-- Z-INSPECTION REPORTS (Import)
-- ============================================================================

CREATE TABLE IF NOT EXISTS z_inspection_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    ai_system_id UUID REFERENCES ai_system_registry(id) ON DELETE CASCADE,

    -- Report Information
    title VARCHAR(500) NOT NULL,
    report_date DATE NOT NULL,
    inspection_team JSONB DEFAULT '[]'::jsonb, -- List of team members

    -- Import Details
    import_method VARCHAR(50) NOT NULL, -- manual, json_import, xml_import, ai_parsed
    source_document_type VARCHAR(50), -- pdf, word, structured_json, structured_xml
    source_document_url TEXT,
    source_document_hash VARCHAR(64), -- SHA-256 of source

    -- Raw/Parsed Content
    raw_content TEXT, -- Original text if AI-parsed
    parsed_content JSONB DEFAULT '{}'::jsonb, -- Structured extraction

    -- Extracted Elements
    extracted_findings JSONB DEFAULT '[]'::jsonb,
    extracted_scenarios JSONB DEFAULT '[]'::jsonb,
    extracted_tensions JSONB DEFAULT '[]'::jsonb,
    extracted_recommendations JSONB DEFAULT '[]'::jsonb,

    -- Overall Conclusions
    overall_conclusion TEXT,
    trustworthiness_rating VARCHAR(50), -- As stated in the report

    -- Processing Status
    status VARCHAR(50) DEFAULT 'imported', -- imported, processing, processed, verified, error
    processing_notes TEXT,
    error_message TEXT,

    -- Linked Assessment
    generated_assessment_id UUID REFERENCES trustworthiness_assessments(id) ON DELETE SET NULL,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_zinspection_tenant ON z_inspection_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_zinspection_ai_system ON z_inspection_reports(ai_system_id);
CREATE INDEX IF NOT EXISTS idx_zinspection_status ON z_inspection_reports(status);

-- ============================================================================
-- REQUIREMENT-CONTROL MAPPINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS requirement_control_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id VARCHAR(100) REFERENCES trustworthy_ai_requirements(id) ON DELETE CASCADE,
    control_id VARCHAR(100) REFERENCES compliance_controls(id) ON DELETE CASCADE,
    framework_id VARCHAR(100) REFERENCES compliance_frameworks(id) ON DELETE CASCADE,

    -- Mapping Details
    mapping_strength VARCHAR(20) DEFAULT 'strong', -- strong, moderate, weak
    mapping_rationale TEXT,

    -- Coverage
    coverage_aspect VARCHAR(100), -- Which aspect of the requirement this control addresses

    -- Metadata
    mapped_by VARCHAR(50) DEFAULT 'system', -- system, manual, ai
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(requirement_id, control_id)
);

CREATE INDEX IF NOT EXISTS idx_req_control_requirement ON requirement_control_mappings(requirement_id);
CREATE INDEX IF NOT EXISTS idx_req_control_framework ON requirement_control_mappings(framework_id);

-- Seed initial requirement-control mappings for EU AI Act
INSERT INTO requirement_control_mappings (requirement_id, control_id, framework_id, mapping_strength, coverage_aspect)
VALUES
-- Human Agency and Oversight
('human_agency_oversight', 'AIACT-14.1', 'eu-ai-act', 'strong', 'Human oversight design'),
('human_agency_oversight', 'AIACT-14.2', 'eu-ai-act', 'strong', 'Oversight capability'),
('human_agency_oversight', 'AIACT-14.3', 'eu-ai-act', 'strong', 'Intervention capability'),
('human_agency_oversight', 'AIACT-26.1', 'eu-ai-act', 'strong', 'Deployer appropriate use'),

-- Technical Robustness and Safety
('technical_robustness_safety', 'AIACT-15.1', 'eu-ai-act', 'strong', 'Accuracy, robustness, cybersecurity'),
('technical_robustness_safety', 'AIACT-15.2', 'eu-ai-act', 'moderate', 'Accuracy metrics'),
('technical_robustness_safety', 'AIACT-15.3', 'eu-ai-act', 'strong', 'Robustness to errors'),
('technical_robustness_safety', 'AIACT-15.4', 'eu-ai-act', 'strong', 'Adversarial robustness'),
('technical_robustness_safety', 'AIACT-15.5', 'eu-ai-act', 'strong', 'Cybersecurity measures'),

-- Privacy and Data Governance
('privacy_data_governance', 'AIACT-10.1', 'eu-ai-act', 'strong', 'Training data governance'),
('privacy_data_governance', 'AIACT-10.2', 'eu-ai-act', 'strong', 'Data quality'),
('privacy_data_governance', 'AIACT-10.5', 'eu-ai-act', 'moderate', 'Special category data'),

-- Transparency
('transparency', 'AIACT-13.1', 'eu-ai-act', 'strong', 'Transparency for deployers'),
('transparency', 'AIACT-13.2', 'eu-ai-act', 'strong', 'Instructions for use'),
('transparency', 'AIACT-50.1', 'eu-ai-act', 'strong', 'AI interaction disclosure'),
('transparency', 'AIACT-50.3', 'eu-ai-act', 'strong', 'Synthetic content disclosure'),

-- Diversity, Non-discrimination and Fairness
('diversity_fairness_nondiscrimination', 'AIACT-10.4', 'eu-ai-act', 'strong', 'Bias detection and correction'),

-- Societal and Environmental Well-being
('societal_environmental_wellbeing', 'AIACT-69.2', 'eu-ai-act', 'moderate', 'Environmental sustainability'),

-- Accountability
('accountability', 'AIACT-16.1', 'eu-ai-act', 'strong', 'Provider compliance'),
('accountability', 'AIACT-16.2', 'eu-ai-act', 'strong', 'Quality management'),
('accountability', 'AIACT-12.1', 'eu-ai-act', 'strong', 'Automatic logging'),
('accountability', 'AIACT-11.1', 'eu-ai-act', 'strong', 'Technical documentation')

ON CONFLICT (requirement_id, control_id) DO UPDATE SET
  mapping_strength = EXCLUDED.mapping_strength,
  coverage_aspect = EXCLUDED.coverage_aspect;

-- ============================================================================
-- STAKEHOLDER ENGAGEMENT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS stakeholder_engagement_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stakeholder_id UUID REFERENCES stakeholder_registry(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,

    -- Engagement Details
    engagement_type VARCHAR(50) NOT NULL, -- interview, survey, workshop, observation, feedback, consultation
    engagement_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_minutes INTEGER,
    participants JSONB DEFAULT '[]'::jsonb,

    -- Content
    summary TEXT NOT NULL,
    key_insights JSONB DEFAULT '[]'::jsonb,
    concerns_raised JSONB DEFAULT '[]'::jsonb,
    suggestions JSONB DEFAULT '[]'::jsonb,

    -- Follow-up
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_notes TEXT,

    -- Evidence
    evidence_id UUID REFERENCES compliance_evidence(id) ON DELETE SET NULL,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_engagement_stakeholder ON stakeholder_engagement_log(stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_engagement_tenant ON stakeholder_engagement_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_engagement_date ON stakeholder_engagement_log(engagement_date);

-- ============================================================================
-- ADD QUALITATIVE EVIDENCE TYPES TO EVIDENCE TABLE
-- ============================================================================

-- Add new evidence types if not already present
DO $$
BEGIN
    -- Add 'qualitative_interview' type
    IF NOT EXISTS (
        SELECT 1 FROM compliance_evidence WHERE evidence_type = 'qualitative_interview' LIMIT 1
    ) THEN
        -- Just ensuring the type is valid - the check constraint should allow these
        RAISE NOTICE 'Qualitative evidence types are now supported';
    END IF;
END $$;

-- Update evidence type check constraint to include new types
ALTER TABLE compliance_evidence DROP CONSTRAINT IF EXISTS compliance_evidence_evidence_type_check;
ALTER TABLE compliance_evidence ADD CONSTRAINT compliance_evidence_evidence_type_check
CHECK (evidence_type IN (
    'document', 'screenshot', 'log', 'configuration', 'policy',
    'procedure', 'report', 'certification', 'interview', 'observation',
    'qualitative_interview', 'stakeholder_feedback', 'z_inspection_finding', 'scenario_analysis'
));

-- ============================================================================
-- VIEWS FOR QUALITATIVE ANALYSIS
-- ============================================================================

CREATE OR REPLACE VIEW v_ai_system_trustworthiness_summary AS
SELECT
    a.id as ai_system_id,
    a.name as ai_system_name,
    a.risk_classification,
    a.tenant_id,
    ta.id as latest_assessment_id,
    ta.overall_rating,
    ta.overall_confidence,
    ta.assessment_date,
    (SELECT COUNT(*) FROM socio_technical_scenarios s WHERE s.ai_system_id = a.id) as scenario_count,
    (SELECT COUNT(*) FROM ethical_tensions t WHERE t.ai_system_id = a.id AND t.status = 'unresolved') as unresolved_tensions,
    (SELECT COUNT(*) FROM stakeholder_registry sr WHERE sr.ai_system_id = a.id) as stakeholder_count,
    (SELECT COUNT(*) FROM qualitative_findings qf WHERE qf.ai_system_id = a.id AND qf.status = 'open') as open_findings
FROM ai_system_registry a
LEFT JOIN LATERAL (
    SELECT * FROM trustworthiness_assessments
    WHERE ai_system_id = a.id AND status = 'final'
    ORDER BY assessment_date DESC
    LIMIT 1
) ta ON true;

CREATE OR REPLACE VIEW v_requirement_assessment_status AS
SELECT
    ta.tenant_id,
    ta.ai_system_id,
    tar.id as requirement_id,
    tar.name as requirement_name,
    ta.requirement_assessments->tar.id->>'rating' as rating,
    ta.requirement_assessments->tar.id->>'confidence' as confidence,
    (SELECT COUNT(*) FROM qualitative_findings qf
     WHERE qf.assessment_id = ta.id AND qf.requirement_id = tar.id AND qf.status = 'open') as open_findings,
    (SELECT COUNT(*) FROM ethical_tensions et
     WHERE et.ai_system_id = ta.ai_system_id
     AND (et.requirement_a = tar.id OR et.requirement_b = tar.id)
     AND et.status = 'unresolved') as unresolved_tensions
FROM trustworthiness_assessments ta
CROSS JOIN trustworthy_ai_requirements tar
WHERE ta.status = 'final';

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Qualitative assessment tables created successfully';
  RAISE NOTICE 'Tables created: trustworthy_ai_requirements, stakeholder_registry, socio_technical_scenarios, ethical_tensions, trustworthiness_assessments, qualitative_findings, z_inspection_reports, requirement_control_mappings, stakeholder_engagement_log';
END $$;
