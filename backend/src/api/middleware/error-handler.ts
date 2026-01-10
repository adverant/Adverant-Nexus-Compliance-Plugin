/**
 * Shared Error Handler
 * Single source of truth for route-level error handling
 */

import { FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('error-handler');

/**
 * Context for error logging and response
 */
export interface ErrorContext {
  /** Operation name for logging */
  operation: string;
  /** Additional context fields */
  [key: string]: unknown;
}

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Custom application error with status code
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id '${id}' not found` : `${resource} not found`,
      404,
      'NOT_FOUND'
    );
    this.name = 'NotFoundError';
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

/**
 * Handle route errors in a standardized way
 *
 * This function:
 * 1. Handles Zod validation errors specially (returns field-level details)
 * 2. Handles custom AppErrors with their status codes
 * 3. Logs all errors with context
 * 4. Returns consistent error response structure
 *
 * @param error - The error to handle
 * @param reply - Fastify reply object
 * @param context - Context for logging
 */
export function handleRouteError(
  error: unknown,
  reply: FastifyReply,
  context: ErrorContext
): void {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const response: ErrorResponse = {
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    };
    reply.status(400).send(response);
    return;
  }

  // Handle custom application errors
  if (error instanceof AppError) {
    logger.warn(
      { err: error, ...context, statusCode: error.statusCode },
      `${context.operation}: ${error.message}`
    );

    const response: ErrorResponse = {
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
    };
    reply.status(error.statusCode).send(response);
    return;
  }

  // Handle unexpected errors
  logger.error(
    { err: error, ...context },
    `Failed: ${context.operation}`
  );

  const response: ErrorResponse = {
    success: false,
    error: error instanceof Error ? error.message : 'Internal server error',
    code: 'INTERNAL_ERROR',
  };
  reply.status(500).send(response);
}

/**
 * Wrap an async route handler with error handling
 *
 * @param handler - Async route handler
 * @param context - Error context
 * @returns Wrapped handler that catches errors
 */
export function withErrorHandler<T>(
  handler: () => Promise<T>,
  reply: FastifyReply,
  context: ErrorContext
): Promise<T | void> {
  return handler().catch(error => handleRouteError(error, reply, context));
}
