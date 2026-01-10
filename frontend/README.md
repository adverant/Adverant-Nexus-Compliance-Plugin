# Nexus Compliance Plugin - Frontend

Enterprise compliance dashboard built with Next.js 14, featuring 688+ controls across 6 regulatory frameworks with Z-Inspection integration and EU Trustworthy AI assessment capabilities.

## 🎯 Overview

The Compliance Plugin Frontend is a Next.js 14 application using the App Router, React Server Components, and the Coinest dark theme. It provides a comprehensive user interface for compliance management, assessment execution, and trustworthiness evaluation.

### Key Features

- **Interactive Dashboard**: Real-time KPIs, framework radar, heatmap, and risk distribution
- **Control Library**: Searchable library of 688+ compliance controls with filtering
- **Assessment Execution**: Real-time progress tracking with WebSocket updates
- **Trustworthiness Assessment**: EU AI Act 7-requirement evaluation with radar visualization
- **Ethical Tensions**: Multi-value conflict analysis and resolution workflow
- **Z-Inspection Reports**: Structured reports aligned with Z-Inspection methodology
- **Cross-Framework Analysis**: Control mapping and gap analysis across frameworks
- **Regulatory Monitoring**: Real-time tracking of compliance requirement changes
- **Dark Theme**: Coinest-inspired dark theme with full theme customization

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Nexus Compliance Frontend                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               Next.js 14 App Router                       │   │
│  │                                                           │   │
│  │  /compliance                  - Dashboard                │   │
│  │  /compliance/controls         - Control Library          │   │
│  │  /compliance/assessments      - Assessment List          │   │
│  │  /compliance/assessments/:id  - Assessment Details       │   │
│  │  /compliance/trustworthiness  - Trustworthiness View     │   │
│  │  /compliance/tensions         - Ethical Tensions         │   │
│  │  /compliance/z-inspection     - Z-Inspection Reports     │   │
│  │  /compliance/cross-framework  - Cross-Framework Analysis │   │
│  │  /compliance/regulatory       - Regulatory Monitoring    │   │
│  └──────────────────┬───────────────────────────────────────┘   │
│                     │                                            │
│  ┌──────────────────┴───────────────────────────────────────┐   │
│  │             Component Layer                              │   │
│  │                                                           │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │   │
│  │  │   Coinest  │  │ Compliance │  │   Charts   │        │   │
│  │  │ Components │  │ Components │  │ (Recharts) │        │   │
│  │  └────────────┘  └────────────┘  └────────────┘        │   │
│  │                                                           │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │   │
│  │  │  Radix UI  │  │   Lucide   │  │  Skeleton  │        │   │
│  │  │ Primitives │  │   Icons    │  │  Loading   │        │   │
│  │  └────────────┘  └────────────┘  └────────────┘        │   │
│  └──────────────────┬───────────────────────────────────────┘   │
│                     │                                            │
│  ┌──────────────────┴───────────────────────────────────────┐   │
│  │               State Management Layer                      │   │
│  │                                                           │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │   │
│  │  │  Zustand   │  │ useApiQuery│  │ useTheme   │        │   │
│  │  │   Store    │  │    Hook    │  │ Classes    │        │   │
│  │  └────────────┘  └────────────┘  └────────────┘        │   │
│  └──────────────────┬───────────────────────────────────────┘   │
│                     │                                            │
│  ┌──────────────────┴───────────────────────────────────────┐   │
│  │                API Client Layer                           │   │
│  │                                                           │   │
│  │  compliance-api.ts (70+ methods)                         │   │
│  │  • Framework APIs                                        │   │
│  │  • Control APIs                                          │   │
│  │  • Assessment APIs                                       │   │
│  │  • Trustworthiness APIs (13 methods)                    │   │
│  │  • Tension APIs                                          │   │
│  │  • Z-Inspection APIs                                     │   │
│  │  • Evidence APIs                                         │   │
│  └──────────────────┬───────────────────────────────────────┘   │
│                     │                                            │
└─────────────────────┼───────────────────────────────────────────┘
                      │ Axios HTTP Client
                      │
           ┌──────────┴──────────┐
           │  Backend API        │
           │  localhost:9300     │
           └─────────────────────┘
