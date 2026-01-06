-- Migration: 012_seed_gdpr_complete.sql
-- Description: Complete GDPR controls for missing chapters (I, VI, VII, VIII, IX)
-- Total New Controls: ~90 controls
-- Author: Nexus Compliance Engine
-- Date: 2025-01-01

-- ============================================================================
-- CHAPTER I: GENERAL PROVISIONS (Articles 1-4) - 12 Controls
-- ============================================================================

INSERT INTO compliance_controls (id, framework_id, control_number, domain, subdomain, title, description, objective, implementation_guidance, risk_category, implementation_priority, automated_test_available, ai_assessment_prompt)
VALUES

-- Article 1: Subject-matter and objectives
('GDPR-1.1', 'gdpr', '1.1', 'General Provisions', 'Subject Matter',
 'Fundamental Rights Protection Framework',
 'Establish organizational framework recognizing GDPR''s purpose to protect fundamental rights and freedoms of natural persons, particularly the right to protection of personal data.',
 'To ensure organizational understanding of GDPR''s fundamental purpose and objectives.',
 'Document organizational commitment to fundamental rights protection. Include in data protection policy. Train staff on the purpose and importance of data protection as a fundamental right.',
 'high', 90, false,
 'Assess organizational understanding of GDPR objectives. Check: 1) Is there documented commitment to fundamental rights protection? 2) Do policies reference GDPR''s purpose? 3) Is staff trained on data protection as a fundamental right?'),

('GDPR-1.2', 'gdpr', '1.2', 'General Provisions', 'Subject Matter',
 'Free Movement of Data Compliance',
 'Ensure data protection measures do not restrict or prohibit the free movement of personal data within the Union for reasons connected with personal data protection.',
 'To balance data protection with free movement of data within the EU.',
 'Review internal policies to ensure they do not create unnecessary barriers to intra-EU data transfers. Document lawful basis for any restrictions.',
 'medium', 82, false,
 'Evaluate free movement compliance. Verify: 1) Do policies restrict intra-EU data flow? 2) Are any restrictions justified? 3) Is free movement principle documented?'),

-- Article 2: Material scope
('GDPR-2.1', 'gdpr', '2.1', 'General Provisions', 'Material Scope',
 'Automated Processing Scope Assessment',
 'Assess whether processing activities fall within GDPR material scope, including processing wholly or partly by automated means or forming part of a filing system.',
 'To ensure correct identification of in-scope processing activities.',
 'Conduct data mapping to identify all automated processing and structured filing systems. Document scope assessment for each processing activity.',
 'critical', 95, true,
 'Assess material scope identification. Check: 1) Is automated processing identified? 2) Are filing systems assessed? 3) Is scope determination documented for each activity?'),

('GDPR-2.2', 'gdpr', '2.2', 'General Provisions', 'Material Scope',
 'Exclusion Assessment',
 'Properly identify and document any processing activities that fall outside GDPR scope (personal/household activities, national security, law enforcement under specific directives).',
 'To correctly apply GDPR scope exclusions.',
 'Assess processing activities against Article 2(2) exclusions. Document any activities claimed to be out of scope with legal justification. Review regularly.',
 'high', 88, false,
 'Evaluate exclusion assessment. Verify: 1) Are exclusions properly identified? 2) Is justification documented? 3) Are assessments reviewed regularly?'),

-- Article 3: Territorial scope
('GDPR-3.1', 'gdpr', '3.1', 'General Provisions', 'Territorial Scope',
 'EU Establishment Processing',
 'Apply GDPR to processing in the context of activities of an EU establishment, regardless of whether processing takes place in the Union.',
 'To ensure GDPR applies to all processing linked to EU establishments.',
 'Identify all EU establishments. Map processing activities to establishments. Apply GDPR regardless of where processing servers are located.',
 'critical', 94, true,
 'Assess EU establishment scope. Check: 1) Are EU establishments identified? 2) Is processing mapped to establishments? 3) Is GDPR applied regardless of processing location?'),

('GDPR-3.2', 'gdpr', '3.2', 'General Provisions', 'Territorial Scope',
 'Non-EU Controller/Processor Scope',
 'Apply GDPR when offering goods/services to EU data subjects or monitoring behavior within the Union, even without EU establishment.',
 'To ensure GDPR applies to non-EU entities targeting EU individuals.',
 'Assess whether activities target EU data subjects (offering goods/services, monitoring behavior). Apply GDPR even without EU presence if targeting criteria met.',
 'critical', 93, true,
 'Evaluate targeting assessment. Verify: 1) Is EU targeting assessed? 2) Are goods/services offered to EU subjects? 3) Is behavior monitoring identified? 4) Is GDPR applied when criteria met?'),

('GDPR-3.3', 'gdpr', '3.3', 'General Provisions', 'Territorial Scope',
 'Diplomatic Premises Scope',
 'Apply GDPR to processing at diplomatic missions or consular posts where Member State law applies by international law.',
 'To ensure proper scope application in diplomatic contexts.',
 'Identify any processing in diplomatic contexts. Assess applicable law. Apply GDPR where Member State law applies.',
 'low', 75, false,
 'Assess diplomatic scope. Check: 1) Is diplomatic processing identified? 2) Is applicable law assessed? 3) Is GDPR applied where Member State law applies?'),

-- Article 4: Definitions
('GDPR-4.1', 'gdpr', '4.1', 'General Provisions', 'Definitions',
 'Personal Data Identification',
 'Correctly identify and document all personal data processed, understanding the broad definition including any information relating to an identified or identifiable natural person.',
 'To ensure comprehensive identification of personal data.',
 'Train staff on personal data definition. Include direct and indirect identifiers. Consider data combination possibilities. Document personal data inventory.',
 'critical', 97, true,
 'Assess personal data identification. Verify: 1) Is staff trained on definition? 2) Are indirect identifiers included? 3) Is data combination risk considered? 4) Is inventory documented?'),

('GDPR-4.2', 'gdpr', '4.2', 'General Provisions', 'Definitions',
 'Processing Activity Identification',
 'Identify and document all processing operations performed on personal data, understanding the comprehensive definition of processing.',
 'To ensure all processing activities are recognized and documented.',
 'Map all operations on personal data: collection, recording, organization, structuring, storage, adaptation, alteration, retrieval, consultation, use, disclosure, alignment, combination, restriction, erasure, destruction.',
 'critical', 96, true,
 'Evaluate processing identification. Check: 1) Are all processing types identified? 2) Is processing mapped comprehensively? 3) Are less obvious processing types (consultation, alignment) included?'),

