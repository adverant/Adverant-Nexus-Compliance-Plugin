/**
 * Stakeholder Service - Manages stakeholder registry for AI systems
 * Part of Z-Inspection aligned qualitative assessment
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import {
  Stakeholder,
  CreateStakeholderInput,
  StakeholderEngagement,
  StakeholderType,
  ImpactLevel,
  EngagementStatus,
  VulnerabilityFactor,
  PaginationParams,
  PaginatedResponse,
} from '../types';

export class StakeholderService {
  constructor(private pool: Pool) {}

  /**
   * Create a new stakeholder for an AI system
   */
  async createStakeholder(
    tenantId: string,
    input: CreateStakeholderInput,
    createdBy?: string
  ): Promise<Stakeholder> {
    const id = uuidv4();

    const result = await this.pool.query(
      `INSERT INTO stakeholder_registry (
        id, tenant_id, ai_system_id, name, stakeholder_type, category, description,
        impact_level, impact_description, power_level, interest_level,
        is_vulnerable_group, vulnerability_factors, key_concerns, key_interests,
        engagement_status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        id,
        tenantId,
        input.aiSystemId,
        input.name,
        input.stakeholderType,
        input.category || null,
        input.description || null,
        input.impactLevel || 'moderate',
        input.impactDescription || null,
        input.powerLevel || 'low',
        input.interestLevel || 'high',
        input.isVulnerableGroup || false,
        JSON.stringify(input.vulnerabilityFactors || []),
        JSON.stringify(input.keyConcerns || []),
        JSON.stringify(input.keyInterests || []),
        'identified',
        createdBy || null,
      ]
    );

    return this.mapRowToStakeholder(result.rows[0]);
  }

  /**
   * Get stakeholder by ID
   */
  async getStakeholder(tenantId: string, id: string): Promise<Stakeholder | null> {
    const result = await this.pool.query(
      `SELECT * FROM stakeholder_registry WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToStakeholder(result.rows[0]);
  }

  /**
   * List stakeholders for an AI system
   */
  async listStakeholders(
    tenantId: string,
    aiSystemId: string,
    filters?: {
      stakeholderType?: StakeholderType;
      impactLevel?: ImpactLevel;
      isVulnerableGroup?: boolean;
      engagementStatus?: EngagementStatus;
    },
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Stakeholder>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE tenant_id = $1 AND ai_system_id = $2';
    const params: (string | boolean)[] = [tenantId, aiSystemId];
    let paramIndex = 3;

    if (filters?.stakeholderType) {
      whereClause += ` AND stakeholder_type = $${paramIndex}`;
      params.push(filters.stakeholderType);
      paramIndex++;
    }

    if (filters?.impactLevel) {
      whereClause += ` AND impact_level = $${paramIndex}`;
      params.push(filters.impactLevel);
      paramIndex++;
    }

    if (filters?.isVulnerableGroup !== undefined) {
      whereClause += ` AND is_vulnerable_group = $${paramIndex}`;
      params.push(filters.isVulnerableGroup);
      paramIndex++;
    }

    if (filters?.engagementStatus) {
      whereClause += ` AND engagement_status = $${paramIndex}`;
      params.push(filters.engagementStatus);
      paramIndex++;
    }

    // Get total count
    const countResult = await this.pool.query(
      `SELECT COUNT(*) FROM stakeholder_registry ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated data
    const sortBy = pagination?.sortBy || 'created_at';
    const sortOrder = pagination?.sortOrder || 'desc';
    const dataResult = await this.pool.query(
      `SELECT * FROM stakeholder_registry ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: dataResult.rows.map((row) => this.mapRowToStakeholder(row)),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Update stakeholder
   */
  async updateStakeholder(
    tenantId: string,
    id: string,
    updates: Partial<CreateStakeholderInput>
  ): Promise<Stakeholder | null> {
    const existing = await this.getStakeholder(tenantId, id);
    if (!existing) {
      return null;
    }

    const updateFields: string[] = [];
    const params: unknown[] = [id, tenantId];
    let paramIndex = 3;

    const fieldMappings: Record<keyof CreateStakeholderInput, string> = {
      aiSystemId: 'ai_system_id',
      name: 'name',
      stakeholderType: 'stakeholder_type',
      category: 'category',
      description: 'description',
      impactLevel: 'impact_level',
      impactDescription: 'impact_description',
      powerLevel: 'power_level',
      interestLevel: 'interest_level',
      isVulnerableGroup: 'is_vulnerable_group',
      vulnerabilityFactors: 'vulnerability_factors',
      keyConcerns: 'key_concerns',
      keyInterests: 'key_interests',
    };

    for (const [key, dbField] of Object.entries(fieldMappings)) {
      if (updates[key as keyof CreateStakeholderInput] !== undefined) {
        let value = updates[key as keyof CreateStakeholderInput];
        if (Array.isArray(value)) {
          value = JSON.stringify(value);
        }
        updateFields.push(`${dbField} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return existing;
    }

    updateFields.push('updated_at = NOW()');

    const result = await this.pool.query(
      `UPDATE stakeholder_registry
       SET ${updateFields.join(', ')}
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      params
    );

    return this.mapRowToStakeholder(result.rows[0]);
  }

  /**
   * Delete stakeholder
   */
  async deleteStakeholder(tenantId: string, id: string): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM stakeholder_registry WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Update engagement status
   */
  async updateEngagementStatus(
    tenantId: string,
    id: string,
    status: EngagementStatus,
    notes?: string
  ): Promise<Stakeholder | null> {
    const result = await this.pool.query(
      `UPDATE stakeholder_registry
       SET engagement_status = $3,
           engagement_notes = COALESCE($4, engagement_notes),
           last_engagement_date = NOW(),
           updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [id, tenantId, status, notes || null]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToStakeholder(result.rows[0]);
  }

  /**
   * Record stakeholder engagement
   */
  async recordEngagement(
    tenantId: string,
    stakeholderId: string,
    engagement: Omit<StakeholderEngagement, 'id' | 'stakeholderId' | 'tenantId' | 'createdAt'>
  ): Promise<StakeholderEngagement> {
    const id = uuidv4();

    const result = await this.pool.query(
      `INSERT INTO stakeholder_engagement_log (
        id, stakeholder_id, tenant_id, engagement_type, engagement_date,
        duration_minutes, participants, summary, key_insights,
        concerns_raised, suggestions, follow_up_required, follow_up_notes,
        evidence_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        id,
        stakeholderId,
        tenantId,
        engagement.engagementType,
        engagement.engagementDate,
        engagement.durationMinutes || null,
        JSON.stringify(engagement.participants || []),
        engagement.summary,
        JSON.stringify(engagement.keyInsights || []),
        JSON.stringify(engagement.concernsRaised || []),
        JSON.stringify(engagement.suggestions || []),
        engagement.followUpRequired || false,
        engagement.followUpNotes || null,
        engagement.evidenceId || null,
        engagement.createdBy || null,
      ]
    );

    // Update stakeholder engagement status
    await this.updateEngagementStatus(tenantId, stakeholderId, 'engaged');

    return this.mapRowToEngagement(result.rows[0]);
  }

  /**
   * List engagements for a stakeholder
   */
  async listEngagements(
    tenantId: string,
    stakeholderId: string
  ): Promise<StakeholderEngagement[]> {
    const result = await this.pool.query(
      `SELECT * FROM stakeholder_engagement_log
       WHERE stakeholder_id = $1 AND tenant_id = $2
       ORDER BY engagement_date DESC`,
      [stakeholderId, tenantId]
    );

    return result.rows.map((row) => this.mapRowToEngagement(row));
  }

  /**
   * Get stakeholder impact analysis for an AI system
   */
  async getImpactAnalysis(
    tenantId: string,
    aiSystemId: string
  ): Promise<{
    totalStakeholders: number;
    byType: Record<StakeholderType, number>;
    byImpactLevel: Record<ImpactLevel, number>;
    vulnerableGroups: number;
    engagementCoverage: number;
  }> {
    const result = await this.pool.query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE stakeholder_type = 'end_user') as end_user,
        COUNT(*) FILTER (WHERE stakeholder_type = 'affected_person') as affected_person,
        COUNT(*) FILTER (WHERE stakeholder_type = 'vulnerable_group') as vulnerable_group_type,
        COUNT(*) FILTER (WHERE stakeholder_type = 'operator') as operator,
        COUNT(*) FILTER (WHERE stakeholder_type = 'provider') as provider,
        COUNT(*) FILTER (WHERE stakeholder_type = 'society') as society,
        COUNT(*) FILTER (WHERE stakeholder_type = 'environment') as environment,
        COUNT(*) FILTER (WHERE stakeholder_type = 'regulator') as regulator,
        COUNT(*) FILTER (WHERE stakeholder_type = 'third_party') as third_party,
        COUNT(*) FILTER (WHERE impact_level = 'critical') as impact_critical,
        COUNT(*) FILTER (WHERE impact_level = 'high') as impact_high,
        COUNT(*) FILTER (WHERE impact_level = 'moderate') as impact_moderate,
        COUNT(*) FILTER (WHERE impact_level = 'low') as impact_low,
        COUNT(*) FILTER (WHERE impact_level = 'minimal') as impact_minimal,
        COUNT(*) FILTER (WHERE is_vulnerable_group = true) as vulnerable,
        COUNT(*) FILTER (WHERE engagement_status IN ('engaged', 'consulted', 'ongoing')) as engaged
       FROM stakeholder_registry
       WHERE tenant_id = $1 AND ai_system_id = $2`,
      [tenantId, aiSystemId]
    );

    const row = result.rows[0];
    const total = parseInt(row.total, 10);

    return {
      totalStakeholders: total,
      byType: {
        end_user: parseInt(row.end_user, 10),
        affected_person: parseInt(row.affected_person, 10),
        vulnerable_group: parseInt(row.vulnerable_group_type, 10),
        operator: parseInt(row.operator, 10),
        provider: parseInt(row.provider, 10),
        society: parseInt(row.society, 10),
        environment: parseInt(row.environment, 10),
        regulator: parseInt(row.regulator, 10),
        third_party: parseInt(row.third_party, 10),
      },
      byImpactLevel: {
        critical: parseInt(row.impact_critical, 10),
        high: parseInt(row.impact_high, 10),
        moderate: parseInt(row.impact_moderate, 10),
        low: parseInt(row.impact_low, 10),
        minimal: parseInt(row.impact_minimal, 10),
      },
      vulnerableGroups: parseInt(row.vulnerable, 10),
      engagementCoverage: total > 0 ? (parseInt(row.engaged, 10) / total) * 100 : 0,
    };
  }

  /**
   * Get stakeholders with pending follow-up
   */
  async getPendingFollowUps(tenantId: string): Promise<
    Array<{
      stakeholder: Stakeholder;
      lastEngagement: StakeholderEngagement;
    }>
  > {
    const result = await this.pool.query(
      `SELECT s.*, e.id as engagement_id, e.engagement_type, e.engagement_date,
              e.summary as engagement_summary, e.follow_up_notes
       FROM stakeholder_registry s
       JOIN stakeholder_engagement_log e ON s.id = e.stakeholder_id
       WHERE s.tenant_id = $1
         AND e.follow_up_required = true
         AND NOT EXISTS (
           SELECT 1 FROM stakeholder_engagement_log e2
           WHERE e2.stakeholder_id = s.id
             AND e2.engagement_date > e.engagement_date
         )
       ORDER BY e.engagement_date ASC`,
      [tenantId]
    );

    return result.rows.map((row) => ({
      stakeholder: this.mapRowToStakeholder(row),
      lastEngagement: {
        id: row.engagement_id,
        stakeholderId: row.id,
        tenantId: row.tenant_id,
        engagementType: row.engagement_type,
        engagementDate: row.engagement_date,
        summary: row.engagement_summary,
        keyInsights: [],
        concernsRaised: [],
        suggestions: [],
        participants: [],
        followUpRequired: true,
        followUpNotes: row.follow_up_notes,
        createdAt: row.engagement_date,
      },
    }));
  }

  private mapRowToStakeholder(row: Record<string, unknown>): Stakeholder {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      aiSystemId: row.ai_system_id as string,
      name: row.name as string,
      stakeholderType: row.stakeholder_type as StakeholderType,
      category: row.category as string | undefined,
      description: row.description as string | undefined,
      impactLevel: row.impact_level as ImpactLevel,
      impactDescription: row.impact_description as string | undefined,
      powerLevel: row.power_level as 'high' | 'medium' | 'low',
      interestLevel: row.interest_level as 'high' | 'medium' | 'low',
      isVulnerableGroup: row.is_vulnerable_group as boolean,
      vulnerabilityFactors: (row.vulnerability_factors as VulnerabilityFactor[]) || [],
      engagementStatus: row.engagement_status as EngagementStatus,
      engagementNotes: row.engagement_notes as string | undefined,
      lastEngagementDate: row.last_engagement_date
        ? new Date(row.last_engagement_date as string)
        : undefined,
      keyConcerns: (row.key_concerns as string[]) || [],
      keyInterests: (row.key_interests as string[]) || [],
      metadata: (row.metadata as Record<string, unknown>) || {},
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      createdBy: row.created_by as string | undefined,
    };
  }

  private mapRowToEngagement(row: Record<string, unknown>): StakeholderEngagement {
    return {
      id: row.id as string,
      stakeholderId: row.stakeholder_id as string,
      tenantId: row.tenant_id as string,
      engagementType: row.engagement_type as StakeholderEngagement['engagementType'],
      engagementDate: new Date(row.engagement_date as string),
      durationMinutes: row.duration_minutes as number | undefined,
      participants: (row.participants as string[]) || [],
      summary: row.summary as string,
      keyInsights: (row.key_insights as string[]) || [],
      concernsRaised: (row.concerns_raised as string[]) || [],
      suggestions: (row.suggestions as string[]) || [],
      followUpRequired: row.follow_up_required as boolean,
      followUpNotes: row.follow_up_notes as string | undefined,
      evidenceId: row.evidence_id as string | undefined,
      createdAt: new Date(row.created_at as string),
      createdBy: row.created_by as string | undefined,
    };
  }
}
