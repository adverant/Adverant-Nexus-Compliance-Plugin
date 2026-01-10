/**
 * Assessment Wizard Store (Zustand)
 *
 * Manages the multi-step assessment creation wizard state with:
 * - Step navigation (Framework → Scope → AI Config → Review)
 * - Form data persistence
 * - Validation state
 * - localStorage persistence for recovery
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  FrameworkId,
  CreateAssessmentInput,
} from '@/types/compliance'

// ============================================================================
// Types
// ============================================================================

export type WizardStep = 'framework' | 'scope' | 'ai-config' | 'review'

export const WIZARD_STEPS: WizardStep[] = ['framework', 'scope', 'ai-config', 'review']

export const WIZARD_STEP_LABELS: Record<WizardStep, string> = {
  framework: 'Select Framework',
  scope: 'Define Scope',
  'ai-config': 'AI Configuration',
  review: 'Review & Launch',
}

export const WIZARD_STEP_DESCRIPTIONS: Record<WizardStep, string> = {
  framework: 'Choose the compliance framework for your assessment',
  scope: 'Define the target system and assessment scope',
  'ai-config': 'Configure AI-assisted analysis settings',
  review: 'Review configuration and launch the assessment',
}

/** Framework selection step data */
export interface FrameworkStepData {
  frameworkId: FrameworkId | null
}

/** Scope definition step data */
export interface ScopeStepData {
  targetSystemId: string
  targetSystemName: string
  targetSystemDescription: string
  scope: string[] // Control categories/requirements to assess
  excludedControls: string[] // Controls to exclude from assessment
}

/** AI configuration step data */
export interface AIConfigStepData {
  useAI: boolean
  aiModel: string
  includeRecommendations: boolean
  confidenceThreshold: number // 0-100
}

/** Complete wizard form data */
export interface WizardFormData {
  framework: FrameworkStepData
  scope: ScopeStepData
  aiConfig: AIConfigStepData
}

/** Step validation state */
export interface StepValidation {
  isValid: boolean
  errors: Record<string, string>
}

interface AssessmentWizardState {
  /** Current wizard step */
  currentStep: WizardStep

  /** Form data for each step */
  formData: WizardFormData

  /** Validation state for each step */
  validation: Record<WizardStep, StepValidation>

  /** Whether the wizard is currently submitting */
  isSubmitting: boolean

  /** Submission error message */
  submitError: string | null

  /** Whether wizard has unsaved changes */
  isDirty: boolean
}

interface AssessmentWizardActions {
  /** Navigate to a specific step */
  goToStep: (step: WizardStep) => void

  /** Navigate to the next step */
  nextStep: () => void

  /** Navigate to the previous step */
  prevStep: () => void

  /** Update framework step data */
  setFrameworkData: (data: Partial<FrameworkStepData>) => void

  /** Update scope step data */
  setScopeData: (data: Partial<ScopeStepData>) => void

  /** Update AI config step data */
  setAIConfigData: (data: Partial<AIConfigStepData>) => void

  /** Validate a specific step */
  validateStep: (step: WizardStep) => StepValidation

  /** Validate all steps */
  validateAll: () => boolean

  /** Set submitting state */
  setSubmitting: (isSubmitting: boolean) => void

  /** Set submit error */
  setSubmitError: (error: string | null) => void

  /** Build the final assessment input from form data */
  buildAssessmentInput: () => CreateAssessmentInput | null

  /** Reset wizard to initial state */
  reset: () => void

  /** Mark wizard as clean (no unsaved changes) */
  markClean: () => void
}

type AssessmentWizardStore = AssessmentWizardState & AssessmentWizardActions

// ============================================================================
// Initial State
// ============================================================================

const initialFormData: WizardFormData = {
  framework: {
    frameworkId: null,
  },
  scope: {
    targetSystemId: '',
    targetSystemName: '',
    targetSystemDescription: '',
    scope: [],
    excludedControls: [],
  },
  aiConfig: {
    useAI: true,
    aiModel: 'claude-3-opus',
    includeRecommendations: true,
    confidenceThreshold: 70,
  },
}

const initialValidation: Record<WizardStep, StepValidation> = {
  framework: { isValid: false, errors: {} },
  scope: { isValid: false, errors: {} },
  'ai-config': { isValid: true, errors: {} }, // AI config has defaults, always valid
  review: { isValid: false, errors: {} },
}

const initialState: AssessmentWizardState = {
  currentStep: 'framework',
  formData: initialFormData,
  validation: initialValidation,
  isSubmitting: false,
  submitError: null,
  isDirty: false,
}

// ============================================================================
// Validation Functions
// ============================================================================