('GDPR-4.3', 'gdpr', '4.3', 'General Provisions', 'Definitions',
 'Controller/Processor Role Determination',
 'Accurately determine and document controller and processor roles for each processing activity based on who determines purposes and means.',
 'To ensure correct role assignment and responsibility allocation.',
 'Assess each processing relationship. Determine who decides purpose and means. Document role determinations. Review when relationships change.',
 'critical', 95, true,
 'Assess role determination. Verify: 1) Are roles determined for each activity? 2) Is purpose/means analysis conducted? 3) Are determinations documented? 4) Are they reviewed on change?'),

('GDPR-4.4', 'gdpr', '4.4', 'General Provisions', 'Definitions',
 'Consent Validity Assessment',
 'Ensure consent meets the GDPR definition: freely given, specific, informed, and unambiguous indication of wishes through clear affirmative action.',
 'To ensure only valid consent is relied upon as legal basis.',
 'Assess each consent against four criteria. Verify clear affirmative action. Document consent mechanism design. Do not rely on silence, pre-ticked boxes, or inactivity.',
 'critical', 96, true,
 'Evaluate consent validity. Check all criteria: 1) Freely given 2) Specific 3) Informed 4) Unambiguous 5) Clear affirmative action 6) No pre-ticked boxes'),

('GDPR-4.5', 'gdpr', '4.5', 'General Provisions', 'Definitions',
 'Personal Data Breach Definition Awareness',
 'Ensure organizational understanding that personal data breach includes confidentiality, availability, and integrity breaches, whether accidental or unlawful.',
 'To enable comprehensive breach identification.',
 'Train staff on breach definition including: unauthorized disclosure (confidentiality), loss or destruction (availability), unauthorized alteration (integrity). Include accidental incidents.',
 'high', 92, true,
 'Assess breach definition awareness. Verify: 1) Is CIA breach model understood? 2) Are accidental breaches included? 3) Are staff trained on recognition?'),

-- ============================================================================
-- CHAPTER VI: INDEPENDENT SUPERVISORY AUTHORITIES (Articles 51-59) - 18 Controls
-- ============================================================================

-- Article 51: Supervisory Authority
('GDPR-51.1', 'gdpr', '51.1', 'Supervisory Authorities', 'Awareness',
 'Supervisory Authority Identification',
 'Identify and document the competent supervisory authority(ies) for the organization based on establishment and processing activities.',
 'To ensure proper regulatory relationship and communication.',
 'Identify lead supervisory authority (for cross-border processing). Document all relevant SAs. Maintain current contact information. Monitor SA guidance.',
 'high', 91, true,
 'Assess SA identification. Verify: 1) Is lead SA identified? 2) Are other relevant SAs documented? 3) Is contact information current? 4) Is SA guidance monitored?'),

('GDPR-51.2', 'gdpr', '51.2', 'Supervisory Authorities', 'Cooperation',
 'Supervisory Authority Cooperation Readiness',
 'Establish readiness to cooperate with supervisory authorities in performance of their tasks, including providing information and access.',
 'To facilitate regulatory oversight and cooperation.',
 'Designate SA liaison contact (usually DPO). Establish information request response process. Prepare for SA audits. Document cooperation procedures.',
 'high', 90, true,
 'Evaluate cooperation readiness. Check: 1) Is liaison designated? 2) Is request response process established? 3) Is audit readiness in place? 4) Are procedures documented?'),

-- Article 52: Independence
('GDPR-52.1', 'gdpr', '52.1', 'Supervisory Authorities', 'Respect',
 'Supervisory Authority Independence Respect',
 'Respect and not attempt to influence or interfere with the supervisory authority''s independence.',
 'To maintain proper regulatory relationships.',
 'Do not attempt to influence SA decisions. Accept SA findings professionally. Engage through proper channels. Document all SA communications.',
 'high', 89, false,
 'Assess independence respect. Verify: 1) Is there no inappropriate influence? 2) Are findings accepted professionally? 3) Are proper channels used?'),

-- Article 57: Tasks
('GDPR-57.1', 'gdpr', '57.1', 'Supervisory Authorities', 'Task Support',
 'Supervisory Authority Task Support',
 'Support supervisory authority in performing its tasks including monitoring, promoting awareness, providing guidance, handling complaints, and enforcing the regulation.',
 'To enable effective regulatory oversight.',
 'Respond promptly to SA requests. Provide accurate information. Support investigations. Implement required changes.',
 'high', 91, true,
 'Evaluate task support. Check: 1) Are requests responded to promptly? 2) Is information accurate? 3) Are investigations supported? 4) Are changes implemented?'),

('GDPR-57.2', 'gdpr', '57.2', 'Supervisory Authorities', 'Complaint Handling',
 'Complaint to Supervisory Authority Response',
 'Cooperate with SA in handling complaints lodged by data subjects, providing information and access as required.',
 'To support proper complaint resolution.',
 'Respond to SA complaint inquiries within requested timeframes. Provide complete and accurate information. Implement remediation if required.',
 'high', 93, true,
 'Assess complaint response. Verify: 1) Are inquiries responded to in time? 2) Is information complete and accurate? 3) Is remediation implemented?'),

-- Article 58: Powers
('GDPR-58.1', 'gdpr', '58.1', 'Supervisory Authorities', 'Investigative Powers',
 'Investigative Power Cooperation',
 'Cooperate with supervisory authority investigative powers including orders to provide information, data protection audits, access to premises, and access to data.',
 'To enable SA to exercise investigative functions.',
 'Establish procedure for SA information requests. Prepare for on-site audits. Ensure access can be provided to relevant data and systems. Train relevant staff.',
 'critical', 94, true,
 'Evaluate investigative cooperation. Check: 1) Is there an information request procedure? 2) Is audit access prepared? 3) Can data access be provided? 4) Is staff trained?'),

('GDPR-58.2', 'gdpr', '58.2', 'Supervisory Authorities', 'Corrective Powers',
 'Corrective Power Compliance',
 'Comply with SA corrective powers including warnings, reprimands, orders to comply, orders to communicate breaches, bans on processing, and rectification/erasure orders.',
 'To ensure compliance with SA corrective measures.',
 'Establish process for receiving and acting on SA orders. Implement required corrections within specified timeframes. Document compliance actions. Report completion.',
 'critical', 96, true,
 'Assess corrective compliance. Verify: 1) Is there a process for SA orders? 2) Are corrections implemented in time? 3) Are actions documented? 4) Is completion reported?'),

