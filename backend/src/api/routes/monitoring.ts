/**
 * Nexus Compliance Engine - Monitoring and Alerts API Routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createLogger } from '../../utils/logger.js';
import { monitoringService } from '../../services/monitoring-service.js';
import { alertService } from '../../services/alert-service.js';
import { complianceScheduler } from '../../jobs/compliance-scheduler.js';
import type { ComplianceServiceContext } from '../../types/index.js';

const logger = createLogger('monitoring-routes');

function getContext(request: FastifyRequest): ComplianceServiceContext {
  const tenantId = (request.headers['x-tenant-id'] as string) ||
    (request.headers['x-user-id'] as string) ||
    'default';
  const userId = (request.headers['x-user-id'] as string) || 'system';
  const requestId = (request.headers['x-request-id'] as string) || request.id;

  return { tenantId, userId, requestId };
}

const createAlertSchema = z.object({
  type: z.enum(['drift', 'expiration', 'new_requirement', 'risk_increase', 'overdue_remediation', 'failed_assessment', 'compliance_breach']),
  severity: z.enum(['info', 'warning', 'error', 'critical']),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  details: z.record(z.unknown()).optional(),
  assessmentId: z.string().uuid().optional(),
  controlId: z.string().optional(),
  frameworkId: z.string().optional()
});

const alertSearchSchema = z.object({
  type: z.enum(['drift', 'expiration', 'new_requirement', 'risk_increase', 'overdue_remediation', 'failed_assessment', 'compliance_breach']).optional(),
  severity: z.enum(['info', 'warning', 'error', 'critical']).optional(),
  acknowledged: z.coerce.boolean().optional(),
  resolved: z.coerce.boolean().optional(),
  frameworkId: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50)
});

export async function monitoringRoutes(fastify: FastifyInstance): Promise<void> {
  // ============================================================================
  // MONITORING ENDPOINTS
  // ============================================================================

  /**
   * GET /api/v1/compliance/monitoring/health
   * Get monitoring health status
   */
  fastify.get('/monitoring/health', async (request: FastifyRequest, reply: FastifyReply) => {
    const context = getContext(request);

    try {
      const health = await monitoringService.getMonitoringHealth(context.tenantId);

      return reply.status(200).send({
        success: true,
        data: health
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId }, 'Failed to get monitoring health');
      return reply.status(500).send({
        success: false,
        error: 'Failed to get monitoring health'
      });
    }
  });

  /**
   * POST /api/v1/compliance/monitoring/baseline
   * Capture a baseline from an assessment
   */
  fastify.post<{
    Body: { assessmentId: string; notes?: string };
  }>('/monitoring/baseline', async (request, reply: FastifyReply) => {
    const context = getContext(request);
    const { assessmentId, notes } = request.body;

    try {
      if (!assessmentId) {
        return reply.status(400).send({
          success: false,
          error: 'assessmentId is required'
        });
      }

      const baseline = await monitoringService.captureBaseline(
        context,
        assessmentId,
        notes
      );

      return reply.status(201).send({
        success: true,
        data: baseline
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId, assessmentId }, 'Failed to capture baseline');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to capture baseline'
      });
    }
  });

  /**
   * GET /api/v1/compliance/monitoring/baselines
   * List baselines
   */
  fastify.get<{
    Querystring: { frameworkId?: string; limit?: string };
  }>('/monitoring/baselines', async (request, reply: FastifyReply) => {
    const context = getContext(request);
    const { frameworkId, limit } = request.query;

    try {
      const baselines = await monitoringService.listBaselines(
        context.tenantId,
        frameworkId,
        limit ? parseInt(limit, 10) : 10
      );

      return reply.status(200).send({
        success: true,
        data: baselines,
        count: baselines.length
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId }, 'Failed to list baselines');
      return reply.status(500).send({
        success: false,
        error: 'Failed to list baselines'
      });
    }
  });

  /**
   * GET /api/v1/compliance/monitoring/baseline/:frameworkId
   * Get latest baseline for a framework
   */
  fastify.get<{
    Params: { frameworkId: string };
  }>('/monitoring/baseline/:frameworkId', async (request, reply: FastifyReply) => {
    const context = getContext(request);
    const { frameworkId } = request.params;

    try {
      const baseline = await monitoringService.getLatestBaseline(
        context.tenantId,
        frameworkId
      );

      if (!baseline) {
        return reply.status(404).send({
          success: false,
          error: `No baseline found for framework: ${frameworkId}`
        });
      }

      return reply.status(200).send({
        success: true,
        data: baseline
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId, frameworkId }, 'Failed to get baseline');
      return reply.status(500).send({
        success: false,
        error: 'Failed to get baseline'
      });
    }
  });

  /**
   * POST /api/v1/compliance/monitoring/drift-check
   * Detect drift from baseline
   */
  fastify.post<{
    Body: { frameworkId: string; assessmentId: string };
  }>('/monitoring/drift-check', async (request, reply: FastifyReply) => {
    const context = getContext(request);
    const { frameworkId, assessmentId } = request.body;

    try {
      if (!frameworkId || !assessmentId) {
        return reply.status(400).send({
          success: false,
          error: 'frameworkId and assessmentId are required'
        });
      }

      const drifts = await monitoringService.detectDrift(
        context.tenantId,
        frameworkId,
        assessmentId
      );

      return reply.status(200).send({
        success: true,
        data: drifts,
        count: drifts.length,
        hasDrift: drifts.length > 0
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId, frameworkId }, 'Failed to detect drift');
      return reply.status(500).send({
        success: false,
        error: 'Failed to detect drift'
      });
    }
  });

  /**
   * POST /api/v1/compliance/monitoring/run-check
   * Run a scheduled compliance check
   */
  fastify.post<{
    Body: { frameworkId: string };
  }>('/monitoring/run-check', async (request, reply: FastifyReply) => {
    const context = getContext(request);
    const { frameworkId } = request.body;

    try {
      if (!frameworkId) {
        return reply.status(400).send({
          success: false,
          error: 'frameworkId is required'
        });
      }

      const result = await monitoringService.runScheduledCheck(
        context.tenantId,
        frameworkId
      );

      return reply.status(200).send({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId, frameworkId }, 'Failed to run check');
      return reply.status(500).send({
        success: false,
        error: 'Failed to run compliance check'
      });
    }
  });

  /**
   * GET /api/v1/compliance/monitoring/trend/:frameworkId
   * Get compliance trend over time
   */
  fastify.get<{
    Params: { frameworkId: string };
    Querystring: { days?: string };
  }>('/monitoring/trend/:frameworkId', async (request, reply: FastifyReply) => {
    const context = getContext(request);
    const { frameworkId } = request.params;
    const days = parseInt(request.query.days || '90', 10);

    try {
      const trend = await monitoringService.getComplianceTrend(
        context.tenantId,
        frameworkId,
        days
      );

      return reply.status(200).send({
        success: true,
        data: trend,
        count: trend.length
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId, frameworkId }, 'Failed to get trend');
      return reply.status(500).send({
        success: false,
        error: 'Failed to get compliance trend'
      });
    }
  });

  // ============================================================================
  // ALERT ENDPOINTS
  // ============================================================================

  /**
   * POST /api/v1/compliance/alerts
   * Create a new alert
   */
  fastify.post('/alerts', async (request: FastifyRequest, reply: FastifyReply) => {
    const context = getContext(request);

    try {
      const body = createAlertSchema.parse(request.body);

      const alert = await alertService.createAlert(context, body);

      return reply.status(201).send({
        success: true,
        data: alert
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      }

      logger.error({ err: error, tenantId: context.tenantId }, 'Failed to create alert');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create alert'
      });
    }
  });

  /**
   * GET /api/v1/compliance/alerts
   * Search alerts
   */
  fastify.get<{
    Querystring: Record<string, string>;
  }>('/alerts', async (request, reply: FastifyReply) => {
    const context = getContext(request);

    try {
      const params = alertSearchSchema.parse(request.query);

      const result = await alertService.searchAlerts(context.tenantId, {
        ...params,
        fromDate: params.fromDate ? new Date(params.fromDate) : undefined,
        toDate: params.toDate ? new Date(params.toDate) : undefined
      });

      return reply.status(200).send({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit)
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      }

      logger.error({ err: error, tenantId: context.tenantId }, 'Failed to search alerts');
      return reply.status(500).send({
        success: false,
        error: 'Failed to search alerts'
      });
    }
  });

  /**
   * GET /api/v1/compliance/alerts/active
   * Get active (unresolved) alerts
   */
  fastify.get<{
    Querystring: { limit?: string };
  }>('/alerts/active', async (request, reply: FastifyReply) => {
    const context = getContext(request);
    const limit = parseInt(request.query.limit || '50', 10);

    try {
      const alerts = await alertService.getActiveAlerts(context.tenantId, limit);

      return reply.status(200).send({
        success: true,
        data: alerts,
        count: alerts.length
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId }, 'Failed to get active alerts');
      return reply.status(500).send({
        success: false,
        error: 'Failed to get active alerts'
      });
    }
  });

  /**
   * GET /api/v1/compliance/alerts/stats
   * Get alert statistics
   */
  fastify.get('/alerts/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const context = getContext(request);

    try {
      const stats = await alertService.getAlertStats(context.tenantId);

      return reply.status(200).send({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId }, 'Failed to get alert stats');
      return reply.status(500).send({
        success: false,
        error: 'Failed to get alert statistics'
      });
    }
  });

  /**
   * GET /api/v1/compliance/alerts/escalation
   * Get alert escalation status
   */
  fastify.get('/alerts/escalation', async (request: FastifyRequest, reply: FastifyReply) => {
    const context = getContext(request);

    try {
      const status = await alertService.getEscalationStatus(context.tenantId);

      return reply.status(200).send({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId }, 'Failed to get escalation status');
      return reply.status(500).send({
        success: false,
        error: 'Failed to get escalation status'
      });
    }
  });

  /**
   * GET /api/v1/compliance/alerts/:alertId
   * Get alert by ID
   */
  fastify.get<{
    Params: { alertId: string };
  }>('/alerts/:alertId', async (request, reply: FastifyReply) => {
    const context = getContext(request);
    const { alertId } = request.params;

    try {
      const alert = await alertService.getAlert(context.tenantId, alertId);

      if (!alert) {
        return reply.status(404).send({
          success: false,
          error: `Alert not found: ${alertId}`
        });
      }

      return reply.status(200).send({
        success: true,
        data: alert
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId, alertId }, 'Failed to get alert');
      return reply.status(500).send({
        success: false,
        error: 'Failed to get alert'
      });
    }
  });

  /**
   * PATCH /api/v1/compliance/alerts/:alertId/acknowledge
   * Acknowledge an alert
   */
  fastify.patch<{
    Params: { alertId: string };
  }>('/alerts/:alertId/acknowledge', async (request, reply: FastifyReply) => {
    const context = getContext(request);
    const { alertId } = request.params;
    const body = request.body as { notes?: string };

    try {
      const alert = await alertService.acknowledgeAlert(
        context,
        alertId,
        body.notes
      );

      return reply.status(200).send({
        success: true,
        data: alert
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId, alertId }, 'Failed to acknowledge alert');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to acknowledge alert'
      });
    }
  });

  /**
   * PATCH /api/v1/compliance/alerts/:alertId/resolve
   * Resolve an alert
   */
  fastify.patch<{
    Params: { alertId: string };
  }>('/alerts/:alertId/resolve', async (request, reply: FastifyReply) => {
    const context = getContext(request);
    const { alertId } = request.params;
    const body = request.body as { resolutionNotes?: string };

    try {
      const alert = await alertService.resolveAlert(
        context,
        alertId,
        body.resolutionNotes
      );

      return reply.status(200).send({
        success: true,
        data: alert
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId, alertId }, 'Failed to resolve alert');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resolve alert'
      });
    }
  });

  /**
   * POST /api/v1/compliance/alerts/bulk-acknowledge
   * Bulk acknowledge alerts
   */
  fastify.post('/alerts/bulk-acknowledge', async (request: FastifyRequest, reply: FastifyReply) => {
    const context = getContext(request);
    const body = request.body as { alertIds?: string[]; notes?: string };

    try {
      if (!body.alertIds || !Array.isArray(body.alertIds) || body.alertIds.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'alertIds array is required'
        });
      }

      const count = await alertService.bulkAcknowledge(
        context,
        body.alertIds,
        body.notes
      );

      return reply.status(200).send({
        success: true,
        message: `Acknowledged ${count} alerts`
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId }, 'Failed to bulk acknowledge');
      return reply.status(500).send({
        success: false,
        error: 'Failed to bulk acknowledge alerts'
      });
    }
  });

  /**
   * POST /api/v1/compliance/alerts/bulk-resolve
   * Bulk resolve alerts
   */
  fastify.post('/alerts/bulk-resolve', async (request: FastifyRequest, reply: FastifyReply) => {
    const context = getContext(request);
    const body = request.body as { alertIds?: string[]; resolutionNotes?: string };

    try {
      if (!body.alertIds || !Array.isArray(body.alertIds) || body.alertIds.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'alertIds array is required'
        });
      }

      const count = await alertService.bulkResolve(
        context,
        body.alertIds,
        body.resolutionNotes
      );

      return reply.status(200).send({
        success: true,
        message: `Resolved ${count} alerts`
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId }, 'Failed to bulk resolve');
      return reply.status(500).send({
        success: false,
        error: 'Failed to bulk resolve alerts'
      });
    }
  });

  // ============================================================================
  // SCHEDULER ENDPOINTS
  // ============================================================================

  /**
   * GET /api/v1/compliance/scheduler/status
   * Get scheduler status
   */
  fastify.get('/scheduler/status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const status = complianceScheduler.getStatus();

      return reply.status(200).send({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to get scheduler status');
      return reply.status(500).send({
        success: false,
        error: 'Failed to get scheduler status'
      });
    }
  });

  /**
   * POST /api/v1/compliance/scheduler/trigger/:jobId
   * Manually trigger a scheduled job
   */
  fastify.post<{
    Params: { jobId: string };
  }>('/scheduler/trigger/:jobId', async (request, reply: FastifyReply) => {
    const { jobId } = request.params;

    try {
      const result = await complianceScheduler.triggerJob(jobId);

      return reply.status(200).send({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error({ err: error, jobId }, 'Failed to trigger job');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to trigger job'
      });
    }
  });

  /**
   * POST /api/v1/compliance/scheduler/run-all
   * Run all scheduled checks immediately
   */
  fastify.post('/scheduler/run-all', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const results = await complianceScheduler.runAllChecks();

      return reply.status(200).send({
        success: true,
        data: results
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to run all checks');
      return reply.status(500).send({
        success: false,
        error: 'Failed to run all checks'
      });
    }
  });
}
