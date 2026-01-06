-- Migration: 003_seed_iso27001_complete.sql
-- Description: Complete ISO 27001:2022 Annex A controls (A.6 People, A.7 Physical, A.8 Technological)
-- This adds the remaining 56 controls to complete the full 93 control set

-- Update framework total_controls count
UPDATE compliance_frameworks
SET total_controls = 93, updated_at = NOW()
WHERE id = 'iso27001';

-- ============================================================================
-- A.6 People Controls (8 controls)
-- ============================================================================

INSERT INTO compliance_controls (
  id, framework_id, control_number, domain, subdomain, title, description,
  objective, implementation_guidance, risk_category, implementation_priority,
  automated_test_available, ai_assessment_prompt
) VALUES

-- A.6.1 Screening
('ISO27001-A.6.1', 'iso27001', 'A.6.1', 'People', 'Pre-employment',
 'Screening',
 'Background verification checks on all candidates for employment shall be carried out prior to joining the organization and on an ongoing basis taking into consideration applicable laws, regulations and ethics and shall be proportional to the business requirements, the classification of the information to be accessed and the perceived risks.',
 'To ensure that personnel are suitable for and understand their responsibilities regarding information security.',
 'Implement pre-employment screening including identity verification, qualification checks, employment history verification, criminal background checks (where legally permitted), and credit checks for sensitive roles. Document screening criteria based on role sensitivity and information access levels.',
 'high', 88, true,
 'Evaluate the organization''s personnel screening program. Check for: pre-employment screening policy, screening criteria by role sensitivity, background check processes, verification of qualifications, ongoing screening requirements, and legal compliance for screening activities.'),

-- A.6.2 Terms and conditions of employment
('ISO27001-A.6.2', 'iso27001', 'A.6.2', 'People', 'Pre-employment',
 'Terms and conditions of employment',
 'The employment contractual agreements shall state the personnel''s and the organization''s responsibilities for information security.',
 'To ensure personnel understand their information security responsibilities.',
 'Include information security responsibilities in employment contracts and job descriptions. Define confidentiality obligations, acceptable use requirements, security incident reporting duties, and consequences of policy violations. Ensure contracts cover post-employment obligations.',
 'high', 90, true,
 'Review employment terms and conditions for information security. Check for: security responsibilities in contracts, confidentiality clauses, acceptable use acknowledgment, incident reporting obligations, and post-employment security requirements.'),

-- A.6.3 Information security awareness, education and training
('ISO27001-A.6.3', 'iso27001', 'A.6.3', 'People', 'During employment',
 'Information security awareness, education and training',
 'Personnel of the organization and relevant interested parties shall receive appropriate information security awareness, education and training and regular updates of the organization''s information security policy, topic-specific policies and procedures, as relevant for their job function.',
 'To ensure personnel are aware of their information security responsibilities and can fulfill them.',
 'Develop comprehensive security awareness program including induction training, role-specific training, phishing simulations, regular refresher training, and metrics tracking. Cover topics like password security, social engineering, data handling, incident reporting, and remote working security.',
 'critical', 95, true,
 'Assess the security awareness and training program. Check for: training curriculum coverage, training frequency, role-based training modules, phishing simulation results, training completion rates, effectiveness measurements, and continuous improvement processes.'),

-- A.6.4 Disciplinary process
('ISO27001-A.6.4', 'iso27001', 'A.6.4', 'People', 'During employment',
 'Disciplinary process',
 'A disciplinary process shall be formalized and communicated to take actions against personnel and other relevant interested parties who have committed an information security policy violation.',
 'To ensure there are consequences for information security violations.',
 'Establish formal disciplinary process for security violations including investigation procedures, escalation paths, severity classifications, sanction guidelines, and appeal mechanisms. Ensure consistency with labor laws and organizational HR policies.',
 'high', 78, false,
 'Review the disciplinary process for security violations. Check for: documented process, investigation procedures, escalation criteria, sanction guidelines, consistency with HR policies, legal compliance, and communication to staff.'),

-- A.6.5 Responsibilities after termination or change of employment
('ISO27001-A.6.5', 'iso27001', 'A.6.5', 'People', 'Termination',
 'Responsibilities after termination or change of employment',
 'Information security responsibilities and duties that remain valid after termination or change of employment shall be defined, enforced and communicated to relevant personnel and other interested parties.',
 'To protect organizational interests during and after employment changes.',
 'Define post-employment security obligations including confidentiality requirements, non-compete clauses, intellectual property protection, return of assets, and access revocation. Conduct exit interviews covering security responsibilities.',
 'high', 82, true,
 'Evaluate post-employment security controls. Check for: exit interview process, asset return procedures, access revocation timing, confidentiality reminders, non-disclosure enforcement, and documentation of termination security activities.'),

