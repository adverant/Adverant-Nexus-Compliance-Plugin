/**
 * Nexus Compliance Engine - Compliance Scheduler
 * Scheduled jobs for continuous compliance monitoring
 */

import { createLogger } from '../utils/logger.js';
import { monitoringService } from '../services/monitoring-service.js';
import { alertService } from '../services/alert-service.js';
import { evidenceService } from '../services/evidence-service.js';
import { query, type DatabaseRow } from '../database/client.js';
import { getAdapterRegistry, type CollectedEvidence } from '../adapters/index.js';

const logger = createLogger('compliance-scheduler');

/**
 * Job schedule configuration
 */
export interface ScheduleConfig {
  enabled: boolean;
  intervalMs: number;
  name: string;
}

/**
 * Job result
 */
export interface JobResult {
  jobName: string;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  success: boolean;
  error?: string;
  details?: Record<string, unknown>;
}

/**
 * Compliance Scheduler - Manages scheduled compliance jobs
 */
export class ComplianceScheduler {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;
  private jobResults: JobResult[] = [];

  /**
   * Default job schedules
   */
  private defaultSchedules: Record<string, ScheduleConfig> = {
    dailyComplianceCheck: {
      enabled: true,
      intervalMs: 24 * 60 * 60 * 1000, // 24 hours
      name: 'Daily Compliance Check'
    },
    hourlyAlertCheck: {
      enabled: true,
      intervalMs: 60 * 60 * 1000, // 1 hour
      name: 'Hourly Alert Check'
    },
    evidenceExpiration: {
      enabled: true,
      intervalMs: 6 * 60 * 60 * 1000, // 6 hours
      name: 'Evidence Expiration Check'
    },
    alertCleanup: {
      enabled: true,
      intervalMs: 24 * 60 * 60 * 1000, // 24 hours
      name: 'Alert Cleanup'
    },
    remediationCheck: {
      enabled: true,
      intervalMs: 12 * 60 * 60 * 1000, // 12 hours
      name: 'Remediation Due Date Check'
    },
    evidenceCollection: {
      enabled: true,
      intervalMs: 6 * 60 * 60 * 1000, // 6 hours
      name: 'Automatic Evidence Collection'
    }
  };

  /**
   * Start the scheduler
   */
  async start(customSchedules?: Partial<Record<string, ScheduleConfig>>): Promise<void> {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting compliance scheduler');

    const schedules = { ...this.defaultSchedules, ...customSchedules };

    // Schedule each enabled job
    for (const [jobId, jobConfig] of Object.entries(schedules)) {
      if (jobConfig && jobConfig.enabled) {
        this.scheduleJob(jobId, jobConfig);
      }
    }

    // Run initial checks on startup (with delay to allow service initialization)
    setTimeout(() => {
      this.runAllChecks().catch(err => {
        logger.error({ error: err.message }, 'Initial compliance check failed');
      });
    }, 30000); // 30 second delay on startup

    logger.info({
      enabledJobs: Object.entries(schedules)
        .filter(([, c]) => c?.enabled)
        .map(([id, c]) => `${id} (${c!.intervalMs / 1000}s)`)
    }, 'Scheduler started');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Clear all intervals
    for (const [jobId, interval] of this.intervals.entries()) {
      clearInterval(interval);
      logger.debug({ jobId }, 'Job stopped');
    }

    this.intervals.clear();
    logger.info('Scheduler stopped');
  }

  /**
   * Schedule a job
   */
  private scheduleJob(jobId: string, config: ScheduleConfig): void {
    const interval = setInterval(async () => {
      await this.runJob(jobId);
    }, config.intervalMs);

    this.intervals.set(jobId, interval);

    logger.debug({
      jobId,
      name: config.name,
      intervalMs: config.intervalMs
    }, 'Job scheduled');
  }

  /**
   * Run a specific job
   */
  private async runJob(jobId: string): Promise<JobResult> {
    const startedAt = new Date();
    let success = true;
    let error: string | undefined;
    let details: Record<string, unknown> | undefined;

    try {
      switch (jobId) {
        case 'dailyComplianceCheck':
          details = await this.runDailyComplianceCheck();
          break;
        case 'hourlyAlertCheck':
          details = await this.runHourlyAlertCheck();
          break;
        case 'evidenceExpiration':
          details = await this.runEvidenceExpirationCheck();
          break;
        case 'alertCleanup':
          details = await this.runAlertCleanup();
          break;
        case 'remediationCheck':
          details = await this.runRemediationCheck();
          break;
        case 'evidenceCollection':
          details = await this.runEvidenceCollection();
          break;
        default:
          throw new Error(`Unknown job: ${jobId}`);
      }
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      logger.error({ jobId, error }, 'Job failed');
    }

    const completedAt = new Date();
    const result: JobResult = {
      jobName: jobId,
      startedAt,
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      success,
      error,
      details
    };

    // Keep last 100 results
    this.jobResults.push(result);
    if (this.jobResults.length > 100) {
      this.jobResults.shift();
    }

    return result;
  }

