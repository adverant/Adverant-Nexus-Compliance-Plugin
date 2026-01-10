/**
 * Findings Review Page (Master-Detail)
 *
 * Displays all findings from an assessment with:
 * - Filterable list (left panel)
 * - Detailed view with tabs (right panel)
 * - Bulk actions
 * - Status change workflow
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  FileText,
  Upload,
  MessageSquare,
  Wrench,
  Target,
  BarChart3,
  ExternalLink,
  Download,
  MoreVertical,
} from 'lucide-react'
import { PageHeader } from '@/components/compliance'
import { StatCard, StatGrid } from '@/components/coinest'
import { useTheme } from '@/stores/theme-store'
import { useThemeClasses } from '@/hooks/useThemeClasses'
import { cn } from '@/lib/utils'
import {
  complianceApi,
  type Assessment,
  type AssessmentFinding,
  type FindingStatus,
  type FindingSeverity,
} from '@/lib/compliance-api'

// Framework labels
const FRAMEWORK_LABELS: Record<string, string> = {
  eu_ai_act: 'EU AI Act',
  iso_27001: 'ISO 27001',
  gdpr: 'GDPR',
  nis2: 'NIS2',
  soc2: 'SOC 2',
  iso_27701: 'ISO 27701',
}

// Status display config
const STATUS_CONFIG: Record<FindingStatus, { label: string; color: string; bgClass: string; icon: React.ElementType }> = {
  compliant: { label: 'Compliant', color: 'text-green-400', bgClass: 'bg-green-500/20', icon: CheckCircle2 },
  non_compliant: { label: 'Non-Compliant', color: 'text-red-400', bgClass: 'bg-red-500/20', icon: XCircle },
  partial: { label: 'Partial', color: 'text-yellow-400', bgClass: 'bg-yellow-500/20', icon: AlertTriangle },
  not_applicable: { label: 'N/A', color: 'text-neutral-400', bgClass: 'bg-neutral-500/20', icon: Clock },
  not_assessed: { label: 'Not Assessed', color: 'text-blue-400', bgClass: 'bg-blue-500/20', icon: Clock },
}

// Severity display config
const SEVERITY_CONFIG: Record<FindingSeverity, { label: string; color: string; bgClass: string }> = {
  critical: { label: 'Critical', color: 'text-red-400', bgClass: 'bg-red-500/20' },
  major: { label: 'Major', color: 'text-orange-400', bgClass: 'bg-orange-500/20' },
  minor: { label: 'Minor', color: 'text-yellow-400', bgClass: 'bg-yellow-500/20' },
  observation: { label: 'Observation', color: 'text-blue-400', bgClass: 'bg-blue-500/20' },
}

// Tab types
type DetailTab = 'details' | 'evidence' | 'remediation' | 'comments'

export default function FindingsReviewPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  const assessmentId = params.id as string
  const initialStatus = searchParams.get('status') as FindingStatus | null

  const [isLoading, setIsLoading] = useState(true)
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [findings, setFindings] = useState<AssessmentFinding[]>([])
  const [error, setError] = useState<string | null>(null)

  // Selection state
  const [selectedFinding, setSelectedFinding] = useState<AssessmentFinding | null>(null)
  const [activeTab, setActiveTab] = useState<DetailTab>('details')
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Filter state
  const [statusFilter, setStatusFilter] = useState<FindingStatus | ''>(initialStatus || '')
  const [severityFilter, setSeverityFilter] = useState<FindingSeverity | ''>('')
  const [searchQuery, setSearchQuery] = useState('')

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
        // Select first finding if none selected
        const findingsData = findingsRes.data.data
        if (!selectedFinding && findingsData && findingsData.length > 0) {
          const firstFinding = findingsData[0]
          if (firstFinding) {
            setSelectedFinding(firstFinding)
          }
        }
      }
      setError(null)
    } catch (err) {
      console.error('Failed to fetch findings:', err)
      setError('Failed to load findings')
    } finally {
      setIsLoading(false)
    }
  }, [assessmentId, selectedFinding])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter findings
  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      if (statusFilter && f.status !== statusFilter) return false
      if (severityFilter && f.severity !== severityFilter) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          f.controlNumber.toLowerCase().includes(query) ||
          f.controlTitle.toLowerCase().includes(query) ||
          f.aiReasoning?.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [findings, statusFilter, severityFilter, searchQuery])

  // Stats
  const stats = useMemo(() => ({
    total: findings.length,
    compliant: findings.filter((f) => f.status === 'compliant').length,
    nonCompliant: findings.filter((f) => f.status === 'non_compliant').length,
    partial: findings.filter((f) => f.status === 'partial').length,
    critical: findings.filter((f) => f.severity === 'critical').length,
  }), [findings])

  // Bulk selection handlers
  const toggleBulkSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredFindings.map((f) => f.id)))
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
    setBulkMode(false)
  }

  // Handle status update
  const handleStatusUpdate = async (findingId: string, newStatus: FindingStatus) => {
    try {
      await complianceApi.updateFinding(findingId, { status: newStatus })
      // Refresh data
      fetchData()
    } catch (err) {
      console.error('Failed to update finding status:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={cn('h-8 w-8 animate-spin', tc.accentCyan)} />
          <p className={tc.textMuted}>Loading findings...</p>
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
            Findings Not Available
          </h2>
          <p className={cn('mb-4', tc.textMuted)}>
            {error || 'The findings could not be loaded.'}
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 pb-4">
        <PageHeader
          title="Findings Review"
          description={`${assessment.targetSystemName} - ${FRAMEWORK_LABELS[assessment.frameworkId] || assessment.frameworkId}`}
          icon={<FileText className={cn('h-6 w-6', tc.accentCyan)} />}
          actions={
            <div className="flex items-center gap-3">
              <Link
                href={`/compliance/assessments/${assessmentId}/results`}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                  tc.buttonSecondary
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Results
              </Link>
              <button
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                  tc.buttonPrimary
                )}
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          }
        />

        {/* Stats */}
        <div className="mt-4">
          <StatGrid columns={4}>
            <StatCard
              title="Total Findings"
              value={stats.total}
              icon={<FileText className="h-5 w-5" />}
              variant="cyan"
            />
            <StatCard
              title="Compliant"
              value={stats.compliant}
              icon={<CheckCircle2 className="h-5 w-5" />}
              variant="success"
            />
            <StatCard
              title="Non-Compliant"
              value={stats.nonCompliant}
              icon={<XCircle className="h-5 w-5" />}
              variant={stats.nonCompliant > 0 ? 'danger' : 'default'}
            />
            <StatCard
              title="Partial"
              value={stats.partial}
              icon={<AlertTriangle className="h-5 w-5" />}
              variant={stats.partial > 0 ? 'warning' : 'default'}
            />
            <StatCard
              title="Critical"
              value={stats.critical}
              icon={<AlertTriangle className="h-5 w-5" />}
              variant={stats.critical > 0 ? 'danger' : 'success'}
            />
          </StatGrid>
        </div>

        {/* Filters */}
        <div className={cn('mt-4 rounded-xl border p-4', tc.card)}>
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4', tc.textMuted)} />
              <input
                type="text"
                placeholder="Search by control number, title, or AI reasoning..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn('w-full pl-10 pr-4 py-2 rounded-lg border text-sm', tc.input)}
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className={cn('h-4 w-4', tc.textMuted)} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FindingStatus | '')}
                className={cn('px-3 py-2 rounded-lg border text-sm', tc.input)}
              >
                <option value="">All Statuses</option>
                <option value="compliant">Compliant</option>
                <option value="non_compliant">Non-Compliant</option>
                <option value="partial">Partial</option>
                <option value="not_applicable">N/A</option>
                <option value="not_assessed">Not Assessed</option>
              </select>
            </div>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as FindingSeverity | '')}
              className={cn('px-3 py-2 rounded-lg border text-sm', tc.input)}
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
              <option value="observation">Observation</option>
            </select>

            {/* Bulk Mode Toggle */}
            <button
              onClick={() => setBulkMode(!bulkMode)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm',
                bulkMode ? tc.buttonPrimary : tc.buttonSecondary
              )}
            >
              {bulkMode ? 'Exit Bulk Mode' : 'Bulk Actions'}
            </button>
          </div>

          {/* Bulk Actions Bar */}
          {bulkMode && selectedIds.size > 0 && (
            <div className={cn('mt-4 p-3 rounded-lg flex items-center justify-between', tc.bgTertiary)}>
              <span className={cn('text-sm', tc.textPrimary)}>
                {selectedIds.size} finding{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAllFiltered}
                  className={cn('px-3 py-1.5 rounded text-sm', tc.buttonGhost)}
                >
                  Select All ({filteredFindings.length})
                </button>
                <button
                  onClick={clearSelection}
                  className={cn('px-3 py-1.5 rounded text-sm', tc.buttonGhost)}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="flex-1 px-6 pb-6 min-h-0">
        <div className="h-full grid grid-cols-12 gap-6">
          {/* Findings List (Master) */}
          <div className={cn('col-span-5 rounded-xl border overflow-hidden flex flex-col', tc.card)}>
            <div className={cn('px-4 py-3 border-b', tc.border)}>
              <p className={cn('text-sm', tc.textMuted)}>
                {filteredFindings.length} finding{filteredFindings.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredFindings.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className={cn('h-12 w-12 mx-auto mb-4', tc.textMuted)} />
                  <p className={tc.textMuted}>No findings match your filters</p>
                </div>
              ) : (
                <div className="divide-y divide-inherit">
                  {filteredFindings.map((finding) => {
                    const statusConfig = STATUS_CONFIG[finding.status]
                    const StatusIcon = statusConfig.icon
                    const isSelected = selectedFinding?.id === finding.id
                    const isChecked = selectedIds.has(finding.id)

                    return (
                      <div
                        key={finding.id}
                        onClick={() => !bulkMode && setSelectedFinding(finding)}
                        className={cn(
                          'p-3 flex items-start gap-3 cursor-pointer transition-colors',
                          isSelected && !bulkMode
                            ? 'bg-coinest-accent-cyan/10 border-l-2 border-l-coinest-accent-cyan'
                            : tc.tableRow
                        )}
                      >
                        {/* Checkbox (Bulk Mode) */}
                        {bulkMode && (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleBulkSelection(finding.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1"
                          />
                        )}

                        {/* Status Icon */}
                        <div
                          className={cn(
                            'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                            statusConfig.bgClass
                          )}
                        >
                          <StatusIcon className={cn('h-4 w-4', statusConfig.color)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn('font-medium truncate', tc.textPrimary)}>
                              {finding.controlNumber}
                            </span>
                            {finding.severity && (
                              <span
                                className={cn(
                                  'px-1.5 py-0.5 text-xs font-medium rounded',
                                  SEVERITY_CONFIG[finding.severity].bgClass,
                                  SEVERITY_CONFIG[finding.severity].color
                                )}
                              >
                                {finding.severity}
                              </span>
                            )}
                          </div>
                          <p className={cn('text-sm truncate', tc.textMuted)}>
                            {finding.controlTitle}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={cn(
                                'px-1.5 py-0.5 text-xs rounded',
                                statusConfig.bgClass,
                                statusConfig.color
                              )}
                            >
                              {statusConfig.label}
                            </span>
                            {finding.evidenceCount > 0 && (
                              <span className={cn('text-xs flex items-center gap-1', tc.textMuted)}>
                                <Upload className="h-3 w-3" />
                                {finding.evidenceCount}
                              </span>
                            )}
                          </div>
                        </div>

                        {!bulkMode && (
                          <ChevronRight className={cn('h-4 w-4 shrink-0 mt-2', tc.textMuted)} />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Finding Detail (Detail) */}
          <div className={cn('col-span-7 rounded-xl border overflow-hidden flex flex-col', tc.card)}>
            {selectedFinding ? (
              <>
                {/* Detail Header */}
                <div className={cn('px-6 py-4 border-b', tc.border)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={cn('text-lg font-semibold', tc.textPrimary)}>
                        {selectedFinding.controlNumber}
                      </h3>
                      <p className={cn('text-sm', tc.textMuted)}>
                        {selectedFinding.controlTitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'px-2 py-1 text-sm font-medium rounded-lg',
                          STATUS_CONFIG[selectedFinding.status].bgClass,
                          STATUS_CONFIG[selectedFinding.status].color
                        )}
                      >
                        {STATUS_CONFIG[selectedFinding.status].label}
                      </span>
                      {selectedFinding.severity && (
                        <span
                          className={cn(
                            'px-2 py-1 text-sm font-medium rounded-lg',
                            SEVERITY_CONFIG[selectedFinding.severity].bgClass,
                            SEVERITY_CONFIG[selectedFinding.severity].color
                          )}
                        >
                          {selectedFinding.severity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className={cn('px-6 border-b flex', tc.border)}>
                  {(['details', 'evidence', 'remediation', 'comments'] as DetailTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        'px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
                        activeTab === tab
                          ? 'border-coinest-accent-cyan text-coinest-accent-cyan'
                          : cn('border-transparent', tc.textMuted, 'hover:' + tc.textPrimary)
                      )}
                    >
                      {tab === 'details' && 'Details'}
                      {tab === 'evidence' && `Evidence (${selectedFinding.evidenceCount})`}
                      {tab === 'remediation' && 'Remediation'}
                      {tab === 'comments' && 'Comments'}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Details Tab */}
                  {activeTab === 'details' && (
                    <div className="space-y-6">
                      {/* AI Reasoning */}
                      {selectedFinding.aiReasoning && (
                        <div>
                          <h4 className={cn('text-sm font-medium mb-2', tc.textPrimary)}>
                            AI Analysis
                          </h4>
                          <div className={cn('p-4 rounded-lg', tc.bgTertiary)}>
                            <p className={cn('text-sm whitespace-pre-wrap', tc.textSecondary)}>
                              {selectedFinding.aiReasoning}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Recommendation */}
                      {selectedFinding.recommendation && (
                        <div>
                          <h4 className={cn('text-sm font-medium mb-2', tc.textPrimary)}>
                            Recommendation
                          </h4>
                          <div className={cn('p-4 rounded-lg border-l-4 border-coinest-accent-cyan', tc.bgTertiary)}>
                            <p className={cn('text-sm', tc.textSecondary)}>
                              {selectedFinding.recommendation}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Status Change */}
                      <div>
                        <h4 className={cn('text-sm font-medium mb-2', tc.textPrimary)}>
                          Change Status
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {(Object.keys(STATUS_CONFIG) as FindingStatus[]).map((status) => {
                            const config = STATUS_CONFIG[status]
                            const Icon = config.icon
                            const isActive = selectedFinding.status === status

                            return (
                              <button
                                key={status}
                                onClick={() => handleStatusUpdate(selectedFinding.id, status)}
                                disabled={isActive}
                                className={cn(
                                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                                  isActive
                                    ? cn(config.bgClass, config.color, 'cursor-default')
                                    : cn(tc.buttonSecondary, 'hover:' + config.bgClass)
                                )}
                              >
                                <Icon className="h-4 w-4" />
                                {config.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Control Details */}
                      <div>
                        <h4 className={cn('text-sm font-medium mb-2', tc.textPrimary)}>
                          Control Information
                        </h4>
                        <div className={cn('p-4 rounded-lg space-y-3', tc.bgTertiary)}>
                          <div className="flex items-center gap-3">
                            <Target className={cn('h-4 w-4', tc.textMuted)} />
                            <div>
                              <p className={cn('text-xs', tc.textMuted)}>Control ID</p>
                              <p className={cn('text-sm font-medium', tc.textPrimary)}>
                                {selectedFinding.controlId}
                              </p>
                            </div>
                          </div>
                          {selectedFinding.score !== null && (
                            <div className="flex items-center gap-3">
                              <BarChart3 className={cn('h-4 w-4', tc.textMuted)} />
                              <div>
                                <p className={cn('text-xs', tc.textMuted)}>Score</p>
                                <p className={cn('text-sm font-medium', tc.textPrimary)}>
                                  {selectedFinding.score}/100
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <Clock className={cn('h-4 w-4', tc.textMuted)} />
                            <div>
                              <p className={cn('text-xs', tc.textMuted)}>Updated At</p>
                              <p className={cn('text-sm font-medium', tc.textPrimary)}>
                                {new Date(selectedFinding.updatedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Evidence Tab */}
                  {activeTab === 'evidence' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className={cn('text-sm', tc.textMuted)}>
                          {selectedFinding.evidenceCount} evidence item{selectedFinding.evidenceCount !== 1 ? 's' : ''} attached
                        </p>
                        <Link
                          href={`/compliance/assessments/${assessmentId}/findings/${selectedFinding.id}/evidence/upload`}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                            tc.buttonPrimary
                          )}
                        >
                          <Upload className="h-4 w-4" />
                          Upload Evidence
                        </Link>
                      </div>
                      {selectedFinding.evidenceCount === 0 ? (
                        <div className={cn('p-8 text-center rounded-lg', tc.bgTertiary)}>
                          <Upload className={cn('h-12 w-12 mx-auto mb-4', tc.textMuted)} />
                          <p className={tc.textMuted}>No evidence attached yet</p>
                          <p className={cn('text-sm mt-1', tc.textMuted)}>
                            Upload documents, screenshots, or other evidence to support this finding
                          </p>
                        </div>
                      ) : (
                        <div className={cn('p-4 rounded-lg text-center', tc.bgTertiary)}>
                          <p className={tc.textMuted}>
                            Evidence gallery would be displayed here
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Remediation Tab */}
                  {activeTab === 'remediation' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className={cn('text-sm', tc.textMuted)}>
                          Remediation plan and tracking
                        </p>
                        <button
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                            tc.buttonPrimary
                          )}
                        >
                          <Wrench className="h-4 w-4" />
                          Create Plan
                        </button>
                      </div>
                      <div className={cn('p-8 text-center rounded-lg', tc.bgTertiary)}>
                        <Wrench className={cn('h-12 w-12 mx-auto mb-4', tc.textMuted)} />
                        <p className={tc.textMuted}>No remediation plan created yet</p>
                        <p className={cn('text-sm mt-1', tc.textMuted)}>
                          Create a remediation plan to track actions needed to address this finding
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Comments Tab */}
                  {activeTab === 'comments' && (
                    <div className="space-y-4">
                      <div className={cn('p-8 text-center rounded-lg', tc.bgTertiary)}>
                        <MessageSquare className={cn('h-12 w-12 mx-auto mb-4', tc.textMuted)} />
                        <p className={tc.textMuted}>No comments yet</p>
                        <p className={cn('text-sm mt-1', tc.textMuted)}>
                          Add comments to discuss this finding with your team
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          className={cn('flex-1 px-4 py-2 rounded-lg border', tc.input)}
                        />
                        <button className={cn('px-4 py-2 rounded-lg', tc.buttonPrimary)}>
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FileText className={cn('h-16 w-16 mx-auto mb-4', tc.textMuted)} />
                  <p className={cn('text-lg', tc.textPrimary)}>Select a finding</p>
                  <p className={cn('text-sm', tc.textMuted)}>
                    Click on a finding in the list to view details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