```

## 🗂️ Project Structure

```
frontend/
├── src/
│   ├── app/                          # Next.js 14 App Router
│   │   └── compliance/               # Compliance module routes
│   │       ├── page.tsx              # Dashboard (main view)
│   │       ├── assessments/          # Assessment management
│   │       │   ├── page.tsx          # Assessment list
│   │       │   ├── new/              # Create assessment
│   │       │   └── [id]/             # Assessment details
│   │       │       ├── page.tsx      # Overview
│   │       │       ├── execute/      # Real-time execution
│   │       │       ├── findings/     # Findings view
│   │       │       └── results/      # Final results
│   │       ├── controls/             # Control library
│   │       │   └── page.tsx          # Control browser
│   │       ├── trustworthiness/      # Trustworthiness assessment
│   │       │   └── page.tsx          # EU AI Act 7 requirements
│   │       ├── tensions/             # Ethical tensions
│   │       │   └── page.tsx          # Tension management
│   │       ├── z-inspection/         # Z-Inspection reports
│   │       │   └── page.tsx          # Report list & export
│   │       ├── cross-framework/      # Cross-framework analysis
│   │       │   └── page.tsx          # Control mapping & gaps
│   │       ├── regulatory/           # Regulatory monitoring
│   │       │   └── page.tsx          # Updates & sources
│   │       └── settings/             # Settings
│   │           └── page.tsx          # Configuration
│   │
│   ├── components/                   # React components
│   │   ├── coinest/                  # Coinest theme components
│   │   │   ├── stat-card.tsx         # KPI stat card
│   │   │   ├── stat-grid.tsx         # Stat card grid
│   │   │   ├── chart-card.tsx        # Chart wrapper
│   │   │   └── index.ts              # Exports
│   │   ├── compliance/               # Compliance-specific
│   │   │   ├── page-header.tsx       # Page header component
│   │   │   ├── control-card.tsx      # Control display card
│   │   │   └── index.ts              # Exports
│   │   ├── charts/                   # Chart components
│   │   │   └── (Recharts wrappers)
│   │   ├── ui/                       # Radix UI components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   └── ...
│   │   ├── providers/                # Context providers
│   │   │   └── theme-provider.tsx
│   │   ├── error-state.tsx           # Error boundary
│   │   └── skeleton.tsx              # Loading skeletons
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useApiQuery.ts            # Data fetching hook
│   │   ├── useApiMutation.ts         # Mutation hook
│   │   ├── useThemeClasses.ts        # Theme utilities
│   │   └── useDebounce.ts            # Debounce hook
│   │
│   ├── lib/                          # Utilities & clients
│   │   ├── compliance-api.ts         # Backend API client (70+ methods)
│   │   ├── utils.ts                  # Helper functions
│   │   └── constants.ts              # App constants
│   │
│   ├── stores/                       # Zustand state stores
│   │   ├── assessment-store.ts       # Assessment state
│   │   └── ui-store.ts               # UI state
│   │
│   └── types/                        # TypeScript definitions
│       ├── compliance.ts             # Compliance types
│       └── index.ts                  # Type exports
│
├── public/                           # Static assets
├── .next/                            # Next.js build output (generated)
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── next.config.js                    # Next.js configuration
└── README.md                         # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (LTS recommended)
- Backend API running on `http://localhost:9300`
- Modern browser with WebSocket support

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API endpoint

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000/compliance`

### Development

```bash
# Start dev server with hot reload
npm run dev

# TypeScript type checking
npm run typecheck

# Lint code
npm run lint

# Fix linting issues
npm run lint --fix
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🎨 Theme System

The frontend uses a custom theme system based on the Coinest dark theme with full customization support.

