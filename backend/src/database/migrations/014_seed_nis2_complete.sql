-- Migration: 014_seed_nis2_complete.sql
-- Description: Complete NIS2 Directive (2022/2555) controls - Articles 15-24 and additional governance
-- Total New Controls: ~65 controls covering remaining NIS2 requirements
-- Note: Article 21.2 categories already covered in 006_seed_nis2_controls.sql
-- Author: Nexus Compliance Engine
-- Date: 2025-01-06

-- ============================================================================
-- ARTICLE 15: JURISDICTION AND TERRITORIALITY (8 Controls)
-- ============================================================================

INSERT INTO compliance_controls (id, framework_id, control_number, domain, subdomain, title, description, objective, implementation_guidance, risk_category, implementation_priority, automated_test_available, ai_assessment_prompt)
VALUES

('NIS2-15.1', 'nis2', '15.1', 'Jurisdiction', 'Establishment',
 'Main Establishment Determination',
 'Determine and document the main establishment within the Union where cybersecurity risk management decisions are primarily made.',
 'To establish clear jurisdictional accountability.',
 'Identify decision-making location. Document establishment criteria. Notify relevant authorities. Maintain establishment records.',
 'high', 92, true,
 'Assess establishment determination. Verify: 1) Is main establishment identified? 2) Is decision-making documented? 3) Are authorities notified?'),

('NIS2-15.2', 'nis2', '15.2', 'Jurisdiction', 'Registration',
 'Entity Registration with Competent Authority',
 'Register with the competent authority of the Member State where the main establishment is located.',
 'To ensure proper regulatory oversight.',
 'Identify competent authority. Submit registration. Provide required information. Maintain registration status.',
 'critical', 97, true,
 'Evaluate registration. Check: 1) Is competent authority identified? 2) Is registration submitted? 3) Is information complete?'),

('NIS2-15.3', 'nis2', '15.3', 'Jurisdiction', 'Representative',
 'Designated Representative (Non-EU Entities)',
 'If established outside the EU but offering services within the EU, designate a representative in a Member State where services are offered.',
 'To ensure accountability for non-EU entities.',
 'Determine if representative required. Appoint representative. Register representative. Document representative authority.',
 'high', 91, false,
 'Assess representative designation. Verify: 1) Is requirement determined? 2) Is representative appointed? 3) Is registration complete?'),

('NIS2-15.4', 'nis2', '15.4', 'Jurisdiction', 'Service Territories',
 'Service Territory Documentation',
 'Document Member States where essential or important services are provided to determine applicable jurisdictions.',
 'To understand multi-jurisdictional obligations.',
 'Map service territories. Identify applicable jurisdictions. Document service scope. Update as services change.',
 'high', 90, true,
 'Evaluate territory documentation. Check: 1) Are territories mapped? 2) Are jurisdictions identified? 3) Is documentation current?'),

('NIS2-15.5', 'nis2', '15.5', 'Jurisdiction', 'Cross-Border Cooperation',
 'Cross-Border Authority Cooperation',
 'Cooperate with competent authorities across Member States when operating cross-border.',
 'To facilitate multi-jurisdictional oversight.',
 'Identify relevant authorities. Establish communication channels. Respond to cross-border requests. Document cooperation.',
 'medium', 87, false,
 'Assess cross-border cooperation. Verify: 1) Are authorities identified? 2) Are channels established? 3) Is cooperation documented?'),

('NIS2-15.6', 'nis2', '15.6', 'Jurisdiction', 'Entity Classification',
 'Essential vs Important Entity Classification',
 'Determine classification as essential or important entity based on NIS2 criteria and sector-specific thresholds.',
 'To understand applicable obligation levels.',
 'Review classification criteria. Assess against thresholds. Document classification rationale. Monitor for changes.',
 'critical', 98, true,
 'Evaluate entity classification. Check: 1) Are criteria reviewed? 2) Is assessment documented? 3) Is classification current?'),

