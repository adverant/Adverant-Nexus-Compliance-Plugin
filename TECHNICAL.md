# Technical Documentation

This document provides detailed technical specifications for the Nexus Compliance Engine API, derived from the actual route implementations in the codebase.

## API Overview

**Base URL**: `/api/v1/plugins/compliance`

**Authentication**: All endpoints require Nexus platform authentication via API key or JWT token.

**Headers Required**:
- `X-Tenant-ID`: Tenant identifier for multi-tenant isolation
- `X-User-ID`: User identifier for audit logging
- `X-Request-ID`: (Optional) Request tracking identifier

**Response Format**: All responses follow this structure:
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": { ... }
  }
}
```

---

## Framework Endpoints

### GET /frameworks

List available compliance frameworks.

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| category | string | - | Filter by category: `security`, `privacy`, `ai_governance`, `cybersecurity` |
| jurisdiction | string | - | Filter by jurisdiction: `eu`, `us`, `uk`, `global` |
| active | boolean | - | Filter by active status |
| limit | number | 50 | Results per page (1-100) |
| offset | number | 0 | Pagination offset |

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "iso_27001",
      "name": "ISO 27001",
      "fullName": "ISO/IEC 27001:2022",
      "version": "2022",
      "effectiveDate": "2022-10-25",
      "description": "Information security management systems",
      "category": "security",
      "jurisdiction": "global",
      "authority": "ISO/IEC",
      "totalControls": 93,
      "criticalControls": 15,
      "isActive": true
    }
  ],
  "pagination": { ... }
}
```

### GET /frameworks/:frameworkId

Get framework details with domain breakdown.

**Response** includes `domainBreakdown` array showing control count per domain.

### GET /frameworks/:frameworkId/controls

List controls for a specific framework.

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| domain | string | - | Filter by control domain |
| riskCategory | enum | - | Filter by risk: `critical`, `high`, `medium`, `low` |
| automatedOnly | boolean | - | Only return controls with automated tests |
| limit | number | 100 | Results per page (1-500) |
| offset | number | 0 | Pagination offset |

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "frameworkId": "iso_27001",
      "controlNumber": "A.5.1",
      "domain": "Organizational controls",
      "subdomain": "Policies for information security",
      "title": "Policies for information security",
      "description": "Information security policy and topic-specific policies...",
      "objective": "To provide management direction and support...",
      "implementationGuidance": "Step-by-step implementation guide...",
      "evidenceRequirements": [
        {
          "id": "uuid",
          "type": "document",
          "description": "Information security policy document",
          "mandatory": true
        }
      ],
      "testingProcedures": [
        {
          "id": "uuid",
          "name": "Policy Review",
          "description": "Verify policy exists and is current",
          "automated": false,
          "expectedResult": "Policy dated within last 12 months"
        }
      ],
      "riskCategory": "high",
      "implementationPriority": 1,
      "automatedTestAvailable": false,
      "aiAssessmentPrompt": "Evaluate the organization's information security policy..."
    }
  ],
  "pagination": { ... }
}
```

---

## Control Endpoints

### GET /controls/:controlId

Get control details with cross-framework mappings.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "controlNumber": "A.5.1",
    "title": "Policies for information security",
    ...
    "crossFrameworkMappings": [
      {
        "id": "uuid",
        "targetControlId": "uuid",
        "targetControlNumber": "PR.PO-1",
        "targetTitle": "Policy is established based on organizational risk strategy",
        "targetFramework": "NIST CSF",
        "mappingType": "equivalent",
        "confidenceScore": 0.92,
        "notes": "Direct mapping with similar scope"
      }
    ]
  }
}
```

### GET /controls/:controlId/guidance

Get AI-assisted implementation guidance for a control.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| context | string | Additional context for guidance generation |

