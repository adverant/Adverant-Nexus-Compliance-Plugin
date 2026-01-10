/**
 * Assessment Detail Page
 *
 * Shows detailed information about a specific assessment including:
 * - Status and progress
 * - Findings summary
 * - Quick actions
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ClipboardCheck,
  ArrowLeft,
  Play,
  XCircle,
  RefreshCw,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Target,
  Calendar,
  User,
  BarChart3,
  ChevronRight,
  Download,
  Trash2,
  Eye,
} from 'lucide-react'
import { PageHeader } from '@/components/compliance'
import { StatCard, StatGrid, ChartCard } from '@/components/coinest'
import { useTheme } from '@/stores/theme-store'
import { useThemeClasses } from '@/hooks/useThemeClasses'
import { cn } from '@/lib/utils'
import {
  complianceApi,
  type Assessment,
  type AssessmentFinding,
  type AssessmentStatus,
} from '@/lib/compliance-api'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

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

// Finding status colors
const FINDING_STATUS_COLORS = {
  compliant: '#22c55e',
  non_compliant: '#ef4444',
  partial: '#eab308',
  not_applicable: '#6b7280',
  not_assessed: '#3b82f6',
}

export default function AssessmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  const assessmentId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [findings, setFindings] = useState<AssessmentFinding[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchAssessment = useCallback(async () => {
    try {
      const response = await complianceApi.getAssessment(assessmentId)
      if (response.success && response.data) {
        setAssessment(response.data)
        setError(null)
      }
    } catch (err) {
      console.error('Failed to fetch assessment:', err)
      setError('Failed to load assessment')
    }
  }, [assessmentId])

  const fetchFindings = useCallback(async () => {
    try {
      const response = await complianceApi.getAssessmentFindings(assessmentId, { limit: 100 })
      if (response.success && response.data) {
        setFindings(response.data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch findings:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [assessmentId])

  useEffect(() => {
    fetchAssessment()
    fetchFindings()
  }, [fetchAssessment, fetchFindings])

  // Auto-refresh for in-progress assessments
  useEffect(() => {
    if (assessment?.status === 'in_progress') {
      const interval = setInterval(() => {
        fetchAssessment()
        fetchFindings()
      }, 5000) // Refresh every 5 seconds

      return () => clearInterval(interval)
    }
    return undefined
  }, [assessment?.status, fetchAssessment, fetchFindings])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchAssessment()
    fetchFindings()
  }

  const handleRunAssessment = async () => {
    if (!assessment) return
    try {
      await complianceApi.runAssessment(assessment.id)
      fetchAssessment()
    } catch (err) {
      console.error('Failed to run assessment:', err)
    }
  }

  const handleCancelAssessment = async () => {
    if (!assessment) return
    try {
      await complianceApi.cancelAssessment(assessment.id)
      fetchAssessment()
    } catch (err) {
      console.error('Failed to cancel assessment:', err)
    }
  }

  const handleDeleteAssessment = async () => {
    if (!assessment) return
    if (!confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) return

    try {
      await complianceApi.deleteAssessment(assessment.id)
      router.push('/compliance/assessments')
    } catch (err) {
      console.error('Failed to delete assessment:', err)
    }
  }

  // Calculate finding statistics
  const findingStats = findings.reduce(
    (acc, f) => {
      acc[f.status] = (acc[f.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const findingChartData = Object.entries(findingStats).map(([status, count]) => ({
    name: status.replace(/_/g, ' '),
    value: count,
    color: FINDING_STATUS_COLORS[status as keyof typeof FINDING_STATUS_COLORS] || '#6b7280',
  }))

  // Severity distribution
  const severityStats = findings.reduce(
    (acc, f) => {
      if (f.severity) {
        acc[f.severity] = (acc[f.severity] || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>
  )

  const severityChartData = [
    { name: 'Critical', value: severityStats.critical || 0, fill: '#ef4444' },
    { name: 'Major', value: severityStats.major || 0, fill: '#f97316' },
    { name: 'Minor', value: severityStats.minor || 0, fill: '#eab308' },
    { name: 'Observation', value: severityStats.observation || 0, fill: '#3b82f6' },
  ].filter((d) => d.value > 0)

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={cn('h-8 w-8 animate-spin', tc.accentCyan)} />
          <p className={tc.textMuted}>Loading assessment...</p>
        </div>
      </div>
    )
  }

  if (error || !assessment) {
    return (
      <div className="p-6">
        <div className={cn('rounded-xl border p-8 text-center', tc.card)}>
          <AlertTriangle className={cn('h-12 w-12 mx-auto mb-4 text-yellow-500')} />
          <h2 className={cn('text-xl font-semibold mb-2', tc.textPrimary)}>
            Assessment Not Found
          </h2>
          <p className={cn('mb-4', tc.textMuted)}>
            {error || 'The requested assessment could not be found.'}
          </p>
          <Link
            href="/compliance/assessments"
            className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-lg', tc.buttonPrimary)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assessments
          </Link>
        </div>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[assessment.status]
  const StatusIcon = statusConfig.icon

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title={assessment.targetSystemName}
        description={`${FRAMEWORK_LABELS[assessment.frameworkId] || assessment.frameworkId} Assessment`}
        icon={<ClipboardCheck className={cn('h-6 w-6', tc.accentCyan)} />}
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/compliance/assessments"
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                tc.buttonSecondary
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <button
              onClick={handleRefresh}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                tc.buttonSecondary
              )}
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </button>
            {assessment.status === 'pending' && (
              <button
                onClick={handleRunAssessment}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                  tc.buttonPrimary
                )}
              >
                <Play className="h-4 w-4" />
                Run Assessment
              </button>
            )}
            {assessment.status === 'in_progress' && (
              <button
                onClick={handleCancelAssessment}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-yellow-500 text-white hover:bg-yellow-600'
                )}
              >
                <XCircle className="h-4 w-4" />
                Cancel
              </button>
            )}
            {assessment.status === 'completed' && (
              <Link
                href={`/compliance/assessments/${assessment.id}/results`}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                  tc.buttonPrimary
                )}
              >
                <Eye className="h-4 w-4" />
                View Results
              </Link>
            )}
          </div>
        }
      />

      {/* Status Banner */}
      <div
        className={cn(
          'rounded-xl border p-4 flex items-center justify-between',
          tc.card,
          statusConfig.bgClass
        )}
      >
        <div className="flex items-center gap-3">
          <StatusIcon
            className={cn(
              'h-6 w-6',
              statusConfig.color,
              assessment.status === 'in_progress' && 'animate-spin'
            )}
          />
          <div>
            <p className={cn('font-semibold', tc.textPrimary)}>{statusConfig.label}</p>
            <p className={cn('text-sm', tc.textMuted)}>
              {assessment.status === 'in_progress' && 'Assessment is currently running...'}
              {assessment.status === 'pending' && 'Assessment is ready to run'}
              {assessment.status === 'completed' && `Completed on ${new Date(assessment.completedAt!).toLocaleDateString()}`}
              {assessment.status === 'failed' && 'Assessment encountered an error'}
              {assessment.status === 'cancelled' && 'Assessment was cancelled'}
            </p>
          </div>
        </div>
        {assessment.status === 'in_progress' && (
          <div className={cn('text-right', tc.textMuted)}>
            <p className="text-sm">Progress</p>
            <p className={cn('text-2xl font-bold', tc.textPrimary)}>
              {assessment.controlsAssessed} / {assessment.controlsAssessed + (assessment.criticalFindings || 0) + 10}
            </p>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <StatGrid columns={4}>
        <StatCard
          title="Overall Score"
          value={assessment.overallScore !== null ? `${assessment.overallScore}%` : '-'}
          icon={<Target className="h-5 w-5" />}
          variant={
            assessment.overallScore === null
              ? 'default'
              : assessment.overallScore >= 70
              ? 'success'
              : assessment.overallScore >= 50
              ? 'warning'
              : 'danger'
          }
        />
        <StatCard
          title="Controls Assessed"
          value={assessment.controlsAssessed}
          icon={<BarChart3 className="h-5 w-5" />}
          variant="cyan"
          subtitle={`${assessment.controlsPassed} passed`}
        />
        <StatCard
          title="Controls Failed"
          value={assessment.controlsFailed}
          icon={<XCircle className="h-5 w-5" />}
          variant={assessment.controlsFailed > 0 ? 'danger' : 'success'}
        />
        <StatCard
          title="Critical Findings"
          value={assessment.criticalFindings}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant={assessment.criticalFindings > 0 ? 'danger' : 'success'}
        />
      </StatGrid>

      {/* Charts Row */}
      {findings.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Finding Status Distribution */}
          <ChartCard title="Finding Status" subtitle="Distribution by compliance status">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={findingChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {findingChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                    border: `1px solid ${isDark ? '#333333' : '#e5e7eb'}`,
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Severity Distribution */}
          <ChartCard title="Severity Distribution" subtitle="Findings by severity level">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={severityChartData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? '#333333' : '#e5e7eb'}
                />
                <XAxis
                  type="number"
                  tick={{ fill: isDark ? '#a3a3a3' : '#6b7280', fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: isDark ? '#a3a3a3' : '#6b7280', fontSize: 12 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                    border: `1px solid ${isDark ? '#333333' : '#e5e7eb'}`,
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Assessment Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info Card */}
        <div className={cn('rounded-xl border', tc.card)}>
          <div className={cn('px-6 py-4 border-b', tc.border)}>
            <h3 className={cn('text-lg font-semibold font-urbanist', tc.textPrimary)}>
              Assessment Details
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Target className={cn('h-5 w-5', tc.textMuted)} />
              <div>
                <p className={cn('text-sm', tc.textMuted)}>Framework</p>
                <p className={cn('font-medium', tc.textPrimary)}>
                  {FRAMEWORK_LABELS[assessment.frameworkId] || assessment.frameworkId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className={cn('h-5 w-5', tc.textMuted)} />
              <div>
                <p className={cn('text-sm', tc.textMuted)}>Created</p>
                <p className={cn('font-medium', tc.textPrimary)}>
                  {new Date(assessment.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {assessment.startedAt && (
              <div className="flex items-center gap-3">
                <Play className={cn('h-5 w-5', tc.textMuted)} />
                <div>
                  <p className={cn('text-sm', tc.textMuted)}>Started</p>
                  <p className={cn('font-medium', tc.textPrimary)}>
                    {new Date(assessment.startedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            {assessment.completedAt && (
              <div className="flex items-center gap-3">
                <CheckCircle2 className={cn('h-5 w-5', tc.textMuted)} />
                <div>
                  <p className={cn('text-sm', tc.textMuted)}>Completed</p>
                  <p className={cn('font-medium', tc.textPrimary)}>
                    {new Date(assessment.completedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            {assessment.useAI && (
              <div className="flex items-center gap-3">
                <BarChart3 className={cn('h-5 w-5', tc.textMuted)} />
                <div>
                  <p className={cn('text-sm', tc.textMuted)}>AI Model</p>
                  <p className={cn('font-medium', tc.textPrimary)}>
                    {assessment.aiModel || 'Default'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Findings */}
        <div className={cn('lg:col-span-2 rounded-xl border', tc.card)}>
          <div className={cn('px-6 py-4 border-b flex items-center justify-between', tc.border)}>
            <div>
              <h3 className={cn('text-lg font-semibold font-urbanist', tc.textPrimary)}>
                Recent Findings
              </h3>
              <p className={cn('text-sm', tc.textMuted)}>
                {findings.length} finding{findings.length !== 1 ? 's' : ''} total
              </p>
            </div>
            {findings.length > 0 && (
              <Link
                href={`/compliance/assessments/${assessment.id}/findings`}
                className={cn('text-sm font-medium flex items-center gap-1', tc.accentCyan)}
              >
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          <div className="p-4">
            {findings.length === 0 ? (
              <div className="text-center py-8">
                <FileText className={cn('h-12 w-12 mx-auto mb-4', tc.textMuted)} />
                <p className={tc.textMuted}>
                  {assessment.status === 'pending'
                    ? 'Run the assessment to generate findings'
                    : assessment.status === 'in_progress'
                    ? 'Findings will appear as the assessment progresses'
                    : 'No findings generated'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {findings.slice(0, 5).map((finding) => (
                  <div
                    key={finding.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border',
                      tc.border,
                      tc.tableRow
                    )}
                  >
                    <div
                      className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                        finding.status === 'compliant' && 'bg-green-500/20',
                        finding.status === 'non_compliant' && 'bg-red-500/20',
                        finding.status === 'partial' && 'bg-yellow-500/20',
                        finding.status === 'not_applicable' && tc.bgTertiary,
                        finding.status === 'not_assessed' && 'bg-blue-500/20'
                      )}
                    >
                      {finding.status === 'compliant' && (
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                      )}
                      {finding.status === 'non_compliant' && (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                      {finding.status === 'partial' && (
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      )}
                      {finding.status === 'not_applicable' && (
                        <Clock className={cn('h-4 w-4', tc.textMuted)} />
                      )}
                      {finding.status === 'not_assessed' && (
                        <Clock className="h-4 w-4 text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('font-medium truncate', tc.textPrimary)}>
                        {finding.controlNumber} - {finding.controlTitle}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs font-medium rounded-full',
                            finding.status === 'compliant' && 'bg-green-500/20 text-green-400',
                            finding.status === 'non_compliant' && 'bg-red-500/20 text-red-400',
                            finding.status === 'partial' && 'bg-yellow-500/20 text-yellow-400',
                            finding.status === 'not_applicable' && cn(tc.bgTertiary, tc.textMuted),
                            finding.status === 'not_assessed' && 'bg-blue-500/20 text-blue-400'
                          )}
                        >
                          {finding.status.replace(/_/g, ' ')}
                        </span>
                        {finding.severity && (
                          <span
                            className={cn(
                              'px-2 py-0.5 text-xs font-medium rounded-full',
                              finding.severity === 'critical' && 'bg-red-500/20 text-red-400',
                              finding.severity === 'major' && 'bg-orange-500/20 text-orange-400',
                              finding.severity === 'minor' && 'bg-yellow-500/20 text-yellow-400',
                              finding.severity === 'observation' && 'bg-blue-500/20 text-blue-400'
                            )}
                          >
                            {finding.severity}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={cn('h-4 w-4 shrink-0', tc.textMuted)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={cn('rounded-xl border', tc.card)}>
        <div className={cn('px-6 py-4 border-b', tc.border)}>
          <h3 className={cn('text-lg font-semibold font-urbanist', tc.textPrimary)}>
            Actions
          </h3>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-3">
            {assessment.status === 'completed' && (
              <>
                <Link
                  href={`/compliance/assessments/${assessment.id}/results`}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg',
                    tc.buttonPrimary
                  )}
                >
                  <Eye className="h-4 w-4" />
                  View Results
                </Link>
                <button
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg',
                    tc.buttonSecondary
                  )}
                >
                  <Download className="h-4 w-4" />
                  Export Report
                </button>
              </>
            )}
            <button
              onClick={handleDeleteAssessment}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-red-400',
                tc.buttonGhost
              )}
            >
              <Trash2 className="h-4 w-4" />
              Delete Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}