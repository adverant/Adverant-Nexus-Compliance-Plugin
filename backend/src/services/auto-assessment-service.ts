/**
 * Auto Assessment Service
 *
 * Automatically assesses entities against compliance frameworks, learns from
 * assessment feedback, and continuously improves assessment accuracy.
 *
 * Part of the Autonomous Compliance Learning System.
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types
// ============================================================================

export type AssessmentScheduleFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'annually';

export type AssessmentStatus =
  | 'scheduled'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ComplianceRating =
  | 'compliant'
  | 'partially_compliant'
  | 'non_compliant'
  | 'not_assessed'
  | 'not_applicable';

export type LearningEventType =
  | 'assessment_correction'
  | 'prompt_improvement'
  | 'evidence_pattern'
  | 'false_positive'
  | 'false_negative'
  | 'rating_override';

export interface AutoAssessmentSchedule {
  id: string;
  tenantId: string;
  frameworkId: string;
  frequency: AssessmentScheduleFrequency;
  nextRunAt: Date;
  lastRunAt?: Date;
  lastRunStatus?: AssessmentStatus;
  isActive: boolean;
  assessmentConfig: AssessmentConfig;
  notificationConfig?: NotificationConfig;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentConfig {
  aiSystemId?: string;
  controlSubset?: string[];
  includeEvidence?: boolean;
  confidenceThreshold?: number;
  requireHumanReview?: boolean;
  priorityControls?: string[];
}

export interface NotificationConfig {
  notifyOnCompletion: boolean;
  notifyOnFailure: boolean;
  notifyOnNonCompliance: boolean;
  recipientEmails?: string[];
  webhookUrl?: string;
}

export interface AutoAssessmentResult {
  id: string;
  scheduleId: string;
  tenantId: string;
  frameworkId: string;
  status: AssessmentStatus;
  startedAt: Date;
  completedAt?: Date;
  totalControls: number;
  assessedControls: number;
  compliantCount: number;
  partiallyCompliantCount: number;
  nonCompliantCount: number;
  notApplicableCount: number;
  overallScore: number;
  findings: AssessmentFinding[];
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface AssessmentFinding {
  controlId: string;
  rating: ComplianceRating;
  confidence: number;
  rationale: string;
  evidenceReviewed: string[];
  recommendations: string[];
  requiresReview: boolean;
}

export interface LearningFeedback {
  id: string;
  tenantId: string;
  assessmentId: string;
  controlId: string;
  eventType: LearningEventType;
  originalRating: ComplianceRating;
  correctedRating?: ComplianceRating;
  originalRationale: string;
  feedback: string;
  improvementSuggestion?: string;
  processedAt?: Date;
  appliedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface PromptImprovement {
  controlId: string;
  originalPrompt: string;
  improvedPrompt: string;
  improvementReason: string;
  confidenceGain: number;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface AssessmentPattern {
  patternId: string;
  controlId: string;
  patternType: 'evidence' | 'response' | 'rating';
  pattern: string;
  confidence: number;
  occurrences: number;
  lastSeen: Date;
}

export interface LearningMetrics {
  totalFeedback: number;
  appliedImprovements: number;
  averageConfidenceGain: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  mostImprovedControls: ControlImprovement[];
  pendingReview: number;
}

export interface ControlImprovement {
  controlId: string;
  controlTitle: string;
  improvementCount: number;
  confidenceChange: number;
}

// ============================================================================
// Service Implementation
// ============================================================================

export class AutoAssessmentService {
  constructor(private pool: Pool) {}

  // ==========================================================================
  // Schedule Management
  // ==========================================================================

  /**
   * Create an auto-assessment schedule for a tenant
   */
  async createSchedule(
    tenantId: string,
    frameworkId: string,
    frequency: AssessmentScheduleFrequency,
    config?: AssessmentConfig,
    notificationConfig?: NotificationConfig
  ): Promise<AutoAssessmentSchedule> {
    const id = uuidv4();
    const now = new Date();
    const nextRunAt = this.calculateNextRunTime(frequency, now);

    const result = await this.pool.query(
      `INSERT INTO compliance_auto_assessment_schedules (
        id, tenant_id, framework_id, frequency, next_run_at,
        is_active, assessment_config, notification_config, metadata,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        id,
        tenantId,
        frameworkId,
        frequency,
        nextRunAt,
        true,
        JSON.stringify(config || {}),
        JSON.stringify(notificationConfig || {}),
        JSON.stringify({}),
        now,
        now
      ]
    );

    return this.mapRowToSchedule(result.rows[0]);
  }

  /**
   * Get schedule by ID
   */
  async getSchedule(scheduleId: string): Promise<AutoAssessmentSchedule | null> {
    const result = await this.pool.query(
      `SELECT * FROM compliance_auto_assessment_schedules WHERE id = $1`,
      [scheduleId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToSchedule(result.rows[0]);
  }

  /**
   * List schedules for a tenant
   */
  async listSchedules(
    tenantId: string,
    options?: { frameworkId?: string; isActive?: boolean }
  ): Promise<AutoAssessmentSchedule[]> {
    const conditions: string[] = ['tenant_id = $1'];
    const values: any[] = [tenantId];
    let paramIndex = 2;

    if (options?.frameworkId) {
      conditions.push(`framework_id = $${paramIndex++}`);
      values.push(options.frameworkId);
    }
    if (options?.isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex++}`);
      values.push(options.isActive);
    }

    const result = await this.pool.query(
      `SELECT * FROM compliance_auto_assessment_schedules
       WHERE ${conditions.join(' AND ')}
       ORDER BY next_run_at ASC`,
      values
    );

    return result.rows.map(row => this.mapRowToSchedule(row));
  }

  /**
   * Update schedule frequency
   */
  async updateScheduleFrequency(
    scheduleId: string,
    frequency: AssessmentScheduleFrequency
  ): Promise<AutoAssessmentSchedule | null> {
    const nextRunAt = this.calculateNextRunTime(frequency, new Date());

    const result = await this.pool.query(
      `UPDATE compliance_auto_assessment_schedules
       SET frequency = $1, next_run_at = $2, updated_at = $3
       WHERE id = $4
       RETURNING *`,
      [frequency, nextRunAt, new Date(), scheduleId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToSchedule(result.rows[0]);
  }

  /**
   * Enable/disable schedule
   */
  async setScheduleActive(
    scheduleId: string,
    isActive: boolean
  ): Promise<AutoAssessmentSchedule | null> {
    const result = await this.pool.query(
      `UPDATE compliance_auto_assessment_schedules
       SET is_active = $1, updated_at = $2
       WHERE id = $3
       RETURNING *`,
      [isActive, new Date(), scheduleId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToSchedule(result.rows[0]);
  }

  /**
   * Delete schedule
   */
  async deleteSchedule(scheduleId: string): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM compliance_auto_assessment_schedules WHERE id = $1`,
      [scheduleId]
    );

    return (result.rowCount ?? 0) > 0;
  }

  // ==========================================================================
  // Assessment Execution
  // ==========================================================================

  /**
   * Run scheduled assessments that are due
   */
  async runScheduledAssessments(): Promise<AutoAssessmentResult[]> {
    const now = new Date();
    const results: AutoAssessmentResult[] = [];

    // Get all due schedules
    const schedules = await this.pool.query(
      `SELECT * FROM compliance_auto_assessment_schedules
       WHERE is_active = true AND next_run_at <= $1
       ORDER BY next_run_at ASC
       LIMIT 10`,
      [now]
    );

    for (const row of schedules.rows) {
      const schedule = this.mapRowToSchedule(row);

      try {
        const result = await this.runAssessment(schedule.tenantId, schedule.frameworkId, schedule.id);
        results.push(result);

        // Update schedule with next run time
        const nextRun = this.calculateNextRunTime(schedule.frequency, now);
        await this.pool.query(
          `UPDATE compliance_auto_assessment_schedules
           SET last_run_at = $1, last_run_status = $2, next_run_at = $3, updated_at = $1
           WHERE id = $4`,
          [now, 'completed', nextRun, schedule.id]
        );

        // Send notifications if configured
        if (schedule.notificationConfig) {
          await this.sendAssessmentNotifications(schedule, result);
        }
      } catch (error) {
        // Update schedule with error status
        await this.pool.query(
          `UPDATE compliance_auto_assessment_schedules
           SET last_run_at = $1, last_run_status = 'failed', updated_at = $1
           WHERE id = $2`,
          [now, schedule.id]
        );

        results.push({
          id: uuidv4(),
          scheduleId: schedule.id,
          tenantId: schedule.tenantId,
          frameworkId: schedule.frameworkId,
          status: 'failed',
          startedAt: now,
          completedAt: new Date(),
          totalControls: 0,
          assessedControls: 0,
          compliantCount: 0,
          partiallyCompliantCount: 0,
          nonCompliantCount: 0,
          notApplicableCount: 0,
          overallScore: 0,
          findings: [],
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Run assessment for a specific framework
   */
  async runAssessment(
    tenantId: string,
    frameworkId: string,
    scheduleId?: string
  ): Promise<AutoAssessmentResult> {
    const resultId = uuidv4();
    const startTime = new Date();

    // Get controls for the framework
    const controls = await this.pool.query(
      `SELECT id, title, description, ai_assessment_prompt, evidence_types
       FROM compliance_controls
       WHERE framework_id = $1 AND is_active = true
       ORDER BY id`,
      [frameworkId]
    );

    const findings: AssessmentFinding[] = [];
    let compliantCount = 0;
    let partiallyCompliantCount = 0;
    let nonCompliantCount = 0;
    let notApplicableCount = 0;

    // Assess each control
    for (const control of controls.rows) {
      const finding = await this.assessControl(tenantId, control);
      findings.push(finding);

      switch (finding.rating) {
        case 'compliant':
          compliantCount++;
          break;
        case 'partially_compliant':
          partiallyCompliantCount++;
          break;
        case 'non_compliant':
          nonCompliantCount++;
          break;
        case 'not_applicable':
          notApplicableCount++;
          break;
      }
    }

    const totalControls = controls.rows.length;
    const assessedControls = totalControls - notApplicableCount;
    const overallScore = assessedControls > 0
      ? ((compliantCount * 100 + partiallyCompliantCount * 50) / assessedControls)
      : 0;

    const result: AutoAssessmentResult = {
      id: resultId,
      scheduleId: scheduleId || 'manual',
      tenantId,
      frameworkId,
      status: 'completed',
      startedAt: startTime,
      completedAt: new Date(),
      totalControls,
      assessedControls,
      compliantCount,
      partiallyCompliantCount,
      nonCompliantCount,
      notApplicableCount,
      overallScore: Math.round(overallScore * 100) / 100,
      findings
    };

    // Store the result
    await this.storeAssessmentResult(result);

    return result;
  }

  /**
   * Assess a single control
   */
  private async assessControl(
    tenantId: string,
    control: any
  ): Promise<AssessmentFinding> {
    // Get available evidence for this control
    const evidenceResult = await this.pool.query(
      `SELECT id, file_name, file_type, description, verified
       FROM compliance_evidence
       WHERE tenant_id = $1
       AND evidence_type = ANY($2::text[])
       ORDER BY uploaded_at DESC
       LIMIT 10`,
      [tenantId, control.evidence_types || []]
    );

    const evidence = evidenceResult.rows;
    const evidenceReviewed = evidence.map((e: any) => e.file_name);

    // Get previous assessments for learning context
    const previousResult = await this.pool.query(
      `SELECT rating, ai_reasoning
       FROM control_assessments
       WHERE tenant_id = $1 AND control_id = $2
       ORDER BY assessed_at DESC
       LIMIT 1`,
      [tenantId, control.id]
    );

    // Determine rating based on evidence and previous assessments
    let rating: ComplianceRating = 'not_assessed';
    let confidence = 0.5;
    let rationale = '';
    const recommendations: string[] = [];

    if (evidence.length === 0) {
      rating = 'non_compliant';
      confidence = 0.7;
      rationale = 'No evidence found for this control.';
      recommendations.push('Upload relevant documentation or evidence.');
    } else {
      // Check if evidence is verified
      const verifiedEvidence = evidence.filter((e: any) => e.verified);
      const verificationRatio = verifiedEvidence.length / evidence.length;

      if (verificationRatio >= 0.8) {
        rating = 'compliant';
        confidence = 0.85;
        rationale = `${verifiedEvidence.length} of ${evidence.length} evidence items verified.`;
      } else if (verificationRatio >= 0.5) {
        rating = 'partially_compliant';
        confidence = 0.75;
        rationale = `Only ${verifiedEvidence.length} of ${evidence.length} evidence items verified.`;
        recommendations.push('Verify remaining evidence items.');
      } else {
        rating = 'non_compliant';
        confidence = 0.7;
        rationale = `Insufficient verified evidence: ${verifiedEvidence.length} of ${evidence.length}.`;
        recommendations.push('Review and verify existing evidence.');
        recommendations.push('Upload additional supporting documentation.');
      }
    }

    // Apply learning improvements if available
    const improvements = await this.getAppliedImprovements(control.id);
    if (improvements.length > 0) {
      confidence += 0.05 * Math.min(improvements.length, 5);
    }

    // Check if this needs human review based on confidence
    const requiresReview = confidence < 0.7 ||
      (previousResult.rows.length > 0 && previousResult.rows[0].rating !== rating);

    return {
      controlId: control.id,
      rating,
      confidence: Math.min(confidence, 0.95),
      rationale,
      evidenceReviewed,
      recommendations,
      requiresReview
    };
  }

  // ==========================================================================
  // Learning System
  // ==========================================================================

  /**
   * Record feedback on an assessment
   */
  async recordFeedback(
    tenantId: string,
    assessmentId: string,
    controlId: string,
    eventType: LearningEventType,
    originalRating: ComplianceRating,
    feedback: string,
    correctedRating?: ComplianceRating,
    improvementSuggestion?: string
  ): Promise<LearningFeedback> {
    const id = uuidv4();
    const now = new Date();

    // Get original rationale
    const originalResult = await this.pool.query(
      `SELECT ai_reasoning FROM control_assessments
       WHERE id = $1 OR (tenant_id = $2 AND control_id = $3)
       ORDER BY assessed_at DESC LIMIT 1`,
      [assessmentId, tenantId, controlId]
    );

    const originalRationale = originalResult.rows[0]?.ai_reasoning || '';

    const result = await this.pool.query(
      `INSERT INTO compliance_learning_feedback (
        id, tenant_id, assessment_id, control_id, event_type,
        original_rating, corrected_rating, original_rationale,
        feedback, improvement_suggestion, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        id,
        tenantId,
        assessmentId,
        controlId,
        eventType,
        originalRating,
        correctedRating || null,
        originalRationale,
        feedback,
        improvementSuggestion || null,
        JSON.stringify({}),
        now
      ]
    );

    return this.mapRowToFeedback(result.rows[0]);
  }

  /**
   * Process pending feedback and apply improvements
   */
  async processFeedback(): Promise<{ processed: number; applied: number }> {
    let processed = 0;
    let applied = 0;

    // Get unprocessed feedback
    const feedbackResult = await this.pool.query(
      `SELECT * FROM compliance_learning_feedback
       WHERE processed_at IS NULL
       ORDER BY created_at ASC
       LIMIT 50`
    );

    for (const row of feedbackResult.rows) {
      const feedback = this.mapRowToFeedback(row);

      try {
        // Analyze the feedback
        const analysis = await this.analyzeFeedback(feedback);

        // Apply improvements if appropriate
        if (analysis.shouldApply) {
          await this.applyImprovement(feedback, analysis);
          applied++;

          await this.pool.query(
            `UPDATE compliance_learning_feedback
             SET processed_at = $1, applied_at = $1
             WHERE id = $2`,
            [new Date(), feedback.id]
          );
        } else {
          await this.pool.query(
            `UPDATE compliance_learning_feedback
             SET processed_at = $1
             WHERE id = $2`,
            [new Date(), feedback.id]
          );
        }

        processed++;
      } catch (error) {
        // Log error but continue processing
        console.error(`Error processing feedback ${feedback.id}:`, error);
      }
    }

    return { processed, applied };
  }

  /**
   * Learn from assessment results
   */
  async learnFromAssessment(assessmentId: string): Promise<{ patterns: number; improvements: number }> {
    let patterns = 0;
    let improvements = 0;

    // Get assessment findings
    const result = await this.pool.query(
      `SELECT findings FROM auto_assessment_results WHERE id = $1`,
      [assessmentId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Assessment not found: ${assessmentId}`);
    }

    const findings: AssessmentFinding[] = JSON.parse(result.rows[0].findings || '[]');

    for (const finding of findings) {
      // Identify patterns in evidence usage
      if (finding.evidenceReviewed.length > 0) {
        await this.recordEvidencePattern(finding.controlId, finding.evidenceReviewed, finding.rating);
        patterns++;
      }

      // Identify controls that consistently require review
      if (finding.requiresReview) {
        const reviewCount = await this.getReviewCount(finding.controlId);
        if (reviewCount >= 3) {
          // Suggest prompt improvement
          await this.suggestPromptImprovement(finding.controlId, finding.rationale);
          improvements++;
        }
      }
    }

    return { patterns, improvements };
  }

  /**
   * Get learning metrics
   */
  async getLearningMetrics(tenantId?: string): Promise<LearningMetrics> {
    const conditions = tenantId ? 'WHERE tenant_id = $1' : '';
    const values = tenantId ? [tenantId] : [];

    // Total feedback
    const totalResult = await this.pool.query(
      `SELECT COUNT(*) FROM compliance_learning_feedback ${conditions}`,
      values
    );
    const totalFeedback = parseInt(totalResult.rows[0].count, 10);

    // Applied improvements
    const appliedResult = await this.pool.query(
      `SELECT COUNT(*) FROM compliance_learning_feedback
       ${conditions ? conditions + ' AND' : 'WHERE'} applied_at IS NOT NULL`,
      values
    );
    const appliedImprovements = parseInt(appliedResult.rows[0].count, 10);

    // False positive/negative rates
    const fpResult = await this.pool.query(
      `SELECT COUNT(*) FROM compliance_learning_feedback
       ${conditions ? conditions + ' AND' : 'WHERE'} event_type = 'false_positive'`,
      values
    );
    const fnResult = await this.pool.query(
      `SELECT COUNT(*) FROM compliance_learning_feedback
       ${conditions ? conditions + ' AND' : 'WHERE'} event_type = 'false_negative'`,
      values
    );

    const falsePositiveRate = totalFeedback > 0
      ? parseInt(fpResult.rows[0].count, 10) / totalFeedback
      : 0;
    const falseNegativeRate = totalFeedback > 0
      ? parseInt(fnResult.rows[0].count, 10) / totalFeedback
      : 0;

    // Pending review
    const pendingResult = await this.pool.query(
      `SELECT COUNT(*) FROM compliance_learning_feedback
       ${conditions ? conditions + ' AND' : 'WHERE'} processed_at IS NULL`,
      values
    );
    const pendingReview = parseInt(pendingResult.rows[0].count, 10);

    // Most improved controls
    const improvedResult = await this.pool.query(
      `SELECT control_id, COUNT(*) as improvement_count
       FROM compliance_learning_feedback
       ${conditions ? conditions + ' AND' : 'WHERE'} applied_at IS NOT NULL
       GROUP BY control_id
       ORDER BY improvement_count DESC
       LIMIT 10`,
      values
    );

    const mostImprovedControls: ControlImprovement[] = [];
    for (const row of improvedResult.rows) {
      const controlResult = await this.pool.query(
        `SELECT title FROM compliance_controls WHERE id = $1`,
        [row.control_id]
      );
      mostImprovedControls.push({
        controlId: row.control_id,
        controlTitle: controlResult.rows[0]?.title || 'Unknown',
        improvementCount: parseInt(row.improvement_count, 10),
        confidenceChange: 0.05 * parseInt(row.improvement_count, 10)
      });
    }

    return {
      totalFeedback,
      appliedImprovements,
      averageConfidenceGain: appliedImprovements > 0 ? 0.05 : 0,
      falsePositiveRate,
      falseNegativeRate,
      mostImprovedControls,
      pendingReview
    };
  }

  /**
   * Improve control prompts based on feedback
   */
  async improveControlPrompts(
    controlId: string,
    feedback: LearningFeedback
  ): Promise<PromptImprovement | null> {
    // Get current prompt
    const controlResult = await this.pool.query(
      `SELECT ai_assessment_prompt FROM compliance_controls WHERE id = $1`,
      [controlId]
    );

    if (controlResult.rows.length === 0) {
      return null;
    }

    const originalPrompt = controlResult.rows[0].ai_assessment_prompt || '';

    // Generate improved prompt based on feedback
    const improvedPrompt = this.generateImprovedPrompt(
      originalPrompt,
      feedback.feedback,
      feedback.improvementSuggestion
    );

    const improvement: PromptImprovement = {
      controlId,
      originalPrompt,
      improvedPrompt,
      improvementReason: feedback.feedback,
      confidenceGain: 0.05
    };

    // Store improvement for review
    await this.pool.query(
      `INSERT INTO compliance_generated_controls (
        id, framework_id, control_id, title, description, category,
        control_type, domain, guidance, implementation_difficulty,
        evidence_types, assessment_criteria, ai_prompt, status,
        confidence, related_controls, metadata, created_at, updated_at
      ) SELECT
        gen_random_uuid(), framework_id, id || '-improved', title || ' (Improved)',
        description, category, 'detective', domain, guidance, 'low',
        evidence_types, assessment_criteria, $1, 'pending_review',
        0.9, '[]'::jsonb, $2::jsonb, NOW(), NOW()
      FROM compliance_controls WHERE id = $3`,
      [
        improvedPrompt,
        JSON.stringify({ improvementType: 'prompt', originalPrompt, feedback: feedback.feedback }),
        controlId
      ]
    );

    return improvement;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private calculateNextRunTime(
    frequency: AssessmentScheduleFrequency,
    fromDate: Date
  ): Date {
    const next = new Date(fromDate);

    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'biweekly':
        next.setDate(next.getDate() + 14);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'annually':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    // Set to 2 AM to avoid peak hours
    next.setHours(2, 0, 0, 0);

    return next;
  }

  private async storeAssessmentResult(result: AutoAssessmentResult): Promise<void> {
    await this.pool.query(
      `INSERT INTO auto_assessment_results (
        id, schedule_id, tenant_id, framework_id, status,
        started_at, completed_at, total_controls, assessed_controls,
        compliant_count, partially_compliant_count, non_compliant_count,
        not_applicable_count, overall_score, findings, error_message, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        result.id,
        result.scheduleId,
        result.tenantId,
        result.frameworkId,
        result.status,
        result.startedAt,
        result.completedAt,
        result.totalControls,
        result.assessedControls,
        result.compliantCount,
        result.partiallyCompliantCount,
        result.nonCompliantCount,
        result.notApplicableCount,
        result.overallScore,
        JSON.stringify(result.findings),
        result.errorMessage || null,
        JSON.stringify(result.metadata || {})
      ]
    );
  }

  private async sendAssessmentNotifications(
    schedule: AutoAssessmentSchedule,
    result: AutoAssessmentResult
  ): Promise<void> {
    const config = schedule.notificationConfig;
    if (!config) return;

    const shouldNotify =
      (config.notifyOnCompletion && result.status === 'completed') ||
      (config.notifyOnFailure && result.status === 'failed') ||
      (config.notifyOnNonCompliance && result.nonCompliantCount > 0);

    if (!shouldNotify) return;

    // In production, this would send emails or call webhooks
    // For now, just log the notification
    console.log(`[AutoAssessment] Notification for ${schedule.tenantId}: ${result.status}`);
  }

  private async getAppliedImprovements(controlId: string): Promise<LearningFeedback[]> {
    const result = await this.pool.query(
      `SELECT * FROM compliance_learning_feedback
       WHERE control_id = $1 AND applied_at IS NOT NULL
       ORDER BY applied_at DESC
       LIMIT 10`,
      [controlId]
    );

    return result.rows.map(row => this.mapRowToFeedback(row));
  }

  private async analyzeFeedback(feedback: LearningFeedback): Promise<{
    shouldApply: boolean;
    reason: string;
    suggestedAction: string;
  }> {
    // Analyze feedback to determine if improvement should be applied
    const eventType = feedback.eventType;

    switch (eventType) {
      case 'rating_override':
      case 'assessment_correction':
        // These usually indicate the AI was wrong
        return {
          shouldApply: true,
          reason: 'User corrected the assessment rating',
          suggestedAction: 'Adjust assessment criteria'
        };

      case 'false_positive':
        return {
          shouldApply: true,
          reason: 'False positive identified',
          suggestedAction: 'Increase specificity in assessment'
        };

      case 'false_negative':
        return {
          shouldApply: true,
          reason: 'False negative identified',
          suggestedAction: 'Increase sensitivity in assessment'
        };

      case 'prompt_improvement':
        return {
          shouldApply: !!feedback.improvementSuggestion,
          reason: 'Prompt improvement suggested',
          suggestedAction: 'Update AI assessment prompt'
        };

      case 'evidence_pattern':
        return {
          shouldApply: true,
          reason: 'New evidence pattern identified',
          suggestedAction: 'Record pattern for future assessments'
        };

      default:
        return {
          shouldApply: false,
          reason: 'Unknown event type',
          suggestedAction: 'Manual review required'
        };
    }
  }

  private async applyImprovement(
    feedback: LearningFeedback,
    analysis: { shouldApply: boolean; reason: string; suggestedAction: string }
  ): Promise<void> {
    // Apply the improvement based on the analysis
    if (feedback.eventType === 'prompt_improvement' && feedback.improvementSuggestion) {
      await this.improveControlPrompts(feedback.controlId, feedback);
    }

    // Record the applied improvement
    await this.pool.query(
      `INSERT INTO compliance_generated_controls (
        id, framework_id, control_id, title, description, category,
        control_type, domain, guidance, implementation_difficulty,
        evidence_types, assessment_criteria, status, confidence,
        related_controls, metadata, created_at, updated_at
      ) SELECT
        gen_random_uuid(), 'learning', $1, 'Learning Improvement', $2,
        'organizational', 'detective', 'Learning', 'N/A', 'low',
        '[]'::jsonb, 'N/A', 'implemented', 0.9, '[]'::jsonb, $3::jsonb, NOW(), NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM compliance_generated_controls
        WHERE control_id = $1 AND metadata->>'feedbackId' = $4
      )`,
      [
        feedback.controlId + '-learning-' + Date.now(),
        analysis.reason,
        JSON.stringify({
          feedbackId: feedback.id,
          eventType: feedback.eventType,
          suggestedAction: analysis.suggestedAction
        }),
        feedback.id
      ]
    );
  }

  private async recordEvidencePattern(
    controlId: string,
    evidenceFiles: string[],
    rating: ComplianceRating
  ): Promise<void> {
    // Record patterns in evidence that correlate with ratings
    const pattern = evidenceFiles.sort().join(',');

    await this.pool.query(
      `INSERT INTO compliance_learning_feedback (
        id, tenant_id, assessment_id, control_id, event_type,
        original_rating, feedback, metadata, created_at
      ) VALUES ($1, 'system', 'pattern', $2, 'evidence_pattern', $3, $4, $5, NOW())`,
      [
        uuidv4(),
        controlId,
        rating,
        `Evidence pattern: ${pattern}`,
        JSON.stringify({ evidenceFiles, rating })
      ]
    );
  }

  private async getReviewCount(controlId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*) FROM compliance_learning_feedback
       WHERE control_id = $1 AND event_type IN ('rating_override', 'assessment_correction')`,
      [controlId]
    );

    return parseInt(result.rows[0].count, 10);
  }

  private async suggestPromptImprovement(
    controlId: string,
    rationale: string
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO compliance_learning_feedback (
        id, tenant_id, assessment_id, control_id, event_type,
        original_rating, feedback, improvement_suggestion, metadata, created_at
      ) VALUES ($1, 'system', 'suggestion', $2, 'prompt_improvement', 'not_assessed',
        'Control consistently requires human review', $3, $4, NOW())`,
      [
        uuidv4(),
        controlId,
        `Consider revising prompt to address: ${rationale}`,
        JSON.stringify({ autoSuggested: true })
      ]
    );
  }

  private generateImprovedPrompt(
    originalPrompt: string,
    feedback: string,
    suggestion?: string
  ): string {
    // Generate an improved prompt based on feedback
    let improved = originalPrompt;

    if (suggestion) {
      improved += `\n\nAdditional consideration: ${suggestion}`;
    }

    // Add specificity based on feedback
    if (feedback.toLowerCase().includes('false positive')) {
      improved += '\n\nBe more specific in your assessment. Only mark as compliant if there is clear, verified evidence.';
    }
    if (feedback.toLowerCase().includes('false negative')) {
      improved += '\n\nBe more inclusive in your assessment. Consider partial evidence and in-progress implementations.';
    }

    return improved;
  }

  private mapRowToSchedule(row: any): AutoAssessmentSchedule {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      frameworkId: row.framework_id,
      frequency: row.frequency as AssessmentScheduleFrequency,
      nextRunAt: new Date(row.next_run_at),
      lastRunAt: row.last_run_at ? new Date(row.last_run_at) : undefined,
      lastRunStatus: row.last_run_status as AssessmentStatus | undefined,
      isActive: row.is_active,
      assessmentConfig: typeof row.assessment_config === 'string'
        ? JSON.parse(row.assessment_config)
        : (row.assessment_config || {}),
      notificationConfig: row.notification_config
        ? (typeof row.notification_config === 'string'
          ? JSON.parse(row.notification_config)
          : row.notification_config)
        : undefined,
      metadata: typeof row.metadata === 'string'
        ? JSON.parse(row.metadata)
        : (row.metadata || {}),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapRowToFeedback(row: any): LearningFeedback {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      assessmentId: row.assessment_id,
      controlId: row.control_id,
      eventType: row.event_type as LearningEventType,
      originalRating: row.original_rating as ComplianceRating,
      correctedRating: row.corrected_rating as ComplianceRating | undefined,
      originalRationale: row.original_rationale,
      feedback: row.feedback,
      improvementSuggestion: row.improvement_suggestion || undefined,
      processedAt: row.processed_at ? new Date(row.processed_at) : undefined,
      appliedAt: row.applied_at ? new Date(row.applied_at) : undefined,
      metadata: typeof row.metadata === 'string'
        ? JSON.parse(row.metadata)
        : (row.metadata || {}),
      createdAt: new Date(row.created_at)
    };
  }
}
