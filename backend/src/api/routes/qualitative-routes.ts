/**
 * Qualitative Assessment API Routes
 *
 * Endpoints for managing trustworthiness assessments, stakeholders,
 * scenarios, ethical tensions, and Z-Inspection reports.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

import { StakeholderService } from '../../services/stakeholder-service';
import { ScenarioService } from '../../services/scenario-service';
import { TensionService } from '../../services/tension-service';
import { QualitativeAssessmentService } from '../../services/qualitative-assessment-service';
import { ZInspectionService } from '../../services/z-inspection-service';

// ============================================================================
// Route Factory
// ============================================================================

export function createQualitativeRoutes(pool: Pool): Router {
  const router = Router();

  const stakeholderService = new StakeholderService(pool);
  const scenarioService = new ScenarioService(pool);
  const tensionService = new TensionService(pool);
  const assessmentService = new QualitativeAssessmentService(pool);
  const zInspectionService = new ZInspectionService(pool);

  // ==========================================================================
  // Trustworthiness Assessments
  // ==========================================================================

  /**
   * Create a new trustworthiness assessment
   * POST /api/v1/compliance/trustworthiness/assessments
   */
  router.post('/trustworthiness/assessments', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, aiSystemId, title, assessmentType, assessors, methodology, scope } = req.body;

      if (!tenantId || !title) {
        res.status(400).json({ error: 'tenantId and title are required' });
        return;
      }

      const assessment = await assessmentService.createAssessment(tenantId, {
        aiSystemId,
        title,
        assessmentType: assessmentType || 'comprehensive',
        assessors,
        methodology,
        scope
      });

      res.status(201).json(assessment);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get assessment by ID
   * GET /api/v1/compliance/trustworthiness/assessments/:id
   */
  router.get('/trustworthiness/assessments/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.query;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId query parameter is required' });
        return;
      }

      const assessment = await assessmentService.getAssessment(tenantId as string, req.params.id);

      if (!assessment) {
        res.status(404).json({ error: 'Assessment not found' });
        return;
      }

      res.json(assessment);
    } catch (error) {
      next(error);
    }
  });

  /**
   * List assessments for a tenant
   * GET /api/v1/compliance/trustworthiness/assessments
   */
  router.get('/trustworthiness/assessments', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, aiSystemId, status, limit, offset } = req.query;

      if (!tenantId || !aiSystemId) {
        res.status(400).json({ error: 'tenantId and aiSystemId query parameters are required' });
        return;
      }

      const result = await assessmentService.listAssessments(
        tenantId as string,
        aiSystemId as string,
        { status: status as any },
        {
          page: offset ? Math.floor(parseInt(offset as string, 10) / (parseInt(limit as string, 10) || 20)) + 1 : 1,
          limit: limit ? parseInt(limit as string, 10) : 20
        }
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Update requirement assessment
   * PUT /api/v1/compliance/trustworthiness/assessments/:id/requirements/:requirementId
   */
  router.put('/trustworthiness/assessments/:id/requirements/:requirementId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, rating, narrative, evidence, assessedBy } = req.body;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId is required' });
        return;
      }

      const assessment = await assessmentService.updateRequirementAssessment(
        tenantId,
        req.params.id,
        req.params.requirementId as any,
        {
          rating,
          narrative,
          evidenceRefs: evidence
        }
      );

      if (!assessment) {
        res.status(404).json({ error: 'Assessment not found' });
        return;
      }

      res.json(assessment);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get trustworthiness dashboard
   * GET /api/v1/compliance/trustworthiness/assessments/:id/dashboard
   */
  router.get('/trustworthiness/assessments/:id/dashboard', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, aiSystemId } = req.query;

      if (!tenantId || !aiSystemId) {
        res.status(400).json({ error: 'tenantId and aiSystemId query parameters are required' });
        return;
      }

      const dashboard = await assessmentService.getDashboard(tenantId as string, aiSystemId as string);

      if (!dashboard) {
        res.status(404).json({ error: 'Assessment not found' });
        return;
      }

      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get requirement coverage
   * GET /api/v1/compliance/trustworthiness/coverage
   */
  router.get('/trustworthiness/coverage', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, aiSystemId } = req.query;

      if (!tenantId || !aiSystemId) {
        res.status(400).json({ error: 'tenantId and aiSystemId query parameters are required' });
        return;
      }

      const coverage = await assessmentService.getRequirementCoverage(tenantId as string, aiSystemId as string);
      res.json(coverage);
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // Qualitative Findings
  // ==========================================================================

  /**
   * Create a finding
   * POST /api/v1/compliance/trustworthiness/assessments/:assessmentId/findings
   */
  router.post('/trustworthiness/assessments/:assessmentId/findings', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, aiSystemId, findingType, requirementId, title, description, evidenceDescription, evidenceSources, recommendation, recommendedActions, severity, category, priority, relatedControls, identifiedBy } = req.body;

      if (!tenantId || !findingType || !title) {
        res.status(400).json({ error: 'tenantId, findingType and title are required' });
        return;
      }

      const finding = await assessmentService.createFinding(tenantId, {
        assessmentId: req.params.assessmentId,
        aiSystemId,
        findingType,
        requirementId,
        title,
        description,
        evidenceDescription,
        evidenceSources,
        recommendation,
        recommendedActions,
        severity,
        category,
        priority,
        relatedControls
      }, identifiedBy);

      res.status(201).json(finding);
    } catch (error) {
      next(error);
    }
  });

  /**
   * List findings for an assessment
   * GET /api/v1/compliance/trustworthiness/assessments/:assessmentId/findings
   */
  router.get('/trustworthiness/assessments/:assessmentId/findings', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, findingType, requirementId, status } = req.query;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId query parameter is required' });
        return;
      }

      const findings = await assessmentService.listFindings(
        tenantId as string,
        req.params.assessmentId,
        {
          findingType: findingType as any,
          requirementId: requirementId as any,
          status: status as any
        }
      );

      res.json(findings);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Update finding status
   * PATCH /api/v1/compliance/trustworthiness/findings/:id/status
   */
  router.patch('/trustworthiness/findings/:id/status', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, status, resolutionNotes } = req.body;

      if (!tenantId || !status) {
        res.status(400).json({ error: 'tenantId and status are required' });
        return;
      }

      const finding = await assessmentService.updateFindingStatus(
        tenantId,
        req.params.id,
        status,
        resolutionNotes
      );

      if (!finding) {
        res.status(404).json({ error: 'Finding not found' });
        return;
      }

      res.json(finding);
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // Stakeholders
  // ==========================================================================

  /**
   * Register a stakeholder
   * POST /api/v1/compliance/stakeholders
   */
  router.post('/stakeholders', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, aiSystemId, name, stakeholderType, category, description, impactLevel, impactDescription, powerLevel, interestLevel, isVulnerableGroup, vulnerabilityFactors, keyConcerns, keyInterests, createdBy } = req.body;

      if (!tenantId || !name || !stakeholderType) {
        res.status(400).json({ error: 'tenantId, name, and stakeholderType are required' });
        return;
      }

      const stakeholder = await stakeholderService.createStakeholder(tenantId, {
        aiSystemId,
        name,
        stakeholderType,
        category,
        description,
        impactLevel,
        impactDescription,
        powerLevel,
        interestLevel,
        isVulnerableGroup,
        vulnerabilityFactors,
        keyConcerns,
        keyInterests
      }, createdBy);

      res.status(201).json(stakeholder);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get stakeholder by ID
   * GET /api/v1/compliance/stakeholders/:id
   */
  router.get('/stakeholders/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.query;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId query parameter is required' });
        return;
      }

      const stakeholder = await stakeholderService.getStakeholder(tenantId as string, req.params.id);

      if (!stakeholder) {
        res.status(404).json({ error: 'Stakeholder not found' });
        return;
      }

      res.json(stakeholder);
    } catch (error) {
      next(error);
    }
  });

  /**
   * List stakeholders
   * GET /api/v1/compliance/stakeholders
   */
  router.get('/stakeholders', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, aiSystemId, stakeholderType, impactLevel, isVulnerableGroup, limit, offset } = req.query;

      if (!tenantId || !aiSystemId) {
        res.status(400).json({ error: 'tenantId and aiSystemId query parameters are required' });
        return;
      }

      const result = await stakeholderService.listStakeholders(
        tenantId as string,
        aiSystemId as string,
        {
          stakeholderType: stakeholderType as any,
          impactLevel: impactLevel as any,
          isVulnerableGroup: isVulnerableGroup === 'true'
        },
        {
          page: offset ? Math.floor(parseInt(offset as string, 10) / (parseInt(limit as string, 10) || 20)) + 1 : 1,
          limit: limit ? parseInt(limit as string, 10) : 20
        }
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Record stakeholder engagement
   * POST /api/v1/compliance/stakeholders/:id/engagement
   */
  router.post('/stakeholders/:id/engagement', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        tenantId,
        engagementType,
        engagementDate,
        durationMinutes,
        participants,
        summary,
        keyInsights,
        concernsRaised,
        suggestions,
        followUpRequired,
        followUpNotes,
        evidenceId,
        createdBy
      } = req.body;

      if (!tenantId || !engagementType) {
        res.status(400).json({ error: 'tenantId and engagementType are required' });
        return;
      }

      const engagement = await stakeholderService.recordEngagement(
        tenantId,
        req.params.id,
        {
          engagementType,
          engagementDate: engagementDate ? new Date(engagementDate) : new Date(),
          durationMinutes,
          participants: participants || [],
          summary: summary || '',
          keyInsights: keyInsights || [],
          concernsRaised: concernsRaised || [],
          suggestions: suggestions || [],
          followUpRequired: followUpRequired || false,
          followUpNotes,
          evidenceId,
          createdBy
        }
      );

      res.status(201).json(engagement);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get stakeholder impact analysis
   * GET /api/v1/compliance/stakeholders/:id/impact
   */
  router.get('/stakeholders/:id/impact', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.query;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId query parameter is required' });
        return;
      }

      const impact = await stakeholderService.getImpactAnalysis(tenantId as string, req.params.id);
      res.json(impact);
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // Scenarios
  // ==========================================================================

  /**
   * Create a socio-technical scenario
   * POST /api/v1/compliance/scenarios
   */
  router.post('/scenarios', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, aiSystemId, title, scenarioType, description, narrative, contextSetting, actors, preconditions, primaryRequirement, affectedRequirements, likelihood, severity, potentialHarms, potentialBenefits, mitigations, createdBy } = req.body;

      if (!tenantId || !title || !scenarioType) {
        res.status(400).json({ error: 'tenantId, title, and scenarioType are required' });
        return;
      }

      const scenario = await scenarioService.createScenario(tenantId, {
        aiSystemId,
        title,
        scenarioType,
        description,
        narrative,
        contextSetting,
        actors,
        preconditions,
        primaryRequirement,
        affectedRequirements,
        likelihood,
        severity,
        potentialHarms,
        potentialBenefits,
        mitigations
      }, createdBy);

      res.status(201).json(scenario);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get scenario by ID
   * GET /api/v1/compliance/scenarios/:id
   */
  router.get('/scenarios/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.query;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId query parameter is required' });
        return;
      }

      const scenario = await scenarioService.getScenario(tenantId as string, req.params.id);

      if (!scenario) {
        res.status(404).json({ error: 'Scenario not found' });
        return;
      }

      res.json(scenario);
    } catch (error) {
      next(error);
    }
  });

  /**
   * List scenarios
   * GET /api/v1/compliance/scenarios
   */
  router.get('/scenarios', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, aiSystemId, scenarioType, status, minRiskScore, limit, offset } = req.query;

      if (!tenantId || !aiSystemId) {
        res.status(400).json({ error: 'tenantId and aiSystemId query parameters are required' });
        return;
      }

      const result = await scenarioService.listScenarios(
        tenantId as string,
        aiSystemId as string,
        {
          scenarioType: scenarioType as any,
          status: status as any,
          minRiskScore: minRiskScore ? parseInt(minRiskScore as string, 10) : undefined
        },
        {
          page: offset ? Math.floor(parseInt(offset as string, 10) / (parseInt(limit as string, 10) || 20)) + 1 : 1,
          limit: limit ? parseInt(limit as string, 10) : 20
        }
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * AI-generate scenarios for an AI system
   * POST /api/v1/compliance/scenarios/generate
   */
  router.post('/scenarios/generate', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, aiSystemId, focusRequirement, generatedScenarios, generationPrompt, createdBy } = req.body;

      if (!tenantId || !aiSystemId || !generatedScenarios) {
        res.status(400).json({ error: 'tenantId, aiSystemId, and generatedScenarios are required' });
        return;
      }

      const scenarios = await scenarioService.storeGeneratedScenarios(
        tenantId,
        { aiSystemId, focusRequirement },
        generatedScenarios,
        generationPrompt || 'Manual entry',
        createdBy
      );

      res.status(201).json({ scenarios, count: scenarios.length });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get scenario statistics
   * GET /api/v1/compliance/scenarios/stats
   */
  router.get('/scenarios/stats', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, aiSystemId } = req.query;

      if (!tenantId || !aiSystemId) {
        res.status(400).json({ error: 'tenantId and aiSystemId query parameters are required' });
        return;
      }

      const stats = await scenarioService.getScenarioStats(tenantId as string, aiSystemId as string);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // Ethical Tensions
  // ==========================================================================

  /**
   * Create an ethical tension
   * POST /api/v1/compliance/tensions
   */
  router.post('/tensions', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, aiSystemId, scenarioId, title, description, valueA, valueADescription, valueB, valueBDescription, tensionType, requirementA, requirementB, affectedStakeholders, severity, createdBy } = req.body;

      if (!tenantId || !valueA || !valueB || !tensionType) {
        res.status(400).json({ error: 'tenantId, valueA, valueB, and tensionType are required' });
        return;
      }

      const tension = await tensionService.createTension(tenantId, {
        aiSystemId,
        scenarioId,
        title,
        description,
        valueA,
        valueADescription,
        valueB,
        valueBDescription,
        tensionType,
        requirementA,
        requirementB,
        affectedStakeholders,
        severity: severity || 'moderate'
      }, createdBy);

      res.status(201).json(tension);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get tension by ID
   * GET /api/v1/compliance/tensions/:id
   */
  router.get('/tensions/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.query;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId query parameter is required' });
        return;
      }

      const tension = await tensionService.getTension(tenantId as string, req.params.id);

      if (!tension) {
        res.status(404).json({ error: 'Tension not found' });
        return;
      }

      res.json(tension);
    } catch (error) {
      next(error);
    }
  });

  /**
   * List tensions
   * GET /api/v1/compliance/tensions
   */
  router.get('/tensions', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, aiSystemId, severity, status, requirementId, limit, offset } = req.query;

      if (!tenantId || !aiSystemId) {
        res.status(400).json({ error: 'tenantId and aiSystemId query parameters are required' });
        return;
      }

      const result = await tensionService.listTensions(
        tenantId as string,
        aiSystemId as string,
        {
          severity: severity as any,
          status: status as any,
          requirementId: requirementId as any
        },
        {
          page: offset ? Math.floor(parseInt(offset as string, 10) / (parseInt(limit as string, 10) || 20)) + 1 : 1,
          limit: limit ? parseInt(limit as string, 10) : 20
        }
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Resolve a tension
   * POST /api/v1/compliance/tensions/:id/resolve
   */
  router.post('/tensions/:id/resolve', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, resolutionApproach, resolutionRationale, tradeOffDecision, residualConcerns, newStatus, resolvedBy } = req.body;

      if (!tenantId || !resolutionApproach || !resolutionRationale) {
        res.status(400).json({ error: 'tenantId, resolutionApproach and resolutionRationale are required' });
        return;
      }

      const tension = await tensionService.resolveTension(
        tenantId,
        req.params.id,
        {
          resolutionApproach,
          resolutionRationale,
          tradeOffDecision,
          residualConcerns,
          newStatus: newStatus || 'mitigated'
        },
        resolvedBy
      );

      if (!tension) {
        res.status(404).json({ error: 'Tension not found' });
        return;
      }

      res.json(tension);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Add stakeholder perspective to tension
   * POST /api/v1/compliance/tensions/:id/perspectives
   */
  router.post('/tensions/:id/perspectives', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, stakeholderId, perspective, preferredResolution } = req.body;

      if (!tenantId || !stakeholderId || !perspective) {
        res.status(400).json({ error: 'tenantId, stakeholderId and perspective are required' });
        return;
      }

      const tension = await tensionService.addStakeholderPerspective(
        tenantId,
        req.params.id,
        stakeholderId,
        {
          perspective,
          preferredResolution
        }
      );

      if (!tension) {
        res.status(404).json({ error: 'Tension not found' });
        return;
      }

      res.json(tension);
    } catch (error) {
      next(error);
    }
  });

  /**
   * AI-identify tensions from scenarios
   * POST /api/v1/compliance/tensions/identify
   */
  router.post('/tensions/identify', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, aiSystemId, identifiedTensions, aiAnalysisContext, createdBy } = req.body;

      if (!tenantId || !aiSystemId || !identifiedTensions) {
        res.status(400).json({ error: 'tenantId, aiSystemId and identifiedTensions are required' });
        return;
      }

      const tensions = await tensionService.storeIdentifiedTensions(
        tenantId,
        aiSystemId,
        identifiedTensions,
        aiAnalysisContext || {},
        createdBy
      );

      res.status(201).json({ tensions, count: tensions.length });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get tension statistics
   * GET /api/v1/compliance/tensions/stats
   */
  router.get('/tensions/stats', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, aiSystemId } = req.query;

      if (!tenantId || !aiSystemId) {
        res.status(400).json({ error: 'tenantId and aiSystemId query parameters are required' });
        return;
      }

      const stats = await tensionService.getTensionStats(tenantId as string, aiSystemId as string);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // Z-Inspection
  // ==========================================================================

  /**
   * Import Z-Inspection report
   * POST /api/v1/compliance/z-inspection/import
   */
  router.post('/z-inspection/import', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, aiSystemId, title, reportDate, inspectionTeam, importMethod, content, sourceDocumentType, sourceDocumentUrl, createdBy } = req.body;

      if (!tenantId || !title || !importMethod || !content) {
        res.status(400).json({ error: 'tenantId, title, importMethod, and content are required' });
        return;
      }

      const report = await zInspectionService.importReport(tenantId, {
        aiSystemId,
        title,
        reportDate: reportDate ? new Date(reportDate) : new Date(),
        inspectionTeam,
        importMethod,
        content,
        sourceDocumentType,
        sourceDocumentUrl
      }, createdBy);

      res.status(201).json(report);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get Z-Inspection report by ID
   * GET /api/v1/compliance/z-inspection/reports/:id
   */
  router.get('/z-inspection/reports/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.query;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId query parameter is required' });
        return;
      }

      const report = await zInspectionService.getReport(tenantId as string, req.params.id);

      if (!report) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }

      res.json(report);
    } catch (error) {
      next(error);
    }
  });

  /**
   * List Z-Inspection reports
   * GET /api/v1/compliance/z-inspection/reports
   */
  router.get('/z-inspection/reports', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, aiSystemId, status, limit, offset } = req.query;

      if (!tenantId || !aiSystemId) {
        res.status(400).json({ error: 'tenantId and aiSystemId query parameters are required' });
        return;
      }

      const result = await zInspectionService.listReports(
        tenantId as string,
        aiSystemId as string,
        { status: status as any },
        {
          page: offset ? Math.floor(parseInt(offset as string, 10) / (parseInt(limit as string, 10) || 20)) + 1 : 1,
          limit: limit ? parseInt(limit as string, 10) : 20
        }
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Process Z-Inspection report
   * POST /api/v1/compliance/z-inspection/reports/:id/process
   */
  router.post('/z-inspection/reports/:id/process', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.body;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId is required' });
        return;
      }

      const processedReport = await zInspectionService.processReport(tenantId, req.params.id);

      if (!processedReport) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }

      res.json(processedReport);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Create assessment from Z-Inspection report
   * POST /api/v1/compliance/z-inspection/reports/:id/create-assessment
   */
  router.post('/z-inspection/reports/:id/create-assessment', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, assessmentTitle, createdBy } = req.body;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId is required' });
        return;
      }

      const result = await zInspectionService.createAssessmentFromReport(
        tenantId,
        req.params.id,
        assessmentTitle,
        createdBy
      );

      if (!result) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get monitoring rules from Z-Inspection report
   * GET /api/v1/compliance/z-inspection/reports/:id/monitoring-rules
   */
  router.get('/z-inspection/reports/:id/monitoring-rules', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.query;

      if (!tenantId) {
        res.status(400).json({ error: 'tenantId query parameter is required' });
        return;
      }

      const rules = await zInspectionService.generateMonitoringRules(tenantId as string, req.params.id);
      res.json(rules);
    } catch (error) {
      next(error);
    }
  });

  // ==========================================================================
  // Trustworthy AI Requirements
  // ==========================================================================

  /**
   * List 7 trustworthy AI requirements
   * GET /api/v1/compliance/requirements
   */
  router.get('/requirements', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await pool.query(
        `SELECT id, name, description, assessment_criteria, key_indicators
         FROM trustworthy_ai_requirements
         ORDER BY id`
      );

      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  });

  /**
   * Get requirement with mapped controls
   * GET /api/v1/compliance/requirements/:id/controls
   */
  router.get('/requirements/:id/controls', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await pool.query(
        `SELECT
          rcm.control_id,
          rcm.mapping_strength,
          rcm.mapping_rationale,
          c.title as control_title,
          c.description as control_description,
          c.framework_id,
          f.name as framework_name
         FROM requirement_control_mappings rcm
         JOIN compliance_controls c ON rcm.control_id = c.id
         JOIN compliance_frameworks f ON c.framework_id = f.id
         WHERE rcm.requirement_id = $1
         AND c.is_active = true
         ORDER BY f.name, rcm.mapping_strength DESC`,
        [req.params.id]
      );

      res.json(result.rows);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