**Response**:
```json
{
  "success": true,
  "data": {
    "control": {
      "id": "uuid",
      "number": "A.5.1",
      "title": "Policies for information security",
      "framework": "ISO 27001"
    },
    "overview": "Description of the control...",
    "objective": "What this control aims to achieve...",
    "implementationSteps": [
      {
        "step": 1,
        "title": "Assess Current State",
        "description": "Review existing policies and procedures..."
      },
      {
        "step": 2,
        "title": "Identify Gaps",
        "description": "Compare current practices against control requirements..."
      }
    ],
    "evidenceRequired": [ ... ],
    "testingProcedures": [ ... ],
    "riskConsiderations": {
      "riskCategory": "high",
      "priority": 1,
      "failureImpact": "Non-compliance may result in..."
    },
    "resources": [
      {
        "type": "documentation",
        "title": "ISO 27001 Official Documentation",
        "url": "..."
      }
    ],
    "generatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## Assessment Endpoints

### POST /assessments

Create a new compliance assessment.

**Request Body**:
```json
{
  "frameworkId": "iso_27001",
  "targetSystemId": "system-uuid",
  "targetSystemName": "Customer Service AI",
  "targetSystemDescription": "AI-powered chatbot for customer inquiries",
  "scope": ["A.5", "A.6", "A.7"],
  "excludedControls": ["A.5.3", "A.7.2"]
}
```

**Validation**:
- `frameworkId`: Required, must be valid framework ID
- `targetSystemId`: Required, non-empty string
- `targetSystemName`: Required, non-empty string
- `scope`: Optional array of domain/control prefixes
- `excludedControls`: Optional array of control numbers to skip

### GET /assessments

List assessments for the tenant.

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| frameworkId | string | - | Filter by framework |
| targetSystemId | string | - | Filter by target system |
| status | enum | - | `pending`, `in_progress`, `completed`, `failed`, `cancelled` |
| page | number | 1 | Page number |
| limit | number | 20 | Results per page (1-100) |
| sortBy | string | `created_at` | Sort field |
| sortOrder | enum | `desc` | `asc` or `desc` |

### GET /assessments/:assessmentId

Get assessment details.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "tenant-uuid",
    "frameworkId": "iso_27001",
    "targetSystemId": "system-uuid",
    "targetSystemName": "Customer Service AI",
    "status": "completed",
    "overallScore": 78.5,
    "riskLevel": "medium",
    "totalControlsAssessed": 93,
    "compliantControls": 72,
    "nonCompliantControls": 8,
    "partialControls": 10,
    "notApplicableControls": 3,
    "criticalFindings": 2,
    "majorFindings": 5,
    "minorFindings": 8,
    "observations": 3,
    "aiModelUsed": "mageagent-hybrid",
    "aiConfidence": 0.85,
    "humanReviewed": false,
    "startedAt": "2024-01-15T10:00:00Z",
    "completedAt": "2024-01-15T10:45:00Z",
    "createdAt": "2024-01-15T09:55:00Z",
    "updatedAt": "2024-01-15T10:45:00Z"
  }
}
```

### POST /assessments/:assessmentId/run

Execute a compliance assessment.

**Request Body**:
```json
{
  "useAI": true,
  "aiModel": "mageagent-hybrid",
  "includeRecommendations": true
}
```

**Response**: Returns updated assessment with status `in_progress` or `completed`.

### GET /assessments/:assessmentId/findings

Get findings for an assessment.

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | enum | - | `compliant`, `non_compliant`, `partial`, `not_applicable`, `not_assessed` |
| severity | enum | - | `critical`, `major`, `minor`, `observation` |
| page | number | 1 | Page number |
| limit | number | 50 | Results per page (1-100) |

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "assessmentId": "assessment-uuid",
      "controlId": "control-uuid",
      "tenantId": "tenant-uuid",
      "status": "non_compliant",
      "severity": "major",
      "findingTitle": "Missing encryption at rest",
      "findingDescription": "Data stored in S3 buckets is not encrypted...",
      "evidence": [ ... ],
      "aiAssessment": "AI analysis indicates...",
      "aiConfidence": 0.87,
      "aiReasoning": "Based on provided evidence...",
      "remediationRequired": true,
      "remediationStatus": "pending",
      "remediationPlan": "Enable S3 default encryption...",
      "humanVerified": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

## Report Endpoints

### POST /reports/generate

Generate a compliance report.

**Request Body**:
```json
{
  "assessmentId": "assessment-uuid",
  "reportType": "executive_summary",
  "format": "pdf",
  "includeEvidence": false,
  "includeRemediation": true,
  "recipientEmail": "compliance@example.com"
}
```

**Report Types**:
- `executive_summary`: High-level overview for executives
- `full_audit`: Complete audit report with all findings
- `gap_analysis`: Focus on non-compliant areas
- `remediation_plan`: Prioritized remediation tasks
- `board_presentation`: Summary for board review

