# Use Cases

This document describes common use cases for the Nexus Compliance Engine, derived from the actual API endpoints and services implemented in the codebase.

## Use Case 1: Multi-Framework Compliance Assessment

### Scenario
An organization deploying an AI-powered customer service system needs to assess compliance across multiple EU regulations including GDPR, EU AI Act, and NIS2 simultaneously.

### Workflow

1. **Register the AI System**
   ```
   POST /api/v1/compliance/ai-systems
   {
     "systemId": "customer-ai-v2",
     "name": "Customer Service AI",
     "description": "AI chatbot for customer inquiries",
     "provider": "Internal Development",
     "environments": ["production"],
     "dataCategories": ["customer_data", "interaction_logs"],
     "humanOversightEnabled": true
   }
   ```

2. **Create Assessments for Each Framework**
   - Create ISO 27001 assessment (93 controls)
   - Create GDPR assessment (220 controls)
   - Create EU AI Act assessment (149 controls)

3. **Run AI-Assisted Assessments**
   The system evaluates controls against provided evidence and system description using MageAgent integration.

4. **View Cross-Framework Analysis**
   Navigate to `/compliance/cross-framework` to see:
   - Control overlap between frameworks
   - Gaps that span multiple frameworks
   - Unified compliance score

5. **Generate Consolidated Report**
   ```
   POST /api/v1/compliance/reports/generate
   {
     "reportType": "executive_summary",
     "format": "pdf",
     "includeRemediation": true
   }
   ```

### API Endpoints Used
- `POST /ai-systems` - Register AI system
- `POST /assessments` - Create assessment
- `POST /assessments/:id/run` - Execute assessment
- `GET /assessments/:id/findings` - Retrieve findings
- `POST /reports/generate` - Generate report

---

## Use Case 2: Z-Inspection Report Integration

### Scenario
An organization has conducted a Z-Inspection of their AI system with external auditors and wants to integrate the findings into their compliance management workflow.

### Workflow

1. **Import Z-Inspection Report**
   Navigate to `/compliance/z-inspection` and import the report:
   ```
   POST /api/v1/compliance/qualitative/z-inspection/import
   {
     "aiSystemId": "recommendation-engine",
     "title": "Z-Inspection Report Q4 2024",
     "reportDate": "2024-12-15",
     "importMethod": "json_import",
     "content": "{...structured JSON content...}"
   }
   ```

2. **Process the Report**
   The system extracts:
   - Qualitative findings mapped to 7 EU Trustworthy AI requirements
   - Socio-technical scenarios
   - Ethical tensions between values/stakeholders
   - Recommendations with priority levels

3. **Create Assessment from Report**
   ```
   POST /api/v1/compliance/qualitative/z-inspection/:reportId/create-assessment
   {
     "assessmentTitle": "Q4 2024 Trustworthiness Assessment"
   }
   ```

4. **Map Findings to Controls**
   The system automatically maps qualitative findings to quantitative controls, adjusting control weights based on Z-Inspection severity.

5. **Track Remediation**
   Findings generate remediation tasks that can be tracked through the assessment workflow.

### API Endpoints Used
- `POST /qualitative/z-inspection/import` - Import report
- `POST /qualitative/z-inspection/:id/process` - Process report
- `POST /qualitative/z-inspection/:id/create-assessment` - Generate assessment
- `GET /qualitative/z-inspection/:id` - View report details

---

## Use Case 3: Ethical Tension Resolution

### Scenario
During AI system development, teams identify conflicts between competing values such as user privacy versus system personalization.

### Workflow

1. **Identify Tension**
   Create a new ethical tension:
   ```
   POST /api/v1/compliance/qualitative/tensions
   {
     "aiSystemId": "recommendation-engine",
     "title": "Privacy vs Personalization",
     "description": "User data collection improves recommendations but raises privacy concerns",
     "valueA": "User Privacy",
     "valueADescription": "Minimizing personal data collection and retention",
     "valueB": "Service Quality",
     "valueBDescription": "Providing personalized recommendations",
     "tensionType": "value_vs_value",
     "severity": "significant",
     "requirementA": "privacy_data_governance",
     "requirementB": "human_agency_oversight",
     "affectedStakeholders": ["stakeholder-uuid-1", "stakeholder-uuid-2"]
   }
   ```

