/**
 * Visualization API Routes
 *
 * Endpoints for generating chart and graph data for compliance dashboards.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

import { VisualizationService } from '../../services/visualization-service';

// ============================================================================
// Route Factory
// ============================================================================

export function createVisualizationRoutes(pool: Pool): Router {
  const router = Router();
  const visualizationService = new VisualizationService(pool);

  // ==========================================================================
  // Sankey Diagrams
  // ==========================================================================

  /**
   * Get Sankey diagram data for requirements → controls mapping
   * GET /api/v1/compliance/visualization/sankey
   */
  router.get('/sankey', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { frameworks, cacheEnabled } = req.query;

      const data = await visualizationService.getSankeyData({
        frameworks: frameworks ? (frameworks as string).split(',') : undefined,
        cacheEnabled: cacheEnabled !== 'false'
      });

      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get Sankey diagram for framework-to-framework mappings
   * GET /api/v1/compliance/visualization/sankey/frameworks
   */
  router.get('/sankey/frameworks', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await visualizationService.getFrameworkSankeyData();
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // Heatmaps
  // ==========================================================================

  /**
   * Get compliance coverage heatmap (frameworks × requirements)
   * GET /api/v1/compliance/visualization/heatmap
   */
  router.get('/heatmap', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { frameworks, cacheEnabled } = req.query;

      const data = await visualizationService.getComplianceHeatmap({
        frameworks: frameworks ? (frameworks as string).split(',') : undefined,
        cacheEnabled: cacheEnabled !== 'false'
      });

      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get cross-framework mapping heatmap
   * GET /api/v1/compliance/visualization/heatmap/cross-framework
   */
  router.get('/heatmap/cross-framework', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await visualizationService.getCrossFrameworkHeatmap();
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // Network Graphs
  // ==========================================================================

  /**
   * Get control relationship network graph
   * GET /api/v1/compliance/visualization/network-graph
   */
  router.get('/network-graph', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cacheEnabled } = req.query;

      const data = await visualizationService.getControlNetworkGraph({
        cacheEnabled: cacheEnabled !== 'false'
      });

      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get detailed control network for a specific framework
   * GET /api/v1/compliance/visualization/network-graph/:frameworkId
   */
  router.get('/network-graph/:frameworkId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await visualizationService.getFrameworkControlNetwork(req.params.frameworkId);
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // Radar Charts
  // ==========================================================================

  /**
   * Get multi-framework radar chart data
   * GET /api/v1/compliance/visualization/radar
   */
  router.get('/radar', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, frameworks } = req.query;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId query parameter is required' });
        return;
      }

      const data = await visualizationService.getFrameworkRadarData(
        tenantId as string,
        frameworks ? (frameworks as string).split(',') : undefined
      );

      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get tenant compliance radar across frameworks
   * GET /api/v1/compliance/visualization/radar/tenant
   */
  router.get('/radar/tenant', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.query;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId query parameter is required' });
        return;
      }

      const data = await visualizationService.getTenantComplianceRadar(tenantId as string);
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // Treemaps
  // ==========================================================================

  /**
   * Get control hierarchy treemap
   * GET /api/v1/compliance/visualization/treemap
   */
  router.get('/treemap', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { frameworkId } = req.query;

      const data = await visualizationService.getControlTreemap(frameworkId as string);
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // Dashboard
  // ==========================================================================

  /**
   * Get comprehensive dashboard data
   * GET /api/v1/compliance/visualization/dashboard
   */
  router.get('/dashboard', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.query;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId query parameter is required' });
        return;
      }

      const data = await visualizationService.getDashboardData(tenantId as string);
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // Z-Inspection Visualizations
  // ==========================================================================

  /**
   * Get Z-Inspection report visualization data
   * GET /api/v1/compliance/visualization/z-inspection/:reportId
   */
  router.get('/z-inspection/:reportId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await visualizationService.getZInspectionVisualization(req.params.reportId);
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // Cache Management
  // ==========================================================================

  /**
   * Clear visualization cache
   * POST /api/v1/compliance/visualization/cache/clear
   */
  router.post('/cache/clear', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { chartType } = req.body;
      const deleted = await visualizationService.clearCache(chartType);
      res.json({ success: true, entriesDeleted: deleted });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Clean expired cache entries
   * POST /api/v1/compliance/visualization/cache/clean
   */
  router.post('/cache/clean', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await visualizationService.cleanExpiredCache();
      res.json({ success: true, entriesDeleted: deleted });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