  /**
   * Run all checks immediately
   */
  async runAllChecks(): Promise<Record<string, JobResult>> {
    const results: Record<string, JobResult> = {};

    for (const jobId of Object.keys(this.defaultSchedules)) {
      if (this.defaultSchedules[jobId]?.enabled) {
        results[jobId] = await this.runJob(jobId);
      }
    }

    return results;
  }

  /**
   * Daily compliance check across all tenants and frameworks
   */
  private async runDailyComplianceCheck(): Promise<Record<string, unknown>> {
    logger.info('Running daily compliance check');

    // Get all active tenant/framework combinations with completed assessments
    const tenantsResult = await query<{ tenant_id: string; framework_id: string }>(
      `SELECT DISTINCT tenant_id, framework_id
       FROM compliance_assessments
       WHERE status = 'completed'
         AND completed_at > NOW() - INTERVAL '30 days'`
    );

    let checksRun = 0;
    let alertsCreated = 0;
    let errors = 0;

    for (const row of tenantsResult.rows) {
      try {
        const result = await monitoringService.runScheduledCheck(
          row.tenant_id,
          row.framework_id
        );
        checksRun++;
        alertsCreated += result.alertsCreated;
      } catch (err) {
        errors++;
        logger.error({
          tenantId: row.tenant_id,
          frameworkId: row.framework_id,
          error: err instanceof Error ? err.message : 'Unknown'
        }, 'Compliance check failed for tenant/framework');
      }
    }

    logger.info({
      checksRun,
      alertsCreated,
      errors
    }, 'Daily compliance check completed');

    return { checksRun, alertsCreated, errors };
  }

  /**
   * Hourly alert escalation check
   */
  private async runHourlyAlertCheck(): Promise<Record<string, unknown>> {
    logger.info('Running hourly alert check');

    // Get all tenants with active alerts
    const tenantsResult = await query<{ tenant_id: string }>(
      `SELECT DISTINCT tenant_id
       FROM compliance_alerts
       WHERE NOT resolved`
    );

    let escalationsTriggered = 0;
    let tenantsChecked = 0;

    for (const row of tenantsResult.rows) {
      try {
        const escalation = await alertService.getEscalationStatus(row.tenant_id);
        tenantsChecked++;

        if (escalation.escalationRequired) {
          escalationsTriggered++;

          // Create escalation alert
          await alertService.createAlert(
            { tenantId: row.tenant_id, userId: 'system', requestId: `scheduler-${Date.now()}` },
            {
              type: 'compliance_breach',
              severity: 'critical',
              title: 'Alert Escalation Required',
              message: `${escalation.criticalOlderThan1Hour} critical alerts unacknowledged for over 1 hour. ${escalation.errorOlderThan24Hours} error alerts unacknowledged for over 24 hours.`,
              details: escalation
            }
          );

          logger.warn({
            tenantId: row.tenant_id,
            ...escalation
          }, 'Alert escalation triggered');
        }
      } catch (err) {
        logger.error({
          tenantId: row.tenant_id,
          error: err instanceof Error ? err.message : 'Unknown'
        }, 'Alert check failed for tenant');
      }
    }

    logger.info({
      tenantsChecked,
      escalationsTriggered
    }, 'Hourly alert check completed');

    return { tenantsChecked, escalationsTriggered };
  }

  /**
   * Evidence expiration check
   */
  private async runEvidenceExpirationCheck(): Promise<Record<string, unknown>> {
    logger.info('Running evidence expiration check');

    // Get all tenants
    const tenantsResult = await query<{ tenant_id: string }>(
      `SELECT DISTINCT tenant_id FROM compliance_evidence`
    );

    let tenantsChecked = 0;
    let expiredMarked = 0;
    let expiringFound = 0;

    for (const row of tenantsResult.rows) {
      try {
        // Mark expired evidence
        const expired = await evidenceService.markExpiredEvidence(row.tenant_id);
        expiredMarked += expired;

        // Check for expiring evidence
        const expiring = await evidenceService.getExpiringEvidence(row.tenant_id, 30);
        expiringFound += expiring.length;

        tenantsChecked++;
      } catch (err) {
        logger.error({
          tenantId: row.tenant_id,
          error: err instanceof Error ? err.message : 'Unknown'
        }, 'Evidence expiration check failed for tenant');
      }
    }

    logger.info({
      tenantsChecked,
      expiredMarked,
      expiringFound
    }, 'Evidence expiration check completed');

    return { tenantsChecked, expiredMarked, expiringFound };
  }

