/**
 * Control Library Page
 *
 * Browse, filter, and manage 688+ compliance controls across 6 frameworks.
 * Supports grid and table views with filtering by framework, category,
 * risk level, and EU requirement.
 */

'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  Grid3X3,
  List,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  ListChecks,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/compliance'
import { DataTable } from '@/components/coinest'
import { useTheme } from '@/stores/theme-store'
import { useThemeClasses } from '@/hooks/useThemeClasses'
import { cn, snakeToTitle } from '@/lib/utils'

// Mock data
const FRAMEWORKS = [
  { id: 'all', name: 'All Frameworks' },
  { id: 'iso_27001', name: 'ISO 27001:2022' },
  { id: 'gdpr', name: 'GDPR' },
  { id: 'eu_ai_act', name: 'EU AI Act' },
  { id: 'nis2', name: 'NIS2 Directive' },
  { id: 'soc2', name: 'SOC 2 Type II' },
  { id: 'iso_27701', name: 'ISO 27701' },
]

const RISK_LEVELS = [
  { id: 'all', name: 'All Risk Levels' },
  { id: 'critical', name: 'Critical' },
  { id: 'high', name: 'High' },
  { id: 'medium', name: 'Medium' },
  { id: 'low', name: 'Low' },
]

const EU_REQUIREMENTS = [
  { id: 'all', name: 'All Requirements' },
  { id: 'human_agency_oversight', name: 'Human Agency & Oversight' },
  { id: 'technical_robustness_safety', name: 'Technical Robustness & Safety' },
  { id: 'privacy_data_governance', name: 'Privacy & Data Governance' },
  { id: 'transparency', name: 'Transparency' },
  { id: 'diversity_fairness_nondiscrimination', name: 'Diversity, Fairness & Non-discrimination' },
  { id: 'societal_environmental_wellbeing', name: 'Societal & Environmental Wellbeing' },
  { id: 'accountability', name: 'Accountability' },
]

const mockControls = [
  { id: 'ISO-A.5.1', frameworkId: 'iso_27001', controlNumber: 'A.5.1', title: 'Policies for information security', description: 'Information security policy and topic-specific policies shall be defined...', category: 'Organizational Controls', riskLevel: 'high' as const, implementationStatus: 'implemented' as const, score: 85 },
  { id: 'GDPR-5.1', frameworkId: 'gdpr', controlNumber: 'Art. 5.1', title: 'Principles relating to processing', description: 'Personal data shall be processed lawfully, fairly and in a transparent manner...', category: 'Principles', riskLevel: 'critical' as const, implementationStatus: 'implemented' as const, score: 92, euRequirement: 'privacy_data_governance' as const },
  { id: 'AIACT-9.1', frameworkId: 'eu_ai_act', controlNumber: 'Art. 9.1', title: 'Risk management system', description: 'A risk management system shall be established, implemented, documented...', category: 'High-Risk Requirements', riskLevel: 'critical' as const, implementationStatus: 'in_progress' as const, score: 65, euRequirement: 'technical_robustness_safety' as const },
  { id: 'NIS2-21.1', frameworkId: 'nis2', controlNumber: 'Art. 21.1', title: 'Cybersecurity risk-management measures', description: 'Essential and important entities shall take appropriate technical measures...', category: 'Risk Management', riskLevel: 'high' as const, implementationStatus: 'in_progress' as const, score: 72 },
  { id: 'SOC2-CC6.1', frameworkId: 'soc2', controlNumber: 'CC6.1', title: 'Logical and Physical Access Controls', description: 'The entity implements logical access security software...', category: 'Common Criteria', riskLevel: 'high' as const, implementationStatus: 'implemented' as const, score: 88 },
  { id: 'ISO27701-A.7.2', frameworkId: 'iso_27701', controlNumber: 'A.7.2', title: 'Conditions for collection', description: 'The organization shall determine and document that processing is lawful...', category: 'PIMS Specific', riskLevel: 'high' as const, implementationStatus: 'implemented' as const, score: 82, euRequirement: 'privacy_data_governance' as const },
  { id: 'AIACT-10.1', frameworkId: 'eu_ai_act', controlNumber: 'Art. 10.1', title: 'Data and data governance', description: 'High-risk AI systems which make use of techniques involving training...', category: 'High-Risk Requirements', riskLevel: 'critical' as const, implementationStatus: 'not_started' as const, score: 0, euRequirement: 'privacy_data_governance' as const },
  { id: 'GDPR-25.1', frameworkId: 'gdpr', controlNumber: 'Art. 25.1', title: 'Data protection by design and default', description: 'Taking into account the state of the art, the cost of implementation...', category: 'Data Protection', riskLevel: 'high' as const, implementationStatus: 'in_progress' as const, score: 55, euRequirement: 'privacy_data_governance' as const },
]

interface Control {
  id: string
  frameworkId: string
  controlNumber: string
  title: string
  description: string
  category: string
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  implementationStatus: 'not_started' | 'in_progress' | 'implemented' | 'not_applicable'
  score?: number
  euRequirement?: string
}