-- A.6.6 Confidentiality or non-disclosure agreements
('ISO27001-A.6.6', 'iso27001', 'A.6.6', 'People', 'Agreements',
 'Confidentiality or non-disclosure agreements',
 'Confidentiality or non-disclosure agreements reflecting the organization''s needs for the protection of information shall be identified, documented, regularly reviewed and signed by personnel and other relevant interested parties.',
 'To protect confidential information through legal agreements.',
 'Implement NDA program covering employees, contractors, vendors, and partners. Define NDA content requirements, review frequency, signature tracking, and enforcement procedures. Tailor NDAs to information classification levels and business relationships.',
 'high', 85, true,
 'Review the NDA program. Check for: NDA template adequacy, coverage of all relevant parties, signature tracking, regular review process, enforcement mechanisms, and alignment with information classification scheme.'),

-- A.6.7 Remote working
('ISO27001-A.6.7', 'iso27001', 'A.6.7', 'People', 'Working arrangements',
 'Remote working',
 'Security measures shall be implemented when personnel are working remotely to protect information accessed, processed or stored outside the organization''s premises.',
 'To protect information when working outside traditional office environments.',
 'Implement remote working security controls including secure connectivity (VPN), endpoint security, physical security requirements, data handling procedures, approved device policies, and home network security guidance. Establish monitoring and audit capabilities for remote access.',
 'critical', 92, true,
 'Assess remote working security controls. Check for: secure connectivity requirements, endpoint security controls, physical security at remote locations, data handling procedures, BYOD policies, monitoring capabilities, and incident response for remote workers.'),

-- A.6.8 Information security event reporting
('ISO27001-A.6.8', 'iso27001', 'A.6.8', 'People', 'Incident reporting',
 'Information security event reporting',
 'The organization shall provide a mechanism for personnel to report observed or suspected information security events through appropriate channels in a timely manner.',
 'To enable timely detection and response to security events.',
 'Establish security event reporting mechanism including multiple reporting channels, clear escalation paths, anonymous reporting options, and no-retaliation policies. Train personnel on what constitutes a security event and how to report it.',
 'critical', 94, true,
 'Evaluate security event reporting mechanisms. Check for: reporting channels availability, ease of reporting, response time SLAs, escalation procedures, anonymous reporting options, non-retaliation policy, and reporting rate metrics.');

-- ============================================================================
-- A.7 Physical Controls (14 controls)
-- ============================================================================

INSERT INTO compliance_controls (
  id, framework_id, control_number, domain, subdomain, title, description,
  objective, implementation_guidance, risk_category, implementation_priority,
  automated_test_available, ai_assessment_prompt
) VALUES

-- A.7.1 Physical security perimeters
('ISO27001-A.7.1', 'iso27001', 'A.7.1', 'Physical', 'Secure areas',
 'Physical security perimeters',
 'Security perimeters shall be defined and used to protect areas that contain information and other associated assets.',
 'To prevent unauthorized physical access to information and assets.',
 'Define physical security zones with appropriate protection levels. Implement perimeter controls including walls, fencing, security barriers, reception areas, and access control systems. Document perimeter boundaries and access requirements.',
 'high', 86, false,
 'Assess physical security perimeter controls. Check for: defined security zones, perimeter barriers, access point controls, visitor management, security signage, and integration with access control systems.'),

-- A.7.2 Physical entry
('ISO27001-A.7.2', 'iso27001', 'A.7.2', 'Physical', 'Secure areas',
 'Physical entry',
 'Secure areas shall be protected by appropriate entry controls to ensure that only authorized personnel are allowed access.',
 'To control access to secure areas.',
 'Implement physical access controls including badge readers, biometrics, PINs, mantraps, and security guards. Log all access attempts and retain records. Implement visitor management procedures with escort requirements for sensitive areas.',
 'critical', 93, true,
 'Evaluate physical entry controls. Check for: access control mechanisms, authentication methods, access logging, visitor management, escort procedures, and regular access reviews.'),

-- A.7.3 Securing offices, rooms and facilities
('ISO27001-A.7.3', 'iso27001', 'A.7.3', 'Physical', 'Secure areas',
 'Securing offices, rooms and facilities',
 'Physical security for offices, rooms and facilities shall be designed and implemented.',
 'To protect information and assets in offices and facilities.',
 'Design secure facilities with appropriate physical controls including locks, access control, window security, and structural protection. Consider threats from natural disasters, civil unrest, and intentional attacks. Implement clean desk policies.',
 'high', 84, false,
 'Review office and facility security. Check for: physical access controls, window and door security, clean desk compliance, secure storage for sensitive materials, and protection against environmental threats.'),

