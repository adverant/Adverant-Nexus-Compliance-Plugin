# Nexus Compliance Engine

Enterprise compliance assessment plugin for the Nexus platform, featuring Z-Inspection aligned qualitative assessment methodology with 688+ controls across 6 regulatory frameworks.

## Overview

The Nexus Compliance Engine provides organizations with a unified platform for managing regulatory compliance across multiple frameworks. The plugin combines quantitative control-based assessments with qualitative trustworthiness evaluations aligned with the Z-Inspection methodology for AI systems.

## Supported Frameworks

| Framework | Controls | Jurisdiction | Category |
|-----------|----------|--------------|----------|
| ISO 27001 | 93 | Global | Security |
| GDPR | 220 | EU | Privacy |
| EU AI Act | 149 | EU | AI Governance |
| NIS2 | 112 | EU | Cybersecurity |
| SOC 2 | 64 | US | Security |
| ISO 27701 | 50 | Global | Privacy |

**Total: 688+ controls with cross-framework mapping**

## Key Features

### Quantitative Compliance Assessment
- Control-based assessments across 6 frameworks
- AI-assisted evidence evaluation using MageAgent integration
- Gap analysis and remediation planning
- Multi-format report generation (PDF, HTML, Markdown, JSON)

### Qualitative Trustworthiness Evaluation
Based on the 7 EU Trustworthy AI Requirements:
- Human Agency and Oversight
- Technical Robustness and Safety
- Privacy and Data Governance
- Transparency
- Diversity, Fairness, and Non-discrimination
- Societal and Environmental Wellbeing
- Accountability

### Z-Inspection Integration
- Import Z-Inspection reports (JSON, XML, manual entry)
- AI-powered parsing of unstructured reports
- Automatic extraction of findings, scenarios, and ethical tensions
- Mapping of qualitative findings to quantitative controls

### Cross-Framework Analysis
- Control mapping between frameworks with confidence scoring
- Overlap analysis and visualization
- Gap identification across frameworks
- Unified compliance scoring

### Ethical Tension Management
- Identification of value conflicts (value vs. value, stakeholder vs. stakeholder)
- Resolution tracking with rationale documentation
- Stakeholder perspective recording
- AI-assisted tension identification

### Stakeholder Management
- Stakeholder registry with vulnerability assessment
- Impact and power/interest mapping
- Engagement tracking and documentation
- Concerns and interests recording

## Technology Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Fastify 5.x
- **Database**: PostgreSQL with multi-tenant schema
- **Validation**: Zod schemas
- **AI Integration**: MageAgent client for AI-powered assessments
- **Logging**: Pino logger

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS with Coinest theme
- **State Management**: Zustand, TanStack Query
- **Charts**: Recharts
- **Validation**: Zod schemas (shared with backend)

## Installation

### Prerequisites
- Node.js 20.0.0 or higher
- PostgreSQL 14+ database
- Nexus platform with core, MageAgent, and GraphRAG dependencies

### Package Installation

```bash
# Clone the repository
git clone https://github.com/adverant/Adverant-Nexus-Compliance-Plugin.git
cd Adverant-Nexus-Compliance-Plugin

# Install dependencies
npm install

# Build both backend and frontend
npm run build
```

### Database Setup

```bash
# Run database migrations
cd backend
npm run migrate

# Seed initial framework and control data
npm run seed
```

### Configuration

Set the following environment variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/nexus_compliance

# Nexus Platform
NEXUS_API_URL=http://localhost:3000
NEXUS_API_KEY=your-api-key

# MageAgent (optional, for AI features)
MAGEAGENT_URL=http://localhost:3457
```

## Running the Plugin

### Development Mode

```bash
# Run backend in development
cd backend && npm run dev

# Run frontend in development (separate terminal)
cd frontend && npm run dev
```

### Production Mode

```bash
# Build and start
npm run build
cd backend && npm start
```

## API Routes

All API endpoints are prefixed with `/api/v1/plugins/compliance/`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/frameworks` | GET | List available frameworks |
| `/frameworks/:id` | GET | Get framework details |
| `/frameworks/:id/controls` | GET | List controls for framework |
| `/controls/:id` | GET | Get control details with mappings |
| `/controls/:id/guidance` | GET | Get AI implementation guidance |
| `/assessments` | GET, POST | List/create assessments |
| `/assessments/:id` | GET | Get assessment details |
| `/assessments/:id/run` | POST | Execute assessment |
| `/assessments/:id/findings` | GET | Get assessment findings |
| `/reports/generate` | POST | Generate compliance report |
| `/reports` | GET | List generated reports |
| `/ai-systems` | GET, POST | Manage AI system registry |
| `/monitoring/alerts` | GET | Get compliance alerts |
| `/monitoring/dashboard` | GET | Get dashboard data |

## UI Routes

The frontend mounts at `/plugins/compliance/` with the following pages:

| Path | Page | Description |
|------|------|-------------|
| `/` | Dashboard | Overview with KPIs and charts |
| `/controls` | Control Library | Browse 688+ controls |
| `/cross-framework` | Cross-Framework | Analyze framework overlap |
| `/trustworthiness` | Trustworthiness | Qualitative assessments |
| `/tensions` | Ethical Tensions | Manage value conflicts |
| `/z-inspection` | Z-Inspection | Import and manage reports |
| `/regulatory` | Regulatory Updates | Monitor regulatory changes |
| `/assessments` | Assessments | Manage assessments |
| `/assessments/new` | New Assessment | Create assessment |
| `/reports` | Reports | Generated reports |
| `/settings` | Settings | Plugin configuration |

## Pricing

| Tier | Price | Features |
|------|-------|----------|
| Starter | $499/month | 3 frameworks, 100 controls, Basic reporting |
| Professional | $1,499/month | All 6 frameworks, 688+ controls, Cross-framework analysis, Z-Inspection integration |
| Enterprise | Custom/year | Professional features + Custom frameworks, Dedicated support, SLA, On-premise deployment |

## Permissions Required

The plugin requires the following Nexus permissions:

- `tenant:read` - Read tenant information
- `tenant:write` - Update tenant compliance settings
- `ai-systems:read` - Read AI system registry
- `ai-systems:write` - Register and update AI systems
- `assessments:read` - View assessments and findings
- `assessments:write` - Create and run assessments
- `evidence:read` - View uploaded evidence
- `evidence:write` - Upload and manage evidence

## Dependencies

### Nexus Platform Dependencies
- `nexus-core` >= 1.0.0
- `nexus-mageagent` >= 1.0.0
- `nexus-graphrag` >= 1.0.0

## License

UNLICENSED - Proprietary software. All rights reserved.

## Support

For support inquiries, contact the Adverant team through the Nexus platform support channels.

---

Built by [Adverant](https://adverant.ai)