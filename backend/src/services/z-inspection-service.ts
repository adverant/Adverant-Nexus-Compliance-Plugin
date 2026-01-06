/**
 * Z-Inspection Service - Import and parse Z-Inspection reports
 * Creates assessments, scenarios, tensions, and findings from Z-Inspection output
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import {
  ZInspectionReport,
  ImportZInspectionInput,
  ExtractedFinding,
  ExtractedScenario,
  ExtractedTension,
  ExtractedRecommendation,
  TrustworthinessRating,
  ImportStatus,
  TrustworthyAIRequirementId,
  ZInspectionParseResult,
  PaginationParams,
  PaginatedResponse,
} from '../types';

export interface MageAgentClient {
  parseZInspectionReport(content: string, documentType: string): Promise<ZInspectionParseResult>;
}

export class ZInspectionService {
  constructor(
    private pool: Pool,
    private mageAgentClient?: MageAgentClient
  ) {}

  /**
   * Import a Z-Inspection report
   */
  async importReport(
    tenantId: string,
    input: ImportZInspectionInput,
    createdBy?: string
  ): Promise<ZInspectionReport> {
    const id = uuidv4();
    const contentHash = crypto.createHash('sha256').update(input.content).digest('hex');

    // Initialize with empty extracted content - will be populated during processing
    const result = await this.pool.query(
      `INSERT INTO z_inspection_reports (
        id, tenant_id, ai_system_id, title, report_date, inspection_team,
        import_method, source_document_type, source_document_url, source_document_hash,
        raw_content, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        id,
        tenantId,
        input.aiSystemId,
        input.title,
        input.reportDate,
        JSON.stringify(input.inspectionTeam || []),
        input.importMethod,
        input.sourceDocumentType || null,
        input.sourceDocumentUrl || null,
        contentHash,
        input.content,
        'imported',
        createdBy || null,
      ]
    );

    return this.mapRowToReport(result.rows[0]);
  }

  /**
   * Process an imported report - extract findings, scenarios, tensions
   */
  async processReport(tenantId: string, reportId: string): Promise<ZInspectionReport> {
    const report = await this.getReport(tenantId, reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    // Update status to processing
    await this.pool.query(
      `UPDATE z_inspection_reports SET status = 'processing', updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [reportId, tenantId]
    );

    try {
      let parseResult: ZInspectionParseResult;

      if (report.importMethod === 'json_import' || report.importMethod === 'xml_import') {
        // Parse structured content
        parseResult = this.parseStructuredContent(report.rawContent || '', report.importMethod);
      } else if (report.importMethod === 'ai_parsed' && this.mageAgentClient) {
        // Use AI to parse unstructured content
        parseResult = await this.mageAgentClient.parseZInspectionReport(
          report.rawContent || '',
          report.sourceDocumentType || 'text'
        );
      } else {
        // Manual entry - content should already be structured
        parseResult = this.parseStructuredContent(report.rawContent || '', 'json_import');
      }

      // Update report with extracted content
      const result = await this.pool.query(
        `UPDATE z_inspection_reports
         SET extracted_findings = $3,
             extracted_scenarios = $4,
             extracted_tensions = $5,
             extracted_recommendations = $6,
             overall_conclusion = $7,
             trustworthiness_rating = $8,
             parsed_content = $9,
             status = 'processed',
             updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [
          reportId,
          tenantId,
          JSON.stringify(parseResult.extractedFindings),
          JSON.stringify(parseResult.extractedScenarios),
          JSON.stringify(parseResult.extractedTensions),
          JSON.stringify(parseResult.extractedRecommendations),
          parseResult.overallConclusion,
          parseResult.trustworthinessRating,
          JSON.stringify({
            parseConfidence: parseResult.parseConfidence,
            parsedAt: new Date().toISOString(),
          }),
        ]
      );

      return this.mapRowToReport(result.rows[0]);
    } catch (error) {
      // Update status to error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.pool.query(
        `UPDATE z_inspection_reports
         SET status = 'error', error_message = $3, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2`,
        [reportId, tenantId, errorMessage]
      );
      throw error;
    }
  }

  /**
   * Create assessment and entities from processed report
   */
  async createAssessmentFromReport(
    tenantId: string,
    reportId: string,
    assessmentTitle?: string,
    createdBy?: string
  ): Promise<{ assessmentId: string; created: { scenarios: number; tensions: number; findings: number } }> {
    const report = await this.getReport(tenantId, reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    if (report.status !== 'processed') {
      throw new Error('Report must be processed before creating assessment');
    }

    const assessmentId = uuidv4();
    let createdScenarios = 0;
    let createdTensions = 0;
    let createdFindings = 0;

    // Create assessment
    await this.pool.query(
      `INSERT INTO trustworthiness_assessments (
        id, tenant_id, ai_system_id, title, assessment_type, scope,
        methodology, assessors, assessment_date, status,
        overall_rating, overall_narrative, z_inspection_source_id,
        requirement_assessments, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        assessmentId,
        tenantId,
        report.aiSystemId,
        assessmentTitle || `Z-Inspection: ${report.title}`,
        'z_inspection_import',
        `Imported from Z-Inspection report: ${report.title}`,
        'Z-Inspection methodology',
        JSON.stringify(report.inspectionTeam.map((t) => t.name)),
        report.reportDate,
        'review',
        report.trustworthinessRating,
        report.overallConclusion,
        reportId,
        JSON.stringify({}), // Will be populated from findings
        createdBy || null,
      ]
    );

    // Create scenarios
    for (const scenario of report.extractedScenarios) {
      await this.pool.query(
        `INSERT INTO socio_technical_scenarios (
          id, tenant_id, ai_system_id, title, scenario_type, description,
          primary_requirement, status, is_ai_generated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          uuidv4(),
          tenantId,
          report.aiSystemId,
          scenario.title,
          scenario.scenarioType,
          scenario.description,
          scenario.primaryRequirement || null,
          'validated', // Assume Z-Inspection scenarios are validated
          false, // Not AI generated, from Z-Inspection
        ]
      );
      createdScenarios++;
    }

    // Create tensions
    for (const tension of report.extractedTensions) {
      await this.pool.query(
        `INSERT INTO ethical_tensions (
          id, tenant_id, ai_system_id, title, description,
          value_a, value_b, tension_type, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          uuidv4(),
          tenantId,
          report.aiSystemId,
          tension.title,
          tension.description,
          tension.valueA,
          tension.valueB,
          tension.tensionType,
          'identified',
        ]
      );
      createdTensions++;
    }

    // Create findings
    for (const finding of report.extractedFindings) {
      await this.pool.query(
        `INSERT INTO qualitative_findings (
          id, tenant_id, assessment_id, ai_system_id, title, finding_type,
          description, requirement_id, severity, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          uuidv4(),
          tenantId,
          assessmentId,
          report.aiSystemId,
          finding.title,
          finding.findingType,
          finding.description,
          finding.requirementId || null,
          finding.severity || null,
          'open',
        ]
      );
      createdFindings++;
    }

    // Link assessment to report
    await this.pool.query(
      `UPDATE z_inspection_reports
       SET generated_assessment_id = $3, status = 'verified', updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [reportId, tenantId, assessmentId]
    );

    return {
      assessmentId,
      created: {
        scenarios: createdScenarios,
        tensions: createdTensions,
        findings: createdFindings,
      },
    };
  }

  /**
   * Get report by ID
   */
  async getReport(tenantId: string, id: string): Promise<ZInspectionReport | null> {
    const result = await this.pool.query(
      `SELECT * FROM z_inspection_reports WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToReport(result.rows[0]);
  }

  /**
   * List reports for an AI system
   */
  async listReports(
    tenantId: string,
    aiSystemId: string,
    filters?: {
      status?: ImportStatus;
    },
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<ZInspectionReport>> {
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

    const countResult = await this.pool.query(
      `SELECT COUNT(*) FROM z_inspection_reports ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await this.pool.query(
      `SELECT * FROM z_inspection_reports ${whereClause}
       ORDER BY report_date DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit.toString(), offset.toString()]
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: dataResult.rows.map((row) => this.mapRowToReport(row)),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Delete report
   */
  async deleteReport(tenantId: string, id: string): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM z_inspection_reports WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Generate monitoring rules from report findings
   */
  async generateMonitoringRules(
    tenantId: string,
    reportId: string
  ): Promise<
    Array<{
      controlId: string;
      adjustedWeight: number;
      rationale: string;
    }>
  > {
    const report = await this.getReport(tenantId, reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    const rules: Array<{
      controlId: string;
      adjustedWeight: number;
      rationale: string;
    }> = [];

    // Map findings to control weight adjustments
    for (const finding of report.extractedFindings) {
      if (finding.requirementId) {
        // Get controls mapped to this requirement
        const controlsResult = await this.pool.query(
          `SELECT control_id, mapping_strength FROM requirement_control_mappings
           WHERE requirement_id = $1`,
          [finding.requirementId]
        );

        for (const control of controlsResult.rows) {
          // Increase weight for controls related to weaknesses
          let weightAdjustment = 0;
          if (finding.findingType === 'weakness' || finding.findingType === 'threat') {
            weightAdjustment = finding.severity === 'critical' ? 0.3 : finding.severity === 'high' ? 0.2 : 0.1;
          }

          if (weightAdjustment > 0) {
            rules.push({
              controlId: control.control_id,
              adjustedWeight: 1 + weightAdjustment,
              rationale: `Z-Inspection finding: ${finding.title} (${finding.severity})`,
            });
          }
        }
      }
    }

    // Map tensions to control weight adjustments
    for (const tension of report.extractedTensions) {
      // Human oversight controls get priority for any tension
      const hoControls = await this.pool.query(
        `SELECT control_id FROM requirement_control_mappings
         WHERE requirement_id = 'human_agency_oversight'`
      );

      for (const control of hoControls.rows) {
        rules.push({
          controlId: control.control_id,
          adjustedWeight: 1.15,
          rationale: `Ethical tension identified: ${tension.title}`,
        });
      }
    }

    return rules;
  }

  /**
   * Parse structured JSON/XML content
   */
  private parseStructuredContent(
    content: string,
    format: 'json_import' | 'xml_import'
  ): ZInspectionParseResult {
    if (format === 'xml_import') {
      // Basic XML parsing - in production, use proper XML parser
      throw new Error('XML parsing not yet implemented - use JSON format');
    }

    try {
      const parsed = JSON.parse(content);

      return {
        extractedFindings: (parsed.findings || []).map((f: Partial<ExtractedFinding>) => ({
          title: f.title || 'Untitled Finding',
          description: f.description || '',
          requirementId: f.requirementId as TrustworthyAIRequirementId | undefined,
          findingType: f.findingType || 'observation',
          severity: f.severity,
        })),
        extractedScenarios: (parsed.scenarios || []).map((s: Partial<ExtractedScenario>) => ({
          title: s.title || 'Untitled Scenario',
          description: s.description || '',
          scenarioType: s.scenarioType || 'use_case',
          primaryRequirement: s.primaryRequirement as TrustworthyAIRequirementId | undefined,
        })),
        extractedTensions: (parsed.tensions || []).map((t: Partial<ExtractedTension>) => ({
          title: t.title || 'Untitled Tension',
          description: t.description || '',
          valueA: t.valueA || 'Value A',
          valueB: t.valueB || 'Value B',
          tensionType: t.tensionType || 'value_vs_value',
        })),
        extractedRecommendations: (parsed.recommendations || []).map(
          (r: Partial<ExtractedRecommendation> | string) => {
            if (typeof r === 'string') {
              return { recommendation: r };
            }
            return {
              recommendation: r.recommendation || '',
              priority: r.priority,
              relatedRequirement: r.relatedRequirement as TrustworthyAIRequirementId | undefined,
            };
          }
        ),
        overallConclusion: parsed.conclusion || parsed.overallConclusion || '',
        trustworthinessRating: parsed.rating || parsed.trustworthinessRating || 'inconclusive',
        parseConfidence: 1.0, // High confidence for structured input
      };
    } catch (error) {
      throw new Error(`Failed to parse structured content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private mapRowToReport(row: Record<string, unknown>): ZInspectionReport {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      aiSystemId: row.ai_system_id as string,
      title: row.title as string,
      reportDate: new Date(row.report_date as string),
      inspectionTeam: (row.inspection_team as ZInspectionReport['inspectionTeam']) || [],
      importMethod: row.import_method as ZInspectionReport['importMethod'],
      sourceDocumentType: row.source_document_type as ZInspectionReport['sourceDocumentType'],
      sourceDocumentUrl: row.source_document_url as string | undefined,
      sourceDocumentHash: row.source_document_hash as string | undefined,
      rawContent: row.raw_content as string | undefined,
      parsedContent: (row.parsed_content as Record<string, unknown>) || {},
      extractedFindings: (row.extracted_findings as ExtractedFinding[]) || [],
      extractedScenarios: (row.extracted_scenarios as ExtractedScenario[]) || [],
      extractedTensions: (row.extracted_tensions as ExtractedTension[]) || [],
      extractedRecommendations: (row.extracted_recommendations as ExtractedRecommendation[]) || [],
      overallConclusion: row.overall_conclusion as string | undefined,
      trustworthinessRating: row.trustworthiness_rating as TrustworthinessRating | undefined,
      status: row.status as ImportStatus,
      processingNotes: row.processing_notes as string | undefined,
      errorMessage: row.error_message as string | undefined,
      generatedAssessmentId: row.generated_assessment_id as string | undefined,
      metadata: (row.metadata as Record<string, unknown>) || {},
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      createdBy: row.created_by as string | undefined,
    };
  }
}
