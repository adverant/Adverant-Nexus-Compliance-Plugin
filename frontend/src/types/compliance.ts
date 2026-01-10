/**
 * Compliance Types - Single Source of Truth
 *
 * This module provides:
 * - Zod schemas for runtime validation
 * - TypeScript types derived from schemas
 * - Type guard functions for safe type narrowing
 *
 * IMPORTANT: All compliance-related types should be imported from this module.
 * Do NOT duplicate type definitions elsewhere.
 */

import { z } from 'zod'

// ============================================================================
// Framework Types
// ============================================================================

export const FrameworkIdSchema = z.enum([
  'iso_27001',
  'gdpr',
  'eu_ai_act',
  'nis2',
  'soc2',
  'iso_27701',
])
export type FrameworkId = z.infer<typeof FrameworkIdSchema>

export const FRAMEWORK_IDS = FrameworkIdSchema.options
export function isFrameworkId(value: unknown): value is FrameworkId {
  return FrameworkIdSchema.safeParse(value).success
}

// ============================================================================
// Trustworthy AI Requirements (EU 7 Requirements)
// ============================================================================

export const TrustworthyAIRequirementSchema = z.enum([
  'human_agency_oversight',
  'technical_robustness_safety',
  'privacy_data_governance',
  'transparency',
  'diversity_fairness_nondiscrimination',
  'societal_environmental_wellbeing',
  'accountability',
])
export type TrustworthyAIRequirement = z.infer<typeof TrustworthyAIRequirementSchema>

export const TRUSTWORTHY_AI_REQUIREMENTS = TrustworthyAIRequirementSchema.options
export function isTrustworthyAIRequirement(value: unknown): value is TrustworthyAIRequirement {
  return TrustworthyAIRequirementSchema.safeParse(value).success
}

// Human-readable labels for requirements
export const TRUSTWORTHY_AI_REQUIREMENT_LABELS: Record<TrustworthyAIRequirement, string> = {
  human_agency_oversight: 'Human Agency & Oversight',
  technical_robustness_safety: 'Technical Robustness & Safety',
  privacy_data_governance: 'Privacy & Data Governance',
  transparency: 'Transparency',
  diversity_fairness_nondiscrimination: 'Diversity, Fairness & Non-discrimination',
  societal_environmental_wellbeing: 'Societal & Environmental Wellbeing',
  accountability: 'Accountability',
}

// ============================================================================
// Risk & Severity Types
// ============================================================================

export const RiskLevelSchema = z.enum(['critical', 'high', 'medium', 'low'])
export type RiskLevel = z.infer<typeof RiskLevelSchema>

export const RISK_LEVELS = RiskLevelSchema.options
export function isRiskLevel(value: unknown): value is RiskLevel {
  return RiskLevelSchema.safeParse(value).success
}

export const TensionSeveritySchema = z.enum(['critical', 'significant', 'moderate', 'minor'])
export type TensionSeverity = z.infer<typeof TensionSeveritySchema>

export const TENSION_SEVERITIES = TensionSeveritySchema.options
export function isTensionSeverity(value: unknown): value is TensionSeverity {
  return TensionSeveritySchema.safeParse(value).success
}

// ============================================================================
// Status Types
// ============================================================================

export const ControlStatusSchema = z.enum([
  'implemented',
  'in_progress',
  'not_started',
  'not_applicable',
])
export type ControlStatus = z.infer<typeof ControlStatusSchema>

export const CONTROL_STATUSES = ControlStatusSchema.options
export function isControlStatus(value: unknown): value is ControlStatus {
  return ControlStatusSchema.safeParse(value).success
}

export const TensionStatusSchema = z.enum([
  'identified',
  'under_review',
  'mitigated',
  'accepted',
  'unresolved',
])
export type TensionStatus = z.infer<typeof TensionStatusSchema>

export const TENSION_STATUSES = TensionStatusSchema.options
export function isTensionStatus(value: unknown): value is TensionStatus {
  return TensionStatusSchema.safeParse(value).success
}

