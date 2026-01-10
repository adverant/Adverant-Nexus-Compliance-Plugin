/**
 * Shared Response Utilities
 * Single source of truth for API response formatting
 */

import { FastifyReply } from 'fastify';

/**
 * Standard success response structure
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Send a successful response with data
 *
 * @param reply - Fastify reply object
 * @param data - Response data
 * @param statusCode - HTTP status code (default: 200)
 */
export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  statusCode = 200
): void {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };
  reply.status(statusCode).send(response);
}

/**
 * Send a successful response for resource creation
 *
 * @param reply - Fastify reply object
 * @param data - Created resource data
 */
export function sendCreated<T>(reply: FastifyReply, data: T): void {
  sendSuccess(reply, data, 201);
}

/**
 * Send a paginated response
 *
 * @param reply - Fastify reply object
 * @param data - Array of items
 * @param pagination - Pagination parameters
 */
export function sendPaginated<T>(
  reply: FastifyReply,
  data: T[],
  pagination: { total: number; page: number; limit: number }
): void {
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrevious: pagination.page > 1,
    },
  };
  reply.status(200).send(response);
}

/**
 * Send a 204 No Content response (for successful deletions)
 *
 * @param reply - Fastify reply object
 */
export function sendNoContent(reply: FastifyReply): void {
  reply.status(204).send();
}

/**
 * Send a client error response (4xx)
 *
 * @param reply - Fastify reply object
 * @param message - Error message
 * @param statusCode - HTTP status code (default: 400)
 * @param code - Optional error code
 */
export function sendError(
  reply: FastifyReply,
  message: string,
  statusCode = 400,
  code?: string
): void {
  reply.status(statusCode).send({
    success: false,
    error: message,
    code,
  });
}

/**
 * Send a 404 Not Found response
 *
 * @param reply - Fastify reply object
 * @param resource - Name of the resource that wasn't found
 * @param id - Optional ID of the resource
 */
export function sendNotFound(
  reply: FastifyReply,
  resource: string,
  id?: string
): void {
  const message = id
    ? `${resource} with id '${id}' not found`
    : `${resource} not found`;
  sendError(reply, message, 404, 'NOT_FOUND');
}

/**
 * Send a 409 Conflict response
 *
 * @param reply - Fastify reply object
 * @param message - Conflict description
 */
export function sendConflict(reply: FastifyReply, message: string): void {
  sendError(reply, message, 409, 'CONFLICT');
}