  /**
   * Alert cleanup - remove old resolved alerts
   */
  private async runAlertCleanup(): Promise<Record<string, unknown>> {
    logger.info('Running alert cleanup');

    // Get all tenants with resolved alerts
    const tenantsResult = await query<{ tenant_id: string }>(
      `SELECT DISTINCT tenant_id
       FROM compliance_alerts
       WHERE resolved = true`
    );

    let tenantsProcessed = 0;
    let alertsDeleted = 0;

    for (const row of tenantsResult.rows) {
      try {
        const deleted = await alertService.cleanupOldAlerts(row.tenant_id, 90);
        alertsDeleted += deleted;
        tenantsProcessed++;
      } catch (err) {
        logger.error({
          tenantId: row.tenant_id,
          error: err instanceof Error ? err.message : 'Unknown'
        }, 'Alert cleanup failed for tenant');
      }
    }

    logger.info({
      tenantsProcessed,
      alertsDeleted
    }, 'Alert cleanup completed');

    return { tenantsProcessed, alertsDeleted };
  }

  /**
   * Remediation due date check
   */
  private async runRemediationCheck(): Promise<Record<string, unknown>> {
    logger.info('Running remediation due date check');

    // Find overdue remediations
    const overdueResult = await query<{
      tenant_id: string;
      count: string;
      control_ids: string[];
    }>(
      `SELECT tenant_id, COUNT(*) as count,
              ARRAY_AGG(control_id) as control_ids
       FROM control_findings
       WHERE remediation_status = 'in_progress'
         AND remediation_due_date < NOW()
       GROUP BY tenant_id`
    );

    let tenantsWithOverdue = 0;
    let totalOverdue = 0;
    let alertsCreated = 0;

    for (const row of overdueResult.rows) {
      const overdueCount = parseInt(row.count, 10);
      totalOverdue += overdueCount;
      tenantsWithOverdue++;

      try {
        await alertService.createAlert(
          { tenantId: row.tenant_id, userId: 'system', requestId: `scheduler-${Date.now()}` },
          {
            type: 'overdue_remediation',
            severity: overdueCount > 10 ? 'critical' : overdueCount > 5 ? 'error' : 'warning',
            title: `${overdueCount} Remediation Tasks Overdue`,
            message: `${overdueCount} remediation tasks have passed their due date and require immediate attention.`,
            details: {
              overdueCount,
              controlIds: row.control_ids.slice(0, 20) // Limit to first 20
            }
          }
        );
        alertsCreated++;
      } catch (err) {
        logger.error({
          tenantId: row.tenant_id,
          error: err instanceof Error ? err.message : 'Unknown'
        }, 'Remediation alert creation failed');
      }
    }

    // Find remediations due soon (next 7 days)
    const dueSoonResult = await query<{ tenant_id: string; count: string }>(
      `SELECT tenant_id, COUNT(*) as count
       FROM control_findings
       WHERE remediation_status = 'in_progress'
         AND remediation_due_date > NOW()
         AND remediation_due_date < NOW() + INTERVAL '7 days'
       GROUP BY tenant_id`
    );

    let tenantsWithDueSoon = dueSoonResult.rows.length;

    for (const row of dueSoonResult.rows) {
      const count = parseInt(row.count, 10);

      try {
        await alertService.createAlert(
          { tenantId: row.tenant_id, userId: 'system', requestId: `scheduler-${Date.now()}` },
          {
            type: 'overdue_remediation',
            severity: 'info',
            title: `${count} Remediations Due Within 7 Days`,
            message: `${count} remediation tasks are due within the next 7 days.`,
            details: { dueSoonCount: count }
          }
        );
        alertsCreated++;
      } catch (err) {
        // Suppress duplicates
      }
    }

    logger.info({
      tenantsWithOverdue,
      totalOverdue,
      tenantsWithDueSoon,
      alertsCreated
    }, 'Remediation check completed');

    return { tenantsWithOverdue, totalOverdue, tenantsWithDueSoon, alertsCreated };
  }