('NIS2-15.7', 'nis2', '15.7', 'Jurisdiction', 'Sector Applicability',
 'Sector and Sub-Sector Identification',
 'Identify applicable sectors and sub-sectors from NIS2 Annexes I and II to determine specific obligations.',
 'To correctly identify sector-specific requirements.',
 'Review Annex I and II. Identify applicable sectors. Document sector classification. Track sector updates.',
 'high', 94, true,
 'Assess sector identification. Verify: 1) Are Annexes reviewed? 2) Are sectors identified? 3) Is classification documented?'),

('NIS2-15.8', 'nis2', '15.8', 'Jurisdiction', 'Threshold Assessment',
 'Size Threshold Assessment',
 'Assess organization against size thresholds (medium enterprise or larger) to confirm NIS2 applicability.',
 'To determine entity scope applicability.',
 'Review size criteria. Assess headcount and financials. Document threshold analysis. Monitor for changes.',
 'high', 93, true,
 'Evaluate threshold assessment. Check: 1) Are criteria reviewed? 2) Is assessment complete? 3) Is analysis documented?'),

-- ============================================================================
-- ARTICLE 16: COMPETENT AUTHORITIES AND SINGLE POINTS OF CONTACT (5 Controls)
-- ============================================================================

('NIS2-16.1', 'nis2', '16.1', 'Competent Authorities', 'Identification',
 'Competent Authority Identification',
 'Identify and maintain current contact information for all relevant national competent authorities.',
 'To enable proper regulatory engagement.',
 'Identify national authorities. Document contact details. Monitor for changes. Establish communication protocols.',
 'high', 93, true,
 'Assess authority identification. Verify: 1) Are authorities identified? 2) Is contact info current? 3) Are protocols established?'),

('NIS2-16.2', 'nis2', '16.2', 'Competent Authorities', 'Single Point of Contact',
 'National SPOC Engagement',
 'Engage with national single points of contact for cross-border cybersecurity matters.',
 'To facilitate cross-border coordination.',
 'Identify national SPOCs. Establish contact. Engage on cross-border matters. Document interactions.',
 'medium', 86, false,
 'Evaluate SPOC engagement. Check: 1) Are SPOCs identified? 2) Is contact established? 3) Is engagement documented?'),

('NIS2-16.3', 'nis2', '16.3', 'Competent Authorities', 'Information Requests',
 'Authority Information Request Response',
 'Respond to information requests from competent authorities within specified timeframes.',
 'To comply with regulatory information requirements.',
 'Establish request handling process. Define response responsibilities. Meet response deadlines. Document all responses.',
 'high', 95, true,
 'Assess information request response. Verify: 1) Is process established? 2) Are deadlines met? 3) Are responses documented?'),

('NIS2-16.4', 'nis2', '16.4', 'Competent Authorities', 'Supervision Cooperation',
 'Supervisory Activity Cooperation',
 'Cooperate with competent authority supervisory activities including inspections, audits, and assessments.',
 'To support regulatory oversight.',
 'Facilitate inspections. Provide requested access. Address findings. Document supervisory activities.',
 'high', 94, true,
 'Evaluate supervision cooperation. Check: 1) Are inspections facilitated? 2) Is access provided? 3) Are findings addressed?'),

('NIS2-16.5', 'nis2', '16.5', 'Competent Authorities', 'Enforcement Response',
 'Enforcement Measure Response',
 'Respond appropriately to enforcement measures including binding instructions, orders, and sanctions.',
 'To comply with regulatory enforcement.',
 'Acknowledge enforcement measures. Implement required actions. Report compliance. Document responses.',
 'critical', 98, true,
 'Assess enforcement response. Verify: 1) Are measures acknowledged? 2) Are actions implemented? 3) Is compliance reported?'),

-- ============================================================================
-- ARTICLE 17: CSIRTS AND EU-CYCLONE (8 Controls)
-- ============================================================================

('NIS2-17.1', 'nis2', '17.1', 'CSIRT', 'CSIRT Identification',
 'National CSIRT Identification',
 'Identify and maintain contact information for designated national Computer Security Incident Response Teams (CSIRTs).',
 'To enable incident coordination.',
 'Identify national CSIRT. Document contact procedures. Establish communication channels. Test contact procedures.',
 'critical', 96, true,
 'Assess CSIRT identification. Verify: 1) Is CSIRT identified? 2) Are contacts documented? 3) Are channels established?'),

