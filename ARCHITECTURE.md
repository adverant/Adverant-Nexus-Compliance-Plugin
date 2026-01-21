# Architecture Documentation

This document describes the technical architecture of the Nexus Compliance Engine plugin, based on the actual codebase structure.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Nexus Platform                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   Compliance Plugin                          │   │
│  │  ┌─────────────────┐       ┌─────────────────────────────┐  │   │
│  │  │    Frontend     │◄─────►│          Backend            │  │   │
│  │  │   (Next.js)     │  API  │         (Fastify)           │  │   │
│  │  └─────────────────┘       └──────────────┬──────────────┘  │   │
│  │                                           │                  │   │
│  │                              ┌────────────┼────────────┐    │   │
│  │                              │            │            │    │   │
│  │                              ▼            ▼            ▼    │   │
│  │                        ┌──────────┐ ┌──────────┐ ┌────────┐│   │
│  │                        │PostgreSQL│ │MageAgent │ │GraphRAG││   │
│  │                        │ Database │ │   API    │ │  API   ││   │
│  │                        └──────────┘ └──────────┘ └────────┘│   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ Nexus Core  │  │ Auth Service│  │ Other Plugins│               │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
Adverant-Nexus-Compliance-Plugin/
├── package.json                 # Root workspace configuration
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts             # Server entry point
│       ├── config/
│       │   └── index.ts         # Configuration management
│       ├── database/
│       │   ├── client.ts        # PostgreSQL client
│       │   ├── migrate.ts       # Migration runner
│       │   └── seed.ts          # Initial data seeder
│       ├── api/
│       │   ├── routes/          # API route handlers
│       │   │   ├── index.ts
│       │   │   ├── health.ts
│       │   │   ├── config.ts
│       │   │   ├── frameworks.ts
│       │   │   ├── ai-systems.ts
│       │   │   ├── assessments.ts
│       │   │   ├── evidence.ts
│       │   │   ├── monitoring.ts
│       │   │   ├── qualitative-routes.ts
│       │   │   ├── analysis-routes.ts
│       │   │   ├── visualization-routes.ts
│       │   │   └── learning-routes.ts
│       │   └── middleware/
│       │       ├── index.ts
│       │       ├── context.ts   # Request context extraction
│       │       ├── response.ts  # Response helpers
│       │       └── error-handler.ts
│       ├── services/
│       │   ├── index.ts
│       │   ├── assessment-service.ts
│       │   ├── report-service.ts
│       │   ├── z-inspection-service.ts
│       │   ├── tension-service.ts
│       │   ├── stakeholder-service.ts
│       │   ├── scenario-service.ts
│       │   ├── cross-analysis-service.ts
│       │   ├── evidence-service.ts
│       │   ├── monitoring-service.ts
│       │   ├── alert-service.ts
│       │   ├── regulatory-monitor-service.ts
│       │   ├── control-generator-service.ts
│       │   ├── compliance-toggle-service.ts
│       │   ├── qualitative-assessment-service.ts
│       │   ├── visualization-service.ts
│       │   ├── mageagent-assessment-service.ts
│       │   ├── auto-assessment-service.ts
│       │   ├── framework-discoverer-service.ts
│       │   └── graphrag-compliance-service.ts
│       ├── adapters/
│       │   ├── index.ts
│       │   ├── base-adapter.ts
│       │   ├── adapter-registry.ts
│       │   ├── qualys-adapter.ts
│       │   ├── aws-config-adapter.ts
│       │   └── splunk-adapter.ts
│       ├── clients/
│       │   └── mageagent-client.ts
│       ├── jobs/
│       │   └── compliance-scheduler.ts
│       ├── types/
│       │   ├── index.ts         # Core type definitions
│       │   └── qualitative.ts   # Z-Inspection aligned types
│       ├── utils/
│       │   ├── logger.ts        # Pino logger configuration
│       │   └── request-helpers.ts
│       └── validation/
│           └── tension-schemas.ts
│
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── next.config.js
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx
        │   └── compliance/
        │       ├── layout.tsx
        │       ├── page.tsx             # Dashboard
        │       ├── controls/
        │       │   └── page.tsx         # Control library
        │       ├── cross-framework/
        │       │   └── page.tsx         # Cross-framework analysis
        │       ├── trustworthiness/
        │       │   └── page.tsx         # Trustworthiness assessment
        │       ├── tensions/
        │       │   └── page.tsx         # Ethical tensions
        │       ├── z-inspection/
        │       │   └── page.tsx         # Z-Inspection reports
        │       ├── regulatory/
        │       │   └── page.tsx         # Regulatory monitoring
        │       ├── assessments/
        │       │   ├── page.tsx         # Assessment list
        │       │   ├── new/
        │       │   │   └── page.tsx     # Create assessment
        │       │   └── [id]/
        │       │       ├── page.tsx     # Assessment details
        │       │       ├── execute/
        │       │       │   └── page.tsx # Run assessment
        │       │       ├── findings/
        │       │       │   └── page.tsx # View findings
        │       │       └── results/
        │       │           └── page.tsx # Assessment results
        │       ├── reports/
        │       │   ├── page.tsx         # Report list
        │       │   └── new/
        │       │       └── page.tsx     # Generate report
        │       └── settings/
        │           └── page.tsx         # Plugin settings
        ├── components/
        │   ├── compliance/
        │   │   ├── index.ts
        │   │   ├── ComplianceLayout.tsx
        │   │   ├── Sidebar.tsx
        │   │   ├── PageHeader.tsx
        │   │   ├── EvidenceUploadWidget.tsx
        │   │   └── RemediationPlanForm.tsx
        │   ├── coinest/              # Theme components
        │   │   ├── index.ts
        │   │   ├── StatCard.tsx
        │   │   ├── ChartCard.tsx
        │   │   └── DataTable.tsx
        │   ├── providers/
        │   │   └── ThemeProvider.tsx
        │   ├── error-boundary.tsx
        │   ├── error-state.tsx
        │   ├── skeleton.tsx
        │   └── toast.tsx
        ├── hooks/
        │   ├── useApiQuery.ts
        │   └── useThemeClasses.ts
        ├── lib/
        │   ├── api.ts
        │   ├── compliance-api.ts
        │   └── utils.ts
        ├── stores/
        │   ├── theme-store.ts
        │   └── assessment-wizard-store.ts
        └── types/
            └── compliance.ts         # Frontend type definitions
