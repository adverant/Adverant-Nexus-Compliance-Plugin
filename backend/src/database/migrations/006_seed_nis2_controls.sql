-- Migration: 006_seed_nis2_controls.sql
-- Description: Comprehensive NIS2 Directive (2022/2555) controls
-- Total Controls: 48 controls based on Article 21 mandatory elements
-- Author: Nexus Compliance Engine
-- Date: 2025-01-01

-- First, ensure the NIS2 framework exists
INSERT INTO compliance_frameworks (id, name, version, description, category, jurisdiction, effective_date, status)
VALUES (
  'nis2',
  'NIS2 Directive',
  '2022/2555',
  'EU Directive on measures for a high common level of cybersecurity across the Union. Applies to essential and important entities in critical sectors requiring comprehensive cybersecurity risk management measures.',
  'cybersecurity',
  'EU',
  '2024-10-17',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  version = EXCLUDED.version,
  status = EXCLUDED.status;

-- ============================================================================
-- ARTICLE 21: CYBERSECURITY RISK-MANAGEMENT MEASURES
-- 10 Categories of mandatory requirements
-- ============================================================================

INSERT INTO compliance_controls (id, framework_id, control_number, domain, subdomain, title, description, objective, implementation_guidance, risk_category, implementation_priority, automated_test_available, ai_assessment_prompt)
VALUES

-- ============================================================================
-- Category 1: Risk Analysis and Information System Security Policies (5 Controls)
-- ============================================================================

('NIS2-21.2.a-1', 'nis2', '21.2.a.1', 'Risk Management', 'Risk Analysis',
 'Cybersecurity Risk Assessment',
 'Conduct regular risk assessments that identify threats and vulnerabilities to network and information systems, and evaluate the potential impact on operations and service delivery.',
 'To systematically identify and evaluate cybersecurity risks.',
 'Establish risk assessment methodology. Conduct assessments at least annually and upon significant changes. Document threat landscape, vulnerabilities, and impacts. Prioritize risks for treatment.',
 'critical', 100, true,
 'Evaluate cybersecurity risk assessment practices. Check: 1) Is methodology established? 2) Are assessments regular? 3) Are threats and vulnerabilities identified? 4) Is impact evaluated?'),

('NIS2-21.2.a-2', 'nis2', '21.2.a.2', 'Risk Management', 'Security Policies',
 'Information Security Policy Framework',
 'Establish, maintain, and enforce a comprehensive set of information security policies covering network and information systems protection.',
 'To formalize security requirements and expectations.',
 'Develop policy framework covering all critical areas. Obtain management approval. Communicate to all personnel. Review and update annually.',
 'critical', 99, true,
 'Assess security policy framework. Verify: 1) Is framework comprehensive? 2) Is it approved by management? 3) Is it communicated? 4) Is it reviewed annually?'),

('NIS2-21.2.a-3', 'nis2', '21.2.a.3', 'Risk Management', 'Security Policies',
 'Policy Implementation and Enforcement',
 'Implement mechanisms to ensure security policies are effectively applied and deviations are identified and addressed.',
 'To ensure policy compliance.',
 'Establish compliance monitoring. Implement technical controls enforcing policy. Define consequences for non-compliance. Conduct compliance audits.',
 'high', 96, true,
 'Evaluate policy enforcement. Check: 1) Is monitoring in place? 2) Are technical controls implemented? 3) Are consequences defined? 4) Are audits conducted?'),

('NIS2-21.2.a-4', 'nis2', '21.2.a.4', 'Risk Management', 'Risk Treatment',
 'Risk Treatment Planning',
 'Develop and implement risk treatment plans that address identified risks through appropriate mitigation, transfer, acceptance, or avoidance measures.',
 'To systematically address identified risks.',
 'Create treatment plans for prioritized risks. Define controls and actions. Assign responsibilities and timelines. Monitor implementation progress.',
 'high', 97, true,
 'Assess risk treatment. Verify: 1) Are treatment plans developed? 2) Are controls defined? 3) Are responsibilities assigned? 4) Is progress monitored?'),

('NIS2-21.2.a-5', 'nis2', '21.2.a.5', 'Risk Management', 'Governance',
 'Risk Governance and Oversight',
 'Establish governance structures ensuring management body oversight of cybersecurity risk management and approval of risk treatment decisions.',
 'To ensure appropriate governance of cybersecurity risks.',
 'Define governance structure. Establish management reporting. Require management approval for risk acceptance. Document governance activities.',
 'critical', 98, true,
 'Evaluate risk governance. Check: 1) Is governance structure defined? 2) Is management reporting established? 3) Is approval required? 4) Are activities documented?'),

-- ============================================================================
-- Category 2: Incident Handling (5 Controls)
-- ============================================================================

('NIS2-21.2.b-1', 'nis2', '21.2.b.1', 'Incident Management', 'Detection',
 'Incident Detection Capability',
 'Implement capabilities to detect cybersecurity incidents affecting network and information systems in a timely manner.',
 'To enable rapid incident identification.',
 'Deploy security monitoring tools. Implement SIEM or equivalent. Define detection rules and alerts. Ensure 24/7 monitoring coverage.',
 'critical', 98, true,
 'Assess incident detection. Verify: 1) Are monitoring tools deployed? 2) Is SIEM/equivalent in place? 3) Are detection rules defined? 4) Is monitoring 24/7?'),

('NIS2-21.2.b-2', 'nis2', '21.2.b.2', 'Incident Management', 'Response',
 'Incident Response Procedures',
 'Establish and maintain incident response procedures defining roles, responsibilities, and actions for handling cybersecurity incidents.',
 'To ensure coordinated incident response.',
 'Develop incident response plan. Define response team and roles. Create playbooks for common scenarios. Test procedures regularly.',
 'critical', 97, true,
 'Evaluate incident response procedures. Check: 1) Is response plan documented? 2) Are roles defined? 3) Are playbooks created? 4) Are procedures tested?'),

('NIS2-21.2.b-3', 'nis2', '21.2.b.3', 'Incident Management', 'Response',
 'Incident Classification and Triage',
 'Implement processes to classify and prioritize incidents based on severity, impact, and scope to ensure appropriate response allocation.',
 'To focus resources on most critical incidents.',
 'Define classification criteria. Establish severity levels. Create triage procedures. Train response personnel.',
 'high', 94, true,
 'Assess incident classification. Verify: 1) Are criteria defined? 2) Are severity levels established? 3) Are triage procedures documented? 4) Is personnel trained?'),

('NIS2-21.2.b-4', 'nis2', '21.2.b.4', 'Incident Management', 'Notification',
 'Incident Notification to Authorities',
 'Notify competent authorities and CSIRTs of significant incidents within required timeframes (24-hour early warning, 72-hour notification, 1-month final report).',
 'To meet NIS2 notification requirements.',
 'Establish notification procedures. Define significant incident criteria. Create notification templates. Train personnel on requirements.',
 'critical', 99, true,
 'Evaluate authority notification. Check: 1) Are procedures established? 2) Is 24-hour warning met? 3) Is 72-hour notification met? 4) Are final reports submitted?'),

('NIS2-21.2.b-5', 'nis2', '21.2.b.5', 'Incident Management', 'Recovery',
 'Incident Recovery and Lessons Learned',
 'Implement recovery procedures to restore services after incidents and conduct post-incident reviews to improve security measures.',
 'To restore operations and prevent recurrence.',
 'Define recovery procedures. Establish service restoration priorities. Conduct post-incident reviews. Document and implement lessons learned.',
 'high', 95, true,
 'Assess incident recovery. Verify: 1) Are recovery procedures defined? 2) Are priorities established? 3) Are reviews conducted? 4) Are lessons learned implemented?'),

-- ============================================================================
-- Category 3: Business Continuity and Crisis Management (5 Controls)
-- ============================================================================

('NIS2-21.2.c-1', 'nis2', '21.2.c.1', 'Business Continuity', 'Planning',
 'Business Continuity Planning',
 'Develop and maintain business continuity plans ensuring continued operation of critical services during and after cybersecurity incidents.',
 'To ensure service continuity during disruptions.',
 'Identify critical services. Conduct business impact analysis. Develop continuity strategies. Document plans and procedures.',
 'critical', 97, true,
 'Evaluate business continuity planning. Check: 1) Are critical services identified? 2) Is BIA conducted? 3) Are strategies developed? 4) Are plans documented?'),

('NIS2-21.2.c-2', 'nis2', '21.2.c.2', 'Business Continuity', 'Backup',
 'Backup and Recovery Management',
 'Implement backup strategies and recovery procedures ensuring data and system availability, including testing of restoration capabilities.',
 'To enable data and system recovery.',
 'Define backup policies. Implement backup solutions. Test recovery procedures regularly. Store backups securely including off-site.',
 'critical', 98, true,
 'Assess backup management. Verify: 1) Are policies defined? 2) Are solutions implemented? 3) Are procedures tested? 4) Are backups stored securely?'),

('NIS2-21.2.c-3', 'nis2', '21.2.c.3', 'Business Continuity', 'Disaster Recovery',
 'Disaster Recovery Capabilities',
 'Establish disaster recovery capabilities enabling restoration of network and information systems following significant disruptions.',
 'To recover from major incidents.',
 'Develop disaster recovery plan. Define RTOs and RPOs. Establish recovery site if required. Test DR capabilities regularly.',
 'critical', 96, true,
 'Evaluate disaster recovery. Check: 1) Is DR plan developed? 2) Are RTOs/RPOs defined? 3) Is recovery capability established? 4) Is testing conducted?'),

('NIS2-21.2.c-4', 'nis2', '21.2.c.4', 'Business Continuity', 'Crisis Management',
 'Crisis Management Framework',
 'Establish crisis management structures and procedures for managing significant cybersecurity incidents requiring executive decision-making.',
 'To manage major incidents at executive level.',
 'Define crisis management structure. Establish escalation criteria. Create communication procedures. Train executives on crisis response.',
 'high', 93, true,
 'Assess crisis management. Verify: 1) Is structure defined? 2) Are escalation criteria established? 3) Are communications procedures created? 4) Are executives trained?'),

('NIS2-21.2.c-5', 'nis2', '21.2.c.5', 'Business Continuity', 'Testing',
 'Continuity and Recovery Testing',
 'Conduct regular testing and exercises of business continuity and disaster recovery plans to validate effectiveness.',
 'To ensure plans work as intended.',
 'Develop testing schedule. Conduct tabletop exercises. Perform technical tests. Document results and improvements.',
 'high', 94, true,
 'Evaluate continuity testing. Check: 1) Is testing schedule defined? 2) Are exercises conducted? 3) Are technical tests performed? 4) Are results documented?'),

-- ============================================================================
-- Category 4: Supply Chain Security (5 Controls)
-- ============================================================================

('NIS2-21.2.d-1', 'nis2', '21.2.d.1', 'Supply Chain', 'Assessment',
 'Supplier Security Assessment',
 'Assess and manage cybersecurity risks from suppliers and service providers, including ICT service providers and managed service providers.',
 'To manage supply chain security risks.',
 'Develop supplier assessment process. Evaluate security capabilities. Conduct periodic reassessments. Document assessments.',
 'high', 95, true,
 'Assess supplier security. Verify: 1) Is assessment process established? 2) Are capabilities evaluated? 3) Are reassessments conducted? 4) Are assessments documented?'),

('NIS2-21.2.d-2', 'nis2', '21.2.d.2', 'Supply Chain', 'Contracts',
 'Security Requirements in Contracts',
 'Include appropriate cybersecurity requirements in contracts with suppliers, covering security measures, incident notification, and audit rights.',
 'To contractually enforce supplier security.',
 'Define standard security clauses. Include in procurement process. Require incident notification. Establish audit rights.',
 'high', 94, true,
 'Evaluate contract requirements. Check: 1) Are clauses defined? 2) Are they included in contracts? 3) Is incident notification required? 4) Are audit rights established?'),

('NIS2-21.2.d-3', 'nis2', '21.2.d.3', 'Supply Chain', 'Monitoring',
 'Ongoing Supplier Monitoring',
 'Monitor supplier security performance and compliance with contractual requirements on an ongoing basis.',
 'To maintain visibility of supplier security.',
 'Establish monitoring mechanisms. Review security reports. Track compliance metrics. Address non-compliance.',
 'medium', 90, true,
 'Assess supplier monitoring. Verify: 1) Are mechanisms established? 2) Are reports reviewed? 3) Are metrics tracked? 4) Is non-compliance addressed?'),

('NIS2-21.2.d-4', 'nis2', '21.2.d.4', 'Supply Chain', 'Product Security',
 'ICT Product and Service Security',
 'Consider security properties of ICT products and services, including vulnerability handling and secure development practices.',
 'To ensure security of acquired ICT.',
 'Evaluate product security during procurement. Consider vendor vulnerability handling. Assess secure development practices. Track product vulnerabilities.',
 'high', 93, true,
 'Evaluate ICT product security. Check: 1) Is security evaluated during procurement? 2) Is vulnerability handling considered? 3) Are development practices assessed?'),

('NIS2-21.2.d-5', 'nis2', '21.2.d.5', 'Supply Chain', 'Coordination',
 'Coordinated Vulnerability Disclosure',
 'Participate in coordinated vulnerability disclosure, both as a reporter of vulnerabilities and as a recipient of vulnerability reports.',
 'To responsibly manage vulnerability information.',
 'Establish vulnerability disclosure process. Define contact for receiving reports. Report discovered vulnerabilities responsibly. Track and remediate.',
 'medium', 89, true,
 'Assess vulnerability disclosure. Verify: 1) Is process established? 2) Is contact defined? 3) Are vulnerabilities reported responsibly? 4) Is remediation tracked?'),

-- ============================================================================
-- Category 5: Network and Information System Security (5 Controls)
-- ============================================================================

('NIS2-21.2.e-1', 'nis2', '21.2.e.1', 'Network Security', 'Acquisition',
 'Secure System Acquisition',
 'Implement security requirements during the acquisition, development, and maintenance of network and information systems.',
 'To build security into systems from the start.',
 'Define security requirements for procurement. Include security in development lifecycle. Establish maintenance security practices. Document requirements.',
 'high', 95, true,
 'Evaluate secure acquisition. Check: 1) Are requirements defined? 2) Is security in development lifecycle? 3) Are maintenance practices established?'),

('NIS2-21.2.e-2', 'nis2', '21.2.e.2', 'Network Security', 'Development',
 'Secure Development Practices',
 'Apply secure development practices when developing or customizing network and information systems, including secure coding and testing.',
 'To prevent vulnerabilities during development.',
 'Establish secure coding standards. Implement code review. Conduct security testing. Train developers on secure practices.',
 'high', 94, true,
 'Assess secure development. Verify: 1) Are coding standards established? 2) Is code review implemented? 3) Is security testing conducted? 4) Are developers trained?'),

('NIS2-21.2.e-3', 'nis2', '21.2.e.3', 'Network Security', 'Maintenance',
 'Security Patch Management',
 'Implement processes to identify, prioritize, and apply security patches and updates to network and information systems in a timely manner.',
 'To address known vulnerabilities promptly.',
 'Establish patch management process. Monitor for new vulnerabilities. Prioritize based on risk. Test and deploy patches timely.',
 'critical', 97, true,
 'Evaluate patch management. Check: 1) Is process established? 2) Are vulnerabilities monitored? 3) Is prioritization risk-based? 4) Are patches deployed timely?'),

('NIS2-21.2.e-4', 'nis2', '21.2.e.4', 'Network Security', 'Configuration',
 'Security Configuration Management',
 'Establish and maintain secure configurations for network and information systems, including hardening and baseline management.',
 'To maintain secure system configurations.',
 'Define security baselines. Implement configuration management. Monitor for configuration drift. Remediate deviations promptly.',
 'high', 95, true,
 'Assess configuration management. Verify: 1) Are baselines defined? 2) Is management implemented? 3) Is drift monitored? 4) Are deviations remediated?'),

('NIS2-21.2.e-5', 'nis2', '21.2.e.5', 'Network Security', 'Segmentation',
 'Network Segmentation and Access Control',
 'Implement network segmentation and access controls to limit the impact of security incidents and prevent lateral movement.',
 'To contain security incidents.',
 'Design segmented network architecture. Implement access controls between segments. Monitor traffic between zones. Review segmentation periodically.',
 'high', 94, true,
 'Evaluate network segmentation. Check: 1) Is segmentation designed? 2) Are access controls implemented? 3) Is traffic monitored? 4) Is segmentation reviewed?'),

-- ============================================================================
-- Category 6: Vulnerability Handling and Disclosure (4 Controls)
-- ============================================================================

('NIS2-21.2.f-1', 'nis2', '21.2.f.1', 'Vulnerability Management', 'Assessment',
 'Vulnerability Assessment',
 'Conduct regular vulnerability assessments and penetration testing to identify weaknesses in network and information systems.',
 'To proactively identify vulnerabilities.',
 'Establish assessment schedule. Conduct vulnerability scans. Perform penetration testing. Document and track findings.',
 'high', 96, true,
 'Assess vulnerability assessment practices. Verify: 1) Is schedule established? 2) Are scans conducted? 3) Is penetration testing performed? 4) Are findings tracked?'),

('NIS2-21.2.f-2', 'nis2', '21.2.f.2', 'Vulnerability Management', 'Remediation',
 'Vulnerability Remediation',
 'Implement processes to prioritize and remediate identified vulnerabilities based on risk assessment within appropriate timeframes.',
 'To address vulnerabilities before exploitation.',
 'Define remediation SLAs based on severity. Track remediation progress. Verify fixes are effective. Escalate overdue items.',
 'critical', 97, true,
 'Evaluate vulnerability remediation. Check: 1) Are SLAs defined? 2) Is progress tracked? 3) Are fixes verified? 4) Are overdue items escalated?'),

('NIS2-21.2.f-3', 'nis2', '21.2.f.3', 'Vulnerability Management', 'Intelligence',
 'Threat and Vulnerability Intelligence',
 'Monitor threat intelligence sources and vulnerability databases to stay informed of emerging threats and newly discovered vulnerabilities.',
 'To maintain awareness of the threat landscape.',
 'Subscribe to threat intelligence feeds. Monitor vulnerability databases. Share relevant intelligence internally. Update defenses based on intelligence.',
 'high', 93, true,
 'Assess threat intelligence. Verify: 1) Are feeds subscribed? 2) Are databases monitored? 3) Is intelligence shared? 4) Are defenses updated?'),

('NIS2-21.2.f-4', 'nis2', '21.2.f.4', 'Vulnerability Management', 'Disclosure',
 'Vulnerability Disclosure Policy',
 'Establish a vulnerability disclosure policy enabling responsible reporting of security vulnerabilities by external parties.',
 'To enable external vulnerability reporting.',
 'Create disclosure policy. Publish reporting channels. Define handling procedures. Acknowledge and respond to reports.',
 'medium', 88, true,
 'Evaluate disclosure policy. Check: 1) Is policy created? 2) Are channels published? 3) Are procedures defined? 4) Are reports acknowledged?'),

-- ============================================================================
-- Category 7: Cybersecurity Effectiveness Assessment (4 Controls)
-- ============================================================================

('NIS2-21.2.g-1', 'nis2', '21.2.g.1', 'Assessment', 'Internal Audit',
 'Internal Cybersecurity Audits',
 'Conduct internal audits to evaluate the effectiveness of cybersecurity risk management measures and policy compliance.',
 'To verify security measure effectiveness.',
 'Develop audit program. Conduct periodic audits. Document findings. Track remediation of issues.',
 'high', 93, true,
 'Assess internal audits. Verify: 1) Is audit program developed? 2) Are audits periodic? 3) Are findings documented? 4) Is remediation tracked?'),

('NIS2-21.2.g-2', 'nis2', '21.2.g.2', 'Assessment', 'External Assessment',
 'External Security Assessments',
 'Engage independent third parties to assess cybersecurity controls and provide objective evaluation of security posture.',
 'To obtain independent security validation.',
 'Engage qualified assessors. Conduct periodic assessments. Address identified weaknesses. Maintain assessment reports.',
 'high', 91, true,
 'Evaluate external assessments. Check: 1) Are assessors qualified? 2) Are assessments periodic? 3) Are weaknesses addressed? 4) Are reports maintained?'),

('NIS2-21.2.g-3', 'nis2', '21.2.g.3', 'Assessment', 'Metrics',
 'Security Metrics and Reporting',
 'Establish security metrics and reporting mechanisms to measure and communicate the effectiveness of cybersecurity measures to management.',
 'To enable data-driven security management.',
 'Define relevant metrics. Collect metrics data. Generate regular reports. Report to management body.',
 'medium', 89, true,
 'Assess security metrics. Verify: 1) Are metrics defined? 2) Is data collected? 3) Are reports generated? 4) Is management informed?'),

('NIS2-21.2.g-4', 'nis2', '21.2.g.4', 'Assessment', 'Improvement',
 'Continuous Improvement',
 'Implement processes for continuous improvement of cybersecurity based on assessment findings, incidents, and evolving threats.',
 'To continuously enhance security posture.',
 'Identify improvement opportunities. Prioritize improvements. Implement changes. Measure improvement effectiveness.',
 'medium', 88, true,
 'Evaluate continuous improvement. Check: 1) Are opportunities identified? 2) Are improvements prioritized? 3) Are changes implemented? 4) Is effectiveness measured?'),

-- ============================================================================
-- Category 8: Cryptography and Encryption (4 Controls)
-- ============================================================================

('NIS2-21.2.h-1', 'nis2', '21.2.h.1', 'Cryptography', 'Data Protection',
 'Data Encryption',
 'Implement encryption for data at rest and data in transit to protect confidentiality and integrity of sensitive information.',
 'To protect data through encryption.',
 'Identify data requiring encryption. Implement encryption solutions. Use appropriate algorithms and key lengths. Document encryption approach.',
 'critical', 97, true,
 'Assess data encryption. Verify: 1) Is data requiring encryption identified? 2) Is encryption implemented? 3) Are appropriate algorithms used? 4) Is approach documented?'),

('NIS2-21.2.h-2', 'nis2', '21.2.h.2', 'Cryptography', 'Key Management',
 'Cryptographic Key Management',
 'Establish key management practices covering key generation, storage, distribution, rotation, and destruction.',
 'To securely manage cryptographic keys.',
 'Develop key management policy. Implement key storage protection. Define rotation schedules. Document key lifecycle.',
 'high', 95, true,
 'Evaluate key management. Check: 1) Is policy developed? 2) Is storage protected? 3) Are rotation schedules defined? 4) Is lifecycle documented?'),

('NIS2-21.2.h-3', 'nis2', '21.2.h.3', 'Cryptography', 'Standards',
 'Cryptographic Standards',
 'Use recognized and appropriate cryptographic standards, ensuring algorithms and implementations are current and secure.',
 'To use proven cryptographic protections.',
 'Define approved algorithms. Monitor for deprecated standards. Plan for algorithm transitions. Document standards in use.',
 'high', 93, true,
 'Assess cryptographic standards. Verify: 1) Are algorithms approved? 2) Are standards monitored? 3) Are transitions planned? 4) Are standards documented?'),

('NIS2-21.2.h-4', 'nis2', '21.2.h.4', 'Cryptography', 'End-to-End Security',
 'Secure Communications',
 'Implement end-to-end secure communications for sensitive data exchanges, including secure email and encrypted messaging.',
 'To protect communications in transit.',
 'Implement TLS/SSL for web communications. Secure email communications. Protect API communications. Monitor for insecure channels.',
 'high', 94, true,
 'Evaluate secure communications. Check: 1) Is TLS/SSL implemented? 2) Is email secured? 3) Are APIs protected? 4) Are channels monitored?'),

-- ============================================================================
-- Category 9: Human Resources Security and Access Control (5 Controls)
-- ============================================================================

('NIS2-21.2.i-1', 'nis2', '21.2.i.1', 'Access Control', 'Policies',
 'Access Control Policies',
 'Establish and enforce access control policies governing user access to network and information systems based on business need.',
 'To control access to systems and data.',
 'Define access control policy. Implement least privilege. Control privileged access. Review policies regularly.',
 'critical', 97, true,
 'Assess access control policies. Verify: 1) Is policy defined? 2) Is least privilege implemented? 3) Is privileged access controlled? 4) Are policies reviewed?'),

('NIS2-21.2.i-2', 'nis2', '21.2.i.2', 'Access Control', 'Identity Management',
 'Identity and Access Management',
 'Implement identity and access management controls including user provisioning, authentication, and authorization.',
 'To manage user identities and access rights.',
 'Implement IAM solution. Define provisioning process. Enforce strong authentication. Control authorization centrally.',
 'critical', 96, true,
 'Evaluate IAM. Check: 1) Is IAM implemented? 2) Is provisioning defined? 3) Is authentication strong? 4) Is authorization controlled?'),

('NIS2-21.2.i-3', 'nis2', '21.2.i.3', 'Access Control', 'Access Reviews',
 'Regular Access Reviews',
 'Conduct periodic reviews of user access rights to ensure appropriateness and remove unnecessary access.',
 'To maintain appropriate access levels.',
 'Establish access review schedule. Review all access periodically. Recertify or revoke access. Document reviews.',
 'high', 94, true,
 'Assess access reviews. Verify: 1) Is schedule established? 2) Are reviews periodic? 3) Is access recertified/revoked? 4) Are reviews documented?'),

('NIS2-21.2.i-4', 'nis2', '21.2.i.4', 'HR Security', 'Awareness Training',
 'Cybersecurity Awareness Training',
 'Provide regular cybersecurity awareness training to all personnel covering security policies, threats, and best practices.',
 'To ensure personnel security awareness.',
 'Develop training program. Provide initial and ongoing training. Test understanding. Track completion rates.',
 'high', 95, true,
 'Evaluate awareness training. Check: 1) Is program developed? 2) Is training ongoing? 3) Is understanding tested? 4) Are completion rates tracked?'),

('NIS2-21.2.i-5', 'nis2', '21.2.i.5', 'HR Security', 'Asset Management',
 'Asset Lifecycle Security',
 'Implement security controls throughout the asset lifecycle including secure onboarding, transfer, and offboarding of personnel and equipment.',
 'To manage security throughout asset lifecycle.',
 'Define lifecycle procedures. Control access during transitions. Secure equipment disposal. Document asset changes.',
 'high', 92, true,
 'Assess asset lifecycle security. Verify: 1) Are procedures defined? 2) Are transitions controlled? 3) Is disposal secure? 4) Are changes documented?'),

-- ============================================================================
-- Category 10: Multi-Factor Authentication and Secure Communications (5 Controls)
-- ============================================================================

('NIS2-21.2.j-1', 'nis2', '21.2.j.1', 'Authentication', 'MFA',
 'Multi-Factor Authentication',
 'Implement multi-factor authentication for access to network and information systems, particularly for remote access and privileged accounts.',
 'To strengthen authentication security.',
 'Deploy MFA solution. Require MFA for remote access. Require MFA for privileged access. Monitor for MFA bypass.',
 'critical', 98, true,
 'Assess MFA implementation. Verify: 1) Is MFA deployed? 2) Is it required for remote access? 3) Is it required for privileged access? 4) Is bypass monitored?'),

('NIS2-21.2.j-2', 'nis2', '21.2.j.2', 'Authentication', 'Secure Voice/Video',
 'Secure Voice and Video Communications',
 'Implement security measures for voice and video communications to protect against interception and unauthorized access.',
 'To secure voice and video channels.',
 'Encrypt voice/video communications. Control access to conferencing systems. Monitor for unauthorized use. Secure recording storage.',
 'high', 91, true,
 'Evaluate voice/video security. Check: 1) Is encryption implemented? 2) Is access controlled? 3) Is unauthorized use monitored? 4) Are recordings secured?'),

('NIS2-21.2.j-3', 'nis2', '21.2.j.3', 'Authentication', 'Secure Messaging',
 'Secure Text and Messaging',
 'Implement secure messaging solutions for internal communications requiring confidentiality, including instant messaging and chat systems.',
 'To protect messaging communications.',
 'Deploy encrypted messaging. Control approved messaging platforms. Monitor for data leakage. Archive messages as required.',
 'medium', 89, true,
 'Assess messaging security. Verify: 1) Is encryption deployed? 2) Are platforms controlled? 3) Is leakage monitored? 4) Is archiving implemented?'),

('NIS2-21.2.j-4', 'nis2', '21.2.j.4', 'Authentication', 'Emergency Communications',
 'Secure Emergency Communications',
 'Establish secure communication channels for use during cybersecurity emergencies and incidents.',
 'To maintain communications during incidents.',
 'Define emergency communication channels. Test channel availability. Train personnel on use. Document procedures.',
 'high', 92, true,
 'Evaluate emergency communications. Check: 1) Are channels defined? 2) Is availability tested? 3) Is personnel trained? 4) Are procedures documented?'),

('NIS2-21.2.j-5', 'nis2', '21.2.j.5', 'Authentication', 'Continuous Authentication',
 'Continuous Authentication Monitoring',
 'Monitor authentication events and implement continuous authentication measures to detect and respond to unauthorized access attempts.',
 'To detect authentication anomalies.',
 'Monitor authentication events. Implement behavioral analytics. Alert on anomalies. Investigate suspicious activity.',
 'high', 93, true,
 'Assess authentication monitoring. Verify: 1) Are events monitored? 2) Are analytics implemented? 3) Are alerts generated? 4) Is activity investigated?')

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
  RAISE NOTICE 'NIS2 controls migration complete. Total controls: %',
    (SELECT COUNT(*) FROM compliance_controls WHERE framework_id = 'nis2');
END $$;
