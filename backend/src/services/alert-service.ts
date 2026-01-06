/**
 * Nexus Compliance Engine - Alert Service
 * Manages compliance alerts, notifications, and escalations
 */

import { v4 as uuidv4 } from 'uuid';
import {
  query,
  type DatabaseRow,
} from '../database/client.js';
import { createLogger } from '../utils/logger.js';
import type { ComplianceServiceContext } from '../types/index.js';

const logger = createLogger('alert-service');

/**
 * Alert types
 */
export type AlertType =
  | 'drift'
  | 'expiration'
  | 'new_requirement'
  | 'risk_increase'
  | 'overdue_remediation'
  | 'failed_assessment'
  | 'compliance_breach';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Alert entity
 */
export interface ComplianceAlert {
  id: string;
  tenantId: string;
  assessmentId?: string;
  controlId?: string;
  frameworkId?: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  details?: Record<string, unknown>;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  acknowledgeNotes?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  notificationsSent: { channel: string; sentAt: Date; success: boolean }[];
  lastNotificationAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create alert request
 */
export interface CreateAlertRequest {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  details?: Record<string, unknown>;
  assessmentId?: string;
  controlId?: string;
  frameworkId?: string;
}

/**
 * Alert search options
 */
export interface AlertSearchOptions {
  type?: AlertType;
  severity?: AlertSeverity;
  acknowledged?: boolean;
  resolved?: boolean;
  frameworkId?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * Alert statistics
 */
export interface AlertStats {
  total: number;
  byType: Record<AlertType, number>;
  bySeverity: Record<AlertSeverity, number>;
  unacknowledged: number;
  unresolved: number;
  createdToday: number;
  createdThisWeek: number;
  avgResolutionTimeHours: number;
}

function mapRowToAlert(row: DatabaseRow): ComplianceAlert {
  return {
    id: row['id'] as string,
    tenantId: row['tenant_id'] as string,
    assessmentId: row['assessment_id'] as string | undefined,
    controlId: row['control_id'] as string | undefined,
    frameworkId: row['framework_id'] as string | undefined,
    type: row['alert_type'] as AlertType,
    severity: row['severity'] as AlertSeverity,
    title: row['title'] as string,
    message: row['message'] as string,
    details: typeof row['details'] === 'string'
      ? JSON.parse(row['details'] as string)
      : (row['details'] as Record<string, unknown> | undefined),
    acknowledged: row['acknowledged'] as boolean,
    acknowledgedBy: row['acknowledged_by'] as string | undefined,
    acknowledgedAt: row['acknowledged_at'] ? new Date(row['acknowledged_at'] as string) : undefined,
    acknowledgeNotes: row['acknowledge_notes'] as string | undefined,
    resolved: row['resolved'] as boolean,
    resolvedBy: row['resolved_by'] as string | undefined,
    resolvedAt: row['resolved_at'] ? new Date(row['resolved_at'] as string) : undefined,
    resolutionNotes: row['resolution_notes'] as string | undefined,
    notificationsSent: typeof row['notifications_sent'] === 'string'
      ? JSON.parse(row['notifications_sent'] as string)
      : (row['notifications_sent'] as ComplianceAlert['notificationsSent'] || []),
    lastNotificationAt: row['last_notification_at']
      ? new Date(row['last_notification_at'] as string)
      : undefined,
    createdAt: new Date(row['created_at'] as string),
    updatedAt: new Date(row['updated_at'] as string),
  };
}

/**
 * Alert Service - Manages compliance alerts
 */
export class AlertService {
  /**
   * Create a new alert
   */
  async createAlert(
    context: ComplianceServiceContext,
    request: CreateAlertRequest
  ): Promise<ComplianceAlert> {
    const id = uuidv4();

    // Check for duplicate alerts in the last hour
    const duplicateCheck = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM compliance_alerts
       WHERE tenant_id = $1
         AND alert_type = $2
         AND title = $3
         AND NOT resolved
         AND created_at > NOW() - INTERVAL '1 hour'`,
      [context.tenantId, request.type, request.title]
    );

    if (parseInt(duplicateCheck.rows[0]?.count ?? '0', 10) > 0) {
      logger.debug({
        tenantId: context.tenantId,
        type: request.type,
        title: request.title
      }, 'Suppressing duplicate alert');

      // Return the existing alert instead of creating a new one
      const existingResult = await query<DatabaseRow>(
        `SELECT * FROM compliance_alerts
         WHERE tenant_id = $1
           AND alert_type = $2
           AND title = $3
           AND NOT resolved
         ORDER BY created_at DESC
         LIMIT 1`,
        [context.tenantId, request.type, request.title]
      );

      if (existingResult.rows.length > 0) {
        return mapRowToAlert(existingResult.rows[0]!);
      }
    }

    const result = await query<DatabaseRow>(
      `INSERT INTO compliance_alerts (
        id, tenant_id, assessment_id, control_id, framework_id,
        alert_type, severity, title, message, details
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        id,
        context.tenantId,
        request.assessmentId,
        request.controlId,
        request.frameworkId,
        request.type,
        request.severity,
        request.title,
        request.message,
        request.details ? JSON.stringify(request.details) : null
      ]
    );