```

## Backend Architecture

### Server Configuration

The backend uses Fastify as the HTTP framework with the following plugins:

```typescript
// src/index.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';

const server = Fastify({
  logger: pinoLogger,
  requestIdHeader: 'x-request-id',
});

await server.register(cors, { origin: true });
await server.register(helmet);
```

### Route Registration

Routes are registered with a common prefix and organized by domain:

```typescript
// Route registration
server.register(healthRoutes, { prefix: '/health' });
server.register(configRoutes, { prefix: '/api/v1/compliance' });
server.register(frameworkRoutes, { prefix: '/api/v1/compliance' });
server.register(aiSystemsRoutes, { prefix: '/api/v1/compliance' });
server.register(assessmentRoutes, { prefix: '/api/v1/compliance' });
server.register(evidenceRoutes, { prefix: '/api/v1/compliance' });
server.register(monitoringRoutes, { prefix: '/api/v1/compliance' });
server.register(qualitativeRoutes, { prefix: '/api/v1/compliance/qualitative' });
server.register(analysisRoutes, { prefix: '/api/v1/compliance/analysis' });
server.register(visualizationRoutes, { prefix: '/api/v1/compliance/visualization' });
server.register(learningRoutes, { prefix: '/api/v1/compliance/learning' });
```

### Service Layer

Services encapsulate business logic and are instantiated as singletons:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Services Layer                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Quantitative Assessment                     │   │
│  │  ┌─────────────────┐  ┌─────────────────────────────┐  │   │
│  │  │AssessmentService│  │    ReportService            │  │   │
│  │  └────────┬────────┘  └─────────────┬───────────────┘  │   │
│  │           │                         │                   │   │
│  │           │    ┌────────────────────┼────────┐         │   │
│  │           ▼    ▼                    ▼        ▼         │   │
│  │  ┌─────────────────┐  ┌─────────────────────────────┐  │   │
│  │  │ EvidenceService │  │MageAgentAssessmentService   │  │   │
│  │  └─────────────────┘  └─────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               Qualitative Assessment                     │   │
│  │  ┌─────────────────┐  ┌─────────────────────────────┐  │   │
│  │  │ZInspectionService│ │QualitativeAssessmentService │  │   │
│  │  └────────┬────────┘  └─────────────┬───────────────┘  │   │
│  │           │                         │                   │   │
│  │           ▼                         ▼                   │   │
│  │  ┌─────────────────┐  ┌─────────────────────────────┐  │   │
│  │  │ TensionService  │  │   StakeholderService        │  │   │
│  │  └─────────────────┘  └─────────────────────────────┘  │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │           ScenarioService                        │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Analysis & Monitoring                   │   │
│  │  ┌─────────────────┐  ┌─────────────────────────────┐  │   │
│  │  │CrossAnalysis-   │  │   MonitoringService         │  │   │
│  │  │   Service       │  └─────────────┬───────────────┘  │   │
│  │  └────────┬────────┘                │                   │   │
│  │           │                         ▼                   │   │
│  │           │           ┌─────────────────────────────┐  │   │
│  │           │           │     AlertService            │  │   │
│  │           │           └─────────────────────────────┘  │   │
│  │           │                                             │   │
│  │           ▼           ┌─────────────────────────────┐  │   │
│  │  ┌─────────────────┐  │RegulatoryMonitorService     │  │   │
│  │  │Visualization-   │  └─────────────────────────────┘  │   │
│  │  │   Service       │                                   │   │
│  │  └─────────────────┘                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

The plugin uses PostgreSQL with a multi-tenant schema design:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Database Schema                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Framework & Controls                    │   │
│  │  ┌──────────────────────┐  ┌─────────────────────────┐  │   │
│  │  │compliance_frameworks │  │  compliance_controls    │  │   │
│  │  │  - id                │  │  - id                   │  │   │
│  │  │  - name              │◄─┤  - framework_id         │  │   │
│  │  │  - version           │  │  - control_number       │  │   │
│  │  │  - category          │  │  - title                │  │   │
│  │  │  - jurisdiction      │  │  - description          │  │   │
│  │  │  - total_controls    │  │  - risk_category        │  │   │
│  │  └──────────────────────┘  │  - implementation_priority│ │   │
│  │                            │  - automated_test_available│ │   │
│  │                            │  - ai_assessment_prompt  │  │   │
│  │                            └─────────────────────────┘  │   │
│  │                                                         │   │
│  │  ┌──────────────────────┐  ┌─────────────────────────┐  │   │
│  │  │  control_mappings    │  │control_cross_references │  │   │
│  │  │  - source_control_id │  │  - source_control_id    │  │   │
│  │  │  - target_control_id │  │  - target_control_id    │  │   │
│  │  │  - mapping_type      │  │  - relationship_type    │  │   │
│  │  │  - confidence_score  │  │  - mapping_confidence   │  │   │
│  │  └──────────────────────┘  └─────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Assessments                           │   │
│  │  ┌──────────────────────┐  ┌─────────────────────────┐  │   │
│  │  │compliance_assessments│  │   control_findings      │  │   │
│  │  │  - id                │  │   - id                  │  │   │
│  │  │  - tenant_id         │◄─┤   - assessment_id       │  │   │
│  │  │  - framework_id      │  │   - control_id          │  │   │
│  │  │  - target_system_id  │  │   - status              │  │   │
│  │  │  - status            │  │   - severity            │  │   │
│  │  │  - overall_score     │  │   - ai_assessment       │  │   │
│  │  │  - risk_level        │  │   - remediation_status  │  │   │
│  │  └──────────────────────┘  └─────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Qualitative Assessment (Z-Inspection)       │   │
│  │  ┌──────────────────────┐  ┌─────────────────────────┐  │   │
│  │  │trustworthiness_      │  │ socio_technical_        │  │   │
│  │  │  assessments         │  │   scenarios             │  │   │
│  │  │  - id                │  │  - id                   │  │   │
│  │  │  - ai_system_id      │  │  - ai_system_id         │  │   │
│  │  │  - overall_rating    │  │  - title                │  │   │
│  │  │  - requirement_      │  │  - scenario_type        │  │   │
│  │  │    assessments       │  │  - primary_requirement  │  │   │
│  │  └──────────────────────┘  └─────────────────────────┘  │   │
│  │                                                         │   │
│  │  ┌──────────────────────┐  ┌─────────────────────────┐  │   │
│  │  │  ethical_tensions    │  │    stakeholders         │  │   │
│  │  │  - id                │  │  - id                   │  │   │
│  │  │  - ai_system_id      │  │  - ai_system_id         │  │   │
│  │  │  - value_a           │  │  - stakeholder_type     │  │   │
│  │  │  - value_b           │  │  - impact_level         │  │   │
│  │  │  - tension_type      │  │  - vulnerability_factors│  │   │
│  │  │  - severity          │  └─────────────────────────┘  │   │
│  │  │  - status            │                               │   │
│  │  │  - resolution_approach│                              │   │
│  │  └──────────────────────┘                               │   │
│  │                                                         │   │
│  │  ┌──────────────────────┐  ┌─────────────────────────┐  │   │
│  │  │z_inspection_reports  │  │ qualitative_findings    │  │   │
│  │  │  - id                │  │  - id                   │  │   │
│  │  │  - ai_system_id      │  │  - assessment_id        │  │   │
│  │  │  - extracted_findings│  │  - finding_type         │  │   │
│  │  │  - extracted_tensions│  │  - requirement_id       │  │   │
│  │  │  - trustworthiness_  │  │  - severity             │  │   │
│  │  │    rating            │  │  - status               │  │   │
│  │  └──────────────────────┘  └─────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Supporting Tables                      │   │
│  │  ┌──────────────────────┐  ┌─────────────────────────┐  │   │
│  │  │   ai_systems         │  │  compliance_evidence    │  │   │
│  │  │   compliance_reports │  │  compliance_alerts      │  │   │
│  │  │   compliance_audit_log│ │  regulatory_updates     │  │   │
│  │  └──────────────────────┘  └─────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Multi-Tenant Isolation

All tables include a `tenant_id` column for data isolation:

```typescript
// All queries filter by tenant_id
const result = await query(
  `SELECT * FROM compliance_assessments
   WHERE id = $1 AND tenant_id = $2`,
  [assessmentId, context.tenantId]
);
```

### MageAgent Integration

The plugin integrates with MageAgent for AI-powered features:

```typescript
// src/clients/mageagent-client.ts
export class MageAgentClient {
  async assessControl(
    controlPrompt: string,
    evidence: Evidence[],
    systemDescription: string
  ): Promise<ControlAssessmentResult> {
    // Sends assessment request to MageAgent
    // Returns AI-generated assessment with confidence score
  }

