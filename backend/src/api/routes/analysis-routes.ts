/**
 * Cross-Analysis API Routes
 *
 * Endpoints for cross-framework analysis, gap analysis,
 * requirement coverage, and Z-Inspection control mapping.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

import { CrossAnalysisService } from '../../services/cross-analysis-service';

// ============================================================================
// Route Factory
// ============================================================================

export function createAnalysisRoutes(pool: Pool): Router {
  const router = Router();
  const crossAnalysisService = new CrossAnalysisService(pool);

  // ==========================================================================
  // Cross-Framework Analysis
  // ==========================================================================

  /**
   * Get cross-framework control mapping matrix
   * GET /api/v1/compliance/analysis/cross-framework
   */
  router.get('/cross-framework', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.query;
      const matrix = await crossAnalysisService.getControlMappingMatrix(tenantId as string);
      res.json(matrix);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get framework overlap statistics
   * GET /api/v1/compliance/analysis/cross-framework/overlap
   */
  router.get('/cross-framework/overlap', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { framework1, framework2 } = req.query;

      if (!framework1 || !framework2) {
        res.status(400).json({ error: 'framework1 and framework2 query parameters are required' });
        return;
      }

      const overlap = await crossAnalysisService.getFrameworkOverlap(
        framework1 as string,
        framework2 as string
      );

      if (!overlap) {
        res.status(404).json({ error: 'No overlap data found' });
        return;
      }

      res.json(overlap);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Create control cross-reference
   * POST /api/v1/compliance/analysis/cross-framework/mappings
   */
  router.post('/cross-framework/mappings', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sourceControlId, targetControlId, relationshipType, confidence, rationale } = req.body;

      if (!sourceControlId || !targetControlId || !relationshipType) {
        res.status(400).json({
          error: 'sourceControlId, targetControlId, and relationshipType are required'
        });
        return;
      }

      const mapping = await crossAnalysisService.createCrossReference(
        sourceControlId,
        targetControlId,
        relationshipType,
        confidence || 0.8,
        'manual',
        rationale
      );

      res.status(201).json(mapping);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Find equivalent controls for a given control
   * GET /api/v1/compliance/analysis/cross-framework/equivalents/:controlId
   */
  router.get('/cross-framework/equivalents/:controlId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const equivalents = await crossAnalysisService.findEquivalentControls(req.params.controlId);
      res.json(equivalents);
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // Requirement Coverage
  // ==========================================================================

  /**
   * Get 7 EU requirements coverage across all frameworks
   * GET /api/v1/compliance/analysis/requirement-coverage
   */
  router.get('/requirement-coverage', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const coverage = await crossAnalysisService.getRequirementCoverage();
      res.json(coverage);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get controls for a specific requirement grouped by framework
   * GET /api/v1/compliance/analysis/requirements/:requirementId/controls
   */
  router.get('/requirements/:requirementId/controls', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const controls = await crossAnalysisService.getControlsForRequirement(
        req.params.requirementId as any
      );
      res.json(controls);
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // Gap Analysis
  // ==========================================================================

  /**
   * Run gap analysis for a tenant
   * GET /api/v1/compliance/analysis/gap-analysis
   */
  router.get('/gap-analysis', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.query;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId query parameter is required' });
        return;
      }

      const analysis = await crossAnalysisService.identifyGaps(tenantId as string);
      res.json(analysis);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get unmapped controls
   * GET /api/v1/compliance/analysis/unmapped-controls
   */
  router.get('/unmapped-controls', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.query;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId query parameter is required' });
        return;
      }

      const unmapped = await crossAnalysisService.findUnmappedControls(tenantId as string);
      res.json(unmapped);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get unmapped requirements
   * GET /api/v1/compliance/analysis/unmapped-requirements
   */
  router.get('/unmapped-requirements', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.query;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId query parameter is required' });
        return;
      }

      const unmapped = await crossAnalysisService.findUnmappedRequirements(tenantId as string);
      res.json(unmapped);
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // Z-Inspection Control Mapping
  // ==========================================================================

  /**
   * Map Z-Inspection findings to controls
   * POST /api/v1/compliance/analysis/z-inspection/map-finding
   */
  router.post('/z-inspection/map-finding', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { findingId } = req.body;

      if (!findingId) {
        res.status(400).json({ error: 'findingId is required' });
        return;
      }

      const links = await crossAnalysisService.mapZInspectionToControls(findingId);
      res.json({ links, count: links.length });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Adjust control weights based on Z-Inspection report
   * POST /api/v1/compliance/analysis/z-inspection/adjust-weights
   */
  router.post('/z-inspection/adjust-weights', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reportId } = req.body;

      if (!reportId) {
        res.status(400).json({ error: 'reportId is required' });
        return;
      }

      const adjustments = await crossAnalysisService.adjustControlWeights(reportId);
      res.json({ adjustments, count: adjustments.length });
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // Saved Queries
  // ==========================================================================

  /**
   * Save an analysis query
   * POST /api/v1/compliance/analysis/queries
   */
  router.post('/queries', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, name, queryType, parameters, scheduleFrequency } = req.body;

      if (!tenantId || !name || !queryType) {
        res.status(400).json({ error: 'tenantId, name, and queryType are required' });
        return;
      }

      const query = await crossAnalysisService.saveAnalysisQuery(
        tenantId,
        name,
        queryType,
        parameters || {},
        scheduleFrequency
      );

      res.status(201).json(query);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Run a saved query
   * POST /api/v1/compliance/analysis/queries/:id/run
   */
  router.post('/queries/:id/run', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await crossAnalysisService.runSavedQuery(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // AI-Powered Analysis
  // ==========================================================================

  /**
   * Perform AI-powered cross-framework analysis
   * POST /api/v1/compliance/analysis/ai-analyze
   */
  router.post('/ai-analyze', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { query, tenantId, frameworks, requirementFocus } = req.body;

      if (!query || !tenantId) {
        res.status(400).json({ error: 'query and tenantId are required' });
        return;
      }

      const result = await crossAnalysisService.aiAnalyzeCrossFramework(query, {
        tenantId,
        frameworks,
        requirementFocus
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