**Formats**: `pdf`, `html`, `markdown`, `json`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenantId": "tenant-uuid",
    "assessmentId": "assessment-uuid",
    "title": "Executive Summary - Customer Service AI",
    "reportType": "executive_summary",
    "format": "pdf",
    "status": "completed",
    "executiveSummary": {
      "overallScore": 78.5,
      "riskLevel": "medium",
      "frameworksCovered": ["iso_27001"],
      "keyFindings": ["Missing encryption", "Incomplete access logs"],
      "criticalGaps": 2,
      "immediateActions": ["Enable encryption", "Configure audit logging"],
      "complianceTrend": "improving",
      "generatedAt": "2024-01-15T11:00:00Z"
    },
    "generationTimeMs": 3500,
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
```

### GET /reports

List generated reports.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| reportType | enum | Filter by report type |
| format | enum | Filter by format |
| limit | number | Results per page |
| offset | number | Pagination offset |

### GET /reports/:reportId

Get report details and download URL.

---

## AI Systems Endpoints

### POST /ai-systems

Register an AI system in the registry.

**Request Body**:
```json
{
  "systemId": "hiring-ai-v2",
  "name": "AI Hiring Assistant",
  "description": "Automated resume screening and candidate ranking",
  "version": "2.0.0",
  "provider": "Internal Development",
  "providerContact": "ai-team@example.com",
  "isThirdParty": false,
  "environments": ["production", "staging"],
  "dataCategories": ["personal_data", "employment_history"],
  "purposeOfProcessing": ["employment_decisions"],
  "dataSources": ["applicant_forms", "linkedin_api"],
  "humanOversightEnabled": true,
  "humanOversightDescription": "HR review of all AI recommendations",
  "humanOversightContact": "hr-director@example.com",
  "tags": ["high-risk", "employment"]
}
```

### POST /ai-systems/:systemId/classify

Classify AI system risk level per EU AI Act.

**Request Body**:
```json
{
  "systemDescription": "Automated hiring decision support",
  "useCases": ["Resume screening", "Candidate ranking", "Interview scheduling"],
  "dataCategories": ["personal_data", "professional_history"],
  "affectedPersons": ["job_applicants", "candidates"],
  "riskFactors": ["employment_decisions", "personal_data_processing"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "riskClassification": "high_risk",
    "classificationRationale": "AI system used in employment context falls under Annex III...",
    "requiredMeasures": [
      "Risk management system",
      "Data governance",
      "Technical documentation",
      "Human oversight"
    ],
    "relatedControls": ["EU-AI-R1", "EU-AI-R2", ...],
    "confidenceScore": 0.92
  }
}
```

---

## Qualitative Assessment Endpoints

### Z-Inspection Routes

#### POST /qualitative/z-inspection/import

Import a Z-Inspection report.

**Request Body**:
```json
{
  "aiSystemId": "system-uuid",
  "title": "Z-Inspection Report Q4 2024",
  "reportDate": "2024-12-15",
  "inspectionTeam": [
    {"name": "Dr. Jane Smith", "role": "Lead Inspector", "affiliation": "University X"}
  ],
  "importMethod": "json_import",
  "sourceDocumentType": "structured_json",
  "content": "{ ... JSON content ... }",
  "sourceDocumentUrl": "https://..."
}
```

**Import Methods**: `manual`, `json_import`, `xml_import`, `ai_parsed`

#### POST /qualitative/z-inspection/:id/process

Process an imported report to extract findings, scenarios, and tensions.

#### POST /qualitative/z-inspection/:id/create-assessment

Create a trustworthiness assessment from the processed report.

### Tension Routes

#### POST /qualitative/tensions

Create an ethical tension.

**Request Body**:
```json
{
  "aiSystemId": "system-uuid",
  "scenarioId": "scenario-uuid",
  "title": "Privacy vs Personalization",
  "description": "Tension between user privacy and service quality",
  "valueA": "User Privacy",
  "valueADescription": "Minimizing data collection",
  "valueB": "Service Quality",
  "valueBDescription": "Personalized recommendations",
  "tensionType": "value_vs_value",
  "requirementA": "privacy_data_governance",
  "requirementB": "human_agency_oversight",
  "affectedStakeholders": ["stakeholder-uuid-1"],
  "severity": "significant"
}
```

**Tension Types**:
- `value_vs_value`: Conflict between different values
- `stakeholder_vs_stakeholder`: Conflict between stakeholder interests
- `requirement_vs_requirement`: Conflict between compliance requirements
- `short_term_vs_long_term`: Temporal trade-off

**Severity Levels**: `critical`, `significant`, `moderate`, `minor`

#### POST /qualitative/tensions/:id/resolve

Document tension resolution.

**Request Body**:
```json
{
  "resolutionApproach": "Privacy-by-default with opt-in personalization",
  "resolutionRationale": "Balances both values while respecting user choice",
  "tradeOffDecision": "Reduced personalization for non-opted users",
  "residualConcerns": "User understanding of opt-in implications",
  "newStatus": "mitigated"
}
```

---

## Monitoring Endpoints

### GET /monitoring/dashboard

Get compliance dashboard data.

**Response**:
```json
{
  "success": true,
  "data": {
    "kpis": {
      "overallScore": 78.5,
      "scoreChange": 2.3,
      "totalControls": 688,
      "implementedControls": 542,
      "criticalGaps": 5,
      "upcomingDeadlines": 3
    },
    "frameworkScores": [
      {
        "frameworkId": "iso_27001",
        "frameworkName": "ISO 27001",
        "score": 85,
        "controlCount": 93,
        "implementedCount": 79,
        "criticalGaps": 1
      }
    ],
    "requirementScores": [
      {
        "requirement": "human_agency_oversight",
        "label": "Human Agency",
        "score": 72,
        "controlCount": 45,
        "implementedCount": 32
      }
    ],
    "recentAlerts": [ ... ],
    "riskDistribution": [
      {"level": "critical", "count": 5, "percentage": 3.4},
      {"level": "high", "count": 15, "percentage": 10.2}
    ]
  }
}
```

### GET /monitoring/alerts

Get compliance alerts.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| type | enum | `drift`, `expiration`, `new_requirement`, `risk_increase`, `overdue_remediation` |
| severity | enum | `info`, `warning`, `error`, `critical` |
| acknowledged | boolean | Filter by acknowledgement status |
| limit | number | Results per page |
| offset | number | Pagination offset |

---

## Cross-Framework Analysis Endpoints

### GET /analysis/cross-framework/matrix

Get control mapping matrix between frameworks.

**Response**:
```json
{
  "success": true,
  "data": {
    "frameworks": [
      {"id": "iso_27001", "name": "ISO 27001", "controlCount": 93},
      {"id": "gdpr", "name": "GDPR", "controlCount": 220}
    ],
    "matrix": [
      [
        {"framework1Id": "iso_27001", "framework2Id": "gdpr", "mappingCount": 45, "overlapPercentage": 48.4}
      ]
    ],
    "summary": {
      "totalFrameworks": 6,
      "totalMappings": 1250,
      "averageOverlap": 35.2,
      "mostMappedFramework": "ISO 27001"
    }
  }
}
```

### GET /analysis/cross-framework/gaps

Identify unmapped controls and requirements.

### GET /analysis/cross-framework/coverage

Get requirement coverage across frameworks.

---

## Evidence Endpoints

### POST /evidence

Upload evidence for a control.

**Request Body**:
```json
{
  "controlId": "control-uuid",
  "findingId": "finding-uuid",
  "assessmentId": "assessment-uuid",
  "type": "document",
  "title": "Information Security Policy v2.0",
  "description": "Updated corporate security policy",
  "collectedAt": "2024-01-10T00:00:00Z",
  "validFrom": "2024-01-10T00:00:00Z",
  "validUntil": "2025-01-10T00:00:00Z"
}
```

**Evidence Types**: `document`, `screenshot`, `log`, `interview`, `observation`, `code`, `config`

---

## Health Endpoint

### GET /health

Health check for the compliance engine.

**Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-15T12:00:00Z",
  "database": "connected",
  "mageagent": "available"
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `CONFLICT` | 409 | Resource already exists |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `MAGEAGENT_ERROR` | 502 | MageAgent service unavailable |

---

## Rate Limits

| Endpoint Category | Rate Limit |
|------------------|------------|
| Read operations | 1000 requests/minute |
| Write operations | 100 requests/minute |
| Report generation | 10 requests/minute |
| AI operations | 20 requests/minute |

Exceeded limits return HTTP 429 with `Retry-After` header.

---

## Pagination

All list endpoints support pagination:

**Request**:
```
GET /api/v1/compliance/controls?page=2&limit=50
```

**Response includes**:
```json
{
  "pagination": {
    "total": 688,
    "page": 2,
    "limit": 50,
    "totalPages": 14,
    "hasNext": true,
    "hasPrevious": true
  }
}
```

---

## Filtering and Sorting

Most list endpoints support filtering and sorting via query parameters. See individual endpoint documentation for available options.

Example:
```
GET /api/v1/compliance/assessments?status=completed&sortBy=created_at&sortOrder=desc
```
