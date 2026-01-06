/**
 * Z-Inspection Reports Page
 *
 * Import and track Z-Inspection findings.
 */

'use client'

import { FileSearch, Upload, FileText } from 'lucide-react'
import { PageHeader } from '@/components/compliance'
import { StatCard, StatGrid } from '@/components/coinest'
import { DataTable } from '@/components/coinest'
import { useThemeClasses } from '@/hooks/useThemeClasses'
import { cn } from '@/lib/utils'

const mockReports = [
  { id: 'r1', title: 'Customer Service AI Inspection', aiSystem: 'CS Chatbot', findingCount: 12, tensionCount: 5, mappedControls: 45, status: 'integrated', importedAt: '2024-01-15' },
  { id: 'r2', title: 'Risk Assessment Model Review', aiSystem: 'Risk Model v2', findingCount: 8, tensionCount: 3, mappedControls: 28, status: 'mapped', importedAt: '2024-01-12' },
  { id: 'r3', title: 'HR Recruitment AI Audit', aiSystem: 'HR Screener', findingCount: 15, tensionCount: 7, mappedControls: 0, status: 'pending', importedAt: '2024-01-10' },
]

export default function ZInspectionPage() {
  const tc = useThemeClasses()

  const totalFindings = mockReports.reduce((acc, r) => acc + r.findingCount, 0)
  const totalMapped = mockReports.reduce((acc, r) => acc + r.mappedControls, 0)

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Z-Inspection Reports"
        description="Import and track Z-Inspection findings"
        icon={<FileSearch className={cn('h-6 w-6', tc.accentCyan)} />}
        actions={
          <button className={cn('flex items-center gap-2 px-4 py-2 rounded-lg', tc.buttonPrimary)}>
            <Upload className="h-4 w-4" />
            Import Report
          </button>
        }
      />

      <StatGrid columns={3}>
        <StatCard title="Total Reports" value={mockReports.length} icon={<FileText className="h-5 w-5" />} variant="default" />
        <StatCard title="Total Findings" value={totalFindings} variant="cyan" />
        <StatCard title="Mapped Controls" value={totalMapped} variant="success" />
      </StatGrid>

      <DataTable
        columns={[
          { key: 'title' as keyof typeof mockReports[0], header: 'Report Title', sortable: true },
          { key: 'aiSystem' as keyof typeof mockReports[0], header: 'AI System', sortable: true },
          { key: 'findingCount' as keyof typeof mockReports[0], header: 'Findings', sortable: true },
          { key: 'tensionCount' as keyof typeof mockReports[0], header: 'Tensions', sortable: true },
          { key: 'mappedControls' as keyof typeof mockReports[0], header: 'Mapped Controls', sortable: true },
          {
            key: 'status' as keyof typeof mockReports[0],
            header: 'Status',
            sortable: true,
            render: (value) => (
              <span className={cn(
                'badge',
                value === 'integrated' ? tc.badgeSuccess :
                value === 'mapped' ? tc.badgeInfo :
                tc.badgeWarning
              )}>
                {String(value)}
              </span>
            ),
          },
          { key: 'importedAt' as keyof typeof mockReports[0], header: 'Imported', sortable: true },
        ]}
        data={mockReports as unknown as Record<string, unknown>[]}
      />
    </div>
  )
}