-- A.7.4 Physical security monitoring
('ISO27001-A.7.4', 'iso27001', 'A.7.4', 'Physical', 'Monitoring',
 'Physical security monitoring',
 'Premises shall be continuously monitored for unauthorized physical access.',
 'To detect unauthorized physical access attempts.',
 'Implement continuous monitoring including CCTV surveillance, intrusion detection systems, alarm systems, and security patrols. Define monitoring procedures, response protocols, and recording retention requirements. Ensure 24/7 monitoring coverage for critical facilities.',
 'high', 87, true,
 'Assess physical security monitoring. Check for: CCTV coverage, intrusion detection systems, alarm monitoring, security patrol schedules, incident response procedures, and recording retention policies.'),

-- A.7.5 Protecting against physical and environmental threats
('ISO27001-A.7.5', 'iso27001', 'A.7.5', 'Physical', 'Environmental',
 'Protecting against physical and environmental threats',
 'Protection against physical and environmental threats, such as natural disasters and other intentional or unintentional physical threats to infrastructure shall be designed and implemented.',
 'To protect against environmental threats.',
 'Implement environmental controls including fire detection and suppression, flood protection, climate control, and power conditioning. Conduct risk assessments for natural disasters. Implement redundancy for critical infrastructure.',
 'high', 85, false,
 'Evaluate environmental protection controls. Check for: fire detection and suppression, flood protection, climate control systems, power protection, natural disaster preparedness, and facility location risk assessment.'),

-- A.7.6 Working in secure areas
('ISO27001-A.7.6', 'iso27001', 'A.7.6', 'Physical', 'Secure areas',
 'Working in secure areas',
 'Security measures for working in secure areas shall be designed and implemented.',
 'To ensure security is maintained in secure areas.',
 'Define and enforce rules for working in secure areas including access restrictions, photography prohibitions, mobile device restrictions, supervision requirements, and activity logging. Implement regular inspections and compliance audits.',
 'high', 80, false,
 'Review secure area working procedures. Check for: access restrictions enforcement, prohibited activity policies, supervision requirements, activity logging, compliance inspections, and security awareness for authorized personnel.'),

-- A.7.7 Clear desk and clear screen
('ISO27001-A.7.7', 'iso27001', 'A.7.7', 'Physical', 'Information protection',
 'Clear desk and clear screen',
 'Clear desk rules for papers and removable storage media and clear screen rules for information processing facilities shall be defined and appropriately enforced.',
 'To reduce risks of unauthorized access and loss of information.',
 'Implement clear desk policy requiring sensitive documents to be locked away when not in use. Implement automatic screen locking with short timeout periods. Provide secure storage facilities. Conduct regular compliance checks.',
 'medium', 72, true,
 'Assess clear desk and clear screen compliance. Check for: policy documentation, automatic screen lock configuration, secure storage availability, compliance monitoring, and enforcement mechanisms.'),

-- A.7.8 Equipment siting and protection
('ISO27001-A.7.8', 'iso27001', 'A.7.8', 'Physical', 'Equipment',
 'Equipment siting and protection',
 'Equipment shall be sited securely and protected.',
 'To reduce risks from environmental threats and unauthorized access.',
 'Position equipment to minimize environmental risks and reduce unauthorized access opportunities. Protect against power failures, water damage, and extreme temperatures. Implement cable management and equipment labeling.',
 'high', 78, false,
 'Evaluate equipment siting and protection. Check for: equipment placement considerations, environmental controls, power protection, cable management, equipment labeling, and physical protection measures.'),

-- A.7.9 Security of assets off-premises
('ISO27001-A.7.9', 'iso27001', 'A.7.9', 'Physical', 'Mobile assets',
 'Security of assets off-premises',
 'Off-site assets shall be protected.',
 'To protect assets taken outside organizational premises.',
 'Define policies for off-site equipment including encryption requirements, physical security measures, authorized locations, and reporting requirements for loss or theft. Implement asset tracking and regular inventories.',
 'high', 83, true,
 'Review off-premises asset security. Check for: off-site equipment policy, encryption requirements, physical security guidance, loss/theft reporting procedures, asset tracking, and compliance monitoring.'),

-- A.7.10 Storage media
('ISO27001-A.7.10', 'iso27001', 'A.7.10', 'Physical', 'Media',
 'Storage media',
 'Storage media shall be managed through their life cycle of acquisition, use, transportation and disposal in accordance with the organization''s classification scheme and handling requirements.',
 'To prevent unauthorized disclosure, modification, or destruction of information on storage media.',
 'Implement media management procedures including acquisition controls, usage tracking, transportation security, and secure disposal. Apply controls based on information classification. Maintain media inventories.',
 'high', 81, true,
 'Assess storage media management. Check for: media inventory, classification-based handling, transportation security, secure disposal procedures, and life cycle management.'),

-- A.7.11 Supporting utilities
('ISO27001-A.7.11', 'iso27001', 'A.7.11', 'Physical', 'Infrastructure',
 'Supporting utilities',
 'Information processing facilities shall be protected from power failures and other disruptions caused by failures in supporting utilities.',
 'To prevent loss of information due to utility failures.',
 'Implement utility protection including UPS systems, backup generators, redundant power feeds, environmental monitoring, and emergency procedures. Test backup systems regularly. Monitor utility performance.',
 'high', 84, true,
 'Evaluate supporting utility protection. Check for: UPS coverage, generator capacity, redundant feeds, environmental monitoring, emergency procedures, and regular testing schedules.'),

