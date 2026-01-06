/**
 * Nexus Compliance Engine - Monitoring Service
 * Continuous compliance monitoring, drift detection, and baseline management
 */

import { v4 as uuidv4 } from 'uuid';
import {
  query,
  transaction,
  type DatabaseRow,
} from '../database/client.js';
import { createLogger } from '../utils/logger.js';
import { alertService, type AlertSeverity, type AlertType } from './alert-service.js';
import { evidenceService } from './evidence-service.js';
import type { ComplianceServiceContext } from '../types/index.js';

const logger = createLogger('monitoring-service');

/**
 * Compliance baseline snapshot
 */
export interface ComplianceBaseline {
  id: string;
  tenantId: string;
  assessmentId: string;
  frameworkId: string;
  overallScore: number;
  controlScores: Record<string, {
    status: string;
    score: number;
    evidenceCount: number;
  }>;
  capturedAt: Date;
  capturedBy: string;
  notes?: string;
}

/**
 * Drift detection result
 */
export interface DriftResult {
  controlId: string;
  controlNumber: string;
  controlTitle: string;
  previousStatus: string;
  currentStatus: string;
  previousScore: number;
  currentScore: number;
  scoreDelta: number;
  driftType: 'improved' | 'degraded' | 'unchanged';
  evidenceChanged: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Monitoring check result
 */
export interface MonitoringCheckResult {
  checkId: string;
  tenantId: string;
  frameworkId: string;
  checkedAt: Date;
  previousScore: number;
  currentScore: number;
  scoreDelta: number;
  drifts: DriftResult[];
  expiredEvidence: number;
  expiringEvidence: number;
  overdueRemediations: number;
  alertsCreated: number;
}

/**
 * Compliance trend data point
 */
export interface ComplianceTrendPoint {
  date: Date;
  score: number;
  compliantCount: number;
  partialCount: number;
  nonCompliantCount: number;
  notApplicableCount: number;
}

/**
 * Monitoring Service - Continuous compliance monitoring
 */
export class MonitoringService {
  /**
   * Capture a baseline snapshot from an assessment
   */
  async captureBaseline(
    context: ComplianceServiceContext,
    assessmentId: string,
    notes?: string
  ): Promise<ComplianceBaseline> {
    // Get assessment details
    const assessmentResult = await query<DatabaseRow>(
      `SELECT id, framework_id, overall_score
       FROM compliance_assessments
       WHERE id = $1 AND tenant_id = $2 AND status = 'completed'`,
      [assessmentId, context.tenantId]
    );

    if (assessmentResult.rows.length === 0) {
      throw new Error(`Completed assessment not found: ${assessmentId}`);
    }

    const assessment = assessmentResult.rows[0]!;

    // Get control findings
    const findingsResult = await query<DatabaseRow>(
      `SELECT f.control_id, f.status, c.control_number, c.title,
              (SELECT COUNT(*) FROM compliance_evidence e
               WHERE e.control_id = f.control_id
                 AND e.tenant_id = $2
                 AND e.status = 'approved') as evidence_count
       FROM control_findings f
       JOIN compliance_controls c ON f.control_id = c.id
       WHERE f.assessment_id = $1 AND f.tenant_id = $2`,
      [assessmentId, context.tenantId]
    );

    // Build control scores map
    const controlScores: Record<string, { status: string; score: number; evidenceCount: number }> = {};
    for (const row of findingsResult.rows) {
      const status = row['status'] as string;
      let score = 0;
      if (status === 'compliant') score = 100;
      else if (status === 'partial') score = 50;
      else if (status === 'not_applicable') score = 100;

      controlScores[row['control_id'] as string] = {
        status,
        score,
        evidenceCount: parseInt(row['evidence_count'] as string, 10)
      };
    }

    const baselineId = uuidv4();
    const baseline: ComplianceBaseline = {
      id: baselineId,
      tenantId: context.tenantId,
      assessmentId,
      frameworkId: assessment['framework_id'] as string,
      overallScore: assessment['overall_score'] as number,
      controlScores,
      capturedAt: new Date(),
      capturedBy: context.userId,
      notes
    };

    // Store baseline
    await query(
      `INSERT INTO compliance_baselines (
        id, tenant_id, assessment_id, framework_id, overall_score,
        control_scores, captured_at, captured_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        baselineId,
        context.tenantId,
        assessmentId,
        baseline.frameworkId,
        baseline.overallScore,
        JSON.stringify(controlScores),
        baseline.capturedAt,
        baseline.capturedBy,
        notes
      ]
    );

    logger.info({
      tenantId: context.tenantId,
      baselineId,
      assessmentId,
      frameworkId: baseline.frameworkId,
      overallScore: baseline.overallScore
    }, 'Baseline captured');

    return baseline;
  }

  /**
   * Get the latest baseline for a framework
   */
  async getLatestBaseline(
    tenantId: string,
    frameworkId: string
  ): Promise<ComplianceBaseline | null> {
    const result = await query<DatabaseRow>(
      `SELECT * FROM compliance_baselines
       WHERE tenant_id = $1 AND framework_id = $2
       ORDER BY captured_at DESC
       LIMIT 1`,
      [tenantId, frameworkId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0]!;
    return {
      id: row['id'] as string,
      tenantId: row['tenant_id'] as string,
      assessmentId: row['assessment_id'] as string,
      frameworkId: row['framework_id'] as string,
      overallScore: row['overall_score'] as number,
      controlScores: typeof row['control_scores'] === 'string'
        ? JSON.parse(row['control_scores'] as string)
        : row['control_scores'],
      capturedAt: new Date(row['captured_at'] as string),
      capturedBy: row['captured_by'] as string,
      notes: row['notes'] as string | undefined
    };
  }

  /**
   * Detect drift from baseline
   */
  async detectDrift(
    tenantId: string,
    frameworkId: string,
    currentAssessmentId: string
  ): Promise<DriftResult[]> {
    // Get latest baseline
    const baseline = await this.getLatestBaseline(tenantId, frameworkId);

    if (!baseline) {
      logger.info({ tenantId, frameworkId }, 'No baseline found for drift detection');
      return [];
    }

    // Get current findings
    const currentResult = await query<DatabaseRow>(
      `SELECT f.control_id, f.status, c.control_number, c.title, c.risk_category,
              (SELECT COUNT(*) FROM compliance_evidence e
               WHERE e.control_id = f.control_id
                 AND e.tenant_id = $2
                 AND e.status = 'approved') as evidence_count
       FROM control_findings f
       JOIN compliance_controls c ON f.control_id = c.id
       WHERE f.assessment_id = $1 AND f.tenant_id = $2`,
      [currentAssessmentId, tenantId]
    );

    const drifts: DriftResult[] = [];

    for (const row of currentResult.rows) {
      const controlId = row['control_id'] as string;
      const currentStatus = row['status'] as string;
      const currentEvidenceCount = parseInt(row['evidence_count'] as string, 10);
      const riskCategory = row['risk_category'] as string;

      const baselineData = baseline.controlScores[controlId];

      if (!baselineData) {
        // New control, not in baseline
        continue;
      }

      // Calculate current score
      let currentScore = 0;
      if (currentStatus === 'compliant') currentScore = 100;
      else if (currentStatus === 'partial') currentScore = 50;
      else if (currentStatus === 'not_applicable') currentScore = 100;

      const scoreDelta = currentScore - baselineData.score;
      const evidenceChanged = currentEvidenceCount !== baselineData.evidenceCount;

      // Only report if there's actual drift
      if (scoreDelta === 0 && !evidenceChanged) {
        continue;
      }

      let driftType: 'improved' | 'degraded' | 'unchanged' = 'unchanged';
      if (scoreDelta > 0) driftType = 'improved';
      else if (scoreDelta < 0) driftType = 'degraded';

      // Calculate severity based on risk category and drift magnitude
      let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';
      if (driftType === 'degraded') {
        if (riskCategory === 'critical' || scoreDelta <= -50) {
          severity = 'critical';
        } else if (riskCategory === 'high' || scoreDelta <= -25) {
          severity = 'high';
        } else if (riskCategory === 'medium') {
          severity = 'medium';
        }
      }

      drifts.push({
        controlId,
        controlNumber: row['control_number'] as string,
        controlTitle: row['title'] as string,
        previousStatus: baselineData.status,
        currentStatus,
        previousScore: baselineData.score,
        currentScore,
        scoreDelta,
        driftType,
        evidenceChanged,
        severity
      });
    }

    return drifts;
  }

  /**
   * Run scheduled compliance check
   */
  async runScheduledCheck(
    tenantId: string,
    frameworkId: string
  ): Promise<MonitoringCheckResult> {
    const checkId = uuidv4();
    const checkedAt = new Date();

    logger.info({ tenantId, frameworkId, checkId }, 'Starting scheduled compliance check');

    // Get latest completed assessment
    const assessmentResult = await query<DatabaseRow>(
      `SELECT id, overall_score FROM compliance_assessments
       WHERE tenant_id = $1 AND framework_id = $2 AND status = 'completed'
       ORDER BY completed_at DESC
       LIMIT 1`,
      [tenantId, frameworkId]
    );

    if (assessmentResult.rows.length === 0) {
      logger.warn({ tenantId, frameworkId }, 'No completed assessment found for monitoring');
      return {
        checkId,
        tenantId,
        frameworkId,
        checkedAt,
        previousScore: 0,
        currentScore: 0,
        scoreDelta: 0,
        drifts: [],
        expiredEvidence: 0,
        expiringEvidence: 0,
        overdueRemediations: 0,
        alertsCreated: 0
      };
    }

    const assessment = assessmentResult.rows[0]!;
    const assessmentId = assessment['id'] as string;
    const currentScore = assessment['overall_score'] as number;

    // Get baseline for comparison
    const baseline = await this.getLatestBaseline(tenantId, frameworkId);
    const previousScore = baseline?.overallScore ?? currentScore;

    // Detect drift
    const drifts = await this.detectDrift(tenantId, frameworkId, assessmentId);

    // Check for expiring evidence
    const expiringEvidence = await evidenceService.getExpiringEvidence(tenantId, 30);

    // Mark expired evidence
    const expiredCount = await evidenceService.markExpiredEvidence(tenantId);

    // Check for overdue remediations
    const overdueResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM control_findings
       WHERE tenant_id = $1
         AND remediation_status = 'in_progress'
         AND remediation_due_date < NOW()`,
      [tenantId]
    );
    const overdueRemediations = parseInt(overdueResult.rows[0]?.count ?? '0', 10);

    // Create alerts for issues found
    let alertsCreated = 0;
    const context: ComplianceServiceContext = { tenantId, userId: 'system', requestId: `monitoring-${checkId}` };

    // Alert for significant score degradation
    if (baseline && currentScore < previousScore - 10) {
      await alertService.createAlert(context, {
        type: 'drift',
        severity: currentScore < previousScore - 25 ? 'critical' : 'warning',
        title: `Compliance Score Dropped: ${frameworkId}`,
        message: `Overall compliance score dropped from ${previousScore}% to ${currentScore}% (${previousScore - currentScore} point decrease)`,
        details: {
          frameworkId,
          previousScore,
          currentScore,
          delta: currentScore - previousScore
        },
        assessmentId,
        frameworkId
      });
      alertsCreated++;
    }

    // Alert for degraded controls
    const degradedCritical = drifts.filter(d => d.driftType === 'degraded' && d.severity === 'critical');
    for (const drift of degradedCritical) {
      await alertService.createAlert(context, {
        type: 'drift',
        severity: 'critical',
        title: `Critical Control Degraded: ${drift.controlNumber}`,
        message: `Control "${drift.controlTitle}" status changed from ${drift.previousStatus} to ${drift.currentStatus}`,
        details: drift as unknown as Record<string, unknown>,
        controlId: drift.controlId,
        frameworkId
      });
      alertsCreated++;
    }

    // Alert for expiring evidence
    if (expiringEvidence.length > 0) {
      await alertService.createAlert(context, {
        type: 'expiration',
        severity: 'warning',
        title: `Evidence Expiring Soon`,
        message: `${expiringEvidence.length} evidence items will expire in the next 30 days`,
        details: {
          count: expiringEvidence.length,
          evidenceIds: expiringEvidence.slice(0, 10).map(e => e.id)
        },
        frameworkId
      });
      alertsCreated++;
    }

    // Alert for expired evidence
    if (expiredCount > 0) {
      await alertService.createAlert(context, {
        type: 'expiration',
        severity: 'error',
        title: `Evidence Expired`,
        message: `${expiredCount} evidence items have expired and need to be refreshed`,
        details: { expiredCount },
        frameworkId
      });
      alertsCreated++;
    }

    // Alert for overdue remediations
    if (overdueRemediations > 0) {
      await alertService.createAlert(context, {
        type: 'overdue_remediation',
        severity: overdueRemediations > 5 ? 'error' : 'warning',
        title: `Overdue Remediations`,
        message: `${overdueRemediations} remediation tasks are past their due date`,
        details: { overdueCount: overdueRemediations },
        frameworkId
      });
      alertsCreated++;
    }

    // Store check result
    await query(
      `INSERT INTO compliance_monitoring_checks (
        id, tenant_id, framework_id, checked_at, previous_score, current_score,
        score_delta, drift_count, expired_evidence, expiring_evidence,
        overdue_remediations, alerts_created
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        checkId,
        tenantId,
        frameworkId,
        checkedAt,
        previousScore,
        currentScore,
        currentScore - previousScore,
        drifts.length,
        expiredCount,
        expiringEvidence.length,
        overdueRemediations,
        alertsCreated
      ]
    );

    const result: MonitoringCheckResult = {
      checkId,
      tenantId,
      frameworkId,
      checkedAt,
      previousScore,
      currentScore,
      scoreDelta: currentScore - previousScore,
      drifts,
      expiredEvidence: expiredCount,
      expiringEvidence: expiringEvidence.length,
      overdueRemediations,
      alertsCreated
    };

    logger.info({
      tenantId,
      frameworkId,
      checkId,
      currentScore,
      driftsDetected: drifts.length,
      alertsCreated
    }, 'Scheduled compliance check completed');

    return result;
  }

  /**
   * Get compliance trend over time
   */
  async getComplianceTrend(
    tenantId: string,
    frameworkId: string,
    days: number = 90
  ): Promise<ComplianceTrendPoint[]> {
    const result = await query<DatabaseRow>(
      `SELECT
        DATE(completed_at) as date,
        overall_score as score,
        compliant_controls as compliant_count,
        partial_controls as partial_count,
        non_compliant_controls as non_compliant_count,
        not_applicable_controls as not_applicable_count
       FROM compliance_assessments
       WHERE tenant_id = $1
         AND framework_id = $2
         AND status = 'completed'
         AND completed_at >= NOW() - INTERVAL '${days} days'
       ORDER BY completed_at ASC`,
      [tenantId, frameworkId]
    );

    return result.rows.map(row => ({
      date: new Date(row['date'] as string),
      score: row['score'] as number,
      compliantCount: row['compliant_count'] as number,
      partialCount: row['partial_count'] as number,
      nonCompliantCount: row['non_compliant_count'] as number,
      notApplicableCount: row['not_applicable_count'] as number
    }));
  }

  /**
   * Get monitoring health status
   */
  async getMonitoringHealth(tenantId: string): Promise<{
    lastCheckAt: Date | null;
    activeAlerts: number;
    unacknowledgedAlerts: number;
    expiredEvidence: number;
    overdueRemediations: number;
    status: 'healthy' | 'warning' | 'critical';
  }> {
    const [lastCheckResult, alertsResult, expiredResult, overdueResult] = await Promise.all([
      query<{ checked_at: string }>(
        `SELECT checked_at FROM compliance_monitoring_checks
         WHERE tenant_id = $1
         ORDER BY checked_at DESC
         LIMIT 1`,
        [tenantId]
      ),
      query<{ total: string; unacknowledged: string }>(
        `SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE NOT acknowledged) as unacknowledged
         FROM compliance_alerts
         WHERE tenant_id = $1 AND NOT resolved`,
        [tenantId]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM compliance_evidence
         WHERE tenant_id = $1 AND status = 'expired'`,
        [tenantId]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM control_findings
         WHERE tenant_id = $1
           AND remediation_status = 'in_progress'
           AND remediation_due_date < NOW()`,
        [tenantId]
      )
    ]);

    const lastCheckAt = lastCheckResult.rows[0]?.checked_at
      ? new Date(lastCheckResult.rows[0].checked_at)
      : null;
    const activeAlerts = parseInt(alertsResult.rows[0]?.total ?? '0', 10);
    const unacknowledgedAlerts = parseInt(alertsResult.rows[0]?.unacknowledged ?? '0', 10);
    const expiredEvidence = parseInt(expiredResult.rows[0]?.count ?? '0', 10);
    const overdueRemediations = parseInt(overdueResult.rows[0]?.count ?? '0', 10);

    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (unacknowledgedAlerts > 10 || overdueRemediations > 10 || expiredEvidence > 20) {
      status = 'critical';
    } else if (unacknowledgedAlerts > 5 || overdueRemediations > 5 || expiredEvidence > 10) {
      status = 'warning';
    }

    return {
      lastCheckAt,
      activeAlerts,
      unacknowledgedAlerts,
      expiredEvidence,
      overdueRemediations,
      status
    };
  }

  /**
   * Get list of baselines
   */
  async listBaselines(
    tenantId: string,
    frameworkId?: string,
    limit: number = 10
  ): Promise<ComplianceBaseline[]> {
    let queryText = `
      SELECT * FROM compliance_baselines
      WHERE tenant_id = $1
    `;
    const params: unknown[] = [tenantId];

    if (frameworkId) {
      queryText += ` AND framework_id = $2`;
      params.push(frameworkId);
    }

    queryText += ` ORDER BY captured_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query<DatabaseRow>(queryText, params);

    return result.rows.map(row => ({
      id: row['id'] as string,
      tenantId: row['tenant_id'] as string,
      assessmentId: row['assessment_id'] as string,
      frameworkId: row['framework_id'] as string,
      overallScore: row['overall_score'] as number,
      controlScores: typeof row['control_scores'] === 'string'
        ? JSON.parse(row['control_scores'] as string)
        : row['control_scores'],
      capturedAt: new Date(row['captured_at'] as string),
      capturedBy: row['captured_by'] as string,
      notes: row['notes'] as string | undefined
    }));
  }
}

export const monitoringService = new MonitoringService();