('GDPR-58.3', 'gdpr', '58.3', 'Supervisory Authorities', 'Administrative Fines',
 'Administrative Fine Preparedness',
 'Understand potential administrative fine exposure and have processes to respond to fine proceedings.',
 'To manage administrative fine risk.',
 'Assess fine exposure for processing activities. Maintain insurance or reserves if appropriate. Establish response process for fine proceedings. Know appeal rights.',
 'high', 88, false,
 'Evaluate fine preparedness. Check: 1) Is fine exposure assessed? 2) Is there financial preparedness? 3) Is there a response process? 4) Are appeal rights understood?'),

('GDPR-58.4', 'gdpr', '58.4', 'Supervisory Authorities', 'Authorization Powers',
 'Authorization Compliance',
 'Comply with SA authorization powers including prior consultation requirements, certification approvals, and BCR approvals.',
 'To obtain required SA authorizations.',
 'Identify processing requiring SA authorization. Submit for prior consultation when required. Seek certification or BCR approval as needed. Maintain authorization records.',
 'high', 87, true,
 'Assess authorization compliance. Verify: 1) Is authorization-requiring processing identified? 2) Is prior consultation conducted? 3) Are approvals sought? 4) Are records maintained?'),

-- Article 59: Activity Reports
('GDPR-59.1', 'gdpr', '59.1', 'Supervisory Authorities', 'Reports',
 'Supervisory Authority Report Awareness',
 'Monitor and review supervisory authority annual activity reports for relevant guidance, enforcement trends, and best practices.',
 'To stay informed of regulatory priorities and expectations.',
 'Review SA annual reports when published. Extract relevant guidance. Update practices based on enforcement trends. Share key findings with stakeholders.',
 'medium', 80, false,
 'Evaluate report monitoring. Check: 1) Are SA reports reviewed? 2) Is guidance extracted? 3) Are practices updated? 4) Are findings shared?'),

-- Additional SA-related controls
('GDPR-SA-1', 'gdpr', 'SA.1', 'Supervisory Authorities', 'Communication',
 'Supervisory Authority Communication Channel',
 'Establish and maintain effective communication channels with supervisory authority(ies).',
 'To ensure effective regulatory communication.',
 'Designate primary and backup SA contacts. Establish secure communication methods. Document all SA communications. Track response deadlines.',
 'high', 89, true,
 'Assess communication channels. Verify: 1) Are contacts designated? 2) Are secure methods established? 3) Are communications documented? 4) Are deadlines tracked?'),

('GDPR-SA-2', 'gdpr', 'SA.2', 'Supervisory Authorities', 'Guidance',
 'Supervisory Authority Guidance Monitoring',
 'Monitor and implement relevant supervisory authority guidance, opinions, and recommendations.',
 'To align practices with regulatory expectations.',
 'Subscribe to SA news and guidance. Review new guidance for applicability. Update policies and practices as needed. Document guidance implementation.',
 'high', 88, true,
 'Evaluate guidance implementation. Check: 1) Is guidance monitored? 2) Is applicability assessed? 3) Are practices updated? 4) Is implementation documented?'),

('GDPR-SA-3', 'gdpr', 'SA.3', 'Supervisory Authorities', 'Audit Readiness',
 'Supervisory Authority Audit Preparation',
 'Maintain readiness for supervisory authority audits and inspections at all times.',
 'To demonstrate compliance upon inspection.',
 'Keep all compliance documentation current and accessible. Train key staff on audit procedures. Conduct internal audit readiness assessments. Designate audit liaison.',
 'high', 92, true,
 'Assess audit readiness. Verify: 1) Is documentation current and accessible? 2) Is staff trained? 3) Are readiness assessments conducted? 4) Is liaison designated?'),

('GDPR-SA-4', 'gdpr', 'SA.4', 'Supervisory Authorities', 'Cross-Border',
 'Lead Supervisory Authority Determination',
 'For cross-border processing, correctly identify the lead supervisory authority based on main establishment.',
 'To ensure proper regulatory relationship in cross-border contexts.',
 'Identify main establishment (central administration or place of decisions about processing). Document lead SA determination. Understand one-stop-shop mechanism.',
 'high', 90, true,
 'Evaluate lead SA determination. Check: 1) Is main establishment identified? 2) Is lead SA correctly determined? 3) Is determination documented? 4) Is one-stop-shop understood?'),

('GDPR-SA-5', 'gdpr', 'SA.5', 'Supervisory Authorities', 'Response Timeline',
 'Supervisory Authority Response Timeliness',
 'Respond to supervisory authority requests and orders within required or specified timeframes.',
 'To maintain good regulatory relationships and avoid penalties.',
 'Track SA request deadlines. Implement escalation for approaching deadlines. Request extensions early if needed. Document all response timing.',
 'critical', 94, true,
 'Assess response timeliness. Verify: 1) Are deadlines tracked? 2) Is there escalation for approaching deadlines? 3) Are extensions requested early? 4) Is timing documented?'),

('GDPR-SA-6', 'gdpr', 'SA.6', 'Supervisory Authorities', 'Penalties',
 'Supervisory Authority Penalty Response',
 'Have processes to respond appropriately to supervisory authority penalties including fines, warnings, and reprimands.',
 'To manage penalties appropriately.',
 'Establish penalty response procedures. Assess appeal options. Implement required remediation. Document lessons learned.',
 'high', 87, false,
 'Evaluate penalty response. Check: 1) Are response procedures established? 2) Are appeal options assessed? 3) Is remediation implemented? 4) Are lessons documented?'),

-- ============================================================================
-- CHAPTER VII: COOPERATION AND CONSISTENCY (Articles 60-76) - 20 Controls
-- ============================================================================

-- Article 60: Cooperation
('GDPR-60.1', 'gdpr', '60.1', 'Cooperation', 'Lead SA Cooperation',
 'Lead Supervisory Authority Engagement',
 'Engage appropriately with lead supervisory authority in cross-border processing matters.',
 'To ensure proper regulatory engagement in cross-border contexts.',
 'Identify cross-border processing. Engage with lead SA as primary contact. Respond to lead SA inquiries. Implement lead SA decisions.',
 'high', 90, true,
 'Assess lead SA engagement. Verify: 1) Is cross-border processing identified? 2) Is lead SA engaged as primary contact? 3) Are inquiries responded to? 4) Are decisions implemented?'),