function validateFrameworkStep(data: FrameworkStepData): StepValidation {
  const errors: Record<string, string> = {}

  if (!data.frameworkId) {
    errors.frameworkId = 'Please select a compliance framework'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

function validateScopeStep(data: ScopeStepData): StepValidation {
  const errors: Record<string, string> = {}

  if (!data.targetSystemId.trim()) {
    errors.targetSystemId = 'Target system ID is required'
  }

  if (!data.targetSystemName.trim()) {
    errors.targetSystemName = 'Target system name is required'
  } else if (data.targetSystemName.length < 3) {
    errors.targetSystemName = 'Target system name must be at least 3 characters'
  } else if (data.targetSystemName.length > 100) {
    errors.targetSystemName = 'Target system name must be less than 100 characters'
  }

  if (data.targetSystemDescription && data.targetSystemDescription.length > 500) {
    errors.targetSystemDescription = 'Description must be less than 500 characters'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

function validateAIConfigStep(data: AIConfigStepData): StepValidation {
  const errors: Record<string, string> = {}

  if (data.useAI && !data.aiModel) {
    errors.aiModel = 'Please select an AI model'
  }

  if (data.confidenceThreshold < 0 || data.confidenceThreshold > 100) {
    errors.confidenceThreshold = 'Confidence threshold must be between 0 and 100'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

function validateReviewStep(formData: WizardFormData): StepValidation {
  // Review step is valid if all previous steps are valid
  const frameworkValid = validateFrameworkStep(formData.framework).isValid
  const scopeValid = validateScopeStep(formData.scope).isValid
  const aiConfigValid = validateAIConfigStep(formData.aiConfig).isValid

  const errors: Record<string, string> = {}
  if (!frameworkValid) errors.framework = 'Framework selection is incomplete'
  if (!scopeValid) errors.scope = 'Scope definition is incomplete'
  if (!aiConfigValid) errors.aiConfig = 'AI configuration is incomplete'

  return {
    isValid: frameworkValid && scopeValid && aiConfigValid,
    errors,
  }
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useAssessmentWizardStore = create<AssessmentWizardStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      goToStep: (step: WizardStep) => {
        set({ currentStep: step })
      },

      nextStep: () => {
        const { currentStep, validateStep } = get()
        const currentIndex = WIZARD_STEPS.indexOf(currentStep)

        // Validate current step before proceeding
        const validation = validateStep(currentStep)
        if (!validation.isValid) {
          set((state) => ({
            validation: {
              ...state.validation,
              [currentStep]: validation,
            },
          }))
          return
        }

        if (currentIndex < WIZARD_STEPS.length - 1) {
          set({ currentStep: WIZARD_STEPS[currentIndex + 1] })
        }
      },

      prevStep: () => {
        const { currentStep } = get()
        const currentIndex = WIZARD_STEPS.indexOf(currentStep)

        if (currentIndex > 0) {
          set({ currentStep: WIZARD_STEPS[currentIndex - 1] })
        }
      },

      setFrameworkData: (data: Partial<FrameworkStepData>) => {
        set((state) => ({
          formData: {
            ...state.formData,
            framework: { ...state.formData.framework, ...data },
          },
          isDirty: true,
        }))
      },

      setScopeData: (data: Partial<ScopeStepData>) => {
        set((state) => ({
          formData: {
            ...state.formData,
            scope: { ...state.formData.scope, ...data },
          },
          isDirty: true,
        }))
      },

      setAIConfigData: (data: Partial<AIConfigStepData>) => {
        set((state) => ({
          formData: {
            ...state.formData,
            aiConfig: { ...state.formData.aiConfig, ...data },
          },
          isDirty: true,
        }))
      },

      validateStep: (step: WizardStep): StepValidation => {
        const { formData } = get()

        switch (step) {
          case 'framework':
            return validateFrameworkStep(formData.framework)
          case 'scope':
            return validateScopeStep(formData.scope)
          case 'ai-config':
            return validateAIConfigStep(formData.aiConfig)
          case 'review':
            return validateReviewStep(formData)
          default:
            return { isValid: false, errors: {} }
        }
      },

      validateAll: (): boolean => {
        const { formData, validateStep } = get()

        const frameworkValidation = validateStep('framework')
        const scopeValidation = validateStep('scope')
        const aiConfigValidation = validateStep('ai-config')
        const reviewValidation = validateStep('review')

        set({
          validation: {
            framework: frameworkValidation,
            scope: scopeValidation,
            'ai-config': aiConfigValidation,
            review: reviewValidation,
          },
        })

        return (
          frameworkValidation.isValid &&
          scopeValidation.isValid &&
          aiConfigValidation.isValid &&
          reviewValidation.isValid
        )
      },

      setSubmitting: (isSubmitting: boolean) => {
        set({ isSubmitting })
      },

      setSubmitError: (error: string | null) => {
        set({ submitError: error })
      },

      buildAssessmentInput: (): CreateAssessmentInput | null => {
        const { formData, validateAll } = get()

        if (!validateAll()) {
          return null
        }

        if (!formData.framework.frameworkId) {
          return null
        }

        return {
          frameworkId: formData.framework.frameworkId,
          targetSystemId: formData.scope.targetSystemId,
          targetSystemName: formData.scope.targetSystemName,
          targetSystemDescription: formData.scope.targetSystemDescription || undefined,
          scope: formData.scope.scope.length > 0 ? formData.scope.scope : undefined,
          excludedControls:
            formData.scope.excludedControls.length > 0
              ? formData.scope.excludedControls
              : undefined,
        }
      },

      reset: () => {
        set(initialState)
      },

      markClean: () => {
        set({ isDirty: false })
      },
    }),
    {
      name: 'nexus-assessment-wizard',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        formData: state.formData,
        isDirty: state.isDirty,
      }),
    }
  )
)

// ============================================================================
// Convenience Hooks - Direct selectors (no useShallow to avoid bundling issues)
// ============================================================================

/**
 * Hook for wizard navigation state
 */
export const useWizardNavigation = () => {
  const currentStep = useAssessmentWizardStore((state) => state.currentStep)
  const goToStep = useAssessmentWizardStore((state) => state.goToStep)
  const nextStep = useAssessmentWizardStore((state) => state.nextStep)
  const prevStep = useAssessmentWizardStore((state) => state.prevStep)

  const currentStepIndex = WIZARD_STEPS.indexOf(currentStep)

  return {
    currentStep,
    goToStep,
    nextStep,
    prevStep,
    canGoNext: currentStepIndex < WIZARD_STEPS.length - 1,
    canGoPrev: currentStepIndex > 0,
    currentStepIndex,
    totalSteps: WIZARD_STEPS.length,
  }
}

/**
 * Hook for framework step
 */
export const useFrameworkStep = () => {
  const data = useAssessmentWizardStore((state) => state.formData.framework)
  const setData = useAssessmentWizardStore((state) => state.setFrameworkData)
  const validation = useAssessmentWizardStore((state) => state.validation.framework)
  const validateStep = useAssessmentWizardStore((state) => state.validateStep)

  return {
    data,
    setData,
    validation,
    validate: () => validateStep('framework'),
  }
}

/**
 * Hook for scope step
 */
export const useScopeStep = () => {
  const data = useAssessmentWizardStore((state) => state.formData.scope)
  const setData = useAssessmentWizardStore((state) => state.setScopeData)
  const validation = useAssessmentWizardStore((state) => state.validation.scope)
  const validateStep = useAssessmentWizardStore((state) => state.validateStep)

  return {
    data,
    setData,
    validation,
    validate: () => validateStep('scope'),
  }
}

/**
 * Hook for AI config step
 */
export const useAIConfigStep = () => {
  const data = useAssessmentWizardStore((state) => state.formData.aiConfig)
  const setData = useAssessmentWizardStore((state) => state.setAIConfigData)
  const validation = useAssessmentWizardStore((state) => state.validation['ai-config'])
  const validateStep = useAssessmentWizardStore((state) => state.validateStep)

  return {
    data,
    setData,
    validation,
    validate: () => validateStep('ai-config'),
  }
}

/**
 * Hook for review step and submission
 */
export const useReviewStep = () => {
  const formData = useAssessmentWizardStore((state) => state.formData)
  const validation = useAssessmentWizardStore((state) => state.validation.review)
  const isSubmitting = useAssessmentWizardStore((state) => state.isSubmitting)
  const submitError = useAssessmentWizardStore((state) => state.submitError)
  const setSubmitting = useAssessmentWizardStore((state) => state.setSubmitting)
  const setSubmitError = useAssessmentWizardStore((state) => state.setSubmitError)
  const buildAssessmentInput = useAssessmentWizardStore((state) => state.buildAssessmentInput)
  const validateAll = useAssessmentWizardStore((state) => state.validateAll)
  const reset = useAssessmentWizardStore((state) => state.reset)

  return {
    formData,
    validation,
    isSubmitting,
    submitError,
    setSubmitting,
    setSubmitError,
    buildAssessmentInput,
    validateAll,
    reset,
  }
}

/**
 * Hook for checking if wizard has unsaved changes
 */
export const useWizardDirtyState = () => {
  const isDirty = useAssessmentWizardStore((state) => state.isDirty)
  const markClean = useAssessmentWizardStore((state) => state.markClean)
  const reset = useAssessmentWizardStore((state) => state.reset)

  return {
    isDirty,
    markClean,
    reset,
  }
}