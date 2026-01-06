-- Migration: 013_seed_ai_act_complete.sql
-- Description: Complete EU AI Act (Regulation 2024/1689) controls - Titles VI-XIII
-- Total New Controls: ~60 controls covering remaining AI Act requirements
-- Note: Titles I-V and VIII already covered in 005_seed_ai_act_controls.sql
-- Author: Nexus Compliance Engine
-- Date: 2025-01-06

-- ============================================================================
-- TITLE VI: GOVERNANCE AND IMPLEMENTATION (Articles 56-68) - 15 Controls
-- ============================================================================

INSERT INTO compliance_controls (id, framework_id, control_number, domain, subdomain, title, description, objective, implementation_guidance, risk_category, implementation_priority, automated_test_available, ai_assessment_prompt)
VALUES

-- Chapter 1: Governance at Union Level (AI Office)
('AIACT-56.1', 'eu-ai-act', '56.1', 'Governance', 'AI Office',
 'AI Office Cooperation',
 'Cooperate with the AI Office on matters related to general-purpose AI models, systemic risk assessment, and codes of practice.',
 'To ensure effective coordination with Union-level AI governance.',
 'Establish AI Office liaison. Respond to information requests. Participate in consultations. Document interactions.',
 'high', 90, false,
 'Assess AI Office cooperation. Verify: 1) Is a liaison established? 2) Are requests responded to promptly? 3) Are interactions documented?'),

('AIACT-57.1', 'eu-ai-act', '57.1', 'Governance', 'Scientific Panel',
 'Scientific Panel Engagement',
 'Engage with the scientific panel of independent experts when requested for technical advice on GPAI models.',
 'To support expert oversight of advanced AI systems.',
 'Respond to panel requests. Provide technical information. Facilitate expert access. Document engagement.',
 'medium', 85, false,
 'Evaluate scientific panel engagement. Check: 1) Are requests addressed? 2) Is information provided? 3) Is engagement documented?'),

('AIACT-58.1', 'eu-ai-act', '58.1', 'Governance', 'Advisory Forum',
 'Stakeholder Advisory Forum Participation',
 'Participate in stakeholder advisory forum activities when invited to provide input on AI Act implementation.',
 'To contribute to balanced AI governance.',
 'Accept forum invitations. Provide constructive input. Share practical insights. Document participation.',
 'low', 80, false,
 'Assess advisory forum participation. Verify: 1) Are invitations considered? 2) Is input provided? 3) Is participation documented?'),

-- Chapter 2: National Competent Authorities
('AIACT-59.1', 'eu-ai-act', '59.1', 'Governance', 'National Authorities',
 'National Authority Designation Awareness',
 'Identify and maintain awareness of designated national competent authorities, market surveillance authorities, and notifying authorities in relevant Member States.',
 'To ensure correct regulatory engagement.',
 'Identify relevant authorities. Document contact information. Monitor authority changes. Maintain current records.',
 'high', 92, true,
 'Evaluate authority awareness. Check: 1) Are authorities identified? 2) Is contact information documented? 3) Are records current?'),

('AIACT-60.1', 'eu-ai-act', '60.1', 'Governance', 'Market Surveillance',
 'Market Surveillance Authority Cooperation',
 'Cooperate with market surveillance authorities in their supervisory activities, providing information and access as required.',
 'To support effective market surveillance.',
 'Respond to authority requests. Provide requested information. Grant access as required. Document cooperation.',
 'high', 93, true,
 'Assess market surveillance cooperation. Verify: 1) Are requests responded to? 2) Is information provided? 3) Is access granted?'),

('AIACT-61.1', 'eu-ai-act', '61.1', 'Governance', 'Enforcement',
 'Enforcement Action Response',
 'Respond appropriately to enforcement actions, including warnings, orders, and restrictions imposed by competent authorities.',
 'To ensure compliance with regulatory orders.',
 'Acknowledge enforcement actions. Implement required measures. Report on compliance. Document responses.',
 'critical', 98, true,
 'Evaluate enforcement response. Check: 1) Are actions acknowledged? 2) Are measures implemented? 3) Is compliance reported?'),