('GDPR-60.2', 'gdpr', '60.2', 'Cooperation', 'Concerned SA',
 'Concerned Supervisory Authority Awareness',
 'Be aware of and cooperate with concerned supervisory authorities (where establishment exists or data subjects substantially affected).',
 'To ensure comprehensive regulatory cooperation.',
 'Identify all concerned SAs. Be prepared to engage with multiple SAs. Provide consistent information to all. Implement decisions affecting local activities.',
 'high', 88, true,
 'Evaluate concerned SA awareness. Check: 1) Are concerned SAs identified? 2) Is multi-SA engagement prepared? 3) Is consistent information provided?'),

-- Article 61: Mutual Assistance
('GDPR-61.1', 'gdpr', '61.1', 'Cooperation', 'Mutual Assistance',
 'Mutual Assistance Request Response',
 'Respond to information requests from SAs providing mutual assistance in cross-border matters.',
 'To support SA cooperation mechanisms.',
 'Respond promptly to cross-border information requests. Provide complete information. Support investigations involving multiple SAs.',
 'high', 89, true,
 'Assess mutual assistance response. Verify: 1) Are requests responded to promptly? 2) Is information complete? 3) Are multi-SA investigations supported?'),

-- Article 62: Joint Operations
('GDPR-62.1', 'gdpr', '62.1', 'Cooperation', 'Joint Operations',
 'Joint Operation Cooperation',
 'Cooperate with joint operations conducted by supervisory authorities from multiple Member States.',
 'To support joint regulatory activities.',
 'Understand joint operation authority. Cooperate with visiting SA members. Provide access and information as required. Document joint operation activities.',
 'high', 87, false,
 'Evaluate joint operation readiness. Check: 1) Is authority understood? 2) Is cooperation provided? 3) Is access provided? 4) Are activities documented?'),

-- Article 63: Consistency Mechanism
('GDPR-63.1', 'gdpr', '63.1', 'Cooperation', 'Consistency',
 'Consistency Mechanism Awareness',
 'Be aware of the consistency mechanism and its implications for cross-border processing decisions.',
 'To understand how regulatory consistency affects processing.',
 'Monitor EDPB opinions relevant to processing. Understand how consistency mechanism affects SA decisions. Apply consistent interpretation across jurisdictions.',
 'medium', 83, false,
 'Assess consistency awareness. Verify: 1) Are EDPB opinions monitored? 2) Is consistency mechanism understood? 3) Is consistent interpretation applied?'),

-- Article 64: EDPB Opinions
('GDPR-64.1', 'gdpr', '64.1', 'Cooperation', 'EDPB',
 'EDPB Opinion Monitoring',
 'Monitor and implement European Data Protection Board opinions relevant to processing activities.',
 'To align with EU-wide regulatory guidance.',
 'Subscribe to EDPB publications. Review opinions for applicability. Update practices based on EDPB guidance. Document implementation.',
 'high', 88, true,
 'Evaluate EDPB monitoring. Check: 1) Are publications monitored? 2) Is applicability assessed? 3) Are practices updated? 4) Is implementation documented?'),

('GDPR-64.2', 'gdpr', '64.2', 'Cooperation', 'EDPB',
 'EDPB Guidelines Implementation',
 'Implement EDPB guidelines and recommendations in processing activities.',
 'To follow authoritative interpretive guidance.',
 'Track EDPB guidelines. Assess gaps against guidelines. Update policies and procedures. Train staff on key guidance.',
 'high', 89, true,
 'Assess guidelines implementation. Verify: 1) Are guidelines tracked? 2) Are gaps assessed? 3) Are policies updated? 4) Is staff trained?'),

-- Article 65: Dispute Resolution
('GDPR-65.1', 'gdpr', '65.1', 'Cooperation', 'Disputes',
 'Dispute Resolution Compliance',
 'Comply with binding decisions resulting from EDPB dispute resolution between supervisory authorities.',
 'To ensure compliance with authoritative dispute resolutions.',
 'Monitor dispute resolutions affecting processing. Implement binding decisions. Document compliance with resolved disputes.',
 'high', 86, false,
 'Evaluate dispute compliance. Check: 1) Are resolutions monitored? 2) Are binding decisions implemented? 3) Is compliance documented?'),

-- Article 66: Urgency Procedure
('GDPR-66.1', 'gdpr', '66.1', 'Cooperation', 'Urgency',
 'Urgency Procedure Response',
 'Respond appropriately to urgent provisional measures adopted by supervisory authorities to protect data subject rights.',
 'To comply with urgent regulatory measures.',
 'Establish process for urgent SA communications. Implement provisional measures immediately. Seek clarification if measures unclear. Document compliance.',
 'critical', 93, true,
 'Assess urgency response. Verify: 1) Is urgent communication process established? 2) Are measures implemented immediately? 3) Is clarification sought? 4) Is compliance documented?'),

-- Article 70: EDPB Tasks
('GDPR-70.1', 'gdpr', '70.1', 'Cooperation', 'EDPB Tasks',
 'EDPB Consistency Guidance Awareness',
 'Monitor EDPB activities ensuring consistent application of the Regulation including guidelines, recommendations, and best practices.',
 'To benefit from EDPB consistency guidance.',
 'Monitor EDPB publications on consistent application. Review best practice recommendations. Implement relevant guidance. Stay current on EDPB positions.',
 'medium', 85, true,
 'Evaluate EDPB guidance awareness. Check: 1) Are publications monitored? 2) Are recommendations reviewed? 3) Is guidance implemented? 4) Is currency maintained?'),

-- Additional Cooperation Controls
('GDPR-COOP-1', 'gdpr', 'COOP.1', 'Cooperation', 'Multi-Jurisdiction',
 'Multi-Jurisdiction Compliance Coordination',
 'Coordinate compliance activities across multiple EU jurisdictions where processing affects data subjects in multiple Member States.',
 'To ensure consistent cross-border compliance.',
 'Map processing to affected jurisdictions. Coordinate compliance with local requirements. Maintain consistent practices. Document jurisdictional considerations.',
 'high', 89, true,
 'Assess multi-jurisdiction coordination. Verify: 1) Is processing mapped to jurisdictions? 2) Is compliance coordinated? 3) Are practices consistent? 4) Are considerations documented?'),

