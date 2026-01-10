/**
 * Nexus Compliance Engine - Assessment API Routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { assessmentService } from '../../services/assessment-service.js';
import { reportService } from '../../services/report-service.js';
import { createLogger } from '../../utils/logger.js';
import {
  getContext,
  handleRouteError,
  sendSuccess,
  sendCreated,
  sendNotFound,
} from '../middleware/index.js';

const logger = createLogger('assessment-routes');

const createAssessmentSchema = z.object({
  frameworkId: z.string().min(1),
  targetSystemId: z.string().min(1),
  targetSystemName: z.string().min(1),
  targetSystemDescription: z.string().optional(),
  scope: z.array(z.string()).optional(),
  excludedControls: z.array(z.string()).optional(),
});

const runAssessmentSchema = z.object({
  useAI: z.boolean().default(true),
  aiModel: z.string().optional(),
  includeRecommendations: z.boolean().default(true),
});

const listQuerySchema = z.object({
  frameworkId: z.string().optional(),
  targetSystemId: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const findingsQuerySchema = z.object({
  status: z.enum(['compliant', 'non_compliant', 'partial', 'not_applicable', 'not_assessed']).optional(),
  severity: z.enum(['critical', 'major', 'minor', 'observation']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

const generateReportSchema = z.object({
  assessmentId: z.string().optional(),
  reportType: z.enum(['executive_summary', 'full_audit', 'gap_analysis', 'remediation_plan', 'board_presentation']),
  format: z.enum(['pdf', 'html', 'markdown', 'json']),
  includeEvidence: z.boolean().default(false),
  includeRemediation: z.boolean().default(true),
  recipientEmail: z.string().email().optional(),
});

export async function assessmentRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /api/v1/compliance/assessments
   * Create a new compliance assessment
   */
  fastify.post('/assessments', async (request: FastifyRequest, reply: FastifyReply) => {
    const ctx = getContext(request);

    try {
      const body = createAssessmentSchema.parse(request.body);

      const assessment = await assessmentService.createAssessment(ctx, body);

      return sendCreated(reply, assessment);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'create assessment', tenantId: ctx.tenantId });
    }
  });

  /**
   * GET /api/v1/compliance/assessments
   * List assessments for tenant
   */
  fastify.get<{
    Querystring: {
      frameworkId?: string;
      targetSystemId?: string;
      status?: string;
      page?: string;
      limit?: string;
      sortBy?: string;
      sortOrder?: string;
    };
  }>('/assessments', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);

    try {
      const params = listQuerySchema.parse(request.query);

      const result = await assessmentService.listAssessments(ctx.tenantId, params);

      return sendSuccess(reply, result);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'list assessments', tenantId: ctx.tenantId });
    }
  });

  /**
   * GET /api/v1/compliance/assessments/:assessmentId
   * Get assessment details
   */
  fastify.get<{
    Params: { assessmentId: string };
  }>('/assessments/:assessmentId', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { assessmentId } = request.params;

    try {
      const assessment = await assessmentService.getAssessment(
        ctx.tenantId,
        assessmentId
      );

      if (!assessment) {
        return sendNotFound(reply, 'Assessment', assessmentId);
      }

      return sendSuccess(reply, assessment);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'get assessment', tenantId: ctx.tenantId });
    }
  });

  /**
   * POST /api/v1/compliance/assessments/:assessmentId/run
   * Execute a compliance assessment
   */
  fastify.post<{
    Params: { assessmentId: string };
  }>('/assessments/:assessmentId/run', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { assessmentId } = request.params;

    try {
      const body = runAssessmentSchema.parse(request.body ?? {});

      const assessment = await assessmentService.runAssessment(
        ctx,
        assessmentId,
        body
      );

      return sendSuccess(reply, assessment);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'run assessment', tenantId: ctx.tenantId });
    }
  });

  /**
   * GET /api/v1/compliance/assessments/:assessmentId/findings
   * Get findings for an assessment
   */
  fastify.get<{
    Params: { assessmentId: string };
    Querystring: {
      status?: string;
      severity?: string;
      page?: string;
      limit?: string;
    };
  }>('/assessments/:assessmentId/findings', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { assessmentId } = request.params;

    try {
      const params = findingsQuerySchema.parse(request.query);

      const result = await assessmentService.getFindings(
        ctx.tenantId,
        assessmentId,
        params
      );

      return sendSuccess(reply, result);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'get findings', tenantId: ctx.tenantId });
    }
  });

  /**
   * POST /api/v1/compliance/reports/generate
   * Generate a compliance report
   */
  fastify.post('/reports/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    const ctx = getContext(request);

    try {
      const body = generateReportSchema.parse(request.body);

      const report = await reportService.generateReport(ctx, body);

      return sendCreated(reply, report);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'generate report', tenantId: ctx.tenantId });
    }
  });

  /**
   * GET /api/v1/compliance/reports
   * List generated reports
   */
  fastify.get<{
    Querystring: {
      reportType?: string;
      format?: string;
      limit?: string;
      offset?: string;
    };
  }>('/reports', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);

    try {
      const { reportType, format, limit = '20', offset = '0' } = request.query;

      const result = await reportService.listReports(ctx.tenantId, {
        reportType: reportType as any,
        format: format as any,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      });

      return sendSuccess(reply, { data: result.reports, total: result.total });
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'list reports', tenantId: ctx.tenantId });
    }
  });

  /**
   * GET /api/v1/compliance/reports/:reportId
   * Get report details
   */
  fastify.get<{
    Params: { reportId: string };
  }>('/reports/:reportId', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { reportId } = request.params;

    try {
      const report = await reportService.getReport(ctx.tenantId, reportId);

      if (!report) {
        return sendNotFound(reply, 'Report', reportId);
      }

      return sendSuccess(reply, report);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'get report', tenantId: ctx.tenantId });
    }
  });
}
