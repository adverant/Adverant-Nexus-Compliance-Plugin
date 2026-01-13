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
import type { ComplianceReport, ReportType } from '@/types/compliance'

// Report types for filtering
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

// Display status type (maps from API status)
type DisplayStatus = 'generating' | 'ready' | 'failed' | 'pending'

function mapApiStatusToDisplay(status: ComplianceReport['status']): DisplayStatus {
  switch (status) {
    case 'completed':
      return 'ready'
    case 'generating':
      return 'generating'
    case 'failed':
      return 'failed'
    case 'pending':
      return 'pending'
    default:
      return 'pending'
  }
}

const STATUS_COLORS: Record<DisplayStatus, string> = {
  generating: 'bg-blue-500/20 text-blue-400',
  ready: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
}

const STATUS_LABELS: Record<DisplayStatus, string> = {
  generating: 'Generating',
  ready: 'Ready',
  failed: 'Failed',
  pending: 'Pending',
}

export default function ReportsPage() {
  const tc = useThemeClasses()

  // State - using ComplianceReport type from API
  const [reports, setReports] = useState<ComplianceReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<ReportType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<DisplayStatus | 'all'>('all')

  // Fetch reports from API
  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await complianceApi.listReports()
        if (response.success && response.data) {
          // Handle both API response formats:
          // 1. {success: true, data: [...]} - direct array
          // 2. {success: true, data: {data: [...], total: N}} - wrapped array
          const reportsData = Array.isArray(response.data)
            ? response.data
            : response.data.data || []
          setReports(reportsData as ComplianceReport[])
        } else {
          const errorMsg = typeof response.error === 'string'
            ? response.error
            : response.error?.message || 'Failed to fetch reports'
          setError(errorMsg)
        }
      } catch (err) {
        console.error('Failed to fetch reports:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch reports')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReports()
  }, [])

  // Filter reports
  const filteredReports = reports.filter((report) => {
    if (searchQuery && !report.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (typeFilter !== 'all' && report.reportType !== typeFilter) {
      return false
    }
    if (statusFilter !== 'all' && mapApiStatusToDisplay(report.status) !== statusFilter) {
      return false
    }
    return true
  })

  // Stats - map API status to display status for counting
  const totalReports = reports.length
  const readyReports = reports.filter((r) => mapApiStatusToDisplay(r.status) === 'ready').length
  const generatingReports = reports.filter((r) => mapApiStatusToDisplay(r.status) === 'generating').length
  const pendingReports = reports.filter((r) => mapApiStatusToDisplay(r.status) === 'pending').length

  // Format file size
  const formatFileSize = (bytes: number | null) => {
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

  // Handle report download
  const handleDownload = async (reportId: string) => {
    try {
      const blob = await complianceApi.downloadReport(reportId)
      const url = window.URL.createObjectURL(blob.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${reportId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Failed to download report:', err)
    }
  }

  // Handle report delete
  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return
    try {
      await complianceApi.deleteReport(reportId)
      setReports(reports.filter((r) => r.id !== reportId))
    } catch (err) {
      console.error('Failed to delete report:', err)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-coinest-accent-cyan" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<FileText className="h-6 w-6 text-coinest-accent-cyan" />}
          title="Report Library"
          description="Generate, view, and manage compliance reports"
        />
        <div className={cn('rounded-xl border p-8 text-center', tc.border, tc.bgSecondary)}>
          <FileText className={cn('h-12 w-12 mx-auto mb-4', tc.textMuted)} />
          <p className={cn('text-lg font-medium mb-2', tc.textPrimary)}>Failed to load reports</p>
          <p className={cn('text-sm mb-4', tc.textMuted)}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-lg', tc.buttonPrimary)}
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
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
              onChange={(e) => setStatusFilter(e.target.value as DisplayStatus | 'all')}
              className={cn('pl-4 pr-8 py-2 rounded-lg border appearance-none', tc.input)}
            >
              <option value="all">All Status</option>
              <option value="ready">Ready</option>
              <option value="generating">Generating</option>
              <option value="pending">Pending</option>
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
          title="Pending"
          value={pendingReports}
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
              const displayStatus = mapApiStatusToDisplay(report.status)
              const Icon = REPORT_TYPE_ICONS[report.reportType] || FileText
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
                      {REPORT_TYPE_LABELS[report.reportType] || report.reportType}
                      {' • '}
                      {formatDate(report.createdAt)}
                    </p>
                  </div>

                  {/* Status */}
                  <span className={cn('px-2 py-0.5 rounded text-xs font-medium', STATUS_COLORS[displayStatus])}>
                    {displayStatus === 'generating' && (
                      <Loader2 className="inline h-3 w-3 mr-1 animate-spin" />
                    )}
                    {STATUS_LABELS[displayStatus]}
                  </span>

                  {/* Size */}
                  <span className={cn('text-sm w-16 text-right', tc.textMuted)}>
                    {formatFileSize(report.fileSize)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {displayStatus === 'ready' && (
                      <>
                        <button className={cn('p-1.5 rounded', tc.buttonGhost)} title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className={cn('p-1.5 rounded', tc.buttonGhost)}
                          title="Download"
                          onClick={() => handleDownload(report.id)}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button className={cn('p-1.5 rounded', tc.buttonGhost)} title="Share">
                          <Share2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {displayStatus === 'failed' && (
                      <button className={cn('p-1.5 rounded', tc.buttonGhost)} title="Regenerate">
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      className={cn('p-1.5 rounded text-red-400', tc.buttonGhost)}
                      title="Delete"
                      onClick={() => handleDelete(report.id)}
                    >
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
