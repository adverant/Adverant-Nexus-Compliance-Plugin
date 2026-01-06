/**
 * Cross-Analysis Service
 *
 * Provides cross-framework analysis capabilities including control mapping,
 * gap analysis, requirement coverage, and Z-Inspection integration.
 *
 * Enables comparison between different compliance frameworks and maps
 * qualitative findings to quantitative controls.
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { TrustworthyAIRequirementId } from '../types/qualitative';

// ============================================================================
// Types
// ============================================================================

export type RelationshipType =
  | 'equivalent'
  | 'partial'
  | 'related'
  | 'supersedes'
  | 'complementary';

export type MappingSource =
  | 'system'
  | 'manual'
  | 'ai';

export interface ControlCrossReference {
  id: string;
  sourceControlId: string;
  targetControlId: string;
  sourceFrameworkId: string;
  targetFrameworkId: string;
  relationshipType: RelationshipType;
  mappingConfidence: number;
  mappedBy: MappingSource;
  rationale?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface FrameworkOverlap {
  framework1Id: string;
  framework1Name: string;
  framework2Id: string;
  framework2Name: string;
  totalMappings: number;
  equivalentCount: number;
  partialCount: number;
  relatedCount: number;
  overlapPercentage: number;
  lastCalculated: Date;
}

export interface ControlMappingMatrix {
  frameworks: FrameworkInfo[];
  matrix: MatrixCell[][];
  summary: MatrixSummary;
}

export interface FrameworkInfo {
  id: string;
  name: string;
  controlCount: number;
}

export interface MatrixCell {
  framework1Id: string;
  framework2Id: string;
  mappingCount: number;
  overlapPercentage: number;
}

export interface MatrixSummary {
  totalFrameworks: number;
  totalMappings: number;
  averageOverlap: number;
  mostMappedFramework: string;
}

export interface RequirementCoverage {
  requirementId: TrustworthyAIRequirementId;
  requirementName: string;
  frameworkCoverage: FrameworkCoverageDetail[];
  totalControls: number;
  averageCoverage: number;
}

export interface FrameworkCoverageDetail {
  frameworkId: string;
  frameworkName: string;
  controlCount: number;
  coverageScore: number;
  controls: ControlInfo[];
}

export interface ControlInfo {
  id: string;
  title: string;
  category: string;
  mappingStrength: number;
}

export interface GapAnalysis {
  tenantId: string;
  unmappedControls: UnmappedControl[];
  unmappedRequirements: UnmappedRequirement[];
  recommendations: GapRecommendation[];
  overallCoverageScore: number;
  lastAnalyzed: Date;
}

export interface UnmappedControl {
  controlId: string;
  controlTitle: string;
  frameworkId: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  suggestedMappings: SuggestedMapping[];
}

export interface UnmappedRequirement {
  requirementId: TrustworthyAIRequirementId;
  requirementName: string;
  frameworksWithGaps: string[];
  suggestedControls: string[];
}

export interface SuggestedMapping {
  targetControlId: string;
  targetFrameworkId: string;
  confidence: number;
  reason: string;
}

export interface GapRecommendation {
  type: 'add_control' | 'add_mapping' | 'increase_coverage';
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedFrameworks: string[];
  estimatedEffort: 'low' | 'medium' | 'high';
}

export interface ZInspectionControlLink {
  id: string;
  zInspectionFindingId: string;
  controlId: string;
  frameworkId: string;
  linkType: 'direct' | 'indirect' | 'recommended';
  weightAdjustment: number;
  rationale: string;
  createdAt: Date;
}

export interface ControlsByFramework {
  [frameworkId: string]: {
    frameworkName: string;
    controls: ControlInfo[];
  };
}

export interface WeightAdjustment {
  controlId: string;
  originalWeight: number;
  adjustedWeight: number;
  adjustmentReason: string;
  zInspectionFindingId: string;
}

export interface CrossAnalysisQuery {
  id: string;
  tenantId: string;
  name: string;
  queryType: 'cross_framework' | 'gap_analysis' | 'requirement_coverage' | 'z_inspection';
  parameters: Record<string, any>;
  isScheduled: boolean;
  scheduleFrequency?: string;
  lastRun?: Date;
  savedResults?: any;
  createdAt: Date;
}

export interface AIAnalysisResult {
  query: string;
  findings: string[];
  recommendations: string[];
  confidence: number;
  relatedControls: string[];
  crossFrameworkInsights: string[];
}

// ============================================================================
// Service Implementation
// ============================================================================

export class CrossAnalysisService {
  constructor(private pool: Pool) {}

  // ==========================================================================
  // Control Cross-Reference Management
  // ==========================================================================

  /**
   * Create a cross-reference between controls
   */
  async createCrossReference(
    sourceControlId: string,
    targetControlId: string,
    relationshipType: RelationshipType,
    confidence: number,
    mappedBy: MappingSource,
    rationale?: string
  ): Promise<ControlCrossReference> {
    // Get framework IDs for the controls
    const sourceResult = await this.pool.query(
      `SELECT framework_id FROM compliance_controls WHERE id = $1`,
      [sourceControlId]
    );
    const targetResult = await this.pool.query(
      `SELECT framework_id FROM compliance_controls WHERE id = $1`,
      [targetControlId]
    );

    if (sourceResult.rows.length === 0 || targetResult.rows.length === 0) {
      throw new Error('One or both controls not found');
    }

    const id = uuidv4();
    const now = new Date();

    const result = await this.pool.query(
      `INSERT INTO control_cross_references (
        id, source_control_id, target_control_id, source_framework_id,
        target_framework_id, relationship_type, mapping_confidence,
        mapped_by, rationale, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (source_control_id, target_control_id) DO UPDATE SET
        relationship_type = EXCLUDED.relationship_type,
        mapping_confidence = EXCLUDED.mapping_confidence,
        rationale = EXCLUDED.rationale,
        updated_at = NOW()
      RETURNING *`,
      [
        id,
        sourceControlId,
        targetControlId,
        sourceResult.rows[0].framework_id,
        targetResult.rows[0].framework_id,
        relationshipType,
        confidence,
        mappedBy,
        rationale || null,
        now
      ]
    );

    // Invalidate overlap cache
    await this.invalidateOverlapCache(
      sourceResult.rows[0].framework_id,
      targetResult.rows[0].framework_id
    );

    return this.mapRowToCrossReference(result.rows[0]);
  }

  /**
   * Find equivalent controls across frameworks
   */
  async findEquivalentControls(controlId: string): Promise<ControlCrossReference[]> {
    const result = await this.pool.query(
      `SELECT ccr.*,
              sc.title as source_title, tc.title as target_title,
              sf.name as source_framework_name, tf.name as target_framework_name
       FROM control_cross_references ccr
       JOIN compliance_controls sc ON ccr.source_control_id = sc.id
       JOIN compliance_controls tc ON ccr.target_control_id = tc.id
       JOIN compliance_frameworks sf ON ccr.source_framework_id = sf.id
       JOIN compliance_frameworks tf ON ccr.target_framework_id = tf.id
       WHERE (ccr.source_control_id = $1 OR ccr.target_control_id = $1)
       AND ccr.relationship_type IN ('equivalent', 'partial')
       ORDER BY ccr.mapping_confidence DESC`,
      [controlId]
    );

    return result.rows.map(row => this.mapRowToCrossReference(row));
  }

  /**
   * Get control mapping matrix
   */
  async getControlMappingMatrix(tenantId?: string): Promise<ControlMappingMatrix> {
    // Get all active frameworks
    const frameworksResult = await this.pool.query(
      `SELECT f.id, f.name, COUNT(c.id) as control_count
       FROM compliance_frameworks f
       LEFT JOIN compliance_controls c ON f.id = c.framework_id AND c.is_active = true
       WHERE f.is_active = true
       GROUP BY f.id, f.name
       ORDER BY f.name`
    );

    const frameworks: FrameworkInfo[] = frameworksResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      controlCount: parseInt(row.control_count, 10)
    }));

    // Build matrix
    const matrix: MatrixCell[][] = [];
    let totalMappings = 0;
    let totalOverlap = 0;
    let maxMappings = 0;
    let mostMappedFramework = '';

    for (let i = 0; i < frameworks.length; i++) {
      const row: MatrixCell[] = [];
      let frameworkMappings = 0;

      for (let j = 0; j < frameworks.length; j++) {
        if (i === j) {
          row.push({
            framework1Id: frameworks[i].id,
            framework2Id: frameworks[j].id,
            mappingCount: frameworks[i].controlCount,
            overlapPercentage: 100
          });
        } else {
          const overlap = await this.getFrameworkOverlapCached(
            frameworks[i].id,
            frameworks[j].id
          );

          row.push({
            framework1Id: frameworks[i].id,
            framework2Id: frameworks[j].id,
            mappingCount: overlap?.totalMappings || 0,
            overlapPercentage: overlap?.overlapPercentage || 0
          });

          frameworkMappings += overlap?.totalMappings || 0;
          totalMappings += overlap?.totalMappings || 0;
          totalOverlap += overlap?.overlapPercentage || 0;
        }
      }

      if (frameworkMappings > maxMappings) {
        maxMappings = frameworkMappings;
        mostMappedFramework = frameworks[i].name;
      }

      matrix.push(row);
    }

    const pairCount = (frameworks.length * (frameworks.length - 1)) / 2;

    return {
      frameworks,
      matrix,
      summary: {
        totalFrameworks: frameworks.length,
        totalMappings: Math.floor(totalMappings / 2), // Divide by 2 for bidirectional
        averageOverlap: pairCount > 0 ? totalOverlap / (pairCount * 2) : 0,
        mostMappedFramework
      }
    };
  }

  /**
   * Get framework overlap statistics
   */
  async getFrameworkOverlap(
    framework1Id: string,
    framework2Id: string
  ): Promise<FrameworkOverlap | null> {
    // Check cache first
    const cached = await this.getFrameworkOverlapCached(framework1Id, framework2Id);
    if (cached) {
      return cached;
    }

    // Calculate overlap
    const result = await this.pool.query(
      `SELECT
        relationship_type,
        COUNT(*) as count
       FROM control_cross_references
       WHERE (source_framework_id = $1 AND target_framework_id = $2)
          OR (source_framework_id = $2 AND target_framework_id = $1)
       GROUP BY relationship_type`,
      [framework1Id, framework2Id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    // Get framework names
    const namesResult = await this.pool.query(
      `SELECT id, name FROM compliance_frameworks WHERE id IN ($1, $2)`,
      [framework1Id, framework2Id]
    );

    const framework1 = namesResult.rows.find(r => r.id === framework1Id);
    const framework2 = namesResult.rows.find(r => r.id === framework2Id);

    // Get control counts
    const countsResult = await this.pool.query(
      `SELECT framework_id, COUNT(*) as count
       FROM compliance_controls
       WHERE framework_id IN ($1, $2) AND is_active = true
       GROUP BY framework_id`,
      [framework1Id, framework2Id]
    );

    const f1Count = countsResult.rows.find(r => r.framework_id === framework1Id)?.count || 1;
    const f2Count = countsResult.rows.find(r => r.framework_id === framework2Id)?.count || 1;

    let equivalentCount = 0;
    let partialCount = 0;
    let relatedCount = 0;
    let totalMappings = 0;

    for (const row of result.rows) {
      const count = parseInt(row.count, 10);
      totalMappings += count;
      switch (row.relationship_type) {
        case 'equivalent':
          equivalentCount += count;
          break;
        case 'partial':
          partialCount += count;
          break;
        case 'related':
          relatedCount += count;
          break;
      }
    }

    const overlapPercentage = (totalMappings / Math.min(parseInt(f1Count, 10), parseInt(f2Count, 10))) * 100;

    const overlap: FrameworkOverlap = {
      framework1Id,
      framework1Name: framework1?.name || framework1Id,
      framework2Id,
      framework2Name: framework2?.name || framework2Id,
      totalMappings,
      equivalentCount,
      partialCount,
      relatedCount,
      overlapPercentage: Math.min(overlapPercentage, 100),
      lastCalculated: new Date()
    };

    // Cache the result
    await this.cacheFrameworkOverlap(overlap);

    return overlap;
  }

  // ==========================================================================
  // Requirement Coverage Analysis
  // ==========================================================================

  /**
   * Get controls for a specific trustworthy AI requirement
   */
  async getControlsForRequirement(
    requirementId: TrustworthyAIRequirementId
  ): Promise<ControlsByFramework> {
    const result = await this.pool.query(
      `SELECT
        rcm.control_id,
        rcm.mapping_strength,
        c.title as control_title,
        c.category,
        c.framework_id,
        f.name as framework_name
       FROM requirement_control_mappings rcm
       JOIN compliance_controls c ON rcm.control_id = c.id
       JOIN compliance_frameworks f ON c.framework_id = f.id
       WHERE rcm.requirement_id = $1
       AND c.is_active = true
       ORDER BY f.name, rcm.mapping_strength DESC`,
      [requirementId]
    );

    const controlsByFramework: ControlsByFramework = {};

    for (const row of result.rows) {
      if (!controlsByFramework[row.framework_id]) {
        controlsByFramework[row.framework_id] = {
          frameworkName: row.framework_name,
          controls: []
        };
      }

      controlsByFramework[row.framework_id].controls.push({
        id: row.control_id,
        title: row.control_title,
        category: row.category,
        mappingStrength: parseFloat(row.mapping_strength) || 0
      });
    }

    return controlsByFramework;
  }

  /**
   * Get requirement coverage across all frameworks
   */
  async getRequirementCoverage(): Promise<RequirementCoverage[]> {
    const requirements = await this.pool.query(
      `SELECT id, name FROM trustworthy_ai_requirements ORDER BY id`
    );

    const coverage: RequirementCoverage[] = [];

    for (const req of requirements.rows) {
      const controlsByFramework = await this.getControlsForRequirement(req.id);

      const frameworkCoverage: FrameworkCoverageDetail[] = [];
      let totalControls = 0;
      let totalScore = 0;

      for (const [frameworkId, data] of Object.entries(controlsByFramework)) {
        const avgStrength = data.controls.reduce((sum, c) => sum + c.mappingStrength, 0) /
          (data.controls.length || 1);

        frameworkCoverage.push({
          frameworkId,
          frameworkName: data.frameworkName,
          controlCount: data.controls.length,
          coverageScore: avgStrength,
          controls: data.controls
        });

        totalControls += data.controls.length;
        totalScore += avgStrength;
      }

      coverage.push({
        requirementId: req.id,
        requirementName: req.name,
        frameworkCoverage,
        totalControls,
        averageCoverage: frameworkCoverage.length > 0
          ? totalScore / frameworkCoverage.length
          : 0
      });
    }

    return coverage;
  }

  // ==========================================================================
  // Gap Analysis
  // ==========================================================================

  /**
   * Identify unmapped controls and requirements
   */
  async identifyGaps(tenantId: string): Promise<GapAnalysis> {
    const unmappedControls = await this.findUnmappedControls(tenantId);
    const unmappedRequirements = await this.findUnmappedRequirements(tenantId);
    const recommendations = this.generateGapRecommendations(unmappedControls, unmappedRequirements);

    // Calculate overall coverage
    const totalControls = await this.pool.query(
      `SELECT COUNT(*) FROM compliance_controls WHERE is_active = true`
    );
    const mappedControls = await this.pool.query(
      `SELECT COUNT(DISTINCT source_control_id) FROM control_cross_references`
    );

    const totalCount = parseInt(totalControls.rows[0].count, 10);
    const mappedCount = parseInt(mappedControls.rows[0].count, 10);
    const overallCoverageScore = totalCount > 0 ? (mappedCount / totalCount) * 100 : 0;

    return {
      tenantId,
      unmappedControls,
      unmappedRequirements,
      recommendations,
      overallCoverageScore,
      lastAnalyzed: new Date()
    };
  }

  /**
   * Find controls that are not mapped to other frameworks
   */
  async findUnmappedControls(tenantId: string): Promise<UnmappedControl[]> {
    const result = await this.pool.query(
      `SELECT c.id, c.title, c.framework_id, c.category,
              f.name as framework_name
       FROM compliance_controls c
       JOIN compliance_frameworks f ON c.framework_id = f.id
       WHERE c.is_active = true
       AND c.id NOT IN (
         SELECT DISTINCT source_control_id FROM control_cross_references
         UNION
         SELECT DISTINCT target_control_id FROM control_cross_references
       )
       ORDER BY c.framework_id, c.id
       LIMIT 100`
    );

    const unmappedControls: UnmappedControl[] = [];

    for (const row of result.rows) {
      // Find potential mappings using text similarity
      const suggestions = await this.suggestMappingsForControl(row.id, row.title, row.category);

      unmappedControls.push({
        controlId: row.id,
        controlTitle: row.title,
        frameworkId: row.framework_id,
        category: row.category,
        priority: this.determinePriority(row.category),
        suggestedMappings: suggestions
      });
    }

    return unmappedControls;
  }

  /**
   * Find requirements not fully covered by controls
   */
  async findUnmappedRequirements(tenantId: string): Promise<UnmappedRequirement[]> {
    const result = await this.pool.query(
      `SELECT r.id, r.name
       FROM trustworthy_ai_requirements r
       WHERE r.id NOT IN (
         SELECT DISTINCT requirement_id FROM requirement_control_mappings
       )
       OR r.id IN (
         SELECT requirement_id
         FROM requirement_control_mappings
         GROUP BY requirement_id
         HAVING COUNT(*) < 3
       )`
    );

    const unmappedRequirements: UnmappedRequirement[] = [];

    for (const row of result.rows) {
      // Find frameworks with gaps for this requirement
      const frameworkGaps = await this.findFrameworkGapsForRequirement(row.id);
      const suggestedControls = await this.suggestControlsForRequirement(row.id);

      unmappedRequirements.push({
        requirementId: row.id,
        requirementName: row.name,
        frameworksWithGaps: frameworkGaps,
        suggestedControls
      });
    }

    return unmappedRequirements;
  }

  // ==========================================================================
  // Z-Inspection Integration
  // ==========================================================================

  /**
   * Map Z-Inspection findings to controls
   */
  async mapZInspectionToControls(
    findingId: string
  ): Promise<ZInspectionControlLink[]> {
    // Get the finding details
    const findingResult = await this.pool.query(
      `SELECT qf.*, ta.requirement_assessments
       FROM qualitative_findings qf
       JOIN trustworthiness_assessments ta ON qf.assessment_id = ta.id
       WHERE qf.id = $1`,
      [findingId]
    );

    if (findingResult.rows.length === 0) {
      throw new Error(`Finding not found: ${findingId}`);
    }

    const finding = findingResult.rows[0];
    const links: ZInspectionControlLink[] = [];

    // Find related controls based on category and content
    const relatedControls = await this.findRelatedControls(
      finding.category,
      finding.title,
      finding.description
    );

    for (const control of relatedControls) {
      const linkId = uuidv4();
      const linkType = control.similarity >= 0.8 ? 'direct' :
        control.similarity >= 0.5 ? 'indirect' : 'recommended';

      const weightAdjustment = finding.finding_type === 'weakness' ? 0.2 :
        finding.finding_type === 'threat' ? 0.3 :
          finding.finding_type === 'recommendation' ? 0.1 : 0;

      await this.pool.query(
        `INSERT INTO z_inspection_control_links (
          id, z_inspection_finding_id, control_id, framework_id,
          link_type, weight_adjustment, rationale, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT DO NOTHING`,
        [
          linkId,
          findingId,
          control.controlId,
          control.frameworkId,
          linkType,
          weightAdjustment,
          `Mapped based on ${control.matchReason}`
        ]
      );

      links.push({
        id: linkId,
        zInspectionFindingId: findingId,
        controlId: control.controlId,
        frameworkId: control.frameworkId,
        linkType,
        weightAdjustment,
        rationale: `Mapped based on ${control.matchReason}`,
        createdAt: new Date()
      });
    }

    return links;
  }

  /**
   * Adjust control weights based on Z-Inspection report
   */
  async adjustControlWeights(
    zInspectionReportId: string
  ): Promise<WeightAdjustment[]> {
    // Get all findings from the report
    const findingsResult = await this.pool.query(
      `SELECT qf.*, ta.id as assessment_id
       FROM z_inspection_reports zr
       JOIN trustworthiness_assessments ta ON zr.assessment_id = ta.id
       JOIN qualitative_findings qf ON qf.assessment_id = ta.id
       WHERE zr.id = $1`,
      [zInspectionReportId]
    );

    const adjustments: WeightAdjustment[] = [];

    for (const finding of findingsResult.rows) {
      // Get linked controls
      const links = await this.pool.query(
        `SELECT * FROM z_inspection_control_links
         WHERE z_inspection_finding_id = $1`,
        [finding.id]
      );

      for (const link of links.rows) {
        if (link.weight_adjustment !== 0) {
          // Apply weight adjustment to control assessments
          await this.pool.query(
            `UPDATE control_assessments
             SET score = LEAST(100, score * (1 + $1))
             WHERE control_id = $2
             AND assessed_at > NOW() - INTERVAL '30 days'`,
            [link.weight_adjustment, link.control_id]
          );

          adjustments.push({
            controlId: link.control_id,
            originalWeight: 1.0,
            adjustedWeight: 1.0 + link.weight_adjustment,
            adjustmentReason: link.rationale,
            zInspectionFindingId: finding.id
          });
        }
      }
    }

    return adjustments;
  }

  // ==========================================================================
  // Saved Queries
  // ==========================================================================

  /**
   * Save an analysis query for later use
   */
  async saveAnalysisQuery(
    tenantId: string,
    name: string,
    queryType: 'cross_framework' | 'gap_analysis' | 'requirement_coverage' | 'z_inspection',
    parameters: Record<string, any>,
    scheduleFrequency?: string
  ): Promise<CrossAnalysisQuery> {
    const id = uuidv4();
    const now = new Date();

    const result = await this.pool.query(
      `INSERT INTO saved_analysis_queries (
        id, tenant_id, name, query_type, parameters,
        is_scheduled, schedule_frequency, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        id,
        tenantId,
        name,
        queryType,
        JSON.stringify(parameters),
        !!scheduleFrequency,
        scheduleFrequency || null,
        now
      ]
    );

    return this.mapRowToQuery(result.rows[0]);
  }

  /**
   * Run a saved analysis query
   */
  async runSavedQuery(queryId: string): Promise<any> {
    const queryResult = await this.pool.query(
      `SELECT * FROM saved_analysis_queries WHERE id = $1`,
      [queryId]
    );

    if (queryResult.rows.length === 0) {
      throw new Error(`Query not found: ${queryId}`);
    }

    const query = this.mapRowToQuery(queryResult.rows[0]);
    let result: any;

    switch (query.queryType) {
      case 'cross_framework':
        result = await this.getControlMappingMatrix(query.tenantId);
        break;
      case 'gap_analysis':
        result = await this.identifyGaps(query.tenantId);
        break;
      case 'requirement_coverage':
        result = await this.getRequirementCoverage();
        break;
      case 'z_inspection':
        if (query.parameters.reportId) {
          result = await this.adjustControlWeights(query.parameters.reportId);
        }
        break;
    }

    // Update last run time and save results
    await this.pool.query(
      `UPDATE saved_analysis_queries
       SET last_run = NOW(), saved_results = $1
       WHERE id = $2`,
      [JSON.stringify(result), queryId]
    );

    return result;
  }

  // ==========================================================================
  // AI-Powered Analysis
  // ==========================================================================

  /**
   * Perform AI-powered cross-framework analysis
   */
  async aiAnalyzeCrossFramework(
    query: string,
    context: {
      tenantId: string;
      frameworks?: string[];
      requirementFocus?: TrustworthyAIRequirementId[];
    }
  ): Promise<AIAnalysisResult> {
    // This would integrate with MageAgent for AI analysis
    // For now, provide a structured response based on available data

    const findings: string[] = [];
    const recommendations: string[] = [];
    const relatedControls: string[] = [];
    const crossFrameworkInsights: string[] = [];

    // Get relevant data based on query
    const queryLower = query.toLowerCase();

    if (queryLower.includes('gap') || queryLower.includes('missing')) {
      const gaps = await this.identifyGaps(context.tenantId);
      findings.push(`Found ${gaps.unmappedControls.length} unmapped controls`);
      findings.push(`Found ${gaps.unmappedRequirements.length} requirements with insufficient coverage`);
      recommendations.push(...gaps.recommendations.map(r => r.description));
    }

    if (queryLower.includes('overlap') || queryLower.includes('mapping')) {
      const matrix = await this.getControlMappingMatrix(context.tenantId);
      findings.push(`Analyzed ${matrix.summary.totalFrameworks} frameworks`);
      findings.push(`Found ${matrix.summary.totalMappings} cross-framework mappings`);
      crossFrameworkInsights.push(`Average overlap: ${matrix.summary.averageOverlap.toFixed(1)}%`);
      crossFrameworkInsights.push(`Most connected: ${matrix.summary.mostMappedFramework}`);
    }

    if (queryLower.includes('requirement') || queryLower.includes('trustworth')) {
      const coverage = await this.getRequirementCoverage();
      for (const req of coverage) {
        if (req.averageCoverage < 0.5) {
          findings.push(`Low coverage for ${req.requirementName}: ${(req.averageCoverage * 100).toFixed(0)}%`);
          recommendations.push(`Increase control mapping for ${req.requirementName}`);
        }
      }
    }

    return {
      query,
      findings,
      recommendations,
      confidence: 0.75,
      relatedControls,
      crossFrameworkInsights
    };
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private async getFrameworkOverlapCached(
    framework1Id: string,
    framework2Id: string
  ): Promise<FrameworkOverlap | null> {
    const result = await this.pool.query(
      `SELECT * FROM framework_overlap_cache
       WHERE (framework1_id = $1 AND framework2_id = $2)
          OR (framework1_id = $2 AND framework2_id = $1)
       AND calculated_at > NOW() - INTERVAL '24 hours'`,
      [framework1Id, framework2Id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      framework1Id: row.framework1_id,
      framework1Name: row.framework1_name,
      framework2Id: row.framework2_id,
      framework2Name: row.framework2_name,
      totalMappings: row.total_mappings,
      equivalentCount: row.equivalent_count,
      partialCount: row.partial_count,
      relatedCount: row.related_count,
      overlapPercentage: parseFloat(row.overlap_percentage),
      lastCalculated: new Date(row.calculated_at)
    };
  }

  private async cacheFrameworkOverlap(overlap: FrameworkOverlap): Promise<void> {
    await this.pool.query(
      `INSERT INTO framework_overlap_cache (
        id, framework1_id, framework1_name, framework2_id, framework2_name,
        total_mappings, equivalent_count, partial_count, related_count,
        overlap_percentage, calculated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT (framework1_id, framework2_id) DO UPDATE SET
        total_mappings = EXCLUDED.total_mappings,
        equivalent_count = EXCLUDED.equivalent_count,
        partial_count = EXCLUDED.partial_count,
        related_count = EXCLUDED.related_count,
        overlap_percentage = EXCLUDED.overlap_percentage,
        calculated_at = NOW()`,
      [
        uuidv4(),
        overlap.framework1Id,
        overlap.framework1Name,
        overlap.framework2Id,
        overlap.framework2Name,
        overlap.totalMappings,
        overlap.equivalentCount,
        overlap.partialCount,
        overlap.relatedCount,
        overlap.overlapPercentage
      ]
    );
  }

  private async invalidateOverlapCache(framework1Id: string, framework2Id: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM framework_overlap_cache
       WHERE (framework1_id = $1 AND framework2_id = $2)
          OR (framework1_id = $2 AND framework2_id = $1)`,
      [framework1Id, framework2Id]
    );
  }

  private async suggestMappingsForControl(
    controlId: string,
    title: string,
    category: string
  ): Promise<SuggestedMapping[]> {
    // Find similar controls based on title and category
    const result = await this.pool.query(
      `SELECT c.id, c.title, c.framework_id, c.category,
              similarity(c.title, $1) as title_sim
       FROM compliance_controls c
       WHERE c.id != $2
       AND c.is_active = true
       AND (c.category = $3 OR similarity(c.title, $1) > 0.3)
       ORDER BY title_sim DESC
       LIMIT 5`,
      [title, controlId, category]
    );

    return result.rows.map(row => ({
      targetControlId: row.id,
      targetFrameworkId: row.framework_id,
      confidence: parseFloat(row.title_sim) || 0.3,
      reason: row.category === category
        ? 'Same category with similar title'
        : 'Similar title'
    }));
  }

  private async findFrameworkGapsForRequirement(requirementId: string): Promise<string[]> {
    const result = await this.pool.query(
      `SELECT f.id
       FROM compliance_frameworks f
       WHERE f.is_active = true
       AND f.id NOT IN (
         SELECT DISTINCT c.framework_id
         FROM requirement_control_mappings rcm
         JOIN compliance_controls c ON rcm.control_id = c.id
         WHERE rcm.requirement_id = $1
       )`,
      [requirementId]
    );

    return result.rows.map(row => row.id);
  }

  private async suggestControlsForRequirement(requirementId: string): Promise<string[]> {
    // Get requirement name for keyword matching
    const reqResult = await this.pool.query(
      `SELECT name FROM trustworthy_ai_requirements WHERE id = $1`,
      [requirementId]
    );

    if (reqResult.rows.length === 0) {
      return [];
    }

    const keywords = reqResult.rows[0].name.toLowerCase().split(/\s+/);

    const result = await this.pool.query(
      `SELECT c.id
       FROM compliance_controls c
       WHERE c.is_active = true
       AND c.id NOT IN (
         SELECT control_id FROM requirement_control_mappings WHERE requirement_id = $1
       )
       AND (
         ${keywords.map((_: string, i: number) => `LOWER(c.title) LIKE $${i + 2}`).join(' OR ')}
       )
       LIMIT 10`,
      [requirementId, ...keywords.map((k: string) => `%${k}%`)]
    );

    return result.rows.map(row => row.id);
  }

  private async findRelatedControls(
    category: string,
    title: string,
    description: string
  ): Promise<Array<{ controlId: string; frameworkId: string; similarity: number; matchReason: string }>> {
    const keywords = `${title} ${description}`.toLowerCase().split(/\W+/).filter(w => w.length > 3);

    const result = await this.pool.query(
      `SELECT c.id, c.framework_id, c.title, c.description, c.category
       FROM compliance_controls c
       WHERE c.is_active = true
       LIMIT 100`
    );

    const matches: Array<{ controlId: string; frameworkId: string; similarity: number; matchReason: string }> = [];

    for (const row of result.rows) {
      const controlText = `${row.title} ${row.description || ''}`.toLowerCase();
      const matchingKeywords = keywords.filter(k => controlText.includes(k));
      const similarity = matchingKeywords.length / keywords.length;

      if (similarity > 0.2) {
        matches.push({
          controlId: row.id,
          frameworkId: row.framework_id,
          similarity,
          matchReason: `keyword match (${matchingKeywords.join(', ')})`
        });
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity).slice(0, 10);
  }

  private determinePriority(category: string): 'critical' | 'high' | 'medium' | 'low' {
    switch (category) {
      case 'organizational':
        return 'high';
      case 'technological':
        return 'medium';
      case 'physical':
        return 'medium';
      case 'people':
        return 'low';
      default:
        return 'medium';
    }
  }

  private generateGapRecommendations(
    unmappedControls: UnmappedControl[],
    unmappedRequirements: UnmappedRequirement[]
  ): GapRecommendation[] {
    const recommendations: GapRecommendation[] = [];

    // Group unmapped controls by framework
    const byFramework: Record<string, number> = {};
    for (const control of unmappedControls) {
      byFramework[control.frameworkId] = (byFramework[control.frameworkId] || 0) + 1;
    }

    for (const [frameworkId, count] of Object.entries(byFramework)) {
      if (count > 10) {
        recommendations.push({
          type: 'add_mapping',
          priority: 'high',
          description: `${count} controls in ${frameworkId} lack cross-framework mappings`,
          affectedFrameworks: [frameworkId],
          estimatedEffort: count > 50 ? 'high' : 'medium'
        });
      }
    }

    for (const req of unmappedRequirements) {
      recommendations.push({
        type: 'increase_coverage',
        priority: 'critical',
        description: `Requirement "${req.requirementName}" has insufficient control coverage`,
        affectedFrameworks: req.frameworksWithGaps,
        estimatedEffort: 'medium'
      });
    }

    return recommendations;
  }

  private mapRowToCrossReference(row: any): ControlCrossReference {
    return {
      id: row.id,
      sourceControlId: row.source_control_id,
      targetControlId: row.target_control_id,
      sourceFrameworkId: row.source_framework_id,
      targetFrameworkId: row.target_framework_id,
      relationshipType: row.relationship_type as RelationshipType,
      mappingConfidence: parseFloat(row.mapping_confidence) || 0,
      mappedBy: row.mapped_by as MappingSource,
      rationale: row.rationale || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    };
  }

  private mapRowToQuery(row: any): CrossAnalysisQuery {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      queryType: row.query_type,
      parameters: typeof row.parameters === 'string'
        ? JSON.parse(row.parameters)
        : (row.parameters || {}),
      isScheduled: row.is_scheduled,
      scheduleFrequency: row.schedule_frequency || undefined,
      lastRun: row.last_run ? new Date(row.last_run) : undefined,
      savedResults: row.saved_results
        ? (typeof row.saved_results === 'string'
          ? JSON.parse(row.saved_results)
          : row.saved_results)
        : undefined,
      createdAt: new Date(row.created_at)
    };
  }
}
