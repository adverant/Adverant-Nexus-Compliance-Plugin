/**
 * Cross-Framework Analysis Page
 *
 * Compare controls across 6 compliance frameworks.
 * Features overlap heatmap, requirement coverage, and framework comparison.
 */

'use client'

import { useState } from 'react'
import { GitCompare } from 'lucide-react'
import { PageHeader } from '@/components/compliance'
import { StatCard, StatGrid } from '@/components/coinest'
import { useTheme } from '@/stores/theme-store'
import { useThemeClasses } from '@/hooks/useThemeClasses'
import { cn } from '@/lib/utils'

const FRAMEWORKS = [
  'ISO 27001',
  'GDPR',
  'EU AI Act',
  'NIS2',
  'SOC 2',
  'ISO 27701',
]

// Mock heatmap data (overlap percentages between frameworks)
const heatmapData = [
  [100, 72, 45, 68, 92, 85],
  [72, 100, 58, 55, 65, 78],
  [45, 58, 100, 42, 38, 52],
  [68, 55, 42, 100, 58, 48],
  [92, 65, 38, 58, 100, 72],
  [85, 78, 52, 48, 72, 100],
]

// Mock requirement coverage data
const requirementCoverage = [
  { requirement: 'Human Agency & Oversight', iso27001: 45, gdpr: 32, euAiAct: 95, nis2: 28, soc2: 42, iso27701: 38 },
  { requirement: 'Technical Robustness', iso27001: 88, gdpr: 45, euAiAct: 92, nis2: 85, soc2: 90, iso27701: 52 },
  { requirement: 'Privacy & Data Governance', iso27001: 65, gdpr: 98, euAiAct: 78, nis2: 45, soc2: 55, iso27701: 95 },
  { requirement: 'Transparency', iso27001: 42, gdpr: 85, euAiAct: 88, nis2: 32, soc2: 38, iso27701: 72 },
  { requirement: 'Fairness & Non-discrimination', iso27001: 15, gdpr: 68, euAiAct: 85, nis2: 12, soc2: 18, iso27701: 45 },
  { requirement: 'Societal Wellbeing', iso27001: 22, gdpr: 35, euAiAct: 72, nis2: 28, soc2: 15, iso27701: 32 },
  { requirement: 'Accountability', iso27001: 78, gdpr: 82, euAiAct: 88, nis2: 72, soc2: 85, iso27701: 78 },
]

function HeatmapCell({ value, row, col }: { value: number; row: number; col: number }) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  // Skip diagonal (self-comparison)
  if (row === col) {
    return (
      <td className={cn('p-3 text-center', tc.bgTertiary)}>
        <span className={tc.textMuted}>-</span>
      </td>
    )
  }

  // Color based on overlap percentage
  const getColor = (v: number) => {
    if (v >= 80) return isDark ? 'bg-green-500/30 text-green-400' : 'bg-green-100 text-green-700'
    if (v >= 60) return isDark ? 'bg-yellow-500/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
    if (v >= 40) return isDark ? 'bg-orange-500/30 text-orange-400' : 'bg-orange-100 text-orange-700'
    return isDark ? 'bg-red-500/30 text-red-400' : 'bg-red-100 text-red-700'
  }

  return (
    <td className={cn('p-3 text-center transition-colors hover:opacity-80', getColor(value))}>
      <span className="font-medium">{value}%</span>
    </td>
  )
}

function CoverageCell({ value }: { value: number }) {
  const { isDark } = useTheme()

  const getColor = (v: number) => {
    if (v >= 80) return isDark ? 'bg-green-500/30 text-green-400' : 'bg-green-100 text-green-700'
    if (v >= 50) return isDark ? 'bg-yellow-500/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
    if (v >= 25) return isDark ? 'bg-orange-500/30 text-orange-400' : 'bg-orange-100 text-orange-700'
    return isDark ? 'bg-red-500/30 text-red-400' : 'bg-red-100 text-red-700'
  }

  return (
    <td className={cn('p-3 text-center', getColor(value))}>
      <span className="font-medium">{value}%</span>
    </td>
  )
}