-- A.7.12 Cabling security
('ISO27001-A.7.12', 'iso27001', 'A.7.12', 'Physical', 'Infrastructure',
 'Cabling security',
 'Cables carrying power or data or supporting information services shall be protected from interception, interference or damage.',
 'To protect information transmitted over cables.',
 'Protect network and power cables from interception and damage through proper routing, conduit protection, fiber optics for sensitive data, and separation of power and data cables. Implement cable labeling and documentation.',
 'medium', 70, false,
 'Review cabling security. Check for: cable protection measures, routing security, fiber optic usage for sensitive data, power/data separation, cable documentation, and physical access controls to cable routes.'),

-- A.7.13 Equipment maintenance
('ISO27001-A.7.13', 'iso27001', 'A.7.13', 'Physical', 'Equipment',
 'Equipment maintenance',
 'Equipment shall be maintained correctly to ensure availability and integrity of information.',
 'To ensure continued correct operation of information processing facilities.',
 'Establish equipment maintenance program including scheduled maintenance, authorized personnel requirements, secure data handling during maintenance, maintenance records, and vendor management for third-party maintenance.',
 'high', 79, true,
 'Assess equipment maintenance program. Check for: maintenance schedules, authorized personnel controls, data security during maintenance, maintenance records, vendor management, and post-maintenance verification.'),

-- A.7.14 Secure disposal or re-use of equipment
('ISO27001-A.7.14', 'iso27001', 'A.7.14', 'Physical', 'Equipment',
 'Secure disposal or re-use of equipment',
 'Items of equipment containing storage media shall be verified to ensure that any sensitive data and licensed software has been removed or securely overwritten prior to disposal or re-use.',
 'To prevent information leakage through disposed equipment.',
 'Implement secure disposal procedures including data sanitization standards (NIST 800-88), certificate of destruction, verified disposal vendors, and disposal records. Apply procedures before any equipment leaves organizational control.',
 'critical', 91, true,
 'Evaluate equipment disposal procedures. Check for: data sanitization standards, destruction verification, vendor certification, disposal records, and process for different media types.');

-- ============================================================================
-- A.8 Technological Controls (34 controls)
-- ============================================================================

INSERT INTO compliance_controls (
  id, framework_id, control_number, domain, subdomain, title, description,
  objective, implementation_guidance, risk_category, implementation_priority,
  automated_test_available, ai_assessment_prompt
) VALUES

-- A.8.1 User endpoint devices
('ISO27001-A.8.1', 'iso27001', 'A.8.1', 'Technological', 'Endpoints',
 'User endpoint devices',
 'Information stored on, processed by or accessible via user endpoint devices shall be protected.',
 'To protect information on endpoint devices.',
 'Implement endpoint protection including encryption, anti-malware, MDM/EMM solutions, remote wipe capability, and secure configuration baselines. Define approved device lists and BYOD policies.',
 'critical', 94, true,
 'Assess endpoint device security. Check for: encryption enforcement, anti-malware deployment, MDM coverage, remote wipe capability, configuration baselines, BYOD policies, and device inventory.'),

-- A.8.2 Privileged access rights
('ISO27001-A.8.2', 'iso27001', 'A.8.2', 'Technological', 'Access control',
 'Privileged access rights',
 'The allocation and use of privileged access rights shall be restricted and managed.',
 'To reduce risks from privileged access misuse.',
 'Implement privileged access management including just-in-time access, session recording, approval workflows, regular reviews, and separate admin accounts. Use privileged access workstations for sensitive operations.',
 'critical', 96, true,
 'Evaluate privileged access controls. Check for: PAM solution deployment, just-in-time access, session recording, approval workflows, regular access reviews, and separation of admin accounts.'),

-- A.8.3 Information access restriction
('ISO27001-A.8.3', 'iso27001', 'A.8.3', 'Technological', 'Access control',
 'Information access restriction',
 'Access to information and other associated assets shall be restricted in accordance with the established topic-specific policy on access control.',
 'To ensure authorized access to information.',
 'Implement role-based access control, need-to-know restrictions, and data classification-based access. Define access matrices, implement access request workflows, and conduct regular access reviews.',
 'high', 89, true,
 'Review information access restrictions. Check for: RBAC implementation, need-to-know enforcement, classification-based access controls, access request procedures, and regular access reviews.'),