### Theme Colors

All colors are centralized in `hooks/useThemeClasses.ts`:

```typescript
export const THEME_COLORS = {
  // Status colors
  risk: {
    critical: { dark: '#ef4444', light: '#dc2626' },
    high: { dark: '#f97316', light: '#ea580c' },
    medium: { dark: '#f59e0b', light: '#d97706' },
    low: { dark: '#84cc16', light: '#65a30d' },
  },

  // EU Trustworthy AI requirement colors
  requirement: {
    human_agency_oversight: { dark: '#3b82f6', light: '#2563eb' },
    technical_robustness_safety: { dark: '#22c55e', light: '#16a34a' },
    privacy_data_governance: { dark: '#8b5cf6', light: '#7c3aed' },
    transparency: { dark: '#f59e0b', light: '#d97706' },
    diversity_fairness_nondiscrimination: { dark: '#ec4899', light: '#db2777' },
    societal_environmental_wellbeing: { dark: '#14b8a6', light: '#0d9488' },
    accountability: { dark: '#6366f1', light: '#4f46e5' },
  },

  // Framework colors
  framework: [
    '#3b82f6', // NIST AI RMF (blue)
    '#8b5cf6', // EU AI Act (purple)
    '#f59e0b', // ISO 42001 (amber)
    '#10b981', // SOC 2 (green)
    '#ec4899', // GDPR (pink)
    '#06b6d4', // FedRAMP (cyan)
  ],
}
```

### Using Theme Classes

```typescript
import { useThemeClasses, useThemeColors } from '@/hooks/useThemeClasses'

export function MyComponent() {
  const tc = useThemeClasses()
  const themeColors = useThemeColors()

  return (
    <div className={tc.card}>
      <h2 className={tc.textPrimary}>Title</h2>
      <p className={tc.textMuted}>Description</p>
      <button className={tc.buttonPrimary}>Action</button>
    </div>
  )
}
```

## 🔌 API Integration

### API Client Pattern

All API calls use the centralized `compliance-api.ts` client:

```typescript
import { complianceApi } from '@/lib/compliance-api'

// Framework APIs
complianceApi.listFrameworks()
complianceApi.getFramework(id)

// Control APIs
complianceApi.listControls({ search, page, limit })
complianceApi.getControl(id)

// Assessment APIs
complianceApi.listAssessments()
complianceApi.createAssessment(data)
complianceApi.runAssessment(id)

// Trustworthiness APIs (13 methods)
complianceApi.getTrustworthinessDashboard({ tenantId, aiSystemId })
complianceApi.listTrustworthinessAssessments({ tenantId, aiSystemId })
complianceApi.createTrustworthinessAssessment(data)
complianceApi.updateRequirementAssessment(assessmentId, requirementId, data)
```

### Data Fetching with useApiQuery

```typescript
import { useApiQuery } from '@/hooks/useApiQuery'
import { complianceApi } from '@/lib/compliance-api'

export function MyPage() {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useApiQuery(
    () => complianceApi.getTrustworthinessDashboard({
      tenantId: 'default',
      aiSystemId: 'default',
    }),
    {
      deps: [],
      retryCount: 2,
      retryDelay: 1000,
    }
  )

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data) return <EmptyState />

  return <div>Data: {JSON.stringify(data)}</div>
}
```

### Mutations with useApiMutation

```typescript
import { useApiMutation } from '@/hooks/useApiQuery'
import { complianceApi } from '@/lib/compliance-api'

export function CreateAssessmentButton() {
  const { mutate, isLoading, error } = useApiMutation(
    (data) => complianceApi.createAssessment(data),
    {
      onSuccess: (result) => {
        console.log('Created:', result)
        // Navigate to assessment detail page
      },
      onError: (error) => {
        console.error('Failed:', error)
      },
    }
  )

  return (
    <button
      onClick={() => mutate({
        tenantId: 'default',
        aiSystemId: 'default',
        frameworkId: 'nist-ai-rmf',
      })}
      disabled={isLoading}
    >
      Create Assessment
    </button>
  )
}
```

