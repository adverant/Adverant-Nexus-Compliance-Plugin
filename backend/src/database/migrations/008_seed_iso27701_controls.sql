-- Migration: 008_seed_iso27701_controls.sql
-- Description: Comprehensive ISO 27701 Privacy Information Management controls
-- Total Controls: 51 controls for PII Controllers and Processors
-- Author: Nexus Compliance Engine
-- Date: 2025-01-01

-- First, ensure the ISO 27701 framework exists
INSERT INTO compliance_frameworks (id, name, version, description, category, jurisdiction, effective_date, status)
VALUES (
  'iso27701',
  'ISO 27701',
  '2019',
  'Privacy Information Management System (PIMS) extension to ISO 27001 and ISO 27002. Provides guidance for establishing, implementing, maintaining, and continually improving a Privacy Information Management System (PIMS) including requirements for PII controllers and processors.',
  'privacy',
  'International',
  '2019-08-06',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  version = EXCLUDED.version,
  status = EXCLUDED.status;

-- ============================================================================
-- CLAUSE 5: PIMS-SPECIFIC REQUIREMENTS (Context, Leadership, Planning)
-- ============================================================================

INSERT INTO compliance_controls (id, framework_id, control_number, domain, subdomain, title, description, objective, implementation_guidance, risk_category, implementation_priority, automated_test_available, ai_assessment_prompt)
VALUES

-- Context of the Organization (5.2)
('ISO27701-5.2.1', 'iso27701', '5.2.1', 'Context', 'Understanding',
 'Privacy Stakeholder Identification',
 'Identify interested parties relevant to the PIMS including data subjects, regulatory authorities, business partners, and internal stakeholders with privacy concerns.',
 'To understand the privacy stakeholder landscape.',
 'Map all privacy stakeholders. Document their requirements. Analyze their influence on privacy practices. Update stakeholder analysis regularly.',
 'high', 95, false,
 'Evaluate stakeholder identification. Check: 1) Are stakeholders identified? 2) Are requirements documented? 3) Is influence analyzed? 4) Is analysis updated?'),

('ISO27701-5.2.2', 'iso27701', '5.2.2', 'Context', 'Understanding',
 'Privacy Legal Requirements',
 'Identify applicable data protection and privacy legislation, regulations, and contractual requirements affecting PII processing.',
 'To ensure awareness of privacy legal obligations.',
 'Identify applicable privacy laws. Map requirements to processing activities. Monitor regulatory changes. Document legal requirements.',
 'critical', 98, true,
 'Assess legal requirement identification. Verify: 1) Are laws identified? 2) Are requirements mapped? 3) Are changes monitored? 4) Are requirements documented?'),

('ISO27701-5.2.3', 'iso27701', '5.2.3', 'Context', 'Scope',
 'PIMS Scope Definition',
 'Define the scope of the privacy information management system including boundaries, applicability, and exclusions.',
 'To establish clear PIMS boundaries.',
 'Define PIMS scope. Identify processing activities in scope. Document boundaries and exclusions. Justify any exclusions.',
 'high', 94, true,
 'Evaluate PIMS scope. Check: 1) Is scope defined? 2) Are activities identified? 3) Are boundaries documented? 4) Are exclusions justified?'),

-- Leadership (5.3)
('ISO27701-5.3.1', 'iso27701', '5.3.1', 'Leadership', 'Commitment',
 'Privacy Leadership Commitment',
 'Top management demonstrates leadership and commitment to the PIMS through resource allocation, policy establishment, and privacy culture promotion.',
 'To ensure management privacy commitment.',
 'Obtain management endorsement. Allocate privacy resources. Establish privacy policy. Promote privacy awareness.',
 'critical', 97, false,
 'Assess leadership commitment. Verify: 1) Is endorsement obtained? 2) Are resources allocated? 3) Is policy established? 4) Is awareness promoted?'),

('ISO27701-5.3.2', 'iso27701', '5.3.2', 'Leadership', 'Policy',
 'Privacy Policy Establishment',
 'Establish a privacy policy that is appropriate to the organization, includes commitments to privacy principles, and provides a framework for privacy objectives.',
 'To formalize privacy commitments.',
 'Develop privacy policy. Include privacy principles. Define objectives framework. Communicate policy. Review regularly.',
 'critical', 96, true,
 'Evaluate privacy policy. Check: 1) Is policy developed? 2) Are principles included? 3) Is framework defined? 4) Is it communicated?'),

('ISO27701-5.3.3', 'iso27701', '5.3.3', 'Leadership', 'Roles',
 'Privacy Roles and Responsibilities',
 'Assign and communicate roles, responsibilities, and authorities for privacy within the organization including DPO designation where required.',
 'To establish privacy accountability.',
 'Define privacy roles. Assign responsibilities. Communicate authorities. Designate DPO if required.',
 'high', 95, true,
 'Assess privacy roles. Verify: 1) Are roles defined? 2) Are responsibilities assigned? 3) Are authorities communicated? 4) Is DPO designated?'),

-- Planning (5.4)
('ISO27701-5.4.1', 'iso27701', '5.4.1', 'Planning', 'Risk Assessment',
 'Privacy Risk Assessment',
 'Conduct privacy risk assessments that identify risks to PII principals arising from PII processing activities.',
 'To identify and assess privacy risks.',
 'Establish risk assessment process. Identify privacy risks. Assess likelihood and impact. Prioritize risks for treatment.',
 'critical', 98, true,
 'Evaluate privacy risk assessment. Check: 1) Is process established? 2) Are risks identified? 3) Is impact assessed? 4) Are risks prioritized?'),

('ISO27701-5.4.2', 'iso27701', '5.4.2', 'Planning', 'Objectives',
 'Privacy Objectives and Planning',
 'Establish measurable privacy objectives at relevant functions and levels, and plan actions to achieve them.',
 'To drive privacy improvement.',
 'Define privacy objectives. Make objectives measurable. Assign responsibilities. Plan achievement actions.',
 'high', 93, true,
 'Assess privacy objectives. Verify: 1) Are objectives defined? 2) Are they measurable? 3) Are responsibilities assigned? 4) Are actions planned?'),

-- ============================================================================
-- CLAUSE 6: SUPPORT REQUIREMENTS
-- ============================================================================

('ISO27701-6.1', 'iso27701', '6.1', 'Support', 'Resources',
 'Privacy Resource Provision',
 'Determine and provide resources needed for the establishment, implementation, maintenance, and continual improvement of the PIMS.',
 'To ensure adequate privacy resources.',
 'Assess resource needs. Allocate privacy budget. Provide tools and technology. Ensure adequate staffing.',
 'high', 92, true,
 'Evaluate resource provision. Check: 1) Are needs assessed? 2) Is budget allocated? 3) Are tools provided? 4) Is staffing adequate?'),

('ISO27701-6.2', 'iso27701', '6.2', 'Support', 'Competence',
 'Privacy Competence',
 'Determine necessary competence of persons doing work affecting privacy, ensure competence through training, and retain evidence of competence.',
 'To ensure privacy staff competence.',
 'Define competence requirements. Provide privacy training. Evaluate competence. Retain training records.',
 'high', 94, true,
 'Assess privacy competence. Verify: 1) Are requirements defined? 2) Is training provided? 3) Is competence evaluated? 4) Are records retained?'),

('ISO27701-6.3', 'iso27701', '6.3', 'Support', 'Awareness',
 'Privacy Awareness',
 'Ensure persons doing work under the organization''s control are aware of the privacy policy, their contribution, and implications of not conforming.',
 'To build privacy awareness.',
 'Develop awareness program. Communicate privacy policy. Explain individual contributions. Describe non-conformance implications.',
 'high', 93, true,
 'Evaluate privacy awareness. Check: 1) Is program developed? 2) Is policy communicated? 3) Are contributions explained? 4) Are implications described?'),

('ISO27701-6.4', 'iso27701', '6.4', 'Support', 'Communication',
 'Privacy Communication',
 'Determine internal and external communications relevant to the PIMS including what, when, with whom, and how to communicate.',
 'To establish privacy communication protocols.',
 'Define communication requirements. Establish internal channels. Define external protocols. Document communications.',
 'medium', 88, true,
 'Assess privacy communication. Verify: 1) Are requirements defined? 2) Are internal channels established? 3) Are protocols defined? 4) Are communications documented?'),

('ISO27701-6.5', 'iso27701', '6.5', 'Support', 'Documentation',
 'PIMS Documentation',
 'Maintain documented information required by the PIMS and determined necessary for effectiveness.',
 'To maintain privacy documentation.',
 'Identify required documents. Create and maintain documentation. Control document versions. Ensure accessibility.',
 'high', 91, true,
 'Evaluate PIMS documentation. Check: 1) Are documents identified? 2) Is documentation maintained? 3) Are versions controlled? 4) Is it accessible?'),

-- ============================================================================
-- CLAUSE 7: OPERATION REQUIREMENTS
-- ============================================================================

('ISO27701-7.1', 'iso27701', '7.1', 'Operation', 'Planning',
 'Privacy Operational Planning',
 'Plan, implement, and control processes needed to meet privacy requirements and implement actions to address privacy risks.',
 'To operationalize privacy controls.',
 'Plan privacy operations. Implement control processes. Monitor effectiveness. Address identified risks.',
 'high', 94, true,
 'Assess operational planning. Verify: 1) Is planning conducted? 2) Are processes implemented? 3) Is effectiveness monitored? 4) Are risks addressed?'),

('ISO27701-7.2', 'iso27701', '7.2', 'Operation', 'Risk Assessment',
 'Privacy Risk Assessment Execution',
 'Conduct privacy risk assessments at planned intervals and when significant changes occur.',
 'To maintain current risk understanding.',
 'Schedule regular assessments. Conduct upon significant changes. Document assessment results. Update risk register.',
 'critical', 96, true,
 'Evaluate risk assessment execution. Check: 1) Are assessments scheduled? 2) Are changes assessed? 3) Are results documented? 4) Is register updated?'),

('ISO27701-7.3', 'iso27701', '7.3', 'Operation', 'Risk Treatment',
 'Privacy Risk Treatment',
 'Implement privacy risk treatment plans and retain documented information of results.',
 'To address identified privacy risks.',
 'Develop treatment plans. Implement controls. Monitor effectiveness. Document treatment results.',
 'critical', 95, true,
 'Assess risk treatment. Verify: 1) Are plans developed? 2) Are controls implemented? 3) Is effectiveness monitored? 4) Are results documented?'),

-- ============================================================================
-- CLAUSE 8: PERFORMANCE EVALUATION
-- ============================================================================

('ISO27701-8.1', 'iso27701', '8.1', 'Performance', 'Monitoring',
 'Privacy Performance Monitoring',
 'Determine what needs to be monitored and measured, methods for monitoring, when to monitor, and when results shall be analyzed.',
 'To measure privacy performance.',
 'Define privacy metrics. Establish monitoring methods. Conduct regular monitoring. Analyze and report results.',
 'high', 92, true,
 'Evaluate privacy monitoring. Check: 1) Are metrics defined? 2) Are methods established? 3) Is monitoring regular? 4) Are results analyzed?'),

('ISO27701-8.2', 'iso27701', '8.2', 'Performance', 'Audit',
 'Privacy Internal Audit',
 'Conduct internal audits at planned intervals to provide information on PIMS conformance and effectiveness.',
 'To assess PIMS conformance.',
 'Develop audit program. Conduct periodic audits. Document findings. Track remediation.',
 'high', 93, true,
 'Assess privacy audits. Verify: 1) Is program developed? 2) Are audits periodic? 3) Are findings documented? 4) Is remediation tracked?'),

('ISO27701-8.3', 'iso27701', '8.3', 'Performance', 'Management Review',
 'Privacy Management Review',
 'Top management reviews the PIMS at planned intervals to ensure its continuing suitability, adequacy, and effectiveness.',
 'To ensure management oversight.',
 'Schedule management reviews. Review PIMS performance. Make improvement decisions. Document review outputs.',
 'high', 91, false,
 'Evaluate management review. Check: 1) Are reviews scheduled? 2) Is performance reviewed? 3) Are decisions made? 4) Are outputs documented?'),

-- ============================================================================
-- CLAUSE 9: IMPROVEMENT
-- ============================================================================

('ISO27701-9.1', 'iso27701', '9.1', 'Improvement', 'Nonconformity',
 'Privacy Nonconformity and Corrective Action',
 'React to nonconformities, take action to control and correct them, deal with consequences, and eliminate causes.',
 'To address privacy nonconformities.',
 'Identify nonconformities. Implement corrections. Analyze root causes. Take corrective actions. Verify effectiveness.',
 'high', 94, true,
 'Assess nonconformity handling. Verify: 1) Are nonconformities identified? 2) Are corrections implemented? 3) Are causes analyzed? 4) Is effectiveness verified?'),

('ISO27701-9.2', 'iso27701', '9.2', 'Improvement', 'Continual',
 'Privacy Continual Improvement',
 'Continually improve the suitability, adequacy, and effectiveness of the PIMS.',
 'To drive ongoing privacy improvement.',
 'Identify improvement opportunities. Prioritize improvements. Implement changes. Measure improvement effectiveness.',
 'medium', 89, true,
 'Evaluate continual improvement. Check: 1) Are opportunities identified? 2) Are improvements prioritized? 3) Are changes implemented? 4) Is effectiveness measured?'),

-- ============================================================================
-- ANNEX A: PIMS-SPECIFIC REFERENCE CONTROLS FOR PII CONTROLLERS
-- ============================================================================

('ISO27701-A.7.2.1', 'iso27701', 'A.7.2.1', 'PII Controller', 'Purpose',
 'Purpose Identification and Documentation',
 'Identify and document the specific purposes for which PII will be processed.',
 'To ensure purpose transparency.',
 'Identify all processing purposes. Document in processing register. Link to legal basis. Review periodically.',
 'critical', 97, true,
 'Assess purpose documentation. Verify: 1) Are purposes identified? 2) Are they documented? 3) Are they linked to legal basis? 4) Is review periodic?'),

('ISO27701-A.7.2.2', 'iso27701', 'A.7.2.2', 'PII Controller', 'Legal Basis',
 'Legal Basis Identification',
 'Determine and document the lawful basis for processing PII.',
 'To ensure lawful processing.',
 'Identify applicable legal bases. Document for each processing activity. Review when processing changes. Maintain legal basis register.',
 'critical', 98, true,
 'Evaluate legal basis identification. Check: 1) Are bases identified? 2) Are they documented? 3) Are changes reviewed? 4) Is register maintained?'),

('ISO27701-A.7.2.3', 'iso27701', 'A.7.2.3', 'PII Controller', 'Purpose Limitation',
 'Purpose Limitation Enforcement',
 'Ensure PII collected for one purpose is not used for another without a valid basis.',
 'To enforce purpose limitation.',
 'Link processing to purposes. Prevent unauthorized use. Obtain fresh consent for new purposes. Monitor for unauthorized processing.',
 'high', 95, true,
 'Assess purpose limitation. Verify: 1) Is processing linked to purposes? 2) Is unauthorized use prevented? 3) Is consent obtained for new purposes?'),

('ISO27701-A.7.2.4', 'iso27701', 'A.7.2.4', 'PII Controller', 'Minimization',
 'Data Minimization',
 'Limit PII processing to that which is adequate, relevant, and necessary for the identified purposes.',
 'To minimize PII processing.',
 'Review data collection for necessity. Eliminate unnecessary fields. Review periodically. Document justifications.',
 'high', 94, true,
 'Evaluate data minimization. Check: 1) Is necessity reviewed? 2) Are unnecessary fields eliminated? 3) Is review periodic? 4) Are justifications documented?'),

('ISO27701-A.7.2.5', 'iso27701', 'A.7.2.5', 'PII Controller', 'Accuracy',
 'PII Accuracy Management',
 'Establish procedures to ensure PII is accurate and up to date as necessary for the purposes of processing.',
 'To maintain PII accuracy.',
 'Implement accuracy controls. Enable principal updates. Verify critical data. Correct inaccurate data promptly.',
 'high', 92, true,
 'Assess PII accuracy. Verify: 1) Are controls implemented? 2) Are updates enabled? 3) Is critical data verified? 4) Are corrections prompt?'),

('ISO27701-A.7.2.6', 'iso27701', 'A.7.2.6', 'PII Controller', 'Retention',
 'PII Retention Limits',
 'Establish and enforce limits on PII retention based on purpose necessity and legal requirements.',
 'To limit PII retention.',
 'Define retention periods. Implement automated deletion. Review for continued necessity. Document retention decisions.',
 'high', 93, true,
 'Evaluate retention limits. Check: 1) Are periods defined? 2) Is automated deletion implemented? 3) Is necessity reviewed? 4) Are decisions documented?'),

('ISO27701-A.7.2.7', 'iso27701', 'A.7.2.7', 'PII Controller', 'Disposal',
 'PII Secure Disposal',
 'Implement procedures for secure disposal of PII that is no longer needed.',
 'To ensure secure PII disposal.',
 'Define disposal procedures. Use secure deletion methods. Verify disposal completeness. Document disposal.',
 'high', 91, true,
 'Assess secure disposal. Verify: 1) Are procedures defined? 2) Are methods secure? 3) Is completeness verified? 4) Is disposal documented?'),

('ISO27701-A.7.3.1', 'iso27701', 'A.7.3.1', 'PII Controller', 'Transparency',
 'Privacy Notice Provision',
 'Provide PII principals with clear and accessible information about processing of their PII.',
 'To ensure processing transparency.',
 'Develop privacy notices. Make accessible at collection. Include all required information. Update when processing changes.',
 'critical', 96, true,
 'Evaluate privacy notices. Check: 1) Are notices developed? 2) Are they accessible? 3) Is all information included? 4) Are they updated?'),

('ISO27701-A.7.3.2', 'iso27701', 'A.7.3.2', 'PII Controller', 'Consent',
 'Consent Obtaining and Recording',
 'Obtain and record consent from PII principals when consent is the legal basis for processing.',
 'To properly manage consent.',
 'Design consent mechanisms. Record consent details. Link to processing activities. Enable withdrawal.',
 'critical', 97, true,
 'Assess consent management. Verify: 1) Are mechanisms designed? 2) Are details recorded? 3) Is it linked to processing? 4) Is withdrawal enabled?'),

('ISO27701-A.7.3.3', 'iso27701', 'A.7.3.3', 'PII Controller', 'Consent',
 'Consent Withdrawal',
 'Provide mechanisms for PII principals to withdraw consent as easily as they gave it.',
 'To enable consent withdrawal.',
 'Implement withdrawal mechanisms. Process withdrawals promptly. Stop processing upon withdrawal. Communicate consequences.',
 'high', 95, true,
 'Evaluate withdrawal process. Check: 1) Are mechanisms implemented? 2) Are withdrawals prompt? 3) Does processing stop? 4) Are consequences communicated?'),

('ISO27701-A.7.3.4', 'iso27701', 'A.7.3.4', 'PII Controller', 'Rights',
 'Data Subject Access',
 'Provide PII principals with the ability to access their PII upon request.',
 'To enable access rights.',
 'Implement access request process. Verify identity. Compile PII. Respond within timeframes.',
 'high', 94, true,
 'Assess access provision. Verify: 1) Is process implemented? 2) Is identity verified? 3) Is PII compiled? 4) Are timeframes met?'),

('ISO27701-A.7.3.5', 'iso27701', 'A.7.3.5', 'PII Controller', 'Rights',
 'Data Subject Rectification',
 'Enable PII principals to have inaccurate PII corrected or completed.',
 'To enable rectification rights.',
 'Implement rectification process. Verify correction requests. Update all copies. Notify recipients.',
 'high', 93, true,
 'Evaluate rectification process. Check: 1) Is process implemented? 2) Are requests verified? 3) Are copies updated? 4) Are recipients notified?'),

('ISO27701-A.7.3.6', 'iso27701', 'A.7.3.6', 'PII Controller', 'Rights',
 'Data Subject Erasure',
 'Enable PII principals to have their PII erased when there is no valid reason for retention.',
 'To enable erasure rights.',
 'Implement erasure process. Verify erasure requests. Delete from all systems. Document erasure.',
 'high', 94, true,
 'Assess erasure process. Verify: 1) Is process implemented? 2) Are requests verified? 3) Is deletion complete? 4) Is erasure documented?'),

('ISO27701-A.7.3.7', 'iso27701', 'A.7.3.7', 'PII Controller', 'Rights',
 'Data Subject Portability',
 'Provide PII in a portable format to PII principals upon request where applicable.',
 'To enable portability rights.',
 'Implement portability export. Use structured format. Enable direct transfer. Document requests.',
 'medium', 88, true,
 'Evaluate portability. Check: 1) Is export implemented? 2) Is format structured? 3) Is direct transfer enabled? 4) Are requests documented?'),

('ISO27701-A.7.3.8', 'iso27701', 'A.7.3.8', 'PII Controller', 'Rights',
 'Objection Handling',
 'Enable PII principals to object to processing in certain circumstances.',
 'To enable objection rights.',
 'Implement objection process. Assess objections. Stop processing where required. Document objection handling.',
 'high', 91, true,
 'Assess objection handling. Verify: 1) Is process implemented? 2) Are objections assessed? 3) Is processing stopped when required? 4) Is handling documented?'),

('ISO27701-A.7.4.1', 'iso27701', 'A.7.4.1', 'PII Controller', 'Design',
 'Privacy by Design',
 'Integrate privacy considerations into the design of products, services, and processing activities.',
 'To embed privacy by design.',
 'Include privacy in design process. Conduct PIAs for new processing. Implement privacy features. Document design decisions.',
 'critical', 96, true,
 'Evaluate privacy by design. Check: 1) Is privacy in design process? 2) Are PIAs conducted? 3) Are features implemented? 4) Are decisions documented?'),

('ISO27701-A.7.4.2', 'iso27701', 'A.7.4.2', 'PII Controller', 'Design',
 'Privacy by Default',
 'Ensure privacy-protective settings are the default for products and services.',
 'To implement privacy by default.',
 'Configure minimum collection by default. Limit access by default. Set shortest retention by default. Document default settings.',
 'high', 94, true,
 'Assess privacy by default. Verify: 1) Is collection minimum by default? 2) Is access limited by default? 3) Is retention shortest by default?'),

('ISO27701-A.7.5.1', 'iso27701', 'A.7.5.1', 'PII Controller', 'Processor Management',
 'Processor Selection and Due Diligence',
 'Select processors that provide sufficient guarantees for implementing appropriate privacy measures.',
 'To ensure processor privacy capability.',
 'Define processor requirements. Conduct due diligence. Assess privacy measures. Document selection.',
 'high', 93, true,
 'Evaluate processor selection. Check: 1) Are requirements defined? 2) Is due diligence conducted? 3) Are measures assessed? 4) Is selection documented?'),

('ISO27701-A.7.5.2', 'iso27701', 'A.7.5.2', 'PII Controller', 'Processor Management',
 'Processor Contract Requirements',
 'Include appropriate privacy requirements in contracts with PII processors.',
 'To contractually bind processors.',
 'Define contract requirements. Include privacy clauses. Specify processing limits. Require sub-processor controls.',
 'critical', 95, true,
 'Assess processor contracts. Verify: 1) Are requirements defined? 2) Are clauses included? 3) Are limits specified? 4) Are sub-processor controls required?'),

('ISO27701-A.7.5.3', 'iso27701', 'A.7.5.3', 'PII Controller', 'Processor Management',
 'Processor Monitoring',
 'Monitor processors to ensure compliance with privacy requirements.',
 'To maintain processor oversight.',
 'Establish monitoring mechanisms. Review processor reports. Conduct audits. Address non-compliance.',
 'high', 91, true,
 'Evaluate processor monitoring. Check: 1) Are mechanisms established? 2) Are reports reviewed? 3) Are audits conducted? 4) Is non-compliance addressed?'),

-- ============================================================================
-- ANNEX B: PIMS-SPECIFIC REFERENCE CONTROLS FOR PII PROCESSORS
-- ============================================================================

('ISO27701-B.8.2.1', 'iso27701', 'B.8.2.1', 'PII Processor', 'Instructions',
 'Processing on Controller Instructions',
 'Process PII only on documented instructions from the PII controller.',
 'To ensure authorized processing only.',
 'Obtain documented instructions. Limit processing to instructions. Document any additional instructions. Report conflicting legal requirements.',
 'critical', 97, true,
 'Assess instruction compliance. Verify: 1) Are instructions obtained? 2) Is processing limited? 3) Are additions documented? 4) Are conflicts reported?'),

('ISO27701-B.8.2.2', 'iso27701', 'B.8.2.2', 'PII Processor', 'Purpose',
 'Processing Purpose Limitation',
 'Process PII only for the purposes specified by the PII controller.',
 'To enforce purpose limitation as processor.',
 'Document processing purposes. Limit processing to purposes. Prevent unauthorized use. Report purpose changes.',
 'high', 95, true,
 'Evaluate purpose limitation. Check: 1) Are purposes documented? 2) Is processing limited? 3) Is unauthorized use prevented? 4) Are changes reported?'),

('ISO27701-B.8.3.1', 'iso27701', 'B.8.3.1', 'PII Processor', 'Assistance',
 'Controller Assistance with Rights',
 'Assist the PII controller in responding to requests from PII principals to exercise their rights.',
 'To support controller in rights fulfillment.',
 'Establish assistance procedures. Respond to controller requests. Provide PII for access requests. Support erasure implementation.',
 'high', 93, true,
 'Assess rights assistance. Verify: 1) Are procedures established? 2) Are requests responded to? 3) Is PII provided? 4) Is erasure supported?'),

('ISO27701-B.8.4.1', 'iso27701', 'B.8.4.1', 'PII Processor', 'Sub-processor',
 'Sub-processor Engagement',
 'Engage sub-processors only with controller authorization and impose equivalent privacy obligations.',
 'To control sub-processor chain.',
 'Obtain controller authorization. Impose equivalent obligations. Notify controller of changes. Maintain sub-processor register.',
 'high', 94, true,
 'Evaluate sub-processor engagement. Check: 1) Is authorization obtained? 2) Are obligations imposed? 3) Are changes notified? 4) Is register maintained?'),

('ISO27701-B.8.4.2', 'iso27701', 'B.8.4.2', 'PII Processor', 'Sub-processor',
 'Sub-processor Monitoring',
 'Monitor sub-processors to ensure compliance with privacy requirements.',
 'To maintain sub-processor oversight.',
 'Establish monitoring mechanisms. Review sub-processor performance. Conduct audits. Address non-compliance.',
 'medium', 89, true,
 'Assess sub-processor monitoring. Verify: 1) Are mechanisms established? 2) Is performance reviewed? 3) Are audits conducted? 4) Is non-compliance addressed?'),

('ISO27701-B.8.5.1', 'iso27701', 'B.8.5.1', 'PII Processor', 'Transfer',
 'International Transfer Controls',
 'Transfer PII to third countries only with appropriate safeguards in place.',
 'To protect PII during international transfers.',
 'Identify transfers. Implement transfer mechanisms. Conduct transfer impact assessments. Document safeguards.',
 'high', 93, true,
 'Evaluate transfer controls. Check: 1) Are transfers identified? 2) Are mechanisms implemented? 3) Are assessments conducted? 4) Are safeguards documented?'),

('ISO27701-B.8.6.1', 'iso27701', 'B.8.6.1', 'PII Processor', 'Security',
 'Processor Security Measures',
 'Implement appropriate technical and organizational measures to ensure PII security.',
 'To protect PII as processor.',
 'Implement security controls. Protect against unauthorized access. Ensure confidentiality and integrity. Monitor security effectiveness.',
 'critical', 96, true,
 'Assess processor security. Verify: 1) Are controls implemented? 2) Is access protected? 3) Is CIA ensured? 4) Is effectiveness monitored?'),

('ISO27701-B.8.6.2', 'iso27701', 'B.8.6.2', 'PII Processor', 'Breach',
 'Breach Notification to Controller',
 'Notify the PII controller of any PII breach without undue delay.',
 'To enable controller breach response.',
 'Define breach notification procedures. Notify controller promptly. Provide breach details. Support controller response.',
 'critical', 97, true,
 'Evaluate breach notification. Check: 1) Are procedures defined? 2) Is notification prompt? 3) Are details provided? 4) Is response supported?'),

('ISO27701-B.8.7.1', 'iso27701', 'B.8.7.1', 'PII Processor', 'End of Processing',
 'PII Return or Deletion',
 'Return or delete PII at the end of the processing relationship as directed by the controller.',
 'To properly end PII processing.',
 'Define end-of-processing procedures. Return PII on request. Delete PII securely. Provide deletion certification.',
 'high', 92, true,
 'Assess end-of-processing. Verify: 1) Are procedures defined? 2) Is PII returned on request? 3) Is deletion secure? 4) Is certification provided?')

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  objective = EXCLUDED.objective,
  implementation_guidance = EXCLUDED.implementation_guidance,
  risk_category = EXCLUDED.risk_category,
  implementation_priority = EXCLUDED.implementation_priority,
  automated_test_available = EXCLUDED.automated_test_available,
  ai_assessment_prompt = EXCLUDED.ai_assessment_prompt;

-- Update framework control count
UPDATE compliance_frameworks
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'),
  '{control_count}',
  (SELECT COUNT(*)::text::jsonb FROM compliance_controls WHERE framework_id = 'iso27701')
)
WHERE id = 'iso27701';

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'ISO 27701 controls migration complete. Total controls: %',
    (SELECT COUNT(*) FROM compliance_controls WHERE framework_id = 'iso27701');
END $$;
