/**
 * Assessment Execution View
 *
 * Real-time progress display during assessment execution with:
 * - WebSocket connection for live updates
 * - Progress indicator with control timeline
 * - AI reasoning panel (streaming)
 * - Control completion log
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ClipboardCheck,
  ArrowLeft,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Target,
  BarChart3,
  Play,
  Pause,
  Brain,
  RefreshCw,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { PageHeader } from '@/components/compliance'
import { StatCard, StatGrid } from '@/components/coinest'
import { useTheme } from '@/stores/theme-store'
import { useThemeClasses } from '@/hooks/useThemeClasses'
import { cn } from '@/lib/utils'
import {
  complianceApi,
  type Assessment,
  type AssessmentStatus,
} from '@/lib/compliance-api'

// WebSocket message types
interface ProgressMessage {
  type: 'progress'
  data: {
    controlsTotal: number
    controlsCompleted: number
    percentComplete: number
    currentControl?: string
    estimatedTimeRemaining?: number
  }
}

interface ReasoningMessage {
  type: 'reasoning_start' | 'reasoning_chunk' | 'reasoning_end'
  data: {
    controlId?: string
    controlNumber?: string
    chunk?: string
  }
}

interface ControlCompleteMessage {
  type: 'control_complete'
  data: {
    controlId: string
    controlNumber: string
    controlTitle: string
    status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable'
    severity?: 'critical' | 'major' | 'minor' | 'observation'
    duration: number
    findingsCount: number
  }
}

interface AssessmentCompleteMessage {
  type: 'assessment_complete'
  data: {
    status: 'completed' | 'failed' | 'cancelled'
    overallScore?: number
    totalFindings: number
    duration: number
  }
}

type WebSocketMessage =
  | ProgressMessage
  | ReasoningMessage
  | ControlCompleteMessage
  | AssessmentCompleteMessage

// Control log entry
interface ControlLogEntry {
  controlId: string
  controlNumber: string
  controlTitle: string
  status: 'pending' | 'in_progress' | 'compliant' | 'non_compliant' | 'partial' | 'not_applicable'
  severity?: 'critical' | 'major' | 'minor' | 'observation'
  duration?: number
  findingsCount?: number
  timestamp: Date
}

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

export default function AssessmentExecutionPage() {
  const params = useParams()
  const router = useRouter()
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  const assessmentId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Execution state
  const [progress, setProgress] = useState({
    controlsTotal: 0,
    controlsCompleted: 0,
    percentComplete: 0,
    currentControl: '',
    estimatedTimeRemaining: 0,
  })
  const [aiReasoning, setAiReasoning] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [controlLog, setControlLog] = useState<ControlLogEntry[]>([])
  const [startTime, setStartTime] = useState<Date | null>(null)

  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  const fetchAssessment = useCallback(async () => {
    try {
      const response = await complianceApi.getAssessment(assessmentId)
      if (response.success && response.data) {
        setAssessment(response.data)
        setError(null)
        return response.data
      }
      return null
    } catch (err) {
      console.error('Failed to fetch assessment:', err)
      setError('Failed to load assessment')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [assessmentId])

  // Refs for stable function references (avoids circular dependencies)
  const handleWebSocketMessageRef = useRef<(message: WebSocketMessage) => void>(() => {})
  const startPollingRef = useRef<() => void>(() => {})

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'progress':
        setProgress({
          controlsTotal: message.data.controlsTotal,
          controlsCompleted: message.data.controlsCompleted,
          percentComplete: message.data.percentComplete,
          currentControl: message.data.currentControl || '',
          estimatedTimeRemaining: message.data.estimatedTimeRemaining || 0,
        })
        break

      case 'reasoning_start':
        setIsStreaming(true)
        setAiReasoning('')
        if (message.data.controlNumber) {
          // Mark control as in progress
          setControlLog((prev) => {
            const existing = prev.find((c) => c.controlNumber === message.data.controlNumber)
            if (!existing) {
              return [
                ...prev,
                {
                  controlId: message.data.controlId || '',
                  controlNumber: message.data.controlNumber || '',
                  controlTitle: '',
                  status: 'in_progress',
                  timestamp: new Date(),
                },
              ]
            }
            return prev.map((c) =>
              c.controlNumber === message.data.controlNumber
                ? { ...c, status: 'in_progress' as const }
                : c
            )
          })
        }
        break

      case 'reasoning_chunk':
        if (message.data.chunk) {
          setAiReasoning((prev) => prev + message.data.chunk)
        }
        break

      case 'reasoning_end':
        setIsStreaming(false)
        break

      case 'control_complete':
        setControlLog((prev) => {
          const filtered = prev.filter((c) => c.controlNumber !== message.data.controlNumber)
          return [
            ...filtered,
            {
              controlId: message.data.controlId,
              controlNumber: message.data.controlNumber,
              controlTitle: message.data.controlTitle,
              status: message.data.status,
              severity: message.data.severity,
              duration: message.data.duration,
              findingsCount: message.data.findingsCount,
              timestamp: new Date(),
            },
          ]
        })
        // Auto-scroll log
        setTimeout(() => {
          logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
        break

      case 'assessment_complete':
        // Refresh assessment data
        fetchAssessment()
        break
    }
  }, [fetchAssessment])

  // Polling fallback for environments without WebSocket
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const startPolling = useCallback(() => {
    if (pollingRef.current) return

    pollingRef.current = setInterval(async () => {
      const data = await fetchAssessment()
      if (data) {
        // Update progress from assessment data
        setProgress({
          controlsTotal: data.controlsAssessed + 10, // Mock total
          controlsCompleted: data.controlsAssessed,
          percentComplete: Math.min(99, Math.round((data.controlsAssessed / (data.controlsAssessed + 10)) * 100)),
          currentControl: '',
          estimatedTimeRemaining: 0,
        })

        // Stop polling if assessment is complete
        if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
        }
      }
    }, 3000)
  }, [fetchAssessment])

  // Update refs to point to latest function versions
  handleWebSocketMessageRef.current = handleWebSocketMessage
  startPollingRef.current = startPolling

  // Connect to WebSocket for real-time updates
  const connectWebSocket = useCallback(() => {
    // Use HTTP polling as fallback if WebSocket is not available
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/compliance/assessments/${assessmentId}/progress`

    try {
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected')
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          handleWebSocketMessageRef.current(message)
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onerror = (err) => {
        console.error('WebSocket error:', err)
        // Fallback to polling
        startPollingRef.current()
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
      }

      wsRef.current = ws
    } catch (err) {
      console.error('Failed to connect WebSocket:', err)
      // Fallback to polling
      startPollingRef.current()
    }
  }, [assessmentId])

  // Initialize
  useEffect(() => {
    const init = async () => {
      const data = await fetchAssessment()
      if (data) {
        setStartTime(data.startedAt ? new Date(data.startedAt) : new Date())
        if (data.status === 'in_progress') {
          connectWebSocket()
        }
      }
    }
    init()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [fetchAssessment, connectWebSocket])

  // Handle cancel
  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this assessment?')) return

    try {
      await complianceApi.cancelAssessment(assessmentId)
      router.push(`/compliance/assessments/${assessmentId}`)
    } catch (err) {
      console.error('Failed to cancel assessment:', err)
    }
  }

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate elapsed time
  const getElapsedTime = (): string => {
    if (!startTime) return '0:00'
    const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000)
    return formatDuration(elapsed)
  }

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

  // If assessment is not in progress, redirect or show appropriate view
  if (assessment.status === 'completed') {
    return (
      <div className="p-6">
        <div className={cn('rounded-xl border p-8 text-center', tc.card)}>
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-400" />
          <h2 className={cn('text-xl font-semibold mb-2', tc.textPrimary)}>
            Assessment Complete!
          </h2>
          <p className={cn('mb-4', tc.textMuted)}>
            The assessment has finished. View the results to see findings and recommendations.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href={`/compliance/assessments/${assessmentId}`}
              className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-lg', tc.buttonSecondary)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <Link
              href={`/compliance/assessments/${assessmentId}/results`}
              className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-lg', tc.buttonPrimary)}
            >
              View Results
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (assessment.status === 'pending') {
    return (
      <div className="p-6">
        <div className={cn('rounded-xl border p-8 text-center', tc.card)}>
          <Clock className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
          <h2 className={cn('text-xl font-semibold mb-2', tc.textPrimary)}>
            Assessment Not Started
          </h2>
          <p className={cn('mb-4', tc.textMuted)}>
            This assessment hasn&apos;t been started yet. Run it from the assessment detail page.
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

  const statusConfig = STATUS_CONFIG[assessment.status]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Assessment in Progress"
        description={`${assessment.targetSystemName} - ${FRAMEWORK_LABELS[assessment.frameworkId] || assessment.frameworkId}`}
        icon={<Loader2 className={cn('h-6 w-6 animate-spin', tc.accentCyan)} />}
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
              onClick={handleCancel}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-yellow-500 text-white hover:bg-yellow-600'
              )}
            >
              <XCircle className="h-4 w-4" />
              Cancel Assessment
            </button>
          </div>
        }
      />

      {/* Progress Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Progress Ring */}
        <div className={cn('rounded-xl border p-6', tc.card)}>
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center">
              {/* Background circle */}
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke={isDark ? '#333333' : '#e5e7eb'}
                  strokeWidth="12"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#4faeca"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${progress.percentComplete * 3.52} 352`}
                  className="transition-all duration-500"
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn('text-3xl font-bold', tc.textPrimary)}>
                  {progress.percentComplete}%
                </span>
                <span className={cn('text-sm', tc.textMuted)}>Complete</span>
              </div>
            </div>
            <div className={cn('mt-4 space-y-1', tc.textMuted)}>
              <p className="text-sm">
                <span className={tc.textPrimary}>{progress.controlsCompleted}</span> of{' '}
                <span>{progress.controlsTotal || '?'}</span> controls
              </p>
              <p className="text-sm flex items-center justify-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Elapsed: {getElapsedTime()}
              </p>
              {progress.estimatedTimeRemaining > 0 && (
                <p className="text-sm">
                  Est. remaining: {formatDuration(progress.estimatedTimeRemaining)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Current Control + AI Reasoning */}
        <div className={cn('lg:col-span-2 rounded-xl border', tc.card)}>
          <div className={cn('px-6 py-4 border-b flex items-center justify-between', tc.border)}>
            <div className="flex items-center gap-2">
              <Brain className={cn('h-5 w-5', tc.accentCyan)} />
              <h3 className={cn('text-lg font-semibold font-urbanist', tc.textPrimary)}>
                AI Analysis
              </h3>
            </div>
            {isStreaming && (
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className={cn('text-sm', tc.textMuted)}>Analyzing...</span>
              </div>
            )}
          </div>
          <div className="p-6">
            {progress.currentControl && (
              <div className={cn('mb-4 p-3 rounded-lg', tc.bgTertiary)}>
                <p className={cn('text-sm', tc.textMuted)}>Currently analyzing:</p>
                <p className={cn('font-medium', tc.textPrimary)}>{progress.currentControl}</p>
              </div>
            )}
            <div
              className={cn(
                'min-h-[200px] max-h-[300px] overflow-y-auto p-4 rounded-lg font-mono text-sm',
                tc.bgTertiary,
                tc.textSecondary
              )}
            >
              {aiReasoning || (
                <span className={tc.textMuted}>
                  {assessment.useAI
                    ? 'Waiting for AI analysis...'
                    : 'AI analysis disabled for this assessment'}
                </span>
              )}
              {isStreaming && <span className="animate-pulse">▊</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatGrid columns={4}>
        <StatCard
          title="Controls Completed"
          value={progress.controlsCompleted}
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="cyan"
        />
        <StatCard
          title="Compliant"
          value={controlLog.filter((c) => c.status === 'compliant').length}
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Non-Compliant"
          value={controlLog.filter((c) => c.status === 'non_compliant').length}
          icon={<XCircle className="h-5 w-5" />}
          variant={controlLog.filter((c) => c.status === 'non_compliant').length > 0 ? 'danger' : 'default'}
        />
        <StatCard
          title="Findings"
          value={controlLog.reduce((sum, c) => sum + (c.findingsCount || 0), 0)}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="warning"
        />
      </StatGrid>

      {/* Control Timeline */}
      <div className={cn('rounded-xl border', tc.card)}>
        <div className={cn('px-6 py-4 border-b', tc.border)}>
          <h3 className={cn('text-lg font-semibold font-urbanist', tc.textPrimary)}>
            Control Timeline
          </h3>
          <p className={cn('text-sm', tc.textMuted)}>
            Real-time progress of control assessments
          </p>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {controlLog.length === 0 ? (
            <div className="p-8 text-center">
              <Zap className={cn('h-12 w-12 mx-auto mb-4 animate-pulse', tc.accentCyan)} />
              <p className={tc.textMuted}>Assessment starting...</p>
              <p className={cn('text-sm', tc.textMuted)}>
                Control results will appear here as they complete
              </p>
            </div>
          ) : (
            <div className="divide-y divide-inherit">
              {controlLog.map((entry, index) => (
                <div
                  key={`${entry.controlNumber}-${index}`}
                  className={cn('p-4 flex items-center gap-4', tc.tableRow)}
                >
                  {/* Status Icon */}
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                      entry.status === 'in_progress' && 'bg-blue-500/20',
                      entry.status === 'compliant' && 'bg-green-500/20',
                      entry.status === 'non_compliant' && 'bg-red-500/20',
                      entry.status === 'partial' && 'bg-yellow-500/20',
                      entry.status === 'not_applicable' && tc.bgTertiary
                    )}
                  >
                    {entry.status === 'in_progress' && (
                      <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                    )}
                    {entry.status === 'compliant' && (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    )}
                    {entry.status === 'non_compliant' && (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    {entry.status === 'partial' && (
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    )}
                    {entry.status === 'not_applicable' && (
                      <Clock className={cn('h-4 w-4', tc.textMuted)} />
                    )}
                  </div>

                  {/* Control Info */}
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-medium', tc.textPrimary)}>
                      {entry.controlNumber}
                      {entry.controlTitle && ` - ${entry.controlTitle}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={cn(
                          'px-2 py-0.5 text-xs font-medium rounded-full',
                          entry.status === 'in_progress' && 'bg-blue-500/20 text-blue-400',
                          entry.status === 'compliant' && 'bg-green-500/20 text-green-400',
                          entry.status === 'non_compliant' && 'bg-red-500/20 text-red-400',
                          entry.status === 'partial' && 'bg-yellow-500/20 text-yellow-400',
                          entry.status === 'not_applicable' && cn(tc.bgTertiary, tc.textMuted)
                        )}
                      >
                        {entry.status.replace(/_/g, ' ')}
                      </span>
                      {entry.severity && (
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs font-medium rounded-full',
                            entry.severity === 'critical' && 'bg-red-500/20 text-red-400',
                            entry.severity === 'major' && 'bg-orange-500/20 text-orange-400',
                            entry.severity === 'minor' && 'bg-yellow-500/20 text-yellow-400',
                            entry.severity === 'observation' && 'bg-blue-500/20 text-blue-400'
                          )}
                        >
                          {entry.severity}
                        </span>
                      )}
                      {entry.findingsCount !== undefined && entry.findingsCount > 0 && (
                        <span className={cn('text-xs', tc.textMuted)}>
                          {entry.findingsCount} finding{entry.findingsCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Duration */}
                  {entry.duration !== undefined && (
                    <div className={cn('text-sm text-right', tc.textMuted)}>
                      {formatDuration(entry.duration)}
                    </div>
                  )}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