  async parseZInspectionReport(
    content: string,
    documentType: string
  ): Promise<ZInspectionParseResult> {
    // Uses AI to extract structured data from unstructured reports
  }

  async identifyTensions(
    scenarios: SocioTechnicalScenario[],
    stakeholders: Stakeholder[]
  ): Promise<TensionIdentificationResult> {
    // AI-powered tension identification
  }
}
```

## Frontend Architecture

### Next.js App Router

The frontend uses Next.js 14 with the App Router pattern:

```
app/
├── compliance/
│   ├── layout.tsx      # Shared layout with sidebar
│   ├── page.tsx        # Dashboard (default route)
│   └── [feature]/
│       └── page.tsx    # Feature-specific pages
```

### State Management

**Zustand** for client-side state:

```typescript
// src/stores/assessment-wizard-store.ts
export const useAssessmentWizardStore = create<AssessmentWizardState>((set) => ({
  step: 1,
  frameworkId: null,
  targetSystem: null,
  scope: [],
  setStep: (step) => set({ step }),
  setFramework: (frameworkId) => set({ frameworkId }),
  // ...
}));
```

**TanStack Query** for server state:

```typescript
// src/hooks/useApiQuery.ts
export function useApiQuery<T>(
  queryFn: () => Promise<ApiResponse<T>>,
  options?: QueryOptions
) {
  return useQuery({
    queryKey: ['compliance', options?.key],
    queryFn: async () => {
      const response = await queryFn();
      if (!response.success) throw new Error(response.error?.message);
      return response.data;
    },
    ...options,
  });
}
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Component Hierarchy                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Layout Components                       │   │
│  │  ┌──────────────────────┐  ┌─────────────────────────┐  │   │
│  │  │  ComplianceLayout    │  │     Sidebar             │  │   │
│  │  │  - Header            │  │  - Navigation items     │  │   │
│  │  │  - Content area      │  │  - Framework selector   │  │   │
│  │  │  - Error boundary    │  │  - Quick actions        │  │   │
│  │  └──────────────────────┘  └─────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Page Components                         │   │
│  │  ┌──────────────────────┐  ┌─────────────────────────┐  │   │
│  │  │   PageHeader         │  │      ChartCard          │  │   │
│  │  │  - Title             │  │  - Recharts wrapper     │  │   │
│  │  │  - Description       │  │  - Theme integration    │  │   │
│  │  │  - Actions           │  └─────────────────────────┘  │   │
│  │  └──────────────────────┘                               │   │
│  │                                                         │   │
│  │  ┌──────────────────────┐  ┌─────────────────────────┐  │   │
│  │  │     StatCard         │  │     DataTable           │  │   │
│  │  │  - Value display     │  │  - Sortable columns     │  │   │
│  │  │  - Trend indicator   │  │  - Pagination           │  │   │
│  │  │  - Icon support      │  │  - Search/filter        │  │   │
│  │  └──────────────────────┘  └─────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Form Components                         │   │
│  │  ┌──────────────────────┐  ┌─────────────────────────┐  │   │
│  │  │EvidenceUploadWidget  │  │ RemediationPlanForm     │  │   │
│  │  │  - File upload       │  │  - Task management      │  │   │
│  │  │  - Type selection    │  │  - Priority setting     │  │   │
│  │  │  - Metadata input    │  │  - Due date picker      │  │   │
│  │  └──────────────────────┘  └─────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Radix UI Primitives                     │   │
│  │  Dialog, Dropdown, Tabs, Accordion, Progress, etc.      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Theming