export const ZInspectionStatusSchema = z.enum(['pending', 'mapped', 'integrated'])
export type ZInspectionStatus = z.infer<typeof ZInspectionStatusSchema>

export const RegulatoryUpdateStatusSchema = z.enum([
  'pending',
  'analyzed',
  'implemented',
  'rejected',
])
export type RegulatoryUpdateStatus = z.infer<typeof RegulatoryUpdateStatusSchema>

export const RegulatoryUpdateTypeSchema = z.enum([
  'new_regulation',
  'amendment',
  'guidance',
  'deadline',
  'enforcement',
])
export type RegulatoryUpdateType = z.infer<typeof RegulatoryUpdateTypeSchema>

// ============================================================================
// Alert Types
// ============================================================================

export const AlertSeveritySchema = z.enum(['critical', 'high', 'medium', 'low'])
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>

export const AlertTypeSchema = z.enum([
  'gap',
  'deadline',
  'update',
  'violation',
  'recommendation',
])
export type AlertType = z.infer<typeof AlertTypeSchema>

// ============================================================================
// Entity Schemas
// ============================================================================

export const ComplianceFrameworkSchema = z.object({
  id: FrameworkIdSchema,
  name: z.string(),
  displayName: z.string(),
  description: z.string(),
  version: z.string(),
  jurisdiction: z.string(),
  controlCount: z.number().int().nonnegative(),
  isActive: z.boolean(),
})
export type ComplianceFramework = z.infer<typeof ComplianceFrameworkSchema>

