/**
 * Cross-Analysis API Routes (Fastify)
 *
 * Endpoints for cross-framework analysis, gap analysis,
 * requirement coverage, and Z-Inspection control mapping.
 */

import { FastifyInstance, FastifyReply } from 'fastify';
import { getPool } from '../../database/client.js';
import { CrossAnalysisService, RelationshipType } from '../../services/cross-analysis-service.js';
import { TrustworthyAIRequirementId } from '../../types/qualitative.js';
import {
  getContext,
  handleRouteError,
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendError,
} from '../middleware/index.js';

// Valid query types for saved analysis queries
type AnalysisQueryType = 'cross_framework' | 'gap_analysis' | 'requirement_coverage' | 'z_inspection';
const VALID_QUERY_TYPES: AnalysisQueryType[] = ['cross_framework', 'gap_analysis', 'requirement_coverage', 'z_inspection'];

function isValidQueryType(value: string): value is AnalysisQueryType {
  return VALID_QUERY_TYPES.includes(value as AnalysisQueryType);
}

// Lazy singleton service
let _crossAnalysisService: CrossAnalysisService | null = null;
function getService(): CrossAnalysisService {
  if (!_crossAnalysisService) {
    _crossAnalysisService = new CrossAnalysisService(getPool());
  }
  return _crossAnalysisService;
}

// ============================================================================
// Route Registration
// ============================================================================