2. **Gather Stakeholder Perspectives**
   Record different viewpoints from affected stakeholders:
   ```
   POST /api/v1/compliance/qualitative/tensions/:id/perspectives
   {
     "stakeholderId": "stakeholder-uuid-1",
     "perspective": "Users prefer privacy over personalization",
     "preferredResolution": "Opt-in personalization with clear data usage disclosure"
   }
   ```

3. **Analyze with AI Assistance**
   The system can identify related tensions and suggest resolutions based on similar cases.

4. **Document Resolution**
   ```
   POST /api/v1/compliance/qualitative/tensions/:id/resolve
   {
     "resolutionApproach": "Privacy-by-default with opt-in personalization",
     "resolutionRationale": "Aligns with GDPR consent requirements while maintaining service option",
     "tradeOffDecision": "Accept reduced personalization accuracy for users who opt out",
     "residualConcerns": "Some users may not understand opt-in implications",
     "newStatus": "mitigated"
   }
   ```

5. **Track Tension Statistics**
   View dashboard metrics showing:
   - Tensions by type (value vs value, stakeholder vs stakeholder)
   - Tensions by severity
   - Resolution rate
   - Unresolved critical tensions

### API Endpoints Used
- `POST /qualitative/tensions` - Create tension
- `GET /qualitative/tensions` - List tensions
- `POST /qualitative/tensions/:id/perspectives` - Add stakeholder perspective
- `POST /qualitative/tensions/:id/resolve` - Document resolution
- `GET /qualitative/tensions/stats` - Get statistics

---

## Use Case 4: AI Risk Classification (EU AI Act)

### Scenario
An organization needs to classify their AI systems according to EU AI Act risk categories and document the classification rationale.

### Workflow

1. **Register AI System with Classification Data**
   ```
   POST /api/v1/compliance/ai-systems
   {
     "systemId": "hiring-ai",
     "name": "AI Hiring Assistant",
     "description": "AI system for resume screening and candidate ranking",
     "dataCategories": ["personal_data", "professional_history"],
     "purposeOfProcessing": ["employment_decisions"],
     "humanOversightEnabled": true
   }
   ```

2. **Request AI-Assisted Classification**
   ```
   POST /api/v1/compliance/ai-systems/:id/classify
   {
     "systemDescription": "Automated resume screening with candidate ranking",
     "useCases": ["Initial candidate filtering", "Interview scheduling recommendations"],
     "dataCategories": ["personal_data", "employment_history"],
     "affectedPersons": ["job_applicants"],
     "riskFactors": ["employment_decision_making", "personal_data_processing"]
   }
   ```

3. **Review Classification Result**
   The system returns:
   - Risk category: `high_risk` (employment context)
   - Classification rationale
   - Required compliance measures under EU AI Act
   - Related controls from the 149 EU AI Act controls

4. **Create EU AI Act Assessment**
   ```
   POST /api/v1/compliance/assessments
   {
     "frameworkId": "eu_ai_act",
     "targetSystemId": "hiring-ai",
     "targetSystemName": "AI Hiring Assistant"
   }
   ```

5. **Document Technical Documentation**
   Track FRIA (Fundamental Rights Impact Assessment) and technical documentation paths in the AI system registry.

### API Endpoints Used
- `POST /ai-systems` - Register system
- `POST /ai-systems/:id/classify` - Classify risk level
- `GET /ai-systems/:id` - View system details
- `PATCH /ai-systems/:id` - Update documentation paths
- `POST /assessments` - Create assessment

---

## Use Case 5: Compliance Monitoring and Alerting

### Scenario
An organization wants continuous monitoring of compliance status with alerts for drift, deadlines, and regulatory changes.

### Workflow

1. **Configure Dashboard**
   Access `/compliance` to view:
   - Overall compliance score across frameworks
   - Framework-specific scores
   - Trustworthy AI requirement coverage
   - Risk distribution

2. **Monitor Alerts**
   The system generates alerts for:
   - **Drift**: Control status changes
   - **Expiration**: Evidence or certification expirations
   - **New Requirements**: Regulatory updates affecting controls
   - **Risk Increase**: Elevated risk levels
   - **Overdue Remediation**: Past-due remediation tasks
   - **Failed Assessments**: Assessment execution failures

