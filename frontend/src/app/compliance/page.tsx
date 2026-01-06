/**
 * Compliance Dashboard Page
 *
 * Main compliance overview with KPIs, framework radar, heatmap,
 * trustworthiness gauge, and risk distribution.
 */

'use client'

import { useState } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  XCircle,
  BarChart3,
  ExternalLink,
  FileText,
  RefreshCw,
  ChevronRight,
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

// Mock data for the dashboard
const dashboardData = {
  kpis: {
    overallScore: 72,
    scoreChange: 5.2,
    totalControls: 688,
    implementedControls: 495,
    criticalGaps: 12,
    upcomingDeadlines: 3,
  },
  frameworkScores: [
    { frameworkId: 'iso_27001', frameworkName: 'ISO 27001', score: 85, controlCount: 93, implementedCount: 79 },
    { frameworkId: 'gdpr', frameworkName: 'GDPR', score: 78, controlCount: 220, implementedCount: 172 },
    { frameworkId: 'eu_ai_act', frameworkName: 'EU AI Act', score: 65, controlCount: 149, implementedCount: 97 },
    { frameworkId: 'nis2', frameworkName: 'NIS2', score: 71, controlCount: 112, implementedCount: 80 },
    { frameworkId: 'soc2', frameworkName: 'SOC 2', score: 82, controlCount: 64, implementedCount: 52 },
    { frameworkId: 'iso_27701', frameworkName: 'ISO 27701', score: 68, controlCount: 50, implementedCount: 34 },
  ],
  requirementScores: [
    { requirement: 'human_agency_oversight', label: 'Human Agency', score: 75, controlCount: 45 },
    { requirement: 'technical_robustness_safety', label: 'Robustness', score: 82, controlCount: 62 },
    { requirement: 'privacy_data_governance', label: 'Privacy', score: 78, controlCount: 85 },
    { requirement: 'transparency', label: 'Transparency', score: 68, controlCount: 38 },
    { requirement: 'diversity_fairness_nondiscrimination', label: 'Fairness', score: 55, controlCount: 28 },
    { requirement: 'societal_environmental_wellbeing', label: 'Society', score: 62, controlCount: 22 },
    { requirement: 'accountability', label: 'Accountability', score: 88, controlCount: 52 },
  ],
  recentAlerts: [
    { id: '1', type: 'gap', severity: 'critical' as const, message: 'EU AI Act Article 9 controls not implemented', createdAt: new Date().toISOString(), acknowledged: false },
    { id: '2', type: 'deadline', severity: 'high' as const, message: 'NIS2 compliance deadline in 30 days', createdAt: new Date().toISOString(), acknowledged: false },
    { id: '3', type: 'update', severity: 'medium' as const, message: 'New GDPR guidance published by EDPB', createdAt: new Date().toISOString(), acknowledged: true },
  ],
  riskDistribution: [
    { level: 'Critical', count: 12, percentage: 15 },
    { level: 'High', count: 28, percentage: 25 },
    { level: 'Medium', count: 45, percentage: 35 },
    { level: 'Low', count: 35, percentage: 25 },
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
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const { kpis, frameworkScores, requirementScores, recentAlerts, riskDistribution } = dashboardData

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
                  <button className={cn('text-sm font-medium px-3 py-1 rounded-lg', tc.buttonGhost)}>
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
