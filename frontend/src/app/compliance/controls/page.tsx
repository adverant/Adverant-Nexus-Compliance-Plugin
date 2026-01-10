/**
 * Control Library Page
 *
 * Browse, filter, and manage compliance controls across 6 frameworks.
 * Features:
 * - Real API integration with error handling
 * - Grid and table views with filtering
 * - Framework, risk level, and EU requirement filters
 * - Control detail modal
 */

'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Search,
  Grid3X3,
  List,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  ListChecks,
  X,
  Loader2,
} from 'lucide-react'
import { PageHeader } from '@/components/compliance'
import { DataTable } from '@/components/coinest'
import { InlineError } from '@/components/error-boundary'
import { useToast } from '@/components/toast'
import { useTheme } from '@/stores/theme-store'
import { useThemeClasses } from '@/hooks/useThemeClasses'
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery'
import { cn, snakeToTitle } from '@/lib/utils'
import {
  complianceApi,
  isRiskLevel,
  isTrustworthyAIRequirement,
  isFrameworkId,
  TRUSTWORTHY_AI_REQUIREMENT_LABELS,
} from '@/lib/compliance-api'
import type {
  ComplianceControl,
  ControlStatus,
} from '@/lib/compliance-api'

// ============================================================================
// Constants
// ============================================================================

const FRAMEWORKS = [
  { id: 'all', name: 'All Frameworks' },
  { id: 'iso_27001', name: 'ISO 27001:2022' },
  { id: 'gdpr', name: 'GDPR' },
  { id: 'eu_ai_act', name: 'EU AI Act' },
  { id: 'nis2', name: 'NIS2 Directive' },
  { id: 'soc2', name: 'SOC 2 Type II' },
  { id: 'iso_27701', name: 'ISO 27701' },
] as const

const RISK_LEVELS = [
  { id: 'all', name: 'All Risk Levels' },
  { id: 'critical', name: 'Critical' },
  { id: 'high', name: 'High' },
  { id: 'medium', name: 'Medium' },
  { id: 'low', name: 'Low' },
] as const

const EU_REQUIREMENTS = [
  { id: 'all', name: 'All Requirements' },
  { id: 'human_agency_oversight', name: 'Human Agency & Oversight' },
  { id: 'technical_robustness_safety', name: 'Technical Robustness & Safety' },
  { id: 'privacy_data_governance', name: 'Privacy & Data Governance' },
  { id: 'transparency', name: 'Transparency' },
  { id: 'diversity_fairness_nondiscrimination', name: 'Diversity, Fairness & Non-discrimination' },
  { id: 'societal_environmental_wellbeing', name: 'Societal & Environmental Wellbeing' },
  { id: 'accountability', name: 'Accountability' },
] as const

// ============================================================================
// Helper Components
// ============================================================================

function StatusIcon({ status }: { status: ControlStatus | string }) {
  const { isDark } = useTheme()
  switch (status) {
    case 'implemented':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'in_progress':
      return <Clock className="h-4 w-4 text-yellow-500" />
    case 'not_started':
      return <XCircle className={cn('h-4 w-4', isDark ? 'text-neutral-500' : 'text-neutral-400')} />
    default:
      return <span className="text-xs text-neutral-400">N/A</span>
  }
}

function ControlCard({ control, onClick }: { control: ComplianceControl; onClick: () => void }) {
  const tc = useThemeClasses()
  // Get first mapped requirement if available
  const primaryRequirement = control.mappedRequirements[0]

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border p-4 cursor-pointer transition-all',
        tc.card,
        tc.cardHover
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className={cn('badge', tc.badgeNeutral, 'mb-2')}>{control.controlNumber}</span>
          <h3 className={cn('text-sm font-medium line-clamp-2', tc.textPrimary)}>
            {control.title}
          </h3>
        </div>
        <StatusIcon status={control.status} />
      </div>
      <p className={cn('text-xs line-clamp-2 mb-3', tc.textMuted)}>
        {control.description}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn(
          'badge',
          control.riskLevel === 'critical' ? tc.badgeCritical :
          control.riskLevel === 'high' ? tc.badgeHigh :
          control.riskLevel === 'medium' ? tc.badgeMedium :
          tc.badgeLow
        )}>
          {control.riskLevel}
        </span>
        {primaryRequirement && (
          <span className={cn('badge text-xs', tc.badgeInfo)}>
            {snakeToTitle(primaryRequirement).slice(0, 15)}...
          </span>
        )}
      </div>
    </div>
  )
}