The frontend uses a Coinest-based theme with Tailwind CSS:

```typescript
// src/hooks/useThemeClasses.ts
export function useThemeClasses() {
  const { theme } = useThemeStore();

  return {
    card: theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
    textPrimary: theme === 'dark' ? 'text-white' : 'text-gray-900',
    accentCyan: 'text-cyan-500',
    // ... more theme-aware classes
  };
}
```

## Type System

### Shared Types

Types are defined using Zod schemas for runtime validation with TypeScript inference:

```typescript
// Frontend: src/types/compliance.ts
export const FrameworkIdSchema = z.enum([
  'iso_27001', 'gdpr', 'eu_ai_act', 'nis2', 'soc2', 'iso_27701'
]);
export type FrameworkId = z.infer<typeof FrameworkIdSchema>;

// Backend: src/types/index.ts
export type FrameworkCategory =
  | 'security' | 'privacy' | 'ai_governance' | 'cybersecurity';

export interface ComplianceFramework {
  id: string;
  name: string;
  category: FrameworkCategory;
  // ...
}
```

### Qualitative Types

The Z-Inspection aligned types are defined separately:

```typescript
// src/types/qualitative.ts
export type TrustworthyAIRequirementId =
  | 'human_agency_oversight'
  | 'technical_robustness_safety'
  | 'privacy_data_governance'
  | 'transparency'
  | 'diversity_fairness_nondiscrimination'
  | 'societal_environmental_wellbeing'
  | 'accountability';

export type TensionType =
  | 'value_vs_value'
  | 'stakeholder_vs_stakeholder'
  | 'requirement_vs_requirement'
  | 'short_term_vs_long_term';
```