## 📱 Key Pages

### 1. Dashboard (`/compliance`)

**Features**:
- Overall compliance score KPI
- Framework radar chart (6 frameworks)
- Trustworthiness gauge (7 EU requirements)
- Risk distribution pie chart
- Recent alerts feed
- Quick actions

**Components**:
- `StatCard` - KPI displays
- `ChartCard` - Chart wrappers
- Recharts: `RadarChart`, `BarChart`, `PieChart`

### 2. Control Library (`/compliance/controls`)

**Features**:
- Search 688+ controls
- Filter by framework, type, status
- Pagination (50 per page)
- Control detail modal
- Bulk actions

**Components**:
- `ControlCard` - Control display
- Search input with debounce
- Filter dropdowns

### 3. Assessment Execution (`/compliance/assessments/:id/execute`)

**Features**:
- Real-time progress tracking
- WebSocket updates with polling fallback
- Control-by-control evaluation
- Evidence collection
- Live activity log

**Components**:
- Progress bar with percentage
- Circular progress indicator
- Activity log with timestamps
- Evidence upload zone

**Technical**:
- WebSocket connection with refs pattern (no circular dependencies)
- Fallback to HTTP polling if WebSocket unavailable
- Auto-reconnect on disconnect

### 4. Trustworthiness Assessment (`/compliance/trustworthiness`)

**Features**:
- EU AI Act 7-requirement dashboard
- Radar chart visualization
- Requirement breakdown cards
- Recent assessments list
- Tension summary
- Coverage statistics

**Components**:
- Radar chart (Recharts)
- Requirement cards with color coding
- Assessment status badges
- Loading skeleton states
- Error boundary with retry

**API Integration**:
- `getTrustworthinessDashboard` - Main dashboard data
- `listTrustworthinessAssessments` - Assessment list
- `createTrustworthinessAssessment` - Create new assessment
- Proper loading, error, and empty states

### 5. Ethical Tensions (`/compliance/tensions`)

**Features**:
- Multi-value conflict detection
- Severity classification
- Resolution workflow
- AI-powered analysis
- Tension graph visualization

**Components**:
- Tension cards
- Value pair display
- Severity badges
- Resolution status tracker

### 6. Z-Inspection Reports (`/compliance/z-inspection`)

**Features**:
- Phase-based report structure
- Finding categorization
- Export to PDF
- Stakeholder review workflow

**Components**:
- Phase navigation
- Finding cards
- Export button
- Review status

## 🧩 Component Library

### Coinest Components

```typescript
import { StatCard, StatGrid, ChartCard } from '@/components/coinest'

<StatGrid>
  <StatCard
    title="Overall Score"
    value={85}
    suffix="%"
    trend={{ value: 5, direction: 'up' }}
    icon={<CheckCircle2 />}
  />
</StatGrid>

<ChartCard title="Framework Compliance" subtitle="Score by framework">
  <ResponsiveContainer width="100%" height={300}>
    {/* Your chart */}
  </ResponsiveContainer>
</ChartCard>
```

### Compliance Components

```typescript
import { PageHeader } from '@/components/compliance'

<PageHeader
  title="Compliance Dashboard"
  description="688 controls across 6 frameworks"
  icon={<ShieldCheck />}
  actions={<button>Create Assessment</button>}
/>
```

### Skeleton Loading States

```typescript
import {
  Skeleton,
  TableSkeleton,
  CardSkeleton,
  ChartSkeleton,
  PageSkeleton,
} from '@/components/skeleton'

// While loading
if (isLoading) return <PageSkeleton layout="dashboard" items={4} />
```

## 🧪 Testing

### Manual Testing via Browser Console

Since this is a production system with no automated tests, use browser console injection:

