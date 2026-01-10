/**
 * Compliance Engine API Client
 *
 * API client for the Nexus Compliance Engine plugin providing:
 * - Framework and control management
 * - Dashboard and visualization data
 * - Ethical tensions management
 * - Z-Inspection report handling
 * - Regulatory monitoring
 *
 * IMPORTANT: Types are imported from @/types/compliance - do NOT duplicate here.
 */

import { api } from './api'

// Re-export all types from the centralized types module
export type {
  FrameworkId,
  TrustworthyAIRequirement,
  RiskLevel,
  ControlStatus,
  AlertSeverity,
  AlertType,
  TensionSeverity,
  TensionStatus,
  ZInspectionStatus,
  RegulatoryUpdateStatus,
  RegulatoryUpdateType,
  ComplianceFramework,
  ComplianceControl,
  DashboardKPIs,
  FrameworkScore,
  RequirementScore,
  RiskDistribution,
  ComplianceAlert,
  DashboardData,
  EthicalTension,
  ZInspectionReport,
  ZInspectionFinding,
  RegulatorySource,
  RegulatoryUpdate,
  TrustworthinessAssessment,
  RequirementAssessmentDetail,
  ApiResponse,
  CreateTensionInput,
  UpdateTensionInput,
  // Assessment types
  AssessmentStatus,
  FindingStatus,
  FindingSeverity,
  EvidenceType,
  Assessment,
  AssessmentFinding,
  EvidenceItem,
  RemediationPlan,
  CreateAssessmentInput,
  RunAssessmentInput,
  UpdateFindingInput,
  CreateEvidenceInput,
  CreateRemediationPlanInput,
  AssessmentListResponse,
  FindingListResponse,
  PaginatedResponse,
  // Report types
  ReportType,
  ReportFormat,
  ComplianceReport,
  GenerateReportInput,
  // AI System types
  AISystem,
} from '@/types/compliance'

// Import types for use in this file
import type {
  FrameworkId,
  TrustworthyAIRequirement,
  RiskLevel,
  ControlStatus,
  TensionSeverity,
  TensionStatus,
  ZInspectionStatus,
  RegulatoryUpdateStatus,
  RegulatoryUpdateType,
  ComplianceControl,
  DashboardData,
  DashboardKPIs,
  FrameworkScore,
  RequirementScore,
  RiskDistribution,
  ComplianceAlert,
  EthicalTension,
  ZInspectionReport,
  ZInspectionFinding,
  RegulatorySource,
  RegulatoryUpdate,
  ApiResponse,
  CreateTensionInput,
  UpdateTensionInput,
  // Assessment types
  AssessmentStatus,
  Assessment,
  AssessmentFinding,
  EvidenceItem,
  RemediationPlan,
  CreateAssessmentInput,
  RunAssessmentInput,
  UpdateFindingInput,
  CreateEvidenceInput,
  CreateRemediationPlanInput,
  AssessmentListResponse,
  FindingListResponse,
  // Report types
  ReportType,
  ReportFormat,
  ComplianceReport,
  GenerateReportInput,
  // AI System types
  AISystem,
} from '@/types/compliance'

// Re-export type guards and constants for convenience
export {
  isFrameworkId,
  isTrustworthyAIRequirement,
  isRiskLevel,
  isTensionSeverity,
  isTensionStatus,
  isControlStatus,
  FRAMEWORK_IDS,
  TRUSTWORTHY_AI_REQUIREMENTS,
  TRUSTWORTHY_AI_REQUIREMENT_LABELS,
  RISK_LEVELS,
  TENSION_SEVERITIES,
  TENSION_STATUSES,
  CONTROL_STATUSES,
  validate,
  validateOrThrow,
  getFieldErrors,
  CreateTensionInputSchema,
  UpdateTensionInputSchema,
} from '@/types/compliance'

// ============================================================================
// API Client
// ============================================================================