('NIS2-17.2', 'nis2', '17.2', 'CSIRT', 'Incident Coordination',
 'CSIRT Incident Coordination',
 'Coordinate with national CSIRT during significant cybersecurity incidents.',
 'To ensure effective incident response support.',
 'Define coordination procedures. Establish communication protocols. Share incident information. Follow CSIRT guidance.',
 'critical', 97, true,
 'Evaluate CSIRT coordination. Check: 1) Are procedures defined? 2) Are protocols established? 3) Is information shared?'),

('NIS2-17.3', 'nis2', '17.3', 'CSIRT', 'Threat Intelligence Sharing',
 'CSIRT Threat Intelligence Exchange',
 'Participate in threat intelligence sharing with national CSIRT as appropriate.',
 'To contribute to collective cybersecurity.',
 'Define sharing procedures. Share relevant intelligence. Receive CSIRT intelligence. Apply intelligence to defenses.',
 'high', 90, true,
 'Assess intelligence sharing. Verify: 1) Are procedures defined? 2) Is intelligence shared? 3) Is received intelligence applied?'),

('NIS2-17.4', 'nis2', '17.4', 'CSIRT', 'Vulnerability Coordination',
 'CSIRT Vulnerability Coordination',
 'Coordinate with CSIRT on vulnerability handling and coordinated disclosure.',
 'To support coordinated vulnerability management.',
 'Report significant vulnerabilities. Coordinate disclosure. Follow CSIRT guidance. Document coordination.',
 'high', 89, true,
 'Evaluate vulnerability coordination. Check: 1) Are vulnerabilities reported? 2) Is disclosure coordinated? 3) Is guidance followed?'),

('NIS2-17.5', 'nis2', '17.5', 'CSIRT', 'Technical Assistance',
 'CSIRT Technical Assistance Engagement',
 'Engage CSIRT technical assistance services when available and appropriate.',
 'To leverage CSIRT expertise.',
 'Understand available services. Request assistance appropriately. Implement recommendations. Document engagement.',
 'medium', 85, false,
 'Assess technical assistance. Verify: 1) Are services understood? 2) Is assistance requested appropriately? 3) Are recommendations implemented?'),

('NIS2-17.6', 'nis2', '17.6', 'CSIRT', 'Sectoral CSIRT Engagement',
 'Sector-Specific CSIRT Engagement',
 'Engage with sector-specific CSIRTs where designated for the applicable sector.',
 'To benefit from sector expertise.',
 'Identify sectoral CSIRTs. Establish contact. Share sector-relevant intelligence. Participate in sector activities.',
 'medium', 84, false,
 'Evaluate sectoral engagement. Check: 1) Are sectoral CSIRTs identified? 2) Is contact established? 3) Is intelligence shared?'),

('NIS2-17.7', 'nis2', '17.7', 'CSIRT', 'EU-CyCLONe Awareness',
 'EU-CyCLONe Network Awareness',
 'Maintain awareness of EU Cyber Crisis Liaison Organization Network (EU-CyCLONe) for large-scale incident coordination.',
 'To understand cross-border crisis coordination.',
 'Understand EU-CyCLONe role. Monitor for large-scale incidents. Follow crisis coordination guidance. Document awareness.',
 'medium', 82, false,
 'Assess EU-CyCLONe awareness. Verify: 1) Is role understood? 2) Are incidents monitored? 3) Is guidance followed?'),

('NIS2-17.8', 'nis2', '17.8', 'CSIRT', 'Cross-Border CSIRT Coordination',
 'Cross-Border CSIRT Coordination',
 'Coordinate with CSIRTs across Member States for incidents affecting multiple jurisdictions.',
 'To manage cross-border incidents effectively.',
 'Identify cross-border impact. Engage relevant CSIRTs. Share information across borders. Coordinate response.',
 'high', 88, false,
 'Evaluate cross-border coordination. Check: 1) Is impact identified? 2) Are CSIRTs engaged? 3) Is response coordinated?'),

