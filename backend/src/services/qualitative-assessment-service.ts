/**
 * Qualitative Assessment Service - Manages trustworthiness assessments and findings
 * Part of Z-Inspection aligned qualitative assessment
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import {
  TrustworthinessAssessment,
  CreateAssessmentInput,
  RunAssessmentInput,
  RequirementAssessment,
  QualitativeFinding,
  CreateFindingInput,
  TrustworthinessRating,
  TrustworthinessAssessmentStatus,
  TrustworthyAIRequirementId,
  TrustworthinessDashboard,
  RequirementCoverage,
  PaginationParams,
  PaginatedResponse,
  RecommendedAction,
} from '../types';

const ALL_REQUIREMENTS: TrustworthyAIRequirementId[] = [
  'human_agency_oversight',
  'technical_robustness_safety',
  'privacy_data_governance',
  'transparency',
  'diversity_fairness_nondiscrimination',
  'societal_environmental_wellbeing',
  'accountability',
];

export class QualitativeAssessmentService {
  constructor(private pool: Pool) {}

  /**
   * Create a new trustworthiness assessment
   */
  async createAssessment(
    tenantId: string,
    input: CreateAssessmentInput,
    createdBy?: string
  ): Promise<TrustworthinessAssessment> {
    const id = uuidv4();

    // Initialize empty requirement assessments
    const requirementAssessments: Record<TrustworthyAIRequirementId, RequirementAssessment> =
      {} as Record<TrustworthyAIRequirementId, RequirementAssessment>;

    for (const req of ALL_REQUIREMENTS) {
      requirementAssessments[req] = {
        requirementId: req,
        rating: 'inconclusive',
        narrative: '',
        findings: [],
        evidenceRefs: [],
        confidence: 'low',
        keyStrengths: [],
        keyWeaknesses: [],
      };
    }

    const result = await this.pool.query(
      `INSERT INTO trustworthiness_assessments (
        id, tenant_id, ai_system_id, title, assessment_type, scope,
        methodology, assessors, assessment_date, status,
        requirement_assessments, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        id,
        tenantId,
        input.aiSystemId,
        input.title,
        input.assessmentType || 'comprehensive',
        input.scope || null,
        input.methodology || null,
        JSON.stringify(input.assessors || []),
        new Date(),
        'draft',
        JSON.stringify(requirementAssessments),
        createdBy || null,
      ]
    );

    return this.mapRowToAssessment(result.rows[0]);
  }

  /**
   * Get assessment by ID
   */
  async getAssessment(tenantId: string, id: string): Promise<TrustworthinessAssessment | null> {
    const result = await this.pool.query(
      `SELECT * FROM trustworthiness_assessments WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToAssessment(result.rows[0]);
  }

  /**
   * List assessments for an AI system
   */
  async listAssessments(
    tenantId: string,
    aiSystemId: string,
    filters?: {
      status?: TrustworthinessAssessmentStatus;
      overallRating?: TrustworthinessRating;
    },
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<TrustworthinessAssessment>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE tenant_id = $1 AND ai_system_id = $2';
    const params: string[] = [tenantId, aiSystemId];
    let paramIndex = 3;

    if (filters?.status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.overallRating) {
      whereClause += ` AND overall_rating = $${paramIndex}`;
      params.push(filters.overallRating);
      paramIndex++;
    }

    const countResult = await this.pool.query(
      `SELECT COUNT(*) FROM trustworthiness_assessments ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await this.pool.query(
      `SELECT * FROM trustworthiness_assessments ${whereClause}
       ORDER BY assessment_date DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit.toString(), offset.toString()]
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: dataResult.rows.map((row) => this.mapRowToAssessment(row)),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Update requirement assessment within a trustworthiness assessment
   */
  async updateRequirementAssessment(
    tenantId: string,
    assessmentId: string,
    requirementId: TrustworthyAIRequirementId,
    update: Partial<RequirementAssessment>
  ): Promise<TrustworthinessAssessment | null> {
    const existing = await this.getAssessment(tenantId, assessmentId);
    if (!existing) {
      return null;
    }

    const updatedReqAssessments = {
      ...existing.requirementAssessments,
      [requirementId]: {
        ...existing.requirementAssessments[requirementId],
        ...update,
        requirementId,
      },
    };

    const result = await this.pool.query(
      `UPDATE trustworthiness_assessments
       SET requirement_assessments = $3, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [assessmentId, tenantId, JSON.stringify(updatedReqAssessments)]
    );

    return this.mapRowToAssessment(result.rows[0]);
  }

  /**
   * Update overall assessment
   */
  async updateOverallAssessment(
    tenantId: string,
    assessmentId: string,
    update: {
      overallRating?: TrustworthinessRating;
      overallNarrative?: string;
      overallConfidence?: 'high' | 'medium' | 'low';
      recommendations?: string[];
      priorityActions?: string[];
    }
  ): Promise<TrustworthinessAssessment | null> {
    const updateFields: string[] = [];
    const params: unknown[] = [assessmentId, tenantId];
    let paramIndex = 3;

    if (update.overallRating !== undefined) {
      updateFields.push(`overall_rating = $${paramIndex}`);
      params.push(update.overallRating);
      paramIndex++;
    }

    if (update.overallNarrative !== undefined) {
      updateFields.push(`overall_narrative = $${paramIndex}`);
      params.push(update.overallNarrative);
      paramIndex++;
    }

    if (update.overallConfidence !== undefined) {
      updateFields.push(`overall_confidence = $${paramIndex}`);
      params.push(update.overallConfidence);
      paramIndex++;
    }

    if (update.recommendations !== undefined) {
      updateFields.push(`recommendations = $${paramIndex}`);
      params.push(JSON.stringify(update.recommendations));
      paramIndex++;
    }

    if (update.priorityActions !== undefined) {
      updateFields.push(`priority_actions = $${paramIndex}`);
      params.push(JSON.stringify(update.priorityActions));
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return this.getAssessment(tenantId, assessmentId);
    }

    updateFields.push('updated_at = NOW()');

    const result = await this.pool.query(
      `UPDATE trustworthiness_assessments
       SET ${updateFields.join(', ')}
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToAssessment(result.rows[0]);
  }

  /**
   * Change assessment status
   */
  async changeStatus(
    tenantId: string,
    assessmentId: string,
    status: TrustworthinessAssessmentStatus,
    reviewedBy?: string
  ): Promise<TrustworthinessAssessment | null> {
    const updateFields = ['status = $3', 'updated_at = NOW()'];
    const params: unknown[] = [assessmentId, tenantId, status];

    if (status === 'final' || status === 'review') {
      updateFields.push('reviewed_by = $4', 'reviewed_at = NOW()');
      params.push(reviewedBy || null);
    }

    const result = await this.pool.query(
      `UPDATE trustworthiness_assessments
       SET ${updateFields.join(', ')}
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToAssessment(result.rows[0]);
  }

  /**
   * Link scenarios to assessment
   */
  async linkScenarios(
    tenantId: string,
    assessmentId: string,
    scenarioIds: string[]
  ): Promise<TrustworthinessAssessment | null> {
    const existing = await this.getAssessment(tenantId, assessmentId);
    if (!existing) {
      return null;
    }

    const updatedScenarios = Array.from(new Set([...existing.scenariosAssessed, ...scenarioIds]));

    const result = await this.pool.query(
      `UPDATE trustworthiness_assessments
       SET scenarios_assessed = $3, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [assessmentId, tenantId, JSON.stringify(updatedScenarios)]
    );

    return this.mapRowToAssessment(result.rows[0]);
  }

  /**
   * Link tensions to assessment
   */
  async linkTensions(
    tenantId: string,
    assessmentId: string,
    tensionIds: string[]
  ): Promise<TrustworthinessAssessment | null> {
    const existing = await this.getAssessment(tenantId, assessmentId);
    if (!existing) {
      return null;
    }

    const updatedTensions = Array.from(new Set([...existing.tensionsIdentified, ...tensionIds]));

    const result = await this.pool.query(
      `UPDATE trustworthiness_assessments
       SET tensions_identified = $3, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [assessmentId, tenantId, JSON.stringify(updatedTensions)]
    );

    return this.mapRowToAssessment(result.rows[0]);
  }

  /**
   * Delete assessment
   */
  async deleteAssessment(tenantId: string, id: string): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM trustworthiness_assessments WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  // ============================================================================
  // QUALITATIVE FINDINGS
  // ============================================================================

  /**
   * Create a qualitative finding
   */
  async createFinding(
    tenantId: string,
    input: CreateFindingInput,
    createdBy?: string
  ): Promise<QualitativeFinding> {
    const id = uuidv4();

    const result = await this.pool.query(
      `INSERT INTO qualitative_findings (
        id, tenant_id, assessment_id, ai_system_id, title, finding_type, description,
        requirement_id, category, severity, priority, evidence_description, evidence_sources,
        recommendation, recommended_actions, related_controls, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        id,
        tenantId,
        input.assessmentId,
        input.aiSystemId,
        input.title,
        input.findingType,
        input.description,
        input.requirementId || null,
        input.category || null,
        input.severity || null,
        input.priority || null,
        input.evidenceDescription || null,
        JSON.stringify(input.evidenceSources || []),
        input.recommendation || null,
        JSON.stringify(input.recommendedActions || []),
        JSON.stringify(input.relatedControls || []),
        'open',
        createdBy || null,
      ]
    );

    return this.mapRowToFinding(result.rows[0]);
  }

  /**
   * Get finding by ID
   */
  async getFinding(tenantId: string, id: string): Promise<QualitativeFinding | null> {
    const result = await this.pool.query(
      `SELECT * FROM qualitative_findings WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToFinding(result.rows[0]);
  }

  /**
   * List findings for an assessment
   */
  async listFindings(
    tenantId: string,
    assessmentId: string,
    filters?: {
      findingType?: string;
      requirementId?: TrustworthyAIRequirementId;
      status?: string;
    }
  ): Promise<QualitativeFinding[]> {
    let whereClause = 'WHERE tenant_id = $1 AND assessment_id = $2';
    const params: string[] = [tenantId, assessmentId];
    let paramIndex = 3;

    if (filters?.findingType) {
      whereClause += ` AND finding_type = $${paramIndex}`;
      params.push(filters.findingType);
      paramIndex++;
    }

    if (filters?.requirementId) {
      whereClause += ` AND requirement_id = $${paramIndex}`;
      params.push(filters.requirementId);
      paramIndex++;
    }

    if (filters?.status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    const result = await this.pool.query(
      `SELECT * FROM qualitative_findings ${whereClause}
       ORDER BY
         CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END,
         created_at DESC`,
      params
    );

    return result.rows.map((row) => this.mapRowToFinding(row));
  }

  /**
   * Update finding status
   */
  async updateFindingStatus(
    tenantId: string,
    findingId: string,
    status: string,
    resolutionNotes?: string
  ): Promise<QualitativeFinding | null> {
    const resolvedAt =
      status === 'addressed' || status === 'accepted' || status === 'deferred' ? 'NOW()' : null;

    const result = await this.pool.query(
      `UPDATE qualitative_findings
       SET status = $3,
           resolution_notes = COALESCE($4, resolution_notes),
           resolved_at = ${resolvedAt ? 'NOW()' : 'resolved_at'},
           updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [findingId, tenantId, status, resolutionNotes || null]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToFinding(result.rows[0]);
  }

  /**
   * Delete finding
   */
  async deleteFinding(tenantId: string, id: string): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM qualitative_findings WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  // ============================================================================
  // DASHBOARD AND ANALYTICS
  // ============================================================================

  /**
   * Get trustworthiness dashboard for an AI system
   */
  async getDashboard(tenantId: string, aiSystemId: string): Promise<TrustworthinessDashboard> {
    // Get AI system info
    const systemResult = await this.pool.query(
      `SELECT id, name, risk_classification FROM ai_system_registry
       WHERE id = $1 AND tenant_id = $2`,
      [aiSystemId, tenantId]
    );

    const system = systemResult.rows[0];

    // Get latest final assessment
    const assessmentResult = await this.pool.query(
      `SELECT * FROM trustworthiness_assessments
       WHERE ai_system_id = $1 AND tenant_id = $2 AND status = 'final'
       ORDER BY assessment_date DESC
       LIMIT 1`,
      [aiSystemId, tenantId]
    );

    let latestAssessment = undefined;
    if (assessmentResult.rows.length > 0) {
      const assessment = this.mapRowToAssessment(assessmentResult.rows[0]);

      // Get finding and tension counts per requirement
      const reqSummary: Record<
        TrustworthyAIRequirementId,
        { rating: TrustworthinessRating; openFindings: number; unresolvedTensions: number }
      > = {} as Record<TrustworthyAIRequirementId, { rating: TrustworthinessRating; openFindings: number; unresolvedTensions: number }>;

      for (const req of ALL_REQUIREMENTS) {
        const findingsCount = await this.pool.query(
          `SELECT COUNT(*) FROM qualitative_findings
           WHERE assessment_id = $1 AND requirement_id = $2 AND status = 'open'`,
          [assessment.id, req]
        );

        const tensionsCount = await this.pool.query(
          `SELECT COUNT(*) FROM ethical_tensions
           WHERE ai_system_id = $1 AND tenant_id = $2
             AND (requirement_a = $3 OR requirement_b = $3)
             AND status NOT IN ('mitigated', 'accepted')`,
          [aiSystemId, tenantId, req]
        );

        reqSummary[req] = {
          rating: assessment.requirementAssessments[req]?.rating || 'inconclusive',
          openFindings: parseInt(findingsCount.rows[0].count, 10),
          unresolvedTensions: parseInt(tensionsCount.rows[0].count, 10),
        };
      }

      latestAssessment = {
        id: assessment.id,
        overallRating: assessment.overallRating!,
        overallConfidence: assessment.overallConfidence!,
        assessmentDate: assessment.assessmentDate,
        requirementSummary: reqSummary,
      };
    }

    // Get counts
    const countsResult = await this.pool.query(
      `SELECT
        (SELECT COUNT(*) FROM socio_technical_scenarios WHERE ai_system_id = $1 AND tenant_id = $2) as scenarios,
        (SELECT COUNT(*) FROM ethical_tensions WHERE ai_system_id = $1 AND tenant_id = $2 AND status NOT IN ('mitigated', 'accepted')) as tensions,
        (SELECT COUNT(*) FROM stakeholder_registry WHERE ai_system_id = $1 AND tenant_id = $2) as stakeholders,
        (SELECT COUNT(*) FROM qualitative_findings WHERE ai_system_id = $1 AND tenant_id = $2 AND status = 'open') as findings`,
      [aiSystemId, tenantId]
    );

    const counts = countsResult.rows[0];

    // Get rating history
    const historyResult = await this.pool.query(
      `SELECT assessment_date, overall_rating, overall_confidence
       FROM trustworthiness_assessments
       WHERE ai_system_id = $1 AND tenant_id = $2 AND status = 'final'
       ORDER BY assessment_date DESC
       LIMIT 10`,
      [aiSystemId, tenantId]
    );

    const ratingHistory = historyResult.rows.map((row) => ({
      date: new Date(row.assessment_date),
      rating: row.overall_rating as TrustworthinessRating,
      confidence: row.overall_confidence as 'high' | 'medium' | 'low',
    }));

    return {
      aiSystemId,
      aiSystemName: system?.name || 'Unknown',
      riskClassification: system?.risk_classification || 'unknown',
      latestAssessment,
      scenarioCount: parseInt(counts.scenarios, 10),
      unresolvedTensionCount: parseInt(counts.tensions, 10),
      stakeholderCount: parseInt(counts.stakeholders, 10),
      openFindingCount: parseInt(counts.findings, 10),
      ratingHistory,
    };
  }

  /**
   * Get requirement coverage analysis
   */
  async getRequirementCoverage(
    tenantId: string,
    aiSystemId: string
  ): Promise<RequirementCoverage[]> {
    const coverageData: RequirementCoverage[] = [];

    for (const req of ALL_REQUIREMENTS) {
      // Get requirement name
      const reqResult = await this.pool.query(
        `SELECT name FROM trustworthy_ai_requirements WHERE id = $1`,
        [req]
      );
      const requirementName = reqResult.rows[0]?.name || req;

      // Get control counts by framework
      const controlsResult = await this.pool.query(
        `SELECT framework_id, COUNT(*) as count
         FROM requirement_control_mappings
         WHERE requirement_id = $1
         GROUP BY framework_id`,
        [req]
      );

      const controlsByFramework: Record<string, number> = {};
      let totalControls = 0;
      for (const row of controlsResult.rows) {
        controlsByFramework[row.framework_id] = parseInt(row.count, 10);
        totalControls += parseInt(row.count, 10);
      }

      // Get qualitative counts
      const qualResult = await this.pool.query(
        `SELECT
          (SELECT COUNT(*) FROM socio_technical_scenarios WHERE ai_system_id = $1 AND tenant_id = $2 AND (primary_requirement = $3 OR affected_requirements ? $3)) as scenarios,
          (SELECT COUNT(*) FROM ethical_tensions WHERE ai_system_id = $1 AND tenant_id = $2 AND (requirement_a = $3 OR requirement_b = $3)) as tensions,
          (SELECT COUNT(*) FROM qualitative_findings WHERE ai_system_id = $1 AND tenant_id = $2 AND requirement_id = $3) as findings`,
        [aiSystemId, tenantId, req]
      );

      // Get latest rating
      const ratingResult = await this.pool.query(
        `SELECT requirement_assessments->$3 as req_assessment
         FROM trustworthiness_assessments
         WHERE ai_system_id = $1 AND tenant_id = $2 AND status = 'final'
         ORDER BY assessment_date DESC
         LIMIT 1`,
        [aiSystemId, tenantId, req]
      );

      let latestRating: TrustworthinessRating | undefined;
      let latestConfidence: 'high' | 'medium' | 'low' | undefined;
      if (ratingResult.rows.length > 0 && ratingResult.rows[0].req_assessment) {
        const reqAssessment = ratingResult.rows[0].req_assessment;
        latestRating = reqAssessment.rating;
        latestConfidence = reqAssessment.confidence;
      }

      coverageData.push({
        requirementId: req,
        requirementName,
        totalControls,
        controlsByFramework,
        scenarioCount: parseInt(qualResult.rows[0].scenarios, 10),
        tensionCount: parseInt(qualResult.rows[0].tensions, 10),
        findingCount: parseInt(qualResult.rows[0].findings, 10),
        latestRating,
        latestConfidence,
      });
    }

    return coverageData;
  }

  /**
   * Calculate overall rating from requirement ratings
   */
  calculateOverallRating(
    requirementAssessments: Record<TrustworthyAIRequirementId, RequirementAssessment>
  ): TrustworthinessRating {
    const ratings = Object.values(requirementAssessments).map((r) => r.rating);

    // If any critical requirement is not_trustworthy, overall is not_trustworthy
    if (ratings.includes('not_trustworthy')) {
      return 'not_trustworthy';
    }

    // If any requirement is inconclusive, overall is inconclusive
    if (ratings.includes('inconclusive')) {
      return 'inconclusive';
    }

    // If any requirement is conditionally_trustworthy, overall is conditionally
    if (ratings.includes('conditionally_trustworthy')) {
      return 'conditionally_trustworthy';
    }

    // All requirements are trustworthy
    return 'trustworthy';
  }

  private mapRowToAssessment(row: Record<string, unknown>): TrustworthinessAssessment {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      aiSystemId: row.ai_system_id as string,
      title: row.title as string,
      assessmentType: row.assessment_type as TrustworthinessAssessment['assessmentType'],
      scope: row.scope as string | undefined,
      overallRating: row.overall_rating as TrustworthinessRating | undefined,
      overallNarrative: row.overall_narrative as string | undefined,
      overallConfidence: row.overall_confidence as 'high' | 'medium' | 'low' | undefined,
      requirementAssessments:
        (row.requirement_assessments as Record<TrustworthyAIRequirementId, RequirementAssessment>) ||
        {},
      scenariosAssessed: (row.scenarios_assessed as string[]) || [],
      tensionsIdentified: (row.tensions_identified as string[]) || [],
      stakeholdersConsulted: (row.stakeholders_consulted as string[]) || [],
      methodology: row.methodology as string | undefined,
      assessors: (row.assessors as string[]) || [],
      assessmentDate: new Date(row.assessment_date as string),
      status: row.status as TrustworthinessAssessmentStatus,
      zInspectionSourceId: row.z_inspection_source_id as string | undefined,
      recommendations: (row.recommendations as string[]) || [],
      priorityActions: (row.priority_actions as string[]) || [],
      metadata: (row.metadata as Record<string, unknown>) || {},
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      createdBy: row.created_by as string | undefined,
      reviewedBy: row.reviewed_by as string | undefined,
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at as string) : undefined,
    };
  }

  private mapRowToFinding(row: Record<string, unknown>): QualitativeFinding {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      assessmentId: row.assessment_id as string,
      aiSystemId: row.ai_system_id as string,
      title: row.title as string,
      findingType: row.finding_type as QualitativeFinding['findingType'],
      description: row.description as string,
      requirementId: row.requirement_id as TrustworthyAIRequirementId | undefined,
      category: row.category as string | undefined,
      severity: row.severity as QualitativeFinding['severity'],
      priority: row.priority as QualitativeFinding['priority'],
      evidenceDescription: row.evidence_description as string | undefined,
      evidenceSources: (row.evidence_sources as string[]) || [],
      recommendation: row.recommendation as string | undefined,
      recommendedActions: (row.recommended_actions as RecommendedAction[]) || [],
      status: row.status as QualitativeFinding['status'],
      resolutionNotes: row.resolution_notes as string | undefined,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at as string) : undefined,
      relatedControls: (row.related_controls as string[]) || [],
      metadata: (row.metadata as Record<string, unknown>) || {},
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      createdBy: row.created_by as string | undefined,
    };
  }
}