export const ComplianceControlSchema = z.object({
  id: z.string().uuid(),
  frameworkId: FrameworkIdSchema,
  controlNumber: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  subcategory: z.string().optional(),
  riskLevel: RiskLevelSchema,
  status: ControlStatusSchema,
  implementationGuidance: z.string().optional(),
  evidence: z.array(z.string()).optional(),
  mappedRequirements: z.array(TrustworthyAIRequirementSchema),
  relatedControls: z.array(z.string()),
  lastAssessedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type ComplianceControl = z.infer<typeof ComplianceControlSchema>

export const EthicalTensionSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  valueA: z.string().min(1).max(100),
  valueB: z.string().min(1).max(100),
  severity: TensionSeveritySchema,
  status: TensionStatusSchema,
  description: z.string().min(1).max(5000),
  affectedRequirement: TrustworthyAIRequirementSchema.optional(),
  aiSystemId: z.string().optional(),
  aiSystemName: z.string().optional(),
  mitigationStrategy: z.string().optional(),
  identifiedAt: z.string(),
  identifiedBy: z.string().optional(),
  resolvedAt: z.string().optional(),
  resolvedBy: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type EthicalTension = z.infer<typeof EthicalTensionSchema>

// Input schemas for creating/updating tensions
export const CreateTensionInputSchema = z.object({
  valueA: z.string().min(1, 'Value A is required').max(100, 'Value A must be 100 characters or less'),
  valueB: z.string().min(1, 'Value B is required').max(100, 'Value B must be 100 characters or less'),
  severity: TensionSeveritySchema,
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description must be 5000 characters or less'),
  affectedRequirement: TrustworthyAIRequirementSchema.optional(),
  aiSystemId: z.string().uuid().optional(),
  aiSystemName: z.string().max(255).optional(),
})
export type CreateTensionInput = z.infer<typeof CreateTensionInputSchema>

export const UpdateTensionInputSchema = z.object({
  status: TensionStatusSchema.optional(),
  severity: TensionSeveritySchema.optional(),
  description: z.string().min(10).max(5000).optional(),
  mitigationStrategy: z.string().max(5000).optional(),
})
export type UpdateTensionInput = z.infer<typeof UpdateTensionInputSchema>

// ============================================================================
// Dashboard Types
// ============================================================================

export const DashboardKPIsSchema = z.object({
  overallScore: z.number(),
  scoreChange: z.number(),
  totalControls: z.number().int().nonnegative(),
  implementedControls: z.number().int().nonnegative(),
  criticalGaps: z.number().int().nonnegative(),
  upcomingDeadlines: z.number().int().nonnegative(),
})
export type DashboardKPIs = z.infer<typeof DashboardKPIsSchema>

export const FrameworkScoreSchema = z.object({
  frameworkId: FrameworkIdSchema,
  frameworkName: z.string(),
  score: z.number(),
  controlCount: z.number().int().nonnegative(),
  implementedCount: z.number().int().nonnegative(),
  criticalGaps: z.number().int().nonnegative(),
  lastAssessedAt: z.string().optional(),
})
export type FrameworkScore = z.infer<typeof FrameworkScoreSchema>

export const RequirementScoreSchema = z.object({
  requirement: TrustworthyAIRequirementSchema,
  label: z.string(),
  score: z.number(),
  controlCount: z.number().int().nonnegative(),
  implementedCount: z.number().int().nonnegative(),
})
export type RequirementScore = z.infer<typeof RequirementScoreSchema>

export const RiskDistributionSchema = z.object({
  level: RiskLevelSchema,
  count: z.number().int().nonnegative(),
  percentage: z.number(),
})
export type RiskDistribution = z.infer<typeof RiskDistributionSchema>

export const ComplianceAlertSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  type: AlertTypeSchema,
  severity: AlertSeveritySchema,
  title: z.string(),
  message: z.string(),
  frameworkId: FrameworkIdSchema.optional(),
  controlId: z.string().optional(),
  deadline: z.string().optional(),
  acknowledged: z.boolean(),
  acknowledgedBy: z.string().optional(),
  acknowledgedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type ComplianceAlert = z.infer<typeof ComplianceAlertSchema>

export const DashboardDataSchema = z.object({
  kpis: DashboardKPIsSchema,
  frameworkScores: z.array(FrameworkScoreSchema),
  requirementScores: z.array(RequirementScoreSchema),
  recentAlerts: z.array(ComplianceAlertSchema),
  riskDistribution: z.array(RiskDistributionSchema),
})
export type DashboardData = z.infer<typeof DashboardDataSchema>

// ============================================================================
// Z-Inspection Types
// ============================================================================

export const ZInspectionReportSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  title: z.string(),
  aiSystemId: z.string().optional(),
  aiSystemName: z.string().optional(),
  findingCount: z.number().int().nonnegative(),
  tensionCount: z.number().int().nonnegative(),
  mappedControlCount: z.number().int().nonnegative(),
  status: ZInspectionStatusSchema,
  reportContent: z.string().optional(),
  importedAt: z.string(),
  importedBy: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type ZInspectionReport = z.infer<typeof ZInspectionReportSchema>

export const ZInspectionFindingSchema = z.object({
  id: z.string().uuid(),
  reportId: z.string().uuid(),
  findingNumber: z.number().int().positive(),
  category: z.string(),
  description: z.string(),
  severity: RiskLevelSchema,
  affectedRequirement: TrustworthyAIRequirementSchema.optional(),
  mappedControlIds: z.array(z.string()),
  recommendation: z.string().optional(),
  createdAt: z.string(),
})
export type ZInspectionFinding = z.infer<typeof ZInspectionFindingSchema>

// ============================================================================
// Regulatory Types
// ============================================================================

export const RegulatorySourceTypeSchema = z.enum([
  'official_journal',
  'regulator_website',
  'standards_body',
  'rss',
  'api',
])
export type RegulatorySourceType = z.infer<typeof RegulatorySourceTypeSchema>

export const CheckFrequencySchema = z.enum(['hourly', 'daily', 'weekly'])
export type CheckFrequency = z.infer<typeof CheckFrequencySchema>

export const RegulatorySourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  sourceType: RegulatorySourceTypeSchema,
  url: z.string().url(),
  jurisdiction: z.string(),
  frameworkIds: z.array(FrameworkIdSchema),
  checkFrequency: CheckFrequencySchema,
  lastCheckedAt: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type RegulatorySource = z.infer<typeof RegulatorySourceSchema>

export const RegulatoryUpdateSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  sourceId: z.string().optional(),
  sourceName: z.string(),
  frameworkId: FrameworkIdSchema.optional(),
  updateType: RegulatoryUpdateTypeSchema,
  title: z.string(),
  summary: z.string().optional(),
  originalUrl: z.string().optional(),
  effectiveDate: z.string().optional(),
  status: RegulatoryUpdateStatusSchema,
  impact: z.string().optional(),
  detectedAt: z.string(),
  analyzedAt: z.string().optional(),
  implementedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type RegulatoryUpdate = z.infer<typeof RegulatoryUpdateSchema>

// ============================================================================
// Trustworthiness Assessment Types
// ============================================================================

export const OverallRatingSchema = z.enum([
  'trustworthy',
  'conditionally_trustworthy',
  'not_trustworthy',
  'inconclusive',
])
export type OverallRating = z.infer<typeof OverallRatingSchema>

export const RequirementAssessmentDetailSchema = z.object({
  requirement: TrustworthyAIRequirementSchema,
  label: z.string(),
  score: z.number(),
  rating: z.string(),
  narrative: z.string().optional(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendations: z.array(z.string()),
})
export type RequirementAssessmentDetail = z.infer<typeof RequirementAssessmentDetailSchema>

export const TrustworthinessAssessmentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  aiSystemId: z.string().optional(),
  aiSystemName: z.string(),
  overallRating: OverallRatingSchema,
  overallScore: z.number(),
  overallNarrative: z.string().optional(),
  requirementAssessments: z.array(RequirementAssessmentDetailSchema),
  tensionCount: z.number().int().nonnegative(),
  stakeholderCount: z.number().int().nonnegative(),
  scenarioCount: z.number().int().nonnegative(),
  assessedAt: z.string(),
  assessedBy: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type TrustworthinessAssessment = z.infer<typeof TrustworthinessAssessmentSchema>

// ============================================================================
// API Response Types
// ============================================================================

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
})
export type ApiError = z.infer<typeof ApiErrorSchema>

export const ApiMetaSchema = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
  total: z.number().int().nonnegative().optional(),
  totalPages: z.number().int().nonnegative().optional(),
  timestamp: z.string(),
})
export type ApiMeta = z.infer<typeof ApiMetaSchema>

