/**
 * Nexus Compliance Engine - Evidence API Routes
 * REST API for evidence management
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import {
  evidenceService,
  type EvidenceType,
  type EvidenceStatus
} from '../../services/evidence-service.js';
import {
  getContext,
  handleRouteError,
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendPaginated,
  sendError,
} from '../middleware/index.js';

const createEvidenceSchema = z.object({
  controlId: z.string().min(1),
  findingId: z.string().uuid().optional(),
  assessmentId: z.string().uuid().optional(),
  type: z.enum(['document', 'screenshot', 'configuration', 'log', 'attestation', 'scan_result', 'certificate', 'interview', 'observation', 'api_export']),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  filePath: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  checksum: z.string().optional(),
  sourceSystem: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  collectedAt: z.string().datetime().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional()
});

const createAttestationSchema = z.object({
  controlId: z.string().min(1),
  attestationType: z.enum(['self', 'manager', 'auditor', 'third_party']),
  statement: z.string().min(1),
  isCompliant: z.boolean(),
  validUntil: z.string().datetime(),
  supportingNotes: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

const searchQuerySchema = z.object({
  controlId: z.string().optional(),
  findingId: z.string().uuid().optional(),
  assessmentId: z.string().uuid().optional(),
  type: z.enum(['document', 'screenshot', 'configuration', 'log', 'attestation', 'scan_result', 'certificate', 'interview', 'observation', 'api_export']).optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'expired']).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50)
});

export async function evidenceRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /api/v1/compliance/evidence
   * Create new evidence
   */
  fastify.post('/evidence', async (request: FastifyRequest, reply: FastifyReply) => {
    const ctx = getContext(request);

    try {
      const body = createEvidenceSchema.parse(request.body);

      const evidence = await evidenceService.createEvidence(ctx, {
        ...body,
        collectedAt: body.collectedAt ? new Date(body.collectedAt) : undefined,
        validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
        validUntil: body.validUntil ? new Date(body.validUntil) : undefined
      });

      return sendCreated(reply, evidence);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'createEvidence', tenantId: ctx.tenantId });
    }
  });

  /**
   * POST /api/v1/compliance/evidence/attestation
   * Create attestation
   */
  fastify.post('/evidence/attestation', async (request: FastifyRequest, reply: FastifyReply) => {
    const ctx = getContext(request);

    try {
      const body = createAttestationSchema.parse(request.body);

      const result = await evidenceService.createAttestation(ctx, {
        ...body,
        validUntil: new Date(body.validUntil)
      });

      return sendCreated(reply, result);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'createAttestation', tenantId: ctx.tenantId });
    }
  });

  /**
   * GET /api/v1/compliance/evidence
   * Search evidence
   */
  fastify.get<{
    Querystring: Record<string, string>;
  }>('/evidence', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);

    try {
      const params = searchQuerySchema.parse(request.query);

      const result = await evidenceService.searchEvidence(ctx.tenantId, {
        ...params,
        fromDate: params.fromDate ? new Date(params.fromDate) : undefined,
        toDate: params.toDate ? new Date(params.toDate) : undefined
      });

      return sendPaginated(reply, result.data, {
        total: result.total,
        page: result.page,
        limit: result.limit
      });
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'searchEvidence', tenantId: ctx.tenantId });
    }
  });

  /**
   * GET /api/v1/compliance/evidence/stats
   * Get evidence statistics
   */
  fastify.get('/evidence/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const ctx = getContext(request);

    try {
      const stats = await evidenceService.getEvidenceStats(ctx.tenantId);

      return sendSuccess(reply, stats);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'getEvidenceStats', tenantId: ctx.tenantId });
    }
  });

  /**
   * GET /api/v1/compliance/evidence/expiring
   * Get expiring evidence
   */
  fastify.get<{
    Querystring: { days?: string };
  }>('/evidence/expiring', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const daysAhead = parseInt(request.query.days || '30', 10);

    try {
      const evidence = await evidenceService.getExpiringEvidence(ctx.tenantId, daysAhead);

      return sendSuccess(reply, { items: evidence, count: evidence.length });
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'getExpiringEvidence', tenantId: ctx.tenantId });
    }
  });

  /**
   * GET /api/v1/compliance/evidence/gaps/:controlId
   * Analyze evidence gaps for a control
   */
  fastify.get<{
    Params: { controlId: string };
  }>('/evidence/gaps/:controlId', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { controlId } = request.params;

    try {
      const analysis = await evidenceService.analyzeEvidenceGaps(
        ctx.tenantId,
        [controlId]
      );

      if (analysis.length === 0) {
        return sendNotFound(reply, 'Control', controlId);
      }

      return sendSuccess(reply, analysis[0]);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'analyzeEvidenceGaps', tenantId: ctx.tenantId, controlId });
    }
  });

  /**
   * POST /api/v1/compliance/evidence/gaps/bulk
   * Analyze evidence gaps for multiple controls
   */
  fastify.post('/evidence/gaps/bulk', async (request: FastifyRequest, reply: FastifyReply) => {
    const ctx = getContext(request);
    const body = request.body as { controlIds?: string[] };

    try {
      if (!body.controlIds || !Array.isArray(body.controlIds) || body.controlIds.length === 0) {
        return sendError(reply, 'controlIds array is required');
      }

      if (body.controlIds.length > 100) {
        return sendError(reply, 'Maximum 100 controls per request');
      }

      const analysis = await evidenceService.analyzeEvidenceGaps(
        ctx.tenantId,
        body.controlIds
      );

      return sendSuccess(reply, { items: analysis, count: analysis.length });
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'analyzeEvidenceGapsBulk', tenantId: ctx.tenantId });
    }
  });

  /**
   * GET /api/v1/compliance/evidence/:evidenceId
   * Get evidence by ID
   */
  fastify.get<{
    Params: { evidenceId: string };
  }>('/evidence/:evidenceId', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { evidenceId } = request.params;

    try {
      const evidence = await evidenceService.getEvidence(ctx.tenantId, evidenceId);

      if (!evidence) {
        return sendNotFound(reply, 'Evidence', evidenceId);
      }

      return sendSuccess(reply, evidence);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'getEvidence', tenantId: ctx.tenantId, evidenceId });
    }
  });

  /**
   * GET /api/v1/compliance/evidence/control/:controlId
   * Get evidence for a specific control
   */
  fastify.get<{
    Params: { controlId: string };
    Querystring: { status?: string; limit?: string };
  }>('/evidence/control/:controlId', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { controlId } = request.params;
    const { status, limit } = request.query;

    try {
      const evidence = await evidenceService.getControlEvidence(
        ctx.tenantId,
        controlId,
        {
          status: status as EvidenceStatus,
          limit: limit ? parseInt(limit, 10) : undefined
        }
      );

      return sendSuccess(reply, { items: evidence, count: evidence.length });
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'getControlEvidence', tenantId: ctx.tenantId, controlId });
    }
  });

  /**
   * PATCH /api/v1/compliance/evidence/:evidenceId/status
   * Update evidence status (approve/reject)
   */
  fastify.patch<{
    Params: { evidenceId: string };
  }>('/evidence/:evidenceId/status', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { evidenceId } = request.params;
    const body = request.body as { status?: string; reviewNotes?: string };

    try {
      if (!body.status || !['approved', 'rejected'].includes(body.status)) {
        return sendError(reply, 'Status must be "approved" or "rejected"');
      }

      const evidence = await evidenceService.updateEvidenceStatus(
        ctx,
        evidenceId,
        body.status as 'approved' | 'rejected',
        body.reviewNotes
      );

      return sendSuccess(reply, evidence);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'updateEvidenceStatus', tenantId: ctx.tenantId, evidenceId });
    }
  });

  /**
   * PATCH /api/v1/compliance/evidence/:evidenceId/link-finding
   * Link evidence to a finding
   */
  fastify.patch<{
    Params: { evidenceId: string };
  }>('/evidence/:evidenceId/link-finding', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { evidenceId } = request.params;
    const body = request.body as { findingId?: string };

    try {
      if (!body.findingId) {
        return sendError(reply, 'findingId is required');
      }

      const evidence = await evidenceService.linkToFinding(
        ctx,
        evidenceId,
        body.findingId
      );

      return sendSuccess(reply, evidence);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'linkEvidenceToFinding', tenantId: ctx.tenantId, evidenceId });
    }
  });

  /**
   * DELETE /api/v1/compliance/evidence/:evidenceId
   * Delete evidence
   */
  fastify.delete<{
    Params: { evidenceId: string };
  }>('/evidence/:evidenceId', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { evidenceId } = request.params;

    try {
      await evidenceService.deleteEvidence(ctx, evidenceId);

      return sendSuccess(reply, { message: 'Evidence deleted successfully' });
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'deleteEvidence', tenantId: ctx.tenantId, evidenceId });
    }
  });

  /**
   * POST /api/v1/compliance/evidence/expire-check
   * Mark expired evidence
   */
  fastify.post('/evidence/expire-check', async (request: FastifyRequest, reply: FastifyReply) => {
    const ctx = getContext(request);

    try {
      const count = await evidenceService.markExpiredEvidence(ctx.tenantId);

      return sendSuccess(reply, { message: `Marked ${count} evidence items as expired`, count });
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'markExpiredEvidence', tenantId: ctx.tenantId });
    }
  });
}
