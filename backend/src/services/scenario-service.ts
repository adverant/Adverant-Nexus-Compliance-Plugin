/**
 * Scenario Service - Manages socio-technical scenarios for AI systems
 * Part of Z-Inspection aligned qualitative assessment
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import {
  SocioTechnicalScenario,
  CreateScenarioInput,
  GenerateScenarioInput,
  ScenarioType,
  ScenarioActor,
  Likelihood,
  Severity,
  ScenarioStatus,
  TrustworthyAIRequirementId,
  PaginationParams,
  PaginatedResponse,
} from '../types';

// Likelihood to numeric mapping for risk calculation
const LIKELIHOOD_SCORES: Record<Likelihood, number> = {
  certain: 5,
  likely: 4,
  possible: 3,
  unlikely: 2,
  rare: 1,
};

// Severity to numeric mapping for risk calculation
const SEVERITY_SCORES: Record<Severity, number> = {
  critical: 5,
  high: 4,
  moderate: 3,
  low: 2,
  minimal: 1,
};

export class ScenarioService {
  constructor(private pool: Pool) {}

  /**
   * Create a new scenario for an AI system
   */
  async createScenario(
    tenantId: string,
    input: CreateScenarioInput,
    createdBy?: string
  ): Promise<SocioTechnicalScenario> {
    const id = uuidv4();
    const likelihood = input.likelihood || 'possible';
    const severity = input.severity || 'moderate';
    const riskScore = this.calculateRiskScore(likelihood, severity);

    const result = await this.pool.query(
      `INSERT INTO socio_technical_scenarios (
        id, tenant_id, ai_system_id, title, scenario_type, description, narrative,
        context_setting, actors, preconditions, primary_requirement, affected_requirements,
        likelihood, severity, risk_score, potential_harms, potential_benefits, mitigations,
        status, is_ai_generated, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        id,
        tenantId,
        input.aiSystemId,
        input.title,
        input.scenarioType,
        input.description,
        input.narrative || null,
        input.contextSetting || null,
        JSON.stringify(input.actors || []),
        JSON.stringify(input.preconditions || []),
        input.primaryRequirement || null,
        JSON.stringify(input.affectedRequirements || []),
        likelihood,
        severity,
        riskScore,
        JSON.stringify(input.potentialHarms || []),
        JSON.stringify(input.potentialBenefits || []),
        JSON.stringify(input.mitigations || []),
        'draft',
        false,
        createdBy || null,
      ]
    );

    return this.mapRowToScenario(result.rows[0]);
  }

  /**
   * Get scenario by ID
   */
  async getScenario(tenantId: string, id: string): Promise<SocioTechnicalScenario | null> {
    const result = await this.pool.query(
      `SELECT * FROM socio_technical_scenarios WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToScenario(result.rows[0]);
  }

  /**
   * List scenarios for an AI system
   */
  async listScenarios(
    tenantId: string,
    aiSystemId: string,
    filters?: {
      scenarioType?: ScenarioType;
      status?: ScenarioStatus;
      primaryRequirement?: TrustworthyAIRequirementId;
      minRiskScore?: number;
    },
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<SocioTechnicalScenario>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE tenant_id = $1 AND ai_system_id = $2';
    const params: (string | number)[] = [tenantId, aiSystemId];
    let paramIndex = 3;

    if (filters?.scenarioType) {
      whereClause += ` AND scenario_type = $${paramIndex}`;
      params.push(filters.scenarioType);
      paramIndex++;
    }

    if (filters?.status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.primaryRequirement) {
      whereClause += ` AND primary_requirement = $${paramIndex}`;
      params.push(filters.primaryRequirement);
      paramIndex++;
    }

    if (filters?.minRiskScore !== undefined) {
      whereClause += ` AND risk_score >= $${paramIndex}`;
      params.push(filters.minRiskScore);
      paramIndex++;
    }

    // Get total count
    const countResult = await this.pool.query(
      `SELECT COUNT(*) FROM socio_technical_scenarios ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated data
    const sortBy = pagination?.sortBy || 'risk_score';
    const sortOrder = pagination?.sortOrder || 'desc';
    const dataResult = await this.pool.query(
      `SELECT * FROM socio_technical_scenarios ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: dataResult.rows.map((row) => this.mapRowToScenario(row)),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Update scenario
   */
  async updateScenario(
    tenantId: string,
    id: string,
    updates: Partial<CreateScenarioInput> & { status?: ScenarioStatus; reviewNotes?: string }
  ): Promise<SocioTechnicalScenario | null> {
    const existing = await this.getScenario(tenantId, id);
    if (!existing) {
      return null;
    }

    // Recalculate risk score if likelihood or severity changed
    const likelihood = updates.likelihood || existing.likelihood;
    const severity = updates.severity || existing.severity;
    const riskScore = this.calculateRiskScore(likelihood, severity);

    const updateFields: string[] = [];
    const params: unknown[] = [id, tenantId];
    let paramIndex = 3;

    const fieldMappings: Record<string, string> = {
      title: 'title',
      scenarioType: 'scenario_type',
      description: 'description',
      narrative: 'narrative',
      contextSetting: 'context_setting',
      actors: 'actors',
      preconditions: 'preconditions',
      primaryRequirement: 'primary_requirement',
      affectedRequirements: 'affected_requirements',
      likelihood: 'likelihood',
      severity: 'severity',
      potentialHarms: 'potential_harms',
      potentialBenefits: 'potential_benefits',
      mitigations: 'mitigations',
      status: 'status',
      reviewNotes: 'review_notes',
    };

    for (const [key, dbField] of Object.entries(fieldMappings)) {
      const value = updates[key as keyof typeof updates];
      if (value !== undefined) {
        let dbValue = value;
        if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
          dbValue = JSON.stringify(value);
        }
        updateFields.push(`${dbField} = $${paramIndex}`);
        params.push(dbValue);
        paramIndex++;
      }
    }

    // Always update risk score
    updateFields.push(`risk_score = $${paramIndex}`);
    params.push(riskScore);
    paramIndex++;

    updateFields.push('updated_at = NOW()');

    const result = await this.pool.query(
      `UPDATE socio_technical_scenarios
       SET ${updateFields.join(', ')}
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      params
    );

    return this.mapRowToScenario(result.rows[0]);
  }

  /**
   * Delete scenario
   */
  async deleteScenario(tenantId: string, id: string): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM socio_technical_scenarios WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Change scenario status
   */
  async changeStatus(
    tenantId: string,
    id: string,
    status: ScenarioStatus,
    reviewNotes?: string
  ): Promise<SocioTechnicalScenario | null> {
    const result = await this.pool.query(
      `UPDATE socio_technical_scenarios
       SET status = $3, review_notes = COALESCE($4, review_notes), updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [id, tenantId, status, reviewNotes || null]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToScenario(result.rows[0]);
  }

  /**
   * Get scenarios by requirement
   */
  async getScenariosByRequirement(
    tenantId: string,
    aiSystemId: string,
    requirementId: TrustworthyAIRequirementId
  ): Promise<SocioTechnicalScenario[]> {
    const result = await this.pool.query(
      `SELECT * FROM socio_technical_scenarios
       WHERE tenant_id = $1 AND ai_system_id = $2
         AND (primary_requirement = $3 OR affected_requirements ? $3)
       ORDER BY risk_score DESC`,
      [tenantId, aiSystemId, requirementId]
    );

    return result.rows.map((row) => this.mapRowToScenario(row));
  }

  /**
   * Get high-risk scenarios
   */
  async getHighRiskScenarios(
    tenantId: string,
    aiSystemId: string,
    minRiskScore: number = 12
  ): Promise<SocioTechnicalScenario[]> {
    const result = await this.pool.query(
      `SELECT * FROM socio_technical_scenarios
       WHERE tenant_id = $1 AND ai_system_id = $2
         AND risk_score >= $3
         AND status != 'archived'
       ORDER BY risk_score DESC`,
      [tenantId, aiSystemId, minRiskScore]
    );

    return result.rows.map((row) => this.mapRowToScenario(row));
  }

  /**
   * Get scenario statistics for an AI system
   */
  async getScenarioStats(
    tenantId: string,
    aiSystemId: string
  ): Promise<{
    total: number;
    byType: Record<ScenarioType, number>;
    byStatus: Record<ScenarioStatus, number>;
    byRequirement: Record<TrustworthyAIRequirementId, number>;
    averageRiskScore: number;
    highRiskCount: number;
  }> {
    const result = await this.pool.query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE scenario_type = 'use_case') as use_case,
        COUNT(*) FILTER (WHERE scenario_type = 'failure_mode') as failure_mode,
        COUNT(*) FILTER (WHERE scenario_type = 'edge_case') as edge_case,
        COUNT(*) FILTER (WHERE scenario_type = 'stakeholder_impact') as stakeholder_impact,
        COUNT(*) FILTER (WHERE scenario_type = 'adversarial') as adversarial,
        COUNT(*) FILTER (WHERE scenario_type = 'emergent') as emergent,
        COUNT(*) FILTER (WHERE status = 'draft') as status_draft,
        COUNT(*) FILTER (WHERE status = 'under_review') as status_under_review,
        COUNT(*) FILTER (WHERE status = 'validated') as status_validated,
        COUNT(*) FILTER (WHERE status = 'archived') as status_archived,
        AVG(risk_score) as avg_risk,
        COUNT(*) FILTER (WHERE risk_score >= 12) as high_risk,
        COUNT(*) FILTER (WHERE primary_requirement = 'human_agency_oversight') as req_hao,
        COUNT(*) FILTER (WHERE primary_requirement = 'technical_robustness_safety') as req_trs,
        COUNT(*) FILTER (WHERE primary_requirement = 'privacy_data_governance') as req_pdg,
        COUNT(*) FILTER (WHERE primary_requirement = 'transparency') as req_trans,
        COUNT(*) FILTER (WHERE primary_requirement = 'diversity_fairness_nondiscrimination') as req_dfn,
        COUNT(*) FILTER (WHERE primary_requirement = 'societal_environmental_wellbeing') as req_sew,
        COUNT(*) FILTER (WHERE primary_requirement = 'accountability') as req_acc
       FROM socio_technical_scenarios
       WHERE tenant_id = $1 AND ai_system_id = $2`,
      [tenantId, aiSystemId]
    );

    const row = result.rows[0];

    return {
      total: parseInt(row.total, 10),
      byType: {
        use_case: parseInt(row.use_case, 10),
        failure_mode: parseInt(row.failure_mode, 10),
        edge_case: parseInt(row.edge_case, 10),
        stakeholder_impact: parseInt(row.stakeholder_impact, 10),
        adversarial: parseInt(row.adversarial, 10),
        emergent: parseInt(row.emergent, 10),
      },
      byStatus: {
        draft: parseInt(row.status_draft, 10),
        under_review: parseInt(row.status_under_review, 10),
        validated: parseInt(row.status_validated, 10),
        archived: parseInt(row.status_archived, 10),
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
      averageRiskScore: parseFloat(row.avg_risk) || 0,
      highRiskCount: parseInt(row.high_risk, 10),
    };
  }

  /**
   * Store AI-generated scenarios
   */
  async storeGeneratedScenarios(
    tenantId: string,
    input: GenerateScenarioInput,
    scenarios: Omit<CreateScenarioInput, 'aiSystemId'>[],
    generationPrompt: string,
    createdBy?: string
  ): Promise<SocioTechnicalScenario[]> {
    const results: SocioTechnicalScenario[] = [];

    for (const scenario of scenarios) {
      const id = uuidv4();
      const likelihood = scenario.likelihood || 'possible';
      const severity = scenario.severity || 'moderate';
      const riskScore = this.calculateRiskScore(likelihood, severity);

      const result = await this.pool.query(
        `INSERT INTO socio_technical_scenarios (
          id, tenant_id, ai_system_id, title, scenario_type, description, narrative,
          context_setting, actors, preconditions, primary_requirement, affected_requirements,
          likelihood, severity, risk_score, potential_harms, potential_benefits, mitigations,
          status, is_ai_generated, generation_prompt, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        RETURNING *`,
        [
          id,
          tenantId,
          input.aiSystemId,
          scenario.title,
          scenario.scenarioType,
          scenario.description,
          scenario.narrative || null,
          scenario.contextSetting || null,
          JSON.stringify(scenario.actors || []),
          JSON.stringify(scenario.preconditions || []),
          scenario.primaryRequirement || input.focusRequirement || null,
          JSON.stringify(scenario.affectedRequirements || []),
          likelihood,
          severity,
          riskScore,
          JSON.stringify(scenario.potentialHarms || []),
          JSON.stringify(scenario.potentialBenefits || []),
          JSON.stringify(scenario.mitigations || []),
          'draft',
          true,
          generationPrompt,
          createdBy || null,
        ]
      );

      results.push(this.mapRowToScenario(result.rows[0]));
    }

    return results;
  }

  private calculateRiskScore(likelihood: Likelihood, severity: Severity): number {
    return LIKELIHOOD_SCORES[likelihood] * SEVERITY_SCORES[severity];
  }

  private mapRowToScenario(row: Record<string, unknown>): SocioTechnicalScenario {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      aiSystemId: row.ai_system_id as string,
      title: row.title as string,
      scenarioType: row.scenario_type as ScenarioType,
      description: row.description as string,
      narrative: row.narrative as string | undefined,
      contextSetting: row.context_setting as string | undefined,
      actors: (row.actors as ScenarioActor[]) || [],
      preconditions: (row.preconditions as string[]) || [],
      primaryRequirement: row.primary_requirement as TrustworthyAIRequirementId | undefined,
      affectedRequirements: (row.affected_requirements as TrustworthyAIRequirementId[]) || [],
      likelihood: row.likelihood as Likelihood,
      severity: row.severity as Severity,
      riskScore: row.risk_score as number,
      potentialHarms: (row.potential_harms as string[]) || [],
      potentialBenefits: (row.potential_benefits as string[]) || [],
      mitigations: (row.mitigations as string[]) || [],
      status: row.status as ScenarioStatus,
      reviewNotes: row.review_notes as string | undefined,
      isAiGenerated: row.is_ai_generated as boolean,
      generationPrompt: row.generation_prompt as string | undefined,
      metadata: (row.metadata as Record<string, unknown>) || {},
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      createdBy: row.created_by as string | undefined,
    };
  }
}
