/**
 * Compliance Engine API Client
 *
 * API client for the Nexus Compliance Engine plugin providing:
 * - Framework and control management
 * - Quantitative and qualitative assessments
 * - Cross-framework analysis
 * - Visualization data endpoints
 * - Z-Inspection integration
 * - Regulatory monitoring
 */

import { api } from './api'

// ============================================================================
// Types
// ============================================================================

export interface ComplianceFramework {
  id: string
  name: string
  fullName: string
  version: string
  jurisdiction: string
  category: string
  controlCount: number
  enabled: boolean
  complianceScore?: number
}

export interface ComplianceControl {
  id: string
  frameworkId: string
  controlNumber: string
  title: string
  description: string
  category: string
  subcategory?: string
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  implementationStatus: 'not_started' | 'in_progress' | 'implemented' | 'not_applicable'
  score?: number
  lastAssessed?: string
  euRequirement?: TrustworthyAIRequirement
}

export type TrustworthyAIRequirement =
  | 'human_agency_oversight'
  | 'technical_robustness_safety'
  | 'privacy_data_governance'
  | 'transparency'
  | 'diversity_fairness_nondiscrimination'
  | 'societal_environmental_wellbeing'
  | 'accountability'

export interface ComplianceDashboardData {
  kpis: {
    overallScore: number
    scoreChange: number
    totalControls: number
    implementedControls: number
    criticalGaps: number
    upcomingDeadlines: number
  }
  frameworkScores: Array<{
    frameworkId: string
    frameworkName: string
    score: number
    controlCount: number
    implementedCount: number
  }>
  requirementScores: Array<{
    requirement: TrustworthyAIRequirement
    label: string
    score: number
    controlCount: number
  }>
  recentAlerts: Array<{
    id: string
    type: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    message: string
    createdAt: string
    acknowledged: boolean
  }>
  riskDistribution: Array<{
    level: string
    count: number
    percentage: number
  }>
}

export interface SankeyData {
  nodes: Array<{ id: string; name: string; category: string }>
  links: Array<{ source: string; target: string; value: number }>
}

export interface HeatmapData {
  rows: string[]
  columns: string[]
  data: number[][]
  labels: {
    rows: string[]
    columns: string[]
  }
}

export interface RadarData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor: string
    borderColor: string
  }>
}

export interface TrustworthinessAssessment {
  id: string
  aiSystemId: string
  aiSystemName: string
  overallRating: 'trustworthy' | 'conditionally_trustworthy' | 'not_trustworthy' | 'inconclusive'
  overallScore: number
  requirementAssessments: Array<{
    requirement: TrustworthyAIRequirement
    label: string
    rating: string
    score: number
    findings: number
    tensions: number
  }>
  tensionCount: number
  stakeholderCount: number
  scenarioCount: number
  createdAt: string
  assessedBy: string
}

export interface EthicalTension {
  id: string
  valueA: string
  valueB: string
  description: string
  severity: 'critical' | 'significant' | 'moderate' | 'minor'
  status: 'identified' | 'under_review' | 'mitigated' | 'accepted' | 'unresolved'
  affectedRequirement: TrustworthyAIRequirement
  stakeholdersAffected: string[]
  createdAt: string
}

export interface ZInspectionReport {
  id: string
  aiSystemId: string
  title: string
  conductedAt: string
  importedAt: string
  findingCount: number
  tensionCount: number
  mappedControlCount: number
  status: 'pending' | 'imported' | 'mapped' | 'integrated'
}

export interface RegulatoryUpdate {
  id: string
  sourceId: string
  sourceName: string
  frameworkId?: string
  updateType: 'new_framework' | 'amendment' | 'guidance' | 'enforcement' | 'deadline'
  title: string
  summary: string
  originalUrl: string
  detectedAt: string
  effectiveDate?: string
  status: 'pending' | 'analyzed' | 'implemented' | 'rejected'
}

export interface CrossFrameworkAnalysis {
  framework1: string
  framework2: string
  overlapCount: number
  overlapPercentage: number
  mappings: Array<{
    sourceControlId: string
    sourceControlName: string
    targetControlId: string
    targetControlName: string
    relationshipType: 'equivalent' | 'partial' | 'related' | 'supersedes'
    confidence: number
  }>
}

