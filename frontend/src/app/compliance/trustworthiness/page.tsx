/**
 * Trustworthiness Assessment Page
 *
 * EU Trustworthy AI requirements evaluation based on 7 requirements.
 * Shows radar chart, requirement breakdown, and ethical tensions.
 */

'use client'

import { useState } from 'react'
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  Users,
  FileText,
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
} from 'recharts'
import { PageHeader } from '@/components/compliance'
import { StatCard, StatGrid } from '@/components/coinest'
import { ChartCard } from '@/components/coinest'
import { useTheme } from '@/stores/theme-store'
import { useThemeClasses } from '@/hooks/useThemeClasses'
import { cn, snakeToTitle } from '@/lib/utils'
import Link from 'next/link'

// Mock assessment data
const assessmentData = {
  id: 'assess-001',
  aiSystemId: 'ai-sys-001',
  aiSystemName: 'Customer Service Chatbot',
  overallRating: 'conditionally_trustworthy' as const,
  overallScore: 72,
  requirementAssessments: [
    { requirement: 'human_agency_oversight', label: 'Human Agency & Oversight', rating: 'good', score: 75, findings: 3, tensions: 1 },
    { requirement: 'technical_robustness_safety', label: 'Technical Robustness', rating: 'good', score: 82, findings: 2, tensions: 0 },
    { requirement: 'privacy_data_governance', label: 'Privacy & Data Governance', rating: 'good', score: 78, findings: 4, tensions: 1 },
    { requirement: 'transparency', label: 'Transparency', rating: 'moderate', score: 68, findings: 5, tensions: 2 },
    { requirement: 'diversity_fairness_nondiscrimination', label: 'Fairness', rating: 'needs_improvement', score: 55, findings: 6, tensions: 3 },
    { requirement: 'societal_environmental_wellbeing', label: 'Societal Wellbeing', rating: 'moderate', score: 62, findings: 4, tensions: 1 },
    { requirement: 'accountability', label: 'Accountability', rating: 'excellent', score: 88, findings: 1, tensions: 0 },
  ],
  tensionCount: 8,
  stakeholderCount: 12,
  scenarioCount: 15,
  createdAt: new Date().toISOString(),
  assessedBy: 'AI Compliance Team',
}

const recentTensions = [
  {
    id: 't1',
    valueA: 'Accuracy',
    valueB: 'Privacy',
    severity: 'significant' as const,
    status: 'under_review' as const,
    requirement: 'privacy_data_governance',
  },
  {
    id: 't2',
    valueA: 'Efficiency',
    valueB: 'Explainability',
    severity: 'moderate' as const,
    status: 'identified' as const,
    requirement: 'transparency',
  },
  {
    id: 't3',
    valueA: 'Performance',
    valueB: 'Fairness',
    severity: 'critical' as const,
    status: 'identified' as const,
    requirement: 'diversity_fairness_nondiscrimination',
  },
]

const RATING_COLORS = {
  trustworthy: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Trustworthy' },
  conditionally_trustworthy: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Conditionally Trustworthy' },
  not_trustworthy: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Not Trustworthy' },
  inconclusive: { bg: 'bg-neutral-500/20', text: 'text-neutral-400', label: 'Inconclusive' },
}

const REQUIREMENT_COLORS: Record<string, string> = {
  human_agency_oversight: '#3b82f6',
  technical_robustness_safety: '#22c55e',
  privacy_data_governance: '#8b5cf6',
  transparency: '#f59e0b',
  diversity_fairness_nondiscrimination: '#ec4899',
  societal_environmental_wellbeing: '#14b8a6',
  accountability: '#6366f1',
}

function CircularProgress({ value, size = 120 }: { value: number; size?: number }) {
  const { isDark } = useTheme()
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (value / 100) * circumference

  const getColor = (v: number) => {
    if (v >= 80) return '#22c55e'
    if (v >= 60) return '#eab308'
    return '#ef4444'
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? '#333333' : '#e5e7eb'}
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
        <span className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-neutral-900')}>
          {value}%
        </span>
      </div>
    </div>
  )
}

function RequirementScoreCard({
  requirement,
}: {
  requirement: typeof assessmentData.requirementAssessments[0]
}) {
  const tc = useThemeClasses()
  const color = REQUIREMENT_COLORS[requirement.requirement] || '#6b7280'

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
        <span>{requirement.findings} findings</span>
        <span>{requirement.tensions} tensions</span>
      </div>
    </div>
  )
}

function TensionCard({ tension }: { tension: typeof recentTensions[0] }) {
  const tc = useThemeClasses()

  return (
    <div className={cn('rounded-lg border p-4', tc.card)}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={cn('font-medium', tc.textPrimary)}>{tension.valueA}</span>
          <span className={tc.textMuted}>vs</span>
          <span className={cn('font-medium', tc.textPrimary)}>{tension.valueB}</span>
        </div>
        <span className={cn(
          'badge',
          tension.severity === 'critical' ? tc.badgeCritical :
          tension.severity === 'significant' ? tc.badgeHigh :
          tc.badgeMedium
        )}>
          {tension.severity}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn('badge', tc.badgeInfo)}>
          {snakeToTitle(tension.requirement).slice(0, 20)}...
        </span>
        <span className={cn('badge', tc.badgeNeutral)}>
          {tension.status.replace(/_/g, ' ')}
        </span>
      </div>
    </div>
  )
}

export default function TrustworthinessPage() {
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  const radarData = assessmentData.requirementAssessments.map((r) => ({
    ...r,
    fullMark: 100,
  }))

  const rating = RATING_COLORS[assessmentData.overallRating]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
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

      {/* Assessment Overview */}
      <div className={cn('rounded-xl border p-6', tc.card)}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={cn('text-2xl font-bold font-urbanist', tc.textPrimary)}>
              {assessmentData.aiSystemName}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <span className={cn('badge', rating.bg, rating.text)}>
                {rating.label}
              </span>
              <span className={cn('text-sm', tc.textMuted)}>
                Assessed by {assessmentData.assessedBy}
              </span>
            </div>
          </div>
          <CircularProgress value={assessmentData.overallScore} />
        </div>
      </div>

      {/* Stats */}
      <StatGrid columns={4}>
        <StatCard
          title="Overall Score"
          value={`${assessmentData.overallScore}%`}
          icon={<Brain className="h-5 w-5" />}
          variant="cyan"
        />
        <StatCard
          title="Ethical Tensions"
          value={assessmentData.tensionCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="warning"
        />
        <StatCard
          title="Stakeholders"
          value={assessmentData.stakeholderCount}
          icon={<Users className="h-5 w-5" />}
          variant="default"
        />
        <StatCard
          title="Scenarios"
          value={assessmentData.scenarioCount}
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
                labelStyle={{ color: isDark ? '#ffffff' : '#111827' }}
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
            {assessmentData.requirementAssessments.map((req) => (
              <RequirementScoreCard key={req.requirement} requirement={req} />
            ))}
          </div>
        </div>
      </div>

      {/* Ethical Tensions */}
      <div className={cn('rounded-xl border', tc.card)}>
        <div className={cn('px-6 py-4 border-b flex items-center justify-between', tc.border)}>
          <div>
            <h3 className={cn('text-lg font-semibold font-urbanist', tc.textPrimary)}>
              Ethical Tensions
            </h3>
            <p className={cn('text-sm mt-1', tc.textMuted)}>
              Value conflicts and trade-offs identified
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentTensions.map((tension) => (
              <TensionCard key={tension.id} tension={tension} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