## Data Flow

### Assessment Execution Flow

```
┌────────────┐   Create    ┌──────────────┐   Run    ┌───────────────┐
│   Client   │────────────►│  Assessment  │─────────►│  MageAgent    │
│            │             │   Service    │          │   Service     │
└────────────┘             └──────────────┘          └───────────────┘
      │                           │                         │
      │                           │                         │
      │                           ▼                         │
      │                    ┌──────────────┐                 │
      │                    │   Database   │◄────────────────┘
      │                    │  PostgreSQL  │   Store Results
      │                    └──────────────┘
      │                           │
      │         Get Results       │
      ▼◄──────────────────────────┘
┌────────────┐
│  Findings  │
│  Response  │
└────────────┘
```

### Z-Inspection Import Flow

```
┌────────────┐   Import    ┌──────────────┐  Parse   ┌───────────────┐
│   Report   │────────────►│ Z-Inspection │─────────►│   MageAgent   │
│   Upload   │             │   Service    │          │   (AI Parse)  │
└────────────┘             └──────────────┘          └───────────────┘
                                  │                         │
                                  │                         │
                           Extract│◄────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ Findings │ │ Scenarios│ │ Tensions │
              └──────────┘ └──────────┘ └──────────┘
                    │             │             │
                    └─────────────┼─────────────┘
                                  │
                                  ▼
                         ┌──────────────┐
                         │  Assessment  │
                         │   Created    │
                         └──────────────┘
```

## Security Considerations

### Authentication
- All requests authenticated via Nexus platform
- JWT or API key validation
- Tenant isolation enforced at database layer

### Authorization
- Permission-based access control
- Role checks for sensitive operations
- Audit logging for all mutations

### Data Protection
- Tenant data isolation
- Encrypted connections (TLS)
- Input validation with Zod schemas
- SQL injection prevention via parameterized queries

## Performance Considerations

### Database
- Indexed queries on tenant_id and common filters
- Connection pooling
- Pagination for list endpoints

### Caching
- Framework overlap calculations cached (24-hour TTL)
- Dashboard data aggregation optimized

### Frontend
- Server-side rendering for initial load
- TanStack Query for client-side caching
- Lazy loading of chart components

## Extensibility

### Adding New Frameworks
1. Add framework definition to seed data
2. Add controls with evidence requirements
3. Create control mappings to existing frameworks
4. Update frontend framework selector

### Adding New Adapters
1. Extend `BaseAdapter` class
2. Implement `collectEvidence()` method
3. Register in `AdapterRegistry`

### Adding New Report Types
1. Add type to `ReportType` enum
2. Implement generation logic in `ReportService`
3. Add UI option in report generator form