-- ============================================================================
-- ARTICLE 18: CSIRT REQUIREMENTS (5 Controls)
-- ============================================================================

('NIS2-18.1', 'nis2', '18.1', 'CSIRT Requirements', 'Availability',
 'CSIRT Contact Availability',
 'Ensure ability to contact national CSIRT through multiple accessible communication channels.',
 'To enable timely CSIRT engagement.',
 'Identify CSIRT channels. Test communication paths. Maintain backup contacts. Document contact procedures.',
 'high', 91, true,
 'Assess CSIRT availability. Verify: 1) Are channels identified? 2) Are paths tested? 3) Are procedures documented?'),

('NIS2-18.2', 'nis2', '18.2', 'CSIRT Requirements', 'Service Understanding',
 'CSIRT Service Portfolio Understanding',
 'Understand the services offered by national CSIRT and when to engage them.',
 'To effectively utilize CSIRT services.',
 'Review CSIRT services. Understand engagement criteria. Train relevant personnel. Document service understanding.',
 'medium', 85, false,
 'Evaluate service understanding. Check: 1) Are services reviewed? 2) Are criteria understood? 3) Is personnel trained?'),

('NIS2-18.3', 'nis2', '18.3', 'CSIRT Requirements', 'Secure Communication',
 'Secure CSIRT Communication',
 'Implement secure communication methods for exchanging sensitive information with CSIRT.',
 'To protect incident information.',
 'Identify approved methods. Implement secure channels. Train on secure communication. Verify security.',
 'high', 92, true,
 'Assess secure communication. Verify: 1) Are methods identified? 2) Are channels implemented? 3) Is security verified?'),

('NIS2-18.4', 'nis2', '18.4', 'CSIRT Requirements', 'Response Expectations',
 'CSIRT Response Expectation Alignment',
 'Align internal incident response with CSIRT response capabilities and timeframes.',
 'To ensure coordinated response.',
 'Understand CSIRT response times. Align internal procedures. Coordinate escalations. Document alignment.',
 'medium', 86, true,
 'Evaluate response alignment. Check: 1) Are response times understood? 2) Are procedures aligned? 3) Are escalations coordinated?'),

('NIS2-18.5', 'nis2', '18.5', 'CSIRT Requirements', 'Feedback Loop',
 'CSIRT Feedback and Improvement',
 'Incorporate CSIRT feedback into internal incident response improvement.',
 'To continuously improve incident response.',
 'Collect CSIRT feedback. Analyze improvement opportunities. Implement enhancements. Track improvements.',
 'medium', 83, false,
 'Assess feedback loop. Verify: 1) Is feedback collected? 2) Are opportunities analyzed? 3) Are enhancements implemented?'),

-- ============================================================================
-- ARTICLE 20: MANAGEMENT BODY OBLIGATIONS (8 Controls)
-- ============================================================================

('NIS2-20.1', 'nis2', '20.1', 'Management Body', 'Approval',
 'Management Body Risk Measure Approval',
 'Ensure management body approves cybersecurity risk management measures adopted by the entity.',
 'To ensure executive accountability.',
 'Present measures to management. Obtain formal approval. Document approval. Review periodically.',
 'critical', 99, true,
 'Evaluate management approval. Check: 1) Are measures presented? 2) Is approval formal? 3) Is approval documented?'),

('NIS2-20.2', 'nis2', '20.2', 'Management Body', 'Oversight',
 'Management Body Implementation Oversight',
 'Ensure management body oversees the implementation of cybersecurity measures.',
 'To maintain executive oversight.',
 'Establish reporting mechanisms. Provide regular updates. Escalate issues. Document oversight activities.',
 'critical', 98, true,
 'Assess management oversight. Verify: 1) Are mechanisms established? 2) Are updates provided? 3) Are issues escalated?'),

('NIS2-20.3', 'nis2', '20.3', 'Management Body', 'Accountability',
 'Management Body Accountability',
 'Establish clear accountability of management body members for cybersecurity compliance.',
 'To define executive responsibility.',
 'Define accountability structure. Document responsibilities. Communicate expectations. Track accountability.',
 'critical', 97, true,
 'Evaluate accountability. Check: 1) Is structure defined? 2) Are responsibilities documented? 3) Are expectations communicated?'),