```javascript
// Navigate to http://localhost:3000/compliance

// Test API client directly
const api = await import('/src/lib/compliance-api.js')
const frameworks = await api.complianceApi.listFrameworks()
console.log('Frameworks:', frameworks)

// Test trustworthiness API
const dashboard = await api.complianceApi.getTrustworthinessDashboard({
  tenantId: 'default',
  aiSystemId: 'default'
})
console.log('Trustworthiness Dashboard:', dashboard)

// Test control search
const controls = await api.complianceApi.listControls({
  search: 'privacy',
  page: 1,
  limit: 10
})
console.log('Privacy Controls:', controls)
```

## 🔧 Configuration

### Environment Variables

```bash
# API Endpoint
NEXT_PUBLIC_API_URL=http://localhost:9300

# WebSocket (optional, falls back to HTTP polling)
NEXT_PUBLIC_WS_URL=ws://localhost:9300

# Feature Flags
NEXT_PUBLIC_ENABLE_Z_INSPECTION=true
NEXT_PUBLIC_ENABLE_TENSIONS=true
```

### Next.js Configuration

```javascript
// next.config.js
module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone', // For Docker

  // Nexus plugin UI integration
  nexusPluginUI: {
    mountPoint: '/plugins/compliance',
    menuEntry: {
      label: 'Compliance',
      icon: 'ShieldCheck',
      position: 'primary',
    },
  },
}
```

## 📈 Performance Optimization

### Code Splitting
- Route-based code splitting via Next.js App Router
- Dynamic imports for heavy components (charts, modals)
- Lazy loading for images and heavy assets

### Data Fetching
- Server-side rendering for initial page load
- Client-side caching with `useApiQuery`
- Pagination on all list views (50 items per page)
- Debounced search inputs (300ms delay)

### Bundle Size
- Tree-shaking unused Radix UI components
- Optimized Recharts bundle (only imported charts)
- Tailwind CSS purging in production
- Next.js automatic font optimization

## 🚢 Deployment

### Docker

```bash
# Build image
docker build -t nexus-compliance-frontend:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.adverant.ai \
  --name compliance-frontend \
  nexus-compliance-frontend:latest
```

### Kubernetes

See `k8s/` directory in the Nexus monorepo for deployment manifests.

### Static Export (Optional)

```bash
# Build static export
npm run build

# Deploy to CDN (Cloudflare, Vercel, etc.)
# Static files in .next/static/
```

## 🐛 Troubleshooting

### WebSocket Connection Fails
The app automatically falls back to HTTP polling. Check browser console for errors:
```javascript
// WebSocket error → Fallback to polling activated
```

### API Connection Issues
```bash
# Check backend is running
curl http://localhost:9300/api/v1/compliance/frameworks

# Check CORS configuration
# Add http://localhost:3000 to backend ALLOWED_ORIGINS
```

### Build Failures
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Theme Not Applying
```bash
# Check Tailwind CSS configuration
# Ensure content paths include all component directories
# content: ['./src/**/*.{js,ts,jsx,tsx}']
```

## 📚 Additional Resources

- **Next.js 14 Docs**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Radix UI**: [https://www.radix-ui.com/](https://www.radix-ui.com/)
- **Recharts**: [https://recharts.org/](https://recharts.org/)
- **Tailwind CSS**: [https://tailwindcss.com/](https://tailwindcss.com/)
- **Coinest Theme**: [https://coinest.vercel.app/](https://coinest.vercel.app/)

## 🤝 Contributing

This is a private Adverant project. For internal contributors:

1. Follow Next.js 14 App Router patterns
2. Use shared components from `components/coinest/` and `components/compliance/`
3. Use `useApiQuery` for data fetching (not raw fetch/axios)
4. Use theme classes from `useThemeClasses` (not hardcoded colors)
5. Add proper loading, error, and empty states
6. Test via browser console injection before committing

## 📄 License

UNLICENSED - Proprietary to Adverant

---

**Version**: 1.0.0
**Last Updated**: 2025-01-10
**Maintainer**: Adverant Engineering Team