export async function analysisRoutes(fastify: FastifyInstance): Promise<void> {
  // ==========================================================================
  // Cross-Framework Analysis
  // ==========================================================================

  /**
   * Get cross-framework control mapping matrix
   * GET /cross-framework
   */
  fastify.get('/cross-framework', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);

    try {
      const matrix = await getService().getControlMappingMatrix(ctx.tenantId);
      sendSuccess(reply, matrix);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'getControlMappingMatrix', tenantId: ctx.tenantId });
    }
  });

  /**
   * Get framework overlap statistics
   * GET /cross-framework/overlap
   */
  fastify.get<{
    Querystring: { framework1?: string; framework2?: string };
  }>('/cross-framework/overlap', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { framework1, framework2 } = request.query;

    if (!framework1 || !framework2) {
      return sendError(reply, 'framework1 and framework2 query parameters are required');
    }

    try {
      const overlap = await getService().getFrameworkOverlap(framework1, framework2);

      if (!overlap) {
        return sendNotFound(reply, 'Overlap data');
      }

      sendSuccess(reply, overlap);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'getFrameworkOverlap', tenantId: ctx.tenantId, framework1, framework2 });
    }
  });

  /**
   * Create control cross-reference
   * POST /cross-framework/mappings
   */
  fastify.post<{
    Body: {
      sourceControlId?: string;
      targetControlId?: string;
      relationshipType?: RelationshipType;
      confidence?: number;
      rationale?: string;
    };
  }>('/cross-framework/mappings', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { sourceControlId, targetControlId, relationshipType, confidence, rationale } = request.body || {};

    if (!sourceControlId || !targetControlId || !relationshipType) {
      return sendError(reply, 'sourceControlId, targetControlId, and relationshipType are required');
    }

    try {
      const mapping = await getService().createCrossReference(
        sourceControlId,
        targetControlId,
        relationshipType,
        confidence || 0.8,
        'manual',
        rationale
      );

      sendCreated(reply, mapping);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'createCrossReference', tenantId: ctx.tenantId, sourceControlId, targetControlId });
    }
  });

  /**
   * Find equivalent controls for a given control
   * GET /cross-framework/equivalents/:controlId
   */
  fastify.get<{
    Params: { controlId: string };
  }>('/cross-framework/equivalents/:controlId', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { controlId } = request.params;

    try {
      const equivalents = await getService().findEquivalentControls(controlId);
      sendSuccess(reply, equivalents);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'findEquivalentControls', tenantId: ctx.tenantId, controlId });
    }
  });

  // ==========================================================================
  // Requirement Coverage
  // ==========================================================================

  /**
   * Get 7 EU requirements coverage across all frameworks
   * GET /requirement-coverage
   */
  fastify.get('/requirement-coverage', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);

    try {
      const coverage = await getService().getRequirementCoverage();
      sendSuccess(reply, coverage);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'getRequirementCoverage', tenantId: ctx.tenantId });
    }
  });

  /**
   * Get controls for a specific requirement grouped by framework
   * GET /requirements/:requirementId/controls
   */
  fastify.get<{
    Params: { requirementId: string };
  }>('/requirements/:requirementId/controls', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { requirementId } = request.params;

    try {
      const controls = await getService().getControlsForRequirement(
        requirementId as TrustworthyAIRequirementId
      );
      sendSuccess(reply, controls);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'getControlsForRequirement', tenantId: ctx.tenantId, requirementId });
    }
  });

  // ==========================================================================
  // Gap Analysis
  // ==========================================================================

  /**
   * Run gap analysis for a tenant
   * GET /gap-analysis
   */
  fastify.get('/gap-analysis', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);

    try {
      const analysis = await getService().identifyGaps(ctx.tenantId);
      sendSuccess(reply, analysis);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'identifyGaps', tenantId: ctx.tenantId });
    }
  });

  /**
   * Get unmapped controls
   * GET /unmapped-controls
   */
  fastify.get('/unmapped-controls', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);

    try {
      const unmapped = await getService().findUnmappedControls(ctx.tenantId);
      sendSuccess(reply, unmapped);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'findUnmappedControls', tenantId: ctx.tenantId });
    }
  });

  /**
   * Get unmapped requirements
   * GET /unmapped-requirements
   */
  fastify.get('/unmapped-requirements', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);

    try {
      const unmapped = await getService().findUnmappedRequirements(ctx.tenantId);
      sendSuccess(reply, unmapped);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'findUnmappedRequirements', tenantId: ctx.tenantId });
    }
  });

  // ==========================================================================
  // Z-Inspection Control Mapping
  // ==========================================================================

  /**
   * Map Z-Inspection findings to controls
   * POST /z-inspection/map-finding
   */
  fastify.post<{
    Body: { findingId?: string };
  }>('/z-inspection/map-finding', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { findingId } = request.body || {};

    if (!findingId) {
      return sendError(reply, 'findingId is required');
    }

    try {
      const links = await getService().mapZInspectionToControls(findingId);
      sendSuccess(reply, { links, count: links.length });
    } catch (error) {
      handleRouteError(error, reply, { operation: 'mapZInspectionToControls', tenantId: ctx.tenantId, findingId });
    }
  });

  /**
   * Adjust control weights based on Z-Inspection report
   * POST /z-inspection/adjust-weights
   */
  fastify.post<{
    Body: { reportId?: string };
  }>('/z-inspection/adjust-weights', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { reportId } = request.body || {};

    if (!reportId) {
      return sendError(reply, 'reportId is required');
    }

    try {
      const adjustments = await getService().adjustControlWeights(reportId);
      sendSuccess(reply, { adjustments, count: adjustments.length });
    } catch (error) {
      handleRouteError(error, reply, { operation: 'adjustControlWeights', tenantId: ctx.tenantId, reportId });
    }
  });

  // ==========================================================================
  // Saved Queries
  // ==========================================================================

  /**
   * Save an analysis query
   * POST /queries
   */
  fastify.post<{
    Body: {
      name?: string;
      queryType?: string;
      parameters?: Record<string, unknown>;
      scheduleFrequency?: string;
    };
  }>('/queries', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { name, queryType, parameters, scheduleFrequency } = request.body || {};

    if (!name || !queryType) {
      return sendError(reply, 'name and queryType are required');
    }

    if (!isValidQueryType(queryType)) {
      return sendError(reply, `Invalid queryType. Must be one of: ${VALID_QUERY_TYPES.join(', ')}`);
    }

    try {
      const query = await getService().saveAnalysisQuery(
        ctx.tenantId,
        name,
        queryType,
        parameters || {},
        scheduleFrequency
      );

      sendCreated(reply, query);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'saveAnalysisQuery', tenantId: ctx.tenantId, name });
    }
  });

  /**
   * Run a saved query
   * POST /queries/:id/run
   */
  fastify.post<{
    Params: { id: string };
  }>('/queries/:id/run', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;

    try {
      const result = await getService().runSavedQuery(id);
      sendSuccess(reply, result);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'runSavedQuery', tenantId: ctx.tenantId, queryId: id });
    }
  });

  // ==========================================================================
  // AI-Powered Analysis
  // ==========================================================================

  /**
   * Perform AI-powered cross-framework analysis
   * POST /ai-analyze
   */
  fastify.post<{
    Body: {
      query?: string;
      frameworks?: string[];
      requirementFocus?: TrustworthyAIRequirementId[];
    };
  }>('/ai-analyze', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { query, frameworks, requirementFocus } = request.body || {};

    if (!query) {
      return sendError(reply, 'query is required');
    }

    try {
      const result = await getService().aiAnalyzeCrossFramework(query, {
        tenantId: ctx.tenantId,
        frameworks,
        requirementFocus
      });

      sendSuccess(reply, result);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'aiAnalyzeCrossFramework', tenantId: ctx.tenantId });
    }
  });
}