('AIACT-62.1', 'eu-ai-act', '62.1', 'Governance', 'Information Requests',
 'Regulatory Information Provision',
 'Provide competent authorities with complete and accurate information upon request within specified timeframes.',
 'To ensure regulatory transparency.',
 'Establish information request process. Gather required information. Submit within deadlines. Document all submissions.',
 'high', 94, true,
 'Assess information provision. Verify: 1) Is process established? 2) Are deadlines met? 3) Is information complete?'),

-- Chapter 3: Union Database for High-Risk AI Systems
('AIACT-71.1', 'eu-ai-act', '71.1', 'Governance', 'EU Database',
 'EU Database Registration Completeness',
 'Ensure all required information is entered and maintained in the EU database for high-risk AI systems.',
 'To enable public transparency and oversight.',
 'Enter all required fields. Verify information accuracy. Update upon changes. Monitor registration status.',
 'critical', 96, true,
 'Evaluate database completeness. Check required fields: 1) Provider identity 2) System description 3) Conformity assessment 4) Status updates'),

('AIACT-71.2', 'eu-ai-act', '71.2', 'Governance', 'EU Database',
 'EU Database Update Obligation',
 'Update EU database registration within specified timeframes when information changes or system is modified.',
 'To maintain current database information.',
 'Monitor for changes requiring updates. Submit updates promptly. Verify update acceptance. Document update history.',
 'high', 93, true,
 'Assess database updates. Verify: 1) Are changes monitored? 2) Are updates timely? 3) Is history documented?'),

('AIACT-71.3', 'eu-ai-act', '71.3', 'Governance', 'EU Database',
 'Deployer Database Obligations',
 'As a deployer of high-risk AI systems, fulfill applicable database registration requirements.',
 'To ensure deployer transparency.',
 'Verify registration requirements. Complete required registrations. Maintain current information. Document compliance.',
 'high', 91, true,
 'Evaluate deployer registration. Check: 1) Are requirements identified? 2) Is registration complete? 3) Is information current?'),

-- ============================================================================
-- TITLE VII: NOTIFIED BODIES (Articles 28-39) - 12 Controls
-- Note: These articles are part of conformity assessment infrastructure
-- ============================================================================

('AIACT-28.1', 'eu-ai-act', '28.1', 'Notified Bodies', 'Selection',
 'Notified Body Selection',
 'Select an appropriate notified body for third-party conformity assessment when required.',
 'To ensure competent conformity assessment.',
 'Identify notified body requirements. Evaluate available notified bodies. Select based on competence. Document selection rationale.',
 'high', 92, false,
 'Assess notified body selection. Verify: 1) Are requirements identified? 2) Is evaluation conducted? 3) Is selection documented?'),

('AIACT-29.1', 'eu-ai-act', '29.1', 'Notified Bodies', 'Requirements',
 'Notified Body Independence Verification',
 'Verify the independence and impartiality of selected notified body.',
 'To ensure objective conformity assessment.',
 'Check notified body accreditation. Verify no conflicts of interest. Confirm independence status. Document verification.',
 'medium', 88, false,
 'Evaluate independence verification. Check: 1) Is accreditation valid? 2) Are conflicts assessed? 3) Is verification documented?'),

('AIACT-30.1', 'eu-ai-act', '30.1', 'Notified Bodies', 'Engagement',
 'Notified Body Engagement Process',
 'Establish formal engagement with notified body for conformity assessment activities.',
 'To ensure proper conformity assessment process.',
 'Define engagement scope. Agree on procedures. Establish communication channels. Document agreement.',
 'high', 91, true,
 'Assess notified body engagement. Verify: 1) Is scope defined? 2) Are procedures agreed? 3) Is engagement documented?'),

('AIACT-31.1', 'eu-ai-act', '31.1', 'Notified Bodies', 'Documentation',
 'Conformity Assessment Documentation Provision',
 'Provide notified body with all technical documentation and access required for conformity assessment.',
 'To enable thorough conformity assessment.',
 'Prepare required documentation. Grant system access. Facilitate testing activities. Document all provisions.',
 'high', 93, true,
 'Evaluate documentation provision. Check: 1) Is documentation complete? 2) Is access granted? 3) Is testing facilitated?'),

