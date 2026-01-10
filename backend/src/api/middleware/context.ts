/**
 * Shared Request Context Extraction
 * Single source of truth for extracting context from Fastify requests
 */

import { FastifyRequest } from 'fastify';

/**
 * Standard request context available to all route handlers
 */
export interface RequestContext {
  /** Tenant identifier for multi-tenancy */
  tenantId: string;
  /** User identifier for audit trails */
  userId: string;
  /** Unique request identifier for tracing */
  requestId: string;
  /** Optional session identifier */
  sessionId?: string;
  /** Client IP address */
  ipAddress?: string;
  /** Client user agent */
  userAgent?: string;
}

/**
 * Extract standardized context from a Fastify request
 *
 * Priority for tenantId:
 * 1. x-tenant-id header (explicit tenant)
 * 2. x-user-id header (fallback for single-tenant setups)
 * 3. 'default' (development/testing)
 *
 * @param request - Fastify request object
 * @returns Standardized request context
 */
export function getContext(request: FastifyRequest): RequestContext {
  return {
    tenantId: (request.headers['x-tenant-id'] as string) ||
              (request.headers['x-user-id'] as string) ||
              'default',
    userId: (request.headers['x-user-id'] as string) || 'system',
    requestId: (request.headers['x-request-id'] as string) || request.id,
    sessionId: request.headers['x-session-id'] as string | undefined,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  };
}

/**
 * Extract just the tenant ID from a request (convenience function)
 * @param request - Fastify request object
 * @returns Tenant ID string
 */
export function getTenantId(request: FastifyRequest): string {
  return (request.headers['x-tenant-id'] as string) ||
         (request.headers['x-user-id'] as string) ||
         'default';
}

/**
 * Extract just the user ID from a request (convenience function)
 * @param request - Fastify request object
 * @returns User ID string
 */
export function getUserId(request: FastifyRequest): string {
  return (request.headers['x-user-id'] as string) || 'system';
}