    const alert = mapRowToAlert(result.rows[0]!);

    logger.info({
      tenantId: context.tenantId,
      alertId: id,
      type: request.type,
      severity: request.severity,
      title: request.title
    }, 'Alert created');

    // Trigger notifications for high-severity alerts
    if (request.severity === 'critical' || request.severity === 'error') {
      await this.triggerNotifications(alert);
    }

    return alert;
  }

  /**
   * Get alert by ID
   */
  async getAlert(
    tenantId: string,
    alertId: string
  ): Promise<ComplianceAlert | null> {
    const result = await query<DatabaseRow>(
      `SELECT * FROM compliance_alerts
       WHERE id = $1 AND tenant_id = $2`,
      [alertId, tenantId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapRowToAlert(result.rows[0]!);
  }

  /**
   * Search alerts
   */
  async searchAlerts(
    tenantId: string,
    options: AlertSearchOptions
  ): Promise<{ data: ComplianceAlert[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE tenant_id = $1';
    const queryParams: unknown[] = [tenantId];
    let paramIndex = 2;

    if (options.type) {
      whereClause += ` AND alert_type = $${paramIndex}`;
      queryParams.push(options.type);
      paramIndex++;
    }

    if (options.severity) {
      whereClause += ` AND severity = $${paramIndex}`;
      queryParams.push(options.severity);
      paramIndex++;
    }

    if (options.acknowledged !== undefined) {
      whereClause += ` AND acknowledged = $${paramIndex}`;
      queryParams.push(options.acknowledged);
      paramIndex++;
    }

    if (options.resolved !== undefined) {
      whereClause += ` AND resolved = $${paramIndex}`;
      queryParams.push(options.resolved);
      paramIndex++;
    }

    if (options.frameworkId) {
      whereClause += ` AND framework_id = $${paramIndex}`;
      queryParams.push(options.frameworkId);
      paramIndex++;
    }

    if (options.fromDate) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      queryParams.push(options.fromDate);
      paramIndex++;
    }

    if (options.toDate) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      queryParams.push(options.toDate);
      paramIndex++;
    }

    // Count total
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM compliance_alerts ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    // Get alerts
    const result = await query<DatabaseRow>(
      `SELECT * FROM compliance_alerts
       ${whereClause}
       ORDER BY
         CASE severity
           WHEN 'critical' THEN 1
           WHEN 'error' THEN 2
           WHEN 'warning' THEN 3
           WHEN 'info' THEN 4
         END,
         created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    return {
      data: result.rows.map(mapRowToAlert),
      total,
      page,
      limit
    };
  }

  /**
   * Get active (unresolved) alerts
   */
  async getActiveAlerts(
    tenantId: string,
    limit: number = 50
  ): Promise<ComplianceAlert[]> {
    const result = await query<DatabaseRow>(
      `SELECT * FROM compliance_alerts
       WHERE tenant_id = $1 AND NOT resolved
       ORDER BY
         CASE severity
           WHEN 'critical' THEN 1
           WHEN 'error' THEN 2
           WHEN 'warning' THEN 3
           WHEN 'info' THEN 4
         END,
         created_at DESC
       LIMIT $2`,
      [tenantId, limit]
    );

    return result.rows.map(mapRowToAlert);
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    context: ComplianceServiceContext,
    alertId: string,
    notes?: string
  ): Promise<ComplianceAlert> {
    const result = await query<DatabaseRow>(
      `UPDATE compliance_alerts
       SET acknowledged = true,
           acknowledged_by = $1,
           acknowledged_at = NOW(),
           acknowledge_notes = $2,
           updated_at = NOW()
       WHERE id = $3 AND tenant_id = $4
       RETURNING *`,
      [context.userId, notes, alertId, context.tenantId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    const alert = mapRowToAlert(result.rows[0]!);

    logger.info({
      tenantId: context.tenantId,
      alertId,
      acknowledgedBy: context.userId
    }, 'Alert acknowledged');

    return alert;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(
    context: ComplianceServiceContext,
    alertId: string,
    resolutionNotes?: string
  ): Promise<ComplianceAlert> {
    const result = await query<DatabaseRow>(
      `UPDATE compliance_alerts
       SET resolved = true,
           resolved_by = $1,
           resolved_at = NOW(),
           resolution_notes = $2,
           acknowledged = COALESCE(acknowledged, true),
           acknowledged_by = COALESCE(acknowledged_by, $1),
           acknowledged_at = COALESCE(acknowledged_at, NOW()),
           updated_at = NOW()
       WHERE id = $3 AND tenant_id = $4
       RETURNING *`,
      [context.userId, resolutionNotes, alertId, context.tenantId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    const alert = mapRowToAlert(result.rows[0]!);

    logger.info({
      tenantId: context.tenantId,
      alertId,
      resolvedBy: context.userId
    }, 'Alert resolved');

    return alert;
  }

  /**
   * Bulk acknowledge alerts
   */
  async bulkAcknowledge(
    context: ComplianceServiceContext,
    alertIds: string[],
    notes?: string
  ): Promise<number> {
    const result = await query(
      `UPDATE compliance_alerts
       SET acknowledged = true,
           acknowledged_by = $1,
           acknowledged_at = NOW(),
           acknowledge_notes = $2,
           updated_at = NOW()
       WHERE id = ANY($3) AND tenant_id = $4 AND NOT acknowledged`,
      [context.userId, notes, alertIds, context.tenantId]
    );

    const count = result.rowCount ?? 0;

    logger.info({
      tenantId: context.tenantId,
      acknowledgedCount: count,
      acknowledgedBy: context.userId
    }, 'Alerts bulk acknowledged');

    return count;
  }

  /**
   * Bulk resolve alerts
   */
  async bulkResolve(
    context: ComplianceServiceContext,
    alertIds: string[],
    resolutionNotes?: string
  ): Promise<number> {
    const result = await query(
      `UPDATE compliance_alerts
       SET resolved = true,
           resolved_by = $1,
           resolved_at = NOW(),
           resolution_notes = $2,
           acknowledged = COALESCE(acknowledged, true),
           acknowledged_by = COALESCE(acknowledged_by, $1),
           acknowledged_at = COALESCE(acknowledged_at, NOW()),
           updated_at = NOW()
       WHERE id = ANY($3) AND tenant_id = $4 AND NOT resolved`,
      [context.userId, resolutionNotes, alertIds, context.tenantId]
    );

    const count = result.rowCount ?? 0;

    logger.info({
      tenantId: context.tenantId,
      resolvedCount: count,
      resolvedBy: context.userId
    }, 'Alerts bulk resolved');

    return count;
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(tenantId: string): Promise<AlertStats> {
    const [
      totalResult,
      typeResult,
      severityResult,
      statusResult,
      recentResult,
      resolutionTimeResult
    ] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM compliance_alerts WHERE tenant_id = $1`,
        [tenantId]
      ),
      query<{ alert_type: string; count: string }>(
        `SELECT alert_type, COUNT(*) as count FROM compliance_alerts
         WHERE tenant_id = $1 GROUP BY alert_type`,
        [tenantId]
      ),
      query<{ severity: string; count: string }>(
        `SELECT severity, COUNT(*) as count FROM compliance_alerts
         WHERE tenant_id = $1 GROUP BY severity`,
        [tenantId]
      ),
      query<{ unacknowledged: string; unresolved: string }>(
        `SELECT
          COUNT(*) FILTER (WHERE NOT acknowledged) as unacknowledged,
          COUNT(*) FILTER (WHERE NOT resolved) as unresolved
         FROM compliance_alerts
         WHERE tenant_id = $1`,
        [tenantId]
      ),
      query<{ today: string; week: string }>(
        `SELECT
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week
         FROM compliance_alerts
         WHERE tenant_id = $1`,
        [tenantId]
      ),
      query<{ avg_hours: string }>(
        `SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as avg_hours
         FROM compliance_alerts
         WHERE tenant_id = $1 AND resolved = true AND resolved_at IS NOT NULL`,
        [tenantId]
      )
    ]);

