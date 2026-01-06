/**
 * Regulatory Monitoring Page
 *
 * Track regulatory changes and updates.
 */

'use client'

import { Radio, Plus, ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/compliance'
import { StatCard, StatGrid } from '@/components/coinest'
import { DataTable } from '@/components/coinest'
import { useThemeClasses } from '@/hooks/useThemeClasses'
import { cn } from '@/lib/utils'

const mockUpdates = [
  { id: 'u1', title: 'EU AI Act Implementing Regulation Published', source: 'EUR-Lex', framework: 'EU AI Act', type: 'guidance', status: 'pending', detectedAt: '2024-01-16' },
  { id: 'u2', title: 'EDPB Guidelines on Data Subject Rights', source: 'EDPB', framework: 'GDPR', type: 'guidance', status: 'analyzed', detectedAt: '2024-01-14' },
  { id: 'u3', title: 'NIS2 Transposition Deadline Reminder', source: 'ENISA', framework: 'NIS2', type: 'deadline', status: 'implemented', detectedAt: '2024-01-12' },
  { id: 'u4', title: 'ISO 27001:2022 Amendment', source: 'ISO', framework: 'ISO 27001', type: 'amendment', status: 'pending', detectedAt: '2024-01-10' },
]

export default function RegulatoryPage() {
  const tc = useThemeClasses()

  const pendingCount = mockUpdates.filter(u => u.status === 'pending').length
  const analyzedCount = mockUpdates.filter(u => u.status === 'analyzed').length

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Regulatory Monitoring"
        description="Track regulatory changes and updates"
        icon={<Radio className={cn('h-6 w-6', tc.accentCyan)} />}
        actions={
          <button className={cn('flex items-center gap-2 px-4 py-2 rounded-lg', tc.buttonPrimary)}>
            <Plus className="h-4 w-4" />
            Add Source
          </button>
        }
      />

      <StatGrid columns={3}>
        <StatCard title="Total Updates" value={mockUpdates.length} variant="default" />
        <StatCard title="Pending Review" value={pendingCount} variant="warning" />
        <StatCard title="Analyzed" value={analyzedCount} variant="cyan" />
      </StatGrid>

      <DataTable
        columns={[
          { key: 'title' as keyof typeof mockUpdates[0], header: 'Update', sortable: true },
          { key: 'source' as keyof typeof mockUpdates[0], header: 'Source', sortable: true },
          {
            key: 'framework' as keyof typeof mockUpdates[0],
            header: 'Framework',
            render: (value) => <span className={cn('badge', tc.badgeInfo)}>{String(value)}</span>,
          },
          {
            key: 'type' as keyof typeof mockUpdates[0],
            header: 'Type',
            render: (value) => <span className={cn('badge', tc.badgeNeutral)}>{String(value)}</span>,
          },
          {
            key: 'status' as keyof typeof mockUpdates[0],
            header: 'Status',
            sortable: true,
            render: (value) => (
              <span className={cn(
                'badge',
                value === 'implemented' ? tc.badgeSuccess :
                value === 'analyzed' ? tc.badgeInfo :
                tc.badgeWarning
              )}>
                {String(value)}
              </span>
            ),
          },
          { key: 'detectedAt' as keyof typeof mockUpdates[0], header: 'Detected', sortable: true },
        ]}
        data={mockUpdates as unknown as Record<string, unknown>[]}
      />
    </div>
  )
}
