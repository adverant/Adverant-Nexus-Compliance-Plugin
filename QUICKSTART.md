# Quick Start Guide

This guide walks you through setting up and running your first compliance assessment with the Nexus Compliance Engine.

## Prerequisites

Before starting, ensure you have:

- Node.js 20.0.0 or higher installed
- PostgreSQL 14+ database accessible
- Nexus platform running with API access
- Git for cloning the repository

## Step 1: Installation

```bash
# Clone the repository
git clone https://github.com/adverant/Adverant-Nexus-Compliance-Plugin.git
cd Adverant-Nexus-Compliance-Plugin

# Install all dependencies (both backend and frontend)
npm install
```

## Step 2: Environment Configuration

Create a `.env` file in the `backend/` directory:

```bash
# Database connection
DATABASE_URL=postgresql://username:password@localhost:5432/nexus_compliance

# Nexus platform connection
NEXUS_API_URL=http://localhost:3000
NEXUS_API_KEY=your-nexus-api-key

# Server configuration
PORT=3458
HOST=0.0.0.0
NODE_ENV=development

# Optional: MageAgent for AI features
MAGEAGENT_URL=http://localhost:3457
MAGEAGENT_ENABLED=true
```

## Step 3: Database Setup

Initialize the database schema and seed the control library:

```bash
cd backend

# Run database migrations
npm run migrate

# Seed frameworks and controls (688+ controls)
npm run seed
```

This creates the following tables:
- `compliance_frameworks` - 6 regulatory frameworks
- `compliance_controls` - 688+ controls with guidance
- `compliance_assessments` - Assessment tracking
- `control_findings` - Assessment findings
- `ethical_tensions` - Ethical tension tracking
- `z_inspection_reports` - Z-Inspection report storage
- And supporting tables for evidence, stakeholders, scenarios, etc.

## Step 4: Start the Backend

```bash
cd backend

# Development mode with hot reload
npm run dev

# Or production mode
npm run build && npm start
```

The API will be available at `http://localhost:3458`

Verify it's running:
```bash
curl http://localhost:3458/health
```

Expected response:
```json
{"status":"healthy","version":"1.0.0","timestamp":"..."}
```

## Step 5: Start the Frontend

In a separate terminal:

```bash
cd frontend

# Development mode
npm run dev
```

The UI will be available at `http://localhost:3000/compliance`

## Step 6: Create Your First Assessment

### Option A: Using the UI

1. Navigate to `http://localhost:3000/compliance`
2. Click "New Assessment" button
3. Select a framework (e.g., ISO 27001)
4. Enter target system details:
   - System ID: `ai-chatbot-v1`
   - System Name: `Customer Service AI Chatbot`
   - Description: (optional)
5. Click "Create Assessment"
6. On the assessment page, click "Run Assessment"
7. Wait for AI-assisted assessment to complete
8. Review findings and generate reports

### Option B: Using the API

```bash
# Create an assessment
curl -X POST http://localhost:3458/api/v1/compliance/assessments \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: default" \
  -H "X-User-ID: admin" \
  -d '{
    "frameworkId": "iso_27001",
    "targetSystemId": "ai-chatbot-v1",
    "targetSystemName": "Customer Service AI Chatbot",
    "targetSystemDescription": "AI-powered chatbot for customer inquiries"
  }'

# Response includes assessment ID
# {"success":true,"data":{"id":"uuid-here",...}}

# Run the assessment
curl -X POST http://localhost:3458/api/v1/compliance/assessments/{assessment-id}/run \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: default" \
  -H "X-User-ID: admin" \
  -d '{
    "useAI": true,
    "includeRecommendations": true
  }'

# Get findings
curl http://localhost:3458/api/v1/compliance/assessments/{assessment-id}/findings \
  -H "X-Tenant-ID: default"

# Generate a report
curl -X POST http://localhost:3458/api/v1/compliance/reports/generate \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: default" \
  -H "X-User-ID: admin" \
  -d '{
    "assessmentId": "{assessment-id}",
    "reportType": "executive_summary",
    "format": "markdown",
    "includeRemediation": true
  }'
```

## Step 7: Explore the Dashboard

Navigate to `http://localhost:3000/compliance` to see:

- **Overall compliance score** across all frameworks
- **Framework radar chart** showing compliance by framework
- **Trustworthy AI requirements radar** showing coverage of 7 EU requirements
- **Risk distribution** by severity level
- **Recent alerts** requiring attention
- **Quick actions** for common tasks

## Step 8: Import a Z-Inspection Report (Optional)

If you have a Z-Inspection report:

1. Go to `/compliance/z-inspection`
2. Click "Import Report"
3. Enter report details:
   - Title
   - Report date
   - Import method (JSON, manual)
4. Paste or upload report content
5. Click "Import"
6. The system extracts findings, scenarios, and tensions
7. Create assessment from extracted data

### Example Z-Inspection JSON format:

```json
{
  "findings": [
    {
      "title": "Insufficient human oversight",
      "description": "The system lacks adequate mechanisms for human intervention",
      "findingType": "weakness",
      "severity": "high",
      "requirementId": "human_agency_oversight"
    }
  ],
  "scenarios": [
    {
      "title": "Emergency override scenario",
      "description": "User needs to override AI decision in emergency",
      "scenarioType": "use_case",
      "primaryRequirement": "human_agency_oversight"
    }
  ],
  "tensions": [
    {
      "title": "Efficiency vs Oversight",
      "description": "Balancing automated efficiency with human review requirements",
      "valueA": "Operational efficiency",
      "valueB": "Human oversight",
      "tensionType": "value_vs_value"
    }
  ],
  "recommendations": [
    {
      "recommendation": "Implement emergency stop functionality",
      "priority": "immediate",
      "relatedRequirement": "human_agency_oversight"
    }
  ],
  "conclusion": "The system requires improvements in human oversight mechanisms",
  "rating": "conditionally_trustworthy"
}
```

## Common Commands Reference

```bash
# Backend commands
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run typecheck    # Run TypeScript checks
npm run lint         # Run ESLint
npm run migrate      # Run database migrations
npm run seed         # Seed control library

# Frontend commands
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run typecheck    # Run TypeScript checks
npm run lint         # Run ESLint

# Root commands (both)
npm run build        # Build backend and frontend
npm run test         # Run all tests
npm run typecheck    # Check both workspaces
npm run lint         # Lint both workspaces
```

## Next Steps

After completing the quick start:

1. **Browse the Control Library** - Explore 688+ controls at `/compliance/controls`
2. **Set up Cross-Framework Analysis** - Compare frameworks at `/compliance/cross-framework`
3. **Configure AI Systems Registry** - Register your AI systems for assessment
4. **Enable Regulatory Monitoring** - Track regulatory updates at `/compliance/regulatory`
5. **Manage Ethical Tensions** - Document value conflicts at `/compliance/tensions`

## Troubleshooting

### Database connection errors
- Verify `DATABASE_URL` in `.env` is correct
- Ensure PostgreSQL is running and accessible
- Check that the database exists

### API returns 401/403
- Verify `NEXUS_API_KEY` is set and valid
- Check `X-Tenant-ID` and `X-User-ID` headers are present

### Frontend not loading
- Ensure backend is running on the correct port
- Check browser console for CORS errors
- Verify API URL configuration in frontend

### AI features not working
- Check `MAGEAGENT_URL` configuration
- Verify MageAgent server is running
- Review backend logs for connection errors

For additional support, refer to the Technical Documentation or contact Adverant support.
