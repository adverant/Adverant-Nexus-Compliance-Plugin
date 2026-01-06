/**
 * Learning System API Routes
 *
 * Endpoints for regulatory monitoring, framework discovery,
 * control generation, and auto-assessment scheduling.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

import { RegulatoryMonitorService } from '../../services/regulatory-monitor-service';
import { FrameworkDiscovererService } from '../../services/framework-discoverer-service';
import { ControlGeneratorService } from '../../services/control-generator-service';
import { AutoAssessmentService } from '../../services/auto-assessment-service';

// ============================================================================
// Route Factory
// ============================================================================

export function createLearningRoutes(pool: Pool): Router {
  const router = Router();

  const regulatoryMonitorService = new RegulatoryMonitorService(pool);
  const frameworkDiscovererService = new FrameworkDiscovererService(pool);
  const controlGeneratorService = new ControlGeneratorService(pool);
  const autoAssessmentService = new AutoAssessmentService(pool);

  // ==========================================================================
  // Regulatory Sources
  // ==========================================================================

  /**
   * List regulatory sources
   * GET /api/v1/compliance/learning/sources
   */
  router.get('/sources', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { isActive, jurisdiction, category } = req.query;

      const result = await regulatoryMonitorService.listSources({
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        jurisdiction: jurisdiction as string,
        category: category as string
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Add a regulatory source
   * POST /api/v1/compliance/learning/sources
   */
  router.post('/sources', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, sourceType, url, jurisdiction, category, relatedFrameworks, checkFrequency, contentSelectors, changeDetectionMethod, isActive, status, metadata } = req.body;

      if (!name || !sourceType || !url) {
        res.status(400).json({ error: 'name, sourceType, and url are required' });
        return;
      }

      const source = await regulatoryMonitorService.addSource({
        name,
        sourceType,
        url,
        jurisdiction,
        category,
        relatedFrameworks,
        checkFrequency: checkFrequency || 'daily',
        contentSelectors,
        changeDetectionMethod,
        isActive: isActive !== false,
        status: status || 'active',
        metadata
      });

      res.status(201).json(source);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Force check a source for updates
   * POST /api/v1/compliance/learning/sources/:id/check
   */
  router.post('/sources/:id/check', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updates = await regulatoryMonitorService.checkForUpdates(req.params.id);
      res.json({ updates, count: updates.length });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Run scheduled checks for all due sources
   * POST /api/v1/compliance/learning/sources/run-scheduled
   */
  router.post('/sources/run-scheduled', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await regulatoryMonitorService.runScheduledChecks();
      res.json({ success: true, message: 'Scheduled checks initiated' });
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // Regulatory Updates
  // ==========================================================================

  /**
   * List regulatory updates
   * GET /api/v1/compliance/learning/updates
   */
  router.get('/updates', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sourceId, frameworkId, status, updateType, impactLevel } = req.query;

      const result = await regulatoryMonitorService.listUpdates({
        sourceId: sourceId as string,
        frameworkId: frameworkId as string,
        status: status as any,
        updateType: updateType as any,
        impactLevel: impactLevel as any
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get update details
   * GET /api/v1/compliance/learning/updates/:id
   */
  router.get('/updates/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const update = await regulatoryMonitorService.getUpdate(req.params.id);

      if (!update) {
        res.status(404).json({ error: 'Update not found' });
        return;
      }

      res.json(update);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Implement an update (generate controls)
   * POST /api/v1/compliance/learning/updates/:id/implement
   */
  router.post('/updates/:id/implement', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { implementedBy } = req.body;

      // Generate controls from the update
      const generationResult = await controlGeneratorService.generateControlsFromUpdate(req.params.id);

      if (generationResult.status === 'failed') {
        res.status(500).json({ error: 'Failed to generate controls', details: generationResult.errors });
        return;
      }

      // Mark the update as implemented
      await regulatoryMonitorService.markImplemented(req.params.id, implementedBy);

      res.json({
        success: true,
        controlsGenerated: generationResult.controlsGenerated,
        controls: generationResult.controls
      });
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // Entity Profile & Framework Discovery
  // ==========================================================================

  /**
   * Get entity profile
   * GET /api/v1/compliance/learning/profile
   */
  router.get('/profile', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.query;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId query parameter is required' });
        return;
      }

      const profile = await frameworkDiscovererService.getEntityProfile(tenantId as string);

      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      res.json(profile);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Create or update entity profile
   * PUT /api/v1/compliance/learning/profile
   */
  router.put('/profile', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        tenantId, entityName, industry, subIndustry, jurisdictions,
        entitySize, isPubliclyTraded, processesPersonalData, usesAiSystems,
        isCriticalInfrastructure, dataCategories, annualRevenue, employeeCount, metadata
      } = req.body;

      if (!tenantId || !entityName || !industry || !jurisdictions || !entitySize) {
        res.status(400).json({
          error: 'tenantId, entityName, industry, jurisdictions, and entitySize are required'
        });
        return;
      }

      // Check if profile exists
      const existing = await frameworkDiscovererService.getEntityProfile(tenantId);

      let profile;
      if (existing) {
        profile = await frameworkDiscovererService.updateEntityProfile(tenantId, {
          entityName, industry, subIndustry, jurisdictions, entitySize,
          isPubliclyTraded, processesPersonalData, usesAiSystems,
          isCriticalInfrastructure, dataCategories, annualRevenue, employeeCount, metadata
        });
      } else {
        profile = await frameworkDiscovererService.createEntityProfile({
          tenantId, entityName, industry, subIndustry, jurisdictions,
          entitySize, isPubliclyTraded, processesPersonalData, usesAiSystems,
          isCriticalInfrastructure, dataCategories, annualRevenue, employeeCount, metadata
        });
      }

      res.json(profile);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Discover applicable frameworks for entity
   * POST /api/v1/compliance/learning/discover
   */
  router.post('/discover', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.body;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId is required' });
        return;
      }

      const suggestions = await frameworkDiscovererService.discoverApplicableFrameworks(tenantId);
      res.json({ suggestions, count: suggestions.length });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get framework suggestions
   * GET /api/v1/compliance/learning/suggestions
   */
  router.get('/suggestions', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.query;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId query parameter is required' });
        return;
      }

      // Get suggestions (runs discovery if not cached)
      const suggestions = await frameworkDiscovererService.discoverApplicableFrameworks(tenantId as string);
      res.json(suggestions);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Accept a framework suggestion
   * POST /api/v1/compliance/learning/suggestions/:id/accept
   */
  router.post('/suggestions/:id/accept', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.body;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId is required' });
        return;
      }

      const result = await frameworkDiscovererService.acceptSuggestion(tenantId, req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Reject a framework suggestion
   * POST /api/v1/compliance/learning/suggestions/:id/reject
   */
  router.post('/suggestions/:id/reject', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, reason } = req.body;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId is required' });
        return;
      }

      const result = await frameworkDiscovererService.rejectSuggestion(tenantId, req.params.id, reason);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Analyze framework relevance for entity
   * GET /api/v1/compliance/learning/analyze-relevance
   */
  router.get('/analyze-relevance', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, frameworkId } = req.query;

      if (!tenantId || !frameworkId) {
        res.status(400).json({ error: 'tenantId and frameworkId query parameters are required' });
        return;
      }

      const analysis = await frameworkDiscovererService.analyzeFrameworkRelevance(
        tenantId as string,
        frameworkId as string
      );

      res.json(analysis);
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // Control Generation
  // ==========================================================================

  /**
   * Generate controls from URL
   * POST /api/v1/compliance/learning/generate-from-url
   */
  router.post('/generate-from-url', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { documentUrl, frameworkId, frameworkName, context } = req.body;

      if (!documentUrl || !frameworkId || !frameworkName) {
        res.status(400).json({ error: 'documentUrl, frameworkId, and frameworkName are required' });
        return;
      }

      const result = await controlGeneratorService.generateControlsFromUrl(
        documentUrl,
        frameworkId,
        frameworkName,
        context
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Generate controls from text
   * POST /api/v1/compliance/learning/generate-from-text
   */
  router.post('/generate-from-text', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { documentContent, frameworkId, frameworkName, context } = req.body;

      if (!documentContent || !frameworkId || !frameworkName) {
        res.status(400).json({ error: 'documentContent, frameworkId, and frameworkName are required' });
        return;
      }

      const result = await controlGeneratorService.generateControlsFromText(
        documentContent,
        frameworkId,
        frameworkName,
        context
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Validate generated controls
   * POST /api/v1/compliance/learning/validate
   */
  router.post('/validate', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { controls } = req.body;

      if (!controls || !Array.isArray(controls)) {
        res.status(400).json({ error: 'controls array is required' });
        return;
      }

      const validation = await controlGeneratorService.validateControls(controls);
      res.json(validation);
    } catch (error) {
      next(error);
    }
  });

  /**
   * List generated controls
   * GET /api/v1/compliance/learning/generated-controls
   */
  router.get('/generated-controls', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { frameworkId, status, minConfidence } = req.query;

      const result = await controlGeneratorService.listGeneratedControls({
        frameworkId: frameworkId as string,
        status: status as any,
        minConfidence: minConfidence ? parseFloat(minConfidence as string) : undefined
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get controls pending review
   * GET /api/v1/compliance/learning/pending-review
   */
  router.get('/pending-review', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit } = req.query;
      const controls = await controlGeneratorService.getPendingReviewControls(
        limit ? parseInt(limit as string, 10) : undefined
      );
      res.json(controls);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Approve a generated control
   * POST /api/v1/compliance/learning/generated-controls/:id/approve
   */
  router.post('/generated-controls/:id/approve', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reviewedBy, notes } = req.body;

      if (!reviewedBy) {
        res.status(400).json({ error: 'reviewedBy is required' });
        return;
      }

      const control = await controlGeneratorService.approveControl(req.params.id, reviewedBy, notes);

      if (!control) {
        res.status(404).json({ error: 'Control not found' });
        return;
      }

      res.json(control);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Reject a generated control
   * POST /api/v1/compliance/learning/generated-controls/:id/reject
   */
  router.post('/generated-controls/:id/reject', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reviewedBy, reason } = req.body;

      if (!reviewedBy || !reason) {
        res.status(400).json({ error: 'reviewedBy and reason are required' });
        return;
      }

      const control = await controlGeneratorService.rejectControl(req.params.id, reviewedBy, reason);

      if (!control) {
        res.status(404).json({ error: 'Control not found' });
        return;
      }

      res.json(control);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Implement approved controls
   * POST /api/v1/compliance/learning/implement
   */
  router.post('/implement', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { controlIds, reviewedBy } = req.body;

      if (!controlIds || !Array.isArray(controlIds) || !reviewedBy) {
        res.status(400).json({ error: 'controlIds array and reviewedBy are required' });
        return;
      }

      const result = await controlGeneratorService.implementControls(controlIds, reviewedBy);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // Auto Assessment
  // ==========================================================================

  /**
   * Create auto-assessment schedule
   * POST /api/v1/compliance/learning/schedule
   */
  router.post('/schedule', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, frameworkId, frequency, config, notificationConfig } = req.body;

      if (!tenantId || !frameworkId || !frequency) {
        res.status(400).json({ error: 'tenantId, frameworkId, and frequency are required' });
        return;
      }

      const schedule = await autoAssessmentService.createSchedule(
        tenantId,
        frameworkId,
        frequency,
        config,
        notificationConfig
      );

      res.status(201).json(schedule);
    } catch (error) {
      next(error);
    }
  });

  /**
   * List scheduled assessments
   * GET /api/v1/compliance/learning/scheduled
   */
  router.get('/scheduled', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, frameworkId, isActive } = req.query;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId query parameter is required' });
        return;
      }

      const schedules = await autoAssessmentService.listSchedules(tenantId as string, {
        frameworkId: frameworkId as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined
      });

      res.json(schedules);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Update schedule frequency
   * PATCH /api/v1/compliance/learning/scheduled/:id/frequency
   */
  router.patch('/scheduled/:id/frequency', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { frequency } = req.body;

      if (!frequency) {
        res.status(400).json({ error: 'frequency is required' });
        return;
      }

      const schedule = await autoAssessmentService.updateScheduleFrequency(req.params.id, frequency);

      if (!schedule) {
        res.status(404).json({ error: 'Schedule not found' });
        return;
      }

      res.json(schedule);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Enable/disable schedule
   * PATCH /api/v1/compliance/learning/scheduled/:id/active
   */
  router.patch('/scheduled/:id/active', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { isActive } = req.body;

      if (isActive === undefined) {
        res.status(400).json({ error: 'isActive is required' });
        return;
      }

      const schedule = await autoAssessmentService.setScheduleActive(req.params.id, isActive);

      if (!schedule) {
        res.status(404).json({ error: 'Schedule not found' });
        return;
      }

      res.json(schedule);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Run assessment now
   * POST /api/v1/compliance/learning/run/:frameworkId
   */
  router.post('/run/:frameworkId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.body;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId is required' });
        return;
      }

      const result = await autoAssessmentService.runAssessment(tenantId, req.params.frameworkId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Run all scheduled assessments
   * POST /api/v1/compliance/learning/run-scheduled-assessments
   */
  router.post('/run-scheduled-assessments', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const results = await autoAssessmentService.runScheduledAssessments();
      res.json({ results, count: results.length });
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // Learning & Feedback
  // ==========================================================================

  /**
   * Record feedback on an assessment
   * POST /api/v1/compliance/learning/feedback
   */
  router.post('/feedback', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, assessmentId, controlId, eventType, originalRating, feedback, correctedRating, improvementSuggestion } = req.body;

      if (!tenantId || !assessmentId || !controlId || !eventType || !originalRating || !feedback) {
        res.status(400).json({
          error: 'tenantId, assessmentId, controlId, eventType, originalRating, and feedback are required'
        });
        return;
      }

      const result = await autoAssessmentService.recordFeedback(
        tenantId,
        assessmentId,
        controlId,
        eventType,
        originalRating,
        feedback,
        correctedRating,
        improvementSuggestion
      );

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Process pending feedback
   * POST /api/v1/compliance/learning/process-feedback
   */
  router.post('/process-feedback', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await autoAssessmentService.processFeedback();
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Learn from assessment
   * POST /api/v1/compliance/learning/learn-from-assessment
   */
  router.post('/learn-from-assessment', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { assessmentId } = req.body;

      if (!assessmentId) {
        res.status(400).json({ error: 'assessmentId is required' });
        return;
      }

      const result = await autoAssessmentService.learnFromAssessment(assessmentId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get learning metrics
   * GET /api/v1/compliance/learning/metrics
   */
  router.get('/metrics', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.query;
      const metrics = await autoAssessmentService.getLearningMetrics(tenantId as string);
      res.json(metrics);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
