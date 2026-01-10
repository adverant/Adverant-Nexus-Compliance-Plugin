/**
 * Reports Page
 *
 * Report library showing all generated compliance reports with filtering,
 * sorting, and actions (view, download, share, regenerate).
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText,
  Plus,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Share2,
  Calendar,
  Search,
  ChevronDown,
  FileBarChart,
  FileCheck,
  FilePieChart,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react'
import { useThemeClasses } from '@/hooks/useThemeClasses'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/compliance'
import { StatCard, StatGrid } from '@/components/coinest/StatCard'
import { complianceApi } from '@/lib/compliance-api'

// Report types
type ReportType = 'executive_summary' | 'full_audit' | 'gap_analysis' | 'remediation_plan' | 'board_presentation'

const REPORT_TYPES: ReportType[] = [
  'executive_summary',
  'full_audit',
  'gap_analysis',
  'remediation_plan',
  'board_presentation',
]

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  executive_summary: 'Executive Summary',
  full_audit: 'Full Audit Report',
  gap_analysis: 'Gap Analysis',
  remediation_plan: 'Remediation Plan',
  board_presentation: 'Board Presentation',
}

const REPORT_TYPE_ICONS: Record<ReportType, typeof FileText> = {
  executive_summary: FileBarChart,
  full_audit: FileText,
  gap_analysis: FilePieChart,
  remediation_plan: FileCheck,
  board_presentation: FileSpreadsheet,
}

// Report status
type ReportStatus = 'generating' | 'ready' | 'failed' | 'scheduled'

const STATUS_COLORS: Record<ReportStatus, string> = {
  generating: 'bg-blue-500/20 text-blue-400',
  ready: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
  scheduled: 'bg-yellow-500/20 text-yellow-400',
}

// Report interface
interface Report {
  id: string
  title: string
  type: ReportType
  framework?: string
  status: ReportStatus
  format: 'pdf' | 'html' | 'markdown' | 'json'
  createdAt: string
  fileSize?: number
  downloadCount: number
}

export default function ReportsPage() {
  const tc = useThemeClasses()

  // State
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<ReportType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all')

  // Fetch reports
  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true)
      try {
        const response = await complianceApi.listReports()
        if (response.success && response.data) {
          setReports(response.data.data as unknown as Report[])
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error)
        // Set mock data for demo
        setReports([
          {
            id: '1',
            title: 'Q4 2025 Executive Compliance Summary',
            type: 'executive_summary',
            framework: 'ISO 27001',
            status: 'ready',
            format: 'pdf',
            createdAt: new Date().toISOString(),
            fileSize: 2.4 * 1024 * 1024,
            downloadCount: 12,
          },
          {
            id: '2',
            title: 'EU AI Act Gap Analysis',
            type: 'gap_analysis',
            framework: 'EU AI Act',
            status: 'ready',
            format: 'pdf',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            fileSize: 1.8 * 1024 * 1024,
            downloadCount: 8,
          },
          {
            id: '3',
            title: 'GDPR Remediation Roadmap',
            type: 'remediation_plan',
            framework: 'GDPR',
            status: 'generating',
            format: 'pdf',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            downloadCount: 0,
          },
          {
            id: '4',
            title: 'Board Compliance Presentation - January',
            type: 'board_presentation',
            status: 'scheduled',
            format: 'pdf',
            createdAt: new Date(Date.now() + 86400000 * 7).toISOString(),
            downloadCount: 0,
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchReports()
  }, [])

  // Filter reports
  const filteredReports = reports.filter((report) => {
    // Search filter
    if (searchQuery && !report.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    // Type filter
    if (typeFilter !== 'all' && report.type !== typeFilter) {
      return false
    }
    // Status filter
    if (statusFilter !== 'all' && report.status !== statusFilter) {
      return false
    }
    return true
  })

  // Stats
  const totalReports = reports.length
  const readyReports = reports.filter((r) => r.status === 'ready').length
  const generatingReports = reports.filter((r) => r.status === 'generating').length
  const scheduledReports = reports.filter((r) => r.status === 'scheduled').length

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-coinest-accent-cyan" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={<FileText className="h-6 w-6 text-coinest-accent-cyan" />}
        title="Report Library"
        description="Generate, view, and manage compliance reports"
      />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4', tc.textMuted)} />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn('w-64 pl-10 pr-4 py-2 rounded-lg border', tc.input)}
            />
          </div>

          {/* Type filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ReportType | 'all')}
              className={cn('pl-4 pr-8 py-2 rounded-lg border appearance-none', tc.input)}
            >
              <option value="all">All Types</option>
              {REPORT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {REPORT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            <ChevronDown className={cn('absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none', tc.textMuted)} />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'all')}
              className={cn('pl-4 pr-8 py-2 rounded-lg border appearance-none', tc.input)}
            >
              <option value="all">All Status</option>
              <option value="ready">Ready</option>
              <option value="generating">Generating</option>
              <option value="scheduled">Scheduled</option>
              <option value="failed">Failed</option>
            </select>
            <ChevronDown className={cn('absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none', tc.textMuted)} />
          </div>
        </div>

        {/* New Report Button */}
        <Link
          href="/compliance/reports/new"
          className={cn('flex items-center gap-2 px-4 py-2 rounded-lg', tc.buttonPrimary)}
        >
          <Plus className="h-4 w-4" />
          Generate Report
        </Link>
      </div>

      {/* Stats */}
      <StatGrid columns={4}>
        <StatCard
          title="Total Reports"
          value={totalReports}
          icon={<FileText className="h-5 w-5" />}
          variant="default"
        />
        <StatCard
          title="Ready"
          value={readyReports}
          icon={<FileCheck className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Generating"
          value={generatingReports}
          icon={<RefreshCw className="h-5 w-5" />}
          variant="cyan"
        />
        <StatCard
          title="Scheduled"
          value={scheduledReports}
          icon={<Calendar className="h-5 w-5" />}
          variant="warning"
        />
      </StatGrid>

      {/* Reports List */}
      <div className={cn('rounded-xl border', tc.border, tc.bgSecondary)}>
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className={cn('h-12 w-12 mx-auto mb-4', tc.textMuted)} />
            <p className={cn('text-lg font-medium mb-2', tc.textPrimary)}>No reports found</p>
            <p className={cn('text-sm mb-4', tc.textMuted)}>
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Generate your first compliance report'}
            </p>
            <Link
              href="/compliance/reports/new"
              className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-lg', tc.buttonPrimary)}
            >
              <Plus className="h-4 w-4" />
              Generate Report
            </Link>
          </div>
        ) : (
          <div className={cn('divide-y', tc.border)}>
            {filteredReports.map((report) => {
              const Icon = REPORT_TYPE_ICONS[report.type]
              return (
                <div key={report.id} className={cn('p-4 flex items-center gap-4', tc.tableRow)}>
                  {/* Icon */}
                  <div className={cn('p-2 rounded-lg', tc.bgTertiary)}>
                    <Icon className="h-5 w-5 text-coinest-accent-cyan" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-medium truncate', tc.textPrimary)}>{report.title}</p>
                    <p className={cn('text-xs', tc.textMuted)}>
                      {REPORT_TYPE_LABELS[report.type]}
                      {report.framework && ` • ${report.framework}`}
                      {' • '}
                      {formatDate(report.createdAt)}
                    </p>
                  </div>

                  {/* Status */}
                  <span className={cn('px-2 py-0.5 rounded text-xs font-medium', STATUS_COLORS[report.status])}>
                    {report.status === 'generating' && (
                      <Loader2 className="inline h-3 w-3 mr-1 animate-spin" />
                    )}
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </span>

                  {/* Size */}
                  <span className={cn('text-sm w-16 text-right', tc.textMuted)}>
                    {formatFileSize(report.fileSize)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {report.status === 'ready' && (
                      <>
                        <button className={cn('p-1.5 rounded', tc.buttonGhost)} title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className={cn('p-1.5 rounded', tc.buttonGhost)} title="Download">
                          <Download className="h-4 w-4" />
                        </button>
                        <button className={cn('p-1.5 rounded', tc.buttonGhost)} title="Share">
                          <Share2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {report.status === 'failed' && (
                      <button className={cn('p-1.5 rounded', tc.buttonGhost)} title="Regenerate">
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    )}
                    <button className={cn('p-1.5 rounded text-red-400', tc.buttonGhost)} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
