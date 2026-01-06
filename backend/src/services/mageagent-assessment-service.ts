import { Pool } from 'pg';
import { MageAgentClient, AIAssessmentResult } from '../clients/mageagent-client.js';
import { logger } from '../utils/logger.js';

/**
 * Control data structure for assessment
 */
interface ComplianceControl {
  id: string;
  framework_id: string;
  control_number: string;
  domain: string;
  subdomain: string;
  title: string;
  description: string;
  objective: string;
  implementation_guidance: string;
  risk_category: string;
  implementation_priority: number;
  ai_assessment_prompt: string;
}

/**
 * Evidence data structure
 */
interface Evidence {
  id: string;
  control_id: string;
  type: string;
  title: string;
  description: string;
  file_path?: string;
  created_at: Date;
  metadata?: Record<string, any>;
}

/**
 * Assessment context
 */
interface AssessmentContext {
  tenantId: string;
  organization?: string;
  industry?: string;
  assessmentId: string;
  userId?: string;
}

/**
 * Assessment result to store in database
 */
interface AssessmentFinding {
  controlId: string;
  status: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  confidence: number;
  aiReasoning: string;
  findings: string[];
  recommendations: string[];
  evidenceGaps: string[];
  assessedAt: Date;
  assessedBy: 'ai' | 'manual' | 'hybrid';
}

/**
 * MageAgent Assessment Service
 * Provides AI-powered compliance control assessment through MageAgent
 */
export class MageAgentAssessmentService {
  private pool: Pool;
  private mageAgent: MageAgentClient;
  private isAvailable: boolean = false;

  constructor(pool: Pool, mageAgentUrl?: string) {
    this.pool = pool;
    const url = mageAgentUrl || process.env.NEXUS_MAGEAGENT_URL || 'http://nexus-mageagent:9001';
    this.mageAgent = new MageAgentClient(url);
    this.checkAvailability();
  }

  /**
   * Check if MageAgent service is available
   */
  async checkAvailability(): Promise<boolean> {
    const healthResult = await this.mageAgent.healthCheck();
    this.isAvailable = healthResult.healthy;
    if (!this.isAvailable) {
      logger.warn({
        circuitState: healthResult.circuitState,
        latencyMs: healthResult.latencyMs,
      }, 'MageAgent service is not available - assessments will use fallback logic');
    }
    return this.isAvailable;
  }

  /**
   * Assess a single control using AI
   */
  async assessControl(
    control: ComplianceControl,
    context: AssessmentContext
  ): Promise<AssessmentFinding> {
    // Get existing evidence for this control
    const evidence = await this.getControlEvidence(control.id, context.tenantId);

    // Get previous findings if any
    const previousFindings = await this.getPreviousFindings(control.id, context.tenantId);

    let aiResult: AIAssessmentResult;

    if (this.isAvailable) {
      // Use AI-powered assessment
      aiResult = await this.mageAgent.assessControl(
        control.id,
        control.title,
        control.description,
        control.ai_assessment_prompt || this.generateDefaultPrompt(control),
        {
          organization: context.organization,
          industry: context.industry,
          evidence: evidence.map(e => ({
            type: e.type,
            description: e.description,
            date: e.created_at.toISOString()
          })),
          previousFindings: previousFindings
        }
      );
    } else {
      // Fallback: Heuristic-based assessment when AI is not available
      aiResult = this.heuristicAssessment(control, evidence);
    }

    // Map AI result to database finding
    return {
      controlId: control.id,
      status: aiResult.status,
      severity: this.mapRiskToSeverity(aiResult.riskLevel, control.risk_category),
      confidence: aiResult.confidence,
      aiReasoning: aiResult.reasoning,
      findings: aiResult.findings,
      recommendations: aiResult.recommendations,
      evidenceGaps: aiResult.evidenceGaps,
      assessedAt: new Date(),
      assessedBy: this.isAvailable ? 'ai' : 'hybrid'
    };
  }

