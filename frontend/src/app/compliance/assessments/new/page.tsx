/**
 * New Assessment Wizard Page
 *
 * Multi-step wizard for creating compliance assessments:
 * 1. Framework Selection
 * 2. Scope Definition
 * 3. AI Configuration
 * 4. Review & Launch
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ClipboardCheck,
  ArrowLeft,
  ArrowRight,
  Check,
  ShieldCheck,
  Target,
  Cpu,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Info,
} from 'lucide-react'
import { PageHeader } from '@/components/compliance'
import { useTheme } from '@/stores/theme-store'
import { useThemeClasses } from '@/hooks/useThemeClasses'
import { cn } from '@/lib/utils'
import { complianceApi, type FrameworkId, type AISystem } from '@/lib/compliance-api'
import {
  useAssessmentWizardStore,
  useWizardNavigation,
  useFrameworkStep,
  useScopeStep,
  useAIConfigStep,
  useReviewStep,
  WIZARD_STEPS,
  WIZARD_STEP_LABELS,
  WIZARD_STEP_DESCRIPTIONS,
  type WizardStep,
} from '@/stores/assessment-wizard-store'
import { FRAMEWORK_IDS } from '@/types/compliance'

// Hook to safely handle hydration with persisted Zustand stores
function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}

// Framework configurations
const FRAMEWORK_CONFIG: Record<FrameworkId, {
  name: string
  description: string
  controlCount: number
  color: string
}> = {
  eu_ai_act: {
    name: 'EU AI Act',
    description: 'European AI regulation for trustworthy AI systems',
    controlCount: 149,
    color: 'bg-blue-500',
  },
  iso_27001: {
    name: 'ISO 27001',
    description: 'Information security management system standard',
    controlCount: 93,
    color: 'bg-purple-500',
  },
  gdpr: {
    name: 'GDPR',
    description: 'General Data Protection Regulation',
    controlCount: 220,
    color: 'bg-cyan-500',
  },
  nis2: {
    name: 'NIS2',
    description: 'Network and Information Security Directive',
    controlCount: 112,
    color: 'bg-green-500',
  },
  soc2: {
    name: 'SOC 2',
    description: 'Service Organization Control 2',
    controlCount: 64,
    color: 'bg-orange-500',
  },
  iso_27701: {
    name: 'ISO 27701',
    description: 'Privacy information management',
    controlCount: 50,
    color: 'bg-pink-500',
  },
}

// AI Model options
const AI_MODELS = [
  { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Highest capability for complex assessments' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced performance and speed' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fast assessments for quick reviews' },
  { id: 'gpt-4', name: 'GPT-4', description: 'OpenAI GPT-4 model' },
]

// Step Icons
const STEP_ICONS: Record<WizardStep, React.ElementType> = {
  framework: ShieldCheck,
  scope: Target,
  'ai-config': Cpu,
  review: Play,
}

export default function NewAssessmentPage() {
  const router = useRouter()
  const { isDark } = useTheme()
  const tc = useThemeClasses()
  const isHydrated = useHydration()

  const { currentStep, goToStep, nextStep, prevStep, canGoNext, canGoPrev, currentStepIndex, totalSteps } =
    useWizardNavigation()

  // Get reset action from getState() for stable reference
  const reset = useAssessmentWizardStore.getState().reset

  // Load AI systems for scope step
  const [aiSystems, setAISystems] = useState<AISystem[]>([])
  const [isLoadingSystems, setIsLoadingSystems] = useState(false)

  useEffect(() => {
    const loadAISystems = async () => {
      setIsLoadingSystems(true)
      try {
        const response = await complianceApi.listAISystems({ status: 'active' })
        if (response.success && response.data) {
          setAISystems(response.data.data || [])
        }
      } catch (err) {
        console.error('Failed to load AI systems:', err)
      } finally {
        setIsLoadingSystems(false)
      }
    }
    loadAISystems()
  }, [])

  // Reset wizard on unmount
  useEffect(() => {
    return () => {
      // Only reset if user navigates away without completing
      // The handleLaunch function will reset after successful creation
    }
  }, [])

  // Show loading state during hydration to prevent SSR mismatch
  if (!isHydrated) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-coinest-accent-cyan" />
          <span className="text-coinest-text-muted">Loading assessment wizard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="New Compliance Assessment"
        description="Create a comprehensive compliance assessment for your AI system"
        icon={<ClipboardCheck className={cn('h-6 w-6', tc.accentCyan)} />}
        actions={
          <Link
            href="/compliance/assessments"
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              tc.buttonSecondary
            )}
          >
            <X className="h-4 w-4" />
            Cancel
          </Link>
        }
      />

      {/* Progress Stepper */}
      <div className={cn('rounded-xl border p-6', tc.card)}>
        <div className="flex items-center justify-between">
          {WIZARD_STEPS.map((step, index) => {
            const StepIcon = STEP_ICONS[step]
            const isActive = step === currentStep
            const isCompleted = index < currentStepIndex
            const isPending = index > currentStepIndex

            return (
              <div key={step} className="flex items-center flex-1">
                {/* Step Circle */}
                <button
                  onClick={() => (isCompleted || isActive) && goToStep(step)}
                  disabled={isPending}
                  className={cn(
                    'flex items-center gap-3 transition-colors',
                    isPending ? 'cursor-not-allowed' : 'cursor-pointer'
                  )}
                >
                  <div
                    className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors',
                      isCompleted && 'bg-green-500 border-green-500',
                      isActive && cn('border-coinest-accent-cyan', isDark ? 'bg-coinest-bg-tertiary' : 'bg-brand-50'),
                      isPending && cn(tc.border, tc.bgTertiary)
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : (
                      <StepIcon
                        className={cn(
                          'h-5 w-5',
                          isActive ? tc.accentCyan : tc.textMuted
                        )}
                      />
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        isActive ? tc.textPrimary : tc.textMuted
                      )}
                    >
                      {WIZARD_STEP_LABELS[step]}
                    </p>
                    <p className={cn('text-xs', tc.textMuted)}>
                      Step {index + 1} of {totalSteps}
                    </p>
                  </div>
                </button>

                {/* Connector Line */}
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-4',
                      isCompleted ? 'bg-green-500' : tc.bgTertiary
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Description */}
        <div className={cn('mt-4 pt-4 border-t', tc.border)}>
          <p className={tc.textMuted}>{WIZARD_STEP_DESCRIPTIONS[currentStep]}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className={cn('rounded-xl border', tc.card)}>
        {currentStep === 'framework' && <FrameworkSelectionStep />}
        {currentStep === 'scope' && <ScopeDefinitionStep aiSystems={aiSystems} isLoadingSystems={isLoadingSystems} />}
        {currentStep === 'ai-config' && <AIConfigurationStep />}
        {currentStep === 'review' && <ReviewLaunchStep onComplete={() => reset()} />}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={!canGoPrev}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
            tc.buttonSecondary,
            !canGoPrev && 'opacity-50 cursor-not-allowed'
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </button>

        {currentStep !== 'review' ? (
          <button
            onClick={nextStep}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              tc.buttonPrimary
            )}
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

// ============================================================================
// Step Components
// ============================================================================

function FrameworkSelectionStep() {
  const tc = useThemeClasses()
  const { data, setData, validation } = useFrameworkStep()

  return (
    <div className="p-6">
      <h2 className={cn('text-xl font-semibold font-urbanist mb-2', tc.textPrimary)}>
        Select Compliance Framework
      </h2>
      <p className={cn('text-sm mb-6', tc.textMuted)}>
        Choose the regulatory framework for this assessment. This determines which controls will be evaluated.
      </p>

      {validation.errors.frameworkId && (
        <div className={cn('mb-4 p-3 rounded-lg flex items-center gap-2', 'bg-red-500/20 text-red-400')}>
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{validation.errors.frameworkId}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FRAMEWORK_IDS.map((frameworkId) => {
          const config = FRAMEWORK_CONFIG[frameworkId]
          const isSelected = data.frameworkId === frameworkId

          return (
            <button
              key={frameworkId}
              onClick={() => setData({ frameworkId })}
              className={cn(
                'p-4 rounded-xl border text-left transition-all',
                tc.border,
                isSelected
                  ? cn('ring-2 ring-coinest-accent-cyan', tc.bgTertiary)
                  : tc.cardHover
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', config.color)}>
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                {isSelected && (
                  <CheckCircle2 className="h-5 w-5 text-coinest-accent-cyan" />
                )}
              </div>
              <h3 className={cn('font-semibold mb-1', tc.textPrimary)}>{config.name}</h3>
              <p className={cn('text-sm mb-2', tc.textMuted)}>{config.description}</p>
              <p className={cn('text-xs font-medium', tc.accentCyan)}>
                {config.controlCount} controls
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ScopeDefinitionStep({
  aiSystems,
  isLoadingSystems,
}: {
  aiSystems: AISystem[]
  isLoadingSystems: boolean
}) {
  const tc = useThemeClasses()
  const { data, setData, validation } = useScopeStep()
  const [isNewSystem, setIsNewSystem] = useState(!data.targetSystemId)

  const handleSystemSelect = (systemId: string) => {
    if (systemId === 'new') {
      setIsNewSystem(true)
      setData({
        targetSystemId: '',
        targetSystemName: '',
        targetSystemDescription: '',
      })
    } else {
      setIsNewSystem(false)
      const system = aiSystems.find((s) => s.id === systemId)
      if (system) {
        setData({
          targetSystemId: system.id,
          targetSystemName: system.name,
          targetSystemDescription: system.description || '',
        })
      }
    }
  }

  return (
    <div className="p-6">
      <h2 className={cn('text-xl font-semibold font-urbanist mb-2', tc.textPrimary)}>
        Define Assessment Scope
      </h2>
      <p className={cn('text-sm mb-6', tc.textMuted)}>
        Specify the AI system to assess and customize the scope of the assessment.
      </p>

      <div className="space-y-6">
        {/* System Selection */}
        <div>
          <label className={cn('block text-sm font-medium mb-2', tc.textPrimary)}>
            Target AI System
          </label>
          {isLoadingSystems ? (
            <div className="flex items-center gap-2 p-4">
              <Loader2 className={cn('h-4 w-4 animate-spin', tc.accentCyan)} />
              <span className={tc.textMuted}>Loading systems...</span>
            </div>
          ) : (
            <select
              value={isNewSystem ? 'new' : data.targetSystemId}
              onChange={(e) => handleSystemSelect(e.target.value)}
              className={cn('w-full px-4 py-2 rounded-lg border', tc.input)}
            >
              <option value="">Select an existing system...</option>
              {aiSystems.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.name}
                </option>
              ))}
              <option value="new">+ Define new system</option>
            </select>
          )}
        </div>

        {/* New System Form */}
        {(isNewSystem || !data.targetSystemId) && (
          <div className={cn('p-4 rounded-lg border space-y-4', tc.border, tc.bgTertiary)}>
            <div className="flex items-center gap-2 text-sm text-yellow-500 mb-2">
              <Info className="h-4 w-4" />
              <span>Define a new AI system for this assessment</span>
            </div>

            <div>
              <label className={cn('block text-sm font-medium mb-2', tc.textPrimary)}>
                System ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.targetSystemId}
                onChange={(e) => setData({ targetSystemId: e.target.value })}
                placeholder="e.g., ai-recommender-v2"
                className={cn(
                  'w-full px-4 py-2 rounded-lg border',
                  tc.input,
                  validation.errors.targetSystemId && 'border-red-500'
                )}
              />
              {validation.errors.targetSystemId && (
                <p className="mt-1 text-sm text-red-500">{validation.errors.targetSystemId}</p>
              )}
            </div>

            <div>
              <label className={cn('block text-sm font-medium mb-2', tc.textPrimary)}>
                System Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.targetSystemName}
                onChange={(e) => setData({ targetSystemName: e.target.value })}
                placeholder="e.g., Product Recommendation Engine"
                className={cn(
                  'w-full px-4 py-2 rounded-lg border',
                  tc.input,
                  validation.errors.targetSystemName && 'border-red-500'
                )}
              />
              {validation.errors.targetSystemName && (
                <p className="mt-1 text-sm text-red-500">{validation.errors.targetSystemName}</p>
              )}
            </div>

            <div>
              <label className={cn('block text-sm font-medium mb-2', tc.textPrimary)}>
                Description
              </label>
              <textarea
                value={data.targetSystemDescription}
                onChange={(e) => setData({ targetSystemDescription: e.target.value })}
                placeholder="Brief description of the AI system's purpose and capabilities..."
                rows={3}
                className={cn(
                  'w-full px-4 py-2 rounded-lg border resize-none',
                  tc.input,
                  validation.errors.targetSystemDescription && 'border-red-500'
                )}
              />
              {validation.errors.targetSystemDescription && (
                <p className="mt-1 text-sm text-red-500">{validation.errors.targetSystemDescription}</p>
              )}
            </div>
          </div>
        )}

        {/* Selected System Display */}
        {!isNewSystem && data.targetSystemId && (
          <div className={cn('p-4 rounded-lg border', tc.border, tc.bgTertiary)}>
            <div className="flex items-center gap-3">
              <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center bg-coinest-accent-cyan/20')}>
                <Target className="h-5 w-5 text-coinest-accent-cyan" />
              </div>
              <div>
                <p className={cn('font-medium', tc.textPrimary)}>{data.targetSystemName}</p>
                {data.targetSystemDescription && (
                  <p className={cn('text-sm', tc.textMuted)}>{data.targetSystemDescription}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AIConfigurationStep() {
  const tc = useThemeClasses()
  const { data, setData, validation } = useAIConfigStep()

  return (
    <div className="p-6">
      <h2 className={cn('text-xl font-semibold font-urbanist mb-2', tc.textPrimary)}>
        AI Configuration
      </h2>
      <p className={cn('text-sm mb-6', tc.textMuted)}>
        Configure how AI will assist with the compliance assessment.
      </p>

      <div className="space-y-6">
        {/* AI Toggle */}
        <div className={cn('p-4 rounded-lg border flex items-center justify-between', tc.border)}>
          <div>
            <p className={cn('font-medium', tc.textPrimary)}>Enable AI-Assisted Analysis</p>
            <p className={cn('text-sm', tc.textMuted)}>
              Use AI to analyze controls and generate recommendations
            </p>
          </div>
          <button
            onClick={() => setData({ useAI: !data.useAI })}
            className={cn(
              'relative h-6 w-11 rounded-full transition-colors',
              data.useAI ? 'bg-coinest-accent-cyan' : tc.bgTertiary
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                data.useAI ? 'translate-x-5' : 'translate-x-0.5'
              )}
            />
          </button>
        </div>

        {/* AI Model Selection */}
        {data.useAI && (
          <>
            <div>
              <label className={cn('block text-sm font-medium mb-2', tc.textPrimary)}>
                AI Model
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                {AI_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setData({ aiModel: model.id })}
                    className={cn(
                      'p-4 rounded-lg border text-left transition-all',
                      tc.border,
                      data.aiModel === model.id
                        ? 'ring-2 ring-coinest-accent-cyan'
                        : tc.cardHover
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className={cn('font-medium', tc.textPrimary)}>{model.name}</p>
                      {data.aiModel === model.id && (
                        <CheckCircle2 className="h-4 w-4 text-coinest-accent-cyan" />
                      )}
                    </div>
                    <p className={cn('text-sm', tc.textMuted)}>{model.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Include Recommendations */}
            <div className={cn('p-4 rounded-lg border flex items-center justify-between', tc.border)}>
              <div>
                <p className={cn('font-medium', tc.textPrimary)}>Generate Recommendations</p>
                <p className={cn('text-sm', tc.textMuted)}>
                  Include actionable recommendations for non-compliant controls
                </p>
              </div>
              <button
                onClick={() => setData({ includeRecommendations: !data.includeRecommendations })}
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  data.includeRecommendations ? 'bg-coinest-accent-cyan' : tc.bgTertiary
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                    data.includeRecommendations ? 'translate-x-5' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>

            {/* Confidence Threshold */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', tc.textPrimary)}>
                Confidence Threshold: {data.confidenceThreshold}%
              </label>
              <p className={cn('text-sm mb-3', tc.textMuted)}>
                Minimum confidence level for AI-generated findings
              </p>
              <input
                type="range"
                min="0"
                max="100"
                value={data.confidenceThreshold}
                onChange={(e) => setData({ confidenceThreshold: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className={cn('flex justify-between text-xs', tc.textMuted)}>
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </>
        )}

        {!data.useAI && (
          <div className={cn('p-4 rounded-lg', tc.infoBanner)}>
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-coinest-accent-cyan shrink-0 mt-0.5" />
              <div>
                <p className={cn('font-medium', tc.textPrimary)}>Manual Assessment Mode</p>
                <p className={cn('text-sm', tc.textMuted)}>
                  The assessment will be created without AI assistance. You can manually evaluate
                  each control and add evidence.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ReviewLaunchStep({ onComplete }: { onComplete: () => void }) {
  const router = useRouter()
  const tc = useThemeClasses()
  const {
    formData,
    validation,
    isSubmitting,
    submitError,
    setSubmitting,
    setSubmitError,
    buildAssessmentInput,
    validateAll,
  } = useReviewStep()

  const handleLaunch = async () => {
    if (!validateAll()) {
      return
    }

    const input = buildAssessmentInput()
    if (!input) {
      setSubmitError('Invalid form data')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const response = await complianceApi.createAssessment(input)
      if (response.success && response.data) {
        // If AI is enabled, also run the assessment
        if (formData.aiConfig.useAI) {
          await complianceApi.runAssessment(response.data.id, {
            useAI: formData.aiConfig.useAI,
            aiModel: formData.aiConfig.aiModel,
            includeRecommendations: formData.aiConfig.includeRecommendations,
          })
        }

        onComplete()
        router.push(`/compliance/assessments/${response.data.id}`)
      } else {
        setSubmitError('Failed to create assessment')
      }
    } catch (err) {
      console.error('Failed to create assessment:', err)
      setSubmitError(err instanceof Error ? err.message : 'Failed to create assessment')
    } finally {
      setSubmitting(false)
    }
  }

  const frameworkConfig = formData.framework.frameworkId
    ? FRAMEWORK_CONFIG[formData.framework.frameworkId]
    : null

  return (
    <div className="p-6">
      <h2 className={cn('text-xl font-semibold font-urbanist mb-2', tc.textPrimary)}>
        Review & Launch
      </h2>
      <p className={cn('text-sm mb-6', tc.textMuted)}>
        Review your assessment configuration before launching.
      </p>

      {submitError && (
        <div className={cn('mb-6 p-4 rounded-lg flex items-center gap-3', 'bg-red-500/20')}>
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div>
            <p className="font-medium text-red-400">Error</p>
            <p className="text-sm text-red-400/80">{submitError}</p>
          </div>
        </div>
      )}

      {!validation.isValid && (
        <div className={cn('mb-6 p-4 rounded-lg', 'bg-yellow-500/20')}>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-400">Incomplete Configuration</p>
              <ul className="mt-2 space-y-1 text-sm text-yellow-400/80">
                {Object.entries(validation.errors).map(([key, error]) => (
                  <li key={key}>- {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Framework */}
        <div className={cn('p-4 rounded-lg border', tc.border)}>
          <div className="flex items-center justify-between mb-2">
            <span className={cn('text-sm font-medium', tc.textMuted)}>Framework</span>
            <Link href="#" onClick={() => {}} className={cn('text-sm', tc.accentCyan)}>
              Edit
            </Link>
          </div>
          {frameworkConfig ? (
            <div className="flex items-center gap-3">
              <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', frameworkConfig.color)}>
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className={cn('font-medium', tc.textPrimary)}>{frameworkConfig.name}</p>
                <p className={cn('text-sm', tc.textMuted)}>{frameworkConfig.controlCount} controls</p>
              </div>
            </div>
          ) : (
            <p className="text-red-400">No framework selected</p>
          )}
        </div>

        {/* Scope */}
        <div className={cn('p-4 rounded-lg border', tc.border)}>
          <div className="flex items-center justify-between mb-2">
            <span className={cn('text-sm font-medium', tc.textMuted)}>Target System</span>
            <Link href="#" onClick={() => {}} className={cn('text-sm', tc.accentCyan)}>
              Edit
            </Link>
          </div>
          {formData.scope.targetSystemName ? (
            <div className="flex items-center gap-3">
              <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center bg-coinest-accent-cyan/20')}>
                <Target className="h-5 w-5 text-coinest-accent-cyan" />
              </div>
              <div>
                <p className={cn('font-medium', tc.textPrimary)}>{formData.scope.targetSystemName}</p>
                {formData.scope.targetSystemDescription && (
                  <p className={cn('text-sm', tc.textMuted)}>{formData.scope.targetSystemDescription}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-red-400">No target system defined</p>
          )}
        </div>

        {/* AI Configuration */}
        <div className={cn('p-4 rounded-lg border', tc.border)}>
          <div className="flex items-center justify-between mb-2">
            <span className={cn('text-sm font-medium', tc.textMuted)}>AI Configuration</span>
            <Link href="#" onClick={() => {}} className={cn('text-sm', tc.accentCyan)}>
              Edit
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-10 w-10 rounded-lg flex items-center justify-center',
                formData.aiConfig.useAI ? 'bg-green-500/20' : tc.bgTertiary
              )}
            >
              <Cpu className={cn('h-5 w-5', formData.aiConfig.useAI ? 'text-green-400' : tc.textMuted)} />
            </div>
            <div>
              <p className={cn('font-medium', tc.textPrimary)}>
                {formData.aiConfig.useAI ? 'AI-Assisted Assessment' : 'Manual Assessment'}
              </p>
              {formData.aiConfig.useAI && (
                <p className={cn('text-sm', tc.textMuted)}>
                  {AI_MODELS.find((m) => m.id === formData.aiConfig.aiModel)?.name} |{' '}
                  {formData.aiConfig.confidenceThreshold}% threshold
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Launch Button */}
      <div className="mt-8">
        <button
          onClick={handleLaunch}
          disabled={isSubmitting || !validation.isValid}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors',
            tc.buttonPrimary,
            (isSubmitting || !validation.isValid) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Creating Assessment...
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              Launch Assessment
            </>
          )}
        </button>
      </div>
    </div>
  )
}