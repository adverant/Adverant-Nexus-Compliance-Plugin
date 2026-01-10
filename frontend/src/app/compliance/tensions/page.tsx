/**
 * Ethical Tensions Page
 *
 * Track value conflicts and trade-offs identified in AI systems.
 * Features:
 * - List all ethical tensions with filtering
 * - Create new tensions with validated form
 * - Error handling with user feedback
 * - Loading states
 */

'use client'

import { useState, useCallback } from 'react'
import { Scale, Plus, AlertTriangle, Loader2, X, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/compliance'
import { StatCard, StatGrid } from '@/components/coinest'
import { DataTable } from '@/components/coinest'
import { InlineError } from '@/components/error-boundary'
import { useToast } from '@/components/toast'
import { useThemeClasses } from '@/hooks/useThemeClasses'
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery'
import { cn } from '@/lib/utils'
import {
  complianceApi,
  isTensionSeverity,
  isTrustworthyAIRequirement,
  CreateTensionInputSchema,
  getFieldErrors,
  TRUSTWORTHY_AI_REQUIREMENT_LABELS,
} from '@/lib/compliance-api'
import type {
  EthicalTension,
  TensionSeverity,
  TrustworthyAIRequirement,
  CreateTensionInput,
} from '@/lib/compliance-api'

// ============================================================================
// Form State Type
// ============================================================================

interface TensionFormState {
  valueA: string
  valueB: string
  severity: TensionSeverity
  description: string
  affectedRequirement: TrustworthyAIRequirement | ''
}

const initialFormState: TensionFormState = {
  valueA: '',
  valueB: '',
  severity: 'moderate',
  description: '',
  affectedRequirement: '',
}

// ============================================================================
// Main Component
// ============================================================================

export default function TensionsPage() {
  const tc = useThemeClasses()
  const { toast } = useToast()
  const [showAddModal, setShowAddModal] = useState(false)
  const [formState, setFormState] = useState<TensionFormState>(initialFormState)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Fetch tensions with error handling
  const {
    data: tensions,
    isLoading,
    error,
    refetch,
  } = useApiQuery<EthicalTension[]>(
    () => complianceApi.listTensions(),
    {
      onError: (message) => {
        toast.error('Failed to load tensions', message)
      },
    }
  )

  // Create tension mutation
  const createMutation = useApiMutation<EthicalTension, CreateTensionInput>(
    (data) => complianceApi.createTension(data),
    {
      onSuccess: () => {
        toast.success('Tension created', 'The ethical tension has been recorded.')
        setShowAddModal(false)
        resetForm()
        refetch()
      },
      onError: (message) => {
        toast.error('Failed to create tension', message)
      },
    }
  )

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormState(initialFormState)
    setValidationErrors({})
  }, [])

  // Handle form field changes with type guards
  const handleFieldChange = useCallback((field: keyof TensionFormState, value: string) => {
    // Clear validation error for this field
    setValidationErrors((prev) => {
      const { [field]: _, ...rest } = prev
      return rest
    })

    // Type-safe updates with validation
    if (field === 'severity') {
      if (isTensionSeverity(value)) {
        setFormState((prev) => ({ ...prev, severity: value }))
      }
    } else if (field === 'affectedRequirement') {
      if (value === '' || isTrustworthyAIRequirement(value)) {
        setFormState((prev) => ({ ...prev, affectedRequirement: value as TrustworthyAIRequirement | '' }))
      }
    } else {
      setFormState((prev) => ({ ...prev, [field]: value }))
    }
  }, [])

  // Validate and submit form
  const handleSubmit = useCallback(async () => {
    // Build input object
    const input: CreateTensionInput = {
      valueA: formState.valueA.trim(),
      valueB: formState.valueB.trim(),
      severity: formState.severity,
      description: formState.description.trim(),
      ...(formState.affectedRequirement && { affectedRequirement: formState.affectedRequirement }),
    }

    // Validate with Zod schema
    const result = CreateTensionInputSchema.safeParse(input)

    if (!result.success) {
      const errors = getFieldErrors(result.error)
      setValidationErrors(errors)
      // Show first error as toast
      const firstError = result.error.errors[0]
      if (firstError) {
        toast.warning('Validation Error', firstError.message)
      }
      return
    }

    // Submit mutation
    await createMutation.mutate(result.data)
  }, [formState, createMutation, toast])

  // Calculate statistics
  const tensionList = tensions || []
  const criticalCount = tensionList.filter((t) => t.severity === 'critical').length
  const underReviewCount = tensionList.filter((t) => t.status === 'under_review').length
  const mitigatedCount = tensionList.filter((t) => t.status === 'mitigated').length

  // Check if form is valid for submit button
  const isFormValid =
    formState.valueA.trim().length > 0 &&
    formState.valueB.trim().length > 0 &&
    formState.description.trim().length >= 10

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={cn('h-8 w-8 animate-spin', tc.accentCyan)} />
          <p className={tc.textMuted}>Loading ethical tensions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Ethical Tensions"
        description="Value conflicts and trade-offs"
        icon={<Scale className={cn('h-6 w-6', tc.accentCyan)} />}
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
              Add Tension
            </button>
          </div>
        }
      />

      {/* Error State */}
      {error && (
        <InlineError message={error} onRetry={refetch} />
      )}

      {/* Statistics */}
      <StatGrid columns={4}>
        <StatCard title="Total Tensions" value={tensionList.length} variant="default" />
        <StatCard title="Critical" value={criticalCount} icon={<AlertTriangle className="h-5 w-5" />} variant="danger" />
        <StatCard title="Under Review" value={underReviewCount} variant="warning" />
        <StatCard title="Mitigated" value={mitigatedCount} variant="success" />
      </StatGrid>

      {/* Content */}
      {tensionList.length === 0 && !error ? (
        <div className={cn('rounded-xl border p-12 text-center', tc.card)}>
          <Scale className={cn('h-12 w-12 mx-auto mb-4', tc.textMuted)} />
          <h3 className={cn('text-lg font-semibold mb-2', tc.textPrimary)}>No Ethical Tensions</h3>
          <p className={cn('text-sm mb-4', tc.textMuted)}>
            No ethical tensions have been identified yet. Add a tension to start tracking value conflicts.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className={cn('px-4 py-2 rounded-lg', tc.buttonPrimary)}
          >
            Add First Tension
          </button>
        </div>
      ) : tensionList.length > 0 && (
        <DataTable
          columns={[
            {
              key: 'valueA',
              header: 'Value A',
              sortable: true,
            },
            {
              key: 'valueB',
              header: 'Value B',
              sortable: true,
            },
            {
              key: 'severity',
              header: 'Severity',
              sortable: true,
              render: (value) => (
                <span className={cn(
                  'badge',
                  value === 'critical' ? tc.badgeCritical :
                  value === 'significant' ? tc.badgeHigh :
                  tc.badgeMedium
                )}>
                  {String(value)}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              sortable: true,
              render: (value) => (
                <span className={cn('badge', tc.badgeNeutral)}>
                  {String(value).replace(/_/g, ' ')}
                </span>
              ),
            },
            {
              key: 'affectedRequirement',
              header: 'Affected Requirement',
              render: (value) => {
                if (!value) return <span className={tc.textMuted}>-</span>
                const label = TRUSTWORTHY_AI_REQUIREMENT_LABELS[value as TrustworthyAIRequirement]
                const shortLabel = label ? label.slice(0, 20) + (label.length > 20 ? '...' : '') : String(value)
                return (
                  <span className={cn('badge', tc.badgeInfo)} title={label}>
                    {shortLabel}
                  </span>
                )
              },
            },
            {
              key: 'identifiedAt',
              header: 'Identified',
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
          ]}
          data={tensionList as unknown as Record<string, unknown>[]}
        />
      )}

      {/* Add Tension Modal */}
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

            <h2 className={cn('text-xl font-bold mb-6', tc.textPrimary)}>Add Ethical Tension</h2>

            <div className="space-y-4">
              {/* Value A & B */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn('text-sm font-medium mb-1 block', tc.textSecondary)}>
                    Value A <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Accuracy"
                    value={formState.valueA}
                    onChange={(e) => handleFieldChange('valueA', e.target.value)}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border',
                      tc.input,
                      validationErrors.valueA && 'border-red-500 focus:border-red-500'
                    )}
                  />
                  {validationErrors.valueA && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.valueA}</p>
                  )}
                </div>
                <div>
                  <label className={cn('text-sm font-medium mb-1 block', tc.textSecondary)}>
                    Value B <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Privacy"
                    value={formState.valueB}
                    onChange={(e) => handleFieldChange('valueB', e.target.value)}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg border',
                      tc.input,
                      validationErrors.valueB && 'border-red-500 focus:border-red-500'
                    )}
                  />
                  {validationErrors.valueB && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.valueB}</p>
                  )}
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className={cn('text-sm font-medium mb-1 block', tc.textSecondary)}>
                  Severity
                </label>
                <select
                  value={formState.severity}
                  onChange={(e) => handleFieldChange('severity', e.target.value)}
                  className={cn('w-full px-3 py-2 rounded-lg border', tc.input)}
                >
                  <option value="minor">Minor</option>
                  <option value="moderate">Moderate</option>
                  <option value="significant">Significant</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Affected Requirement */}
              <div>
                <label className={cn('text-sm font-medium mb-1 block', tc.textSecondary)}>
                  Affected Requirement
                </label>
                <select
                  value={formState.affectedRequirement}
                  onChange={(e) => handleFieldChange('affectedRequirement', e.target.value)}
                  className={cn('w-full px-3 py-2 rounded-lg border', tc.input)}
                >
                  <option value="">None</option>
                  <option value="human_agency_oversight">Human Agency & Oversight</option>
                  <option value="technical_robustness_safety">Technical Robustness & Safety</option>
                  <option value="privacy_data_governance">Privacy & Data Governance</option>
                  <option value="transparency">Transparency</option>
                  <option value="diversity_fairness_nondiscrimination">Diversity, Fairness & Non-discrimination</option>
                  <option value="societal_environmental_wellbeing">Societal & Environmental Wellbeing</option>
                  <option value="accountability">Accountability</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className={cn('text-sm font-medium mb-1 block', tc.textSecondary)}>
                  Description <span className="text-red-400">*</span>
                  <span className={cn('text-xs ml-2', tc.textMuted)}>(min 10 characters)</span>
                </label>
                <textarea
                  placeholder="Describe the tension and its implications..."
                  value={formState.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  rows={4}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border resize-none',
                    tc.input,
                    validationErrors.description && 'border-red-500 focus:border-red-500'
                  )}
                />
                <div className="flex justify-between mt-1">
                  {validationErrors.description ? (
                    <p className="text-red-400 text-xs">{validationErrors.description}</p>
                  ) : (
                    <span />
                  )}
                  <span className={cn('text-xs', tc.textMuted)}>
                    {formState.description.length} characters
                  </span>
                </div>
              </div>
            </div>

            {/* Form Actions */}
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
                  'Add Tension'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}