('NIS2-20.4', 'nis2', '20.4', 'Management Body', 'Training',
 'Management Body Cybersecurity Training',
 'Ensure management body members receive regular training on cybersecurity risks and risk management.',
 'To ensure informed executive decision-making.',
 'Develop executive training program. Deliver regular training. Cover current threats. Document training completion.',
 'high', 95, true,
 'Assess management training. Verify: 1) Is program developed? 2) Is training regular? 3) Is completion documented?'),

('NIS2-20.5', 'nis2', '20.5', 'Management Body', 'Employee Training',
 'Employee Cybersecurity Training Mandate',
 'Ensure management body mandates regular cybersecurity training for all employees.',
 'To build organizational security culture.',
 'Establish training mandate. Define training requirements. Monitor compliance. Report to management.',
 'high', 94, true,
 'Evaluate training mandate. Check: 1) Is mandate established? 2) Are requirements defined? 3) Is compliance monitored?'),

('NIS2-20.6', 'nis2', '20.6', 'Management Body', 'Risk Awareness',
 'Management Body Risk Awareness',
 'Maintain management body awareness of current cybersecurity risks and threat landscape.',
 'To enable risk-informed decisions.',
 'Provide regular risk briefings. Share threat intelligence. Update on incidents. Document awareness activities.',
 'high', 93, true,
 'Assess risk awareness. Verify: 1) Are briefings provided? 2) Is intelligence shared? 3) Are activities documented?'),

('NIS2-20.7', 'nis2', '20.7', 'Management Body', 'Resource Allocation',
 'Cybersecurity Resource Allocation',
 'Ensure management body allocates adequate resources for cybersecurity risk management.',
 'To enable effective security measures.',
 'Assess resource requirements. Present to management. Obtain budget approval. Monitor utilization.',
 'high', 92, true,
 'Evaluate resource allocation. Check: 1) Are requirements assessed? 2) Is approval obtained? 3) Is utilization monitored?'),

('NIS2-20.8', 'nis2', '20.8', 'Management Body', 'Performance Review',
 'Cybersecurity Performance Review',
 'Conduct regular management body review of cybersecurity performance and effectiveness.',
 'To ensure continuous improvement.',
 'Define performance metrics. Report to management. Conduct reviews. Track improvement actions.',
 'high', 91, true,
 'Assess performance review. Verify: 1) Are metrics defined? 2) Are reports provided? 3) Are improvements tracked?'),

-- ============================================================================
-- ARTICLE 22: INCIDENT NOTIFICATION (12 Controls)
-- ============================================================================

('NIS2-22.1', 'nis2', '22.1', 'Incident Notification', 'Early Warning',
 'Early Warning Notification (24 Hours)',
 'Submit early warning notification to CSIRT and competent authority within 24 hours of becoming aware of a significant incident.',
 'To enable rapid regulatory awareness.',
 'Define significance criteria. Establish 24-hour process. Create notification template. Test notification capability.',
 'critical', 100, true,
 'Evaluate early warning. Check: 1) Are criteria defined? 2) Is 24-hour timeline met? 3) Is notification complete?'),

('NIS2-22.2', 'nis2', '22.2', 'Incident Notification', 'Incident Notification',
 'Incident Notification (72 Hours)',
 'Submit incident notification updating early warning within 72 hours with assessment of severity and impact.',
 'To provide timely incident details.',
 'Develop assessment process. Create detailed template. Ensure 72-hour compliance. Document notifications.',
 'critical', 99, true,
 'Assess incident notification. Verify: 1) Is assessment conducted? 2) Is 72-hour timeline met? 3) Is severity assessed?'),

('NIS2-22.3', 'nis2', '22.3', 'Incident Notification', 'Final Report',
 'Final Incident Report (One Month)',
 'Submit comprehensive final report within one month of incident notification with root cause analysis and mitigation measures.',
 'To provide complete incident documentation.',
 'Conduct root cause analysis. Document mitigation measures. Prepare final report. Submit within deadline.',
 'high', 96, true,
 'Evaluate final report. Check: 1) Is root cause identified? 2) Are mitigations documented? 3) Is deadline met?'),

