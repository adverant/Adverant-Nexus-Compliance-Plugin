/**
 * Nexus Compliance Engine - Monitoring and Alerts API Routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { monitoringService } from '../../services/monitoring-service.js';
import { alertService } from '../../services/alert-service.js';
import { complianceScheduler } from '../../jobs/compliance-scheduler.js';
import {
  getContext,
  handleRouteError,
  sendSuccess,
  sendCreated,
  sendNotFound,
} from '../middleware/index.js';

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
    const ctx = getContext(request);

    try {
      const health = await monitoringService.getMonitoringHealth(ctx.tenantId);

      return sendSuccess(reply, health);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'get monitoring health', tenantId: ctx.tenantId });
    }
  });

  /**
   * POST /api/v1/compliance/monitoring/baseline
   * Capture a baseline from an assessment
   */
  fastify.post<{
    Body: { assessmentId: string; notes?: string };
  }>('/monitoring/baseline', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { assessmentId, notes } = request.body;

    try {
      if (!assessmentId) {
        return reply.status(400).send({
          success: false,
          error: 'assessmentId is required'
        });
      }

      const baseline = await monitoringService.captureBaseline(
        ctx,
        assessmentId,
        notes
      );

      return sendCreated(reply, baseline);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'capture baseline', tenantId: ctx.tenantId });
    }
  });

  /**
   * GET /api/v1/compliance/monitoring/baselines
   * List baselines
   */
  fastify.get<{
    Querystring: { frameworkId?: string; limit?: string };
  }>('/monitoring/baselines', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { frameworkId, limit } = request.query;

    try {
      const baselines = await monitoringService.listBaselines(
        ctx.tenantId,
        frameworkId,
        limit ? parseInt(limit, 10) : 10
      );

      return reply.status(200).send({
        success: true,
        data: baselines,
        count: baselines.length
      });
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'list baselines', tenantId: ctx.tenantId });
    }
  });

  /**
   * GET /api/v1/compliance/monitoring/baseline/:frameworkId
   * Get latest baseline for a framework
   */
  fastify.get<{
    Params: { frameworkId: string };
  }>('/monitoring/baseline/:frameworkId', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { frameworkId } = request.params;

    try {
      const baseline = await monitoringService.getLatestBaseline(
        ctx.tenantId,
        frameworkId
      );

      if (!baseline) {
        return sendNotFound(reply, 'Baseline', frameworkId);
      }

      return sendSuccess(reply, baseline);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'get baseline', tenantId: ctx.tenantId });
    }
  });

  /**
   * POST /api/v1/compliance/monitoring/drift-check
   * Detect drift from baseline
   */
  fastify.post<{
    Body: { frameworkId: string; assessmentId: string };
  }>('/monitoring/drift-check', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { frameworkId, assessmentId } = request.body;

    try {
      if (!frameworkId || !assessmentId) {
        return reply.status(400).send({
          success: false,
          error: 'frameworkId and assessmentId are required'
        });
      }

      const drifts = await monitoringService.detectDrift(
        ctx.tenantId,
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
      return handleRouteError(error, reply, { operation: 'detect drift', tenantId: ctx.tenantId });
    }
  });

  /**
   * POST /api/v1/compliance/monitoring/run-check
   * Run a scheduled compliance check
   */
  fastify.post<{
    Body: { frameworkId: string };
  }>('/monitoring/run-check', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { frameworkId } = request.body;

    try {
      if (!frameworkId) {
        return reply.status(400).send({
          success: false,
          error: 'frameworkId is required'
        });
      }

      const result = await monitoringService.runScheduledCheck(
        ctx.tenantId,
        frameworkId
      );

      return sendSuccess(reply, result);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'run compliance check', tenantId: ctx.tenantId });
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
    const ctx = getContext(request);
    const { frameworkId } = request.params;
    const days = parseInt(request.query.days || '90', 10);

    try {
      const trend = await monitoringService.getComplianceTrend(
        ctx.tenantId,
        frameworkId,
        days
      );

      return reply.status(200).send({
        success: true,
        data: trend,
        count: trend.length
      });
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'get compliance trend', tenantId: ctx.tenantId });
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
    const ctx = getContext(request);

    try {
      const body = createAlertSchema.parse(request.body);

      const alert = await alertService.createAlert(ctx, body);

      return sendCreated(reply, alert);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'create alert', tenantId: ctx.tenantId });
    }
  });

  /**
   * GET /api/v1/compliance/alerts
   * Search alerts
   */
  fastify.get<{
    Querystring: Record<string, string>;
  }>('/alerts', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);

    try {
      const params = alertSearchSchema.parse(request.query);

      const result = await alertService.searchAlerts(ctx.tenantId, {
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
      return handleRouteError(error, reply, { operation: 'search alerts', tenantId: ctx.tenantId });
    }
  });

  /**
   * GET /api/v1/compliance/alerts/active
   * Get active (unresolved) alerts
   */
  fastify.get<{
    Querystring: { limit?: string };
  }>('/alerts/active', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const limit = parseInt(request.query.limit || '50', 10);

    try {
      const alerts = await alertService.getActiveAlerts(ctx.tenantId, limit);

      return reply.status(200).send({
        success: true,
        data: alerts,
        count: alerts.length
      });
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'get active alerts', tenantId: ctx.tenantId });
    }
  });

  /**
   * GET /api/v1/compliance/alerts/stats
   * Get alert statistics
   */
  fastify.get('/alerts/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const ctx = getContext(request);

    try {
      const stats = await alertService.getAlertStats(ctx.tenantId);

      return sendSuccess(reply, stats);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'get alert statistics', tenantId: ctx.tenantId });
    }
  });

  /**
   * GET /api/v1/compliance/alerts/escalation
   * Get alert escalation status
   */
  fastify.get('/alerts/escalation', async (request: FastifyRequest, reply: FastifyReply) => {
    const ctx = getContext(request);

    try {
      const status = await alertService.getEscalationStatus(ctx.tenantId);

      return sendSuccess(reply, status);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'get escalation status', tenantId: ctx.tenantId });
    }
  });

  /**
   * GET /api/v1/compliance/alerts/:alertId
   * Get alert by ID
   */
  fastify.get<{
    Params: { alertId: string };
  }>('/alerts/:alertId', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { alertId } = request.params;

    try {
      const alert = await alertService.getAlert(ctx.tenantId, alertId);

      if (!alert) {
        return sendNotFound(reply, 'Alert', alertId);
      }

      return sendSuccess(reply, alert);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'get alert', tenantId: ctx.tenantId });
    }
  });

  /**
   * PATCH /api/v1/compliance/alerts/:alertId/acknowledge
   * Acknowledge an alert
   */
  fastify.patch<{
    Params: { alertId: string };
  }>('/alerts/:alertId/acknowledge', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { alertId } = request.params;
    const body = request.body as { notes?: string };

    try {
      const alert = await alertService.acknowledgeAlert(
        ctx,
        alertId,
        body.notes
      );

      return sendSuccess(reply, alert);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'acknowledge alert', tenantId: ctx.tenantId });
    }
  });

  /**
   * PATCH /api/v1/compliance/alerts/:alertId/resolve
   * Resolve an alert
   */
  fastify.patch<{
    Params: { alertId: string };
  }>('/alerts/:alertId/resolve', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { alertId } = request.params;
    const body = request.body as { resolutionNotes?: string };

    try {
      const alert = await alertService.resolveAlert(
        ctx,
        alertId,
        body.resolutionNotes
      );

      return sendSuccess(reply, alert);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'resolve alert', tenantId: ctx.tenantId });
    }
  });

  /**
   * POST /api/v1/compliance/alerts/bulk-acknowledge
   * Bulk acknowledge alerts
   */
  fastify.post('/alerts/bulk-acknowledge', async (request: FastifyRequest, reply: FastifyReply) => {
    const ctx = getContext(request);
    const body = request.body as { alertIds?: string[]; notes?: string };

    try {
      if (!body.alertIds || !Array.isArray(body.alertIds) || body.alertIds.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'alertIds array is required'
        });
      }

      const count = await alertService.bulkAcknowledge(
        ctx,
        body.alertIds,
        body.notes
      );

      return reply.status(200).send({
        success: true,
        message: `Acknowledged ${count} alerts`
      });
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'bulk acknowledge alerts', tenantId: ctx.tenantId });
    }
  });

  /**
   * POST /api/v1/compliance/alerts/bulk-resolve
   * Bulk resolve alerts
   */
  fastify.post('/alerts/bulk-resolve', async (request: FastifyRequest, reply: FastifyReply) => {
    const ctx = getContext(request);
    const body = request.body as { alertIds?: string[]; resolutionNotes?: string };

    try {
      if (!body.alertIds || !Array.isArray(body.alertIds) || body.alertIds.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'alertIds array is required'
        });
      }

      const count = await alertService.bulkResolve(
        ctx,
        body.alertIds,
        body.resolutionNotes
      );

      return reply.status(200).send({
        success: true,
        message: `Resolved ${count} alerts`
      });
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'bulk resolve alerts', tenantId: ctx.tenantId });
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

      return sendSuccess(reply, status);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'get scheduler status' });
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

      return sendSuccess(reply, result);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'trigger job' });
    }
  });

  /**
   * POST /api/v1/compliance/scheduler/run-all
   * Run all scheduled checks immediately
   */
  fastify.post('/scheduler/run-all', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const results = await complianceScheduler.runAllChecks();

      return sendSuccess(reply, results);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'run all checks' });
    }
  });
}
