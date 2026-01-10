/**
 * Tension Service - Manages ethical tensions between values/stakeholders
 * Part of Z-Inspection aligned qualitative assessment
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import {
  EthicalTension,
  CreateTensionInput,
  ResolveTensionInput,
  TensionType,
  TensionSeverity,
  TensionStatus,
  TrustworthyAIRequirementId,
  StakeholderPerspective,
  PaginationParams,
  PaginatedResponse,
} from '../types';
import {
  validateCreateTensionInput,
  validateUpdateTensionInput,
  validateResolveTensionInput,
  validateStakeholderPerspectiveInput,
} from '../validation/tension-schemas';

// Re-export ValidationError for consumers of this service
export { ValidationError } from '../validation/tension-schemas';

export class TensionService {
  constructor(private pool: Pool) {}

  /**
   * Create a new ethical tension
   * @throws {ValidationError} If input validation fails
   */
  async createTension(
    tenantId: string,
    input: CreateTensionInput,
    createdBy?: string
  ): Promise<EthicalTension> {
    // Validate input before database operation
    const validatedInput = validateCreateTensionInput(input);

    const id = uuidv4();

    const result = await this.pool.query(
      `INSERT INTO ethical_tensions (
        id, tenant_id, ai_system_id, scenario_id, title, description,
        value_a, value_a_description, value_b, value_b_description,
        tension_type, requirement_a, requirement_b,
        affected_stakeholders, severity, status, is_ai_identified, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        id,
        tenantId,
        validatedInput.aiSystemId,
        validatedInput.scenarioId || null,
        validatedInput.title,
        validatedInput.description,
        validatedInput.valueA,
        validatedInput.valueADescription || null,
        validatedInput.valueB,
        validatedInput.valueBDescription || null,
        validatedInput.tensionType,
        validatedInput.requirementA || null,
        validatedInput.requirementB || null,
        JSON.stringify(validatedInput.affectedStakeholders || []),
        validatedInput.severity || 'moderate',
        'identified',
        false,
        createdBy || null,
      ]
    );

    return this.mapRowToTension(result.rows[0]);
  }

  /**
   * Get tension by ID
   */
  async getTension(tenantId: string, id: string): Promise<EthicalTension | null> {
    const result = await this.pool.query(
      `SELECT * FROM ethical_tensions WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTension(result.rows[0]);
  }

  /**
   * List tensions for an AI system
   */
  async listTensions(
    tenantId: string,
    aiSystemId: string,
    filters?: {
      tensionType?: TensionType;
      severity?: TensionSeverity;
      status?: TensionStatus;
      requirementId?: TrustworthyAIRequirementId;
      scenarioId?: string;
    },
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<EthicalTension>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE tenant_id = $1 AND ai_system_id = $2';
    const params: string[] = [tenantId, aiSystemId];
    let paramIndex = 3;

    if (filters?.tensionType) {
      whereClause += ` AND tension_type = $${paramIndex}`;
      params.push(filters.tensionType);
      paramIndex++;
    }

    if (filters?.severity) {
      whereClause += ` AND severity = $${paramIndex}`;
      params.push(filters.severity);
      paramIndex++;
    }

    if (filters?.status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.requirementId) {
      whereClause += ` AND (requirement_a = $${paramIndex} OR requirement_b = $${paramIndex})`;
      params.push(filters.requirementId);
      paramIndex++;
    }

    if (filters?.scenarioId) {
      whereClause += ` AND scenario_id = $${paramIndex}`;
      params.push(filters.scenarioId);
      paramIndex++;
    }

    // Get total count
    const countResult = await this.pool.query(
      `SELECT COUNT(*) FROM ethical_tensions ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated data
    const sortBy = pagination?.sortBy || 'created_at';
    const sortOrder = pagination?.sortOrder || 'desc';
    const dataResult = await this.pool.query(
      `SELECT * FROM ethical_tensions ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit.toString(), offset.toString()]
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: dataResult.rows.map((row) => this.mapRowToTension(row)),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Update tension
   * @throws {ValidationError} If input validation fails
   */
  async updateTension(
    tenantId: string,
    id: string,
    updates: Partial<CreateTensionInput>
  ): Promise<EthicalTension | null> {
    // Validate input before database operation
    const validatedUpdates = validateUpdateTensionInput(updates);

    const existing = await this.getTension(tenantId, id);
    if (!existing) {
      return null;
    }

    const updateFields: string[] = [];
    const params: unknown[] = [id, tenantId];
    let paramIndex = 3;

    const fieldMappings: Record<string, string> = {
      title: 'title',
      description: 'description',
      valueA: 'value_a',
      valueADescription: 'value_a_description',
      valueB: 'value_b',
      valueBDescription: 'value_b_description',
      tensionType: 'tension_type',
      requirementA: 'requirement_a',
      requirementB: 'requirement_b',
      affectedStakeholders: 'affected_stakeholders',
      severity: 'severity',
    };

    for (const [key, dbField] of Object.entries(fieldMappings)) {
      const value = validatedUpdates[key as keyof typeof validatedUpdates];
      if (value !== undefined) {
        let dbValue: unknown = value;
        if (Array.isArray(value)) {
          dbValue = JSON.stringify(value);
        }
        updateFields.push(`${dbField} = $${paramIndex}`);
        params.push(dbValue);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return existing;
    }

    updateFields.push('updated_at = NOW()');

    const result = await this.pool.query(
      `UPDATE ethical_tensions
       SET ${updateFields.join(', ')}
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      params
    );

    return this.mapRowToTension(result.rows[0]);
  }

  /**
   * Delete tension
   */
  async deleteTension(tenantId: string, id: string): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM ethical_tensions WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Resolve a tension
   * @throws {ValidationError} If input validation fails
   */
  async resolveTension(
    tenantId: string,
    id: string,
    resolution: ResolveTensionInput,
    resolvedBy?: string
  ): Promise<EthicalTension | null> {
    // Validate input before database operation
    const validatedResolution = validateResolveTensionInput(resolution);

    const result = await this.pool.query(
      `UPDATE ethical_tensions
       SET resolution_approach = $3,
           resolution_rationale = $4,
           trade_off_decision = $5,
           residual_concerns = $6,
           status = $7,
           resolved_at = NOW(),
           resolved_by = $8,
           updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [
        id,
        tenantId,
        validatedResolution.resolutionApproach,
        validatedResolution.resolutionRationale,
        validatedResolution.tradeOffDecision || null,
        validatedResolution.residualConcerns || null,
        validatedResolution.newStatus,
        resolvedBy || null,
      ]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTension(result.rows[0]);
  }

  /**
   * Change tension status
   */
  async changeStatus(
    tenantId: string,
    id: string,
    status: TensionStatus
  ): Promise<EthicalTension | null> {
    const result = await this.pool.query(
      `UPDATE ethical_tensions
       SET status = $3, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [id, tenantId, status]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTension(result.rows[0]);
  }

  /**
   * Add stakeholder perspective to a tension
   * @throws {ValidationError} If input validation fails
   */
  async addStakeholderPerspective(
    tenantId: string,
    tensionId: string,
    stakeholderId: string,
    perspective: Omit<StakeholderPerspective, 'stakeholderId'>
  ): Promise<EthicalTension | null> {
    // Validate input before database operation
    const validatedPerspective = validateStakeholderPerspectiveInput(perspective);

    const existing = await this.getTension(tenantId, tensionId);
    if (!existing) {
      return null;
    }

    const updatedPerspectives = {
      ...existing.stakeholderPerspectives,
      [stakeholderId]: { stakeholderId, ...validatedPerspective },
    };

    const updatedStakeholders = Array.from(
      new Set([...existing.affectedStakeholders, stakeholderId])
    );

    const result = await this.pool.query(
      `UPDATE ethical_tensions
       SET stakeholder_perspectives = $3,
           affected_stakeholders = $4,
           updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [tensionId, tenantId, JSON.stringify(updatedPerspectives), JSON.stringify(updatedStakeholders)]
    );

    return this.mapRowToTension(result.rows[0]);
  }

  /**
   * Get unresolved tensions for an AI system
   */
  async getUnresolvedTensions(
    tenantId: string,
    aiSystemId: string
  ): Promise<EthicalTension[]> {
    const result = await this.pool.query(
      `SELECT * FROM ethical_tensions
       WHERE tenant_id = $1 AND ai_system_id = $2
         AND status IN ('identified', 'under_review', 'unresolved')
       ORDER BY
         CASE severity
           WHEN 'critical' THEN 1
           WHEN 'significant' THEN 2
           WHEN 'moderate' THEN 3
           WHEN 'minor' THEN 4
         END,
         created_at DESC`,
      [tenantId, aiSystemId]
    );

    return result.rows.map((row) => this.mapRowToTension(row));
  }

  /**
   * Get tensions by requirement
   */
  async getTensionsByRequirement(
    tenantId: string,
    aiSystemId: string,
    requirementId: TrustworthyAIRequirementId
  ): Promise<EthicalTension[]> {
    const result = await this.pool.query(
      `SELECT * FROM ethical_tensions
       WHERE tenant_id = $1 AND ai_system_id = $2
         AND (requirement_a = $3 OR requirement_b = $3)
       ORDER BY severity DESC, created_at DESC`,
      [tenantId, aiSystemId, requirementId]
    );

    return result.rows.map((row) => this.mapRowToTension(row));
  }

  /**
   * Get tension statistics
   */
  async getTensionStats(
    tenantId: string,
    aiSystemId: string
  ): Promise<{
    total: number;
    byType: Record<TensionType, number>;
    bySeverity: Record<TensionSeverity, number>;
    byStatus: Record<TensionStatus, number>;
    byRequirement: Record<TrustworthyAIRequirementId, number>;
    unresolvedCritical: number;
    resolutionRate: number;
  }> {
    const result = await this.pool.query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE tension_type = 'value_vs_value') as type_vv,
        COUNT(*) FILTER (WHERE tension_type = 'stakeholder_vs_stakeholder') as type_ss,
        COUNT(*) FILTER (WHERE tension_type = 'requirement_vs_requirement') as type_rr,
        COUNT(*) FILTER (WHERE tension_type = 'short_term_vs_long_term') as type_stlt,
        COUNT(*) FILTER (WHERE severity = 'critical') as sev_critical,
        COUNT(*) FILTER (WHERE severity = 'significant') as sev_significant,
        COUNT(*) FILTER (WHERE severity = 'moderate') as sev_moderate,
        COUNT(*) FILTER (WHERE severity = 'minor') as sev_minor,
        COUNT(*) FILTER (WHERE status = 'identified') as stat_identified,
        COUNT(*) FILTER (WHERE status = 'under_review') as stat_under_review,
        COUNT(*) FILTER (WHERE status = 'mitigated') as stat_mitigated,
        COUNT(*) FILTER (WHERE status = 'accepted') as stat_accepted,
        COUNT(*) FILTER (WHERE status = 'unresolved') as stat_unresolved,
        COUNT(*) FILTER (WHERE severity = 'critical' AND status NOT IN ('mitigated', 'accepted')) as unresolved_critical,
        COUNT(*) FILTER (WHERE status IN ('mitigated', 'accepted')) as resolved,
        COUNT(*) FILTER (WHERE requirement_a = 'human_agency_oversight' OR requirement_b = 'human_agency_oversight') as req_hao,
        COUNT(*) FILTER (WHERE requirement_a = 'technical_robustness_safety' OR requirement_b = 'technical_robustness_safety') as req_trs,
        COUNT(*) FILTER (WHERE requirement_a = 'privacy_data_governance' OR requirement_b = 'privacy_data_governance') as req_pdg,
        COUNT(*) FILTER (WHERE requirement_a = 'transparency' OR requirement_b = 'transparency') as req_trans,
        COUNT(*) FILTER (WHERE requirement_a = 'diversity_fairness_nondiscrimination' OR requirement_b = 'diversity_fairness_nondiscrimination') as req_dfn,
        COUNT(*) FILTER (WHERE requirement_a = 'societal_environmental_wellbeing' OR requirement_b = 'societal_environmental_wellbeing') as req_sew,
        COUNT(*) FILTER (WHERE requirement_a = 'accountability' OR requirement_b = 'accountability') as req_acc
       FROM ethical_tensions
       WHERE tenant_id = $1 AND ai_system_id = $2`,
      [tenantId, aiSystemId]
    );

    const row = result.rows[0];
    const total = parseInt(row.total, 10);
    const resolved = parseInt(row.resolved, 10);

    return {
      total,
      byType: {
        value_vs_value: parseInt(row.type_vv, 10),
        stakeholder_vs_stakeholder: parseInt(row.type_ss, 10),
        requirement_vs_requirement: parseInt(row.type_rr, 10),
        short_term_vs_long_term: parseInt(row.type_stlt, 10),
      },
      bySeverity: {
        critical: parseInt(row.sev_critical, 10),
        significant: parseInt(row.sev_significant, 10),
        moderate: parseInt(row.sev_moderate, 10),
        minor: parseInt(row.sev_minor, 10),
      },
      byStatus: {
        identified: parseInt(row.stat_identified, 10),
        under_review: parseInt(row.stat_under_review, 10),
        mitigated: parseInt(row.stat_mitigated, 10),
        accepted: parseInt(row.stat_accepted, 10),
        unresolved: parseInt(row.stat_unresolved, 10),
      },
      byRequirement: {
        human_agency_oversight: parseInt(row.req_hao, 10),
        technical_robustness_safety: parseInt(row.req_trs, 10),
        privacy_data_governance: parseInt(row.req_pdg, 10),
        transparency: parseInt(row.req_trans, 10),
        diversity_fairness_nondiscrimination: parseInt(row.req_dfn, 10),
        societal_environmental_wellbeing: parseInt(row.req_sew, 10),
        accountability: parseInt(row.req_acc, 10),
      },
      unresolvedCritical: parseInt(row.unresolved_critical, 10),
      resolutionRate: total > 0 ? (resolved / total) * 100 : 0,
    };
  }

  /**
   * Store AI-identified tensions
   */
  async storeIdentifiedTensions(
    tenantId: string,
    aiSystemId: string,
    tensions: Omit<CreateTensionInput, 'aiSystemId'>[],
    aiAnalysisContext: Record<string, unknown>,
    createdBy?: string
  ): Promise<EthicalTension[]> {
    const results: EthicalTension[] = [];

    for (const tension of tensions) {
      const id = uuidv4();

      const result = await this.pool.query(
        `INSERT INTO ethical_tensions (
          id, tenant_id, ai_system_id, scenario_id, title, description,
          value_a, value_a_description, value_b, value_b_description,
          tension_type, requirement_a, requirement_b,
          affected_stakeholders, severity, status, is_ai_identified, ai_analysis, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *`,
        [
          id,
          tenantId,
          aiSystemId,
          tension.scenarioId || null,
          tension.title,
          tension.description,
          tension.valueA,
          tension.valueADescription || null,
          tension.valueB,
          tension.valueBDescription || null,
          tension.tensionType,
          tension.requirementA || null,
          tension.requirementB || null,
          JSON.stringify(tension.affectedStakeholders || []),
          tension.severity || 'moderate',
          'identified',
          true,
          JSON.stringify(aiAnalysisContext),
          createdBy || null,
        ]
      );

      results.push(this.mapRowToTension(result.rows[0]));
    }

    return results;
  }

  private mapRowToTension(row: Record<string, unknown>): EthicalTension {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      aiSystemId: row.ai_system_id as string,
      scenarioId: row.scenario_id as string | undefined,
      title: row.title as string,
      description: row.description as string,
      valueA: row.value_a as string,
      valueADescription: row.value_a_description as string | undefined,
      valueB: row.value_b as string,
      valueBDescription: row.value_b_description as string | undefined,
      tensionType: row.tension_type as TensionType,
      requirementA: row.requirement_a as TrustworthyAIRequirementId | undefined,
      requirementB: row.requirement_b as TrustworthyAIRequirementId | undefined,
      affectedStakeholders: (row.affected_stakeholders as string[]) || [],
      stakeholderPerspectives:
        (row.stakeholder_perspectives as Record<string, StakeholderPerspective>) || {},
      severity: row.severity as TensionSeverity,
      status: row.status as TensionStatus,
      resolutionApproach: row.resolution_approach as string | undefined,
      resolutionRationale: row.resolution_rationale as string | undefined,
      tradeOffDecision: row.trade_off_decision as string | undefined,
      residualConcerns: row.residual_concerns as string | undefined,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at as string) : undefined,
      resolvedBy: row.resolved_by as string | undefined,
      isAiIdentified: row.is_ai_identified as boolean,
      aiAnalysis: (row.ai_analysis as Record<string, unknown>) || {},
      metadata: (row.metadata as Record<string, unknown>) || {},
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      createdBy: row.created_by as string | undefined,
    };
  }
}
