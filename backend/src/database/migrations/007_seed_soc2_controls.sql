-- Migration: 007_seed_soc2_controls.sql
-- Description: Comprehensive SOC 2 Trust Services Criteria controls
-- Total Controls: 64 controls across all Trust Services Categories
-- Author: Nexus Compliance Engine
-- Date: 2025-01-01

-- First, ensure the SOC 2 framework exists
INSERT INTO compliance_frameworks (id, name, version, description, category, jurisdiction, effective_date, status)
VALUES (
  'soc2',
  'SOC 2 Type II',
  '2017 TSC',
  'AICPA Service Organization Control 2 report based on Trust Services Criteria. Evaluates controls relevant to security, availability, processing integrity, confidentiality, and privacy of customer data at service organizations.',
  'security',
  'US',
  '2018-04-15',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  version = EXCLUDED.version,
  status = EXCLUDED.status;

-- ============================================================================
-- COMMON CRITERIA (CC) - SECURITY (Required for all SOC 2 reports)
-- ============================================================================

INSERT INTO compliance_controls (id, framework_id, control_number, domain, subdomain, title, description, objective, implementation_guidance, risk_category, implementation_priority, automated_test_available, ai_assessment_prompt)
VALUES

-- CC1: Control Environment (5 Controls)
('SOC2-CC1.1', 'soc2', 'CC1.1', 'Common Criteria', 'Control Environment',
 'Commitment to Integrity and Ethics',
 'The entity demonstrates a commitment to integrity and ethical values.',
 'To establish an ethical foundation for the control environment.',
 'Develop and communicate code of conduct. Establish ethics hotline. Train personnel on ethical expectations. Enforce consequences for violations.',
 'critical', 98, false,
 'Evaluate integrity and ethics commitment. Check: 1) Is code of conduct documented? 2) Is ethics reporting available? 3) Is training provided? 4) Are violations addressed?'),

('SOC2-CC1.2', 'soc2', 'CC1.2', 'Common Criteria', 'Control Environment',
 'Board Independence and Oversight',
 'The board of directors demonstrates independence from management and exercises oversight of the development and performance of internal control.',
 'To ensure independent governance oversight.',
 'Establish independent board/committee. Define oversight responsibilities. Review internal control effectiveness. Document oversight activities.',
 'high', 93, false,
 'Assess board oversight. Verify: 1) Is board/committee independent? 2) Are responsibilities defined? 3) Is effectiveness reviewed? 4) Are activities documented?'),

('SOC2-CC1.3', 'soc2', 'CC1.3', 'Common Criteria', 'Control Environment',
 'Management Structure and Authority',
 'Management establishes, with board oversight, structures, reporting lines, and appropriate authorities and responsibilities.',
 'To define organizational accountability.',
 'Document organizational structure. Define reporting lines. Establish authority levels. Assign responsibilities clearly.',
 'high', 95, true,
 'Evaluate management structure. Check: 1) Is structure documented? 2) Are reporting lines clear? 3) Are authorities defined? 4) Are responsibilities assigned?'),

('SOC2-CC1.4', 'soc2', 'CC1.4', 'Common Criteria', 'Control Environment',
 'Competence Commitment',
 'The entity demonstrates a commitment to attract, develop, and retain competent individuals.',
 'To ensure qualified personnel.',
 'Define competency requirements. Implement hiring standards. Provide training and development. Conduct performance evaluations.',
 'high', 92, false,
 'Assess competence commitment. Verify: 1) Are requirements defined? 2) Are hiring standards applied? 3) Is training provided? 4) Are evaluations conducted?'),

('SOC2-CC1.5', 'soc2', 'CC1.5', 'Common Criteria', 'Control Environment',
 'Accountability Enforcement',
 'The entity holds individuals accountable for their internal control responsibilities.',
 'To enforce control accountability.',
 'Assign control responsibilities. Establish performance measures. Track control performance. Address control failures.',
 'high', 94, false,
 'Evaluate accountability enforcement. Check: 1) Are responsibilities assigned? 2) Are measures established? 3) Is performance tracked? 4) Are failures addressed?'),

-- CC2: Communication and Information (4 Controls)
('SOC2-CC2.1', 'soc2', 'CC2.1', 'Common Criteria', 'Communication',
 'Internal Information Quality',
 'The entity obtains or generates and uses relevant, quality information to support the functioning of internal control.',
 'To ensure information quality for control purposes.',
 'Define information requirements. Implement quality controls. Validate information accuracy. Protect information integrity.',
 'high', 93, true,
 'Assess information quality. Verify: 1) Are requirements defined? 2) Are quality controls implemented? 3) Is accuracy validated? 4) Is integrity protected?'),

('SOC2-CC2.2', 'soc2', 'CC2.2', 'Common Criteria', 'Communication',
 'Internal Communication',
 'The entity internally communicates information, including objectives and responsibilities for internal control.',
 'To ensure effective internal communication.',
 'Communicate control objectives. Share control responsibilities. Provide policy updates. Enable feedback mechanisms.',
 'high', 91, true,
 'Evaluate internal communication. Check: 1) Are objectives communicated? 2) Are responsibilities shared? 3) Are updates provided? 4) Is feedback enabled?'),

('SOC2-CC2.3', 'soc2', 'CC2.3', 'Common Criteria', 'Communication',
 'External Communication',
 'The entity communicates with external parties regarding matters affecting the functioning of internal control.',
 'To maintain external stakeholder communication.',
 'Communicate with customers about controls. Report to regulators as required. Share security commitments. Handle external inquiries.',
 'medium', 88, true,
 'Assess external communication. Verify: 1) Is customer communication in place? 2) Are regulatory reports submitted? 3) Are commitments shared? 4) Are inquiries handled?'),

('SOC2-CC2.4', 'soc2', 'CC2.4', 'Common Criteria', 'Communication',
 'External Reporting',
 'The entity evaluates and communicates internal control deficiencies in a timely manner to parties responsible for taking corrective action.',
 'To ensure deficiency reporting.',
 'Identify control deficiencies. Assess deficiency severity. Report to responsible parties. Track corrective actions.',
 'high', 92, true,
 'Evaluate deficiency reporting. Check: 1) Are deficiencies identified? 2) Is severity assessed? 3) Is reporting timely? 4) Are actions tracked?'),

-- CC3: Risk Assessment (4 Controls)
('SOC2-CC3.1', 'soc2', 'CC3.1', 'Common Criteria', 'Risk Assessment',
 'Objective Specification',
 'The entity specifies objectives with sufficient clarity to enable the identification and assessment of risks.',
 'To define clear control objectives.',
 'Define security objectives. Establish availability goals. Set processing integrity standards. Document confidentiality requirements.',
 'high', 95, true,
 'Assess objective specification. Verify: 1) Are objectives defined? 2) Are they sufficiently clear? 3) Do they enable risk identification? 4) Are they documented?'),

('SOC2-CC3.2', 'soc2', 'CC3.2', 'Common Criteria', 'Risk Assessment',
 'Risk Identification and Analysis',
 'The entity identifies risks to the achievement of its objectives and analyzes risks as a basis for determining how the risks should be managed.',
 'To identify and analyze risks systematically.',
 'Conduct risk assessments. Identify threats and vulnerabilities. Analyze likelihood and impact. Document risk register.',
 'critical', 97, true,
 'Evaluate risk identification. Check: 1) Are assessments conducted? 2) Are threats identified? 3) Are risks analyzed? 4) Is register documented?'),

('SOC2-CC3.3', 'soc2', 'CC3.3', 'Common Criteria', 'Risk Assessment',
 'Fraud Risk Consideration',
 'The entity considers the potential for fraud in assessing risks to the achievement of objectives.',
 'To address fraud risks.',
 'Assess fraud risk. Consider internal and external threats. Evaluate fraud opportunities. Implement anti-fraud controls.',
 'high', 91, false,
 'Assess fraud risk consideration. Verify: 1) Is fraud risk assessed? 2) Are all threat sources considered? 3) Are opportunities evaluated? 4) Are controls implemented?'),

('SOC2-CC3.4', 'soc2', 'CC3.4', 'Common Criteria', 'Risk Assessment',
 'Significant Change Identification',
 'The entity identifies and assesses changes that could significantly impact the system of internal control.',
 'To manage risks from change.',
 'Monitor for significant changes. Assess change impact on controls. Update risk assessments. Modify controls as needed.',
 'high', 93, true,
 'Evaluate change management. Check: 1) Are changes monitored? 2) Is impact assessed? 3) Are assessments updated? 4) Are controls modified?'),

-- CC4: Monitoring Activities (3 Controls)
('SOC2-CC4.1', 'soc2', 'CC4.1', 'Common Criteria', 'Monitoring',
 'Ongoing and Separate Evaluations',
 'The entity selects, develops, and performs ongoing and/or separate evaluations to ascertain whether components of internal control are present and functioning.',
 'To monitor control effectiveness.',
 'Implement ongoing monitoring. Conduct periodic assessments. Evaluate control operations. Document monitoring results.',
 'high', 94, true,
 'Assess monitoring activities. Verify: 1) Is ongoing monitoring in place? 2) Are periodic assessments conducted? 3) Are operations evaluated? 4) Are results documented?'),

('SOC2-CC4.2', 'soc2', 'CC4.2', 'Common Criteria', 'Monitoring',
 'Deficiency Communication',
 'The entity evaluates and communicates internal control deficiencies in a timely manner to parties responsible.',
 'To ensure deficiencies are addressed.',
 'Identify deficiencies promptly. Assess severity. Communicate to responsible parties. Track remediation.',
 'high', 93, true,
 'Evaluate deficiency handling. Check: 1) Are deficiencies identified promptly? 2) Is severity assessed? 3) Is communication timely? 4) Is remediation tracked?'),

('SOC2-CC4.3', 'soc2', 'CC4.3', 'Common Criteria', 'Monitoring',
 'External Party Assessments',
 'The entity uses external parties to assess system controls and communicate issues.',
 'To obtain independent control assurance.',
 'Engage external assessors. Conduct periodic SOC 2 audits. Review external findings. Implement recommendations.',
 'medium', 89, false,
 'Assess external evaluations. Verify: 1) Are assessors engaged? 2) Are audits periodic? 3) Are findings reviewed? 4) Are recommendations implemented?'),

-- CC5: Control Activities (3 Controls)
('SOC2-CC5.1', 'soc2', 'CC5.1', 'Common Criteria', 'Control Activities',
 'Risk Response Selection',
 'The entity selects and develops control activities that contribute to the mitigation of risks.',
 'To implement appropriate controls.',
 'Map controls to risks. Develop control procedures. Implement technical controls. Document control design.',
 'critical', 96, true,
 'Evaluate control selection. Check: 1) Are controls mapped to risks? 2) Are procedures developed? 3) Are technical controls implemented? 4) Is design documented?'),

('SOC2-CC5.2', 'soc2', 'CC5.2', 'Common Criteria', 'Control Activities',
 'Technology Controls',
 'The entity also selects and develops general control activities over technology to support the achievement of objectives.',
 'To implement IT general controls.',
 'Implement change management. Control logical access. Ensure data backup. Monitor IT operations.',
 'critical', 97, true,
 'Assess technology controls. Verify: 1) Is change management implemented? 2) Is access controlled? 3) Are backups ensured? 4) Are operations monitored?'),

('SOC2-CC5.3', 'soc2', 'CC5.3', 'Common Criteria', 'Control Activities',
 'Policy Deployment',
 'The entity deploys control activities through policies that establish expectations and procedures that put policies into action.',
 'To operationalize controls through policy.',
 'Develop security policies. Create supporting procedures. Train personnel on policies. Monitor policy compliance.',
 'high', 94, true,
 'Evaluate policy deployment. Check: 1) Are policies developed? 2) Are procedures created? 3) Is training provided? 4) Is compliance monitored?'),

-- CC6: Logical and Physical Access Controls (8 Controls)
('SOC2-CC6.1', 'soc2', 'CC6.1', 'Common Criteria', 'Access Controls',
 'Logical Access Security',
 'The entity implements logical access security software, infrastructure, and architectures over protected information assets.',
 'To control logical access to systems.',
 'Implement access control systems. Deploy authentication mechanisms. Enforce authorization. Monitor access attempts.',
 'critical', 98, true,
 'Assess logical access security. Verify: 1) Are access controls implemented? 2) Is authentication deployed? 3) Is authorization enforced? 4) Are attempts monitored?'),

('SOC2-CC6.2', 'soc2', 'CC6.2', 'Common Criteria', 'Access Controls',
 'Credential Management',
 'Prior to issuing system credentials, the entity registers and authorizes new users.',
 'To ensure proper user registration.',
 'Implement user registration process. Verify user identity. Obtain proper authorization. Issue credentials securely.',
 'high', 95, true,
 'Evaluate credential management. Check: 1) Is registration implemented? 2) Is identity verified? 3) Is authorization obtained? 4) Are credentials secure?'),

('SOC2-CC6.3', 'soc2', 'CC6.3', 'Common Criteria', 'Access Controls',
 'Access Removal',
 'The entity authorizes, modifies, or removes access based on valid user changes or role/responsibility changes.',
 'To maintain appropriate access levels.',
 'Process access changes promptly. Remove terminated user access. Modify access for role changes. Document access changes.',
 'high', 96, true,
 'Assess access changes. Verify: 1) Are changes processed promptly? 2) Is terminated access removed? 3) Are role changes reflected? 4) Are changes documented?'),

('SOC2-CC6.4', 'soc2', 'CC6.4', 'Common Criteria', 'Access Controls',
 'Access Restriction',
 'The entity restricts physical access to facilities and protected information assets to authorized personnel.',
 'To control physical access.',
 'Implement physical access controls. Restrict facility access. Protect information assets. Monitor physical access.',
 'high', 93, true,
 'Evaluate physical access. Check: 1) Are controls implemented? 2) Is facility access restricted? 3) Are assets protected? 4) Is access monitored?'),

('SOC2-CC6.5', 'soc2', 'CC6.5', 'Common Criteria', 'Access Controls',
 'Asset Disposal',
 'The entity discontinues logical and physical protections over physical assets only after the ability to read or recover data and software from those assets has been diminished.',
 'To ensure secure asset disposal.',
 'Define disposal procedures. Sanitize data before disposal. Verify data destruction. Document disposal.',
 'high', 91, true,
 'Assess asset disposal. Verify: 1) Are procedures defined? 2) Is data sanitized? 3) Is destruction verified? 4) Is disposal documented?'),

('SOC2-CC6.6', 'soc2', 'CC6.6', 'Common Criteria', 'Access Controls',
 'Boundary Protection',
 'The entity implements logical access security measures to protect against threats from outside its system boundaries.',
 'To protect system boundaries.',
 'Implement firewalls. Deploy intrusion detection/prevention. Segment networks. Monitor boundary traffic.',
 'critical', 97, true,
 'Evaluate boundary protection. Check: 1) Are firewalls implemented? 2) Is IDS/IPS deployed? 3) Are networks segmented? 4) Is traffic monitored?'),

('SOC2-CC6.7', 'soc2', 'CC6.7', 'Common Criteria', 'Access Controls',
 'Data Transmission Protection',
 'The entity restricts the transmission of information to authorized internal and external users and processes.',
 'To protect data in transit.',
 'Encrypt sensitive transmissions. Control data export. Monitor data transfers. Implement DLP controls.',
 'high', 94, true,
 'Assess transmission protection. Verify: 1) Is encryption implemented? 2) Is export controlled? 3) Are transfers monitored? 4) Is DLP in place?'),

('SOC2-CC6.8', 'soc2', 'CC6.8', 'Common Criteria', 'Access Controls',
 'Malicious Software Prevention',
 'The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software.',
 'To protect against malware.',
 'Deploy anti-malware solutions. Update signatures regularly. Scan for malware. Respond to detections.',
 'critical', 96, true,
 'Evaluate malware protection. Check: 1) Is anti-malware deployed? 2) Are signatures updated? 3) Is scanning performed? 4) Are detections handled?'),

-- CC7: System Operations (4 Controls)
('SOC2-CC7.1', 'soc2', 'CC7.1', 'Common Criteria', 'Operations',
 'Vulnerability Detection',
 'The entity uses detection and monitoring procedures to identify changes that could impact system security.',
 'To detect security-relevant changes.',
 'Implement vulnerability scanning. Monitor for configuration changes. Detect unauthorized modifications. Alert on anomalies.',
 'high', 95, true,
 'Assess vulnerability detection. Verify: 1) Is scanning implemented? 2) Are changes monitored? 3) Are modifications detected? 4) Are anomalies alerted?'),

('SOC2-CC7.2', 'soc2', 'CC7.2', 'Common Criteria', 'Operations',
 'Security Incident Monitoring',
 'The entity monitors system components and the operation of those components for anomalies that are indicative of malicious acts, natural disasters, and errors affecting security.',
 'To detect security incidents.',
 'Implement security monitoring. Collect and analyze logs. Detect anomalies. Alert on security events.',
 'critical', 97, true,
 'Evaluate security monitoring. Check: 1) Is monitoring implemented? 2) Are logs analyzed? 3) Are anomalies detected? 4) Are alerts generated?'),

('SOC2-CC7.3', 'soc2', 'CC7.3', 'Common Criteria', 'Operations',
 'Incident Analysis',
 'The entity evaluates security events to determine whether they could or have resulted in a failure to meet its objectives.',
 'To assess security event impact.',
 'Analyze security events. Assess impact on objectives. Prioritize response. Document analysis.',
 'high', 94, true,
 'Assess incident analysis. Verify: 1) Are events analyzed? 2) Is impact assessed? 3) Is response prioritized? 4) Is analysis documented?'),

('SOC2-CC7.4', 'soc2', 'CC7.4', 'Common Criteria', 'Operations',
 'Incident Response',
 'The entity responds to identified security incidents by executing a defined incident response program.',
 'To respond effectively to incidents.',
 'Develop incident response plan. Train response team. Execute response procedures. Document incident handling.',
 'critical', 96, true,
 'Evaluate incident response. Check: 1) Is plan developed? 2) Is team trained? 3) Are procedures executed? 4) Is handling documented?'),

-- CC8: Change Management (1 Control)
('SOC2-CC8.1', 'soc2', 'CC8.1', 'Common Criteria', 'Change Management',
 'Change Management Process',
 'The entity authorizes, designs, develops, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures.',
 'To control system changes.',
 'Implement change management process. Require change authorization. Test changes before deployment. Document all changes.',
 'critical', 97, true,
 'Assess change management. Verify: 1) Is process implemented? 2) Is authorization required? 3) Is testing performed? 4) Are changes documented?'),

-- CC9: Risk Mitigation (2 Controls)
('SOC2-CC9.1', 'soc2', 'CC9.1', 'Common Criteria', 'Risk Mitigation',
 'Risk Treatment Implementation',
 'The entity identifies, selects, and develops risk mitigation activities for risks arising from potential business disruptions.',
 'To mitigate business disruption risks.',
 'Identify disruption risks. Develop mitigation strategies. Implement controls. Test mitigation effectiveness.',
 'high', 93, true,
 'Evaluate risk mitigation. Check: 1) Are risks identified? 2) Are strategies developed? 3) Are controls implemented? 4) Is effectiveness tested?'),

('SOC2-CC9.2', 'soc2', 'CC9.2', 'Common Criteria', 'Risk Mitigation',
 'Vendor Risk Management',
 'The entity assesses and manages risks associated with vendors and business partners.',
 'To manage third-party risks.',
 'Assess vendor risks. Establish security requirements. Monitor vendor compliance. Address non-compliance.',
 'high', 92, true,
 'Assess vendor risk management. Verify: 1) Are risks assessed? 2) Are requirements established? 3) Is compliance monitored? 4) Is non-compliance addressed?'),

-- ============================================================================
-- AVAILABILITY CRITERIA (A1) - 3 Controls
-- ============================================================================

('SOC2-A1.1', 'soc2', 'A1.1', 'Availability', 'Capacity Management',
 'Capacity Planning',
 'The entity maintains, monitors, and evaluates current processing capacity and use of system components to manage capacity demand and to enable the implementation of additional capacity.',
 'To ensure sufficient processing capacity.',
 'Monitor capacity metrics. Forecast capacity needs. Plan for growth. Implement capacity additions.',
 'high', 91, true,
 'Evaluate capacity management. Check: 1) Are metrics monitored? 2) Are needs forecasted? 3) Is growth planned? 4) Are additions implemented?'),

('SOC2-A1.2', 'soc2', 'A1.2', 'Availability', 'Environmental Protection',
 'Environmental Safeguards',
 'The entity authorizes, designs, develops, implements, operates, approves, maintains, and monitors environmental protections, software, data backup, and recovery infrastructure.',
 'To protect against environmental threats.',
 'Implement environmental controls. Protect against fire/flood. Deploy UPS and generators. Monitor environmental conditions.',
 'high', 93, true,
 'Assess environmental protection. Verify: 1) Are controls implemented? 2) Is fire/flood protection in place? 3) Is power protected? 4) Are conditions monitored?'),

('SOC2-A1.3', 'soc2', 'A1.3', 'Availability', 'Recovery',
 'Recovery Procedures',
 'The entity tests recovery plan procedures supporting system recovery to meet its objectives.',
 'To validate recovery capabilities.',
 'Develop recovery procedures. Test recovery regularly. Document test results. Improve based on testing.',
 'critical', 95, true,
 'Evaluate recovery testing. Check: 1) Are procedures developed? 2) Is testing regular? 3) Are results documented? 4) Are improvements made?'),

-- ============================================================================
-- PROCESSING INTEGRITY CRITERIA (PI1) - 5 Controls
-- ============================================================================

('SOC2-PI1.1', 'soc2', 'PI1.1', 'Processing Integrity', 'Input Accuracy',
 'Input Data Completeness and Accuracy',
 'The entity implements policies and procedures over system inputs to result in products, services, and reports that meet the entity''s specifications.',
 'To ensure input data integrity.',
 'Implement input validation. Verify data completeness. Check data accuracy. Reject invalid inputs.',
 'high', 94, true,
 'Assess input controls. Verify: 1) Is validation implemented? 2) Is completeness verified? 3) Is accuracy checked? 4) Are invalid inputs rejected?'),

('SOC2-PI1.2', 'soc2', 'PI1.2', 'Processing Integrity', 'System Processing',
 'Processing Accuracy',
 'The entity implements policies and procedures over system processing to result in products, services, and reports that meet the entity''s specifications.',
 'To ensure processing integrity.',
 'Implement processing controls. Validate processing logic. Monitor for errors. Correct processing issues.',
 'high', 93, true,
 'Evaluate processing accuracy. Check: 1) Are controls implemented? 2) Is logic validated? 3) Are errors monitored? 4) Are issues corrected?'),

('SOC2-PI1.3', 'soc2', 'PI1.3', 'Processing Integrity', 'Output',
 'Output Accuracy',
 'The entity implements policies and procedures over system outputs to result in products, services, and reports that meet the entity''s specifications.',
 'To ensure output integrity.',
 'Validate output accuracy. Verify output completeness. Distribute to authorized recipients. Log output activities.',
 'high', 92, true,
 'Assess output controls. Verify: 1) Is accuracy validated? 2) Is completeness verified? 3) Is distribution controlled? 4) Are activities logged?'),

('SOC2-PI1.4', 'soc2', 'PI1.4', 'Processing Integrity', 'Error Handling',
 'Error Correction',
 'The entity implements policies and procedures to store inputs, items in processing, and outputs completely, accurately, and timely in accordance with system specifications.',
 'To ensure proper data storage and error handling.',
 'Implement error detection. Enable error correction. Maintain data integrity. Document error handling.',
 'high', 91, true,
 'Evaluate error handling. Check: 1) Is detection implemented? 2) Is correction enabled? 3) Is integrity maintained? 4) Is handling documented?'),

('SOC2-PI1.5', 'soc2', 'PI1.5', 'Processing Integrity', 'Data Tracing',
 'Traceability',
 'The entity uses defined processing activities to enable the tracing of products, services, and reports through the system.',
 'To enable processing traceability.',
 'Implement audit trails. Track processing steps. Enable transaction tracing. Retain trace data.',
 'medium', 88, true,
 'Assess traceability. Verify: 1) Are audit trails implemented? 2) Are steps tracked? 3) Is tracing enabled? 4) Is data retained?'),

-- ============================================================================
-- CONFIDENTIALITY CRITERIA (C1) - 2 Controls
-- ============================================================================

('SOC2-C1.1', 'soc2', 'C1.1', 'Confidentiality', 'Identification',
 'Confidential Information Identification',
 'The entity identifies and maintains confidential information to meet the entity''s objectives related to confidentiality.',
 'To properly identify confidential data.',
 'Define confidentiality criteria. Classify data. Label confidential information. Maintain classification.',
 'high', 94, true,
 'Assess confidential data identification. Verify: 1) Are criteria defined? 2) Is data classified? 3) Is information labeled? 4) Is classification maintained?'),

('SOC2-C1.2', 'soc2', 'C1.2', 'Confidentiality', 'Protection',
 'Confidential Information Protection',
 'The entity disposes of confidential information to meet the entity''s objectives related to confidentiality.',
 'To protect confidential information through disposal.',
 'Define disposal procedures. Securely dispose of data. Verify disposal completeness. Document disposal.',
 'high', 92, true,
 'Evaluate confidential disposal. Check: 1) Are procedures defined? 2) Is disposal secure? 3) Is completeness verified? 4) Is disposal documented?'),

-- ============================================================================
-- PRIVACY CRITERIA (P1-P8) - 16 Controls
-- ============================================================================

('SOC2-P1.1', 'soc2', 'P1.1', 'Privacy', 'Notice',
 'Privacy Notice',
 'The entity provides notice to data subjects about its privacy practices.',
 'To inform data subjects about privacy practices.',
 'Develop privacy notice. Include all required elements. Make accessible to data subjects. Update as practices change.',
 'high', 94, true,
 'Assess privacy notice. Verify: 1) Is notice developed? 2) Are required elements included? 3) Is it accessible? 4) Is it updated?'),

('SOC2-P2.1', 'soc2', 'P2.1', 'Privacy', 'Choice and Consent',
 'Choice and Consent Mechanisms',
 'The entity provides data subjects with choice and consent regarding personal information collection, use, and disclosure.',
 'To enable data subject choice.',
 'Implement consent mechanisms. Provide opt-out options. Honor consent preferences. Document consent.',
 'high', 93, true,
 'Evaluate choice and consent. Check: 1) Are mechanisms implemented? 2) Are options provided? 3) Are preferences honored? 4) Is consent documented?'),

('SOC2-P3.1', 'soc2', 'P3.1', 'Privacy', 'Collection',
 'Personal Information Collection',
 'The entity collects personal information only for the purposes identified in the notice.',
 'To limit collection to stated purposes.',
 'Define collection purposes. Limit collection to stated purposes. Document collection practices. Review periodically.',
 'high', 92, true,
 'Assess collection practices. Verify: 1) Are purposes defined? 2) Is collection limited? 3) Are practices documented? 4) Is review periodic?'),

('SOC2-P3.2', 'soc2', 'P3.2', 'Privacy', 'Collection',
 'Collection from Third Parties',
 'The entity collects personal information from third parties only in accordance with its privacy commitments.',
 'To control third-party data collection.',
 'Define third-party collection rules. Verify source compliance. Document data sources. Review collection practices.',
 'medium', 88, true,
 'Evaluate third-party collection. Check: 1) Are rules defined? 2) Is compliance verified? 3) Are sources documented? 4) Are practices reviewed?'),

('SOC2-P4.1', 'soc2', 'P4.1', 'Privacy', 'Use and Retention',
 'Personal Information Use',
 'The entity uses personal information only for the purposes identified in the notice.',
 'To limit use to stated purposes.',
 'Define allowed uses. Limit processing to allowed uses. Monitor for unauthorized use. Document use practices.',
 'high', 93, true,
 'Assess information use. Verify: 1) Are uses defined? 2) Is processing limited? 3) Is unauthorized use monitored? 4) Are practices documented?'),

('SOC2-P4.2', 'soc2', 'P4.2', 'Privacy', 'Use and Retention',
 'Personal Information Retention',
 'The entity retains personal information only for as long as needed to fulfill purposes or as required by law.',
 'To limit retention periods.',
 'Define retention periods. Implement retention controls. Delete after retention expires. Document retention practices.',
 'high', 91, true,
 'Evaluate retention practices. Check: 1) Are periods defined? 2) Are controls implemented? 3) Is deletion performed? 4) Are practices documented?'),

('SOC2-P5.1', 'soc2', 'P5.1', 'Privacy', 'Access',
 'Data Subject Access',
 'The entity provides data subjects with access to their personal information upon request.',
 'To enable data subject access.',
 'Implement access request process. Verify requester identity. Provide data in usable format. Document access requests.',
 'high', 92, true,
 'Assess access processes. Verify: 1) Is process implemented? 2) Is identity verified? 3) Is format usable? 4) Are requests documented?'),

('SOC2-P5.2', 'soc2', 'P5.2', 'Privacy', 'Access',
 'Data Subject Correction',
 'The entity corrects, amends, or appends personal information at the request of the data subject.',
 'To enable data subject correction.',
 'Implement correction process. Verify correction requests. Update all copies. Document corrections.',
 'medium', 89, true,
 'Evaluate correction processes. Check: 1) Is process implemented? 2) Are requests verified? 3) Are copies updated? 4) Are corrections documented?'),

('SOC2-P6.1', 'soc2', 'P6.1', 'Privacy', 'Disclosure',
 'Personal Information Disclosure',
 'The entity discloses personal information to third parties only for the purposes identified in the notice and with consent.',
 'To control third-party disclosure.',
 'Define disclosure purposes. Obtain consent for disclosure. Document disclosures. Review disclosure practices.',
 'high', 93, true,
 'Assess disclosure practices. Verify: 1) Are purposes defined? 2) Is consent obtained? 3) Are disclosures documented? 4) Are practices reviewed?'),

('SOC2-P6.2', 'soc2', 'P6.2', 'Privacy', 'Disclosure',
 'Third-Party Agreements',
 'The entity enters into agreements with third parties that receive personal information.',
 'To contractually protect disclosed data.',
 'Require privacy agreements. Define protection requirements. Monitor compliance. Address non-compliance.',
 'high', 91, true,
 'Evaluate third-party agreements. Check: 1) Are agreements required? 2) Are requirements defined? 3) Is compliance monitored? 4) Is non-compliance addressed?'),

('SOC2-P7.1', 'soc2', 'P7.1', 'Privacy', 'Quality',
 'Personal Information Quality',
 'The entity maintains accurate, complete, and relevant personal information for the purposes identified in the notice.',
 'To maintain data quality.',
 'Implement quality controls. Verify accuracy. Ensure completeness. Review relevance.',
 'medium', 88, true,
 'Assess data quality. Verify: 1) Are controls implemented? 2) Is accuracy verified? 3) Is completeness ensured? 4) Is relevance reviewed?'),

('SOC2-P8.1', 'soc2', 'P8.1', 'Privacy', 'Monitoring and Enforcement',
 'Privacy Compliance Monitoring',
 'The entity monitors compliance with its privacy commitments and procedures.',
 'To ensure privacy compliance.',
 'Monitor privacy practices. Conduct compliance assessments. Identify violations. Address non-compliance.',
 'high', 92, true,
 'Evaluate compliance monitoring. Check: 1) Are practices monitored? 2) Are assessments conducted? 3) Are violations identified? 4) Is non-compliance addressed?'),

('SOC2-P8.2', 'soc2', 'P8.2', 'Privacy', 'Monitoring and Enforcement',
 'Privacy Inquiry Handling',
 'The entity receives and addresses inquiries, complaints, and disputes from data subjects.',
 'To handle privacy inquiries.',
 'Implement inquiry process. Document complaints. Investigate issues. Resolve disputes.',
 'medium', 87, true,
 'Assess inquiry handling. Verify: 1) Is process implemented? 2) Are complaints documented? 3) Are issues investigated? 4) Are disputes resolved?')

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
  (SELECT COUNT(*)::text::jsonb FROM compliance_controls WHERE framework_id = 'soc2')
)
WHERE id = 'soc2';

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'SOC 2 controls migration complete. Total controls: %',
    (SELECT COUNT(*) FROM compliance_controls WHERE framework_id = 'soc2');
END $$;