export function createApiResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: ApiErrorSchema.optional(),
    meta: ApiMetaSchema.optional(),
  })
}

// Generic API response type for use in the API client
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  meta?: ApiMeta
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates data against a Zod schema and returns typed result or throws
 */
export function validateOrThrow<T extends z.ZodType>(
  schema: T,
  data: unknown,
  context?: string
): z.infer<T> {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errors = result.error.errors
      .map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`)
      .join(', ')
    throw new Error(`Validation failed${context ? ` for ${context}` : ''}: ${errors}`)
  }
  return result.data
}

/**
 * Validates data against a Zod schema and returns result object
 */
export function validate<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError['errors'] } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error.errors }
}

/**
 * Extracts field-level errors from Zod validation result
 */
export function getFieldErrors(zodError: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const error of zodError.errors) {
    const path = error.path.join('.')
    if (path && !errors[path]) {
      errors[path] = error.message
    }
  }
  return errors
}

// ============================================================================
// Assessment Types
// ============================================================================

export const AssessmentStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'failed',
  'cancelled',
])
export type AssessmentStatus = z.infer<typeof AssessmentStatusSchema>

export const ASSESSMENT_STATUSES = AssessmentStatusSchema.options
export function isAssessmentStatus(value: unknown): value is AssessmentStatus {
  return AssessmentStatusSchema.safeParse(value).success
}

export const FindingStatusSchema = z.enum([
  'compliant',
  'non_compliant',
  'partial',
  'not_applicable',
  'not_assessed',
])
export type FindingStatus = z.infer<typeof FindingStatusSchema>

export const FINDING_STATUSES = FindingStatusSchema.options
export function isFindingStatus(value: unknown): value is FindingStatus {
  return FindingStatusSchema.safeParse(value).success
}

export const FindingSeveritySchema = z.enum([
  'critical',
  'major',
  'minor',
  'observation',
])
export type FindingSeverity = z.infer<typeof FindingSeveritySchema>

export const FINDING_SEVERITIES = FindingSeveritySchema.options
export function isFindingSeverity(value: unknown): value is FindingSeverity {
  return FindingSeveritySchema.safeParse(value).success
}

export const EvidenceTypeSchema = z.enum([
  'document',
  'screenshot',
  'policy',
  'procedure',
  'interview',
  'test_result',
  'audit_log',
  'config_export',
  'attestation',
  'other',
])
export type EvidenceType = z.infer<typeof EvidenceTypeSchema>

export const EVIDENCE_TYPES = EvidenceTypeSchema.options
export function isEvidenceType(value: unknown): value is EvidenceType {
  return EvidenceTypeSchema.safeParse(value).success
}

// Human-readable labels for evidence types
export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  document: 'Document',
  screenshot: 'Screenshot',
  policy: 'Policy',
  procedure: 'Procedure',
  interview: 'Interview Notes',
  test_result: 'Test Result',
  audit_log: 'Audit Log',
  config_export: 'Config Export',
  attestation: 'Attestation',
  other: 'Other',
}

// ============================================================================
// Assessment Entity Schemas
// ============================================================================

export const AssessmentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  frameworkId: FrameworkIdSchema,
  targetSystemId: z.string(),
  targetSystemName: z.string(),
  targetSystemDescription: z.string().optional(),
  status: AssessmentStatusSchema,
  overallScore: z.number().nullable(),
  controlsAssessed: z.number().int().nonnegative(),
  controlsPassed: z.number().int().nonnegative(),
  controlsFailed: z.number().int().nonnegative(),
  criticalFindings: z.number().int().nonnegative(),
  scope: z.array(z.string()).optional(),
  excludedControls: z.array(z.string()).optional(),
  useAI: z.boolean().default(true),
  aiModel: z.string().optional(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Assessment = z.infer<typeof AssessmentSchema>

export const AssessmentFindingSchema = z.object({
  id: z.string().uuid(),
  assessmentId: z.string().uuid(),
  controlId: z.string(),
  controlNumber: z.string(),
  controlTitle: z.string(),
  status: FindingStatusSchema,
  severity: FindingSeveritySchema.nullable(),
  score: z.number().nullable(),
  aiReasoning: z.string().nullable(),
  recommendation: z.string().nullable(),
  evidence: z.array(z.string()).optional(),
  evidenceCount: z.number().int().nonnegative().default(0),
  remediationPlanId: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type AssessmentFinding = z.infer<typeof AssessmentFindingSchema>

export const EvidenceItemSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  controlId: z.string(),
  findingId: z.string().uuid().nullable(),
  assessmentId: z.string().uuid().nullable(),
  type: EvidenceTypeSchema,
  title: z.string(),
  description: z.string().nullable(),
  filePath: z.string().nullable(),
  fileSize: z.number().nullable(),
  mimeType: z.string().nullable(),
  status: z.enum(['pending', 'approved', 'rejected', 'expired']),
  collectedAt: z.string().nullable(),
  validFrom: z.string().nullable(),
  validUntil: z.string().nullable(),
  uploadedBy: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>

export const RemediationPlanSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  findingId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(['draft', 'in_progress', 'pending_verification', 'verified', 'closed']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  dueDate: z.string().nullable(),
  assignedTo: z.string().nullable(),
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    completed: z.boolean(),
    dueDate: z.string().nullable(),
    assignedTo: z.string().nullable(),
  })).optional(),
  completedAt: z.string().nullable(),
  verifiedAt: z.string().nullable(),
  verifiedBy: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type RemediationPlan = z.infer<typeof RemediationPlanSchema>

// ============================================================================
// Assessment Input Schemas
// ============================================================================

export const CreateAssessmentInputSchema = z.object({
  frameworkId: FrameworkIdSchema,
  targetSystemId: z.string().min(1, 'Target system is required'),
  targetSystemName: z.string().min(1, 'Target system name is required'),
  targetSystemDescription: z.string().optional(),
  scope: z.array(z.string()).optional(),
  excludedControls: z.array(z.string()).optional(),
})
export type CreateAssessmentInput = z.infer<typeof CreateAssessmentInputSchema>

export const RunAssessmentInputSchema = z.object({
  useAI: z.boolean().default(true),
  aiModel: z.string().optional(),
  includeRecommendations: z.boolean().default(true),
})
export type RunAssessmentInput = z.infer<typeof RunAssessmentInputSchema>

export const UpdateFindingInputSchema = z.object({
  status: FindingStatusSchema.optional(),
  severity: FindingSeveritySchema.optional(),
  aiReasoning: z.string().optional(),
  recommendation: z.string().optional(),
})
export type UpdateFindingInput = z.infer<typeof UpdateFindingInputSchema>

export const CreateEvidenceInputSchema = z.object({
  controlId: z.string().min(1, 'Control is required'),
  findingId: z.string().uuid().optional(),
  assessmentId: z.string().uuid().optional(),
  type: EvidenceTypeSchema,
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().optional(),
  filePath: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  collectedAt: z.string().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
})
export type CreateEvidenceInput = z.infer<typeof CreateEvidenceInputSchema>

export const CreateRemediationPlanInputSchema = z.object({
  findingId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
  tasks: z.array(z.object({
    title: z.string().min(1),
    dueDate: z.string().optional(),
    assignedTo: z.string().optional(),
  })).optional(),
})
export type CreateRemediationPlanInput = z.infer<typeof CreateRemediationPlanInputSchema>

// ============================================================================
// Report Types
// ============================================================================

export const ReportTypeSchema = z.enum([
  'executive_summary',
  'full_audit',
  'gap_analysis',
  'remediation_plan',
  'board_presentation',
])
export type ReportType = z.infer<typeof ReportTypeSchema>

export const REPORT_TYPES = ReportTypeSchema.options
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  executive_summary: 'Executive Summary',
  full_audit: 'Full Audit Report',
  gap_analysis: 'Gap Analysis',
  remediation_plan: 'Remediation Plan',
  board_presentation: 'Board Presentation',
}

export const ReportFormatSchema = z.enum(['pdf', 'html', 'markdown', 'json'])
export type ReportFormat = z.infer<typeof ReportFormatSchema>

export const REPORT_FORMATS = ReportFormatSchema.options

export const ComplianceReportSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  assessmentId: z.string().uuid().nullable(),
  reportType: ReportTypeSchema,
  format: ReportFormatSchema,
  title: z.string(),
  status: z.enum(['pending', 'generating', 'completed', 'failed']),
  filePath: z.string().nullable(),
  fileSize: z.number().nullable(),
  generatedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type ComplianceReport = z.infer<typeof ComplianceReportSchema>

export const GenerateReportInputSchema = z.object({
  assessmentId: z.string().uuid().optional(),
  reportType: ReportTypeSchema,
  format: ReportFormatSchema,
  includeEvidence: z.boolean().default(false),
  includeRemediation: z.boolean().default(true),
  recipientEmail: z.string().email().optional(),
})
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>

// ============================================================================
// AI System Types (for target system selection)
// ============================================================================

export const AISystemSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  riskCategory: z.enum(['unacceptable', 'high', 'limited', 'minimal']).nullable(),
  status: z.enum(['active', 'inactive', 'archived']),
  owner: z.string().nullable(),
  deployedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type AISystem = z.infer<typeof AISystemSchema>

// ============================================================================
// Paginated Response Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface AssessmentListResponse {
  data: Assessment[]
  total: number
  page: number
  limit: number
}

export interface FindingListResponse {
  data: AssessmentFinding[]
  total: number
  page: number
  limit: number
}