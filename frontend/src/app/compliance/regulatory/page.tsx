/**
 * Regulatory Monitoring Page
 *
 * Track regulatory changes and updates.
 * Features:
 * - Real API integration with proper error handling
 * - Toast notifications for user feedback
 * - Form validation with type guards
 * - Loading states and error display
 */

'use client'

import { useState, useCallback } from 'react'
import { Radio, Plus, ExternalLink, Loader2, X, CheckCircle, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/compliance'
import { StatCard, StatGrid } from '@/components/coinest'
import { DataTable } from '@/components/coinest'
import { InlineError } from '@/components/error-boundary'
import { useToast } from '@/components/toast'
import { useThemeClasses } from '@/hooks/useThemeClasses'
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery'
import { cn, snakeToTitle } from '@/lib/utils'
import {
  complianceApi,
  isFrameworkId,
} from '@/lib/compliance-api'
import type {
  RegulatoryUpdate,
  RegulatoryUpdateType,
  RegulatoryUpdateStatus,
  FrameworkId,
} from '@/lib/compliance-api'

// ============================================================================
// Form State Type
// ============================================================================

interface RegulatoryFormState {
  sourceName: string
  frameworkId: FrameworkId | ''
  updateType: RegulatoryUpdateType
  title: string
  summary: string
  originalUrl: string
  effectiveDate: string
  impact: string
}

const initialFormState: RegulatoryFormState = {
  sourceName: '',
  frameworkId: '',
  updateType: 'guidance',
  title: '',
  summary: '',
  originalUrl: '',
  effectiveDate: '',
  impact: '',
}

// ============================================================================
// Main Component
// ============================================================================

export default function RegulatoryPage() {
  const tc = useThemeClasses()
  const { toast } = useToast()
  const [showAddModal, setShowAddModal] = useState(false)
  const [formState, setFormState] = useState<RegulatoryFormState>(initialFormState)

  // Fetch regulatory updates with error handling
  const {
    data: updates,
    isLoading,
    error,
    refetch,
  } = useApiQuery<RegulatoryUpdate[]>(
    () => complianceApi.listRegulatoryUpdates(),
    {
      onError: (message) => {
        toast.error('Failed to load regulatory updates', message)
      },
    }
  )

  // Create regulatory update mutation
  const createMutation = useApiMutation<RegulatoryUpdate, Parameters<typeof complianceApi.createRegulatoryUpdate>[0]>(
    (data) => complianceApi.createRegulatoryUpdate(data),
    {
      onSuccess: () => {
        toast.success('Update created', 'The regulatory update has been recorded.')
        setShowAddModal(false)
        resetForm()
        refetch()
      },
      onError: (message) => {
        toast.error('Failed to create update', message)
      },
    }
  )

  // Update status mutation
  const updateStatusMutation = useApiMutation<RegulatoryUpdate, { updateId: string; status: RegulatoryUpdateStatus }>(
    ({ updateId, status }) => complianceApi.updateRegulatoryStatus(updateId, status),
    {
      onSuccess: () => {
        toast.success('Status updated', 'The regulatory update status has been changed.')
        refetch()
      },
      onError: (message) => {
        toast.error('Failed to update status', message)
      },
    }
  )

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormState(initialFormState)
  }, [])

  // Handle form field changes with type guards
  const handleFieldChange = useCallback((field: keyof RegulatoryFormState, value: string) => {
    if (field === 'frameworkId') {
      if (value === '' || isFrameworkId(value)) {
        setFormState((prev) => ({ ...prev, frameworkId: value as FrameworkId | '' }))
      }
    } else if (field === 'updateType') {
      // Type guard for update types
      const validTypes: RegulatoryUpdateType[] = ['new_regulation', 'amendment', 'guidance', 'deadline', 'enforcement']
      if (validTypes.includes(value as RegulatoryUpdateType)) {
        setFormState((prev) => ({ ...prev, updateType: value as RegulatoryUpdateType }))
      }
    } else {
      setFormState((prev) => ({ ...prev, [field]: value }))
    }
  }, [])

  // Validate and submit form
  const handleSubmit = useCallback(async () => {
    if (!formState.title.trim() || !formState.sourceName.trim()) {
      toast.warning('Validation Error', 'Title and Source are required fields.')
      return
    }

    await createMutation.mutate({
      sourceName: formState.sourceName.trim(),
      frameworkId: formState.frameworkId || undefined,
      updateType: formState.updateType,
      title: formState.title.trim(),
      summary: formState.summary.trim() || undefined,
      originalUrl: formState.originalUrl.trim() || undefined,
      effectiveDate: formState.effectiveDate || undefined,
      impact: formState.impact.trim() || undefined,
    })
  }, [formState, createMutation, toast])

  // Handle status update
  const handleUpdateStatus = useCallback(async (updateId: string, status: RegulatoryUpdateStatus) => {
    await updateStatusMutation.mutate({ updateId, status })
  }, [updateStatusMutation])

  // Calculate statistics
  const updateList = updates || []
  const pendingCount = updateList.filter(u => u.status === 'pending').length
  const analyzedCount = updateList.filter(u => u.status === 'analyzed').length
  const implementedCount = updateList.filter(u => u.status === 'implemented').length

  // Check if form is valid for submit button
  const isFormValid = formState.title.trim().length > 0 && formState.sourceName.trim().length > 0

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={cn('h-8 w-8 animate-spin', tc.accentCyan)} />
          <p className={tc.textMuted}>Loading regulatory updates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Regulatory Monitoring"
        description="Track regulatory changes and updates"
        icon={<Radio className={cn('h-6 w-6', tc.accentCyan)} />}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className={cn('flex items-center gap-2 px-3 py-2 rounded-lg', tc.buttonSecondary)}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-lg', tc.buttonPrimary)}
            >
              <Plus className="h-4 w-4" />
              Add Update
            </button>
          </div>
        }
      />

      {/* Error State */}
      {error && (
        <InlineError message={error} onRetry={refetch} />
      )}

      <StatGrid columns={4}>
        <StatCard title="Total Updates" value={updateList.length} variant="default" />
        <StatCard title="Pending Review" value={pendingCount} variant="warning" />
        <StatCard title="Analyzed" value={analyzedCount} variant="cyan" />
        <StatCard title="Implemented" value={implementedCount} icon={<CheckCircle className="h-5 w-5" />} variant="success" />
      </StatGrid>

      {updateList.length === 0 && !error ? (
        <div className={cn('rounded-xl border p-12 text-center', tc.card)}>
          <Radio className={cn('h-12 w-12 mx-auto mb-4', tc.textMuted)} />
          <h3 className={cn('text-lg font-semibold mb-2', tc.textPrimary)}>No Regulatory Updates</h3>
          <p className={cn('text-sm mb-4', tc.textMuted)}>
            No regulatory updates have been tracked yet. Add an update to start monitoring.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className={cn('px-4 py-2 rounded-lg', tc.buttonPrimary)}
          >
            Add First Update
          </button>
        </div>
      ) : updateList.length > 0 && (
        <DataTable
          columns={[
            { key: 'title', header: 'Update', sortable: true },
            { key: 'sourceName', header: 'Source', sortable: true },
            {
              key: 'frameworkId',
              header: 'Framework',
              render: (value) => value ? (
                <span className={cn('badge', tc.badgeInfo)}>{snakeToTitle(String(value))}</span>
              ) : (
                <span className={tc.textMuted}>-</span>
              ),
            },
            {
              key: 'updateType',
              header: 'Type',
              render: (value) => <span className={cn('badge', tc.badgeNeutral)}>{snakeToTitle(String(value))}</span>,
            },
            {
              key: 'status',
              header: 'Status',
              sortable: true,
              render: (value, row) => (
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'badge',
                    value === 'implemented' ? tc.badgeSuccess :
                    value === 'analyzed' ? tc.badgeInfo :
                    value === 'rejected' ? tc.badgeCritical :
                    tc.badgeWarning
                  )}>
                    {snakeToTitle(String(value))}
                  </span>
                  {value === 'pending' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUpdateStatus((row as unknown as RegulatoryUpdate).id, 'analyzed')
                      }}
                      disabled={updateStatusMutation.isLoading}
                      className={cn('text-xs px-2 py-0.5 rounded', tc.buttonGhost, 'disabled:opacity-50')}
                    >
                      Mark Analyzed
                    </button>
                  )}
                  {value === 'analyzed' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUpdateStatus((row as unknown as RegulatoryUpdate).id, 'implemented')
                      }}
                      disabled={updateStatusMutation.isLoading}
                      className={cn('text-xs px-2 py-0.5 rounded', tc.buttonGhost, 'disabled:opacity-50')}
                    >
                      Mark Implemented
                    </button>
                  )}
                </div>
              ),
            },
            {
              key: 'detectedAt',
              header: 'Detected',
              sortable: true,
              render: (value) => {
                if (!value) return <span className={tc.textMuted}>-</span>
                try {
                  return new Date(String(value)).toLocaleDateString()
                } catch {
                  return <span className={tc.textMuted}>Invalid date</span>
                }
              },
            },
            {
              key: 'originalUrl',
              header: '',
              render: (value) => value ? (
                <a
                  href={String(value)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn('p-1 rounded hover:bg-white/10', tc.accentCyan)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null,
            },
          ]}
          data={updateList as unknown as Record<string, unknown>[]}
        />
      )}

      {/* Add Update Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowAddModal(false)
              resetForm()
            }}
          />
          <div className={cn('relative w-full max-w-lg mx-4 rounded-xl border p-6 shadow-xl', tc.card)}>
            <button
              onClick={() => {
                setShowAddModal(false)
                resetForm()
              }}
              className={cn('absolute top-4 right-4 p-2 rounded-lg', tc.buttonGhost)}
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className={cn('text-xl font-bold mb-6', tc.textPrimary)}>Add Regulatory Update</h2>

            <div className="space-y-4">
              <div>
                <label className={cn('text-sm font-medium mb-1 block', tc.textSecondary)}>
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., EU AI Act Implementing Regulation Published"
                  value={formState.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  className={cn('w-full px-3 py-2 rounded-lg border', tc.input)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn('text-sm font-medium mb-1 block', tc.textSecondary)}>
                    Source <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., EUR-Lex, EDPB, ENISA"
                    value={formState.sourceName}
                    onChange={(e) => handleFieldChange('sourceName', e.target.value)}
                    className={cn('w-full px-3 py-2 rounded-lg border', tc.input)}
                  />
                </div>
                <div>
                  <label className={cn('text-sm font-medium mb-1 block', tc.textSecondary)}>Framework</label>
                  <select
                    value={formState.frameworkId}
                    onChange={(e) => handleFieldChange('frameworkId', e.target.value)}
                    className={cn('w-full px-3 py-2 rounded-lg border', tc.input)}
                  >
                    <option value="">Select Framework</option>
                    <option value="iso_27001">ISO 27001</option>
                    <option value="gdpr">GDPR</option>
                    <option value="eu_ai_act">EU AI Act</option>
                    <option value="nis2">NIS2</option>
                    <option value="soc2">SOC 2</option>
                    <option value="iso_27701">ISO 27701</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn('text-sm font-medium mb-1 block', tc.textSecondary)}>Update Type</label>
                  <select
                    value={formState.updateType}
                    onChange={(e) => handleFieldChange('updateType', e.target.value)}
                    className={cn('w-full px-3 py-2 rounded-lg border', tc.input)}
                  >
                    <option value="new_regulation">New Regulation</option>
                    <option value="amendment">Amendment</option>
                    <option value="guidance">Guidance</option>
                    <option value="deadline">Deadline</option>
                    <option value="enforcement">Enforcement</option>
                  </select>
                </div>
                <div>
                  <label className={cn('text-sm font-medium mb-1 block', tc.textSecondary)}>Effective Date</label>
                  <input
                    type="date"
                    value={formState.effectiveDate}
                    onChange={(e) => handleFieldChange('effectiveDate', e.target.value)}
                    className={cn('w-full px-3 py-2 rounded-lg border', tc.input)}
                  />
                </div>
              </div>

              <div>
                <label className={cn('text-sm font-medium mb-1 block', tc.textSecondary)}>Original URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formState.originalUrl}
                  onChange={(e) => handleFieldChange('originalUrl', e.target.value)}
                  className={cn('w-full px-3 py-2 rounded-lg border', tc.input)}
                />
              </div>

              <div>
                <label className={cn('text-sm font-medium mb-1 block', tc.textSecondary)}>Summary</label>
                <textarea
                  placeholder="Brief summary of the regulatory update..."
                  value={formState.summary}
                  onChange={(e) => handleFieldChange('summary', e.target.value)}
                  rows={3}
                  className={cn('w-full px-3 py-2 rounded-lg border resize-none', tc.input)}
                />
              </div>

              <div>
                <label className={cn('text-sm font-medium mb-1 block', tc.textSecondary)}>Impact Assessment</label>
                <textarea
                  placeholder="Describe the potential impact on your compliance posture..."
                  value={formState.impact}
                  onChange={(e) => handleFieldChange('impact', e.target.value)}
                  rows={2}
                  className={cn('w-full px-3 py-2 rounded-lg border resize-none', tc.input)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-inherit">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  resetForm()
                }}
                className={cn('px-4 py-2 rounded-lg', tc.buttonSecondary)}
                disabled={createMutation.isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isLoading || !isFormValid}
                className={cn(
                  'px-4 py-2 rounded-lg flex items-center gap-2',
                  tc.buttonPrimary,
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {createMutation.isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Add Update'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}