3. **View and Acknowledge Alerts**
   ```
   GET /api/v1/compliance/monitoring/alerts

   POST /api/v1/compliance/monitoring/alerts/:id/acknowledge
   {
     "acknowledgedNotes": "Reviewed, remediation in progress"
   }
   ```

4. **Track Regulatory Updates**
   Navigate to `/compliance/regulatory` to see:
   - New regulations and amendments
   - Upcoming compliance deadlines
   - Enforcement actions
   - Impact analysis on current controls

5. **Schedule Periodic Assessments**
   Configure automated assessment scheduling to maintain continuous compliance posture.

### API Endpoints Used
- `GET /monitoring/dashboard` - Get dashboard data
- `GET /monitoring/alerts` - List alerts
- `POST /monitoring/alerts/:id/acknowledge` - Acknowledge alert
- `POST /monitoring/alerts/:id/resolve` - Resolve alert

---

## Use Case 6: Gap Analysis and Remediation Planning

### Scenario
After an assessment reveals compliance gaps, the organization needs to prioritize and track remediation efforts.

### Workflow

1. **Run Assessment**
   Execute a compliance assessment against the target framework.

2. **Review Findings**
   ```
   GET /api/v1/compliance/assessments/:id/findings?status=non_compliant&severity=critical
   ```

3. **Generate Gap Analysis Report**
   ```
   POST /api/v1/compliance/reports/generate
   {
     "assessmentId": "assessment-uuid",
     "reportType": "gap_analysis",
     "format": "markdown",
     "includeRemediation": true
   }
   ```

4. **Create Remediation Plans**
   For each critical finding, create a remediation plan with tasks, owners, and due dates.

5. **Upload Evidence**
   As remediation progresses, upload evidence:
   ```
   POST /api/v1/compliance/evidence
   {
     "controlId": "ISO27001-A.5.1",
     "findingId": "finding-uuid",
     "type": "policy",
     "title": "Information Security Policy v2.0",
     "description": "Updated policy addressing identified gaps"
   }
   ```

6. **Track Progress**
   View remediation progress on the dashboard showing:
   - Total remediation items
   - Completed vs in-progress
   - Overdue items
   - Completion percentage

### API Endpoints Used
- `GET /assessments/:id/findings` - Get findings
- `POST /reports/generate` - Generate report
- `POST /evidence` - Upload evidence
- `GET /monitoring/dashboard` - Track progress

---

## Use Case 7: Cross-Framework Control Mapping

### Scenario
An organization already compliant with ISO 27001 wants to understand what additional work is needed for GDPR compliance.

### Workflow

1. **Access Cross-Framework Analysis**
   Navigate to `/compliance/cross-framework`

2. **View Control Mapping Matrix**
   ```
   GET /api/v1/compliance/analysis/cross-framework/matrix
   ```
   Returns:
   - Framework overlap percentages
   - Equivalent controls between frameworks
   - Partial and related mappings

3. **Identify Equivalent Controls**
   ```
   GET /api/v1/compliance/controls/:controlId
   ```
   Returns control details with `crossFrameworkMappings` showing:
   - Target control in other frameworks
   - Mapping type (equivalent, partial, related)
   - Confidence score

4. **Perform Gap Analysis**
   ```
   GET /api/v1/compliance/analysis/cross-framework/gaps
   ```
   Returns:
   - Unmapped controls requiring additional work
   - Requirements with insufficient coverage
   - Recommendations for closing gaps

5. **Leverage Existing Evidence**
   Where controls are equivalent, reference existing evidence to avoid duplicate documentation.

### API Endpoints Used
- `GET /analysis/cross-framework/matrix` - View mapping matrix
- `GET /controls/:id` - Get control with mappings
- `GET /analysis/cross-framework/gaps` - Identify gaps
- `GET /analysis/cross-framework/coverage` - Check requirement coverage

---

## Summary

The Nexus Compliance Engine supports these primary use case categories:

| Category | Use Cases |
|----------|-----------|
| **Assessment** | Multi-framework assessment, AI-assisted evaluation |
| **Qualitative** | Z-Inspection integration, ethical tensions, stakeholder management |
| **AI Governance** | Risk classification, EU AI Act compliance |
| **Monitoring** | Alerting, regulatory updates, continuous compliance |
| **Analysis** | Gap analysis, cross-framework mapping, remediation tracking |

Each use case leverages the plugin's integration with the Nexus platform, MageAgent for AI features, and GraphRAG for knowledge management.