  /**
   * Automatic evidence collection from adapters
   */
  private async runEvidenceCollection(): Promise<Record<string, unknown>> {
    logger.info('Running automatic evidence collection');

    // Get all tenants with configured adapters
    const tenantsResult = await query<{ tenant_id: string }>(
      `SELECT DISTINCT tenant_id FROM compliance_adapters WHERE enabled = true`
    );

    let tenantsProcessed = 0;
    let adaptersRun = 0;
    let evidenceCollected = 0;
    let evidenceStored = 0;
    let errors = 0;

    for (const row of tenantsResult.rows) {
      try {
        const registry = await getAdapterRegistry(row.tenant_id, true);
        tenantsProcessed++;

        // Collect evidence from all adapters
        const result = await registry.collectAllEvidence();
        adaptersRun += result.totalAdapters;
        evidenceCollected += result.totalEvidenceCollected;

        // Store collected evidence
        for (const [adapterId, collectionResult] of result.results) {
          for (const evidence of collectionResult.evidence) {
            try {
              await this.storeCollectedEvidence(row.tenant_id, evidence, adapterId);
              evidenceStored++;
            } catch (storeError) {
              errors++;
              logger.warn({
                tenantId: row.tenant_id,
                adapterId,
                evidenceId: evidence.externalId,
                error: storeError instanceof Error ? storeError.message : 'Unknown'
              }, 'Failed to store evidence');
            }
          }
        }

        if (result.failedAdapters > 0) {
          errors += result.failedAdapters;
        }

      } catch (err) {
        errors++;
        logger.error({
          tenantId: row.tenant_id,
          error: err instanceof Error ? err.message : 'Unknown'
        }, 'Evidence collection failed for tenant');
      }
    }

    logger.info({
      tenantsProcessed,
      adaptersRun,
      evidenceCollected,
      evidenceStored,
      errors
    }, 'Evidence collection completed');

    return { tenantsProcessed, adaptersRun, evidenceCollected, evidenceStored, errors };
  }

  /**
   * Store collected evidence in the database
   */
  private async storeCollectedEvidence(
    tenantId: string,
    evidence: CollectedEvidence,
    adapterId: string
  ): Promise<void> {
    // Check if evidence already exists (by external ID)
    const existingResult = await query<{ id: string }>(
      `SELECT id FROM compliance_evidence
       WHERE tenant_id = $1 AND source_system = $2
       ORDER BY collected_at DESC LIMIT 1`,
      [tenantId, evidence.source]
    );

    if (existingResult.rows.length > 0) {
      // Update existing evidence
      await query(
        `UPDATE compliance_evidence
         SET title = $1,
             description = $2,
             metadata = $3,
             collected_at = $4,
             valid_until = $5,
             status = $6,
             updated_at = NOW()
         WHERE tenant_id = $7 AND source_system = $8`,
        [
          evidence.title,
          evidence.description,
          JSON.stringify({
            ...evidence.rawData,
            severity: evidence.severity,
            controlMappings: evidence.controlMappings,
            adapterId,
          }),
          evidence.collectedAt,
          evidence.expiresAt,
          evidence.status === 'valid' ? 'approved' : 'pending',
          tenantId,
          evidence.source,
        ]
      );
    } else {
      // Insert new evidence
      await query(
        `INSERT INTO compliance_evidence (
          id, tenant_id, control_id, type, title, description,
          source_system, source_url, collected_at, collected_by,
          valid_until, status, metadata
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, $11, $12
        )`,
        [
          tenantId,
          evidence.controlMappings[0] || 'GENERAL', // Primary control
          evidence.type,
          evidence.title,
          evidence.description,
          evidence.source,
          adapterId,
          evidence.collectedAt,
          'system',
          evidence.expiresAt,
          evidence.status === 'valid' ? 'approved' : 'pending',
          JSON.stringify({
            ...evidence.rawData,
            severity: evidence.severity,
            allControlMappings: evidence.controlMappings,
            adapterId,
            externalId: evidence.externalId,
          }),
        ]
      );
    }

    // Link evidence to all mapped controls
    for (const controlId of evidence.controlMappings) {
      await query(
        `INSERT INTO control_evidence_links (id, evidence_id, control_id, linked_at, linked_by)
         SELECT gen_random_uuid(), e.id, $2, NOW(), 'system'
         FROM compliance_evidence e
         WHERE e.tenant_id = $1 AND e.source_system = $3
         ORDER BY e.collected_at DESC LIMIT 1
         ON CONFLICT DO NOTHING`,
        [tenantId, controlId, evidence.source]
      ).catch(() => {
        // Ignore constraint errors - link may already exist
      });
    }
  }

  /**
   * Get recent job results
   */
  getJobResults(): JobResult[] {
    return [...this.jobResults];
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    activeJobs: string[];
    lastResults: JobResult[];
  } {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.intervals.keys()),
      lastResults: this.jobResults.slice(-10)
    };
  }

  /**
   * Manually trigger a specific job
   */
  async triggerJob(jobId: string): Promise<JobResult> {
    if (!this.defaultSchedules[jobId]) {
      throw new Error(`Unknown job: ${jobId}`);
    }

    return this.runJob(jobId);
  }
}

export const complianceScheduler = new ComplianceScheduler();