    const byType: Record<string, number> = {};
    for (const row of typeResult.rows) {
      byType[row.alert_type] = parseInt(row.count, 10);
    }

    const bySeverity: Record<string, number> = {};
    for (const row of severityResult.rows) {
      bySeverity[row.severity] = parseInt(row.count, 10);
    }

    return {
      total: parseInt(totalResult.rows[0]?.count ?? '0', 10),
      byType: byType as Record<AlertType, number>,
      bySeverity: bySeverity as Record<AlertSeverity, number>,
      unacknowledged: parseInt(statusResult.rows[0]?.unacknowledged ?? '0', 10),
      unresolved: parseInt(statusResult.rows[0]?.unresolved ?? '0', 10),
      createdToday: parseInt(recentResult.rows[0]?.today ?? '0', 10),
      createdThisWeek: parseInt(recentResult.rows[0]?.week ?? '0', 10),
      avgResolutionTimeHours: parseFloat(resolutionTimeResult.rows[0]?.avg_hours ?? '0')
    };
  }

  /**
   * Delete old resolved alerts
   */
  async cleanupOldAlerts(tenantId: string, daysOld: number = 90): Promise<number> {
    const result = await query(
      `DELETE FROM compliance_alerts
       WHERE tenant_id = $1
         AND resolved = true
         AND resolved_at < NOW() - INTERVAL '${daysOld} days'`,
      [tenantId]
    );

    const count = result.rowCount ?? 0;

    if (count > 0) {
      logger.info({
        tenantId,
        deletedCount: count,
        daysOld
      }, 'Old alerts cleaned up');
    }

    return count;
  }

