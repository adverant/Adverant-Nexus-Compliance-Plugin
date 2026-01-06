# Adverant Nexus Compliance Plugin

## Overview

**Enterprise Compliance Engine** - A premium Nexus marketplace plugin providing Z-Inspection aligned qualitative assessment with 688+ controls across 6 regulatory frameworks.

**Repository**: `github.com/adverant/Adverant-Nexus-Compliance-Plugin` (PRIVATE)
**License**: UNLICENSED (Commercial - Adverant proprietary)

## Monetization

This is a **premium marketplace plugin** with tiered pricing:

| Tier | Price | Features |
|------|-------|----------|
| Starter | $499/mo | 3 frameworks, 100 controls, Basic reporting |
| Professional | $1,499/mo | All 6 frameworks, 688+ controls, Cross-framework analysis |
| Enterprise | Custom | Everything + Custom frameworks, Dedicated support, SLA |

## Architecture

```
Adverant-Nexus-Compliance-Plugin/
├── backend/                    # Plugin backend service
│   └── src/
│       ├── api/routes/         # API endpoints
│       ├── services/           # Business logic
│       ├── database/migrations # PostgreSQL migrations
│       ├── types/              # TypeScript types
│       └── clients/            # MageAgent, GraphRAG clients
├── frontend/                   # Standalone plugin UI
│   └── src/
│       ├── pages/              # React pages
│       ├── components/         # UI components
│       ├── api/                # API client
│       └── hooks/              # React hooks
└── docs/                       # Documentation
```

## Supported Frameworks

1. **ISO 27001:2022** - 93 controls
2. **GDPR** - 220 controls
3. **EU AI Act** - 134 controls (Titles I-XIII)
4. **NIS2 Directive** - 112 controls (Articles 15-24)
5. **SOC 2 Type II** - 64 controls (5 TSC)
6. **ISO 27701** - 50 controls (PIMS)

## Key Features

- **Z-Inspection Integration**: Import and operationalize Z-Inspection reports
- **7 EU Trustworthy AI Requirements**: Human Agency, Robustness, Privacy, Transparency, Fairness, Wellbeing, Accountability
- **Cross-Framework Analysis**: Map controls across frameworks with AI-powered similarity
- **Autonomous Learning**: Auto-discover and generate controls from regulatory updates
- **Qualitative Assessment**: Stakeholders, scenarios, ethical tensions tracking

## Development

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Access to Nexus MageAgent API
- Access to Nexus GraphRAG API

### Setup
```bash
# Install dependencies
npm install

# Run backend
cd backend && npm run dev

# Run frontend
cd frontend && npm run dev
```

### Build
```bash
npm run build
```

### Testing
```bash
npm run test
npm run typecheck
```

## Plugin Integration

This plugin integrates with the Nexus platform via:
- **Plugin Loader**: Mounts UI at `/plugins/compliance`
- **API Gateway**: Routes API calls to `/api/v1/plugins/compliance`
- **Plugin SDK**: Uses Nexus tenant context and authentication

## Database

The plugin creates its own tables with prefix `compliance_`:
- `compliance_frameworks`
- `compliance_controls`
- `compliance_assessments`
- `trustworthiness_assessments`
- `qualitative_findings`
- `ethical_tensions`
- `stakeholder_registry`
- etc.

## Security

- **Private Repository**: Source code is proprietary
- **License Validation**: Plugin validates license on startup
- **Tenant Isolation**: All data is tenant-scoped
- **Audit Logging**: All actions are logged

## Deployment

Plugins are deployed via the Nexus marketplace:
1. Build plugin package
2. Submit to Adverant Plugin Registry
3. Marketplace distributes to licensed tenants

## Support

Enterprise customers receive:
- Dedicated Slack channel
- Priority bug fixes
- Custom framework development
- SLA guarantees