/**
 * Visualization Service
 *
 * Generates chart and graph data for compliance dashboards including
 * Sankey diagrams, heatmaps, network graphs, and radar charts.
 *
 * Supports visualization of cross-framework analysis, requirement coverage,
 * and Z-Inspection integration data.
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { TrustworthyAIRequirementId } from '../types/qualitative';

// ============================================================================
// Types
// ============================================================================

export type ChartType =
  | 'sankey'
  | 'heatmap'
  | 'network'
  | 'radar'
  | 'bar'
  | 'treemap'
  | 'sunburst';

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface SankeyNode {
  id: string;
  name: string;
  category: string;
  value?: number;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface HeatmapData {
  rows: string[];
  columns: string[];
  values: number[][];
  rowLabels?: Record<string, string>;
  columnLabels?: Record<string, string>;
  colorScale?: {
    min: number;
    max: number;
    colors: string[];
  };
}

export interface NetworkGraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface NetworkNode {
  id: string;
  label: string;
  group: string;
  size: number;
  metadata?: Record<string, any>;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  type: string;
}

export interface RadarChartData {
  labels: string[];
  datasets: RadarDataset[];
}

export interface RadarDataset {
  label: string;
  data: number[];
  color?: string;
}

export interface TreemapData {
  name: string;
  value?: number;
  children?: TreemapData[];
  metadata?: Record<string, any>;
}

export interface VisualizationCache {
  id: string;
  chartType: ChartType;
  dataHash: string;
  data: any;
  tenantId?: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface VisualizationConfig {
  tenantId?: string;
  frameworks?: string[];
  requirements?: TrustworthyAIRequirementId[];
  timeRange?: { start: Date; end: Date };
  includeInactive?: boolean;
  cacheEnabled?: boolean;
  cacheTtlMinutes?: number;
}

// ============================================================================
// Service Implementation
// ============================================================================

export class VisualizationService {
  constructor(private pool: Pool) {}

  // ==========================================================================
  // Sankey Diagram Data
  // ==========================================================================

  /**
   * Generate Sankey diagram data showing requirements → controls mapping
   */
  async getSankeyData(config?: VisualizationConfig): Promise<SankeyData> {
    const cacheKey = `sankey-${JSON.stringify(config || {})}`;

    // Check cache
    if (config?.cacheEnabled !== false) {
      const cached = await this.getCachedVisualization('sankey', cacheKey);
      if (cached) {
        return cached as SankeyData;
      }
    }

    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];

    // Get all requirements
    const requirements = await this.pool.query(
      `SELECT id, name FROM trustworthy_ai_requirements ORDER BY id`
    );

    for (const req of requirements.rows) {
      nodes.push({
        id: `req-${req.id}`,
        name: req.name,
        category: 'requirement'
      });
    }

    // Get frameworks
    const frameworks = await this.pool.query(
      `SELECT id, name FROM compliance_frameworks WHERE is_active = true ORDER BY name`
    );

    for (const fw of frameworks.rows) {
      nodes.push({
        id: `fw-${fw.id}`,
        name: fw.name,
        category: 'framework'
      });
    }

    // Get requirement → framework mappings via controls
    const mappings = await this.pool.query(
      `SELECT
        rcm.requirement_id,
        c.framework_id,
        COUNT(*) as control_count,
        AVG(rcm.mapping_strength) as avg_strength
       FROM requirement_control_mappings rcm
       JOIN compliance_controls c ON rcm.control_id = c.id
       WHERE c.is_active = true
       GROUP BY rcm.requirement_id, c.framework_id`
    );

    for (const mapping of mappings.rows) {
      links.push({
        source: `req-${mapping.requirement_id}`,
        target: `fw-${mapping.framework_id}`,
        value: parseInt(mapping.control_count, 10),
        metadata: {
          averageStrength: parseFloat(mapping.avg_strength) || 0
        }
      });
    }

    const data: SankeyData = { nodes, links };

    // Cache the result
    await this.cacheVisualization('sankey', cacheKey, data, config?.cacheTtlMinutes);

    return data;
  }

  /**
   * Generate Sankey for framework-to-framework control mappings
   */
  async getFrameworkSankeyData(config?: VisualizationConfig): Promise<SankeyData> {
    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];

    // Get frameworks
    const frameworks = await this.pool.query(
      `SELECT id, name FROM compliance_frameworks WHERE is_active = true ORDER BY name`
    );

    for (const fw of frameworks.rows) {
      nodes.push({
        id: fw.id,
        name: fw.name,
        category: 'framework'
      });
    }

    // Get cross-framework mappings
    const mappings = await this.pool.query(
      `SELECT
        source_framework_id,
        target_framework_id,
        relationship_type,
        COUNT(*) as mapping_count
       FROM control_cross_references
       GROUP BY source_framework_id, target_framework_id, relationship_type`
    );

    for (const mapping of mappings.rows) {
      links.push({
        source: mapping.source_framework_id,
        target: mapping.target_framework_id,
        value: parseInt(mapping.mapping_count, 10),
        metadata: {
          relationshipType: mapping.relationship_type
        }
      });
    }

    return { nodes, links };
  }

  // ==========================================================================
  // Heatmap Data
  // ==========================================================================

  /**
   * Generate compliance coverage heatmap (frameworks × requirements)
   */
  async getComplianceHeatmap(config?: VisualizationConfig): Promise<HeatmapData> {
    const cacheKey = `heatmap-compliance-${JSON.stringify(config || {})}`;

    if (config?.cacheEnabled !== false) {
      const cached = await this.getCachedVisualization('heatmap', cacheKey);
      if (cached) {
        return cached as HeatmapData;
      }
    }

    // Get requirements (rows)
    const requirements = await this.pool.query(
      `SELECT id, name FROM trustworthy_ai_requirements ORDER BY id`
    );

    // Get frameworks (columns)
    const frameworksCondition = config?.frameworks?.length
      ? `AND id = ANY($1::text[])`
      : '';
    const frameworksParams = config?.frameworks?.length ? [config.frameworks] : [];

    const frameworks = await this.pool.query(
      `SELECT id, name FROM compliance_frameworks
       WHERE is_active = true ${frameworksCondition}
       ORDER BY name`,
      frameworksParams
    );

    const rows = requirements.rows.map(r => r.id);
    const columns = frameworks.rows.map(f => f.id);
    const rowLabels: Record<string, string> = {};
    const columnLabels: Record<string, string> = {};

    for (const req of requirements.rows) {
      rowLabels[req.id] = req.name;
    }
    for (const fw of frameworks.rows) {
      columnLabels[fw.id] = fw.name;
    }

    // Get coverage data
    const coverageResult = await this.pool.query(
      `SELECT
        rcm.requirement_id,
        c.framework_id,
        COUNT(*) as control_count,
        AVG(rcm.mapping_strength) * 100 as coverage
       FROM requirement_control_mappings rcm
       JOIN compliance_controls c ON rcm.control_id = c.id
       WHERE c.is_active = true
       GROUP BY rcm.requirement_id, c.framework_id`
    );

    // Build coverage matrix
    const coverageMap: Record<string, Record<string, number>> = {};
    for (const row of coverageResult.rows) {
      if (!coverageMap[row.requirement_id]) {
        coverageMap[row.requirement_id] = {};
      }
      coverageMap[row.requirement_id][row.framework_id] = parseFloat(row.coverage) || 0;
    }

    const values: number[][] = [];
    for (const reqId of rows) {
      const rowValues: number[] = [];
      for (const fwId of columns) {
        rowValues.push(coverageMap[reqId]?.[fwId] || 0);
      }
      values.push(rowValues);
    }

    const data: HeatmapData = {
      rows,
      columns,
      values,
      rowLabels,
      columnLabels,
      colorScale: {
        min: 0,
        max: 100,
        colors: ['#fee0d2', '#fc9272', '#de2d26'] // Red scale
      }
    };

    await this.cacheVisualization('heatmap', cacheKey, data, config?.cacheTtlMinutes);

    return data;
  }

  /**
   * Generate cross-framework mapping heatmap
   */
  async getCrossFrameworkHeatmap(config?: VisualizationConfig): Promise<HeatmapData> {
    // Get frameworks
    const frameworks = await this.pool.query(
      `SELECT id, name FROM compliance_frameworks WHERE is_active = true ORDER BY name`
    );

    const ids = frameworks.rows.map(f => f.id);
    const labels: Record<string, string> = {};
    for (const fw of frameworks.rows) {
      labels[fw.id] = fw.name;
    }

    // Get overlap data
    const overlaps = await this.pool.query(
      `SELECT
        framework1_id, framework2_id, overlap_percentage
       FROM framework_overlap_cache
       WHERE calculated_at > NOW() - INTERVAL '7 days'`
    );

    // Build matrix
    const overlapMap: Record<string, Record<string, number>> = {};
    for (const row of overlaps.rows) {
      if (!overlapMap[row.framework1_id]) {
        overlapMap[row.framework1_id] = {};
      }
      if (!overlapMap[row.framework2_id]) {
        overlapMap[row.framework2_id] = {};
      }
      overlapMap[row.framework1_id][row.framework2_id] = parseFloat(row.overlap_percentage);
      overlapMap[row.framework2_id][row.framework1_id] = parseFloat(row.overlap_percentage);
    }

    const values: number[][] = [];
    for (const id1 of ids) {
      const rowValues: number[] = [];
      for (const id2 of ids) {
        if (id1 === id2) {
          rowValues.push(100); // Full self-overlap
        } else {
          rowValues.push(overlapMap[id1]?.[id2] || 0);
        }
      }
      values.push(rowValues);
    }

    return {
      rows: ids,
      columns: ids,
      values,
      rowLabels: labels,
      columnLabels: labels,
      colorScale: {
        min: 0,
        max: 100,
        colors: ['#edf8fb', '#66c2a4', '#006d2c'] // Green scale
      }
    };
  }

  // ==========================================================================
  // Network Graph Data
  // ==========================================================================

  /**
   * Generate control relationship network graph
   */
  async getControlNetworkGraph(config?: VisualizationConfig): Promise<NetworkGraphData> {
    const cacheKey = `network-controls-${JSON.stringify(config || {})}`;

    if (config?.cacheEnabled !== false) {
      const cached = await this.getCachedVisualization('network', cacheKey);
      if (cached) {
        return cached as NetworkGraphData;
      }
    }

    const nodes: NetworkNode[] = [];
    const edges: NetworkEdge[] = [];

    // Get frameworks as main nodes
    const frameworks = await this.pool.query(
      `SELECT f.id, f.name, COUNT(c.id) as control_count
       FROM compliance_frameworks f
       LEFT JOIN compliance_controls c ON f.id = c.framework_id AND c.is_active = true
       WHERE f.is_active = true
       GROUP BY f.id, f.name
       ORDER BY f.name`
    );

    for (const fw of frameworks.rows) {
      nodes.push({
        id: fw.id,
        label: fw.name,
        group: 'framework',
        size: parseInt(fw.control_count, 10) || 1
      });
    }

    // Get cross-framework relationships
    const relationships = await this.pool.query(
      `SELECT
        source_framework_id,
        target_framework_id,
        COUNT(*) as weight,
        relationship_type
       FROM control_cross_references
       GROUP BY source_framework_id, target_framework_id, relationship_type`
    );

    for (const rel of relationships.rows) {
      edges.push({
        source: rel.source_framework_id,
        target: rel.target_framework_id,
        weight: parseInt(rel.weight, 10),
        type: rel.relationship_type
      });
    }

    const data: NetworkGraphData = { nodes, edges };

    await this.cacheVisualization('network', cacheKey, data, config?.cacheTtlMinutes);

    return data;
  }

  /**
   * Generate detailed control network for a specific framework
   */
  async getFrameworkControlNetwork(
    frameworkId: string,
    config?: VisualizationConfig
  ): Promise<NetworkGraphData> {
    const nodes: NetworkNode[] = [];
    const edges: NetworkEdge[] = [];

    // Get controls as nodes
    const controls = await this.pool.query(
      `SELECT id, title, category, domain
       FROM compliance_controls
       WHERE framework_id = $1 AND is_active = true`,
      [frameworkId]
    );

    for (const control of controls.rows) {
      nodes.push({
        id: control.id,
        label: control.title,
        group: control.category,
        size: 1,
        metadata: { domain: control.domain }
      });
    }

    // Get cross-references from this framework
    const refs = await this.pool.query(
      `SELECT
        source_control_id, target_control_id,
        relationship_type, mapping_confidence
       FROM control_cross_references
       WHERE source_framework_id = $1 OR target_framework_id = $1`,
      [frameworkId]
    );

    for (const ref of refs.rows) {
      edges.push({
        source: ref.source_control_id,
        target: ref.target_control_id,
        weight: parseFloat(ref.mapping_confidence) || 0.5,
        type: ref.relationship_type
      });
    }

    return { nodes, edges };
  }

  // ==========================================================================
  // Radar Chart Data
  // ==========================================================================

  /**
   * Generate multi-framework radar chart data
   */
  async getFrameworkRadarData(
    tenantId: string,
    frameworks?: string[]
  ): Promise<RadarChartData> {
    // Get requirements as labels
    const requirements = await this.pool.query(
      `SELECT id, name FROM trustworthy_ai_requirements ORDER BY id`
    );

    const labels = requirements.rows.map(r => r.name);
    const datasets: RadarDataset[] = [];

    // Get frameworks to include
    const frameworksCondition = frameworks?.length
      ? `AND id = ANY($1::text[])`
      : '';
    const frameworksParams = frameworks?.length ? [frameworks] : [];

    const frameworksResult = await this.pool.query(
      `SELECT id, name FROM compliance_frameworks
       WHERE is_active = true ${frameworksCondition}
       ORDER BY name`,
      frameworksParams
    );

    const colors = [
      '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
      '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
    ];

    for (let i = 0; i < frameworksResult.rows.length; i++) {
      const fw = frameworksResult.rows[i];

      // Get coverage for each requirement
      const coverage = await this.pool.query(
        `SELECT
          rcm.requirement_id,
          AVG(rcm.mapping_strength) * 100 as score
         FROM requirement_control_mappings rcm
         JOIN compliance_controls c ON rcm.control_id = c.id
         WHERE c.framework_id = $1 AND c.is_active = true
         GROUP BY rcm.requirement_id`,
        [fw.id]
      );

      const coverageMap: Record<string, number> = {};
      for (const row of coverage.rows) {
        coverageMap[row.requirement_id] = parseFloat(row.score) || 0;
      }

      const data = requirements.rows.map(r => coverageMap[r.id] || 0);

      datasets.push({
        label: fw.name,
        data,
        color: colors[i % colors.length]
      });
    }

    return { labels, datasets };
  }

  /**
   * Generate tenant compliance radar across frameworks
   */
  async getTenantComplianceRadar(tenantId: string): Promise<RadarChartData> {
    // Get frameworks as labels
    const frameworks = await this.pool.query(
      `SELECT id, name FROM compliance_frameworks WHERE is_active = true ORDER BY name`
    );

    const labels = frameworks.rows.map(f => f.name);

    // Get assessment scores for each framework
    const scores = await this.pool.query(
      `SELECT
        c.framework_id,
        AVG(ca.score) as avg_score
       FROM control_assessments ca
       JOIN compliance_controls c ON ca.control_id = c.id
       WHERE ca.tenant_id = $1
       AND ca.assessed_at > NOW() - INTERVAL '90 days'
       GROUP BY c.framework_id`,
      [tenantId]
    );

    const scoreMap: Record<string, number> = {};
    for (const row of scores.rows) {
      scoreMap[row.framework_id] = parseFloat(row.avg_score) || 0;
    }

    const data = frameworks.rows.map(f => scoreMap[f.id] || 0);

    return {
      labels,
      datasets: [{
        label: 'Compliance Score',
        data,
        color: '#3498db'
      }]
    };
  }

  // ==========================================================================
  // Treemap Data
  // ==========================================================================

  /**
   * Generate control hierarchy treemap
   */
  async getControlTreemap(frameworkId?: string): Promise<TreemapData> {
    const condition = frameworkId ? 'WHERE c.framework_id = $1' : '';
    const params = frameworkId ? [frameworkId] : [];

    const controls = await this.pool.query(
      `SELECT
        c.id, c.title, c.category, c.domain,
        c.framework_id, f.name as framework_name
       FROM compliance_controls c
       JOIN compliance_frameworks f ON c.framework_id = f.id
       ${condition}
       AND c.is_active = true
       ORDER BY c.framework_id, c.category, c.domain`,
      params
    );

    // Build hierarchical structure
    const frameworkMap: Record<string, TreemapData> = {};

    for (const control of controls.rows) {
      if (!frameworkMap[control.framework_id]) {
        frameworkMap[control.framework_id] = {
          name: control.framework_name,
          children: []
        };
      }

      // Find or create category
      let category = frameworkMap[control.framework_id].children!.find(
        c => c.name === control.category
      );
      if (!category) {
        category = { name: control.category, children: [] };
        frameworkMap[control.framework_id].children!.push(category);
      }

      // Find or create domain
      let domain = category.children!.find(d => d.name === control.domain);
      if (!domain) {
        domain = { name: control.domain || 'General', children: [] };
        category.children!.push(domain);
      }

      // Add control
      domain.children!.push({
        name: control.title,
        value: 1,
        metadata: { id: control.id }
      });
    }

    // Calculate values up the hierarchy
    for (const fw of Object.values(frameworkMap)) {
      let fwTotal = 0;
      for (const cat of fw.children || []) {
        let catTotal = 0;
        for (const dom of cat.children || []) {
          dom.value = dom.children?.length || 1;
          catTotal += dom.value;
        }
        cat.value = catTotal;
        fwTotal += catTotal;
      }
      fw.value = fwTotal;
    }

    if (frameworkId) {
      return frameworkMap[frameworkId] || { name: 'No Data', value: 0 };
    }

    return {
      name: 'All Frameworks',
      children: Object.values(frameworkMap)
    };
  }

  // ==========================================================================
  // Dashboard Summary Data
  // ==========================================================================

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(tenantId: string): Promise<{
    overview: {
      totalFrameworks: number;
      totalControls: number;
      averageCompliance: number;
      criticalGaps: number;
    };
    frameworkScores: { frameworkId: string; name: string; score: number }[];
    requirementCoverage: { requirementId: string; name: string; coverage: number }[];
    recentAssessments: { date: Date; frameworkId: string; score: number }[];
    trendsData: { month: string; score: number }[];
  }> {
    // Overview metrics
    const [frameworkCount, controlCount, avgCompliance, gapCount] = await Promise.all([
      this.pool.query(`SELECT COUNT(*) FROM compliance_frameworks WHERE is_active = true`),
      this.pool.query(`SELECT COUNT(*) FROM compliance_controls WHERE is_active = true`),
      this.pool.query(
        `SELECT AVG(score) FROM control_assessments WHERE tenant_id = $1 AND assessed_at > NOW() - INTERVAL '90 days'`,
        [tenantId]
      ),
      this.pool.query(
        `SELECT COUNT(*) FROM control_assessments WHERE tenant_id = $1 AND score < 50 AND assessed_at > NOW() - INTERVAL '30 days'`,
        [tenantId]
      )
    ]);

    // Framework scores
    const frameworkScoresResult = await this.pool.query(
      `SELECT
        c.framework_id, f.name,
        AVG(ca.score) as score
       FROM control_assessments ca
       JOIN compliance_controls c ON ca.control_id = c.id
       JOIN compliance_frameworks f ON c.framework_id = f.id
       WHERE ca.tenant_id = $1
       AND ca.assessed_at > NOW() - INTERVAL '90 days'
       GROUP BY c.framework_id, f.name
       ORDER BY score DESC`,
      [tenantId]
    );

    // Requirement coverage
    const requirementCoverageResult = await this.pool.query(
      `SELECT
        r.id, r.name,
        COALESCE(AVG(rcm.mapping_strength) * 100, 0) as coverage
       FROM trustworthy_ai_requirements r
       LEFT JOIN requirement_control_mappings rcm ON r.id = rcm.requirement_id
       GROUP BY r.id, r.name
       ORDER BY r.id`
    );

    // Recent assessments
    const recentAssessmentsResult = await this.pool.query(
      `SELECT
        DATE(assessed_at) as date,
        c.framework_id,
        AVG(score) as score
       FROM control_assessments ca
       JOIN compliance_controls c ON ca.control_id = c.id
       WHERE ca.tenant_id = $1
       AND ca.assessed_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE(assessed_at), c.framework_id
       ORDER BY date DESC
       LIMIT 30`,
      [tenantId]
    );

    // Monthly trends
    const trendsResult = await this.pool.query(
      `SELECT
        TO_CHAR(assessed_at, 'YYYY-MM') as month,
        AVG(score) as score
       FROM control_assessments
       WHERE tenant_id = $1
       AND assessed_at > NOW() - INTERVAL '12 months'
       GROUP BY TO_CHAR(assessed_at, 'YYYY-MM')
       ORDER BY month`,
      [tenantId]
    );

    return {
      overview: {
        totalFrameworks: parseInt(frameworkCount.rows[0].count, 10),
        totalControls: parseInt(controlCount.rows[0].count, 10),
        averageCompliance: parseFloat(avgCompliance.rows[0].avg) || 0,
        criticalGaps: parseInt(gapCount.rows[0].count, 10)
      },
      frameworkScores: frameworkScoresResult.rows.map(r => ({
        frameworkId: r.framework_id,
        name: r.name,
        score: parseFloat(r.score) || 0
      })),
      requirementCoverage: requirementCoverageResult.rows.map(r => ({
        requirementId: r.id,
        name: r.name,
        coverage: parseFloat(r.coverage) || 0
      })),
      recentAssessments: recentAssessmentsResult.rows.map(r => ({
        date: new Date(r.date),
        frameworkId: r.framework_id,
        score: parseFloat(r.score) || 0
      })),
      trendsData: trendsResult.rows.map(r => ({
        month: r.month,
        score: parseFloat(r.score) || 0
      }))
    };
  }

  // ==========================================================================
  // Z-Inspection Visualization
  // ==========================================================================

  /**
   * Generate Z-Inspection findings visualization data
   */
  async getZInspectionVisualization(reportId: string): Promise<{
    tensionNetwork: NetworkGraphData;
    requirementRadar: RadarChartData;
    findingsBreakdown: { type: string; count: number }[];
    stakeholderImpact: { stakeholder: string; impactLevel: number }[];
  }> {
    // Get tensions as network
    const tensions = await this.pool.query(
      `SELECT
        et.id, et.value_a, et.value_b, et.severity,
        et.requirement_id
       FROM ethical_tensions et
       JOIN trustworthiness_assessments ta ON et.assessment_id = ta.id
       JOIN z_inspection_reports zr ON zr.assessment_id = ta.id
       WHERE zr.id = $1`,
      [reportId]
    );

    const tensionNodes: NetworkNode[] = [];
    const tensionEdges: NetworkEdge[] = [];
    const valueSet = new Set<string>();

    for (const t of tensions.rows) {
      if (!valueSet.has(t.value_a)) {
        tensionNodes.push({
          id: `value-${t.value_a}`,
          label: t.value_a,
          group: 'value',
          size: 1
        });
        valueSet.add(t.value_a);
      }
      if (!valueSet.has(t.value_b)) {
        tensionNodes.push({
          id: `value-${t.value_b}`,
          label: t.value_b,
          group: 'value',
          size: 1
        });
        valueSet.add(t.value_b);
      }

      tensionEdges.push({
        source: `value-${t.value_a}`,
        target: `value-${t.value_b}`,
        weight: t.severity === 'critical' ? 4 : t.severity === 'significant' ? 3 : 2,
        type: 'tension'
      });
    }

    // Get requirement assessment scores
    const requirements = await this.pool.query(
      `SELECT id, name FROM trustworthy_ai_requirements ORDER BY id`
    );

    const assessmentScores = await this.pool.query(
      `SELECT
        ra.requirement_id,
        CASE ra.rating
          WHEN 'excellent' THEN 100
          WHEN 'good' THEN 75
          WHEN 'adequate' THEN 50
          WHEN 'poor' THEN 25
          WHEN 'critical' THEN 0
          ELSE 50
        END as score
       FROM (
         SELECT requirement_id, rating
         FROM requirement_assessments ra
         JOIN trustworthiness_assessments ta ON ra.assessment_id = ta.id
         JOIN z_inspection_reports zr ON zr.assessment_id = ta.id
         WHERE zr.id = $1
       ) ra`,
      [reportId]
    );

    const scoreMap: Record<string, number> = {};
    for (const row of assessmentScores.rows) {
      scoreMap[row.requirement_id] = row.score;
    }

    const radarLabels = requirements.rows.map(r => r.name);
    const radarData = requirements.rows.map(r => scoreMap[r.id] || 50);

    // Findings breakdown
    const findingsResult = await this.pool.query(
      `SELECT finding_type, COUNT(*) as count
       FROM qualitative_findings qf
       JOIN trustworthiness_assessments ta ON qf.assessment_id = ta.id
       JOIN z_inspection_reports zr ON zr.assessment_id = ta.id
       WHERE zr.id = $1
       GROUP BY finding_type`,
      [reportId]
    );

    // Stakeholder impact (simplified)
    const stakeholderResult = await this.pool.query(
      `SELECT
        sr.name as stakeholder,
        COUNT(DISTINCT et.id) as impact_level
       FROM stakeholder_registry sr
       LEFT JOIN ethical_tensions et ON sr.id = ANY(et.affected_stakeholders)
       JOIN trustworthiness_assessments ta ON et.assessment_id = ta.id
       JOIN z_inspection_reports zr ON zr.assessment_id = ta.id
       WHERE zr.id = $1
       GROUP BY sr.name`,
      [reportId]
    );

    return {
      tensionNetwork: { nodes: tensionNodes, edges: tensionEdges },
      requirementRadar: {
        labels: radarLabels,
        datasets: [{
          label: 'Z-Inspection Assessment',
          data: radarData,
          color: '#e74c3c'
        }]
      },
      findingsBreakdown: findingsResult.rows.map(r => ({
        type: r.finding_type,
        count: parseInt(r.count, 10)
      })),
      stakeholderImpact: stakeholderResult.rows.map(r => ({
        stakeholder: r.stakeholder,
        impactLevel: parseInt(r.impact_level, 10)
      }))
    };
  }

  // ==========================================================================
  // Caching
  // ==========================================================================

  private async getCachedVisualization(chartType: ChartType, dataHash: string): Promise<any | null> {
    const result = await this.pool.query(
      `SELECT data FROM visualization_cache
       WHERE chart_type = $1 AND data_hash = $2 AND expires_at > NOW()`,
      [chartType, dataHash]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return typeof result.rows[0].data === 'string'
      ? JSON.parse(result.rows[0].data)
      : result.rows[0].data;
  }

  private async cacheVisualization(
    chartType: ChartType,
    dataHash: string,
    data: any,
    ttlMinutes?: number
  ): Promise<void> {
    const ttl = ttlMinutes || 60; // Default 1 hour
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

    await this.pool.query(
      `INSERT INTO visualization_cache (id, chart_type, data_hash, data, created_at, expires_at)
       VALUES ($1, $2, $3, $4, NOW(), $5)
       ON CONFLICT (chart_type, data_hash) DO UPDATE SET
         data = EXCLUDED.data,
         created_at = NOW(),
         expires_at = EXCLUDED.expires_at`,
      [uuidv4(), chartType, dataHash, JSON.stringify(data), expiresAt]
    );
  }

  /**
   * Clear visualization cache
   */
  async clearCache(chartType?: ChartType): Promise<number> {
    if (chartType) {
      const result = await this.pool.query(
        `DELETE FROM visualization_cache WHERE chart_type = $1`,
        [chartType]
      );
      return result.rowCount ?? 0;
    }

    const result = await this.pool.query(`DELETE FROM visualization_cache`);
    return result.rowCount ?? 0;
  }

  /**
   * Clean expired cache entries
   */
  async cleanExpiredCache(): Promise<number> {
    const result = await this.pool.query(
      `DELETE FROM visualization_cache WHERE expires_at < NOW()`
    );
    return result.rowCount ?? 0;
  }
}
