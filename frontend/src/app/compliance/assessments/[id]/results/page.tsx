/**
 * Assessment Results Page
 *
 * Comprehensive results dashboard showing:
 * - Overall score with breakdown
 * - Trustworthy AI requirements radar
 * - Finding details by category
 * - Recommendations summary
 * - Export options
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ClipboardCheck,
  ArrowLeft,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Target,
  BarChart3,
  ChevronRight,
  ChevronDown,
  Shield,
  TrendingUp,
  Eye,
  Users,
  Lock,
  Lightbulb,
  Heart,
  Scale,
  Filter,
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
} from '@/lib/compliance-api'
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts'
import { TRUSTWORTHY_AI_REQUIREMENT_LABELS, type TrustworthyAIRequirement } from '@/types/compliance'

// Framework labels
const FRAMEWORK_LABELS: Record<string, string> = {
  eu_ai_act: 'EU AI Act',
  iso_27001: 'ISO 27001',
  gdpr: 'GDPR',
  nis2: 'NIS2',
  soc2: 'SOC 2',
  iso_27701: 'ISO 27701',
}

// Trustworthy AI requirement icons
const REQUIREMENT_ICONS: Record<TrustworthyAIRequirement, React.ElementType> = {
  human_agency_oversight: Users,
  technical_robustness_safety: Shield,
  privacy_data_governance: Lock,
  transparency: Eye,
  diversity_fairness_nondiscrimination: Scale,
  societal_environmental_wellbeing: Heart,
  accountability: Target,
}

// Colors for charts
const STATUS_COLORS = {
  compliant: '#22c55e',
  non_compliant: '#ef4444',
  partial: '#eab308',
  not_applicable: '#6b7280',
  not_assessed: '#3b82f6',
}

const SEVERITY_COLORS = {
  critical: '#ef4444',
  major: '#f97316',
  minor: '#eab308',
  observation: '#3b82f6',
}

export default function AssessmentResultsPage() {
  const params = useParams()
  const router = useRouter()
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  const assessmentId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [findings, setFindings] = useState<AssessmentFinding[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedRequirement, setSelectedRequirement] = useState<TrustworthyAIRequirement | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const fetchData = useCallback(async () => {
    try {
      const [assessmentRes, findingsRes] = await Promise.all([
        complianceApi.getAssessment(assessmentId),
        complianceApi.getAssessmentFindings(assessmentId, { limit: 500 }),
      ])

      if (assessmentRes.success && assessmentRes.data) {
        setAssessment(assessmentRes.data)
      }
      if (findingsRes.success && findingsRes.data) {
        setFindings(findingsRes.data.data || [])
      }
      setError(null)
    } catch (err) {
      console.error('Failed to fetch assessment results:', err)
      setError('Failed to load assessment results')
    } finally {
      setIsLoading(false)
    }
  }, [assessmentId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Calculate statistics
  const stats = {
    total: findings.length,
    compliant: findings.filter((f) => f.status === 'compliant').length,
    nonCompliant: findings.filter((f) => f.status === 'non_compliant').length,
    partial: findings.filter((f) => f.status === 'partial').length,
    notApplicable: findings.filter((f) => f.status === 'not_applicable').length,
    notAssessed: findings.filter((f) => f.status === 'not_assessed').length,
    critical: findings.filter((f) => f.severity === 'critical').length,
    major: findings.filter((f) => f.severity === 'major').length,
    minor: findings.filter((f) => f.severity === 'minor').length,
    observation: findings.filter((f) => f.severity === 'observation').length,
  }

  // Calculate compliance rate
  const assessedFindings = findings.filter((f) => f.status !== 'not_assessed' && f.status !== 'not_applicable')
  const complianceRate =
    assessedFindings.length > 0
      ? Math.round((stats.compliant / assessedFindings.length) * 100)
      : 0

  // Group findings by requirement (mock - in reality would need backend mapping)
  const requirementScores = Object.keys(TRUSTWORTHY_AI_REQUIREMENT_LABELS).map((req) => {
    // Mock scoring based on requirement distribution
    const reqFindings = findings.filter((f, i) => i % 7 === Object.keys(TRUSTWORTHY_AI_REQUIREMENT_LABELS).indexOf(req))
    const compliant = reqFindings.filter((f) => f.status === 'compliant').length
    const total = reqFindings.filter((f) => f.status !== 'not_applicable' && f.status !== 'not_assessed').length
    const score = total > 0 ? Math.round((compliant / total) * 100) : 0

    return {
      requirement: req as TrustworthyAIRequirement,
      label: TRUSTWORTHY_AI_REQUIREMENT_LABELS[req as TrustworthyAIRequirement],
      score,
      fullMark: 100,
      findings: reqFindings.length,
    }
  })

  // Status distribution chart data
  const statusChartData = [
    { name: 'Compliant', value: stats.compliant, color: STATUS_COLORS.compliant },
    { name: 'Non-Compliant', value: stats.nonCompliant, color: STATUS_COLORS.non_compliant },
    { name: 'Partial', value: stats.partial, color: STATUS_COLORS.partial },
    { name: 'Not Applicable', value: stats.notApplicable, color: STATUS_COLORS.not_applicable },
  ].filter((d) => d.value > 0)

  // Severity distribution chart data
  const severityChartData = [
    { name: 'Critical', value: stats.critical, fill: SEVERITY_COLORS.critical },
    { name: 'Major', value: stats.major, fill: SEVERITY_COLORS.major },
    { name: 'Minor', value: stats.minor, fill: SEVERITY_COLORS.minor },
    { name: 'Observation', value: stats.observation, fill: SEVERITY_COLORS.observation },
  ].filter((d) => d.value > 0)

  // Filter findings
  const filteredFindings = findings.filter((f) => {
    if (statusFilter && f.status !== statusFilter) return false
    return true
  })

  // Group non-compliant findings by severity
  const nonCompliantByCategory = findings
    .filter((f) => f.status === 'non_compliant' || f.status === 'partial')
    .sort((a, b) => {
      const severityOrder = { critical: 0, major: 1, minor: 2, observation: 3 }
      return (severityOrder[a.severity as keyof typeof severityOrder] ?? 4) -
        (severityOrder[b.severity as keyof typeof severityOrder] ?? 4)
    })

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={cn('h-8 w-8 animate-spin', tc.accentCyan)} />
          <p className={tc.textMuted}>Loading assessment results...</p>
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
            Results Not Available
          </h2>
          <p className={cn('mb-4', tc.textMuted)}>
            {error || 'The assessment results could not be loaded.'}
          </p>
          <Link
            href={`/compliance/assessments/${assessmentId}`}
            className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-lg', tc.buttonPrimary)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assessment
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Assessment Results"
        description={`${assessment.targetSystemName} - ${FRAMEWORK_LABELS[assessment.frameworkId] || assessment.frameworkId}`}
        icon={<BarChart3 className={cn('h-6 w-6', tc.accentCyan)} />}
        actions={
          <div className="flex items-center gap-3">
            <Link
              href={`/compliance/assessments/${assessmentId}`}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                tc.buttonSecondary
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <button
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                tc.buttonPrimary
              )}
            >
              <Download className="h-4 w-4" />
              Export Report
            </button>
          </div>
        }
      />

      {/* Score Overview */}
      <div className={cn('rounded-xl border p-6', tc.card)}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'h-20 w-20 rounded-full flex items-center justify-center border-4',
                assessment.overallScore !== null && assessment.overallScore >= 70
                  ? 'border-green-500 bg-green-500/20'
                  : assessment.overallScore !== null && assessment.overallScore >= 50
                  ? 'border-yellow-500 bg-yellow-500/20'
                  : 'border-red-500 bg-red-500/20'
              )}
            >
              <span
                className={cn(
                  'text-2xl font-bold',
                  assessment.overallScore !== null && assessment.overallScore >= 70
                    ? 'text-green-400'
                    : assessment.overallScore !== null && assessment.overallScore >= 50
                    ? 'text-yellow-400'
                    : 'text-red-400'
                )}
              >
                {assessment.overallScore ?? '-'}%
              </span>
            </div>
            <div>
              <h2 className={cn('text-2xl font-bold font-urbanist', tc.textPrimary)}>
                Overall Compliance Score
              </h2>
              <p className={cn('text-sm', tc.textMuted)}>
                {stats.compliant} of {assessedFindings.length} controls compliant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className={cn('text-3xl font-bold text-green-400')}>{stats.compliant}</p>
              <p className={cn('text-sm', tc.textMuted)}>Compliant</p>
            </div>
            <div className="text-center">
              <p className={cn('text-3xl font-bold text-yellow-400')}>{stats.partial}</p>
              <p className={cn('text-sm', tc.textMuted)}>Partial</p>
            </div>
            <div className="text-center">
              <p className={cn('text-3xl font-bold text-red-400')}>{stats.nonCompliant}</p>
              <p className={cn('text-sm', tc.textMuted)}>Non-Compliant</p>
            </div>
            <div className="text-center">
              <p className={cn('text-3xl font-bold', tc.textMuted)}>{stats.notApplicable}</p>
              <p className={cn('text-sm', tc.textMuted)}>N/A</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <StatGrid columns={4}>
        <StatCard
          title="Critical Issues"
          value={stats.critical}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant={stats.critical > 0 ? 'danger' : 'success'}
          subtitle="Require immediate action"
        />
        <StatCard
          title="Major Issues"
          value={stats.major}
          icon={<XCircle className="h-5 w-5" />}
          variant={stats.major > 0 ? 'warning' : 'success'}
        />
        <StatCard
          title="Minor Issues"
          value={stats.minor}
          icon={<Lightbulb className="h-5 w-5" />}
          variant="cyan"
        />
        <StatCard
          title="Observations"
          value={stats.observation}
          icon={<Eye className="h-5 w-5" />}
          variant="default"
        />
      </StatGrid>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trustworthy AI Radar */}
        <ChartCard
          title="Trustworthy AI Requirements"
          subtitle="Compliance score by requirement area"
        >
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={requirementScores}>
              <PolarGrid stroke={isDark ? '#333333' : '#e5e7eb'} />
              <PolarAngleAxis
                dataKey="label"
                tick={{ fill: isDark ? '#a3a3a3' : '#6b7280', fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: isDark ? '#737373' : '#9ca3af', fontSize: 10 }}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#4faeca"
                fill="#4faeca"
                fillOpacity={0.3}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                  border: `1px solid ${isDark ? '#333333' : '#e5e7eb'}`,
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value}%`, 'Compliance Score']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Status Distribution */}
        <ChartCard
          title="Status Distribution"
          subtitle="Findings by compliance status"
        >
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {statusChartData.map((entry, index) => (
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
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Requirement Cards */}
      <div className={cn('rounded-xl border', tc.card)}>
        <div className={cn('px-6 py-4 border-b', tc.border)}>
          <h3 className={cn('text-lg font-semibold font-urbanist', tc.textPrimary)}>
            Trustworthy AI Requirements Breakdown
          </h3>
          <p className={cn('text-sm', tc.textMuted)}>
            Click a requirement to view related findings
          </p>
        </div>
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {requirementScores.map((req) => {
              const Icon = REQUIREMENT_ICONS[req.requirement]
              const isSelected = selectedRequirement === req.requirement

              return (
                <button
                  key={req.requirement}
                  onClick={() =>
                    setSelectedRequirement(isSelected ? null : req.requirement)
                  }
                  className={cn(
                    'p-4 rounded-xl border text-center transition-all',
                    tc.border,
                    isSelected
                      ? 'ring-2 ring-coinest-accent-cyan'
                      : tc.cardHover
                  )}
                >
                  <div
                    className={cn(
                      'h-10 w-10 mx-auto rounded-lg flex items-center justify-center mb-2',
                      req.score >= 70
                        ? 'bg-green-500/20'
                        : req.score >= 50
                        ? 'bg-yellow-500/20'
                        : 'bg-red-500/20'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        req.score >= 70
                          ? 'text-green-400'
                          : req.score >= 50
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      )}
                    />
                  </div>
                  <p className={cn('text-2xl font-bold', tc.textPrimary)}>{req.score}%</p>
                  <p className={cn('text-xs truncate', tc.textMuted)}>{req.label}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Non-Compliant Findings */}
      <div className={cn('rounded-xl border', tc.card)}>
        <div className={cn('px-6 py-4 border-b flex items-center justify-between', tc.border)}>
          <div>
            <h3 className={cn('text-lg font-semibold font-urbanist', tc.textPrimary)}>
              Issues Requiring Attention
            </h3>
            <p className={cn('text-sm', tc.textMuted)}>
              {nonCompliantByCategory.length} finding{nonCompliantByCategory.length !== 1 ? 's' : ''} requiring action
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className={cn('h-4 w-4', tc.textMuted)} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={cn('px-3 py-1.5 rounded-lg border text-sm', tc.input)}
            >
              <option value="">All Issues</option>
              <option value="non_compliant">Non-Compliant Only</option>
              <option value="partial">Partial Only</option>
            </select>
          </div>
        </div>
        <div className="divide-y divide-inherit">
          {nonCompliantByCategory.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-400" />
              <p className={cn('text-lg font-medium', tc.textPrimary)}>
                No issues found!
              </p>
              <p className={tc.textMuted}>
                All assessed controls are compliant.
              </p>
            </div>
          ) : (
            nonCompliantByCategory
              .filter((f) => !statusFilter || f.status === statusFilter)
              .slice(0, 10)
              .map((finding) => (
                <div
                  key={finding.id}
                  className={cn('p-4 flex items-start gap-4', tc.tableRow)}
                >
                  <div
                    className={cn(
                      'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                      finding.severity === 'critical' && 'bg-red-500/20',
                      finding.severity === 'major' && 'bg-orange-500/20',
                      finding.severity === 'minor' && 'bg-yellow-500/20',
                      finding.severity === 'observation' && 'bg-blue-500/20'
                    )}
                  >
                    {finding.status === 'non_compliant' ? (
                      <XCircle
                        className={cn(
                          'h-4 w-4',
                          finding.severity === 'critical'
                            ? 'text-red-400'
                            : finding.severity === 'major'
                            ? 'text-orange-400'
                            : finding.severity === 'minor'
                            ? 'text-yellow-400'
                            : 'text-blue-400'
                        )}
                      />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('font-medium', tc.textPrimary)}>
                        {finding.controlNumber}
                      </span>
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
                    </div>
                    <p className={cn('text-sm mb-2', tc.textPrimary)}>
                      {finding.controlTitle}
                    </p>
                    {finding.aiReasoning && (
                      <p className={cn('text-sm', tc.textMuted)}>
                        {finding.aiReasoning}
                      </p>
                    )}
                    {finding.recommendation && (
                      <div className={cn('mt-2 p-2 rounded-lg', tc.bgTertiary)}>
                        <p className={cn('text-xs font-medium mb-1', tc.accentCyan)}>
                          Recommendation
                        </p>
                        <p className={cn('text-sm', tc.textMuted)}>
                          {finding.recommendation}
                        </p>
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/compliance/assessments/${assessmentId}/findings/${finding.id}`}
                    className={cn('p-2 rounded-lg shrink-0', tc.buttonGhost)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              ))
          )}
        </div>
        {nonCompliantByCategory.length > 10 && (
          <div className={cn('px-6 py-4 border-t text-center', tc.border)}>
            <Link
              href={`/compliance/assessments/${assessmentId}/findings?status=non_compliant`}
              className={cn('text-sm font-medium', tc.accentCyan)}
            >
              View all {nonCompliantByCategory.length} issues
            </Link>
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className={cn('rounded-xl border', tc.card)}>
        <div className={cn('px-6 py-4 border-b', tc.border)}>
          <h3 className={cn('text-lg font-semibold font-urbanist', tc.textPrimary)}>
            Export Options
          </h3>
        </div>
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <button
              className={cn(
                'flex items-center gap-3 p-4 rounded-lg border transition-colors',
                tc.border,
                tc.cardHover
              )}
            >
              <FileText className={cn('h-6 w-6', tc.accentCyan)} />
              <div className="text-left">
                <p className={cn('font-medium', tc.textPrimary)}>Executive Summary</p>
                <p className={cn('text-sm', tc.textMuted)}>PDF format</p>
              </div>
            </button>
            <button
              className={cn(
                'flex items-center gap-3 p-4 rounded-lg border transition-colors',
                tc.border,
                tc.cardHover
              )}
            >
              <BarChart3 className={cn('h-6 w-6', tc.accentCyan)} />
              <div className="text-left">
                <p className={cn('font-medium', tc.textPrimary)}>Full Audit Report</p>
                <p className={cn('text-sm', tc.textMuted)}>PDF format</p>
              </div>
            </button>
            <button
              className={cn(
                'flex items-center gap-3 p-4 rounded-lg border transition-colors',
                tc.border,
                tc.cardHover
              )}
            >
              <Download className={cn('h-6 w-6', tc.accentCyan)} />
              <div className="text-left">
                <p className={cn('font-medium', tc.textPrimary)}>Raw Data</p>
                <p className={cn('text-sm', tc.textMuted)}>JSON/CSV format</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}