  /**
   * Trigger notifications for an alert
   */
  private async triggerNotifications(alert: ComplianceAlert): Promise<void> {
    // This is a placeholder for notification integration
    // In production, this would integrate with:
    // - Email notifications
    // - Slack/Teams webhooks
    // - SMS for critical alerts
    // - PagerDuty/Opsgenie for on-call escalation

    const notifications: { channel: string; sentAt: Date; success: boolean }[] = [];

    // Log notification attempt
    logger.info({
      alertId: alert.id,
      severity: alert.severity,
      type: alert.type
    }, 'Triggering alert notifications');

    // Simulate notification channels
    const channels = ['email', 'webhook'];
    if (alert.severity === 'critical') {
      channels.push('sms', 'pagerduty');
    }

    for (const channel of channels) {
      try {
        // In production, this would call the actual notification service
        // await notificationService.send(channel, alert);

        notifications.push({
          channel,
          sentAt: new Date(),
          success: true
        });

        logger.debug({
          alertId: alert.id,
          channel
        }, 'Notification sent');
      } catch (error) {
        notifications.push({
          channel,
          sentAt: new Date(),
          success: false
        });

        logger.error({
          alertId: alert.id,
          channel,
          error: error instanceof Error ? error.message : 'Unknown error'
        }, 'Notification failed');
      }
    }

    // Update alert with notification status
    await query(
      `UPDATE compliance_alerts
       SET notifications_sent = $1,
           last_notification_at = NOW(),
           updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(notifications), alert.id]
    );
  }

  /**
   * Get alert escalation status
   */
  async getEscalationStatus(
    tenantId: string
  ): Promise<{
    criticalUnacknowledged: number;
    criticalOlderThan1Hour: number;
    errorOlderThan24Hours: number;
    escalationRequired: boolean;
  }> {
    const result = await query<{
      critical_unack: string;
      critical_old: string;
      error_old: string;
    }>(
      `SELECT
        COUNT(*) FILTER (WHERE severity = 'critical' AND NOT acknowledged) as critical_unack,
        COUNT(*) FILTER (
          WHERE severity = 'critical'
            AND NOT acknowledged
            AND created_at < NOW() - INTERVAL '1 hour'
        ) as critical_old,
        COUNT(*) FILTER (
          WHERE severity = 'error'
            AND NOT acknowledged
            AND created_at < NOW() - INTERVAL '24 hours'
        ) as error_old
       FROM compliance_alerts
       WHERE tenant_id = $1 AND NOT resolved`,
      [tenantId]
    );

    const row = result.rows[0] || { critical_unack: '0', critical_old: '0', error_old: '0' };

    const criticalUnacknowledged = parseInt(row.critical_unack, 10);
    const criticalOlderThan1Hour = parseInt(row.critical_old, 10);
    const errorOlderThan24Hours = parseInt(row.error_old, 10);

    return {
      criticalUnacknowledged,
      criticalOlderThan1Hour,
      errorOlderThan24Hours,
      escalationRequired: criticalOlderThan1Hour > 0 || errorOlderThan24Hours > 0
    };
  }
}

export const alertService = new AlertService();
