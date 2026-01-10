/**
 * Compliance Dashboard Page
 *
 * Main compliance overview with KPIs, framework radar, heatmap,
 * trustworthiness gauge, and risk distribution.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  BarChart3,
  ExternalLink,
  FileText,
  RefreshCw,
  ChevronRight,
  Loader2,
} from 'lucide-react'
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
} from 'recharts'
import { PageHeader } from '@/components/compliance'
import { StatCard, StatGrid } from '@/components/coinest'
import { ChartCard } from '@/components/coinest'
import { DataTable } from '@/components/coinest'
import { useTheme } from '@/stores/theme-store'
import { useThemeClasses } from '@/hooks/useThemeClasses'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { complianceApi, DashboardData, ComplianceAlert } from '@/lib/compliance-api'

// Default/fallback data for the dashboard
const defaultDashboardData: DashboardData = {
  kpis: {
    overallScore: 0,
    scoreChange: 0,
    totalControls: 688,
    implementedControls: 0,
    criticalGaps: 0,
    upcomingDeadlines: 0,
  },
  frameworkScores: [
    { frameworkId: 'iso_27001', frameworkName: 'ISO 27001', score: 0, controlCount: 93, implementedCount: 0, criticalGaps: 0 },
    { frameworkId: 'gdpr', frameworkName: 'GDPR', score: 0, controlCount: 220, implementedCount: 0, criticalGaps: 0 },
    { frameworkId: 'eu_ai_act', frameworkName: 'EU AI Act', score: 0, controlCount: 149, implementedCount: 0, criticalGaps: 0 },
    { frameworkId: 'nis2', frameworkName: 'NIS2', score: 0, controlCount: 112, implementedCount: 0, criticalGaps: 0 },
    { frameworkId: 'soc2', frameworkName: 'SOC 2', score: 0, controlCount: 64, implementedCount: 0, criticalGaps: 0 },
    { frameworkId: 'iso_27701', frameworkName: 'ISO 27701', score: 0, controlCount: 50, implementedCount: 0, criticalGaps: 0 },
  ],
  requirementScores: [
    { requirement: 'human_agency_oversight', label: 'Human Agency', score: 0, controlCount: 45, implementedCount: 0 },
    { requirement: 'technical_robustness_safety', label: 'Robustness', score: 0, controlCount: 62, implementedCount: 0 },
    { requirement: 'privacy_data_governance', label: 'Privacy', score: 0, controlCount: 85, implementedCount: 0 },
    { requirement: 'transparency', label: 'Transparency', score: 0, controlCount: 38, implementedCount: 0 },
    { requirement: 'diversity_fairness_nondiscrimination', label: 'Fairness', score: 0, controlCount: 28, implementedCount: 0 },
    { requirement: 'societal_environmental_wellbeing', label: 'Society', score: 0, controlCount: 22, implementedCount: 0 },
    { requirement: 'accountability', label: 'Accountability', score: 0, controlCount: 52, implementedCount: 0 },
  ],
  recentAlerts: [],
  riskDistribution: [
    { level: 'critical', count: 0, percentage: 0 },
    { level: 'high', count: 0, percentage: 0 },
    { level: 'medium', count: 0, percentage: 0 },
    { level: 'low', count: 0, percentage: 0 },
  ],
}

const RISK_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
}

const FRAMEWORK_COLORS = [
  '#4faeca',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f59e0b',
]

export default function ComplianceDashboardPage() {
  const { isDark } = useTheme()
  const tc = useThemeClasses()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData>(defaultDashboardData)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await complianceApi.getDashboard()
      if (response.success && response.data) {
        setDashboardData(response.data)
        setError(null)
      }
    } catch (err) {
      console.error('Failed to fetch dashboard:', err)
      setError('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchDashboard()
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await complianceApi.acknowledgeAlert(alertId)
      // Refresh dashboard to get updated alerts
      fetchDashboard()
    } catch (err) {
      console.error('Failed to acknowledge alert:', err)
    }
  }

  const { kpis, frameworkScores, requirementScores, recentAlerts, riskDistribution } = dashboardData

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={cn('h-8 w-8 animate-spin', tc.accentCyan)} />
          <p className={tc.textMuted}>Loading compliance dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Compliance Dashboard"
        description="688 controls across 6 frameworks with Z-Inspection integration"
        icon={<ShieldCheck className={cn('h-6 w-6', tc.accentCyan)} />}
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
              href="/compliance/assessment"
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                tc.buttonPrimary
              )}
            >
              <FileText className="h-4 w-4" />
              New Assessment
            </Link>
          </div>
        }
      />

      {/* KPI Cards */}
      <StatGrid columns={4}>
        <StatCard
          title="Overall Score"
          value={`${kpis.overallScore}%`}
          icon={<ShieldCheck className="h-5 w-5" />}
          variant="cyan"
          change={{
            value: kpis.scoreChange,
            isPositive: kpis.scoreChange >= 0,
          }}
        />
        <StatCard
          title="Controls Implemented"
          value={`${kpis.implementedControls} / ${kpis.totalControls}`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="success"
          subtitle={`${Math.round((kpis.implementedControls / kpis.totalControls) * 100)}% complete`}
        />
        <StatCard
          title="Critical Gaps"
          value={kpis.criticalGaps}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="danger"
          subtitle="Require immediate attention"
        />
        <StatCard
          title="Upcoming Deadlines"
          value={kpis.upcomingDeadlines}
          icon={<Clock className="h-5 w-5" />}
          variant="warning"
          subtitle="Within next 90 days"
        />
      </StatGrid>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trustworthiness Radar */}
        <ChartCard
          title="Trustworthy AI Requirements"
          subtitle="7 EU Requirements Compliance Score"
        >
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={requirementScores.map(r => ({ ...r, fullMark: 100 }))}>
              <PolarGrid stroke={isDark ? '#333333' : '#e5e7eb'} />
              <PolarAngleAxis
                dataKey="label"
                tick={{ fill: isDark ? '#a3a3a3' : '#6b7280', fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: isDark ? '#737373' : '#9ca3af', fontSize: 10 }}
              />
              <Radar
                name="Current Score"
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
                labelStyle={{ color: isDark ? '#ffffff' : '#111827' }}
                formatter={(value: number) => [`${value}%`, 'Score']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Framework Scores */}
        <ChartCard
          title="Framework Compliance"
          subtitle="Score by regulatory framework"
        >
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={frameworkScores} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? '#333333' : '#e5e7eb'}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: isDark ? '#a3a3a3' : '#6b7280', fontSize: 12 }}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="frameworkName"
                tick={{ fill: isDark ? '#a3a3a3' : '#6b7280', fontSize: 12 }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                  border: `1px solid ${isDark ? '#333333' : '#e5e7eb'}`,
                  borderRadius: '8px',
                }}
                labelStyle={{ color: isDark ? '#ffffff' : '#111827' }}
                formatter={(value: number) => [`${value}%`, 'Compliance Score']}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {frameworkScores.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={FRAMEWORK_COLORS[index % FRAMEWORK_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Risk Distribution */}
        <ChartCard
          title="Risk Distribution"
          subtitle="Gaps by risk level"
        >
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={riskDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="count"
                label={({ level, percentage }) => `${level} ${percentage}%`}
                labelLine={false}
              >
                {riskDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={RISK_COLORS[entry.level.toLowerCase() as keyof typeof RISK_COLORS]}
                  />
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

        {/* Recent Alerts */}
        <div className={cn('lg:col-span-2 rounded-xl border', tc.card)}>
          <div className={cn('px-6 py-4 border-b flex items-center justify-between', tc.border)}>
            <div>
              <h3 className={cn('text-lg font-semibold font-urbanist', tc.textPrimary)}>Recent Alerts</h3>
              <p className={cn('text-sm', tc.textMuted)}>Compliance notifications requiring attention</p>
            </div>
            <Link
              href="/compliance/alerts"
              className={cn('text-sm font-medium flex items-center gap-1', tc.accentCyan)}
            >
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3',
                  tc.border,
                  alert.acknowledged && 'opacity-60'
                )}
              >
                {alert.severity === 'critical' && (
                  <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                )}
                {alert.severity === 'high' && (
                  <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
                )}
                {alert.severity === 'medium' && (
                  <Clock className="h-5 w-5 text-yellow-500 shrink-0" />
                )}
                <div className="flex-1 space-y-1">
                  <p className={cn('text-sm font-medium', tc.textPrimary)}>{alert.message}</p>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'badge',
                      alert.severity === 'critical' ? tc.badgeCritical :
                      alert.severity === 'high' ? tc.badgeHigh :
                      tc.badgeMedium
                    )}>
                      {alert.severity}
                    </span>
                    <span className={cn('badge', tc.badgeNeutral)}>{alert.type}</span>
                    <span className={cn('text-xs', tc.textMuted)}>
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {!alert.acknowledged && (
                  <button
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                    className={cn('text-sm font-medium px-3 py-1 rounded-lg', tc.buttonGhost)}
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={cn('rounded-xl border', tc.card)}>
        <div className={cn('px-6 py-4 border-b', tc.border)}>
          <h3 className={cn('text-lg font-semibold font-urbanist', tc.textPrimary)}>Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Link
              href="/compliance/controls"
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors',
                tc.border,
                tc.sidebarHover
              )}
            >
              <BarChart3 className={cn('h-6 w-6', tc.accentCyan)} />
              <span className={cn('font-medium', tc.textPrimary)}>Control Library</span>
              <span className={cn('text-xs', tc.textMuted)}>688 controls</span>
            </Link>
            <Link
              href="/compliance/cross-framework"
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors',
                tc.border,
                tc.sidebarHover
              )}
            >
              <ExternalLink className={cn('h-6 w-6', tc.accentCyan)} />
              <span className={cn('font-medium', tc.textPrimary)}>Cross-Framework Analysis</span>
              <span className={cn('text-xs', tc.textMuted)}>Compare frameworks</span>
            </Link>
            <Link
              href="/compliance/trustworthiness"
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors',
                tc.border,
                tc.sidebarHover
              )}
            >
              <ShieldCheck className={cn('h-6 w-6', tc.accentCyan)} />
              <span className={cn('font-medium', tc.textPrimary)}>Trustworthiness</span>
              <span className={cn('text-xs', tc.textMuted)}>Qualitative assessment</span>
            </Link>
            <Link
              href="/compliance/z-inspection"
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors',
                tc.border,
                tc.sidebarHover
              )}
            >
              <FileText className={cn('h-6 w-6', tc.accentCyan)} />
              <span className={cn('font-medium', tc.textPrimary)}>Z-Inspection</span>
              <span className={cn('text-xs', tc.textMuted)}>Import reports</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