export default function CrossFrameworkPage() {
  const { isDark } = useTheme()
  const tc = useThemeClasses()
  const [activeTab, setActiveTab] = useState<'heatmap' | 'requirements' | 'compare'>('heatmap')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Cross-Framework Analysis"
        description="Compare controls across 6 compliance frameworks"
        icon={<GitCompare className={cn('h-6 w-6', tc.accentCyan)} />}
      />

      {/* Stats */}
      <StatGrid columns={3}>
        <StatCard
          title="Highest Overlap"
          value="92%"
          variant="cyan"
          subtitle="ISO 27001 ↔ SOC 2"
        />
        <StatCard
          title="Lowest Overlap"
          value="38%"
          variant="default"
          subtitle="EU AI Act ↔ SOC 2"
        />
        <StatCard
          title="Average Overlap"
          value="58%"
          variant="default"
          subtitle="Across all frameworks"
        />
      </StatGrid>

      {/* Tabs */}
      <div className={cn('flex items-center gap-1 p-1 rounded-lg w-fit', tc.bgTertiary)}>
        <button
          onClick={() => setActiveTab('heatmap')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-colors',
            activeTab === 'heatmap'
              ? 'bg-coinest-accent-cyan text-white'
              : tc.textMuted
          )}
        >
          Overlap Heatmap
        </button>
        <button
          onClick={() => setActiveTab('requirements')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-colors',
            activeTab === 'requirements'
              ? 'bg-coinest-accent-cyan text-white'
              : tc.textMuted
          )}
        >
          Requirement Coverage
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-colors',
            activeTab === 'compare'
              ? 'bg-coinest-accent-cyan text-white'
              : tc.textMuted
          )}
        >
          Framework Comparison
        </button>
      </div>

      {/* Content */}
      {activeTab === 'heatmap' && (
        <div className={cn('rounded-xl border overflow-hidden', tc.card)}>
          <div className={cn('px-6 py-4 border-b', tc.border)}>
            <h3 className={cn('text-lg font-semibold font-urbanist', tc.textPrimary)}>
              Framework Overlap Matrix
            </h3>
            <p className={cn('text-sm mt-1', tc.textMuted)}>
              Percentage of control overlap between frameworks
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={tc.tableHeader}>
                  <th className={cn('p-3 text-left text-xs font-semibold uppercase', tc.textMuted)}>
                    Framework
                  </th>
                  {FRAMEWORKS.map((f) => (
                    <th key={f} className={cn('p-3 text-center text-xs font-semibold uppercase', tc.textMuted)}>
                      {f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={tc.tableDivider}>
                {FRAMEWORKS.map((framework, rowIdx) => (
                  <tr key={framework} className={cn('border-t', tc.border)}>
                    <td className={cn('p-3 font-medium', tc.textPrimary)}>{framework}</td>
                    {heatmapData[rowIdx]?.map((value, colIdx) => (
                      <HeatmapCell key={colIdx} value={value} row={rowIdx} col={colIdx} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'requirements' && (
        <div className={cn('rounded-xl border overflow-hidden', tc.card)}>
          <div className={cn('px-6 py-4 border-b', tc.border)}>
            <h3 className={cn('text-lg font-semibold font-urbanist', tc.textPrimary)}>
              EU Trustworthy AI Requirement Coverage
            </h3>
            <p className={cn('text-sm mt-1', tc.textMuted)}>
              Percentage of controls addressing each requirement by framework
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={tc.tableHeader}>
                  <th className={cn('p-3 text-left text-xs font-semibold uppercase', tc.textMuted)}>
                    Requirement
                  </th>
                  <th className={cn('p-3 text-center text-xs font-semibold uppercase', tc.textMuted)}>ISO 27001</th>
                  <th className={cn('p-3 text-center text-xs font-semibold uppercase', tc.textMuted)}>GDPR</th>
                  <th className={cn('p-3 text-center text-xs font-semibold uppercase', tc.textMuted)}>EU AI Act</th>
                  <th className={cn('p-3 text-center text-xs font-semibold uppercase', tc.textMuted)}>NIS2</th>
                  <th className={cn('p-3 text-center text-xs font-semibold uppercase', tc.textMuted)}>SOC 2</th>
                  <th className={cn('p-3 text-center text-xs font-semibold uppercase', tc.textMuted)}>ISO 27701</th>
                </tr>
              </thead>
              <tbody className={tc.tableDivider}>
                {requirementCoverage.map((row) => (
                  <tr key={row.requirement} className={cn('border-t', tc.border)}>
                    <td className={cn('p-3 font-medium', tc.textPrimary)}>{row.requirement}</td>
                    <CoverageCell value={row.iso27001} />
                    <CoverageCell value={row.gdpr} />
                    <CoverageCell value={row.euAiAct} />
                    <CoverageCell value={row.nis2} />
                    <CoverageCell value={row.soc2} />
                    <CoverageCell value={row.iso27701} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'compare' && (
        <div className={cn('rounded-xl border p-6', tc.card)}>
          <div className="text-center py-12">
            <GitCompare className={cn('h-12 w-12 mx-auto mb-4', tc.textMuted)} />
            <h3 className={cn('text-lg font-semibold mb-2', tc.textPrimary)}>
              Framework Comparison
            </h3>
            <p className={cn('text-sm max-w-md mx-auto', tc.textMuted)}>
              Select two frameworks to see detailed control mappings and equivalents.
              This feature is coming soon.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
