/**
 * Zod Validation Schemas for Tension Service
 *
 * Provides runtime validation for all tension-related operations.
 * Ensures data integrity before database operations.
 */

import { z } from 'zod';

// ============================================================================
// Enums (must match types/qualitative.ts)
// ============================================================================

export const TensionTypeSchema = z.enum([
  'value_vs_value',
  'stakeholder_vs_stakeholder',
  'requirement_vs_requirement',
  'short_term_vs_long_term',
]);

export const TensionSeveritySchema = z.enum([
  'critical',
  'significant',
  'moderate',
  'minor',
]);

export const TensionStatusSchema = z.enum([
  'identified',
  'under_review',
  'mitigated',
  'accepted',
  'unresolved',
]);

export const ResolutionStatusSchema = z.enum(['mitigated', 'accepted']);

export const TrustworthyAIRequirementIdSchema = z.enum([
  'human_agency_oversight',
  'technical_robustness_safety',
  'privacy_data_governance',
  'transparency',
  'diversity_fairness_nondiscrimination',
  'societal_environmental_wellbeing',
  'accountability',
]);

// ============================================================================
// Input Validation Schemas
// ============================================================================

/**
 * Schema for creating a new tension
 */
export const CreateTensionInputSchema = z.object({
  aiSystemId: z
    .string()
    .uuid('AI System ID must be a valid UUID')
    .min(1, 'AI System ID is required'),

  scenarioId: z.string().uuid('Scenario ID must be a valid UUID').optional(),

  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title cannot exceed 255 characters')
    .trim(),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description cannot exceed 5000 characters')
    .trim(),

  valueA: z
    .string()
    .min(1, 'Value A is required')
    .max(100, 'Value A cannot exceed 100 characters')
    .trim(),

  valueADescription: z
    .string()
    .max(1000, 'Value A description cannot exceed 1000 characters')
    .trim()
    .optional(),

  valueB: z
    .string()
    .min(1, 'Value B is required')
    .max(100, 'Value B cannot exceed 100 characters')
    .trim(),

  valueBDescription: z
    .string()
    .max(1000, 'Value B description cannot exceed 1000 characters')
    .trim()
    .optional(),

  tensionType: TensionTypeSchema,

  requirementA: TrustworthyAIRequirementIdSchema.optional(),
  requirementB: TrustworthyAIRequirementIdSchema.optional(),

  affectedStakeholders: z
    .array(z.string().uuid('Each stakeholder ID must be a valid UUID'))
    .max(50, 'Cannot have more than 50 affected stakeholders')
    .optional()
    .default([]),

  severity: TensionSeveritySchema.optional().default('moderate'),
});

/**
 * Schema for updating an existing tension
 */
export const UpdateTensionInputSchema = CreateTensionInputSchema.partial().omit({
  aiSystemId: true,
});

/**
 * Schema for resolving a tension
 */
export const ResolveTensionInputSchema = z.object({
  resolutionApproach: z
    .string()
    .min(10, 'Resolution approach must be at least 10 characters')
    .max(2000, 'Resolution approach cannot exceed 2000 characters')
    .trim(),

  resolutionRationale: z
    .string()
    .min(10, 'Resolution rationale must be at least 10 characters')
    .max(5000, 'Resolution rationale cannot exceed 5000 characters')
    .trim(),

  tradeOffDecision: z
    .string()
    .max(2000, 'Trade-off decision cannot exceed 2000 characters')
    .trim()
    .optional(),

  residualConcerns: z
    .string()
    .max(2000, 'Residual concerns cannot exceed 2000 characters')
    .trim()
    .optional(),

  newStatus: ResolutionStatusSchema,
});

/**
 * Schema for changing tension status
 */
export const ChangeStatusInputSchema = z.object({
  status: TensionStatusSchema,
});

/**
 * Schema for adding stakeholder perspective
 */
export const StakeholderPerspectiveInputSchema = z.object({
  perspective: z
    .string()
    .min(10, 'Perspective must be at least 10 characters')
    .max(2000, 'Perspective cannot exceed 2000 characters')
    .trim(),

  preferredResolution: z
    .string()
    .max(2000, 'Preferred resolution cannot exceed 2000 characters')
    .trim()
    .optional(),
});

/**
 * Schema for list tensions filter params
 */
export const ListTensionsFilterSchema = z.object({
  tensionType: TensionTypeSchema.optional(),
  severity: TensionSeveritySchema.optional(),
  status: TensionStatusSchema.optional(),
  requirementId: TrustworthyAIRequirementIdSchema.optional(),
  scenarioId: z.string().uuid().optional(),
});

// ============================================================================
// Inferred Types (for type safety)
// ============================================================================

export type ValidatedCreateTensionInput = z.infer<typeof CreateTensionInputSchema>;
export type ValidatedUpdateTensionInput = z.infer<typeof UpdateTensionInputSchema>;
export type ValidatedResolveTensionInput = z.infer<typeof ResolveTensionInputSchema>;
export type ValidatedChangeStatusInput = z.infer<typeof ChangeStatusInputSchema>;
export type ValidatedStakeholderPerspectiveInput = z.infer<typeof StakeholderPerspectiveInputSchema>;
export type ValidatedListTensionsFilter = z.infer<typeof ListTensionsFilterSchema>;

// ============================================================================
// Validation Error Class
// ============================================================================

export class ValidationError extends Error {
  public readonly code: string;
  public readonly fieldErrors: Record<string, string[]>;

  constructor(
    message: string,
    fieldErrors: Record<string, string[]> = {}
  ) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
    this.fieldErrors = fieldErrors;
  }

  static fromZodError(error: z.ZodError): ValidationError {
    const fieldErrors: Record<string, string[]> = {};

    for (const issue of error.issues) {
      const path = issue.path.join('.') || '_root';
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    }

    const firstError = error.issues[0];
    const message = firstError
      ? `${firstError.path.join('.')}: ${firstError.message}`
      : 'Validation failed';

    return new ValidationError(message, fieldErrors);
  }
}

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validate input and return validated data or throw ValidationError
 */
export function validateCreateTensionInput(input: unknown): ValidatedCreateTensionInput {
  const result = CreateTensionInputSchema.safeParse(input);
  if (!result.success) {
    throw ValidationError.fromZodError(result.error);
  }
  return result.data;
}

export function validateUpdateTensionInput(input: unknown): ValidatedUpdateTensionInput {
  const result = UpdateTensionInputSchema.safeParse(input);
  if (!result.success) {
    throw ValidationError.fromZodError(result.error);
  }
  return result.data;
}

export function validateResolveTensionInput(input: unknown): ValidatedResolveTensionInput {
  const result = ResolveTensionInputSchema.safeParse(input);
  if (!result.success) {
    throw ValidationError.fromZodError(result.error);
  }
  return result.data;
}

export function validateChangeStatusInput(input: unknown): ValidatedChangeStatusInput {
  const result = ChangeStatusInputSchema.safeParse(input);
  if (!result.success) {
    throw ValidationError.fromZodError(result.error);
  }
  return result.data;
}

export function validateStakeholderPerspectiveInput(input: unknown): ValidatedStakeholderPerspectiveInput {
  const result = StakeholderPerspectiveInputSchema.safeParse(input);
  if (!result.success) {
    throw ValidationError.fromZodError(result.error);
  }
  return result.data;
}

export function validateListTensionsFilter(input: unknown): ValidatedListTensionsFilter {
  const result = ListTensionsFilterSchema.safeParse(input);
  if (!result.success) {
    throw ValidationError.fromZodError(result.error);
  }
  return result.data;
}