('NIS2-22.4', 'nis2', '22.4', 'Incident Notification', 'Ongoing Incidents',
 'Ongoing Incident Updates',
 'Provide progress reports for ongoing incidents extending beyond initial reporting timeframes.',
 'To maintain regulatory visibility.',
 'Track incident progress. Provide regular updates. Document status changes. Communicate delays.',
 'high', 93, true,
 'Assess ongoing updates. Verify: 1) Is progress tracked? 2) Are updates regular? 3) Are delays communicated?'),

('NIS2-22.5', 'nis2', '22.5', 'Incident Notification', 'Significance Criteria',
 'Significant Incident Determination',
 'Apply clear criteria to determine whether an incident is significant and requires notification.',
 'To correctly identify reportable incidents.',
 'Define significance thresholds. Assess incidents against criteria. Document determinations. Review criteria periodically.',
 'critical', 97, true,
 'Evaluate significance determination. Check: 1) Are thresholds defined? 2) Are assessments documented? 3) Are criteria reviewed?'),

('NIS2-22.6', 'nis2', '22.6', 'Incident Notification', 'Service Disruption',
 'Service Disruption Assessment',
 'Assess and report the scale and duration of service disruption caused by significant incidents.',
 'To quantify incident impact.',
 'Measure service disruption. Calculate affected users. Document duration. Include in notifications.',
 'high', 94, true,
 'Assess disruption reporting. Verify: 1) Is disruption measured? 2) Are users calculated? 3) Is duration documented?'),

('NIS2-22.7', 'nis2', '22.7', 'Incident Notification', 'Cross-Border Impact',
 'Cross-Border Incident Notification',
 'Notify relevant authorities in other Member States when incidents have cross-border impact.',
 'To enable cross-border coordination.',
 'Assess cross-border impact. Identify relevant authorities. Submit notifications. Coordinate response.',
 'high', 92, true,
 'Evaluate cross-border notification. Check: 1) Is impact assessed? 2) Are authorities identified? 3) Is coordination in place?'),

('NIS2-22.8', 'nis2', '22.8', 'Incident Notification', 'User Notification',
 'Affected User Notification',
 'Notify users or recipients of services when incidents may affect their security or operations.',
 'To enable user protective actions.',
 'Define user notification criteria. Establish notification channels. Provide actionable guidance. Document notifications.',
 'high', 93, true,
 'Assess user notification. Verify: 1) Are criteria defined? 2) Are channels established? 3) Is guidance actionable?'),

('NIS2-22.9', 'nis2', '22.9', 'Incident Notification', 'Cyber Threat Notification',
 'Significant Cyber Threat Notification',
 'Notify potentially affected recipients of significant cyber threats that may impact them.',
 'To enable proactive threat response.',
 'Monitor for significant threats. Identify affected parties. Communicate threats. Provide protective guidance.',
 'high', 91, true,
 'Evaluate threat notification. Check: 1) Are threats monitored? 2) Are parties identified? 3) Is guidance provided?'),

('NIS2-22.10', 'nis2', '22.10', 'Incident Notification', 'Notification Templates',
 'Incident Notification Templates',
 'Develop and maintain templates for all required incident notifications to enable timely reporting.',
 'To streamline notification process.',
 'Create notification templates. Cover all notification types. Test template completeness. Update as requirements change.',
 'high', 90, true,
 'Assess notification templates. Verify: 1) Are templates created? 2) Are all types covered? 3) Are templates tested?'),

('NIS2-22.11', 'nis2', '22.11', 'Incident Notification', 'Notification Testing',
 'Incident Notification Process Testing',
 'Regularly test incident notification processes to ensure they function within required timeframes.',
 'To validate notification capability.',
 'Develop testing schedule. Conduct notification drills. Measure response times. Improve based on results.',
 'high', 89, true,
 'Evaluate notification testing. Check: 1) Is schedule developed? 2) Are drills conducted? 3) Are times measured?'),

