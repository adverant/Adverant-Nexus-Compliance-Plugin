/**
 * Nexus Compliance Engine - Configuration API Routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { complianceToggleService } from '../../services/compliance-toggle-service.js';
import { createLogger } from '../../utils/logger.js';
import {
  getContext,
  handleRouteError,
  sendSuccess,
} from '../middleware/index.js';
import type { ModuleConfigMap } from '../../types/index.js';

const logger = createLogger('config-routes');

// Request validation schemas
const toggleMasterSchema = z.object({
  enabled: z.boolean(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

const toggleModuleSchema = z.object({
  module: z.enum(['gdpr', 'aiAct', 'nis2', 'iso27001', 'soc2', 'hipaa']),
  enabled: z.boolean(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  feature: z.string().optional(),
});

const auditQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  action: z.string().optional(),
  module: z.string().optional(),
});

export async function configRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/v1/compliance/config
   * Get compliance configuration for the current tenant
   */
  fastify.get('/config', async (request: FastifyRequest, reply: FastifyReply) => {
    const ctx = getContext(request);

    try {
      const config = await complianceToggleService.getConfig(ctx.tenantId);
      sendSuccess(reply, config);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'get config', tenantId: ctx.tenantId });
    }
  });

  /**
   * PUT /api/v1/compliance/config/master
   * Toggle master compliance switch (requires admin role)
   */
  fastify.put(
    '/config/master',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const ctx = getContext(request);

      try {
        const body = toggleMasterSchema.parse(request.body);
        const config = await complianceToggleService.toggleMaster(ctx, body);

        logger.info(
          { tenantId: ctx.tenantId, userId: ctx.userId, enabled: body.enabled },
          'Master compliance toggle updated'
        );

        sendSuccess(reply, config);
      } catch (error) {
        handleRouteError(error, reply, { operation: 'toggle master', tenantId: ctx.tenantId });
      }
    }
  );

  /**
   * PUT /api/v1/compliance/config
   * Toggle a specific compliance module or feature
   */
  fastify.put('/config', async (request: FastifyRequest, reply: FastifyReply) => {
    const ctx = getContext(request);

    try {
      const body = toggleModuleSchema.parse(request.body);

      const config = await complianceToggleService.toggleModule(ctx, {
        module: body.module as keyof ModuleConfigMap,
        enabled: body.enabled,
        reason: body.reason,
        feature: body.feature,
      });

      logger.info(
        {
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          module: body.module,
          feature: body.feature,
          enabled: body.enabled,
        },
        'Module toggle updated'
      );

      sendSuccess(reply, config);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'toggle module', tenantId: ctx.tenantId });
    }
  });

  /**
   * GET /api/v1/compliance/config/enabled/:module
   * Check if a specific module is enabled
   */
  fastify.get<{
    Params: { module: string };
    Querystring: { feature?: string };
  }>(
    '/config/enabled/:module',
    async (request, reply: FastifyReply) => {
      const ctx = getContext(request);
      const { module } = request.params;
      const { feature } = request.query;

      try {
        const validModules = ['gdpr', 'aiAct', 'nis2', 'iso27001', 'soc2', 'hipaa'];
        if (!validModules.includes(module)) {
          return reply.status(400).send({
            success: false,
            error: `Invalid module: ${module}`,
          });
        }

        const enabled = await complianceToggleService.isEnabled(
          ctx.tenantId,
          module as keyof ModuleConfigMap,
          feature
        );

        sendSuccess(reply, { module, feature: feature ?? null, enabled });
      } catch (error) {
        handleRouteError(error, reply, { operation: 'check enabled status', tenantId: ctx.tenantId, module });
      }
    }
  );

  /**
   * GET /api/v1/compliance/config/audit
   * Get configuration audit log
   */
  fastify.get<{
    Querystring: {
      limit?: string;
      offset?: string;
      action?: string;
      module?: string;
    };
  }>('/config/audit', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);

    try {
      const params = auditQuerySchema.parse(request.query);

      const { audits, total } = await complianceToggleService.getAuditLog(
        ctx.tenantId,
        params
      );

      reply.status(200).send({
        success: true,
        data: audits,
        pagination: {
          total,
          limit: params.limit,
          offset: params.offset,
          hasMore: params.offset + audits.length < total,
        },
      });
    } catch (error) {
      handleRouteError(error, reply, { operation: 'get audit log', tenantId: ctx.tenantId });
    }
  });
}