export interface GapAnalysis {
  tenantId: string
  analyzedAt: string
  totalGaps: number
  criticalGaps: number
  gaps: Array<{
    controlId: string
    controlName: string
    frameworkId: string
    frameworkName: string
    riskLevel: string
    gapType: 'not_implemented' | 'partially_implemented' | 'not_assessed'
    recommendation: string
  }>
  recommendations: string[]
}

// ============================================================================
// API Client
// ============================================================================

export const complianceApi = {
  // Framework & Controls
  listFrameworks: (params?: { enabled?: boolean }) =>
    api.get<ComplianceFramework[]>('/v1/compliance/frameworks', { params }),

  getFramework: (frameworkId: string) =>
    api.get<ComplianceFramework>(`/v1/compliance/frameworks/${frameworkId}`),

  listControls: (params?: {
    frameworkId?: string
    category?: string
    riskLevel?: string
    requirement?: TrustworthyAIRequirement
    search?: string
    page?: number
    limit?: number
  }) => api.get<{ controls: ComplianceControl[]; total: number }>('/v1/compliance/controls', { params }),

  getControl: (controlId: string) =>
    api.get<ComplianceControl>(`/v1/compliance/controls/${controlId}`),

  // Dashboard & Visualization
  getDashboard: (tenantId: string, frameworks?: string[]) =>
    api.get<ComplianceDashboardData>('/v1/compliance/visualization/dashboard', {
      params: { tenantId, frameworks: frameworks?.join(',') },
    }),

  getSankeyData: (tenantId: string, type?: 'requirements' | 'frameworks') =>
    api.get<SankeyData>('/v1/compliance/visualization/sankey', {
      params: { tenantId, type },
    }),

  getHeatmapData: (tenantId: string, type?: 'coverage' | 'cross-framework') =>
    api.get<HeatmapData>('/v1/compliance/visualization/heatmap', {
      params: { tenantId, type },
    }),

  getRadarData: (tenantId: string, type?: 'frameworks' | 'requirements' | 'tenant') =>
    api.get<RadarData>('/v1/compliance/visualization/radar', {
      params: { tenantId, type },
    }),

  // Trustworthiness Assessment
  listTrustworthinessAssessments: (params?: { aiSystemId?: string }) =>
    api.get<TrustworthinessAssessment[]>('/v1/compliance/trustworthiness/assessments', { params }),

  getTrustworthinessAssessment: (assessmentId: string) =>
    api.get<TrustworthinessAssessment>(`/v1/compliance/trustworthiness/assessments/${assessmentId}`),

  // Ethical Tensions
  listTensions: (params?: { aiSystemId?: string; status?: string; severity?: string }) =>
    api.get<EthicalTension[]>('/v1/compliance/tensions', { params }),

  // Z-Inspection
  listZInspectionReports: (params?: { aiSystemId?: string }) =>
    api.get<ZInspectionReport[]>('/v1/compliance/z-inspection/reports', { params }),

  // Cross-Framework Analysis
  getCrossFrameworkMatrix: (tenantId: string) =>
    api.get('/v1/compliance/analysis/cross-framework', { params: { tenantId } }),

  getFrameworkOverlap: (framework1: string, framework2: string) =>
    api.get<CrossFrameworkAnalysis>('/v1/compliance/analysis/cross-framework/overlap', {
      params: { framework1, framework2 },
    }),

  getRequirementCoverage: () =>
    api.get('/v1/compliance/analysis/requirement-coverage'),

  // Gap Analysis
  runGapAnalysis: (tenantId: string) =>
    api.get<GapAnalysis>('/v1/compliance/analysis/gap-analysis', { params: { tenantId } }),

  // Regulatory Monitoring
  listRegulatoryUpdates: (params?: { status?: string; sourceId?: string }) =>
    api.get<RegulatoryUpdate[]>('/v1/compliance/learning/updates', { params }),
}

export default complianceApi