('NIS2-22.12', 'nis2', '22.12', 'Incident Notification', 'Public Disclosure',
 'Public Incident Disclosure',
 'Support public disclosure of incidents when required by competent authority to inform the public.',
 'To enable informed public response.',
 'Prepare for public disclosure. Coordinate with authorities. Develop public messaging. Document disclosures.',
 'medium', 85, false,
 'Assess public disclosure. Verify: 1) Is preparation complete? 2) Is coordination with authorities in place? 3) Is messaging prepared?'),

-- ============================================================================
-- ARTICLE 23: SIGNIFICANT INCIDENT REPORTING (8 Controls)
-- ============================================================================

('NIS2-23.1', 'nis2', '23.1', 'Significant Incidents', 'Service Impact',
 'Significant Service Disruption Threshold',
 'Apply thresholds for significant service disruption triggering incident notification requirements.',
 'To correctly identify significant disruptions.',
 'Define disruption thresholds. Measure against thresholds. Document assessments. Apply consistently.',
 'critical', 96, true,
 'Evaluate disruption thresholds. Check: 1) Are thresholds defined? 2) Is measurement consistent? 3) Are assessments documented?'),

('NIS2-23.2', 'nis2', '23.2', 'Significant Incidents', 'Financial Loss',
 'Significant Financial Loss Assessment',
 'Assess financial losses from incidents against significance thresholds.',
 'To identify financially significant incidents.',
 'Define financial thresholds. Calculate incident costs. Assess against thresholds. Document assessments.',
 'high', 93, true,
 'Assess financial impact. Verify: 1) Are thresholds defined? 2) Are costs calculated? 3) Are assessments documented?'),

('NIS2-23.3', 'nis2', '23.3', 'Significant Incidents', 'User Impact',
 'Significant User Impact Assessment',
 'Assess the number of affected users to determine incident significance.',
 'To identify widely impacting incidents.',
 'Define user impact thresholds. Calculate affected users. Assess significance. Document assessments.',
 'high', 94, true,
 'Evaluate user impact. Check: 1) Are thresholds defined? 2) Are users calculated? 3) Is significance assessed?'),

('NIS2-23.4', 'nis2', '23.4', 'Significant Incidents', 'Other Entity Impact',
 'Impact on Other Entities Assessment',
 'Assess whether incidents have caused or could cause significant impact on other entities.',
 'To identify cascading incident effects.',
 'Identify connected entities. Assess cascade potential. Notify affected parties. Document assessments.',
 'high', 92, true,
 'Assess entity impact. Verify: 1) Are entities identified? 2) Is cascade potential assessed? 3) Are parties notified?'),

('NIS2-23.5', 'nis2', '23.5', 'Significant Incidents', 'Duration',
 'Incident Duration Assessment',
 'Consider incident duration in determining significance and notification requirements.',
 'To assess prolonged incident impact.',
 'Track incident duration. Apply duration thresholds. Adjust significance. Document timing.',
 'high', 91, true,
 'Evaluate duration assessment. Check: 1) Is duration tracked? 2) Are thresholds applied? 3) Is timing documented?'),

('NIS2-23.6', 'nis2', '23.6', 'Significant Incidents', 'Recurrence',
 'Recurrent Incident Pattern Detection',
 'Identify and report patterns of recurrent incidents that may indicate systemic issues.',
 'To address recurring security problems.',
 'Track incident patterns. Identify recurrence. Escalate patterns. Address root causes.',
 'high', 90, true,
 'Assess recurrence detection. Verify: 1) Are patterns tracked? 2) Is recurrence identified? 3) Are root causes addressed?'),

('NIS2-23.7', 'nis2', '23.7', 'Significant Incidents', 'Near Misses',
 'Significant Near Miss Reporting',
 'Report near misses that could have resulted in significant incidents if not for defensive measures.',
 'To provide comprehensive incident intelligence.',
 'Define near miss criteria. Track near misses. Report to CSIRT. Document near misses.',
 'medium', 86, true,
 'Evaluate near miss reporting. Check: 1) Are criteria defined? 2) Are near misses tracked? 3) Is reporting conducted?'),