-- A.8.4 Access to source code
('ISO27001-A.8.4', 'iso27001', 'A.8.4', 'Technological', 'Development',
 'Access to source code',
 'Read and write access to source code, development tools and software libraries shall be appropriately managed.',
 'To prevent unauthorized access to source code.',
 'Implement source code access controls including repository access management, code review requirements, branch protection rules, and audit logging. Restrict production environment access from developers.',
 'high', 85, true,
 'Assess source code access controls. Check for: repository access management, branch protection, code review requirements, audit logging, and separation of development and production access.'),

-- A.8.5 Secure authentication
('ISO27001-A.8.5', 'iso27001', 'A.8.5', 'Technological', 'Authentication',
 'Secure authentication',
 'Secure authentication technologies and procedures shall be implemented based on information access restrictions and the topic-specific policy on access control.',
 'To ensure users are properly authenticated.',
 'Implement multi-factor authentication, strong password policies, single sign-on where appropriate, and authentication logging. Use risk-based authentication for sensitive resources.',
 'critical', 97, true,
 'Evaluate authentication controls. Check for: MFA implementation coverage, password policy enforcement, SSO deployment, authentication logging, and risk-based authentication for sensitive systems.'),

-- A.8.6 Capacity management
('ISO27001-A.8.6', 'iso27001', 'A.8.6', 'Technological', 'Operations',
 'Capacity management',
 'The use of resources shall be monitored and adjusted in line with current and expected capacity requirements.',
 'To ensure adequate system capacity.',
 'Implement capacity monitoring for compute, storage, and network resources. Establish thresholds and alerts. Conduct capacity planning and forecasting. Implement auto-scaling where appropriate.',
 'medium', 74, true,
 'Review capacity management. Check for: resource monitoring, threshold alerts, capacity planning processes, forecasting, auto-scaling implementation, and capacity trend analysis.'),

-- A.8.7 Protection against malware
('ISO27001-A.8.7', 'iso27001', 'A.8.7', 'Technological', 'Malware',
 'Protection against malware',
 'Protection against malware shall be implemented and supported by appropriate user awareness.',
 'To protect against malware threats.',
 'Deploy anti-malware solutions across all endpoints and servers. Implement email filtering, web filtering, and sandbox analysis. Maintain signature updates and conduct regular scans. Train users on malware threats.',
 'critical', 95, true,
 'Assess malware protection. Check for: anti-malware deployment coverage, signature update frequency, email/web filtering, sandbox analysis, user training, and malware incident response procedures.'),

-- A.8.8 Management of technical vulnerabilities
('ISO27001-A.8.8', 'iso27001', 'A.8.8', 'Technological', 'Vulnerabilities',
 'Management of technical vulnerabilities',
 'Information about technical vulnerabilities of information systems in use shall be obtained, the organization''s exposure to such vulnerabilities shall be evaluated and appropriate measures shall be taken.',
 'To prevent exploitation of technical vulnerabilities.',
 'Implement vulnerability management program including regular scanning, severity-based prioritization, remediation SLAs, patch management, and vulnerability tracking. Subscribe to vulnerability intelligence feeds.',
 'critical', 94, true,
 'Evaluate vulnerability management. Check for: scanning frequency, coverage, severity-based SLAs, patch management integration, remediation tracking, and vulnerability intelligence feeds.'),

-- A.8.9 Configuration management
('ISO27001-A.8.9', 'iso27001', 'A.8.9', 'Technological', 'Operations',
 'Configuration management',
 'Configurations, including security configurations, of hardware, software, services and networks shall be established, documented, implemented, monitored and reviewed.',
 'To ensure systems are securely configured.',
 'Implement configuration management including secure baselines, configuration monitoring, drift detection, and change control. Use automation for configuration enforcement. Document and regularly review configurations.',
 'high', 88, true,
 'Assess configuration management. Check for: secure baselines, configuration monitoring, drift detection, change control integration, automation, and regular configuration reviews.'),

-- A.8.10 Information deletion
('ISO27001-A.8.10', 'iso27001', 'A.8.10', 'Technological', 'Data',
 'Information deletion',
 'Information stored in information systems, devices or in any other storage media shall be deleted when no longer required.',
 'To prevent unnecessary retention of information.',
 'Implement data deletion procedures aligned with retention requirements. Use secure deletion methods appropriate to media type. Verify deletion completion. Document deletion activities.',
 'high', 82, true,
 'Review information deletion practices. Check for: retention schedule alignment, secure deletion methods, deletion verification, documentation, and automated deletion where applicable.'),

-- A.8.11 Data masking
('ISO27001-A.8.11', 'iso27001', 'A.8.11', 'Technological', 'Data',
 'Data masking',
 'Data masking shall be used in accordance with the organization''s topic-specific policy on access control and other related topic-specific policies, and business requirements, taking into consideration applicable legislation.',
 'To protect sensitive data from unauthorized disclosure.',
 'Implement data masking for sensitive data in non-production environments, reports, and displays. Define masking rules based on data classification. Use tokenization where appropriate.',
 'high', 79, true,
 'Evaluate data masking implementation. Check for: masking policy, non-production data protection, masking rules by classification, tokenization usage, and masking coverage for sensitive data types.'),