('GDPR-COOP-2', 'gdpr', 'COOP.2', 'Cooperation', 'One-Stop-Shop',
 'One-Stop-Shop Mechanism Understanding',
 'Understand and properly apply the one-stop-shop mechanism for cross-border processing.',
 'To streamline regulatory relationships in cross-border contexts.',
 'Document one-stop-shop applicability. Engage lead SA as primary contact. Understand when mechanism applies. Know limitations.',
 'high', 88, false,
 'Evaluate one-stop-shop understanding. Check: 1) Is applicability documented? 2) Is lead SA primary contact? 3) Is application understood? 4) Are limitations known?'),

-- ============================================================================
-- CHAPTER VIII: REMEDIES, LIABILITY AND PENALTIES (Articles 77-84) - 22 Controls
-- ============================================================================

-- Article 77: Right to Lodge Complaint
('GDPR-77.1', 'gdpr', '77.1', 'Remedies', 'Complaints',
 'Complaint Right Information',
 'Inform data subjects of their right to lodge a complaint with a supervisory authority if they consider their rights have been infringed.',
 'To ensure data subjects know how to complain to regulators.',
 'Include complaint right in privacy notices. Provide SA contact information. Explain how to lodge complaint. Make information easily accessible.',
 'high', 92, true,
 'Assess complaint right information. Verify: 1) Is complaint right in privacy notices? 2) Is SA contact provided? 3) Is lodging process explained? 4) Is information accessible?'),

('GDPR-77.2', 'gdpr', '77.2', 'Remedies', 'Complaints',
 'Complaint Handling Support',
 'Support data subjects who wish to lodge complaints with supervisory authorities, without obstructing or discouraging complaint.',
 'To respect data subject right to complain.',
 'Do not discourage SA complaints. Provide SA information on request. Cooperate with SA on complaints. Learn from complaint outcomes.',
 'high', 90, true,
 'Evaluate complaint handling. Check: 1) Are complaints not discouraged? 2) Is SA information provided? 3) Is SA cooperation provided? 4) Are outcomes used for learning?'),

-- Article 78: Right to Judicial Remedy Against SA
('GDPR-78.1', 'gdpr', '78.1', 'Remedies', 'Judicial Remedy',
 'Judicial Remedy Right Awareness',
 'Be aware of data subjects'' right to effective judicial remedy against supervisory authority decisions.',
 'To understand the judicial review framework.',
 'Understand data subject right to challenge SA decisions. Respect judicial processes. Cooperate with courts if involved in data subject proceedings.',
 'medium', 82, false,
 'Assess judicial remedy awareness. Verify: 1) Is data subject right understood? 2) Are judicial processes respected? 3) Is court cooperation provided?'),

-- Article 79: Right to Judicial Remedy Against Controller/Processor
('GDPR-79.1', 'gdpr', '79.1', 'Remedies', 'Litigation',
 'Litigation Preparedness',
 'Prepare for potential judicial proceedings brought by data subjects for GDPR infringements.',
 'To manage litigation risk effectively.',
 'Maintain comprehensive compliance documentation. Preserve relevant records. Establish litigation response procedures. Consider legal insurance or provisions.',
 'high', 89, true,
 'Evaluate litigation preparedness. Check: 1) Is documentation maintained? 2) Are records preserved? 3) Are response procedures established? 4) Is financial preparation in place?'),

('GDPR-79.2', 'gdpr', '79.2', 'Remedies', 'Litigation',
 'Jurisdiction Awareness',
 'Understand that data subjects may bring proceedings in Member State of establishment or residence.',
 'To prepare for multi-jurisdiction litigation possibility.',
 'Map potential litigation jurisdictions. Understand local procedural rules. Maintain legal counsel in key jurisdictions. Document jurisdiction considerations.',
 'medium', 84, false,
 'Assess jurisdiction awareness. Verify: 1) Are jurisdictions mapped? 2) Are local rules understood? 3) Is counsel available? 4) Are considerations documented?'),

-- Article 80: Representation of Data Subjects
('GDPR-80.1', 'gdpr', '80.1', 'Remedies', 'Representation',
 'Representative Body Preparedness',
 'Prepare for potential complaints or proceedings brought by not-for-profit bodies, organizations, or associations on behalf of data subjects.',
 'To manage representative body engagement.',
 'Identify relevant representative bodies in sector. Establish engagement procedures. Respond professionally to representative inquiries. Document interactions.',
 'medium', 85, true,
 'Evaluate representative preparedness. Check: 1) Are relevant bodies identified? 2) Are procedures established? 3) Are responses professional? 4) Are interactions documented?'),

-- Article 81: Suspension of Proceedings
('GDPR-81.1', 'gdpr', '81.1', 'Remedies', 'Proceedings',
 'Parallel Proceedings Awareness',
 'Be aware of potential for suspension of proceedings where parallel proceedings are ongoing in different Member States.',
 'To manage coordinated litigation appropriately.',
 'Track all related proceedings. Notify courts of parallel proceedings if required. Coordinate legal strategy across jurisdictions.',
 'low', 78, false,
 'Assess parallel proceedings awareness. Verify: 1) Are proceedings tracked? 2) Are courts notified? 3) Is strategy coordinated?'),

-- Article 82: Right to Compensation
('GDPR-82.1', 'gdpr', '82.1', 'Remedies', 'Compensation',
 'Compensation Liability Awareness',
 'Understand liability for damage (material or non-material) caused by GDPR infringements.',
 'To understand and manage compensation exposure.',
 'Assess potential compensation liability. Understand joint controller/processor liability. Maintain appropriate insurance. Document liability mitigation measures.',
 'high', 91, true,
 'Evaluate compensation awareness. Check: 1) Is liability assessed? 2) Is joint liability understood? 3) Is insurance maintained? 4) Are mitigation measures documented?'),

('GDPR-82.2', 'gdpr', '82.2', 'Remedies', 'Compensation',
 'Processor Liability Understanding',
 'As processor, understand liability is limited to failure to comply with processor-specific obligations or acting outside controller instructions.',
 'To properly scope processor liability.',
 'Document adherence to controller instructions. Comply with processor-specific obligations (Article 28). Maintain evidence of compliance.',
 'high', 89, true,
 'Assess processor liability understanding. Verify: 1) Is instruction adherence documented? 2) Are processor obligations met? 3) Is compliance evidence maintained?'),

('GDPR-82.3', 'gdpr', '82.3', 'Remedies', 'Compensation',
 'Exemption from Liability Documentation',
 'Maintain documentation to demonstrate no responsibility for the event giving rise to damage, to support exemption from liability.',
 'To preserve defenses to compensation claims.',
 'Maintain comprehensive processing records. Document compliance measures. Preserve evidence of proper conduct. Keep incident records complete.',
 'high', 90, true,
 'Evaluate exemption documentation. Check: 1) Are processing records maintained? 2) Are compliance measures documented? 3) Is proper conduct evidenced? 4) Are incident records complete?'),

