/**
 * API Middleware Exports
 * Single import point for all shared middleware utilities
 */

// Context extraction
export {
  type RequestContext,
  getContext,
  getTenantId,
  getUserId,
} from './context.js';

// Error handling
export {
  type ErrorContext,
  type ErrorResponse,
  AppError,
  NotFoundError,
  ValidationError,
  ConflictError,
  handleRouteError,
  withErrorHandler,
} from './error-handler.js';

// Response utilities
export {
  type SuccessResponse,
  type PaginationMeta,
  type PaginatedResponse,
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNoContent,
  sendError,
  sendNotFound,
  sendConflict,
} from './response.js';
