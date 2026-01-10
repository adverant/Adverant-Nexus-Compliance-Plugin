/**
 * Assessments List Page
 *
 * Displays all compliance assessments with filtering, status tracking,
 * and quick actions for managing assessments.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ClipboardCheck,
  Plus,
  Filter,
  Search,
  MoreVertical,
  Play,
  Eye,
  Trash2,
  XCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ChevronRight,
  Calendar,
  Target,
} from 'lucide-react'
import { PageHeader } from '@/components/compliance'
import { StatCard, StatGrid, DataTable } from '@/components/coinest'
import { useTheme } from '@/stores/theme-store'
import { useThemeClasses } from '@/hooks/useThemeClasses'
import { cn } from '@/lib/utils'
import {
  complianceApi,
  type Assessment,
  type AssessmentStatus,
  type FrameworkId,
} from '@/lib/compliance-api'
import { FRAMEWORK_IDS } from '@/types/compliance'

// Status configuration
const STATUS_CONFIG: Record<AssessmentStatus, {
  label: string
  icon: React.ElementType
  color: string
  bgClass: string
}> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-yellow-400',
    bgClass: 'bg-yellow-500/20',
  },
  in_progress: {
    label: 'In Progress',
    icon: Loader2,
    color: 'text-blue-400',
    bgClass: 'bg-blue-500/20',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-green-400',
    bgClass: 'bg-green-500/20',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    color: 'text-red-400',
    bgClass: 'bg-red-500/20',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-neutral-400',
    bgClass: 'bg-neutral-500/20',
  },
}

// Framework labels
const FRAMEWORK_LABELS: Record<string, string> = {
  eu_ai_act: 'EU AI Act',
  iso_27001: 'ISO 27001',
  gdpr: 'GDPR',
  nis2: 'NIS2',
  soc2: 'SOC 2',
  iso_27701: 'ISO 27701',
}

export default function AssessmentsListPage() {
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [statusFilter, setStatusFilter] = useState<AssessmentStatus | ''>('')
  const [frameworkFilter, setFrameworkFilter] = useState<FrameworkId | ''>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    averageScore: 0,
  })

  const fetchAssessments = useCallback(async () => {
    try {
      const response = await complianceApi.listAssessments({
        status: statusFilter || undefined,
        frameworkId: frameworkFilter || undefined,
        page,
        limit,
      })

      if (response.success && response.data) {
        setAssessments(response.data.data || [])
        setTotal(response.data.total || 0)
        setError(null)
      }
    } catch (err) {
      console.error('Failed to fetch assessments:', err)
      setError('Failed to load assessments')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [statusFilter, frameworkFilter, page, limit])

  const fetchStats = useCallback(async () => {
    try {
      const response = await complianceApi.getAssessmentStats()
      if (response.success && response.data) {
        setStats({
          total: response.data.total,
          pending: response.data.byStatus?.pending || 0,
          inProgress: response.data.byStatus?.in_progress || 0,
          completed: response.data.byStatus?.completed || 0,
          averageScore: response.data.averageScore || 0,
        })
      }
    } catch (err) {
      console.error('Failed to fetch assessment stats:', err)
    }
  }, [])

  useEffect(() => {
    fetchAssessments()
    fetchStats()
  }, [fetchAssessments, fetchStats])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchAssessments()
    fetchStats()
  }

  const handleDeleteAssessment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return

    try {
      await complianceApi.deleteAssessment(id)
      fetchAssessments()
      fetchStats()
    } catch (err) {
      console.error('Failed to delete assessment:', err)
    }
  }

  const handleRunAssessment = async (id: string) => {
    try {
      await complianceApi.runAssessment(id)
      fetchAssessments()
    } catch (err) {
      console.error('Failed to run assessment:', err)
    }
  }

  const handleCancelAssessment = async (id: string) => {
    try {
      await complianceApi.cancelAssessment(id)
      fetchAssessments()
    } catch (err) {
      console.error('Failed to cancel assessment:', err)
    }
  }

  // Filter assessments by search query (client-side)
  const filteredAssessments = assessments.filter((a) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      a.targetSystemName.toLowerCase().includes(query) ||
      a.frameworkId.toLowerCase().includes(query)
    )
  })

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={cn('h-8 w-8 animate-spin', tc.accentCyan)} />
          <p className={tc.textMuted}>Loading assessments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Compliance Assessments"
        description="Create and manage compliance assessments for your AI systems"
        icon={<ClipboardCheck className={cn('h-6 w-6', tc.accentCyan)} />}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                tc.buttonSecondary
              )}
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              Refresh
            </button>
            <Link
              href="/compliance/assessments/new"
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                tc.buttonPrimary
              )}
            >
              <Plus className="h-4 w-4" />
              New Assessment
            </Link>
          </div>
        }
      />

      {/* Stats Cards */}
      <StatGrid columns={4}>
        <StatCard
          title="Total Assessments"
          value={stats.total}
          icon={<ClipboardCheck className="h-5 w-5" />}
          variant="cyan"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={<Loader2 className="h-5 w-5" />}
          variant="cyan"
          subtitle={`${stats.pending} pending`}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Average Score"
          value={`${stats.averageScore}%`}
          icon={<Target className="h-5 w-5" />}
          variant={stats.averageScore >= 70 ? 'success' : stats.averageScore >= 50 ? 'warning' : 'danger'}
        />
      </StatGrid>

      {/* Filters */}
      <div className={cn('rounded-xl border p-4', tc.card)}>
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4', tc.textMuted)} />
            <input
              type="text"
              placeholder="Search by system name or framework..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full pl-10 pr-4 py-2 rounded-lg border text-sm',
                tc.input
              )}
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className={cn('h-4 w-4', tc.textMuted)} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AssessmentStatus | '')}
              className={cn('px-3 py-2 rounded-lg border text-sm', tc.input)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Framework Filter */}
          <select
            value={frameworkFilter}
            onChange={(e) => setFrameworkFilter(e.target.value as FrameworkId | '')}
            className={cn('px-3 py-2 rounded-lg border text-sm', tc.input)}
          >
            <option value="">All Frameworks</option>
            {FRAMEWORK_IDS.map((fw) => (
              <option key={fw} value={fw}>
                {FRAMEWORK_LABELS[fw] || fw}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assessments Table */}
      <div className={cn('rounded-xl border overflow-hidden', tc.card)}>
        <div className={cn('px-6 py-4 border-b flex items-center justify-between', tc.border)}>
          <div>
            <h3 className={cn('text-lg font-semibold font-urbanist', tc.textPrimary)}>
              Assessments
            </h3>
            <p className={cn('text-sm', tc.textMuted)}>
              {total} assessment{total !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        {error ? (
          <div className="p-8 text-center">
            <AlertTriangle className={cn('h-12 w-12 mx-auto mb-4 text-yellow-500')} />
            <p className={tc.textMuted}>{error}</p>
            <button
              onClick={handleRefresh}
              className={cn('mt-4 px-4 py-2 rounded-lg', tc.buttonSecondary)}
            >
              Try Again
            </button>
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="p-8 text-center">
            <ClipboardCheck className={cn('h-12 w-12 mx-auto mb-4', tc.textMuted)} />
            <p className={cn('text-lg font-medium mb-2', tc.textPrimary)}>
              No assessments found
            </p>
            <p className={cn('text-sm mb-4', tc.textMuted)}>
              {searchQuery || statusFilter || frameworkFilter
                ? 'Try adjusting your filters'
                : 'Create your first compliance assessment to get started'}
            </p>
            <Link
              href="/compliance/assessments/new"
              className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-lg', tc.buttonPrimary)}
            >
              <Plus className="h-4 w-4" />
              New Assessment
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-inherit">
            {filteredAssessments.map((assessment) => {
              const statusConfig = STATUS_CONFIG[assessment.status]
              const StatusIcon = statusConfig.icon

              return (
                <div
                  key={assessment.id}
                  className={cn(
                    'p-4 flex items-center gap-4 transition-colors',
                    tc.tableRow
                  )}
                >
                  {/* Status Icon */}
                  <div
                    className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                      statusConfig.bgClass
                    )}
                  >
                    <StatusIcon
                      className={cn(
                        'h-5 w-5',
                        statusConfig.color,
                        assessment.status === 'in_progress' && 'animate-spin'
                      )}
                    />
                  </div>

                  {/* Assessment Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/compliance/assessments/${assessment.id}`}
                        className={cn('font-medium truncate hover:underline', tc.textPrimary)}
                      >
                        {assessment.targetSystemName}
                      </Link>
                      <span
                        className={cn(
                          'px-2 py-0.5 text-xs font-medium rounded-full',
                          statusConfig.bgClass,
                          statusConfig.color
                        )}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className={cn('flex items-center gap-3 text-sm', tc.textMuted)}>
                      <span className="flex items-center gap-1">
                        <Target className="h-3.5 w-3.5" />
                        {FRAMEWORK_LABELS[assessment.frameworkId] || assessment.frameworkId}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(assessment.createdAt).toLocaleDateString()}
                      </span>
                      {assessment.overallScore !== null && (
                        <span
                          className={cn(
                            'font-medium',
                            assessment.overallScore >= 70
                              ? 'text-green-500'
                              : assessment.overallScore >= 50
                              ? 'text-yellow-500'
                              : 'text-red-500'
                          )}
                        >
                          Score: {assessment.overallScore}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className={cn('text-right text-sm hidden md:block', tc.textMuted)}>
                    <div>
                      <span className="text-green-500">{assessment.controlsPassed}</span>
                      {' / '}
                      <span>{assessment.controlsAssessed}</span>
                      {' controls'}
                    </div>
                    {assessment.criticalFindings > 0 && (
                      <div className="text-red-500">
                        {assessment.criticalFindings} critical finding{assessment.criticalFindings !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {assessment.status === 'pending' && (
                      <button
                        onClick={() => handleRunAssessment(assessment.id)}
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          tc.buttonGhost,
                          'text-green-500 hover:text-green-400'
                        )}
                        title="Run Assessment"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                    {assessment.status === 'in_progress' && (
                      <button
                        onClick={() => handleCancelAssessment(assessment.id)}
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          tc.buttonGhost,
                          'text-yellow-500 hover:text-yellow-400'
                        )}
                        title="Cancel Assessment"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                    {assessment.status === 'completed' && (
                      <Link
                        href={`/compliance/assessments/${assessment.id}/results`}
                        className={cn('p-2 rounded-lg transition-colors', tc.buttonGhost)}
                        title="View Results"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    )}
                    <Link
                      href={`/compliance/assessments/${assessment.id}`}
                      className={cn('p-2 rounded-lg transition-colors', tc.buttonGhost)}
                      title="View Details"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDeleteAssessment(assessment.id)}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        tc.buttonGhost,
                        'text-red-500 hover:text-red-400'
                      )}
                      title="Delete Assessment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className={cn('px-6 py-4 border-t flex items-center justify-between', tc.border)}>
            <p className={cn('text-sm', tc.textMuted)}>
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm',
                  tc.buttonSecondary,
                  page === 1 && 'opacity-50 cursor-not-allowed'
                )}
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * limit >= total}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm',
                  tc.buttonSecondary,
                  page * limit >= total && 'opacity-50 cursor-not-allowed'
                )}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}