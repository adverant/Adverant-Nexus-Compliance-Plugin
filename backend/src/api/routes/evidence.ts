/**
 * Nexus Compliance Engine - Evidence API Routes
 * REST API for evidence management
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createLogger } from '../../utils/logger.js';
import {
  evidenceService,
  type EvidenceType,
  type EvidenceStatus
} from '../../services/evidence-service.js';
import type { ComplianceServiceContext } from '../../types/index.js';

const logger = createLogger('evidence-routes');

function getContext(request: FastifyRequest): ComplianceServiceContext {
  const tenantId = (request.headers['x-tenant-id'] as string) ||
    (request.headers['x-user-id'] as string) ||
    'default';
  const userId = (request.headers['x-user-id'] as string) || 'system';
  const requestId = (request.headers['x-request-id'] as string) || request.id;

  return { tenantId, userId, requestId };
}

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
    const context = getContext(request);

    try {
      const body = createEvidenceSchema.parse(request.body);

      const evidence = await evidenceService.createEvidence(context, {
        ...body,
        collectedAt: body.collectedAt ? new Date(body.collectedAt) : undefined,
        validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
        validUntil: body.validUntil ? new Date(body.validUntil) : undefined
      });

      return reply.status(201).send({
        success: true,
        data: evidence
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      }

      logger.error({ err: error, tenantId: context.tenantId }, 'Failed to create evidence');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create evidence'
      });
    }
  });

  /**
   * POST /api/v1/compliance/evidence/attestation
   * Create attestation
   */
  fastify.post('/evidence/attestation', async (request: FastifyRequest, reply: FastifyReply) => {
    const context = getContext(request);

    try {
      const body = createAttestationSchema.parse(request.body);

      const result = await evidenceService.createAttestation(context, {
        ...body,
        validUntil: new Date(body.validUntil)
      });

      return reply.status(201).send({
        success: true,
        data: result
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      }

      logger.error({ err: error, tenantId: context.tenantId }, 'Failed to create attestation');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create attestation'
      });
    }
  });

  /**
   * GET /api/v1/compliance/evidence
   * Search evidence
   */
  fastify.get<{
    Querystring: Record<string, string>;
  }>('/evidence', async (request, reply: FastifyReply) => {
    const context = getContext(request);

    try {
      const params = searchQuerySchema.parse(request.query);

      const result = await evidenceService.searchEvidence(context.tenantId, {
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

      logger.error({ err: error, tenantId: context.tenantId }, 'Failed to search evidence');
      return reply.status(500).send({
        success: false,
        error: 'Failed to search evidence'
      });
    }
  });

  /**
   * GET /api/v1/compliance/evidence/stats
   * Get evidence statistics
   */
  fastify.get('/evidence/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const context = getContext(request);

    try {
      const stats = await evidenceService.getEvidenceStats(context.tenantId);

      return reply.status(200).send({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId }, 'Failed to get evidence stats');
      return reply.status(500).send({
        success: false,
        error: 'Failed to get evidence statistics'
      });
    }
  });

  /**
   * GET /api/v1/compliance/evidence/expiring
   * Get expiring evidence
   */
  fastify.get<{
    Querystring: { days?: string };
  }>('/evidence/expiring', async (request, reply: FastifyReply) => {
    const context = getContext(request);
    const daysAhead = parseInt(request.query.days || '30', 10);

    try {
      const evidence = await evidenceService.getExpiringEvidence(context.tenantId, daysAhead);

      return reply.status(200).send({
        success: true,
        data: evidence,
        count: evidence.length
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId }, 'Failed to get expiring evidence');
      return reply.status(500).send({
        success: false,
        error: 'Failed to get expiring evidence'
      });
    }
  });

  /**
   * GET /api/v1/compliance/evidence/gaps/:controlId
   * Analyze evidence gaps for a control
   */
  fastify.get<{
    Params: { controlId: string };
  }>('/evidence/gaps/:controlId', async (request, reply: FastifyReply) => {
    const context = getContext(request);
    const { controlId } = request.params;

    try {
      const analysis = await evidenceService.analyzeEvidenceGaps(
        context.tenantId,
        [controlId]
      );

      if (analysis.length === 0) {
        return reply.status(404).send({
          success: false,
          error: `Control not found: ${controlId}`
        });
      }

      return reply.status(200).send({
        success: true,
        data: analysis[0]
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId, controlId }, 'Failed to analyze evidence gaps');
      return reply.status(500).send({
        success: false,
        error: 'Failed to analyze evidence gaps'
      });
    }
  });

  /**
   * POST /api/v1/compliance/evidence/gaps/bulk
   * Analyze evidence gaps for multiple controls
   */
  fastify.post('/evidence/gaps/bulk', async (request: FastifyRequest, reply: FastifyReply) => {
    const context = getContext(request);
    const body = request.body as { controlIds?: string[] };

    try {
      if (!body.controlIds || !Array.isArray(body.controlIds) || body.controlIds.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'controlIds array is required'
        });
      }

      if (body.controlIds.length > 100) {
        return reply.status(400).send({
          success: false,
          error: 'Maximum 100 controls per request'
        });
      }

      const analysis = await evidenceService.analyzeEvidenceGaps(
        context.tenantId,
        body.controlIds
      );

      return reply.status(200).send({
        success: true,
        data: analysis,
        count: analysis.length
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId }, 'Failed to analyze evidence gaps');
      return reply.status(500).send({
        success: false,
        error: 'Failed to analyze evidence gaps'
      });
    }
  });

  /**
   * GET /api/v1/compliance/evidence/:evidenceId
   * Get evidence by ID
   */
  fastify.get<{
    Params: { evidenceId: string };
  }>('/evidence/:evidenceId', async (request, reply: FastifyReply) => {
    const context = getContext(request);
    const { evidenceId } = request.params;

    try {
      const evidence = await evidenceService.getEvidence(context.tenantId, evidenceId);

      if (!evidence) {
        return reply.status(404).send({
          success: false,
          error: `Evidence not found: ${evidenceId}`
        });
      }

      return reply.status(200).send({
        success: true,
        data: evidence
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId, evidenceId }, 'Failed to get evidence');
      return reply.status(500).send({
        success: false,
        error: 'Failed to get evidence'
      });
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
    const context = getContext(request);
    const { controlId } = request.params;
    const { status, limit } = request.query;

    try {
      const evidence = await evidenceService.getControlEvidence(
        context.tenantId,
        controlId,
        {
          status: status as EvidenceStatus,
          limit: limit ? parseInt(limit, 10) : undefined
        }
      );

      return reply.status(200).send({
        success: true,
        data: evidence,
        count: evidence.length
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId, controlId }, 'Failed to get control evidence');
      return reply.status(500).send({
        success: false,
        error: 'Failed to get control evidence'
      });
    }
  });

  /**
   * PATCH /api/v1/compliance/evidence/:evidenceId/status
   * Update evidence status (approve/reject)
   */
  fastify.patch<{
    Params: { evidenceId: string };
  }>('/evidence/:evidenceId/status', async (request, reply: FastifyReply) => {
    const context = getContext(request);
    const { evidenceId } = request.params;
    const body = request.body as { status?: string; reviewNotes?: string };

    try {
      if (!body.status || !['approved', 'rejected'].includes(body.status)) {
        return reply.status(400).send({
          success: false,
          error: 'Status must be "approved" or "rejected"'
        });
      }

      const evidence = await evidenceService.updateEvidenceStatus(
        context,
        evidenceId,
        body.status as 'approved' | 'rejected',
        body.reviewNotes
      );

      return reply.status(200).send({
        success: true,
        data: evidence
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId, evidenceId }, 'Failed to update evidence status');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update evidence status'
      });
    }
  });

  /**
   * PATCH /api/v1/compliance/evidence/:evidenceId/link-finding
   * Link evidence to a finding
   */
  fastify.patch<{
    Params: { evidenceId: string };
  }>('/evidence/:evidenceId/link-finding', async (request, reply: FastifyReply) => {
    const context = getContext(request);
    const { evidenceId } = request.params;
    const body = request.body as { findingId?: string };

    try {
      if (!body.findingId) {
        return reply.status(400).send({
          success: false,
          error: 'findingId is required'
        });
      }

      const evidence = await evidenceService.linkToFinding(
        context,
        evidenceId,
        body.findingId
      );

      return reply.status(200).send({
        success: true,
        data: evidence
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId, evidenceId }, 'Failed to link evidence');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to link evidence'
      });
    }
  });

  /**
   * DELETE /api/v1/compliance/evidence/:evidenceId
   * Delete evidence
   */
  fastify.delete<{
    Params: { evidenceId: string };
  }>('/evidence/:evidenceId', async (request, reply: FastifyReply) => {
    const context = getContext(request);
    const { evidenceId } = request.params;

    try {
      await evidenceService.deleteEvidence(context, evidenceId);

      return reply.status(200).send({
        success: true,
        message: 'Evidence deleted successfully'
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId, evidenceId }, 'Failed to delete evidence');
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete evidence'
      });
    }
  });

  /**
   * POST /api/v1/compliance/evidence/expire-check
   * Mark expired evidence
   */
  fastify.post('/evidence/expire-check', async (request: FastifyRequest, reply: FastifyReply) => {
    const context = getContext(request);

    try {
      const count = await evidenceService.markExpiredEvidence(context.tenantId);

      return reply.status(200).send({
        success: true,
        message: `Marked ${count} evidence items as expired`
      });
    } catch (error) {
      logger.error({ err: error, tenantId: context.tenantId }, 'Failed to check expired evidence');
      return reply.status(500).send({
        success: false,
        error: 'Failed to check expired evidence'
      });
    }
  });
}