function ControlDetailModal({
  control,
  open,
  onClose,
  onUpdateStatus,
  isUpdating,
}: {
  control: ComplianceControl | null
  open: boolean
  onClose: () => void
  onUpdateStatus: (controlId: string, status: ControlStatus) => Promise<void>
  isUpdating: boolean
}) {
  const tc = useThemeClasses()

  if (!open || !control) return null

  const handleStatusChange = async (newStatus: ControlStatus) => {
    await onUpdateStatus(control.id, newStatus)
  }

  // Get first mapped requirement if available
  const primaryRequirement = control.mappedRequirements[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      {/* Modal */}
      <div className={cn(
        'relative w-full max-w-2xl mx-4 rounded-xl border p-6 shadow-xl',
        tc.card
      )}>
        {/* Close button */}
        <button
          onClick={onClose}
          className={cn('absolute top-4 right-4 p-2 rounded-lg', tc.buttonGhost)}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className={cn('badge', tc.badgeNeutral)}>{control.controlNumber}</span>
          <span className={cn(
            'badge',
            control.riskLevel === 'critical' ? tc.badgeCritical :
            control.riskLevel === 'high' ? tc.badgeHigh :
            control.riskLevel === 'medium' ? tc.badgeMedium :
            tc.badgeLow
          )}>
            {control.riskLevel}
          </span>
          <StatusIcon status={control.status} />
        </div>
        <h2 className={cn('text-xl font-bold mb-2', tc.textPrimary)}>{control.title}</h2>
        <p className={cn('text-sm mb-6', tc.textMuted)}>
          Framework: {control.frameworkId.toUpperCase()} | Category: {control.category}
        </p>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <h4 className={cn('font-medium mb-2', tc.textPrimary)}>Description</h4>
            <p className={cn('text-sm', tc.textSecondary)}>{control.description}</p>
          </div>

          {primaryRequirement && (
            <div>
              <h4 className={cn('font-medium mb-2', tc.textPrimary)}>EU Trustworthy AI Requirement</h4>
              <span className={cn('badge', tc.badgeInfo)}>
                {TRUSTWORTHY_AI_REQUIREMENT_LABELS[primaryRequirement] || snakeToTitle(primaryRequirement)}
              </span>
            </div>
          )}

          <div>
            <h4 className={cn('font-medium mb-2', tc.textPrimary)}>Implementation Status</h4>
            <div className="flex items-center gap-2">
              <StatusIcon status={control.status} />
              <span className={cn('text-sm capitalize', tc.textSecondary)}>
                {control.status.replace(/_/g, ' ')}
              </span>
            </div>
            {/* Status Update Buttons */}
            <div className="flex gap-2 mt-2">
              {control.status !== 'implemented' && (
                <button
                  onClick={() => handleStatusChange('implemented')}
                  disabled={isUpdating}
                  className={cn('text-xs px-2 py-1 rounded', tc.buttonSecondary, 'disabled:opacity-50')}
                >
                  {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Mark Implemented'}
                </button>
              )}
              {control.status === 'not_started' && (
                <button
                  onClick={() => handleStatusChange('in_progress')}
                  disabled={isUpdating}
                  className={cn('text-xs px-2 py-1 rounded', tc.buttonSecondary, 'disabled:opacity-50')}
                >
                  Start Progress
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-inherit">
          <button className={cn('px-4 py-2 rounded-lg', tc.buttonSecondary)}>
            View Evidence
          </button>
          <button className={cn('px-4 py-2 rounded-lg', tc.buttonPrimary)}>
            Run Assessment
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function ControlLibraryPage() {
  const tc = useThemeClasses()
  const { toast } = useToast()
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [search, setSearch] = useState('')
  const [framework, setFramework] = useState('all')
  const [riskLevel, setRiskLevel] = useState('all')
  const [requirement, setRequirement] = useState('all')
  const [selectedControl, setSelectedControl] = useState<ComplianceControl | null>(null)

  // Build filter params
  const filterParams = useMemo(() => {
    const params: Parameters<typeof complianceApi.listControls>[0] = {}
    if (framework !== 'all' && isFrameworkId(framework)) {
      params.frameworks = [framework]
    }
    if (riskLevel !== 'all' && isRiskLevel(riskLevel)) {
      params.riskLevels = [riskLevel]
    }
    if (requirement !== 'all' && isTrustworthyAIRequirement(requirement)) {
      params.requirements = [requirement]
    }
    if (search.trim()) {
      params.search = search.trim()
    }
    return params
  }, [framework, riskLevel, requirement, search])

  // Fetch controls with API
  const {
    data: controls,
    isLoading,
    error,
    refetch,
  } = useApiQuery<ComplianceControl[]>(
    () => complianceApi.listControls(filterParams),
    {
      deps: [filterParams],
      onError: (message) => {
        toast.error('Failed to load controls', message)
      },
    }
  )

  // Update control status mutation
  const updateStatusMutation = useApiMutation<ComplianceControl, { controlId: string; status: ControlStatus }>(
    ({ controlId, status }) => complianceApi.updateControlStatus(controlId, status),
    {
      onSuccess: () => {
        toast.success('Status updated', 'Control status has been updated.')
        refetch()
      },
      onError: (message) => {
        toast.error('Failed to update status', message)
      },
    }
  )

  // Handle status update
  const handleUpdateStatus = useCallback(async (controlId: string, status: ControlStatus) => {
    await updateStatusMutation.mutate({ controlId, status })
  }, [updateStatusMutation])

  // Handle filter changes with type guards
  const handleFrameworkChange = useCallback((value: string) => {
    if (value === 'all' || isFrameworkId(value)) {
      setFramework(value)
    }
  }, [])

  const handleRiskLevelChange = useCallback((value: string) => {
    if (value === 'all' || isRiskLevel(value)) {
      setRiskLevel(value)
    }
  }, [])

  const handleRequirementChange = useCallback((value: string) => {
    if (value === 'all' || isTrustworthyAIRequirement(value)) {
      setRequirement(value)
    }
  }, [])

  // Control list
  const controlList = controls || []

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={cn('h-8 w-8 animate-spin', tc.accentCyan)} />
          <p className={tc.textMuted}>Loading compliance controls...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Control Library"
        description={`${controlList.length} controls across ${FRAMEWORKS.length - 1} regulatory frameworks`}
        icon={<ListChecks className={cn('h-6 w-6', tc.accentCyan)} />}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-lg', tc.buttonSecondary)}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button className={cn('flex items-center gap-2 px-4 py-2 rounded-lg', tc.buttonSecondary)}>
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        }
      />

      {/* Error State */}
      {error && (
        <InlineError message={error} onRetry={refetch} />
      )}

      {/* Filters */}
      <div className={cn('rounded-xl border p-4', tc.card)}>
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4', tc.textMuted)} />
              <input
                type="text"
                placeholder="Search controls..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn('w-full pl-9 pr-4 py-2 rounded-lg border', tc.input)}
              />
            </div>
          </div>

          {/* Framework Filter */}
          <select
            value={framework}
            onChange={(e) => handleFrameworkChange(e.target.value)}
            className={cn('px-4 py-2 rounded-lg border', tc.input)}
          >
            {FRAMEWORKS.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          {/* Risk Level Filter */}
          <select
            value={riskLevel}
            onChange={(e) => handleRiskLevelChange(e.target.value)}
            className={cn('px-4 py-2 rounded-lg border', tc.input)}
          >
            {RISK_LEVELS.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>

          {/* EU Requirement Filter */}
          <select
            value={requirement}
            onChange={(e) => handleRequirementChange(e.target.value)}
            className={cn('px-4 py-2 rounded-lg border', tc.input)}
          >
            {EU_REQUIREMENTS.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>

          {/* View Toggle */}
          <div className={cn('flex items-center border rounded-lg', tc.border)}>
            <button
              onClick={() => setView('grid')}
              className={cn(
                'p-2 rounded-l-lg transition-colors',
                view === 'grid' ? tc.bgTertiary : ''
              )}
            >
              <Grid3X3 className={cn('h-4 w-4', tc.textMuted)} />
            </button>
            <button
              onClick={() => setView('table')}
              className={cn(
                'p-2 rounded-r-lg transition-colors',
                view === 'table' ? tc.bgTertiary : ''
              )}
            >
              <List className={cn('h-4 w-4', tc.textMuted)} />
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className={cn('text-sm', tc.textMuted)}>
        Showing {controlList.length} controls
      </div>

      {/* Empty State */}
      {controlList.length === 0 && !error ? (
        <div className={cn('rounded-xl border p-12 text-center', tc.card)}>
          <ListChecks className={cn('h-12 w-12 mx-auto mb-4', tc.textMuted)} />
          <h3 className={cn('text-lg font-semibold mb-2', tc.textPrimary)}>No Controls Found</h3>
          <p className={cn('text-sm mb-4', tc.textMuted)}>
            {search || framework !== 'all' || riskLevel !== 'all' || requirement !== 'all'
              ? 'No controls match your current filters. Try adjusting your search criteria.'
              : 'No compliance controls have been defined yet.'}
          </p>
          {(search || framework !== 'all' || riskLevel !== 'all' || requirement !== 'all') && (
            <button
              onClick={() => {
                setSearch('')
                setFramework('all')
                setRiskLevel('all')
                setRequirement('all')
              }}
              className={cn('px-4 py-2 rounded-lg', tc.buttonSecondary)}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : controlList.length > 0 && (
        <>
          {/* Controls Display */}
          {view === 'grid' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {controlList.map((control) => (
                <ControlCard
                  key={control.id}
                  control={control}
                  onClick={() => setSelectedControl(control)}
                />
              ))}
            </div>
          ) : (
            <DataTable
              columns={[
                {
                  key: 'controlNumber',
                  header: 'Control ID',
                  sortable: true,
                  render: (value) => (
                    <span className={cn('badge', tc.badgeNeutral)}>{String(value)}</span>
                  ),
                },
                {
                  key: 'title',
                  header: 'Title',
                  sortable: true,
                  render: (value) => (
                    <span className="max-w-[300px] truncate block">{String(value)}</span>
                  ),
                },
                {
                  key: 'frameworkId',
                  header: 'Framework',
                  sortable: true,
                  render: (value) => String(value).toUpperCase(),
                },
                {
                  key: 'riskLevel',
                  header: 'Risk',
                  sortable: true,
                  render: (value) => {
                    const risk = String(value)
                    return (
                      <span className={cn(
                        'badge',
                        risk === 'critical' ? tc.badgeCritical :
                        risk === 'high' ? tc.badgeHigh :
                        risk === 'medium' ? tc.badgeMedium :
                        tc.badgeLow
                      )}>
                        {risk}
                      </span>
                    )
                  },
                },
                {
                  key: 'status',
                  header: 'Status',
                  sortable: true,
                  render: (value) => (
                    <div className="flex items-center gap-2">
                      <StatusIcon status={String(value)} />
                      <span className="text-sm capitalize">{String(value).replace(/_/g, ' ')}</span>
                    </div>
                  ),
                },
                {
                  key: 'category',
                  header: 'Category',
                  sortable: true,
                  render: (value) => (
                    <span className="text-sm">{snakeToTitle(String(value))}</span>
                  ),
                },
              ]}
              data={controlList as unknown as Record<string, unknown>[]}
              onRowClick={(row) => setSelectedControl(row as unknown as ComplianceControl)}
            />
          )}
        </>
      )}

      {/* Control Detail Modal */}
      <ControlDetailModal
        control={selectedControl}
        open={!!selectedControl}
        onClose={() => setSelectedControl(null)}
        onUpdateStatus={handleUpdateStatus}
        isUpdating={updateStatusMutation.isLoading}
      />
    </div>
  )
}