('AIACT-32.1', 'eu-ai-act', '32.1', 'Notified Bodies', 'Assessment',
 'Conformity Assessment Cooperation',
 'Cooperate fully with notified body during conformity assessment activities.',
 'To ensure thorough and accurate assessment.',
 'Respond to queries promptly. Provide additional information. Address findings. Document all interactions.',
 'high', 94, true,
 'Assess conformity cooperation. Verify: 1) Are queries responded to? 2) Are findings addressed? 3) Is cooperation documented?'),

('AIACT-33.1', 'eu-ai-act', '33.1', 'Notified Bodies', 'Findings',
 'Conformity Assessment Finding Resolution',
 'Address and resolve any non-conformities identified by notified body during assessment.',
 'To achieve conformity certification.',
 'Analyze findings. Develop remediation plans. Implement corrections. Obtain verification of resolution.',
 'critical', 96, true,
 'Evaluate finding resolution. Check: 1) Are findings analyzed? 2) Are corrections implemented? 3) Is resolution verified?'),

('AIACT-34.1', 'eu-ai-act', '34.1', 'Notified Bodies', 'Certification',
 'Conformity Certificate Management',
 'Obtain and maintain conformity certificates from notified body as required.',
 'To demonstrate verified conformity.',
 'Obtain required certificates. Verify certificate validity. Monitor expiration dates. Renew as required.',
 'critical', 95, true,
 'Assess certificate management. Verify: 1) Are certificates obtained? 2) Is validity verified? 3) Are renewals tracked?'),

('AIACT-35.1', 'eu-ai-act', '35.1', 'Notified Bodies', 'Changes',
 'Substantial Modification Notification',
 'Notify notified body of substantial modifications to certified high-risk AI systems.',
 'To ensure continued conformity after changes.',
 'Define substantial modification criteria. Monitor for modifications. Notify promptly. Re-assess as required.',
 'high', 92, true,
 'Evaluate modification notification. Check: 1) Are criteria defined? 2) Is monitoring in place? 3) Is notification timely?'),

('AIACT-36.1', 'eu-ai-act', '36.1', 'Notified Bodies', 'Surveillance',
 'Post-Certification Surveillance Cooperation',
 'Cooperate with notified body surveillance activities to verify continued conformity.',
 'To maintain ongoing conformity assurance.',
 'Facilitate surveillance visits. Provide requested information. Address surveillance findings. Document activities.',
 'high', 91, true,
 'Assess surveillance cooperation. Verify: 1) Are visits facilitated? 2) Is information provided? 3) Are findings addressed?'),

('AIACT-37.1', 'eu-ai-act', '37.1', 'Notified Bodies', 'Appeals',
 'Notified Body Decision Appeals',
 'Exercise right to appeal notified body decisions through appropriate procedures.',
 'To ensure fair conformity assessment process.',
 'Understand appeal procedures. Document grounds for appeal. Submit within timeframes. Cooperate with appeal process.',
 'medium', 85, false,
 'Evaluate appeal process. Check: 1) Are procedures understood? 2) Are grounds documented? 3) Are timeframes met?'),

-- ============================================================================
-- TITLE IX: CODES OF CONDUCT (Articles 69) - 5 Controls
-- ============================================================================

('AIACT-69.1', 'eu-ai-act', '69.1', 'Codes of Conduct', 'Voluntary',
 'Voluntary Code of Conduct Adoption',
 'Consider adopting voluntary codes of conduct for non-high-risk AI systems covering AI Act requirements.',
 'To demonstrate responsible AI practices beyond legal requirements.',
 'Evaluate available codes. Assess applicability. Adopt where appropriate. Document adoption and compliance.',
 'medium', 82, false,
 'Assess code adoption. Verify: 1) Are codes evaluated? 2) Is applicability assessed? 3) Is adoption documented?'),

('AIACT-69.2', 'eu-ai-act', '69.2', 'Codes of Conduct', 'Environmental',
 'Environmental Sustainability Commitments',
 'Include environmental sustainability objectives in voluntary code of conduct commitments.',
 'To address AI environmental impact.',
 'Assess environmental impact. Define sustainability objectives. Implement reduction measures. Report on progress.',
 'medium', 80, false,
 'Evaluate sustainability commitments. Check: 1) Is impact assessed? 2) Are objectives defined? 3) Is progress reported?'),

