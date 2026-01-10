/**
 * Visualization API Routes (Fastify)
 *
 * Endpoints for generating chart and graph data for compliance dashboards.
 */

import { FastifyInstance, FastifyReply } from 'fastify';
import { getPool } from '../../database/client.js';
import { VisualizationService, ChartType } from '../../services/visualization-service.js';
import { getContext, handleRouteError, sendSuccess, sendError } from '../middleware/index.js';

// Valid chart types for validation
const VALID_CHART_TYPES: ChartType[] = ['sankey', 'heatmap', 'network', 'radar', 'bar', 'treemap', 'sunburst'];

function isValidChartType(value: string | undefined): value is ChartType {
  return value === undefined || VALID_CHART_TYPES.includes(value as ChartType);
}

// Lazy singleton service
let _visualizationService: VisualizationService | null = null;
function getService(): VisualizationService {
  if (!_visualizationService) {
    _visualizationService = new VisualizationService(getPool());
  }
  return _visualizationService;
}

// ============================================================================
// Route Registration
// ============================================================================

export async function visualizationRoutes(fastify: FastifyInstance): Promise<void> {
  // ==========================================================================
  // Sankey Diagrams
  // ==========================================================================

  /**
   * Get Sankey diagram data for requirements → controls mapping
   * GET /sankey
   */
  fastify.get<{
    Querystring: { frameworks?: string; cacheEnabled?: string };
  }>('/sankey', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { frameworks, cacheEnabled } = request.query;

    try {
      const data = await getService().getSankeyData({
        frameworks: frameworks ? frameworks.split(',') : undefined,
        cacheEnabled: cacheEnabled !== 'false'
      });

      sendSuccess(reply, data);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'get Sankey data', tenantId: ctx.tenantId });
    }
  });

  /**
   * Get Sankey diagram for framework-to-framework mappings
   * GET /sankey/frameworks
   */
  fastify.get('/sankey/frameworks', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    try {
      const data = await getService().getFrameworkSankeyData();
      sendSuccess(reply, data);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'get framework Sankey data', tenantId: ctx.tenantId });
    }
  });

  // ==========================================================================
  // Heatmaps
  // ==========================================================================

  /**
   * Get compliance coverage heatmap (frameworks × requirements)
   * GET /heatmap
   */
  fastify.get<{
    Querystring: { frameworks?: string; cacheEnabled?: string };
  }>('/heatmap', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { frameworks, cacheEnabled } = request.query;

    try {
      const data = await getService().getComplianceHeatmap({
        frameworks: frameworks ? frameworks.split(',') : undefined,
        cacheEnabled: cacheEnabled !== 'false'
      });

      sendSuccess(reply, data);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'get compliance heatmap', tenantId: ctx.tenantId });
    }
  });

  /**
   * Get cross-framework mapping heatmap
   * GET /heatmap/cross-framework
   */
  fastify.get('/heatmap/cross-framework', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    try {
      const data = await getService().getCrossFrameworkHeatmap();
      sendSuccess(reply, data);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'get cross-framework heatmap', tenantId: ctx.tenantId });
    }
  });

  // ==========================================================================
  // Network Graphs
  // ==========================================================================

  /**
   * Get control relationship network graph
   * GET /network-graph
   */
  fastify.get<{
    Querystring: { cacheEnabled?: string };
  }>('/network-graph', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { cacheEnabled } = request.query;

    try {
      const data = await getService().getControlNetworkGraph({
        cacheEnabled: cacheEnabled !== 'false'
      });

      sendSuccess(reply, data);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'get network graph', tenantId: ctx.tenantId });
    }
  });

  /**
   * Get detailed control network for a specific framework
   * GET /network-graph/:frameworkId
   */
  fastify.get<{
    Params: { frameworkId: string };
  }>('/network-graph/:frameworkId', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { frameworkId } = request.params;

    try {
      const data = await getService().getFrameworkControlNetwork(frameworkId);
      sendSuccess(reply, data);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'get framework control network', tenantId: ctx.tenantId });
    }
  });

  // ==========================================================================
  // Radar Charts
  // ==========================================================================

  /**
   * Get multi-framework radar chart data
   * GET /radar
   */
  fastify.get<{
    Querystring: { tenantId?: string; frameworks?: string };
  }>('/radar', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { tenantId, frameworks } = request.query;

    if (!tenantId) {
      return sendError(reply, 'tenantId query parameter is required', 400);
    }

    try {
      const data = await getService().getFrameworkRadarData(
        tenantId,
        frameworks ? frameworks.split(',') : undefined
      );

      sendSuccess(reply, data);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'get radar data', tenantId: ctx.tenantId });
    }
  });

  /**
   * Get tenant compliance radar across frameworks
   * GET /radar/tenant
   */
  fastify.get<{
    Querystring: { tenantId?: string };
  }>('/radar/tenant', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { tenantId } = request.query;

    if (!tenantId) {
      return sendError(reply, 'tenantId query parameter is required', 400);
    }

    try {
      const data = await getService().getTenantComplianceRadar(tenantId);
      sendSuccess(reply, data);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'get tenant radar data', tenantId: ctx.tenantId });
    }
  });

  // ==========================================================================
  // Treemaps
  // ==========================================================================

  /**
   * Get control hierarchy treemap
   * GET /treemap
   */
  fastify.get<{
    Querystring: { frameworkId?: string };
  }>('/treemap', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { frameworkId } = request.query;

    try {
      const data = await getService().getControlTreemap(frameworkId);
      sendSuccess(reply, data);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'get treemap data', tenantId: ctx.tenantId });
    }
  });

  // ==========================================================================
  // Dashboard
  // ==========================================================================

  /**
   * Get comprehensive dashboard data
   * GET /dashboard
   */
  fastify.get<{
    Querystring: { tenantId?: string };
  }>('/dashboard', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { tenantId } = request.query;

    if (!tenantId) {
      return sendError(reply, 'tenantId query parameter is required', 400);
    }

    try {
      const data = await getService().getDashboardData(tenantId);
      sendSuccess(reply, data);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'get dashboard data', tenantId: ctx.tenantId });
    }
  });

  // ==========================================================================
  // Z-Inspection Visualizations
  // ==========================================================================

  /**
   * Get Z-Inspection report visualization data
   * GET /z-inspection/:reportId
   */
  fastify.get<{
    Params: { reportId: string };
  }>('/z-inspection/:reportId', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { reportId } = request.params;

    try {
      const data = await getService().getZInspectionVisualization(reportId);
      sendSuccess(reply, data);
    } catch (error) {
      handleRouteError(error, reply, { operation: 'get Z-Inspection visualization', tenantId: ctx.tenantId });
    }
  });

  // ==========================================================================
  // Cache Management
  // ==========================================================================

  /**
   * Clear visualization cache
   * POST /cache/clear
   */
  fastify.post<{
    Body: { chartType?: string };
  }>('/cache/clear', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { chartType } = request.body || {};

    // Validate chartType if provided
    if (chartType && !isValidChartType(chartType)) {
      return sendError(reply, `Invalid chartType. Must be one of: ${VALID_CHART_TYPES.join(', ')}`, 400);
    }

    try {
      const deleted = await getService().clearCache(chartType as ChartType | undefined);
      sendSuccess(reply, { entriesDeleted: deleted });
    } catch (error) {
      handleRouteError(error, reply, { operation: 'clear cache', tenantId: ctx.tenantId });
    }
  });

  /**
   * Clean expired cache entries
   * POST /cache/clean
   */
  fastify.post('/cache/clean', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    try {
      const deleted = await getService().cleanExpiredCache();
      sendSuccess(reply, { entriesDeleted: deleted });
    } catch (error) {
      handleRouteError(error, reply, { operation: 'clean expired cache', tenantId: ctx.tenantId });
    }
  });
}