('GDPR-82.4', 'gdpr', '82.4', 'Remedies', 'Compensation',
 'Joint Liability Management',
 'Manage joint and several liability with other controllers/processors, including recovery rights.',
 'To properly allocate liability in joint processing.',
 'Document liability allocation agreements. Understand recovery rights. Maintain insurance or indemnities. Document responsibility shares.',
 'high', 88, false,
 'Assess joint liability management. Verify: 1) Are allocation agreements documented? 2) Are recovery rights understood? 3) Is insurance maintained? 4) Are shares documented?'),

-- Article 83: Administrative Fines
('GDPR-83.1', 'gdpr', '83.1', 'Remedies', 'Fines',
 'Fine Criteria Understanding',
 'Understand the factors considered in administrative fine decisions: nature/gravity, intentionality, mitigation measures, responsibility degree, previous infringements, cooperation, data categories, notification, certification, and other factors.',
 'To manage fine risk through understanding decision factors.',
 'Assess processing against fine factors. Maintain mitigation measures. Document cooperation. Track any previous issues. Consider certification.',
 'high', 92, true,
 'Evaluate fine criteria understanding. Check factors: 1) Nature/gravity 2) Intentionality 3) Mitigation 4) Responsibility 5) Previous issues 6) Cooperation 7) Categories 8) Notification 9) Certification'),

('GDPR-83.2', 'gdpr', '83.2', 'Remedies', 'Fines',
 'Lower-Tier Fine Risk Assessment',
 'Assess and manage risk of fines up to EUR 10M or 2% of annual worldwide turnover for controller/processor obligations, certification body, and monitoring body infringements.',
 'To manage lower-tier fine exposure.',
 'Identify processing subject to lower-tier fines. Prioritize compliance with applicable obligations. Document compliance measures.',
 'high', 90, true,
 'Assess lower-tier fine risk. Verify: 1) Is applicable processing identified? 2) Is compliance prioritized? 3) Are measures documented?'),

('GDPR-83.3', 'gdpr', '83.3', 'Remedies', 'Fines',
 'Higher-Tier Fine Risk Assessment',
 'Assess and manage risk of fines up to EUR 20M or 4% of annual worldwide turnover for principles, rights, transfers, and specific national provisions infringements.',
 'To manage higher-tier fine exposure.',
 'Identify processing subject to higher-tier fines. Prioritize compliance with principles, rights, and transfer requirements. Implement robust safeguards.',
 'critical', 95, true,
 'Evaluate higher-tier fine risk. Check: 1) Is applicable processing identified? 2) Are principles/rights/transfers prioritized? 3) Are robust safeguards implemented?'),

('GDPR-83.4', 'gdpr', '83.4', 'Remedies', 'Fines',
 'Non-Compliance with SA Order Fine Awareness',
 'Understand that non-compliance with supervisory authority orders is subject to higher-tier fines.',
 'To ensure prompt compliance with SA orders.',
 'Track SA orders. Ensure timely compliance. Escalate compliance issues immediately. Document compliance with all orders.',
 'critical', 96, true,
 'Assess order compliance. Verify: 1) Are orders tracked? 2) Is timely compliance ensured? 3) Are issues escalated? 4) Is compliance documented?'),

-- Article 84: Penalties
('GDPR-84.1', 'gdpr', '84.1', 'Remedies', 'Penalties',
 'National Penalty Awareness',
 'Be aware of and comply with Member State rules on penalties (including criminal sanctions) for GDPR infringements not subject to administrative fines.',
 'To manage full range of penalty exposure.',
 'Research applicable national penalty provisions. Understand criminal sanction risks in key jurisdictions. Maintain compliance to avoid penalty exposure.',
 'high', 88, false,
 'Evaluate national penalty awareness. Check: 1) Are national provisions researched? 2) Are criminal risks understood? 3) Is compliance maintained?'),

-- Additional Remedies Controls
('GDPR-REM-1', 'gdpr', 'REM.1', 'Remedies', 'Claim Defense',
 'Claim Defense Preparation',
 'Prepare defenses to potential data subject claims and supervisory authority proceedings.',
 'To effectively defend against claims.',
 'Document compliance evidence. Preserve relevant records. Establish legal response team. Maintain relationships with external counsel.',
 'high', 90, true,
 'Assess defense preparation. Verify: 1) Is evidence documented? 2) Are records preserved? 3) Is response team established? 4) Is external counsel available?'),

('GDPR-REM-2', 'gdpr', 'REM.2', 'Remedies', 'Insurance',
 'Cyber and Data Protection Insurance',
 'Maintain appropriate insurance coverage for data protection liability and breach response costs.',
 'To manage financial exposure from data protection incidents.',
 'Assess insurance needs. Obtain appropriate cyber/data protection coverage. Review coverage annually. Document insurance arrangements.',
 'high', 87, true,
 'Evaluate insurance coverage. Check: 1) Are needs assessed? 2) Is appropriate coverage obtained? 3) Is coverage reviewed annually? 4) Are arrangements documented?'),

('GDPR-REM-3', 'gdpr', 'REM.3', 'Remedies', 'Lessons Learned',
 'Complaint and Claim Lessons Learned',
 'Learn from complaints, claims, and regulatory proceedings to improve data protection practices.',
 'To continuously improve through experience.',
 'Conduct root cause analysis of complaints/claims. Identify improvement opportunities. Implement corrective actions. Track recurring issues.',
 'medium', 84, true,
 'Assess lessons learned process. Verify: 1) Is root cause analysis conducted? 2) Are improvements identified? 3) Are corrections implemented? 4) Are recurring issues tracked?'),

-- ============================================================================
-- CHAPTER IX: SPECIFIC PROCESSING SITUATIONS (Articles 85-91) - 18 Controls
-- ============================================================================

-- Article 85: Processing and Freedom of Expression
('GDPR-85.1', 'gdpr', '85.1', 'Specific Situations', 'Expression',
 'Freedom of Expression Balancing',
 'Where processing for journalistic, academic, artistic, or literary purposes, balance data protection with freedom of expression and information.',
 'To properly apply exemptions for expression-related processing.',
 'Identify expression-related processing. Apply national exemptions correctly. Document balancing assessments. Maintain proportionate protections.',
 'high', 86, false,
 'Evaluate expression balancing. Check: 1) Is expression-related processing identified? 2) Are exemptions applied correctly? 3) Are assessments documented? 4) Are protections proportionate?'),