function StatusIcon({ status }: { status: string }) {
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

function ControlCard({ control, onClick }: { control: Control; onClick: () => void }) {
  const tc = useThemeClasses()

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
        <StatusIcon status={control.implementationStatus} />
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
        {control.euRequirement && (
          <span className={cn('badge text-xs', tc.badgeInfo)}>
            {snakeToTitle(control.euRequirement).slice(0, 15)}...
          </span>
        )}
      </div>
      {control.score !== undefined && control.score > 0 && (
        <div className="mt-3">
          <div className={cn('flex justify-between text-xs mb-1', tc.textMuted)}>
            <span>Score</span>
            <span className="font-medium">{control.score}%</span>
          </div>
          <div className={cn('h-1.5 w-full overflow-hidden rounded-full', tc.bgTertiary)}>
            <div
              className={cn(
                'h-full transition-all',
                control.score >= 80 ? 'bg-green-500' :
                control.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              )}
              style={{ width: `${control.score}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ControlDetailModal({
  control,
  open,
  onClose,
}: {
  control: Control | null
  open: boolean
  onClose: () => void
}) {
  const tc = useThemeClasses()

  if (!open || !control) return null

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
          <StatusIcon status={control.implementationStatus} />
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

          {control.euRequirement && (
            <div>
              <h4 className={cn('font-medium mb-2', tc.textPrimary)}>EU Trustworthy AI Requirement</h4>
              <span className={cn('badge', tc.badgeInfo)}>
                {snakeToTitle(control.euRequirement)}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className={cn('font-medium mb-2', tc.textPrimary)}>Implementation Status</h4>
              <div className="flex items-center gap-2">
                <StatusIcon status={control.implementationStatus} />
                <span className={cn('text-sm capitalize', tc.textSecondary)}>
                  {control.implementationStatus.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {control.score !== undefined && (
              <div>
                <h4 className={cn('font-medium mb-2', tc.textPrimary)}>Assessment Score</h4>
                <div className="flex items-center gap-2">
                  <span className={cn('text-2xl font-bold', tc.textPrimary)}>{control.score}%</span>
                  <div className={cn('flex-1 h-2 overflow-hidden rounded-full', tc.bgTertiary)}>
                    <div
                      className={cn(
                        'h-full',
                        control.score >= 80 ? 'bg-green-500' :
                        control.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      )}
                      style={{ width: `${control.score}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
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

export default function ControlLibraryPage() {
  const { isDark } = useTheme()
  const tc = useThemeClasses()
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [search, setSearch] = useState('')
  const [framework, setFramework] = useState('all')
  const [riskLevel, setRiskLevel] = useState('all')
  const [requirement, setRequirement] = useState('all')
  const [selectedControl, setSelectedControl] = useState<Control | null>(null)

  const filteredControls = useMemo(() => {
    return mockControls.filter((control) => {
      if (framework !== 'all' && control.frameworkId !== framework) return false
      if (riskLevel !== 'all' && control.riskLevel !== riskLevel) return false
      if (requirement !== 'all' && control.euRequirement !== requirement) return false
      if (search) {
        const searchLower = search.toLowerCase()
        if (
          !control.title.toLowerCase().includes(searchLower) &&
          !control.controlNumber.toLowerCase().includes(searchLower) &&
          !control.description.toLowerCase().includes(searchLower)
        ) {
          return false
        }
      }
      return true
    })
  }, [framework, riskLevel, requirement, search])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Control Library"
        description="688 controls across 6 regulatory frameworks"
        icon={<ListChecks className={cn('h-6 w-6', tc.accentCyan)} />}
        actions={
          <div className="flex items-center gap-3">
            <button className={cn('flex items-center gap-2 px-4 py-2 rounded-lg', tc.buttonSecondary)}>
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
            onChange={(e) => setFramework(e.target.value)}
            className={cn('px-4 py-2 rounded-lg border', tc.input)}
          >
            {FRAMEWORKS.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          {/* Risk Level Filter */}
          <select
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value)}
            className={cn('px-4 py-2 rounded-lg border', tc.input)}
          >
            {RISK_LEVELS.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>

          {/* EU Requirement Filter */}
          <select
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
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
        Showing {filteredControls.length} of {mockControls.length} controls
      </div>

      {/* Controls Display */}
      {view === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredControls.map((control) => (
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
              key: 'controlNumber' as keyof Control,
              header: 'Control ID',
              sortable: true,
              render: (value) => (
                <span className={cn('badge', tc.badgeNeutral)}>{String(value)}</span>
              ),
            },
            {
              key: 'title' as keyof Control,
              header: 'Title',
              sortable: true,
              render: (value) => (
                <span className="max-w-[300px] truncate block">{String(value)}</span>
              ),
            },
            {
              key: 'frameworkId' as keyof Control,
              header: 'Framework',
              sortable: true,
              render: (value) => String(value).toUpperCase(),
            },
            {
              key: 'riskLevel' as keyof Control,
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
              key: 'implementationStatus' as keyof Control,
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
              key: 'score' as keyof Control,
              header: 'Score',
              sortable: true,
              render: (value) => {
                const score = Number(value)
                if (!score) return <span className={tc.textMuted}>-</span>
                return (
                  <span className={cn(
                    'font-medium',
                    score >= 80 ? 'text-green-500' :
                    score >= 60 ? 'text-yellow-500' : 'text-red-500'
                  )}>
                    {score}%
                  </span>
                )
              },
            },
          ]}
          data={filteredControls as unknown as Record<string, unknown>[]}
          onRowClick={(row) => setSelectedControl(row as unknown as Control)}
        />
      )}

      {/* Control Detail Modal */}
      <ControlDetailModal
        control={selectedControl}
        open={!!selectedControl}
        onClose={() => setSelectedControl(null)}
      />
    </div>
  )
}