('AIACT-69.3', 'eu-ai-act', '69.3', 'Codes of Conduct', 'Accessibility',
 'Accessibility Commitments',
 'Include accessibility for persons with disabilities in voluntary code of conduct commitments.',
 'To ensure AI accessibility.',
 'Assess accessibility requirements. Design for accessibility. Test with diverse users. Document accessibility features.',
 'medium', 83, false,
 'Assess accessibility commitments. Verify: 1) Are requirements assessed? 2) Is accessibility designed in? 3) Are features documented?'),

('AIACT-69.4', 'eu-ai-act', '69.4', 'Codes of Conduct', 'SME Support',
 'SME and Startup Support Commitments',
 'Consider supporting SMEs and startups through code of conduct commitments.',
 'To foster inclusive AI ecosystem.',
 'Identify support opportunities. Develop support programs. Implement assistance measures. Document support provided.',
 'low', 75, false,
 'Evaluate SME support. Check: 1) Are opportunities identified? 2) Are programs developed? 3) Is support documented?'),

('AIACT-69.5', 'eu-ai-act', '69.5', 'Codes of Conduct', 'Reporting',
 'Code of Conduct Compliance Reporting',
 'Report on compliance with adopted codes of conduct as required.',
 'To demonstrate code adherence.',
 'Define reporting requirements. Gather compliance evidence. Prepare reports. Submit as required.',
 'medium', 81, false,
 'Assess code reporting. Verify: 1) Are requirements defined? 2) Is evidence gathered? 3) Are reports submitted?'),

-- ============================================================================
-- TITLE X: CONFIDENTIALITY AND PENALTIES (Articles 78-99) - 12 Controls
-- ============================================================================

('AIACT-78.1', 'eu-ai-act', '78.1', 'Confidentiality', 'Information Protection',
 'Confidential Information Protection',
 'Protect confidential business information and trade secrets shared with authorities.',
 'To balance transparency with confidentiality.',
 'Identify confidential information. Mark appropriately. Request confidential treatment. Document protections.',
 'high', 89, true,
 'Evaluate confidentiality protection. Check: 1) Is information identified? 2) Is marking applied? 3) Are protections documented?'),

('AIACT-78.2', 'eu-ai-act', '78.2', 'Confidentiality', 'Data Exchange',
 'Secure Information Exchange',
 'Ensure secure exchange of information with regulatory authorities.',
 'To protect information during regulatory interactions.',
 'Use secure communication channels. Encrypt sensitive data. Verify recipient identity. Document exchanges.',
 'high', 90, true,
 'Assess secure exchange. Verify: 1) Are channels secure? 2) Is encryption used? 3) Are exchanges documented?'),

('AIACT-85.1', 'eu-ai-act', '85.1', 'Penalties', 'Compliance Program',
 'Penalty Avoidance Compliance Program',
 'Implement comprehensive compliance program to avoid administrative fines and penalties.',
 'To prevent regulatory sanctions.',
 'Establish compliance program. Cover all AI Act requirements. Conduct regular reviews. Remediate gaps promptly.',
 'critical', 98, true,
 'Evaluate compliance program. Check: 1) Is program comprehensive? 2) Are reviews conducted? 3) Are gaps remediated?'),

('AIACT-85.2', 'eu-ai-act', '85.2', 'Penalties', 'Prohibited Practices',
 'Prohibited Practice Avoidance',
 'Ensure complete avoidance of prohibited AI practices subject to highest penalty tier (up to 35M EUR or 7% turnover).',
 'To avoid severe penalties for prohibited practices.',
 'Review all AI systems against prohibitions. Implement controls. Conduct regular audits. Document compliance.',
 'critical', 100, true,
 'Assess prohibited practice avoidance. Verify: 1) Are systems reviewed? 2) Are controls implemented? 3) Are audits conducted?'),

('AIACT-85.3', 'eu-ai-act', '85.3', 'Penalties', 'High-Risk Compliance',
 'High-Risk Non-Compliance Avoidance',
 'Ensure compliance with high-risk AI system requirements to avoid second-tier penalties (up to 15M EUR or 3% turnover).',
 'To avoid significant penalties for high-risk non-compliance.',
 'Verify high-risk compliance. Address non-conformities. Maintain evidence. Document compliance status.',
 'critical', 97, true,
 'Evaluate high-risk compliance. Check: 1) Is compliance verified? 2) Are non-conformities addressed? 3) Is evidence maintained?'),