('GDPR-85.2', 'gdpr', '85.2', 'Specific Situations', 'Expression',
 'National Expression Exemption Compliance',
 'Comply with Member State exemptions and derogations for processing for journalistic, academic, artistic, or literary expression.',
 'To correctly apply national expression exemptions.',
 'Research applicable national exemptions. Apply exemptions correctly. Document exemption reliance. Monitor for changes in national law.',
 'medium', 83, false,
 'Assess exemption compliance. Verify: 1) Are exemptions researched? 2) Are they applied correctly? 3) Is reliance documented? 4) Are changes monitored?'),

-- Article 86: Processing and Public Access
('GDPR-86.1', 'gdpr', '86.1', 'Specific Situations', 'Public Access',
 'Public Access Reconciliation',
 'Reconcile data protection requirements with public access to official documents obligations.',
 'To balance data protection with transparency requirements.',
 'Identify public access obligations. Balance with data subject rights. Apply redaction where appropriate. Document reconciliation approach.',
 'medium', 82, false,
 'Evaluate public access reconciliation. Check: 1) Are obligations identified? 2) Is balancing conducted? 3) Is redaction applied? 4) Is approach documented?'),

-- Article 87: Processing of National ID Number
('GDPR-87.1', 'gdpr', '87.1', 'Specific Situations', 'National ID',
 'National ID Number Processing Control',
 'Process national identification numbers only under conditions specified in national law, with appropriate safeguards.',
 'To properly control sensitive national identifier processing.',
 'Identify national ID number processing. Verify national law authorization. Implement required safeguards. Document lawful basis and safeguards.',
 'high', 91, true,
 'Assess national ID processing. Verify: 1) Is processing identified? 2) Is authorization verified? 3) Are safeguards implemented? 4) Is basis documented?'),

-- Article 88: Processing in Employment Context
('GDPR-88.1', 'gdpr', '88.1', 'Specific Situations', 'Employment',
 'Employment Processing Compliance',
 'Comply with Member State rules on processing employee data for recruitment, contract performance, management, planning, health and safety, and collective agreements.',
 'To properly handle employee data processing.',
 'Research applicable employment data rules. Implement required safeguards. Ensure proportionality. Document legal basis and safeguards.',
 'high', 92, true,
 'Evaluate employment processing. Check: 1) Are rules researched? 2) Are safeguards implemented? 3) Is proportionality ensured? 4) Is basis documented?'),

('GDPR-88.2', 'gdpr', '88.2', 'Specific Situations', 'Employment',
 'Employee Monitoring Proportionality',
 'Ensure employee monitoring is proportionate and respects employee dignity, legitimate interests, and fundamental rights.',
 'To balance employer interests with employee rights.',
 'Assess monitoring necessity. Implement least intrusive methods. Inform employees. Limit monitoring scope. Document proportionality assessment.',
 'high', 90, true,
 'Assess monitoring proportionality. Verify: 1) Is necessity assessed? 2) Are least intrusive methods used? 3) Are employees informed? 4) Is assessment documented?'),

-- Article 89: Safeguards for Archiving, Research, Statistics
('GDPR-89.1', 'gdpr', '89.1', 'Specific Situations', 'Research',
 'Research and Statistics Safeguards',
 'Implement appropriate safeguards for processing for archiving in the public interest, scientific or historical research, or statistical purposes.',
 'To enable research processing with proper protections.',
 'Apply technical and organizational safeguards. Use pseudonymization where possible. Apply data minimization. Document safeguards.',
 'high', 89, true,
 'Evaluate research safeguards. Check: 1) Are safeguards implemented? 2) Is pseudonymization applied? 3) Is minimization applied? 4) Are safeguards documented?'),

('GDPR-89.2', 'gdpr', '89.2', 'Specific Situations', 'Research',
 'Research Rights Derogations',
 'Where national law provides derogations from data subject rights for research purposes, apply correctly with required safeguards.',
 'To properly apply research derogations.',
 'Research applicable derogations. Apply only with proper safeguards. Document derogation reliance. Limit to permitted scope.',
 'medium', 85, false,
 'Assess research derogations. Verify: 1) Are derogations researched? 2) Are safeguards applied? 3) Is reliance documented? 4) Is scope limited?'),

-- Article 90: Secrecy Obligations
('GDPR-90.1', 'gdpr', '90.1', 'Specific Situations', 'Secrecy',
 'Professional Secrecy Reconciliation',
 'Reconcile data protection requirements with professional secrecy obligations (attorney-client, medical, etc.).',
 'To balance data protection with professional confidentiality.',
 'Identify professional secrecy contexts. Apply national reconciliation rules. Maintain professional confidentiality. Document approach.',
 'high', 88, false,
 'Evaluate secrecy reconciliation. Check: 1) Are contexts identified? 2) Are rules applied? 3) Is confidentiality maintained? 4) Is approach documented?'),

-- Article 91: Data Protection Rules of Churches
('GDPR-91.1', 'gdpr', '91.1', 'Specific Situations', 'Churches',
 'Church Data Protection Rules Compliance',
 'If applicable, comply with comprehensive data protection rules of churches and religious associations recognized under national law.',
 'To properly apply religious organization data protection frameworks.',
 'Identify if church/religious rules apply. Comply with applicable rules. Ensure rules align with GDPR principles. Document compliance.',
 'medium', 80, false,
 'Assess church rules compliance. Verify: 1) Are applicable rules identified? 2) Is compliance maintained? 3) Are rules GDPR-aligned? 4) Is compliance documented?'),

-- Additional Specific Situation Controls
('GDPR-SPEC-1', 'gdpr', 'SPEC.1', 'Specific Situations', 'Health Data',
 'Health Data Processing Compliance',
 'Comply with Member State conditions and limitations on health data processing including for healthcare purposes.',
 'To properly handle health data processing.',
 'Research national health data rules. Implement required safeguards. Ensure professional secrecy. Document compliance measures.',
 'critical', 94, true,
 'Evaluate health data processing. Check: 1) Are national rules researched? 2) Are safeguards implemented? 3) Is secrecy ensured? 4) Are measures documented?'),