-- A.8.12 Data leakage prevention
('ISO27001-A.8.12', 'iso27001', 'A.8.12', 'Technological', 'Data',
 'Data leakage prevention',
 'Data leakage prevention measures shall be applied to systems, networks and any other devices that process, store or transmit sensitive information.',
 'To prevent unauthorized data disclosure.',
 'Implement DLP solutions covering endpoints, network, and cloud. Define DLP policies based on data classification. Monitor and block policy violations. Investigate DLP alerts.',
 'critical', 90, true,
 'Assess DLP implementation. Check for: DLP coverage (endpoint, network, cloud), policy definitions, classification integration, blocking vs monitoring modes, and incident investigation procedures.'),

-- A.8.13 Information backup
('ISO27001-A.8.13', 'iso27001', 'A.8.13', 'Technological', 'Operations',
 'Information backup',
 'Backup copies of information, software and systems shall be maintained and regularly tested in accordance with the agreed topic-specific policy on backup.',
 'To ensure recoverability of information.',
 'Implement comprehensive backup strategy including regular backups, offsite storage, encryption, restoration testing, and retention policies. Define RTOs and RPOs. Monitor backup success.',
 'critical', 93, true,
 'Review backup implementation. Check for: backup frequency, offsite storage, encryption, restoration testing schedule, RTO/RPO definitions, monitoring, and retention compliance.'),

-- A.8.14 Redundancy of information processing facilities
('ISO27001-A.8.14', 'iso27001', 'A.8.14', 'Technological', 'Availability',
 'Redundancy of information processing facilities',
 'Information processing facilities shall be implemented with redundancy sufficient to meet availability requirements.',
 'To ensure availability of information systems.',
 'Implement redundancy for critical systems including clustering, load balancing, geographic distribution, and failover capabilities. Define availability requirements by system criticality. Test failover regularly.',
 'high', 86, true,
 'Evaluate redundancy implementation. Check for: clustering, load balancing, geographic distribution, failover testing, availability requirements definition, and redundancy coverage for critical systems.'),

-- A.8.15 Logging
('ISO27001-A.8.15', 'iso27001', 'A.8.15', 'Technological', 'Monitoring',
 'Logging',
 'Logs that record activities, exceptions, faults and other relevant events shall be produced, stored, protected and analysed.',
 'To enable detection of security events and forensic investigation.',
 'Implement comprehensive logging covering security events, user activities, system events, and application logs. Centralize logs in SIEM. Define log retention. Protect log integrity.',
 'critical', 95, true,
 'Assess logging implementation. Check for: logging coverage, SIEM integration, log retention, log integrity protection, analysis capabilities, and log review procedures.'),

-- A.8.16 Monitoring activities
('ISO27001-A.8.16', 'iso27001', 'A.8.16', 'Technological', 'Monitoring',
 'Monitoring activities',
 'Networks, systems and applications shall be monitored for anomalous behaviour and appropriate actions taken to evaluate potential information security incidents.',
 'To detect and respond to security incidents.',
 'Implement continuous monitoring including SIEM, IDS/IPS, anomaly detection, and user behavior analytics. Define monitoring use cases and alerting thresholds. Establish incident response procedures.',
 'critical', 94, true,
 'Evaluate monitoring activities. Check for: SIEM deployment, IDS/IPS coverage, anomaly detection, UBA/UEBA, alerting thresholds, monitoring coverage, and incident response integration.'),

-- A.8.17 Clock synchronization
('ISO27001-A.8.17', 'iso27001', 'A.8.17', 'Technological', 'Operations',
 'Clock synchronization',
 'The clocks of information processing systems used by the organization shall be synchronized to approved time sources.',
 'To ensure accurate timestamps for logging and audit.',
 'Implement NTP synchronization across all systems using approved time sources. Monitor synchronization status. Document time source hierarchy.',
 'medium', 68, true,
 'Review clock synchronization. Check for: NTP configuration, approved time sources, synchronization monitoring, drift alerts, and coverage across all systems.'),

-- A.8.18 Use of privileged utility programs
('ISO27001-A.8.18', 'iso27001', 'A.8.18', 'Technological', 'Access control',
 'Use of privileged utility programs',
 'The use of utility programs that might be capable of overriding system and application controls shall be restricted and tightly controlled.',
 'To prevent misuse of privileged utilities.',
 'Restrict access to privileged utilities including system administration tools, debugging tools, and network utilities. Log all usage. Implement approval workflows for utility access.',
 'high', 83, true,
 'Assess privileged utility control. Check for: utility inventory, access restrictions, usage logging, approval workflows, and regular access reviews for utility access.'),