('AIACT-85.4', 'eu-ai-act', '85.4', 'Penalties', 'Information Accuracy',
 'Regulatory Information Accuracy',
 'Ensure accuracy of information provided to notified bodies and authorities to avoid third-tier penalties (up to 7.5M EUR or 1.5% turnover).',
 'To avoid penalties for incorrect information.',
 'Verify information accuracy. Implement quality controls. Review before submission. Correct errors promptly.',
 'high', 94, true,
 'Assess information accuracy. Verify: 1) Is accuracy verified? 2) Are controls in place? 3) Are errors corrected?'),

('AIACT-86.1', 'eu-ai-act', '86.1', 'Penalties', 'GPAI Compliance',
 'GPAI Provider Penalty Avoidance',
 'As GPAI provider, comply with model-specific requirements to avoid dedicated penalty provisions.',
 'To avoid GPAI-specific penalties.',
 'Identify GPAI obligations. Implement required measures. Document compliance. Monitor for changes.',
 'critical', 95, true,
 'Evaluate GPAI compliance. Check: 1) Are obligations identified? 2) Are measures implemented? 3) Is compliance documented?'),

('AIACT-87.1', 'eu-ai-act', '87.1', 'Penalties', 'Mitigating Factors',
 'Penalty Mitigation Preparation',
 'Prepare documentation of mitigating factors in case of enforcement proceedings.',
 'To minimize potential penalties if violations occur.',
 'Document compliance efforts. Record corrective actions. Maintain cooperation evidence. Prepare mitigation arguments.',
 'high', 88, false,
 'Assess mitigation preparation. Verify: 1) Are efforts documented? 2) Are actions recorded? 3) Is evidence maintained?'),

-- ============================================================================
-- TITLE XI: DELEGATION AND COMMITTEE (Articles 97-98) - 3 Controls
-- ============================================================================

('AIACT-97.1', 'eu-ai-act', '97.1', 'Delegation', 'Delegated Acts',
 'Delegated Act Monitoring',
 'Monitor for delegated acts that may amend AI Act requirements and adjust compliance accordingly.',
 'To maintain compliance with evolving requirements.',
 'Monitor Official Journal. Track relevant delegated acts. Assess impact on compliance. Implement changes.',
 'high', 89, true,
 'Evaluate delegated act monitoring. Check: 1) Is monitoring in place? 2) Are impacts assessed? 3) Are changes implemented?'),

('AIACT-97.2', 'eu-ai-act', '97.2', 'Delegation', 'Annex Updates',
 'Annex Amendment Tracking',
 'Track amendments to AI Act Annexes that may affect classification or requirements.',
 'To ensure continued correct classification and compliance.',
 'Monitor Annex amendments. Re-assess classifications. Update compliance measures. Document adjustments.',
 'high', 90, true,
 'Assess Annex tracking. Verify: 1) Are amendments monitored? 2) Are classifications re-assessed? 3) Are measures updated?'),

('AIACT-98.1', 'eu-ai-act', '98.1', 'Delegation', 'Implementing Acts',
 'Implementing Act Compliance',
 'Comply with implementing acts specifying practical arrangements for AI Act requirements.',
 'To meet detailed regulatory specifications.',
 'Monitor implementing acts. Understand requirements. Adjust procedures. Document compliance.',
 'high', 91, true,
 'Evaluate implementing act compliance. Check: 1) Are acts monitored? 2) Are requirements understood? 3) Is compliance documented?'),

-- ============================================================================
-- TITLE XII: FINAL PROVISIONS (Articles 99-113) - 8 Controls
-- ============================================================================

('AIACT-99.1', 'eu-ai-act', '99.1', 'Final Provisions', 'Transition',
 'Transition Period Compliance Planning',
 'Plan and execute compliance transition within applicable timeframes for different AI Act provisions.',
 'To achieve timely full compliance.',
 'Identify applicable transition dates. Plan compliance activities. Execute transition. Verify readiness.',
 'critical', 97, true,
 'Assess transition planning. Verify: 1) Are dates identified? 2) Is plan in place? 3) Is readiness verified?'),