('GDPR-SPEC-2', 'gdpr', 'SPEC.2', 'Specific Situations', 'Genetic Data',
 'Genetic Data Processing Safeguards',
 'Apply enhanced safeguards for genetic data processing as required by Member State law.',
 'To properly protect genetic data.',
 'Identify genetic data processing. Research national requirements. Implement enhanced safeguards. Document protections.',
 'critical', 93, true,
 'Assess genetic data safeguards. Verify: 1) Is processing identified? 2) Are requirements researched? 3) Are safeguards enhanced? 4) Are protections documented?'),

('GDPR-SPEC-3', 'gdpr', 'SPEC.3', 'Specific Situations', 'Biometric Data',
 'Biometric Data Processing Compliance',
 'Comply with Member State conditions on biometric data processing for unique identification.',
 'To properly control biometric identification processing.',
 'Identify biometric processing for identification. Research national conditions. Implement required safeguards. Document compliance.',
 'critical', 92, true,
 'Evaluate biometric processing. Check: 1) Is identification processing identified? 2) Are conditions researched? 3) Are safeguards implemented? 4) Is compliance documented?'),

('GDPR-SPEC-4', 'gdpr', 'SPEC.4', 'Specific Situations', 'Criminal Data',
 'Criminal Record Processing Compliance',
 'Process criminal conviction and offense data only under conditions authorized by national law.',
 'To properly control criminal record processing.',
 'Identify criminal data processing. Verify national law authorization. Apply required safeguards. Limit access appropriately. Document compliance.',
 'critical', 93, true,
 'Assess criminal data processing. Verify: 1) Is processing identified? 2) Is authorization verified? 3) Are safeguards applied? 4) Is access limited? 5) Is compliance documented?'),

('GDPR-SPEC-5', 'gdpr', 'SPEC.5', 'Specific Situations', 'Public Interest',
 'Public Interest Task Processing',
 'Comply with Member State law specifying public interest task processing requirements.',
 'To properly conduct public interest processing.',
 'Identify public interest processing. Verify legal basis in national law. Apply required conditions. Document compliance.',
 'high', 89, false,
 'Evaluate public interest processing. Check: 1) Is processing identified? 2) Is legal basis verified? 3) Are conditions applied? 4) Is compliance documented?'),

('GDPR-SPEC-6', 'gdpr', 'SPEC.6', 'Specific Situations', 'Age Verification',
 'Minor Data Processing Safeguards',
 'Implement appropriate safeguards for processing children''s data including age verification for information society services.',
 'To protect minors in data processing.',
 'Assess if minors are data subjects. Implement age verification if required. Obtain parental consent where needed. Apply enhanced protections.',
 'high', 91, true,
 'Assess minor data safeguards. Verify: 1) Is minor status assessed? 2) Is age verification implemented? 3) Is parental consent obtained? 4) Are protections enhanced?'),

('GDPR-SPEC-7', 'gdpr', 'SPEC.7', 'Specific Situations', 'Deceased',
 'Deceased Person Data Handling',
 'Comply with Member State rules on processing of deceased persons'' data.',
 'To properly handle data of deceased individuals.',
 'Research national rules on deceased data. Apply required protections. Respond to family requests appropriately. Document approach.',
 'medium', 82, false,
 'Evaluate deceased data handling. Check: 1) Are national rules researched? 2) Are protections applied? 3) Are family requests handled? 4) Is approach documented?'),

('GDPR-SPEC-8', 'gdpr', 'SPEC.8', 'Specific Situations', 'Direct Marketing',
 'Direct Marketing Compliance',
 'Comply with specific direct marketing requirements including the right to object and marketing consent.',
 'To ensure lawful direct marketing practices.',
 'Apply lawful basis for marketing (legitimate interests or consent). Provide easy opt-out. Honor objections immediately. Maintain preference records.',
 'high', 93, true,
 'Assess direct marketing compliance. Verify: 1) Is lawful basis applied? 2) Is opt-out easy? 3) Are objections honored immediately? 4) Are preferences recorded?')

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
  (SELECT COUNT(*)::text::jsonb FROM compliance_controls WHERE framework_id = 'gdpr')
)
WHERE id = 'gdpr';

-- Log migration completion
DO $$
DECLARE
  total_controls INTEGER;
  new_controls INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_controls FROM compliance_controls WHERE framework_id = 'gdpr';

  -- Count controls added by this migration (those starting with GDPR-1, GDPR-2, GDPR-3, GDPR-4, GDPR-51, etc.)
  SELECT COUNT(*) INTO new_controls FROM compliance_controls
  WHERE framework_id = 'gdpr'
  AND (
    id LIKE 'GDPR-1.%' OR
    id LIKE 'GDPR-2.%' OR
    id LIKE 'GDPR-3.%' OR
    id LIKE 'GDPR-4.%' OR
    id LIKE 'GDPR-51%' OR
    id LIKE 'GDPR-52%' OR
    id LIKE 'GDPR-57%' OR
    id LIKE 'GDPR-58%' OR
    id LIKE 'GDPR-59%' OR
    id LIKE 'GDPR-SA-%' OR
    id LIKE 'GDPR-60%' OR
    id LIKE 'GDPR-61%' OR
    id LIKE 'GDPR-62%' OR
    id LIKE 'GDPR-63%' OR
    id LIKE 'GDPR-64%' OR
    id LIKE 'GDPR-65%' OR
    id LIKE 'GDPR-66%' OR
    id LIKE 'GDPR-70%' OR
    id LIKE 'GDPR-COOP-%' OR
    id LIKE 'GDPR-77%' OR
    id LIKE 'GDPR-78%' OR
    id LIKE 'GDPR-79%' OR
    id LIKE 'GDPR-80%' OR
    id LIKE 'GDPR-81%' OR
    id LIKE 'GDPR-82%' OR
    id LIKE 'GDPR-83%' OR
    id LIKE 'GDPR-84%' OR
    id LIKE 'GDPR-REM-%' OR
    id LIKE 'GDPR-85%' OR
    id LIKE 'GDPR-86%' OR
    id LIKE 'GDPR-87%' OR
    id LIKE 'GDPR-88%' OR
    id LIKE 'GDPR-89%' OR
    id LIKE 'GDPR-90%' OR
    id LIKE 'GDPR-91%' OR
    id LIKE 'GDPR-SPEC-%'
  );

  RAISE NOTICE 'GDPR complete controls migration complete.';
  RAISE NOTICE 'New controls added by this migration: %', new_controls;
  RAISE NOTICE 'Total GDPR controls after migration: %', total_controls;
END $$;