-- A.8.19 Installation of software on operational systems
('ISO27001-A.8.19', 'iso27001', 'A.8.19', 'Technological', 'Change management',
 'Installation of software on operational systems',
 'Procedures and measures shall be implemented to securely manage software installation on operational systems.',
 'To ensure only authorized software runs on operational systems.',
 'Implement software installation controls including application whitelisting, software inventory management, installation approval workflows, and removal of unauthorized software. Separate development and production environments.',
 'high', 87, true,
 'Evaluate software installation controls. Check for: application whitelisting, software inventory, installation approval process, unauthorized software detection, and environment separation.'),

-- A.8.20 Networks security
('ISO27001-A.8.20', 'iso27001', 'A.8.20', 'Technological', 'Network',
 'Networks security',
 'Networks and network devices shall be secured, managed and controlled to protect information in systems and applications.',
 'To protect network infrastructure.',
 'Implement network security controls including firewalls, secure configurations, network monitoring, and change management. Conduct regular network security assessments. Document network architecture.',
 'critical', 93, true,
 'Assess network security. Check for: firewall deployment, secure configurations, network monitoring, change management, security assessments, and architecture documentation.'),

-- A.8.21 Security of network services
('ISO27001-A.8.21', 'iso27001', 'A.8.21', 'Technological', 'Network',
 'Security of network services',
 'Security mechanisms, service levels and service requirements of network services shall be identified, implemented and monitored.',
 'To ensure network services are secure.',
 'Define security requirements for network services including SLAs, security controls, and monitoring requirements. Assess third-party network service providers. Include security requirements in service contracts.',
 'high', 81, true,
 'Review network services security. Check for: security requirements definition, SLA monitoring, third-party assessments, contractual security requirements, and service monitoring.'),

-- A.8.22 Segregation of networks
('ISO27001-A.8.22', 'iso27001', 'A.8.22', 'Technological', 'Network',
 'Segregation of networks',
 'Groups of information services, users and information systems shall be segregated in networks.',
 'To reduce network-based attack surface.',
 'Implement network segmentation using VLANs, firewalls, and micro-segmentation. Separate production, development, and management networks. Isolate sensitive systems and data.',
 'high', 88, true,
 'Evaluate network segregation. Check for: segmentation strategy, VLAN implementation, firewall rules between segments, micro-segmentation, and isolation of sensitive systems.'),

-- A.8.23 Web filtering
('ISO27001-A.8.23', 'iso27001', 'A.8.23', 'Technological', 'Network',
 'Web filtering',
 'Access to external websites shall be managed to reduce exposure to malicious content.',
 'To protect against web-based threats.',
 'Implement web filtering including URL categorization, malware scanning, content inspection, and policy enforcement. Define allowed/blocked categories. Log web access for investigation.',
 'high', 80, true,
 'Assess web filtering. Check for: web filtering solution, category policies, malware scanning, HTTPS inspection, logging, and exception handling procedures.'),

-- A.8.24 Use of cryptography
('ISO27001-A.8.24', 'iso27001', 'A.8.24', 'Technological', 'Cryptography',
 'Use of cryptography',
 'Rules for the effective use of cryptography, including cryptographic key management, shall be defined and implemented.',
 'To protect information confidentiality and integrity using cryptography.',
 'Implement cryptographic controls including encryption standards, key management procedures, certificate management, and crypto algorithm lifecycle. Define approved cryptographic mechanisms.',
 'critical', 92, true,
 'Evaluate cryptography implementation. Check for: encryption standards, key management procedures, certificate management, approved algorithms, crypto inventory, and key lifecycle management.'),

-- A.8.25 Secure development life cycle
('ISO27001-A.8.25', 'iso27001', 'A.8.25', 'Technological', 'Development',
 'Secure development life cycle',
 'Rules for the secure development of software and systems shall be established and applied.',
 'To ensure security is built into software development.',
 'Implement secure SDLC including security requirements, threat modeling, secure coding practices, security testing, and security reviews. Integrate security into CI/CD pipelines.',
 'critical', 91, true,
 'Assess secure development lifecycle. Check for: security requirements process, threat modeling, secure coding standards, security testing integration, code review practices, and CI/CD security.'),

-- A.8.26 Application security requirements
('ISO27001-A.8.26', 'iso27001', 'A.8.26', 'Technological', 'Development',
 'Application security requirements',
 'Information security requirements shall be identified, specified and approved when developing or acquiring applications.',
 'To ensure applications meet security requirements.',
 'Define security requirements for applications including authentication, authorization, input validation, error handling, and logging. Include security requirements in procurement and development.',
 'high', 86, true,
 'Review application security requirements. Check for: requirements specification process, standard security requirements, procurement integration, development integration, and requirements verification.'),