('AIACT-99.2', 'eu-ai-act', '99.2', 'Final Provisions', 'Prohibited Practices',
 'Prohibited Practice Phase-Out',
 'Phase out any prohibited AI practices before February 2, 2025 deadline.',
 'To comply with earliest AI Act deadline.',
 'Identify any prohibited practices. Plan discontinuation. Execute phase-out. Verify elimination.',
 'critical', 100, true,
 'Evaluate prohibited practice phase-out. Check: 1) Are practices identified? 2) Is phase-out executed? 3) Is elimination verified?'),

('AIACT-99.3', 'eu-ai-act', '99.3', 'Final Provisions', 'GPAI Transition',
 'GPAI Model Transition Compliance',
 'Achieve GPAI model compliance before August 2, 2025 deadline.',
 'To comply with GPAI requirements timeline.',
 'Assess GPAI obligations. Implement required measures. Complete before deadline. Document compliance.',
 'critical', 96, true,
 'Assess GPAI transition. Verify: 1) Are obligations assessed? 2) Are measures implemented? 3) Is timeline met?'),

('AIACT-99.4', 'eu-ai-act', '99.4', 'Final Provisions', 'High-Risk Transition',
 'High-Risk System Transition Compliance',
 'Achieve high-risk AI system compliance before August 2, 2026 deadline.',
 'To comply with high-risk requirements timeline.',
 'Plan high-risk compliance program. Implement all requirements. Complete before deadline. Verify compliance.',
 'critical', 95, true,
 'Evaluate high-risk transition. Check: 1) Is program planned? 2) Are requirements implemented? 3) Is timeline met?'),

('AIACT-100.1', 'eu-ai-act', '100.1', 'Final Provisions', 'Existing Systems',
 'Existing AI System Assessment',
 'Assess existing AI systems placed on market before AI Act application for compliance requirements.',
 'To address legacy AI system compliance.',
 'Inventory existing systems. Assess against requirements. Plan remediation. Implement compliance measures.',
 'high', 93, true,
 'Assess existing system evaluation. Verify: 1) Is inventory complete? 2) Is assessment conducted? 3) Is remediation planned?'),

('AIACT-101.1', 'eu-ai-act', '101.1', 'Final Provisions', 'Substantial Modification',
 'Substantial Modification Definition',
 'Define and apply criteria for substantial modification triggering new compliance obligations.',
 'To correctly identify modifications requiring reassessment.',
 'Define modification criteria. Monitor system changes. Assess against criteria. Trigger reassessment when required.',
 'high', 91, true,
 'Evaluate modification definition. Check: 1) Are criteria defined? 2) Are changes monitored? 3) Is reassessment triggered appropriately?'),

('AIACT-102.1', 'eu-ai-act', '102.1', 'Final Provisions', 'Review Preparation',
 'AI Act Review Contribution',
 'Prepare to contribute to periodic AI Act reviews by documenting implementation experience.',
 'To support regulatory improvement.',
 'Document implementation challenges. Record lessons learned. Prepare constructive feedback. Engage in consultations.',
 'low', 78, false,
 'Assess review preparation. Verify: 1) Are challenges documented? 2) Are lessons recorded? 3) Is feedback prepared?'),

('AIACT-113.1', 'eu-ai-act', '113.1', 'Final Provisions', 'Entry Into Force',
 'Full Application Readiness',
 'Achieve full compliance readiness by August 2, 2027 for all remaining AI Act provisions.',
 'To ensure complete AI Act compliance.',
 'Map all remaining requirements. Plan full compliance. Execute implementation. Verify complete readiness.',
 'critical', 94, true,
 'Evaluate full readiness. Check: 1) Are requirements mapped? 2) Is implementation complete? 3) Is readiness verified?')

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
  (SELECT COUNT(*)::text::jsonb FROM compliance_controls WHERE framework_id = 'eu-ai-act')
)
WHERE id = 'eu-ai-act';

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'EU AI Act complete controls migration finished. Total AI Act controls: %',
    (SELECT COUNT(*) FROM compliance_controls WHERE framework_id = 'eu-ai-act');
END $$;
