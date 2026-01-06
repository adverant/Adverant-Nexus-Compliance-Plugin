/**
 * Framework Discoverer Service
 *
 * Handles entity profiling and automatic framework discovery based on entity
 * characteristics (industry, jurisdiction, size, data processing activities).
 *
 * Part of the Autonomous Compliance Learning System that auto-discovers,
 * auto-generates, and auto-assesses compliance requirements.
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types
// ============================================================================

export type EntitySize = 'micro' | 'small' | 'medium' | 'large' | 'enterprise';

export type Industry =
  | 'healthcare'
  | 'financial_services'
  | 'technology'
  | 'retail'
  | 'manufacturing'
  | 'energy'
  | 'telecommunications'
  | 'government'
  | 'education'
  | 'transportation'
  | 'media'
  | 'professional_services'
  | 'hospitality'
  | 'real_estate'
  | 'agriculture'
  | 'other';

export type Jurisdiction =
  | 'eu'
  | 'us'
  | 'uk'
  | 'canada'
  | 'australia'
  | 'japan'
  | 'singapore'
  | 'brazil'
  | 'india'
  | 'china'
  | 'global';

export type DataCategory =
  | 'personal_data'
  | 'sensitive_personal_data'
  | 'health_data'
  | 'financial_data'
  | 'biometric_data'
  | 'genetic_data'
  | 'children_data'
  | 'criminal_data'
  | 'location_data'
  | 'behavioral_data'
  | 'employee_data'
  | 'customer_data';

export type DiscoveredFrameworkStatus =
  | 'discovered'
  | 'analyzing'
  | 'generating'
  | 'active'
  | 'rejected';

export interface EntityProfile {
  id: string;
  tenantId: string;
  entityName: string;
  industry: Industry;
  subIndustry?: string;
  jurisdictions: Jurisdiction[];
  entitySize: EntitySize;
  isPubliclyTraded: boolean;
  processesPersonalData: boolean;
  usesAiSystems: boolean;
  isCriticalInfrastructure: boolean;
  dataCategories: DataCategory[];
  applicableFrameworks: string[];
  annualRevenue?: number;
  employeeCount?: number;
  lastProfileUpdate?: Date;
  lastFrameworkScan?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface EntityProfileCreate {
  tenantId: string;
  entityName: string;
  industry: Industry;
  subIndustry?: string;
  jurisdictions: Jurisdiction[];
  entitySize: EntitySize;
  isPubliclyTraded?: boolean;
  processesPersonalData?: boolean;
  usesAiSystems?: boolean;
  isCriticalInfrastructure?: boolean;
  dataCategories?: DataCategory[];
  annualRevenue?: number;
  employeeCount?: number;
  metadata?: Record<string, any>;
}

export interface EntityProfileUpdate {
  entityName?: string;
  industry?: Industry;
  subIndustry?: string;
  jurisdictions?: Jurisdiction[];
  entitySize?: EntitySize;
  isPubliclyTraded?: boolean;
  processesPersonalData?: boolean;
  usesAiSystems?: boolean;
  isCriticalInfrastructure?: boolean;
  dataCategories?: DataCategory[];
  annualRevenue?: number;
  employeeCount?: number;
  metadata?: Record<string, any>;
}

export interface DiscoveredFramework {
  id: string;
  name: string;
  jurisdiction: Jurisdiction;
  category: string;
  officialUrl?: string;
  discoverySource: string;
  discoveredAt: Date;
  relevanceScore: number;
  status: DiscoveredFrameworkStatus;
  aiSummary?: string;
  estimatedControls?: number;
  generatedFrameworkId?: string;
  metadata?: Record<string, any>;
}

export interface DiscoveredFrameworkCreate {
  name: string;
  jurisdiction: Jurisdiction;
  category: string;
  officialUrl?: string;
  discoverySource: string;
  relevanceScore?: number;
  aiSummary?: string;
  estimatedControls?: number;
  metadata?: Record<string, any>;
}

export interface FrameworkSuggestion {
  frameworkId: string;
  frameworkName: string;
  jurisdiction: Jurisdiction;
  category: string;
  relevanceScore: number;
  reasons: string[];
  isNew: boolean;
  estimatedControls?: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface RelevanceAssessment {
  frameworkName: string;
  relevanceScore: number;
  matchingFactors: MatchingFactor[];
  missingFactors: string[];
  overallRationale: string;
  recommendedPriority: 'critical' | 'high' | 'medium' | 'low';
}

export interface MatchingFactor {
  factor: string;
  weight: number;
  matched: boolean;
  details: string;
}

export interface FrameworkApplicabilityRule {
  frameworkId: string;
  frameworkName: string;
  conditions: ApplicabilityCondition[];
  priority: number;
}

export interface ApplicabilityCondition {
  field: keyof EntityProfile;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  value: any;
  weight: number;
}

// ============================================================================
// Service Implementation
// ============================================================================

export class FrameworkDiscovererService {
  constructor(private pool: Pool) {}

  // ==========================================================================
  // Entity Profile Management
  // ==========================================================================

  /**
   * Create a new entity profile for a tenant
   */
  async createEntityProfile(profile: EntityProfileCreate): Promise<EntityProfile> {
    const id = uuidv4();
    const now = new Date();

    const result = await this.pool.query(
      `INSERT INTO compliance_entity_profiles (
        id, tenant_id, entity_name, industry, sub_industry,
        jurisdictions, entity_size, is_publicly_traded,
        processes_personal_data, uses_ai_systems, is_critical_infrastructure,
        data_categories, annual_revenue, employee_count, metadata,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        id,
        profile.tenantId,
        profile.entityName,
        profile.industry,
        profile.subIndustry || null,
        JSON.stringify(profile.jurisdictions),
        profile.entitySize,
        profile.isPubliclyTraded || false,
        profile.processesPersonalData || false,
        profile.usesAiSystems || false,
        profile.isCriticalInfrastructure || false,
        JSON.stringify(profile.dataCategories || []),
        profile.annualRevenue || null,
        profile.employeeCount || null,
        JSON.stringify(profile.metadata || {}),
        now,
        now
      ]
    );

    return this.mapRowToEntityProfile(result.rows[0]);
  }

  /**
   * Get entity profile by tenant ID
   */
  async getEntityProfile(tenantId: string): Promise<EntityProfile | null> {
    const result = await this.pool.query(
      `SELECT * FROM compliance_entity_profiles WHERE tenant_id = $1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntityProfile(result.rows[0]);
  }

  /**
   * Get entity profile by ID
   */
  async getEntityProfileById(id: string): Promise<EntityProfile | null> {
    const result = await this.pool.query(
      `SELECT * FROM compliance_entity_profiles WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntityProfile(result.rows[0]);
  }

  /**
   * Update entity profile
   */
  async updateEntityProfile(
    tenantId: string,
    updates: EntityProfileUpdate
  ): Promise<EntityProfile | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.entityName !== undefined) {
      fields.push(`entity_name = $${paramIndex++}`);
      values.push(updates.entityName);
    }
    if (updates.industry !== undefined) {
      fields.push(`industry = $${paramIndex++}`);
      values.push(updates.industry);
    }
    if (updates.subIndustry !== undefined) {
      fields.push(`sub_industry = $${paramIndex++}`);
      values.push(updates.subIndustry);
    }
    if (updates.jurisdictions !== undefined) {
      fields.push(`jurisdictions = $${paramIndex++}`);
      values.push(JSON.stringify(updates.jurisdictions));
    }
    if (updates.entitySize !== undefined) {
      fields.push(`entity_size = $${paramIndex++}`);
      values.push(updates.entitySize);
    }
    if (updates.isPubliclyTraded !== undefined) {
      fields.push(`is_publicly_traded = $${paramIndex++}`);
      values.push(updates.isPubliclyTraded);
    }
    if (updates.processesPersonalData !== undefined) {
      fields.push(`processes_personal_data = $${paramIndex++}`);
      values.push(updates.processesPersonalData);
    }
    if (updates.usesAiSystems !== undefined) {
      fields.push(`uses_ai_systems = $${paramIndex++}`);
      values.push(updates.usesAiSystems);
    }
    if (updates.isCriticalInfrastructure !== undefined) {
      fields.push(`is_critical_infrastructure = $${paramIndex++}`);
      values.push(updates.isCriticalInfrastructure);
    }
    if (updates.dataCategories !== undefined) {
      fields.push(`data_categories = $${paramIndex++}`);
      values.push(JSON.stringify(updates.dataCategories));
    }
    if (updates.annualRevenue !== undefined) {
      fields.push(`annual_revenue = $${paramIndex++}`);
      values.push(updates.annualRevenue);
    }
    if (updates.employeeCount !== undefined) {
      fields.push(`employee_count = $${paramIndex++}`);
      values.push(updates.employeeCount);
    }
    if (updates.metadata !== undefined) {
      fields.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(updates.metadata));
    }

    if (fields.length === 0) {
      return this.getEntityProfile(tenantId);
    }

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());

    fields.push(`last_profile_update = $${paramIndex++}`);
    values.push(new Date());

    values.push(tenantId);

    const result = await this.pool.query(
      `UPDATE compliance_entity_profiles
       SET ${fields.join(', ')}
       WHERE tenant_id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntityProfile(result.rows[0]);
  }

  /**
   * Delete entity profile
   */
  async deleteEntityProfile(tenantId: string): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM compliance_entity_profiles WHERE tenant_id = $1`,
      [tenantId]
    );

    return (result.rowCount ?? 0) > 0;
  }

  // ==========================================================================
  // Framework Discovery
  // ==========================================================================

  /**
   * Discover applicable frameworks for an entity based on its profile
   */
  async discoverApplicableFrameworks(tenantId: string): Promise<FrameworkSuggestion[]> {
    const profile = await this.getEntityProfile(tenantId);
    if (!profile) {
      throw new Error(`Entity profile not found for tenant: ${tenantId}`);
    }

    const suggestions: FrameworkSuggestion[] = [];
    const applicabilityRules = this.getApplicabilityRules();

    // Check existing frameworks in the system
    const existingFrameworks = await this.pool.query(
      `SELECT id, name, jurisdiction, category FROM compliance_frameworks WHERE is_active = true`
    );

    for (const framework of existingFrameworks.rows) {
      const rule = applicabilityRules.find(r => r.frameworkId === framework.id);
      if (rule) {
        const assessment = this.evaluateApplicability(profile, rule);
        if (assessment.relevanceScore >= 0.5) {
          suggestions.push({
            frameworkId: framework.id,
            frameworkName: framework.name,
            jurisdiction: framework.jurisdiction as Jurisdiction,
            category: framework.category,
            relevanceScore: assessment.relevanceScore,
            reasons: assessment.matchingFactors
              .filter(f => f.matched)
              .map(f => f.details),
            isNew: false,
            priority: assessment.recommendedPriority
          });
        }
      }
    }

    // Check discovered frameworks not yet in system
    const discoveredFrameworks = await this.pool.query(
      `SELECT * FROM compliance_discovered_frameworks
       WHERE status IN ('discovered', 'analyzing')
       ORDER BY relevance_score DESC`
    );

    for (const row of discoveredFrameworks.rows) {
      const discovered = this.mapRowToDiscoveredFramework(row);
      const relevance = await this.calculateRelevance(profile, discovered);

      if (relevance >= 0.5) {
        suggestions.push({
          frameworkId: discovered.id,
          frameworkName: discovered.name,
          jurisdiction: discovered.jurisdiction,
          category: discovered.category,
          relevanceScore: relevance,
          reasons: this.getRelevanceReasons(profile, discovered),
          isNew: true,
          estimatedControls: discovered.estimatedControls,
          priority: this.calculatePriority(relevance)
        });
      }
    }

    // Sort by relevance score descending
    suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Update profile with discovered frameworks
    await this.pool.query(
      `UPDATE compliance_entity_profiles
       SET applicable_frameworks = $1, last_framework_scan = $2, updated_at = $2
       WHERE tenant_id = $3`,
      [
        JSON.stringify(suggestions.map(s => s.frameworkId)),
        new Date(),
        tenantId
      ]
    );

    return suggestions;
  }

  /**
   * Analyze relevance of a specific framework for an entity
   */
  async analyzeFrameworkRelevance(
    tenantId: string,
    frameworkId: string
  ): Promise<RelevanceAssessment> {
    const profile = await this.getEntityProfile(tenantId);
    if (!profile) {
      throw new Error(`Entity profile not found for tenant: ${tenantId}`);
    }

    // Check if it's an existing framework
    const framework = await this.pool.query(
      `SELECT id, name, jurisdiction, category FROM compliance_frameworks WHERE id = $1`,
      [frameworkId]
    );

    if (framework.rows.length > 0) {
      const rule = this.getApplicabilityRules().find(r => r.frameworkId === frameworkId);
      if (rule) {
        return this.evaluateApplicability(profile, rule);
      }
    }

    // Check discovered frameworks
    const discovered = await this.getDiscoveredFramework(frameworkId);
    if (discovered) {
      return this.createRelevanceAssessment(profile, discovered);
    }

    throw new Error(`Framework not found: ${frameworkId}`);
  }

  /**
   * Add a discovered framework
   */
  async addDiscoveredFramework(framework: DiscoveredFrameworkCreate): Promise<DiscoveredFramework> {
    const id = uuidv4();
    const now = new Date();

    const result = await this.pool.query(
      `INSERT INTO compliance_discovered_frameworks (
        id, name, jurisdiction, category, official_url, discovery_source,
        discovered_at, relevance_score, status, ai_summary, estimated_controls, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        id,
        framework.name,
        framework.jurisdiction,
        framework.category,
        framework.officialUrl || null,
        framework.discoverySource,
        now,
        framework.relevanceScore || 0,
        'discovered',
        framework.aiSummary || null,
        framework.estimatedControls || null,
        JSON.stringify(framework.metadata || {})
      ]
    );

    return this.mapRowToDiscoveredFramework(result.rows[0]);
  }

  /**
   * Get discovered framework by ID
   */
  async getDiscoveredFramework(id: string): Promise<DiscoveredFramework | null> {
    const result = await this.pool.query(
      `SELECT * FROM compliance_discovered_frameworks WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToDiscoveredFramework(result.rows[0]);
  }

  /**
   * List discovered frameworks
   */
  async listDiscoveredFrameworks(options?: {
    status?: DiscoveredFrameworkStatus;
    jurisdiction?: Jurisdiction;
    minRelevance?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ frameworks: DiscoveredFramework[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (options?.status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(options.status);
    }
    if (options?.jurisdiction) {
      conditions.push(`jurisdiction = $${paramIndex++}`);
      values.push(options.jurisdiction);
    }
    if (options?.minRelevance !== undefined) {
      conditions.push(`relevance_score >= $${paramIndex++}`);
      values.push(options.minRelevance);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Get total count
    const countResult = await this.pool.query(
      `SELECT COUNT(*) FROM compliance_discovered_frameworks ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    values.push(limit, offset);

    const result = await this.pool.query(
      `SELECT * FROM compliance_discovered_frameworks
       ${whereClause}
       ORDER BY relevance_score DESC, discovered_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      values
    );

    return {
      frameworks: result.rows.map(row => this.mapRowToDiscoveredFramework(row)),
      total
    };
  }

  /**
   * Update discovered framework status
   */
  async updateDiscoveredFrameworkStatus(
    id: string,
    status: DiscoveredFrameworkStatus,
    generatedFrameworkId?: string
  ): Promise<DiscoveredFramework | null> {
    const result = await this.pool.query(
      `UPDATE compliance_discovered_frameworks
       SET status = $1, generated_framework_id = $2
       WHERE id = $3
       RETURNING *`,
      [status, generatedFrameworkId || null, id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToDiscoveredFramework(result.rows[0]);
  }

  /**
   * Accept a framework suggestion
   */
  async acceptSuggestion(
    tenantId: string,
    suggestionId: string
  ): Promise<{ success: boolean; message: string; frameworkId?: string }> {
    // Check if it's an existing framework
    const existingFramework = await this.pool.query(
      `SELECT id, name FROM compliance_frameworks WHERE id = $1`,
      [suggestionId]
    );

    if (existingFramework.rows.length > 0) {
      // Add to tenant's applicable frameworks
      await this.pool.query(
        `UPDATE compliance_entity_profiles
         SET applicable_frameworks = applicable_frameworks || $1::jsonb,
             updated_at = NOW()
         WHERE tenant_id = $2
         AND NOT applicable_frameworks ? $3`,
        [JSON.stringify([suggestionId]), tenantId, suggestionId]
      );

      return {
        success: true,
        message: `Framework ${existingFramework.rows[0].name} added to your compliance scope`,
        frameworkId: suggestionId
      };
    }

    // Check if it's a discovered framework
    const discovered = await this.getDiscoveredFramework(suggestionId);
    if (discovered) {
      // Mark as generating - will trigger control generation
      await this.updateDiscoveredFrameworkStatus(suggestionId, 'generating');

      return {
        success: true,
        message: `Framework ${discovered.name} queued for control generation. You will be notified when controls are ready.`,
        frameworkId: suggestionId
      };
    }

    return {
      success: false,
      message: `Suggestion not found: ${suggestionId}`
    };
  }

  /**
   * Reject a framework suggestion
   */
  async rejectSuggestion(
    tenantId: string,
    suggestionId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    // Check if it's a discovered framework
    const discovered = await this.getDiscoveredFramework(suggestionId);
    if (discovered) {
      await this.pool.query(
        `UPDATE compliance_discovered_frameworks
         SET status = 'rejected',
             metadata = metadata || $1::jsonb
         WHERE id = $2`,
        [
          JSON.stringify({
            rejectedBy: tenantId,
            rejectedAt: new Date().toISOString(),
            rejectionReason: reason
          }),
          suggestionId
        ]
      );

      return {
        success: true,
        message: `Framework ${discovered.name} rejected`
      };
    }

    // Remove from applicable frameworks if existing
    await this.pool.query(
      `UPDATE compliance_entity_profiles
       SET applicable_frameworks = applicable_frameworks - $1,
           updated_at = NOW()
       WHERE tenant_id = $2`,
      [suggestionId, tenantId]
    );

    return {
      success: true,
      message: `Framework removed from suggestions`
    };
  }

  // ==========================================================================
  // Framework Applicability Rules
  // ==========================================================================

  /**
   * Get built-in applicability rules for known frameworks
   */
  private getApplicabilityRules(): FrameworkApplicabilityRule[] {
    return [
      // GDPR
      {
        frameworkId: 'gdpr',
        frameworkName: 'GDPR',
        conditions: [
          { field: 'jurisdictions', operator: 'contains', value: 'eu', weight: 0.5 },
          { field: 'processesPersonalData', operator: 'equals', value: true, weight: 0.5 }
        ],
        priority: 1
      },
      // EU AI Act
      {
        frameworkId: 'eu-ai-act',
        frameworkName: 'EU AI Act',
        conditions: [
          { field: 'jurisdictions', operator: 'contains', value: 'eu', weight: 0.4 },
          { field: 'usesAiSystems', operator: 'equals', value: true, weight: 0.6 }
        ],
        priority: 1
      },
      // NIS2
      {
        frameworkId: 'nis2',
        frameworkName: 'NIS2 Directive',
        conditions: [
          { field: 'jurisdictions', operator: 'contains', value: 'eu', weight: 0.3 },
          { field: 'isCriticalInfrastructure', operator: 'equals', value: true, weight: 0.4 },
          { field: 'entitySize', operator: 'in', value: ['medium', 'large', 'enterprise'], weight: 0.3 }
        ],
        priority: 1
      },
      // ISO 27001
      {
        frameworkId: 'iso-27001',
        frameworkName: 'ISO 27001:2022',
        conditions: [
          { field: 'entitySize', operator: 'in', value: ['medium', 'large', 'enterprise'], weight: 0.4 },
          { field: 'processesPersonalData', operator: 'equals', value: true, weight: 0.3 },
          { field: 'isPubliclyTraded', operator: 'equals', value: true, weight: 0.3 }
        ],
        priority: 2
      },
      // ISO 27701
      {
        frameworkId: 'iso-27701',
        frameworkName: 'ISO 27701',
        conditions: [
          { field: 'processesPersonalData', operator: 'equals', value: true, weight: 0.6 },
          { field: 'dataCategories', operator: 'contains', value: 'sensitive_personal_data', weight: 0.4 }
        ],
        priority: 2
      },
      // SOC 2
      {
        frameworkId: 'soc2',
        frameworkName: 'SOC 2 Type II',
        conditions: [
          { field: 'industry', operator: 'in', value: ['technology', 'financial_services', 'healthcare'], weight: 0.4 },
          { field: 'entitySize', operator: 'in', value: ['small', 'medium', 'large', 'enterprise'], weight: 0.3 },
          { field: 'jurisdictions', operator: 'contains', value: 'us', weight: 0.3 }
        ],
        priority: 2
      },
      // HIPAA (healthcare + US)
      {
        frameworkId: 'hipaa',
        frameworkName: 'HIPAA',
        conditions: [
          { field: 'industry', operator: 'equals', value: 'healthcare', weight: 0.4 },
          { field: 'jurisdictions', operator: 'contains', value: 'us', weight: 0.3 },
          { field: 'dataCategories', operator: 'contains', value: 'health_data', weight: 0.3 }
        ],
        priority: 1
      },
      // PCI DSS (payment processing)
      {
        frameworkId: 'pci-dss',
        frameworkName: 'PCI DSS',
        conditions: [
          { field: 'dataCategories', operator: 'contains', value: 'financial_data', weight: 0.6 },
          { field: 'industry', operator: 'in', value: ['financial_services', 'retail'], weight: 0.4 }
        ],
        priority: 1
      }
    ];
  }

  /**
   * Evaluate applicability of a framework based on rules
   */
  private evaluateApplicability(
    profile: EntityProfile,
    rule: FrameworkApplicabilityRule
  ): RelevanceAssessment {
    const matchingFactors: MatchingFactor[] = [];
    let totalWeight = 0;
    let matchedWeight = 0;

    for (const condition of rule.conditions) {
      totalWeight += condition.weight;
      const matched = this.evaluateCondition(profile, condition);

      matchingFactors.push({
        factor: condition.field,
        weight: condition.weight,
        matched,
        details: this.getConditionDescription(condition, matched)
      });

      if (matched) {
        matchedWeight += condition.weight;
      }
    }

    const relevanceScore = totalWeight > 0 ? matchedWeight / totalWeight : 0;

    return {
      frameworkName: rule.frameworkName,
      relevanceScore,
      matchingFactors,
      missingFactors: matchingFactors
        .filter(f => !f.matched)
        .map(f => f.details),
      overallRationale: this.generateRationale(rule.frameworkName, matchingFactors, relevanceScore),
      recommendedPriority: this.calculatePriority(relevanceScore)
    };
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    profile: EntityProfile,
    condition: ApplicabilityCondition
  ): boolean {
    const fieldValue = profile[condition.field];

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;

      case 'contains':
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(condition.value);
        }
        return false;

      case 'greater_than':
        return typeof fieldValue === 'number' && fieldValue > condition.value;

      case 'less_than':
        return typeof fieldValue === 'number' && fieldValue < condition.value;

      case 'in':
        if (Array.isArray(condition.value)) {
          return condition.value.includes(fieldValue);
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Get human-readable description of a condition
   */
  private getConditionDescription(condition: ApplicabilityCondition, matched: boolean): string {
    const verb = matched ? 'matches' : 'does not match';

    switch (condition.field) {
      case 'jurisdictions':
        return `Entity ${verb} jurisdiction requirement: ${condition.value.toUpperCase()}`;
      case 'processesPersonalData':
        return matched
          ? 'Entity processes personal data'
          : 'Entity does not process personal data';
      case 'usesAiSystems':
        return matched
          ? 'Entity uses AI systems'
          : 'Entity does not use AI systems';
      case 'isCriticalInfrastructure':
        return matched
          ? 'Entity is critical infrastructure'
          : 'Entity is not critical infrastructure';
      case 'entitySize':
        return `Entity size ${verb}: ${Array.isArray(condition.value) ? condition.value.join(', ') : condition.value}`;
      case 'industry':
        return `Industry ${verb}: ${Array.isArray(condition.value) ? condition.value.join(', ') : condition.value}`;
      case 'dataCategories':
        return `Data categories ${verb}: ${condition.value}`;
      case 'isPubliclyTraded':
        return matched
          ? 'Entity is publicly traded'
          : 'Entity is not publicly traded';
      default:
        return `${condition.field} ${verb} ${condition.value}`;
    }
  }

  /**
   * Generate rationale text for relevance assessment
   */
  private generateRationale(
    frameworkName: string,
    factors: MatchingFactor[],
    score: number
  ): string {
    const matched = factors.filter(f => f.matched);
    const unmatched = factors.filter(f => !f.matched);

    if (score >= 0.8) {
      return `${frameworkName} is highly applicable. ${matched.length} of ${factors.length} criteria met: ${matched.map(f => f.factor).join(', ')}.`;
    } else if (score >= 0.5) {
      return `${frameworkName} is moderately applicable. Consider implementing if ${unmatched.map(f => f.factor).join(', ')} become relevant.`;
    } else {
      return `${frameworkName} has limited applicability. Only ${matched.length} of ${factors.length} criteria met.`;
    }
  }

  /**
   * Calculate priority based on relevance score
   */
  private calculatePriority(score: number): 'critical' | 'high' | 'medium' | 'low' {
    if (score >= 0.9) return 'critical';
    if (score >= 0.7) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Calculate relevance of a discovered framework for a profile
   */
  private async calculateRelevance(
    profile: EntityProfile,
    framework: DiscoveredFramework
  ): Promise<number> {
    let score = 0;

    // Jurisdiction match
    if (profile.jurisdictions.includes(framework.jurisdiction)) {
      score += 0.3;
    }

    // Category-based scoring
    const categoryScores: Record<string, (p: EntityProfile) => number> = {
      'data_protection': (p) => p.processesPersonalData ? 0.4 : 0,
      'ai_governance': (p) => p.usesAiSystems ? 0.4 : 0,
      'cybersecurity': (p) => (p.entitySize !== 'micro' && p.entitySize !== 'small') ? 0.3 : 0.1,
      'critical_infrastructure': (p) => p.isCriticalInfrastructure ? 0.5 : 0,
      'financial': (p) => p.industry === 'financial_services' ? 0.4 : 0,
      'healthcare': (p) => p.industry === 'healthcare' ? 0.4 : 0
    };

    if (categoryScores[framework.category]) {
      score += categoryScores[framework.category](profile);
    } else {
      score += 0.2; // Default category score
    }

    // Size-based scoring (larger entities = more compliance needs)
    const sizeScores: Record<EntitySize, number> = {
      'micro': 0.1,
      'small': 0.15,
      'medium': 0.2,
      'large': 0.25,
      'enterprise': 0.3
    };
    score += sizeScores[profile.entitySize] || 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Get reasons for framework relevance
   */
  private getRelevanceReasons(
    profile: EntityProfile,
    framework: DiscoveredFramework
  ): string[] {
    const reasons: string[] = [];

    if (profile.jurisdictions.includes(framework.jurisdiction)) {
      reasons.push(`Operating in ${framework.jurisdiction.toUpperCase()} jurisdiction`);
    }

    if (framework.category === 'data_protection' && profile.processesPersonalData) {
      reasons.push('Processes personal data');
    }

    if (framework.category === 'ai_governance' && profile.usesAiSystems) {
      reasons.push('Uses AI systems');
    }

    if (framework.category === 'critical_infrastructure' && profile.isCriticalInfrastructure) {
      reasons.push('Critical infrastructure operator');
    }

    if (framework.category === 'healthcare' && profile.industry === 'healthcare') {
      reasons.push('Healthcare industry');
    }

    if (framework.category === 'financial' && profile.industry === 'financial_services') {
      reasons.push('Financial services industry');
    }

    if (['large', 'enterprise'].includes(profile.entitySize)) {
      reasons.push('Large organization with comprehensive compliance needs');
    }

    return reasons;
  }

  /**
   * Create a detailed relevance assessment for a discovered framework
   */
  private createRelevanceAssessment(
    profile: EntityProfile,
    framework: DiscoveredFramework
  ): RelevanceAssessment {
    const matchingFactors: MatchingFactor[] = [];

    // Jurisdiction
    const jurisdictionMatched = profile.jurisdictions.includes(framework.jurisdiction);
    matchingFactors.push({
      factor: 'jurisdiction',
      weight: 0.3,
      matched: jurisdictionMatched,
      details: jurisdictionMatched
        ? `Operating in ${framework.jurisdiction.toUpperCase()}`
        : `Not operating in ${framework.jurisdiction.toUpperCase()}`
    });

    // Category-specific checks
    if (framework.category === 'data_protection') {
      matchingFactors.push({
        factor: 'data_processing',
        weight: 0.4,
        matched: profile.processesPersonalData,
        details: profile.processesPersonalData
          ? 'Processes personal data'
          : 'Does not process personal data'
      });
    }

    if (framework.category === 'ai_governance') {
      matchingFactors.push({
        factor: 'ai_usage',
        weight: 0.4,
        matched: profile.usesAiSystems,
        details: profile.usesAiSystems
          ? 'Uses AI systems'
          : 'Does not use AI systems'
      });
    }

    // Calculate score
    let totalWeight = 0;
    let matchedWeight = 0;
    for (const factor of matchingFactors) {
      totalWeight += factor.weight;
      if (factor.matched) {
        matchedWeight += factor.weight;
      }
    }

    const relevanceScore = totalWeight > 0 ? matchedWeight / totalWeight : 0;

    return {
      frameworkName: framework.name,
      relevanceScore,
      matchingFactors,
      missingFactors: matchingFactors.filter(f => !f.matched).map(f => f.details),
      overallRationale: this.generateRationale(framework.name, matchingFactors, relevanceScore),
      recommendedPriority: this.calculatePriority(relevanceScore)
    };
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  private mapRowToEntityProfile(row: any): EntityProfile {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      entityName: row.entity_name,
      industry: row.industry as Industry,
      subIndustry: row.sub_industry || undefined,
      jurisdictions: Array.isArray(row.jurisdictions)
        ? row.jurisdictions
        : JSON.parse(row.jurisdictions || '[]'),
      entitySize: row.entity_size as EntitySize,
      isPubliclyTraded: row.is_publicly_traded,
      processesPersonalData: row.processes_personal_data,
      usesAiSystems: row.uses_ai_systems,
      isCriticalInfrastructure: row.is_critical_infrastructure,
      dataCategories: Array.isArray(row.data_categories)
        ? row.data_categories
        : JSON.parse(row.data_categories || '[]'),
      applicableFrameworks: Array.isArray(row.applicable_frameworks)
        ? row.applicable_frameworks
        : JSON.parse(row.applicable_frameworks || '[]'),
      annualRevenue: row.annual_revenue || undefined,
      employeeCount: row.employee_count || undefined,
      lastProfileUpdate: row.last_profile_update ? new Date(row.last_profile_update) : undefined,
      lastFrameworkScan: row.last_framework_scan ? new Date(row.last_framework_scan) : undefined,
      metadata: typeof row.metadata === 'string'
        ? JSON.parse(row.metadata)
        : (row.metadata || {}),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapRowToDiscoveredFramework(row: any): DiscoveredFramework {
    return {
      id: row.id,
      name: row.name,
      jurisdiction: row.jurisdiction as Jurisdiction,
      category: row.category,
      officialUrl: row.official_url || undefined,
      discoverySource: row.discovery_source,
      discoveredAt: new Date(row.discovered_at),
      relevanceScore: parseFloat(row.relevance_score) || 0,
      status: row.status as DiscoveredFrameworkStatus,
      aiSummary: row.ai_summary || undefined,
      estimatedControls: row.estimated_controls || undefined,
      generatedFrameworkId: row.generated_framework_id || undefined,
      metadata: typeof row.metadata === 'string'
        ? JSON.parse(row.metadata)
        : (row.metadata || {})
    };
  }
}
