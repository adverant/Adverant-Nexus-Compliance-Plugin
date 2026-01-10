# Nexus Compliance Plugin - Backend

Enterprise-grade compliance assessment backend with 688+ controls across 6 regulatory frameworks, aligned with Z-Inspection methodology and EU Trustworthy AI requirements.

## 🎯 Overview

The Compliance Plugin Backend is a Fastify-based TypeScript microservice that provides comprehensive compliance assessment capabilities for AI systems. It implements a sophisticated control library, trustworthiness assessments, ethical tension analysis, and regulatory monitoring.

### Key Features

- **688+ Control Library**: Comprehensive controls from NIST AI RMF, EU AI Act, ISO 42001, SOC 2, GDPR, FedRAMP
- **Z-Inspection Integration**: Methodology for ethical AI assessment and documentation
- **Trustworthy AI Assessment**: Based on 7 EU Trustworthy AI requirements
- **Ethical Tension Analysis**: Multi-value conflict detection and resolution framework
- **Cross-Framework Mapping**: Control relationships and gap analysis across frameworks
- **Regulatory Monitoring**: Real-time tracking of compliance requirement changes
- **Evidence Management**: Structured artifact collection and validation
- **Assessment Execution**: Automated control evaluation with AI-powered analysis

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Nexus Compliance Backend                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Fastify    │  │   Fastify    │  │   Fastify    │          │
│  │   CORS       │  │   Helmet     │  │   Error      │          │
│  │   Middleware │  │   Security   │  │   Handler    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┴──────────────────┘                  │
│                            │                                      │
│              ┌─────────────┴─────────────┐                       │
│              │    API Routes Layer       │                       │
│              ├───────────────────────────┤                       │
│              │ /frameworks               │                       │
│              │ /controls                 │                       │
│              │ /assessments              │                       │
│              │ /trustworthiness/*        │                       │
│              │ /tensions                 │                       │
│              │ /z-inspection             │                       │
│              │ /regulatory               │                       │
│              │ /evidence                 │                       │
│              │ /cross-framework          │                       │
│              └─────────────┬─────────────┘                       │
│                            │                                      │
│              ┌─────────────┴─────────────┐                       │
│              │   Business Logic Layer    │                       │
│              ├───────────────────────────┤                       │
│              │ Framework Service         │                       │
│              │ Control Service           │                       │
│              │ Assessment Service        │                       │
│              │ Trustworthiness Service   │                       │
│              │ Tension Analysis Service  │                       │
│              │ Evidence Service          │                       │
│              └─────────────┬─────────────┘                       │
│                            │                                      │
│              ┌─────────────┴─────────────┐                       │
│              │    Data Access Layer      │                       │
│              ├───────────────────────────┤                       │
│              │ PostgreSQL Client         │                       │
│              │ Query Builder             │                       │
│              │ Transaction Manager       │                       │
│              └─────────────┬─────────────┘                       │
│                            │                                      │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                  ┌──────────┴──────────┐
                  │   PostgreSQL DB     │
                  ├─────────────────────┤
                  │ • frameworks        │
                  │ • controls          │
                  │ • assessments       │
                  │ • findings          │
                  │ • evidence          │
                  │ • tensions          │
                  │ • z_inspections     │
                  └─────────────────────┘
```

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── api/                      # API layer
│   │   ├── middleware/           # Shared middleware
│   │   │   ├── context.ts        # Request context (tenant, user)
│   │   │   ├── error-handler.ts  # Global error handling
│   │   │   ├── response.ts       # Standardized responses
│   │   │   └── index.ts          # Middleware exports
│   │   └── routes/               # Route handlers
│   │       ├── frameworks.ts     # Framework CRUD
│   │       ├── controls.ts       # Control library
│   │       ├── assessments.ts    # Assessment execution
│   │       ├── qualitative-routes.ts  # Trustworthiness API
│   │       ├── tensions.ts       # Ethical tensions
│   │       ├── evidence.ts       # Evidence management
│   │       ├── z-inspection.ts   # Z-Inspection reports
│   │       ├── regulatory.ts     # Regulatory monitoring
│   │       └── cross-framework.ts # Cross-framework analysis
│   │
│   ├── adapters/                 # External integrations
│   │   ├── base-adapter.ts       # Base adapter interface
│   │   ├── qualys-adapter.ts     # Qualys integration
│   │   ├── splunk-adapter.ts     # Splunk integration
│   │   ├── aws-config-adapter.ts # AWS Config integration
│   │   └── adapter-registry.ts   # Adapter management
│   │
│   ├── clients/                  # External service clients
│   │   └── mageagent-client.ts   # MageAgent AI client
│   │
│   ├── database/                 # Database layer
│   │   ├── client.ts             # PostgreSQL connection
│   │   ├── migrate.ts            # Migration runner
│   │   ├── seed.ts               # Seed data loader
│   │   └── migrations/           # SQL migration files
│   │       ├── 001_initial_schema.sql
│   │       ├── 002_frameworks.sql
│   │       ├── 003_controls.sql
│   │       ├── ...
│   │       └── 032_trustworthiness_findings.sql
│   │
│   ├── types/                    # TypeScript type definitions
│   │   ├── index.ts              # Core types
│   │   └── qualitative.ts        # Trustworthiness types
│   │
│   ├── utils/                    # Utility functions
│   │   ├── logger.ts             # Pino logger
│   │   └── request-helpers.ts    # Request utilities
│   │
│   ├── config/                   # Configuration
│   │   └── index.ts              # App configuration
│   │
│   └── index.ts                  # Application entry point
│
├── dist/                         # Compiled JavaScript (generated)
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (LTS recommended)
- PostgreSQL 14+
- Access to Nexus GraphRAG (optional, for AI-powered assessments)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run migrate

# Seed initial data (688 controls + frameworks)
npm run seed
```

### Development

```bash
# Start development server with hot reload
npm run dev

# TypeScript type checking
npm run typecheck

# Lint code
npm run lint
```

### Production Build

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm run start
```

## 🔌 API Endpoints

### Framework Management

```
GET    /api/v1/compliance/frameworks           # List all frameworks
GET    /api/v1/compliance/frameworks/:id       # Get framework details
POST   /api/v1/compliance/frameworks           # Create framework
PUT    /api/v1/compliance/frameworks/:id       # Update framework
DELETE /api/v1/compliance/frameworks/:id       # Delete framework
```

### Control Library

```
GET    /api/v1/compliance/controls              # List controls (paginated)
GET    /api/v1/compliance/controls/:id          # Get control details
POST   /api/v1/compliance/controls              # Create control
PUT    /api/v1/compliance/controls/:id          # Update control
DELETE /api/v1/compliance/controls/:id          # Delete control
GET    /api/v1/compliance/controls/search       # Search controls
```

### Assessment Execution

```
GET    /api/v1/compliance/assessments           # List assessments
GET    /api/v1/compliance/assessments/:id       # Get assessment
POST   /api/v1/compliance/assessments           # Create assessment
POST   /api/v1/compliance/assessments/:id/run   # Execute assessment
GET    /api/v1/compliance/assessments/:id/progress  # Get progress
GET    /api/v1/compliance/assessments/:id/findings  # Get findings
```

### Trustworthiness Assessment (EU AI Act)

```
GET    /api/v1/compliance/trustworthiness/dashboard          # Dashboard data
GET    /api/v1/compliance/trustworthiness/assessments        # List assessments
GET    /api/v1/compliance/trustworthiness/assessments/:id    # Get assessment
POST   /api/v1/compliance/trustworthiness/assessments        # Create assessment
PUT    /api/v1/compliance/trustworthiness/assessments/:id/requirements/:reqId  # Update requirement
PATCH  /api/v1/compliance/trustworthiness/assessments/:id/status  # Change status
GET    /api/v1/compliance/trustworthiness/coverage           # Coverage stats
POST   /api/v1/compliance/trustworthiness/assessments/:id/findings  # Create finding
GET    /api/v1/compliance/trustworthiness/assessments/:id/findings  # List findings
```

### Ethical Tensions

```
GET    /api/v1/compliance/tensions               # List tensions
GET    /api/v1/compliance/tensions/:id           # Get tension
POST   /api/v1/compliance/tensions               # Create tension
PUT    /api/v1/compliance/tensions/:id           # Update tension
DELETE /api/v1/compliance/tensions/:id           # Delete tension
POST   /api/v1/compliance/tensions/:id/analyze   # AI analysis
```

### Z-Inspection

```
GET    /api/v1/compliance/z-inspection/reports            # List reports
GET    /api/v1/compliance/z-inspection/reports/:id        # Get report
POST   /api/v1/compliance/z-inspection/reports            # Create report
POST   /api/v1/compliance/z-inspection/reports/:id/export # Export report
```

### Cross-Framework Analysis

```
GET    /api/v1/compliance/cross-framework/mappings        # Get control mappings
GET    /api/v1/compliance/cross-framework/gaps            # Gap analysis
POST   /api/v1/compliance/cross-framework/analyze         # Multi-framework analysis
```

### Regulatory Monitoring

```
GET    /api/v1/compliance/regulatory/sources              # List regulatory sources
GET    /api/v1/compliance/regulatory/updates              # Get updates
POST   /api/v1/compliance/regulatory/sources              # Add source
```

## 🗄️ Database Schema

### Core Tables

#### `frameworks`
Regulatory frameworks (NIST AI RMF, EU AI Act, ISO 42001, etc.)
- `id`, `code`, `name`, `version`, `description`, `status`

#### `controls`
688+ compliance controls mapped to frameworks
- `id`, `framework_id`, `control_id`, `title`, `description`, `type`, `status`

#### `assessments`
Assessment executions and results
- `id`, `tenant_id`, `ai_system_id`, `framework_id`, `status`, `started_at`, `completed_at`

#### `assessment_findings`
Control-level assessment results
- `id`, `assessment_id`, `control_id`, `status`, `score`, `evidence`, `gaps`

#### `trustworthiness_assessments`
EU Trustworthy AI requirement assessments
- `id`, `tenant_id`, `ai_system_id`, `title`, `status`, `overall_rating`, `overall_score`

#### `trustworthiness_requirement_assessments`
Requirement-level assessments (7 EU requirements)
- `id`, `assessment_id`, `requirement_id`, `rating`, `narrative`, `confidence`

#### `ethical_tensions`
Multi-value conflicts in AI systems
- `id`, `tenant_id`, `ai_system_id`, `value_a`, `value_b`, `severity`, `status`

#### `z_inspection_reports`
Z-Inspection methodology reports
- `id`, `tenant_id`, `ai_system_id`, `phase`, `status`, `findings`

#### `evidence_items`
Supporting documentation and artifacts
- `id`, `tenant_id`, `assessment_id`, `type`, `url`, `metadata`

## 🔒 Security

### Authentication & Authorization
- Tenant isolation via `tenant_id` in all queries
- User context from JWT tokens (validated by API Gateway)
- Row-level security enforced at database level

### Data Protection
- Helmet.js for HTTP security headers
- CORS with allowlist configuration
- SQL injection prevention via parameterized queries
- Input validation with Zod schemas

### Error Handling
- Sanitized error messages (no sensitive data leakage)
- Structured error logging with Pino
- Global error handler middleware

## 🧪 Testing

### Manual Testing via Browser Console

Since this is a production system with no automated tests, use browser console injection for validation:

```javascript
// Test framework listing
fetch('http://localhost:9300/api/v1/compliance/frameworks')
  .then(r => r.json())
  .then(data => console.log('Frameworks:', data))

// Test control search
fetch('http://localhost:9300/api/v1/compliance/controls?search=privacy&page=1&limit=10')
  .then(r => r.json())
  .then(data => console.log('Controls:', data))

// Test trustworthiness dashboard
fetch('http://localhost:9300/api/v1/compliance/trustworthiness/dashboard?tenantId=default&aiSystemId=default')
  .then(r => r.json())
  .then(data => console.log('Trustworthiness:', data))
```

## 🔧 Configuration

### Environment Variables

```bash
# Server
PORT=9300
NODE_ENV=development

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=nexus_compliance
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# External Services
MAGEAGENT_URL=http://localhost:8090
GRAPHRAG_URL=http://localhost:8080

# Security
ALLOWED_ORIGINS=http://localhost:3000,https://app.adverant.ai
JWT_SECRET=your_jwt_secret

# Logging
LOG_LEVEL=info
```

## 📈 Performance

### Database Optimization
- Indexed queries on frequently searched columns
- Pagination on all list endpoints (default limit: 50)
- Connection pooling with pg (max: 20 connections)
- Query timeout: 30 seconds

### Caching Strategy
- Framework and control data cached for 1 hour
- Assessment results cached for 5 minutes
- Cache invalidation on writes

## 🚢 Deployment

### Docker

```bash
# Build image
docker build -t nexus-compliance-backend:latest .

# Run container
docker run -d \
  -p 9300:9300 \
  -e POSTGRES_HOST=postgres \
  -e POSTGRES_PASSWORD=secret \
  --name compliance-backend \
  nexus-compliance-backend:latest
```

### Kubernetes

See `k8s/` directory in the Nexus monorepo for deployment manifests.

## 📝 Migration Guide

### Adding New Controls

1. Create migration file: `database/migrations/XXX_new_controls.sql`
2. Insert controls with proper `framework_id` references
3. Run migration: `npm run migrate`
4. Verify: Query `/api/v1/compliance/controls`

### Adding New Frameworks

1. Create migration file: `database/migrations/XXX_new_framework.sql`
2. Insert framework metadata
3. Add framework-specific controls
4. Update cross-framework mappings if applicable
5. Run migration: `npm run migrate`

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Test connection
psql -h localhost -U postgres -d nexus_compliance -c "SELECT COUNT(*) FROM frameworks;"
```

### Migration Failures
```bash
# Reset database (DEVELOPMENT ONLY)
psql -h localhost -U postgres -c "DROP DATABASE nexus_compliance;"
psql -h localhost -U postgres -c "CREATE DATABASE nexus_compliance;"
npm run migrate
npm run seed
```

### Port Already in Use
```bash
# Kill process on port 9300
lsof -ti:9300 | xargs kill -9

# Or use a different port
PORT=9301 npm run dev
```

## 📚 Additional Resources

- **EU AI Act**: [https://artificialintelligenceact.eu/](https://artificialintelligenceact.eu/)
- **NIST AI RMF**: [https://www.nist.gov/itl/ai-risk-management-framework](https://www.nist.gov/itl/ai-risk-management-framework)
- **ISO 42001**: [https://www.iso.org/standard/81230.html](https://www.iso.org/standard/81230.html)
- **Z-Inspection**: [https://z-inspection.org/](https://z-inspection.org/)

## 🤝 Contributing

This is a private Adverant project. For internal contributors:

1. Follow existing code patterns
2. Use shared middleware from `api/middleware/`
3. Add proper TypeScript types
4. Document all API endpoints
5. Test via browser console injection before committing

## 📄 License

UNLICENSED - Proprietary to Adverant

---

**Version**: 1.0.0
**Last Updated**: 2025-01-10
**Maintainer**: Adverant Engineering Team