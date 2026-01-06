/**
 * Ethical Tensions Page
 *
 * Track value conflicts and trade-offs identified in AI systems.
 */

'use client'

import { Scale, Plus, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/compliance'
import { StatCard, StatGrid } from '@/components/coinest'
import { DataTable } from '@/components/coinest'
import { useThemeClasses } from '@/hooks/useThemeClasses'
import { cn, snakeToTitle } from '@/lib/utils'

const mockTensions = [
  { id: 't1', valueA: 'Accuracy', valueB: 'Privacy', severity: 'critical', status: 'identified', requirement: 'privacy_data_governance', createdAt: '2024-01-15' },
  { id: 't2', valueA: 'Efficiency', valueB: 'Explainability', severity: 'significant', status: 'under_review', requirement: 'transparency', createdAt: '2024-01-14' },
  { id: 't3', valueA: 'Performance', valueB: 'Fairness', severity: 'critical', status: 'identified', requirement: 'diversity_fairness_nondiscrimination', createdAt: '2024-01-13' },
  { id: 't4', valueA: 'Automation', valueB: 'Human Control', severity: 'moderate', status: 'mitigated', requirement: 'human_agency_oversight', createdAt: '2024-01-12' },
  { id: 't5', valueA: 'Data Collection', valueB: 'User Consent', severity: 'significant', status: 'accepted', requirement: 'privacy_data_governance', createdAt: '2024-01-11' },
]

export default function TensionsPage() {
  const tc = useThemeClasses()

  const criticalCount = mockTensions.filter(t => t.severity === 'critical').length
  const underReviewCount = mockTensions.filter(t => t.status === 'under_review').length
  const mitigatedCount = mockTensions.filter(t => t.status === 'mitigated').length

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Ethical Tensions"
        description="Value conflicts and trade-offs"
        icon={<Scale className={cn('h-6 w-6', tc.accentCyan)} />}
        actions={
          <button className={cn('flex items-center gap-2 px-4 py-2 rounded-lg', tc.buttonPrimary)}>
            <Plus className="h-4 w-4" />
            Add Tension
          </button>
        }
      />

      <StatGrid columns={4}>
        <StatCard title="Total Tensions" value={mockTensions.length} variant="default" />
        <StatCard title="Critical" value={criticalCount} icon={<AlertTriangle className="h-5 w-5" />} variant="danger" />
        <StatCard title="Under Review" value={underReviewCount} variant="warning" />
        <StatCard title="Mitigated" value={mitigatedCount} variant="success" />
      </StatGrid>

      <DataTable
        columns={[
          {
            key: 'valueA' as keyof typeof mockTensions[0],
            header: 'Value A',
            sortable: true,
          },
          {
            key: 'valueB' as keyof typeof mockTensions[0],
            header: 'Value B',
            sortable: true,
          },
          {
            key: 'severity' as keyof typeof mockTensions[0],
            header: 'Severity',
            sortable: true,
            render: (value) => (
              <span className={cn(
                'badge',
                value === 'critical' ? tc.badgeCritical :
                value === 'significant' ? tc.badgeHigh :
                tc.badgeMedium
              )}>
                {String(value)}
              </span>
            ),
          },
          {
            key: 'status' as keyof typeof mockTensions[0],
            header: 'Status',
            sortable: true,
            render: (value) => (
              <span className={cn('badge', tc.badgeNeutral)}>
                {String(value).replace(/_/g, ' ')}
              </span>
            ),
          },
          {
            key: 'requirement' as keyof typeof mockTensions[0],
            header: 'Affected Requirement',
            render: (value) => (
              <span className={cn('badge', tc.badgeInfo)}>
                {snakeToTitle(String(value)).slice(0, 20)}...
              </span>
            ),
          },
          {
            key: 'createdAt' as keyof typeof mockTensions[0],
            header: 'Identified',
            sortable: true,
          },
        ]}
        data={mockTensions as unknown as Record<string, unknown>[]}
      />
    </div>
  )
}