  /**
   * Assess all controls for a framework
   */
  async assessFramework(
    frameworkId: string,
    context: AssessmentContext,
    options: { concurrency?: number; controlIds?: string[] } = {}
  ): Promise<{
    assessmentId: string;
    findings: AssessmentFinding[];
    summary: {
      total: number;
      compliant: number;
      partial: number;
      nonCompliant: number;
      notApplicable: number;
      overallScore: number;
    };
  }> {
    const { concurrency = 3, controlIds } = options;

    // Get controls to assess
    let query = `
      SELECT id, framework_id, control_number, domain, subdomain, title,
             description, objective, implementation_guidance, risk_category,
             implementation_priority, ai_assessment_prompt
      FROM compliance_controls
      WHERE framework_id = $1
    `;
    const params: any[] = [frameworkId];

    if (controlIds && controlIds.length > 0) {
      query += ` AND id = ANY($2)`;
      params.push(controlIds);
    }

    query += ` ORDER BY implementation_priority DESC`;

    const controlsResult = await this.pool.query(query, params);
    const controls: ComplianceControl[] = controlsResult.rows;

    if (controls.length === 0) {
      throw new Error(`No controls found for framework: ${frameworkId}`);
    }

    logger.info(`Starting assessment of ${controls.length} controls for framework ${frameworkId}`);

    // Assess controls in batches
    const findings: AssessmentFinding[] = [];

    for (let i = 0; i < controls.length; i += concurrency) {
      const batch = controls.slice(i, i + concurrency);

      const batchPromises = batch.map(control =>
        this.assessControl(control, context)
          .catch(error => {
            logger.error(`Assessment failed for control ${control.id}:`, error);
            return this.createErrorFinding(control);
          })
      );

      const batchResults = await Promise.all(batchPromises);
      findings.push(...batchResults);

      // Log progress
      const progress = Math.min(100, Math.round(((i + batch.length) / controls.length) * 100));
      logger.info(`Assessment progress: ${progress}% (${i + batch.length}/${controls.length})`);

      // Small delay between batches
      if (i + concurrency < controls.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Store findings in database
    await this.storeFindings(context.assessmentId, findings, context.tenantId);

    // Calculate summary
    const summary = this.calculateSummary(findings);

    // Update assessment record
    await this.updateAssessmentStatus(context.assessmentId, 'completed', summary);

    logger.info(`Assessment complete for framework ${frameworkId}. Score: ${summary.overallScore}%`);

    return {
      assessmentId: context.assessmentId,
      findings,
      summary
    };
  }

  /**
   * Get remediation guidance for specific findings
   */
  async getRemediationGuidance(
    findingIds: string[],
    context: { industry?: string; organizationSize?: string }
  ): Promise<Map<string, { steps: string[]; priority: string; estimatedEffort: string; resources: string[] }>> {
    const results = new Map();

    // Get finding details
    const query = `
      SELECT f.id, f.control_id, f.findings, c.title as control_title
      FROM compliance_findings f
      JOIN compliance_controls c ON f.control_id = c.id
      WHERE f.id = ANY($1)
    `;

    const findingsResult = await this.pool.query(query, [findingIds]);

    for (const finding of findingsResult.rows) {
      const mainFinding = finding.findings?.[0] || 'Control not fully implemented';

      if (this.isAvailable) {
        const guidance = await this.mageAgent.generateRemediationGuidance(
          finding.control_id,
          finding.control_title,
          mainFinding,
          context
        );
        results.set(finding.id, guidance);
      } else {
        // Fallback guidance
        results.set(finding.id, {
          steps: [
            'Review the control requirements in detail',
            'Assess current implementation gaps',
            'Develop implementation plan with timeline',
            'Implement required controls',
            'Document implementation and gather evidence',
            'Conduct verification testing'
          ],
          priority: 'short-term',
          estimatedEffort: 'weeks',
          resources: ['Compliance documentation', 'Internal audit team']
        });
      }
    }

    return results;
  }

  /**
   * Get evidence for a control
   */
  private async getControlEvidence(controlId: string, tenantId: string): Promise<Evidence[]> {
    const query = `
      SELECT id, control_id, type, title, description, file_path, created_at, metadata
      FROM compliance_evidence
      WHERE control_id = $1 AND tenant_id = $2
      ORDER BY created_at DESC
      LIMIT 10
    `;

    try {
      const result = await this.pool.query(query, [controlId, tenantId]);
      return result.rows;
    } catch (error) {
      // Table might not exist yet
      logger.debug(`Evidence table query failed: ${error}`);
      return [];
    }
  }

  /**
   * Get previous findings for a control
   */
  private async getPreviousFindings(controlId: string, tenantId: string): Promise<string[]> {
    const query = `
      SELECT findings
      FROM compliance_findings
      WHERE control_id = $1 AND tenant_id = $2
      ORDER BY assessed_at DESC
      LIMIT 3
    `;

    try {
      const result = await this.pool.query(query, [controlId, tenantId]);
      return result.rows.flatMap(r => r.findings || []);
    } catch (error) {
      logger.debug(`Previous findings query failed: ${error}`);
      return [];
    }
  }

  /**
   * Store assessment findings in database
   */
  private async storeFindings(
    assessmentId: string,
    findings: AssessmentFinding[],
    tenantId: string
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      for (const finding of findings) {
        await client.query(`
          INSERT INTO compliance_findings (
            assessment_id, control_id, tenant_id, status, severity,
            confidence, ai_reasoning, findings, recommendations,
            evidence_gaps, assessed_at, assessed_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (assessment_id, control_id) DO UPDATE SET
            status = EXCLUDED.status,
            severity = EXCLUDED.severity,
            confidence = EXCLUDED.confidence,
            ai_reasoning = EXCLUDED.ai_reasoning,
            findings = EXCLUDED.findings,
            recommendations = EXCLUDED.recommendations,
            evidence_gaps = EXCLUDED.evidence_gaps,
            assessed_at = EXCLUDED.assessed_at,
            assessed_by = EXCLUDED.assessed_by
        `, [
          assessmentId,
          finding.controlId,
          tenantId,
          finding.status,
          finding.severity,
          finding.confidence,
          finding.aiReasoning,
          JSON.stringify(finding.findings),
          JSON.stringify(finding.recommendations),
          JSON.stringify(finding.evidenceGaps),
          finding.assessedAt,
          finding.assessedBy
        ]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update assessment status and summary
   */
  private async updateAssessmentStatus(
    assessmentId: string,
    status: string,
    summary: any
  ): Promise<void> {
    await this.pool.query(`
      UPDATE compliance_assessments
      SET status = $1, completed_at = NOW(), summary = $2
      WHERE id = $3
    `, [status, JSON.stringify(summary), assessmentId]);
  }

  /**
   * Calculate assessment summary
   */
  private calculateSummary(findings: AssessmentFinding[]): {
    total: number;
    compliant: number;
    partial: number;
    nonCompliant: number;
    notApplicable: number;
    overallScore: number;
  } {
    const total = findings.length;
    const compliant = findings.filter(f => f.status === 'compliant').length;
    const partial = findings.filter(f => f.status === 'partial').length;
    const nonCompliant = findings.filter(f => f.status === 'non_compliant').length;
    const notApplicable = findings.filter(f => f.status === 'not_applicable').length;

    // Calculate weighted score (compliant = 100%, partial = 50%, non-compliant = 0%)
    const applicableCount = total - notApplicable;
    const score = applicableCount > 0
      ? Math.round(((compliant * 100 + partial * 50) / applicableCount))
      : 100;

    return {
      total,
      compliant,
      partial,
      nonCompliant,
      notApplicable,
      overallScore: score
    };
  }

  /**
   * Heuristic-based assessment when AI is not available
   */
  private heuristicAssessment(control: ComplianceControl, evidence: Evidence[]): AIAssessmentResult {
    // Assessment based on evidence availability and control priority
    const hasEvidence = evidence.length > 0;
    const recentEvidence = evidence.filter(e => {
      const ageInDays = (Date.now() - e.created_at.getTime()) / (1000 * 60 * 60 * 24);
      return ageInDays < 365;
    });

    let status: AIAssessmentResult['status'];
    let confidence: number;
    let riskLevel: AIAssessmentResult['riskLevel'];

    if (recentEvidence.length >= 2) {
      status = 'compliant';
      confidence = 0.6;
      riskLevel = 'low';
    } else if (recentEvidence.length === 1 || (hasEvidence && recentEvidence.length === 0)) {
      status = 'partial';
      confidence = 0.5;
      riskLevel = 'medium';
    } else {
      status = 'non_compliant';
      confidence = 0.4;
      riskLevel = control.risk_category as AIAssessmentResult['riskLevel'] || 'medium';
    }

    return {
      status,
      confidence,
      reasoning: `Heuristic assessment based on ${evidence.length} evidence items. ${recentEvidence.length} items from the last year. Manual review recommended for accurate assessment.`,
      findings: hasEvidence
        ? [`${evidence.length} evidence items found`]
        : ['No evidence found for this control'],
      recommendations: [
        'Upload relevant documentation',
        'Complete manual assessment',
        'Enable AI assessment for more accurate results'
      ],
      evidenceGaps: hasEvidence
        ? ['Additional documentation may be needed']
        : ['All evidence types are missing'],
      riskLevel
    };
  }

  /**
   * Generate default AI prompt for controls without custom prompts
   */
  private generateDefaultPrompt(control: ComplianceControl): string {
    return `Evaluate compliance with ${control.title}.
Consider: ${control.objective}
Implementation guidance: ${control.implementation_guidance}
Assess based on available evidence and industry best practices.`;
  }

  /**
   * Map risk level to severity
   */
  private mapRiskToSeverity(
    riskLevel: AIAssessmentResult['riskLevel'],
    controlRiskCategory: string
  ): AssessmentFinding['severity'] {
    // Use AI risk level but weight by control's inherent risk
    const riskMap: Record<string, number> = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };

    const aiRisk = riskMap[riskLevel] || 2;
    const controlRisk = riskMap[controlRiskCategory] || 2;
    const combinedRisk = Math.ceil((aiRisk + controlRisk) / 2);

    const severityMap: Record<number, AssessmentFinding['severity']> = {
      4: 'critical',
      3: 'high',
      2: 'medium',
      1: 'low'
    };

    return severityMap[combinedRisk] || 'medium';
  }

  /**
   * Create error finding when assessment fails
   */
  private createErrorFinding(control: ComplianceControl): AssessmentFinding {
    return {
      controlId: control.id,
      status: 'partial',
      severity: 'medium',
      confidence: 0.2,
      aiReasoning: 'Assessment could not be completed due to an error. Manual review required.',
      findings: ['Assessment failed'],
      recommendations: ['Retry assessment', 'Conduct manual review'],
      evidenceGaps: ['Unable to assess'],
      assessedAt: new Date(),
      assessedBy: 'hybrid'
    };
  }
}

export default MageAgentAssessmentService;