export const complianceApi = {
  // ========== Dashboard ==========
  getDashboard: () =>
    api.get<ApiResponse<DashboardData>>('/dashboard').then(r => r.data),

  getKPIs: () =>
    api.get<ApiResponse<DashboardKPIs>>('/dashboard/kpis').then(r => r.data),

  getFrameworkScores: () =>
    api.get<ApiResponse<FrameworkScore[]>>('/dashboard/frameworks').then(r => r.data),

  getRequirementScores: () =>
    api.get<ApiResponse<RequirementScore[]>>('/dashboard/requirements').then(r => r.data),

  getRecentAlerts: (limit = 10) =>
    api.get<ApiResponse<ComplianceAlert[]>>(`/dashboard/alerts?limit=${limit}`).then(r => r.data),

  acknowledgeAlert: (alertId: string) =>
    api.post<ApiResponse<ComplianceAlert>>(`/dashboard/alerts/${alertId}/acknowledge`).then(r => r.data),

  getRiskDistribution: () =>
    api.get<ApiResponse<RiskDistribution[]>>('/dashboard/risk-distribution').then(r => r.data),

  // ========== Controls ==========
  listControls: (params?: {
    frameworks?: FrameworkId[]
    riskLevels?: RiskLevel[]
    statuses?: ControlStatus[]
    requirements?: TrustworthyAIRequirement[]
    search?: string
    page?: number
    pageSize?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.frameworks?.length) searchParams.set('frameworks', params.frameworks.join(','))
    if (params?.riskLevels?.length) searchParams.set('riskLevels', params.riskLevels.join(','))
    if (params?.statuses?.length) searchParams.set('statuses', params.statuses.join(','))
    if (params?.requirements?.length) searchParams.set('requirements', params.requirements.join(','))
    if (params?.search) searchParams.set('search', params.search)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize))
    const qs = searchParams.toString()
    return api.get<ApiResponse<ComplianceControl[]>>(`/controls${qs ? `?${qs}` : ''}`).then(r => r.data)
  },

  getControl: (controlId: string) =>
    api.get<ApiResponse<ComplianceControl>>(`/controls/${controlId}`).then(r => r.data),

  getControlStats: () =>
    api.get<ApiResponse<{
      total: number
      byStatus: Record<ControlStatus, number>
      byRiskLevel: Record<RiskLevel, number>
      byFramework: Record<FrameworkId, number>
    }>>('/controls/stats').then(r => r.data),

  updateControlStatus: (controlId: string, status: ControlStatus, evidence?: string) =>
    api.patch<ApiResponse<ComplianceControl>>(`/controls/${controlId}/status`, { status, evidence }).then(r => r.data),

  addControlEvidence: (controlId: string, evidence: string) =>
    api.post<ApiResponse<ComplianceControl>>(`/controls/${controlId}/evidence`, { evidence }).then(r => r.data),

  // ========== Tensions ==========
  listTensions: (params?: {
    severities?: TensionSeverity[]
    statuses?: TensionStatus[]
    requirements?: TrustworthyAIRequirement[]
    aiSystemId?: string
    page?: number
    pageSize?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.severities?.length) searchParams.set('severities', params.severities.join(','))
    if (params?.statuses?.length) searchParams.set('statuses', params.statuses.join(','))
    if (params?.requirements?.length) searchParams.set('requirements', params.requirements.join(','))
    if (params?.aiSystemId) searchParams.set('aiSystemId', params.aiSystemId)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize))
    const qs = searchParams.toString()
    return api.get<ApiResponse<EthicalTension[]>>(`/tensions${qs ? `?${qs}` : ''}`).then(r => r.data)
  },

  getTension: (tensionId: string) =>
    api.get<ApiResponse<EthicalTension>>(`/tensions/${tensionId}`).then(r => r.data),

  getTensionStats: () =>
    api.get<ApiResponse<{
      total: number
      bySeverity: Record<TensionSeverity, number>
      byStatus: Record<TensionStatus, number>
    }>>('/tensions/stats').then(r => r.data),

  createTension: (data: CreateTensionInput) =>
    api.post<ApiResponse<EthicalTension>>('/tensions', data).then(r => r.data),

  updateTension: (tensionId: string, data: UpdateTensionInput) =>
    api.patch<ApiResponse<EthicalTension>>(`/tensions/${tensionId}`, data).then(r => r.data),

  deleteTension: (tensionId: string) =>
    api.delete(`/tensions/${tensionId}`),

  // ========== Z-Inspection ==========
  listZInspectionReports: (params?: {
    statuses?: ZInspectionStatus[]
    aiSystemId?: string
    page?: number
    pageSize?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.statuses?.length) searchParams.set('statuses', params.statuses.join(','))
    if (params?.aiSystemId) searchParams.set('aiSystemId', params.aiSystemId)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize))
    const qs = searchParams.toString()
    return api.get<ApiResponse<ZInspectionReport[]>>(`/z-inspection${qs ? `?${qs}` : ''}`).then(r => r.data)
  },

  getZInspectionReport: (reportId: string) =>
    api.get<ApiResponse<{ report: ZInspectionReport; findings: ZInspectionFinding[] }>>(`/z-inspection/${reportId}`).then(r => r.data),

  getZInspectionStats: () =>
    api.get<ApiResponse<{
      totalReports: number
      totalFindings: number
      mappedControls: number
      byStatus: Record<ZInspectionStatus, number>
    }>>('/z-inspection/stats').then(r => r.data),

  importZInspectionReport: (data: {
    title: string
    aiSystemId?: string
    aiSystemName?: string
    reportContent?: string
    findings?: Array<{
      category: string
      description: string
      severity: RiskLevel
      affectedRequirement?: TrustworthyAIRequirement
      recommendation?: string
    }>
  }) => api.post<ApiResponse<ZInspectionReport>>('/z-inspection', data).then(r => r.data),

  updateZInspectionStatus: (reportId: string, status: ZInspectionStatus) =>
    api.patch<ApiResponse<ZInspectionReport>>(`/z-inspection/${reportId}/status`, { status }).then(r => r.data),

  mapFindingsToControls: (reportId: string, mappings: Array<{ findingId: string; controlIds: string[] }>) =>
    api.post<ApiResponse<{ mapped: boolean }>>(`/z-inspection/${reportId}/map`, { mappings }).then(r => r.data),

  deleteZInspectionReport: (reportId: string) =>
    api.delete(`/z-inspection/${reportId}`),

  // ========== Regulatory ==========
  listRegulatorySources: () =>
    api.get<ApiResponse<RegulatorySource[]>>('/regulatory/sources').then(r => r.data),

  createRegulatorySource: (data: {
    name: string
    sourceType: 'official_journal' | 'regulator_website' | 'standards_body' | 'rss' | 'api'
    url: string
    jurisdiction: string
    frameworkIds: FrameworkId[]
    checkFrequency?: 'hourly' | 'daily' | 'weekly'
  }) => api.post<ApiResponse<RegulatorySource>>('/regulatory/sources', data).then(r => r.data),

  deleteRegulatorySource: (sourceId: string) =>
    api.delete(`/regulatory/sources/${sourceId}`),

  listRegulatoryUpdates: (params?: {
    types?: RegulatoryUpdateType[]
    statuses?: RegulatoryUpdateStatus[]
    frameworkId?: FrameworkId
    page?: number
    pageSize?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.types?.length) searchParams.set('types', params.types.join(','))
    if (params?.statuses?.length) searchParams.set('statuses', params.statuses.join(','))
    if (params?.frameworkId) searchParams.set('frameworkId', params.frameworkId)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize))
    const qs = searchParams.toString()
    return api.get<ApiResponse<RegulatoryUpdate[]>>(`/regulatory/updates${qs ? `?${qs}` : ''}`).then(r => r.data)
  },

  getRegulatoryStats: () =>
    api.get<ApiResponse<{
      totalUpdates: number
      byStatus: Record<RegulatoryUpdateStatus, number>
      byType: Record<RegulatoryUpdateType, number>
    }>>('/regulatory/stats').then(r => r.data),

  createRegulatoryUpdate: (data: {
    sourceName: string
    sourceId?: string
    frameworkId?: FrameworkId
    updateType: RegulatoryUpdateType
    title: string
    summary?: string
    originalUrl?: string
    effectiveDate?: string
    impact?: string
  }) => api.post<ApiResponse<RegulatoryUpdate>>('/regulatory/updates', data).then(r => r.data),

  updateRegulatoryStatus: (updateId: string, status: RegulatoryUpdateStatus) =>
    api.patch<ApiResponse<RegulatoryUpdate>>(`/regulatory/updates/${updateId}/status`, { status }).then(r => r.data),

  // ========== Assessments ==========
  listAssessments: (params?: {
    frameworkId?: FrameworkId
    status?: AssessmentStatus
    targetSystemId?: string
    page?: number
    limit?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.frameworkId) searchParams.set('frameworkId', params.frameworkId)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.targetSystemId) searchParams.set('targetSystemId', params.targetSystemId)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    const qs = searchParams.toString()
    return api.get<ApiResponse<AssessmentListResponse>>(`/assessments${qs ? `?${qs}` : ''}`).then(r => r.data)
  },

  getAssessment: (assessmentId: string) =>
    api.get<ApiResponse<Assessment>>(`/assessments/${assessmentId}`).then(r => r.data),

  createAssessment: (data: CreateAssessmentInput) =>
    api.post<ApiResponse<Assessment>>('/assessments', data).then(r => r.data),

  runAssessment: (assessmentId: string, options?: RunAssessmentInput) =>
    api.post<ApiResponse<Assessment>>(`/assessments/${assessmentId}/run`, options || {}).then(r => r.data),

  cancelAssessment: (assessmentId: string) =>
    api.post<ApiResponse<Assessment>>(`/assessments/${assessmentId}/cancel`).then(r => r.data),

  deleteAssessment: (assessmentId: string) =>
    api.delete(`/assessments/${assessmentId}`),

  getAssessmentStats: () =>
    api.get<ApiResponse<{
      total: number
      byStatus: Record<AssessmentStatus, number>
      byFramework: Record<FrameworkId, number>
      averageScore: number
    }>>('/assessments/stats').then(r => r.data),

  // ========== Findings ==========
  listFindings: (params?: {
    assessmentId?: string
    status?: string
    severity?: string
    controlId?: string
    page?: number
    limit?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.assessmentId) searchParams.set('assessmentId', params.assessmentId)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.severity) searchParams.set('severity', params.severity)
    if (params?.controlId) searchParams.set('controlId', params.controlId)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    const qs = searchParams.toString()
    return api.get<ApiResponse<FindingListResponse>>(`/assessments/findings${qs ? `?${qs}` : ''}`).then(r => r.data)
  },

  getFinding: (findingId: string) =>
    api.get<ApiResponse<AssessmentFinding>>(`/assessments/findings/${findingId}`).then(r => r.data),

  updateFinding: (findingId: string, data: UpdateFindingInput) =>
    api.patch<ApiResponse<AssessmentFinding>>(`/assessments/findings/${findingId}`, data).then(r => r.data),

  getAssessmentFindings: (assessmentId: string, params?: {
    status?: string
    severity?: string
    page?: number
    limit?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.severity) searchParams.set('severity', params.severity)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    const qs = searchParams.toString()
    return api.get<ApiResponse<FindingListResponse>>(`/assessments/${assessmentId}/findings${qs ? `?${qs}` : ''}`).then(r => r.data)
  },

  // ========== Evidence ==========
  listEvidence: (params?: {
    controlId?: string
    findingId?: string
    assessmentId?: string
    type?: string
    status?: string
    page?: number
    limit?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.controlId) searchParams.set('controlId', params.controlId)
    if (params?.findingId) searchParams.set('findingId', params.findingId)
    if (params?.assessmentId) searchParams.set('assessmentId', params.assessmentId)
    if (params?.type) searchParams.set('type', params.type)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    const qs = searchParams.toString()
    return api.get<ApiResponse<{ data: EvidenceItem[]; total: number }>>(`/evidence${qs ? `?${qs}` : ''}`).then(r => r.data)
  },

  getEvidence: (evidenceId: string) =>
    api.get<ApiResponse<EvidenceItem>>(`/evidence/${evidenceId}`).then(r => r.data),

  createEvidence: (data: CreateEvidenceInput) =>
    api.post<ApiResponse<EvidenceItem>>('/evidence', data).then(r => r.data),

  updateEvidenceStatus: (evidenceId: string, status: 'approved' | 'rejected', reviewNotes?: string) =>
    api.patch<ApiResponse<EvidenceItem>>(`/evidence/${evidenceId}/status`, { status, reviewNotes }).then(r => r.data),

  linkEvidenceToFinding: (evidenceId: string, findingId: string) =>
    api.patch<ApiResponse<EvidenceItem>>(`/evidence/${evidenceId}/link-finding`, { findingId }).then(r => r.data),

  deleteEvidence: (evidenceId: string) =>
    api.delete(`/evidence/${evidenceId}`),

  uploadEvidence: (formData: FormData) =>
    api.post<ApiResponse<EvidenceItem>>('/evidence/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),

  getEvidenceStats: () =>
    api.get<ApiResponse<{
      total: number
      byType: Record<string, number>
      byStatus: Record<string, number>
      pendingReview: number
      expiringWithin30Days: number
    }>>('/evidence/stats').then(r => r.data),

  getExpiringEvidence: (days = 30) =>
    api.get<ApiResponse<EvidenceItem[]>>(`/evidence/expiring?days=${days}`).then(r => r.data),

  // ========== Remediation Plans ==========
  listRemediationPlans: (params?: {
    findingId?: string
    status?: string
    priority?: string
    assignedTo?: string
    page?: number
    limit?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.findingId) searchParams.set('findingId', params.findingId)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.priority) searchParams.set('priority', params.priority)
    if (params?.assignedTo) searchParams.set('assignedTo', params.assignedTo)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    const qs = searchParams.toString()
    return api.get<ApiResponse<{ data: RemediationPlan[]; total: number }>>(`/remediation${qs ? `?${qs}` : ''}`).then(r => r.data)
  },

  getRemediationPlan: (planId: string) =>
    api.get<ApiResponse<RemediationPlan>>(`/remediation/${planId}`).then(r => r.data),

  createRemediationPlan: (data: CreateRemediationPlanInput) =>
    api.post<ApiResponse<RemediationPlan>>('/remediation', data).then(r => r.data),

  updateRemediationPlan: (planId: string, data: Partial<CreateRemediationPlanInput>) =>
    api.patch<ApiResponse<RemediationPlan>>(`/remediation/${planId}`, data).then(r => r.data),

  updateRemediationStatus: (planId: string, status: string) =>
    api.patch<ApiResponse<RemediationPlan>>(`/remediation/${planId}/status`, { status }).then(r => r.data),

  completeRemediationTask: (planId: string, taskId: string) =>
    api.patch<ApiResponse<RemediationPlan>>(`/remediation/${planId}/tasks/${taskId}/complete`).then(r => r.data),

  deleteRemediationPlan: (planId: string) =>
    api.delete(`/remediation/${planId}`),

  // ========== Reports ==========
  listReports: (params?: {
    assessmentId?: string
    reportType?: ReportType
    status?: string
    page?: number
    limit?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.assessmentId) searchParams.set('assessmentId', params.assessmentId)
    if (params?.reportType) searchParams.set('reportType', params.reportType)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    const qs = searchParams.toString()
    return api.get<ApiResponse<{ data: ComplianceReport[]; total: number }>>(`/reports${qs ? `?${qs}` : ''}`).then(r => r.data)
  },

  getReport: (reportId: string) =>
    api.get<ApiResponse<ComplianceReport>>(`/reports/${reportId}`).then(r => r.data),

  generateReport: (data: GenerateReportInput) =>
    api.post<ApiResponse<ComplianceReport>>('/reports/generate', data).then(r => r.data),

  downloadReport: (reportId: string) =>
    api.get<Blob>(`/reports/${reportId}/download`, { responseType: 'blob' }).then(r => r),

  deleteReport: (reportId: string) =>
    api.delete(`/reports/${reportId}`),

  // ========== AI Systems ==========
  listAISystems: (params?: {
    status?: string
    riskCategory?: string
    page?: number
    limit?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.riskCategory) searchParams.set('riskCategory', params.riskCategory)
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    const qs = searchParams.toString()
    return api.get<ApiResponse<{ data: AISystem[]; total: number }>>(`/ai-systems${qs ? `?${qs}` : ''}`).then(r => r.data)
  },

  getAISystem: (systemId: string) =>
    api.get<ApiResponse<AISystem>>(`/ai-systems/${systemId}`).then(r => r.data),

  createAISystem: (data: {
    name: string
    description?: string
    riskCategory?: 'unacceptable' | 'high' | 'limited' | 'minimal'
    owner?: string
  }) => api.post<ApiResponse<AISystem>>('/ai-systems', data).then(r => r.data),

  updateAISystem: (systemId: string, data: Partial<{
    name: string
    description: string
    riskCategory: 'unacceptable' | 'high' | 'limited' | 'minimal'
    status: 'active' | 'inactive' | 'archived'
    owner: string
  }>) => api.patch<ApiResponse<AISystem>>(`/ai-systems/${systemId}`, data).then(r => r.data),

  deleteAISystem: (systemId: string) =>
    api.delete(`/ai-systems/${systemId}`),
}

export default complianceApi