-- A.8.27 Secure system architecture and engineering principles
('ISO27001-A.8.27', 'iso27001', 'A.8.27', 'Technological', 'Development',
 'Secure system architecture and engineering principles',
 'Principles for engineering secure systems shall be established, documented, maintained and applied to any information system development activities.',
 'To ensure systems are designed securely.',
 'Define secure architecture principles including defense in depth, least privilege, fail-safe defaults, and zero trust. Apply principles to all system design. Document architecture decisions.',
 'high', 85, true,
 'Evaluate secure architecture principles. Check for: documented principles, defense in depth, least privilege, zero trust considerations, architecture reviews, and principle application verification.'),

-- A.8.28 Secure coding
('ISO27001-A.8.28', 'iso27001', 'A.8.28', 'Technological', 'Development',
 'Secure coding',
 'Secure coding principles shall be applied to software development.',
 'To prevent security vulnerabilities in code.',
 'Implement secure coding standards addressing OWASP Top 10, input validation, output encoding, authentication, and error handling. Use SAST tools. Conduct code reviews for security.',
 'critical', 90, true,
 'Assess secure coding practices. Check for: coding standards, OWASP coverage, SAST tool usage, code review process, developer training, and secure coding verification.'),

-- A.8.29 Security testing in development and acceptance
('ISO27001-A.8.29', 'iso27001', 'A.8.29', 'Technological', 'Development',
 'Security testing in development and acceptance',
 'Security testing processes shall be defined and implemented in the development life cycle.',
 'To identify security vulnerabilities before deployment.',
 'Implement security testing including SAST, DAST, penetration testing, and security review as part of development. Define security testing requirements for acceptance. Remediate findings before release.',
 'critical', 92, true,
 'Review security testing processes. Check for: SAST implementation, DAST implementation, penetration testing, acceptance criteria, finding remediation, and testing coverage.'),

-- A.8.30 Outsourced development
('ISO27001-A.8.30', 'iso27001', 'A.8.30', 'Technological', 'Development',
 'Outsourced development',
 'The organization shall direct, monitor and review the activities related to outsourced system development.',
 'To ensure outsourced development meets security requirements.',
 'Include security requirements in outsourced development contracts. Conduct security reviews of delivered code. Require security testing evidence. Monitor development security practices.',
 'high', 80, true,
 'Evaluate outsourced development security. Check for: contractual security requirements, code security reviews, security testing evidence, development security monitoring, and intellectual property protection.'),

-- A.8.31 Separation of development, test and production environments
('ISO27001-A.8.31', 'iso27001', 'A.8.31', 'Technological', 'Development',
 'Separation of development, test and production environments',
 'Development, testing and production environments shall be separated and secured.',
 'To protect production environments from development activities.',
 'Implement environment separation with distinct access controls, configurations, and data. Prevent production data in development. Control promotion between environments.',
 'high', 87, true,
 'Assess environment separation. Check for: distinct environments, access control separation, configuration differences, production data masking, and promotion controls.'),

-- A.8.32 Change management
('ISO27001-A.8.32', 'iso27001', 'A.8.32', 'Technological', 'Operations',
 'Change management',
 'Changes to information processing facilities and systems shall be subject to change management procedures.',
 'To ensure changes do not adversely affect security.',
 'Implement change management including change requests, impact assessment, approval workflows, testing, rollback procedures, and documentation. Include security review in change process.',
 'critical', 93, true,
 'Evaluate change management. Check for: change request process, impact assessment, approval workflows, testing requirements, rollback procedures, and security review integration.'),

-- A.8.33 Test information
('ISO27001-A.8.33', 'iso27001', 'A.8.33', 'Technological', 'Development',
 'Test information',
 'Test information shall be appropriately selected, protected and managed.',
 'To protect sensitive information used in testing.',
 'Use synthetic or masked data for testing. When production data is required, apply appropriate protections. Secure test environments. Delete test data after use.',
 'high', 78, true,
 'Review test information handling. Check for: synthetic data usage, production data protection, data masking, test environment security, and test data retention.'),

-- A.8.34 Protection of information systems during audit testing
('ISO27001-A.8.34', 'iso27001', 'A.8.34', 'Technological', 'Audit',
 'Protection of information systems during audit testing',
 'Audit tests and other assurance activities involving assessment of operational systems shall be planned and agreed between the tester and appropriate management.',
 'To minimize disruption from audit activities.',
 'Plan audit activities to minimize operational impact. Coordinate timing and scope with system owners. Protect audit tools and results. Monitor audit activities.',
 'medium', 72, true,
 'Assess audit testing protection. Check for: audit planning process, coordination with system owners, timing considerations, tool protection, result protection, and impact monitoring.');

-- Update the framework control count to verify
UPDATE compliance_frameworks
SET total_controls = (
  SELECT COUNT(*) FROM compliance_controls WHERE framework_id = 'iso27001'
),
critical_controls = (
  SELECT COUNT(*) FROM compliance_controls
  WHERE framework_id = 'iso27001' AND risk_category = 'critical'
),
updated_at = NOW()
WHERE id = 'iso27001';
