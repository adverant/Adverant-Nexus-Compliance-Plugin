/**
 * Trustworthiness Assessment Page
 *
 * EU Trustworthy AI requirements evaluation based on 7 requirements.
 * Shows radar chart, requirement breakdown, and ethical tensions.
 */

'use client'

import {
  Brain,
  AlertTriangle,
  Users,
  FileText,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from 'recharts'
import { PageHeader } from '@/components/compliance'
import { StatCard, StatGrid } from '@/components/coinest'
import { ChartCard } from '@/components/coinest'
import { useThemeClasses, useThemeColors, THEME_COLORS } from '@/hooks/useThemeClasses'
import { cn, snakeToTitle } from '@/lib/utils'
import Link from 'next/link'
import { useApiQuery } from '@/hooks/useApiQuery'
import {
  complianceApi,
  type TrustworthinessDashboardData,
} from '@/lib/compliance-api'
import type { TrustworthyAIRequirement } from '@/types/compliance'

// Default tenant and AI system IDs (in production these would come from context/auth)
const DEFAULT_TENANT_ID = 'default'
const DEFAULT_AI_SYSTEM_ID = 'default'

const RATING_COLORS = {
  trustworthy: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Trustworthy' },
  conditionally_trustworthy: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Conditionally Trustworthy' },
  not_trustworthy: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Not Trustworthy' },
  inconclusive: { bg: 'bg-neutral-500/20', text: 'text-neutral-400', label: 'Inconclusive' },
}

// ============================================================================
// Skeleton Components
// ============================================================================

function TrustworthinessPageSkeleton() {
  const tc = useThemeClasses()

  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className={cn('h-8 w-64 rounded', tc.bgTertiary)} />
          <div className={cn('h-4 w-48 rounded', tc.bgTertiary)} />
        </div>
        <div className={cn('h-10 w-36 rounded-lg', tc.bgTertiary)} />
      </div>

      {/* Overview Skeleton */}
      <div className={cn('rounded-xl border p-6', tc.card)}>
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className={cn('h-8 w-56 rounded', tc.bgTertiary)} />
            <div className="flex gap-3">
              <div className={cn('h-6 w-40 rounded-full', tc.bgTertiary)} />
              <div className={cn('h-6 w-32 rounded', tc.bgTertiary)} />
            </div>
          </div>
          <div className={cn('h-28 w-28 rounded-full', tc.bgTertiary)} />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={cn('rounded-xl border p-4', tc.card)}>
            <div className={cn('h-4 w-24 rounded mb-2', tc.bgTertiary)} />
            <div className={cn('h-8 w-16 rounded', tc.bgTertiary)} />
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={cn('rounded-xl border p-6 h-96', tc.card)}>
          <div className={cn('h-6 w-40 rounded mb-4', tc.bgTertiary)} />
          <div className={cn('h-72 rounded', tc.bgTertiary)} />
        </div>
        <div className={cn('rounded-xl border p-6 h-96', tc.card)}>
          <div className={cn('h-6 w-48 rounded mb-4', tc.bgTertiary)} />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={cn('h-16 rounded-lg', tc.bgTertiary)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  const tc = useThemeClasses()

  return (
    <div className="p-6">
      <div className={cn('rounded-xl border p-8 text-center', tc.card)}>
        <AlertTriangle className={cn('h-12 w-12 mx-auto mb-4 text-yellow-500')} />
        <h3 className={cn('text-lg font-semibold mb-2', tc.textPrimary)}>
          Unable to Load Dashboard
        </h3>
        <p className={cn('mb-4', tc.textMuted)}>{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-lg', tc.buttonSecondary)}
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  const tc = useThemeClasses()

  return (
    <div className="p-6">
      <PageHeader
        title="Trustworthiness Assessment"
        description="EU Trustworthy AI requirements evaluation"
        icon={<Brain className={cn('h-6 w-6', tc.accentCyan)} />}
        actions={
          <button className={cn('flex items-center gap-2 px-4 py-2 rounded-lg', tc.buttonPrimary)}>
            <FileText className="h-4 w-4" />
            New Assessment
          </button>
        }
      />
      <div className={cn('rounded-xl border p-8 text-center mt-6', tc.card)}>
        <Brain className={cn('h-12 w-12 mx-auto mb-4', tc.textMuted)} />
        <h3 className={cn('text-lg font-semibold mb-2', tc.textPrimary)}>
          No Assessments Yet
        </h3>
        <p className={cn('mb-4 max-w-md mx-auto', tc.textMuted)}>
          Start your first trustworthiness assessment to evaluate your AI system
          against the EU Trustworthy AI requirements.
        </p>
        <button className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-lg', tc.buttonPrimary)}>
          <FileText className="h-4 w-4" />
          Create Assessment
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// Sub-Components
// ============================================================================

function CircularProgress({ value, size = 120 }: { value: number; size?: number }) {
  const themeColors = useThemeColors()
  const tc = useThemeClasses()
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (value / 100) * circumference

  const getColor = (v: number) => {
    if (v >= 80) return themeColors.status.success
    if (v >= 60) return themeColors.status.warning
    return themeColors.status.error
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={themeColors.grid.line}
          strokeWidth={6}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(value)}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('text-2xl font-bold', tc.textPrimary)}>
          {value}%
        </span>
      </div>
    </div>
  )
}

interface RequirementBreakdownItem {
  requirement: TrustworthyAIRequirement
  label: string
  score: number
  rating: string
  controlCount: number
  assessedCount: number
}

function RequirementScoreCard({
  requirement,
}: {
  requirement: RequirementBreakdownItem
}) {
  const tc = useThemeClasses()
  const { isDark } = useThemeColors()
  const colorDef = THEME_COLORS.requirement[requirement.requirement as keyof typeof THEME_COLORS.requirement]
  const color = colorDef ? (isDark ? colorDef.dark : colorDef.light) : (isDark ? '#6b7280' : '#4b5563')

  return (
    <div className={cn('rounded-lg border p-4', tc.card)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className={cn('text-sm font-medium', tc.textPrimary)}>
            {requirement.label}
          </span>
        </div>
        <span className={cn(
          'text-lg font-bold',
          requirement.score >= 80 ? 'text-green-500' :
          requirement.score >= 60 ? 'text-yellow-500' : 'text-red-500'
        )}>
          {requirement.score}%
        </span>
      </div>
      <div className={cn('h-2 rounded-full overflow-hidden', tc.bgTertiary)}>
        <div
          className="h-full transition-all"
          style={{
            width: `${requirement.score}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className={cn('flex items-center justify-between mt-2 text-xs', tc.textMuted)}>
        <span>{requirement.assessedCount}/{requirement.controlCount} controls</span>
        <span>{requirement.rating}</span>
      </div>
    </div>
  )
}

interface TensionSummaryCardProps {
  tension: {
    total: number
    unresolved: number
    bySeverity: Record<string, number>
  }
}

function TensionSummaryCard({ tension }: TensionSummaryCardProps) {
  const tc = useThemeClasses()

  return (
    <div className={cn('rounded-xl border', tc.card)}>
      <div className={cn('px-6 py-4 border-b flex items-center justify-between', tc.border)}>
        <div>
          <h3 className={cn('text-lg font-semibold font-urbanist', tc.textPrimary)}>
            Ethical Tensions Summary
          </h3>
          <p className={cn('text-sm mt-1', tc.textMuted)}>
            Value conflicts and trade-offs
          </p>
        </div>
        <Link
          href="/compliance/tensions"
          className={cn('text-sm font-medium flex items-center gap-1', tc.accentCyan)}
        >
          View All <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className={cn('rounded-lg border p-4 text-center', tc.card)}>
            <div className={cn('text-2xl font-bold', tc.textPrimary)}>
              {tension.total}
            </div>
            <div className={cn('text-sm', tc.textMuted)}>Total Tensions</div>
          </div>
          <div className={cn('rounded-lg border p-4 text-center', tc.card)}>
            <div className="text-2xl font-bold text-yellow-500">
              {tension.unresolved}
            </div>
            <div className={cn('text-sm', tc.textMuted)}>Unresolved</div>
          </div>
          <div className={cn('rounded-lg border p-4', tc.card)}>
            <div className={cn('text-sm font-medium mb-2', tc.textPrimary)}>
              By Severity
            </div>
            <div className="space-y-1">
              {Object.entries(tension.bySeverity).map(([severity, count]) => (
                <div key={severity} className="flex items-center justify-between text-xs">
                  <span className={cn(
                    'badge',
                    severity === 'critical' ? tc.badgeCritical :
                    severity === 'significant' || severity === 'high' ? tc.badgeHigh :
                    tc.badgeMedium
                  )}>
                    {severity}
                  </span>
                  <span className={tc.textMuted}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function TrustworthinessPage() {
  const tc = useThemeClasses()
  const themeColors = useThemeColors()

  // Fetch trustworthiness dashboard data
  const {
    data: dashboard,
    isLoading,
    error,
    refetch,
  } = useApiQuery<TrustworthinessDashboardData>(
    () => complianceApi.getTrustworthinessDashboard({
      tenantId: DEFAULT_TENANT_ID,
      aiSystemId: DEFAULT_AI_SYSTEM_ID,
    }),
    {
      deps: [],
      retryCount: 2,
      retryDelay: 1000,
    }
  )

  // Loading state
  if (isLoading) {
    return <TrustworthinessPageSkeleton />
  }

  // Error state
  if (error) {
    return <ErrorState message={error} onRetry={refetch} />
  }

  // Empty state - no data available
  if (!dashboard) {
    return <EmptyState />
  }

  // Prepare radar chart data
  const radarData = dashboard.requirementBreakdown.map((r) => ({
    ...r,
    fullMark: 100,
  }))

  const rating = RATING_COLORS[dashboard.overallRating] || RATING_COLORS.inconclusive

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Trustworthiness Assessment"
        description="EU Trustworthy AI requirements evaluation"
        icon={<Brain className={cn('h-6 w-6', tc.accentCyan)} />}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className={cn('flex items-center gap-2 px-3 py-2 rounded-lg', tc.buttonSecondary)}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button className={cn('flex items-center gap-2 px-4 py-2 rounded-lg', tc.buttonPrimary)}>
              <FileText className="h-4 w-4" />
              New Assessment
            </button>
          </div>
        }
      />

      {/* Assessment Overview */}
      <div className={cn('rounded-xl border p-6', tc.card)}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={cn('text-2xl font-bold font-urbanist', tc.textPrimary)}>
              AI System Assessment
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <span className={cn('badge', rating.bg, rating.text)}>
                {rating.label}
              </span>
              <span className={cn('text-sm', tc.textMuted)}>
                {dashboard.coverageStats.assessedRequirements}/{dashboard.coverageStats.totalRequirements} requirements assessed
              </span>
            </div>
          </div>
          <CircularProgress value={dashboard.overallScore} />
        </div>
      </div>

      {/* Stats */}
      <StatGrid columns={4}>
        <StatCard
          title="Overall Score"
          value={`${dashboard.overallScore}%`}
          icon={<Brain className="h-5 w-5" />}
          variant="cyan"
        />
        <StatCard
          title="Ethical Tensions"
          value={dashboard.tensionSummary.total}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="warning"
        />
        <StatCard
          title="Coverage"
          value={`${dashboard.coverageStats.coveragePercentage}%`}
          icon={<Users className="h-5 w-5" />}
          variant="default"
        />
        <StatCard
          title="Recent Assessments"
          value={dashboard.recentAssessments.length}
          icon={<FileText className="h-5 w-5" />}
          variant="default"
        />
      </StatGrid>

      {/* Charts and Requirements */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Radar Chart */}
        <ChartCard
          title="Requirement Scores"
          subtitle="Performance across 7 EU requirements"
        >
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={themeColors.grid.line} />
              <PolarAngleAxis
                dataKey="label"
                tick={{ fill: themeColors.grid.text, fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: themeColors.grid.text, fontSize: 10 }}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke={themeColors.accent.cyan}
                fill={themeColors.accent.cyan}
                fillOpacity={0.3}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: themeColors.chartBg.secondary,
                  border: `1px solid ${themeColors.grid.line}`,
                  borderRadius: '8px',
                }}
                labelStyle={{ color: themeColors.isDark ? '#ffffff' : '#111827' }}
                formatter={(value: number) => [`${value}%`, 'Score']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Requirement Breakdown */}
        <div className={cn('rounded-xl border', tc.card)}>
          <div className={cn('px-6 py-4 border-b', tc.border)}>
            <h3 className={cn('text-lg font-semibold font-urbanist', tc.textPrimary)}>
              Requirement Breakdown
            </h3>
          </div>
          <div className="p-4 space-y-3 max-h-[380px] overflow-y-auto">
            {dashboard.requirementBreakdown.map((req) => (
              <RequirementScoreCard key={req.requirement} requirement={req} />
            ))}
          </div>
        </div>
      </div>

      {/* Ethical Tensions Summary */}
      <TensionSummaryCard tension={dashboard.tensionSummary} />

      {/* Recent Assessments */}
      {dashboard.recentAssessments.length > 0 && (
        <div className={cn('rounded-xl border', tc.card)}>
          <div className={cn('px-6 py-4 border-b', tc.border)}>
            <h3 className={cn('text-lg font-semibold font-urbanist', tc.textPrimary)}>
              Recent Assessments
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {dashboard.recentAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className={cn('flex items-center justify-between p-3 rounded-lg', tc.bgTertiary)}
                >
                  <div>
                    <span className={cn('font-medium', tc.textPrimary)}>
                      {assessment.title}
                    </span>
                    <span className={cn('text-sm ml-2', tc.textMuted)}>
                      {new Date(assessment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'badge',
                      assessment.overallRating === 'trustworthy' ? tc.badgeSuccess :
                      assessment.overallRating === 'conditionally_trustworthy' ? tc.badgeWarning :
                      tc.badgeError
                    )}>
                      {snakeToTitle(assessment.overallRating)}
                    </span>
                    <span className={cn('badge', tc.badgeNeutral)}>
                      {assessment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