('NIS2-23.8', 'nis2', '23.8', 'Significant Incidents', 'Sector-Specific Thresholds',
 'Sector-Specific Significance Thresholds',
 'Apply any sector-specific significance thresholds established by competent authorities or Commission.',
 'To meet sector-specific requirements.',
 'Identify sector thresholds. Apply in assessments. Monitor for updates. Document compliance.',
 'high', 89, true,
 'Assess sector thresholds. Verify: 1) Are thresholds identified? 2) Are they applied? 3) Are updates monitored?'),

-- ============================================================================
-- ARTICLE 24: INFORMATION SHARING (6 Controls)
-- ============================================================================

('NIS2-24.1', 'nis2', '24.1', 'Information Sharing', 'Voluntary Sharing',
 'Voluntary Cyber Threat Information Sharing',
 'Participate in voluntary information sharing arrangements for cyber threat intelligence.',
 'To contribute to collective defense.',
 'Identify sharing opportunities. Join relevant groups. Share appropriately. Document participation.',
 'medium', 85, true,
 'Evaluate voluntary sharing. Check: 1) Are opportunities identified? 2) Is participation active? 3) Is sharing documented?'),

('NIS2-24.2', 'nis2', '24.2', 'Information Sharing', 'ISACs',
 'Information Sharing and Analysis Centre Participation',
 'Consider participation in Information Sharing and Analysis Centres (ISACs) for the applicable sector.',
 'To benefit from sector intelligence sharing.',
 'Identify relevant ISACs. Evaluate membership. Participate actively. Share relevant intelligence.',
 'medium', 83, false,
 'Assess ISAC participation. Verify: 1) Are ISACs identified? 2) Is membership evaluated? 3) Is participation active?'),

('NIS2-24.3', 'nis2', '24.3', 'Information Sharing', 'Trusted Sharing',
 'Trusted Information Sharing Arrangements',
 'Establish trusted arrangements for sharing sensitive security information with appropriate partners.',
 'To enable effective intelligence sharing.',
 'Define sharing policies. Establish trust frameworks. Implement secure sharing. Monitor sharing activities.',
 'high', 88, true,
 'Evaluate trusted sharing. Check: 1) Are policies defined? 2) Are frameworks established? 3) Is sharing secure?'),

('NIS2-24.4', 'nis2', '24.4', 'Information Sharing', 'TLP Compliance',
 'Traffic Light Protocol Compliance',
 'Apply Traffic Light Protocol (TLP) or equivalent when sharing cybersecurity information.',
 'To protect shared information appropriately.',
 'Train on TLP. Apply correct markings. Respect sharing restrictions. Document TLP compliance.',
 'high', 90, true,
 'Assess TLP compliance. Verify: 1) Is training provided? 2) Are markings applied? 3) Are restrictions respected?'),

('NIS2-24.5', 'nis2', '24.5', 'Information Sharing', 'Anonymization',
 'Information Anonymization and Pseudonymization',
 'Apply anonymization or pseudonymization to shared information to protect sensitive data.',
 'To enable sharing while protecting privacy.',
 'Define anonymization procedures. Apply before sharing. Verify effectiveness. Document processes.',
 'high', 89, true,
 'Evaluate anonymization. Check: 1) Are procedures defined? 2) Is anonymization applied? 3) Is effectiveness verified?'),

('NIS2-24.6', 'nis2', '24.6', 'Information Sharing', 'Receiving Intelligence',
 'Actionable Intelligence Integration',
 'Integrate received threat intelligence into defensive operations and risk management.',
 'To operationalize shared intelligence.',
 'Process received intelligence. Integrate into defenses. Update risk assessments. Track intelligence use.',
 'high', 91, true,
 'Assess intelligence integration. Verify: 1) Is intelligence processed? 2) Is it integrated? 3) Is use tracked?')

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
  (SELECT COUNT(*)::text::jsonb FROM compliance_controls WHERE framework_id = 'nis2')
)
WHERE id = 'nis2';

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'NIS2 complete controls migration finished. Total NIS2 controls: %',
    (SELECT COUNT(*) FROM compliance_controls WHERE framework_id = 'nis2');
END $$;
