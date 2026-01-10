/**
 * Qualitative Assessment API Routes (Fastify)
 *
 * Endpoints for managing trustworthiness assessments, stakeholders,
 * scenarios, ethical tensions, and Z-Inspection reports.
 */

import { FastifyInstance, FastifyReply } from 'fastify';
import { getPool } from '../../database/client.js';
import { StakeholderService } from '../../services/stakeholder-service.js';
import { ScenarioService } from '../../services/scenario-service.js';
import { TensionService } from '../../services/tension-service.js';
import { QualitativeAssessmentService } from '../../services/qualitative-assessment-service.js';
import { ZInspectionService } from '../../services/z-inspection-service.js';
import {
  getContext,
  handleRouteError,
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendError,
} from '../middleware/index.js';

// Lazy singleton services
let _stakeholderService: StakeholderService | null = null;
let _scenarioService: ScenarioService | null = null;
let _tensionService: TensionService | null = null;
let _assessmentService: QualitativeAssessmentService | null = null;
let _zInspectionService: ZInspectionService | null = null;

function getStakeholderService(): StakeholderService {
  if (!_stakeholderService) {
    _stakeholderService = new StakeholderService(getPool());
  }
  return _stakeholderService;
}

function getScenarioService(): ScenarioService {
  if (!_scenarioService) {
    _scenarioService = new ScenarioService(getPool());
  }
  return _scenarioService;
}

function getTensionService(): TensionService {
  if (!_tensionService) {
    _tensionService = new TensionService(getPool());
  }
  return _tensionService;
}

function getAssessmentService(): QualitativeAssessmentService {
  if (!_assessmentService) {
    _assessmentService = new QualitativeAssessmentService(getPool());
  }
  return _assessmentService;
}

function getZInspectionService(): ZInspectionService {
  if (!_zInspectionService) {
    _zInspectionService = new ZInspectionService(getPool());
  }
  return _zInspectionService;
}

// ============================================================================
// Route Registration
// ============================================================================

export async function qualitativeRoutes(fastify: FastifyInstance): Promise<void> {
  // ==========================================================================
  // Trustworthiness Assessments
  // ==========================================================================

  /**
   * Create a new trustworthiness assessment
   * POST /trustworthiness/assessments
   */
  fastify.post<{
    Body: {
      tenantId?: string;
      aiSystemId?: string;
      title?: string;
      assessmentType?: string;
      assessors?: string[];
      methodology?: string;
      scope?: string;
    };
  }>('/trustworthiness/assessments', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { tenantId, aiSystemId, title, assessmentType, assessors, methodology, scope } = request.body || {};
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default' || !title) {
      return sendError(reply, 'tenantId and title are required');
    }

    try {
      const assessment = await getAssessmentService().createAssessment(effectiveTenantId, {
        aiSystemId: aiSystemId || '',
        title,
        assessmentType: (assessmentType || 'comprehensive') as any,
        assessors,
        methodology,
        scope
      } as any);

      return sendCreated(reply, assessment);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'createAssessment', tenantId: effectiveTenantId });
    }
  });

  /**
   * Get assessment by ID
   * GET /trustworthiness/assessments/:id
   */
  fastify.get<{
    Params: { id: string };
    Querystring: { tenantId?: string };
  }>('/trustworthiness/assessments/:id', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { tenantId } = request.query;
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default') {
      return sendError(reply, 'tenantId query parameter is required');
    }

    try {
      const assessment = await getAssessmentService().getAssessment(effectiveTenantId, id);

      if (!assessment) {
        return sendNotFound(reply, 'Assessment', id);
      }

      return sendSuccess(reply, assessment);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'getAssessment', tenantId: effectiveTenantId, assessmentId: id });
    }
  });

  /**
   * List assessments for a tenant
   * GET /trustworthiness/assessments
   */
  fastify.get<{
    Querystring: {
      tenantId?: string;
      aiSystemId?: string;
      status?: string;
      overallRating?: string;
      page?: string;
      limit?: string;
    };
  }>('/trustworthiness/assessments', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { tenantId, aiSystemId, status, overallRating, page, limit } = request.query;
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default' || !aiSystemId) {
      return sendError(reply, 'tenantId and aiSystemId query parameters are required');
    }

    try {
      const assessments = await getAssessmentService().listAssessments(
        effectiveTenantId,
        aiSystemId,
        {
          status: status as any,
          overallRating: overallRating as any
        },
        {
          page: page ? parseInt(page, 10) : 1,
          limit: limit ? parseInt(limit, 10) : 20
        }
      );

      return sendSuccess(reply, assessments);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'listAssessments', tenantId: effectiveTenantId, aiSystemId });
    }
  });

  /**
   * Update requirement assessment
   * PUT /trustworthiness/assessments/:id/requirements/:requirementId
   */
  fastify.put<{
    Params: { id: string; requirementId: string };
    Body: {
      tenantId?: string;
      rating?: string;
      narrative?: string;
      confidence?: string;
      keyStrengths?: string[];
      keyWeaknesses?: string[];
      evidenceRefs?: string[];
    };
  }>('/trustworthiness/assessments/:id/requirements/:requirementId', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id, requirementId } = request.params;
    const { tenantId, rating, narrative, confidence, keyStrengths, keyWeaknesses, evidenceRefs } = request.body || {};
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default') {
      return sendError(reply, 'tenantId is required in body');
    }

    try {
      const result = await getAssessmentService().updateRequirementAssessment(
        effectiveTenantId,
        id,
        requirementId as any,
        {
          rating: rating as any,
          narrative,
          confidence: confidence as any,
          keyStrengths,
          keyWeaknesses,
          evidenceRefs
        }
      );

      if (!result) {
        return sendNotFound(reply, 'Assessment', id);
      }

      return sendSuccess(reply, result);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'updateRequirementAssessment', tenantId: effectiveTenantId, assessmentId: id, requirementId });
    }
  });

  /**
   * Get trustworthiness dashboard data
   * GET /trustworthiness/dashboard
   */
  fastify.get<{
    Querystring: { tenantId?: string; aiSystemId?: string };
  }>('/trustworthiness/dashboard', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { tenantId, aiSystemId } = request.query;
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default' || !aiSystemId) {
      return sendError(reply, 'tenantId and aiSystemId query parameters are required');
    }

    try {
      const dashboard = await getAssessmentService().getDashboard(effectiveTenantId, aiSystemId);
      return sendSuccess(reply, dashboard);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'getDashboard', tenantId: effectiveTenantId, aiSystemId });
    }
  });

  /**
   * Get requirement coverage report
   * GET /trustworthiness/coverage
   */
  fastify.get<{
    Querystring: { tenantId?: string; aiSystemId?: string };
  }>('/trustworthiness/coverage', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { tenantId, aiSystemId } = request.query;
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default' || !aiSystemId) {
      return sendError(reply, 'tenantId and aiSystemId query parameters are required');
    }

    try {
      const coverage = await getAssessmentService().getRequirementCoverage(effectiveTenantId, aiSystemId);
      return sendSuccess(reply, coverage);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'getRequirementCoverage', tenantId: effectiveTenantId, aiSystemId });
    }
  });

  /**
   * Create finding for assessment
   * POST /trustworthiness/assessments/:assessmentId/findings
   */
  fastify.post<{
    Params: { assessmentId: string };
    Body: {
      tenantId?: string;
      aiSystemId?: string;
      requirementId?: string;
      findingType?: string;
      title?: string;
      description?: string;
      severity?: string;
      priority?: string;
      evidenceDescription?: string;
      evidenceSources?: string[];
      recommendation?: string;
      recommendedActions?: Array<{ action: string; priority?: string; assignee?: string }>;
      relatedControls?: string[];
      createdBy?: string;
    };
  }>('/trustworthiness/assessments/:assessmentId/findings', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { assessmentId } = request.params;
    const {
      tenantId, aiSystemId, requirementId, findingType, title, description,
      severity, priority, evidenceDescription, evidenceSources, recommendation,
      recommendedActions, relatedControls, createdBy
    } = request.body || {};
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default' || !title || !findingType || !aiSystemId) {
      return sendError(reply, 'tenantId, aiSystemId, title, and findingType are required');
    }

    try {
      const finding = await getAssessmentService().createFinding(
        effectiveTenantId,
        {
          assessmentId,
          aiSystemId,
          title,
          findingType: findingType as any,
          description: description || '',
          requirementId: requirementId as any,
          severity: severity as any,
          priority: priority as any,
          evidenceDescription,
          evidenceSources,
          recommendation,
          recommendedActions: recommendedActions as any,
          relatedControls
        },
        createdBy
      );

      return sendCreated(reply, finding);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'createFinding', tenantId: effectiveTenantId, assessmentId });
    }
  });

  /**
   * Get findings for assessment
   * GET /trustworthiness/assessments/:assessmentId/findings
   */
  fastify.get<{
    Params: { assessmentId: string };
    Querystring: { tenantId?: string; findingType?: string; requirementId?: string; status?: string };
  }>('/trustworthiness/assessments/:assessmentId/findings', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { assessmentId } = request.params;
    const { tenantId, findingType, requirementId, status } = request.query;
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default') {
      return sendError(reply, 'tenantId query parameter is required');
    }

    try {
      const findings = await getAssessmentService().listFindings(effectiveTenantId, assessmentId, {
        findingType,
        requirementId: requirementId as any,
        status
      });

      return sendSuccess(reply, findings);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'listFindings', tenantId: effectiveTenantId, assessmentId });
    }
  });

  /**
   * Update finding status
   * PATCH /trustworthiness/findings/:id/status
   */
  fastify.patch<{
    Params: { id: string };
    Body: {
      tenantId?: string;
      status?: string;
      resolutionNotes?: string;
    };
  }>('/trustworthiness/findings/:id/status', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { tenantId, status, resolutionNotes } = request.body || {};
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default' || !status) {
      return sendError(reply, 'tenantId and status are required');
    }

    try {
      const finding = await getAssessmentService().updateFindingStatus(effectiveTenantId, id, status, resolutionNotes);

      if (!finding) {
        return sendNotFound(reply, 'Finding', id);
      }

      return sendSuccess(reply, finding);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'updateFindingStatus', tenantId: effectiveTenantId, findingId: id });
    }
  });

  /**
   * Update overall assessment
   * PUT /trustworthiness/assessments/:id/overall
   */
  fastify.put<{
    Params: { id: string };
    Body: {
      tenantId?: string;
      overallRating?: string;
      overallNarrative?: string;
      overallConfidence?: string;
      recommendations?: string[];
      priorityActions?: string[];
    };
  }>('/trustworthiness/assessments/:id/overall', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { tenantId, overallRating, overallNarrative, overallConfidence, recommendations, priorityActions } = request.body || {};
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default') {
      return sendError(reply, 'tenantId is required in body');
    }

    try {
      const result = await getAssessmentService().updateOverallAssessment(effectiveTenantId, id, {
        overallRating: overallRating as any,
        overallNarrative,
        overallConfidence: overallConfidence as any,
        recommendations,
        priorityActions
      });

      if (!result) {
        return sendNotFound(reply, 'Assessment', id);
      }

      return sendSuccess(reply, result);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'updateOverallAssessment', tenantId: effectiveTenantId, assessmentId: id });
    }
  });

  /**
   * Change assessment status
   * PATCH /trustworthiness/assessments/:id/status
   */
  fastify.patch<{
    Params: { id: string };
    Body: {
      tenantId?: string;
      status?: string;
      reviewedBy?: string;
    };
  }>('/trustworthiness/assessments/:id/status', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { tenantId, status, reviewedBy } = request.body || {};
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default' || !status) {
      return sendError(reply, 'tenantId and status are required');
    }

    try {
      const result = await getAssessmentService().changeStatus(effectiveTenantId, id, status as any, reviewedBy);

      if (!result) {
        return sendNotFound(reply, 'Assessment', id);
      }

      return sendSuccess(reply, result);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'changeAssessmentStatus', tenantId: effectiveTenantId, assessmentId: id });
    }
  });

  // ==========================================================================
  // Stakeholders
  // ==========================================================================

  /**
   * Create a stakeholder
   * POST /stakeholders
   */
  fastify.post<{
    Body: {
      tenantId?: string;
      aiSystemId?: string;
      name?: string;
      stakeholderType?: string;
      category?: string;
      description?: string;
      impactLevel?: string;
      impactDescription?: string;
      powerLevel?: string;
      interestLevel?: string;
      isVulnerableGroup?: boolean;
      vulnerabilityFactors?: string[];
      keyConcerns?: string[];
      keyInterests?: string[];
      createdBy?: string;
    };
  }>('/stakeholders', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const {
      tenantId, aiSystemId, name, stakeholderType, category, description,
      impactLevel, impactDescription, powerLevel, interestLevel,
      isVulnerableGroup, vulnerabilityFactors, keyConcerns, keyInterests, createdBy
    } = request.body || {};
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default' || !name || !stakeholderType || !aiSystemId) {
      return sendError(reply, 'tenantId, aiSystemId, name, and stakeholderType are required');
    }

    try {
      const stakeholder = await getStakeholderService().createStakeholder(
        effectiveTenantId,
        {
          aiSystemId,
          name,
          stakeholderType: stakeholderType as any,
          category,
          description,
          impactLevel: impactLevel as any,
          impactDescription,
          powerLevel: powerLevel as any,
          interestLevel: interestLevel as any,
          isVulnerableGroup,
          vulnerabilityFactors: vulnerabilityFactors as any,
          keyConcerns,
          keyInterests
        },
        createdBy
      );

      return sendCreated(reply, stakeholder);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'createStakeholder', tenantId: effectiveTenantId, name });
    }
  });

  /**
   * Get stakeholder by ID
   * GET /stakeholders/:id
   */
  fastify.get<{
    Params: { id: string };
    Querystring: { tenantId?: string };
  }>('/stakeholders/:id', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { tenantId } = request.query;
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default') {
      return sendError(reply, 'tenantId query parameter is required');
    }

    try {
      const stakeholder = await getStakeholderService().getStakeholder(effectiveTenantId, id);

      if (!stakeholder) {
        return sendNotFound(reply, 'Stakeholder', id);
      }

      return sendSuccess(reply, stakeholder);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'getStakeholder', tenantId: effectiveTenantId, stakeholderId: id });
    }
  });

  /**
   * List stakeholders
   * GET /stakeholders
   */
  fastify.get<{
    Querystring: {
      tenantId?: string;
      aiSystemId?: string;
      stakeholderType?: string;
      impactLevel?: string;
      isVulnerableGroup?: string;
      engagementStatus?: string;
      page?: string;
      limit?: string;
    };
  }>('/stakeholders', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { tenantId, aiSystemId, stakeholderType, impactLevel, isVulnerableGroup, engagementStatus, page, limit } = request.query;
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default' || !aiSystemId) {
      return sendError(reply, 'tenantId and aiSystemId query parameters are required');
    }

    try {
      const stakeholders = await getStakeholderService().listStakeholders(
        effectiveTenantId,
        aiSystemId,
        {
          stakeholderType: stakeholderType as any,
          impactLevel: impactLevel as any,
          isVulnerableGroup: isVulnerableGroup ? isVulnerableGroup === 'true' : undefined,
          engagementStatus: engagementStatus as any
        },
        {
          page: page ? parseInt(page, 10) : 1,
          limit: limit ? parseInt(limit, 10) : 20
        }
      );

      return sendSuccess(reply, stakeholders);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'listStakeholders', tenantId: effectiveTenantId, aiSystemId });
    }
  });

  /**
   * Update stakeholder
   * PUT /stakeholders/:id
   */
  fastify.put<{
    Params: { id: string };
    Body: {
      tenantId?: string;
      name?: string;
      stakeholderType?: string;
      category?: string;
      description?: string;
      impactLevel?: string;
      impactDescription?: string;
      powerLevel?: string;
      interestLevel?: string;
      isVulnerableGroup?: boolean;
      vulnerabilityFactors?: string[];
      keyConcerns?: string[];
      keyInterests?: string[];
    };
  }>('/stakeholders/:id', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { tenantId, ...updates } = request.body || {};
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default') {
      return sendError(reply, 'tenantId is required in body');
    }

    try {
      const stakeholder = await getStakeholderService().updateStakeholder(effectiveTenantId, id, updates as any);

      if (!stakeholder) {
        return sendNotFound(reply, 'Stakeholder', id);
      }

      return sendSuccess(reply, stakeholder);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'updateStakeholder', tenantId: effectiveTenantId, stakeholderId: id });
    }
  });

  /**
   * Delete stakeholder
   * DELETE /stakeholders/:id
   */
  fastify.delete<{
    Params: { id: string };
    Querystring: { tenantId?: string };
  }>('/stakeholders/:id', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { tenantId } = request.query;
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default') {
      return sendError(reply, 'tenantId query parameter is required');
    }

    try {
      const deleted = await getStakeholderService().deleteStakeholder(effectiveTenantId, id);

      if (!deleted) {
        return sendNotFound(reply, 'Stakeholder', id);
      }

      return sendSuccess(reply, { deleted: true });
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'deleteStakeholder', tenantId: effectiveTenantId, stakeholderId: id });
    }
  });

  /**
   * Record stakeholder engagement
   * POST /stakeholders/:id/engagement
   */
  fastify.post<{
    Params: { id: string };
    Body: {
      tenantId?: string;
      engagementType?: string;
      engagementDate?: string;
      durationMinutes?: number;
      participants?: string[];
      summary?: string;
      keyInsights?: string[];
      concernsRaised?: string[];
      suggestions?: string[];
      followUpRequired?: boolean;
      followUpNotes?: string;
      evidenceId?: string;
      createdBy?: string;
    };
  }>('/stakeholders/:id/engagement', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const {
      tenantId, engagementType, engagementDate, durationMinutes, participants,
      summary, keyInsights, concernsRaised, suggestions, followUpRequired,
      followUpNotes, evidenceId, createdBy
    } = request.body || {};
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default' || !engagementType || !summary) {
      return sendError(reply, 'tenantId, engagementType, and summary are required');
    }

    try {
      const engagement = await getStakeholderService().recordEngagement(effectiveTenantId, id, {
        engagementType: engagementType as any,
        engagementDate: engagementDate ? new Date(engagementDate) : new Date(),
        durationMinutes,
        participants: participants || [],
        summary,
        keyInsights: keyInsights || [],
        concernsRaised: concernsRaised || [],
        suggestions: suggestions || [],
        followUpRequired: followUpRequired || false,
        followUpNotes,
        evidenceId,
        createdBy
      });

      return sendCreated(reply, engagement);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'recordEngagement', tenantId: effectiveTenantId, stakeholderId: id });
    }
  });

  /**
   * Get stakeholder impact analysis for AI system
   * GET /stakeholders/impact-analysis
   */
  fastify.get<{
    Querystring: { tenantId?: string; aiSystemId?: string };
  }>('/stakeholders/impact-analysis', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { tenantId, aiSystemId } = request.query;
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default' || !aiSystemId) {
      return sendError(reply, 'tenantId and aiSystemId query parameters are required');
    }

    try {
      const impact = await getStakeholderService().getImpactAnalysis(effectiveTenantId, aiSystemId);
      return sendSuccess(reply, impact);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'getImpactAnalysis', tenantId: effectiveTenantId, aiSystemId });
    }
  });

  // ==========================================================================
  // Scenarios
  // ==========================================================================

  /**
   * Create scenario
   * POST /scenarios
   */
  fastify.post<{
    Body: {
      tenantId?: string;
      aiSystemId?: string;
      title?: string;
      scenarioType?: string;
      description?: string;
      narrative?: string;
      contextSetting?: string;
      actors?: Array<{ name: string; role: string; description?: string }>;
      preconditions?: string[];
      primaryRequirement?: string;
      affectedRequirements?: string[];
      likelihood?: string;
      severity?: string;
      potentialHarms?: string[];
      potentialBenefits?: string[];
      mitigations?: string[];
      createdBy?: string;
    };
  }>('/scenarios', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const {
      tenantId, aiSystemId, title, scenarioType, description, narrative,
      contextSetting, actors, preconditions, primaryRequirement, affectedRequirements,
      likelihood, severity, potentialHarms, potentialBenefits, mitigations, createdBy
    } = request.body || {};
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default' || !aiSystemId || !title || !scenarioType) {
      return sendError(reply, 'tenantId, aiSystemId, title, and scenarioType are required');
    }

    try {
      const scenario = await getScenarioService().createScenario(
        effectiveTenantId,
        {
          aiSystemId,
          title,
          scenarioType: scenarioType as any,
          description: description || '',
          narrative,
          contextSetting,
          actors: actors as any,
          preconditions,
          primaryRequirement: primaryRequirement as any,
          affectedRequirements: affectedRequirements as any,
          likelihood: likelihood as any,
          severity: severity as any,
          potentialHarms,
          potentialBenefits,
          mitigations
        },
        createdBy
      );

      return sendCreated(reply, scenario);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'createScenario', tenantId: effectiveTenantId, aiSystemId });
    }
  });

  /**
   * Get scenario by ID
   * GET /scenarios/:id
   */
  fastify.get<{
    Params: { id: string };
    Querystring: { tenantId?: string };
  }>('/scenarios/:id', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { tenantId } = request.query;
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default') {
      return sendError(reply, 'tenantId query parameter is required');
    }

    try {
      const scenario = await getScenarioService().getScenario(effectiveTenantId, id);

      if (!scenario) {
        return sendNotFound(reply, 'Scenario', id);
      }

      return sendSuccess(reply, scenario);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'getScenario', tenantId: effectiveTenantId, scenarioId: id });
    }
  });

  /**
   * List scenarios
   * GET /scenarios
   */
  fastify.get<{
    Querystring: {
      tenantId?: string;
      aiSystemId?: string;
      scenarioType?: string;
      status?: string;
      primaryRequirement?: string;
      minRiskScore?: string;
      page?: string;
      limit?: string;
    };
  }>('/scenarios', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { tenantId, aiSystemId, scenarioType, status, primaryRequirement, minRiskScore, page, limit } = request.query;
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default' || !aiSystemId) {
      return sendError(reply, 'tenantId and aiSystemId query parameters are required');
    }

    try {
      const scenarios = await getScenarioService().listScenarios(
        effectiveTenantId,
        aiSystemId,
        {
          scenarioType: scenarioType as any,
          status: status as any,
          primaryRequirement: primaryRequirement as any,
          minRiskScore: minRiskScore ? parseFloat(minRiskScore) : undefined
        },
        {
          page: page ? parseInt(page, 10) : 1,
          limit: limit ? parseInt(limit, 10) : 20
        }
      );

      return sendSuccess(reply, scenarios);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'listScenarios', tenantId: effectiveTenantId, aiSystemId });
    }
  });

  /**
   * Update scenario
   * PUT /scenarios/:id
   */
  fastify.put<{
    Params: { id: string };
    Body: {
      tenantId?: string;
      title?: string;
      scenarioType?: string;
      description?: string;
      narrative?: string;
      contextSetting?: string;
      actors?: Array<{ name: string; role: string; description?: string }>;
      preconditions?: string[];
      primaryRequirement?: string;
      affectedRequirements?: string[];
      likelihood?: string;
      severity?: string;
      potentialHarms?: string[];
      potentialBenefits?: string[];
      mitigations?: string[];
      status?: string;
      reviewNotes?: string;
    };
  }>('/scenarios/:id', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { tenantId, ...updates } = request.body || {};
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default') {
      return sendError(reply, 'tenantId is required in body');
    }

    try {
      const scenario = await getScenarioService().updateScenario(effectiveTenantId, id, updates as any);

      if (!scenario) {
        return sendNotFound(reply, 'Scenario', id);
      }

      return sendSuccess(reply, scenario);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'updateScenario', tenantId: effectiveTenantId, scenarioId: id });
    }
  });

  /**
   * Delete scenario
   * DELETE /scenarios/:id
   */
  fastify.delete<{
    Params: { id: string };
    Querystring: { tenantId?: string };
  }>('/scenarios/:id', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { tenantId } = request.query;
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default') {
      return sendError(reply, 'tenantId query parameter is required');
    }

    try {
      const deleted = await getScenarioService().deleteScenario(effectiveTenantId, id);

      if (!deleted) {
        return sendNotFound(reply, 'Scenario', id);
      }

      return sendSuccess(reply, { deleted: true });
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'deleteScenario', tenantId: effectiveTenantId, scenarioId: id });
    }
  });

  /**
   * Get high risk scenarios
   * GET /scenarios/high-risk
   */
  fastify.get<{
    Querystring: { tenantId?: string; aiSystemId?: string; minRiskScore?: string };
  }>('/scenarios/high-risk', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { tenantId, aiSystemId, minRiskScore } = request.query;
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default' || !aiSystemId) {
      return sendError(reply, 'tenantId and aiSystemId query parameters are required');
    }

    try {
      const scenarios = await getScenarioService().getHighRiskScenarios(
        effectiveTenantId,
        aiSystemId,
        minRiskScore ? parseFloat(minRiskScore) : 12
      );
      return sendSuccess(reply, scenarios);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'getHighRiskScenarios', tenantId: effectiveTenantId, aiSystemId });
    }
  });

  /**
   * Get scenario statistics
   * GET /scenarios/stats
   */
  fastify.get<{
    Querystring: { tenantId?: string; aiSystemId?: string };
  }>('/scenarios/stats', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { tenantId, aiSystemId } = request.query;
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default' || !aiSystemId) {
      return sendError(reply, 'tenantId and aiSystemId query parameters are required');
    }

    try {
      const stats = await getScenarioService().getScenarioStats(effectiveTenantId, aiSystemId);
      return sendSuccess(reply, stats);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'getScenarioStats', tenantId: effectiveTenantId, aiSystemId });
    }
  });

  // ==========================================================================
  // Ethical Tensions
  // ==========================================================================

  /**
   * Create tension
   * POST /tensions
   */
  fastify.post<{
    Body: {
      tenantId?: string;
      aiSystemId?: string;
      scenarioId?: string;
      title?: string;
      description?: string;
      valueA?: string;
      valueADescription?: string;
      valueB?: string;
      valueBDescription?: string;
      tensionType?: string;
      requirementA?: string;
      requirementB?: string;
      affectedStakeholders?: string[];
      severity?: string;
      createdBy?: string;
    };
  }>('/tensions', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const {
      tenantId, aiSystemId, scenarioId, title, description, valueA, valueADescription,
      valueB, valueBDescription, tensionType, requirementA, requirementB,
      affectedStakeholders, severity, createdBy
    } = request.body || {};
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default' || !aiSystemId || !title || !valueA || !valueB || !tensionType) {
      return sendError(reply, 'tenantId, aiSystemId, title, valueA, valueB, and tensionType are required');
    }

    try {
      const tension = await getTensionService().createTension(
        effectiveTenantId,
        {
          aiSystemId,
          scenarioId,
          title,
          description: description || '',
          valueA,
          valueADescription,
          valueB,
          valueBDescription,
          tensionType: tensionType as any,
          requirementA: requirementA as any,
          requirementB: requirementB as any,
          affectedStakeholders,
          severity: severity as any
        },
        createdBy
      );

      return sendCreated(reply, tension);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'createTension', tenantId: effectiveTenantId, aiSystemId });
    }
  });

  /**
   * Get tension by ID
   * GET /tensions/:id
   */
  fastify.get<{
    Params: { id: string };
    Querystring: { tenantId?: string };
  }>('/tensions/:id', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { tenantId } = request.query;
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default') {
      return sendError(reply, 'tenantId query parameter is required');
    }

    try {
      const tension = await getTensionService().getTension(effectiveTenantId, id);

      if (!tension) {
        return sendNotFound(reply, 'Tension', id);
      }

      return sendSuccess(reply, tension);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'getTension', tenantId: effectiveTenantId, tensionId: id });
    }
  });

  /**
   * List tensions
   * GET /tensions
   */
  fastify.get<{
    Querystring: {
      tenantId?: string;
      aiSystemId?: string;
      tensionType?: string;
      severity?: string;
      status?: string;
      requirementId?: string;
      scenarioId?: string;
      page?: string;
      limit?: string;
    };
  }>('/tensions', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { tenantId, aiSystemId, tensionType, severity, status, requirementId, scenarioId, page, limit } = request.query;
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default' || !aiSystemId) {
      return sendError(reply, 'tenantId and aiSystemId query parameters are required');
    }

    try {
      const tensions = await getTensionService().listTensions(
        effectiveTenantId,
        aiSystemId,
        {
          tensionType: tensionType as any,
          severity: severity as any,
          status: status as any,
          requirementId: requirementId as any,
          scenarioId
        },
        {
          page: page ? parseInt(page, 10) : 1,
          limit: limit ? parseInt(limit, 10) : 20
        }
      );

      return sendSuccess(reply, tensions);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'listTensions', tenantId: effectiveTenantId, aiSystemId });
    }
  });

  /**
   * Update tension
   * PUT /tensions/:id
   */
  fastify.put<{
    Params: { id: string };
    Body: {
      tenantId?: string;
      title?: string;
      description?: string;
      valueA?: string;
      valueADescription?: string;
      valueB?: string;
      valueBDescription?: string;
      tensionType?: string;
      requirementA?: string;
      requirementB?: string;
      affectedStakeholders?: string[];
      severity?: string;
    };
  }>('/tensions/:id', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { tenantId, ...updates } = request.body || {};
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default') {
      return sendError(reply, 'tenantId is required in body');
    }

    try {
      const tension = await getTensionService().updateTension(effectiveTenantId, id, updates as any);

      if (!tension) {
        return sendNotFound(reply, 'Tension', id);
      }

      return sendSuccess(reply, tension);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'updateTension', tenantId: effectiveTenantId, tensionId: id });
    }
  });

  /**
   * Delete tension
   * DELETE /tensions/:id
   */
  fastify.delete<{
    Params: { id: string };
    Querystring: { tenantId?: string };
  }>('/tensions/:id', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { tenantId } = request.query;
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default') {
      return sendError(reply, 'tenantId query parameter is required');
    }

    try {
      const deleted = await getTensionService().deleteTension(effectiveTenantId, id);

      if (!deleted) {
        return sendNotFound(reply, 'Tension', id);
      }

      return sendSuccess(reply, { deleted: true });
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'deleteTension', tenantId: effectiveTenantId, tensionId: id });
    }
  });

  /**
   * Resolve tension
   * POST /tensions/:id/resolve
   */
  fastify.post<{
    Params: { id: string };
    Body: {
      tenantId?: string;
      resolutionApproach?: string;
      resolutionRationale?: string;
      tradeOffDecision?: string;
      residualConcerns?: string;
      newStatus?: string;
      resolvedBy?: string;
    };
  }>('/tensions/:id/resolve', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const {
      tenantId, resolutionApproach, resolutionRationale, tradeOffDecision,
      residualConcerns, newStatus, resolvedBy
    } = request.body || {};
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default' || !resolutionApproach || !resolutionRationale || !newStatus) {
      return sendError(reply, 'tenantId, resolutionApproach, resolutionRationale, and newStatus are required');
    }

    try {
      const result = await getTensionService().resolveTension(
        effectiveTenantId,
        id,
        {
          resolutionApproach,
          resolutionRationale,
          tradeOffDecision,
          residualConcerns,
          newStatus: newStatus as any
        },
        resolvedBy
      );

      if (!result) {
        return sendNotFound(reply, 'Tension', id);
      }

      return sendSuccess(reply, result);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'resolveTension', tenantId: effectiveTenantId, tensionId: id });
    }
  });

  /**
   * Add stakeholder perspective to tension
   * POST /tensions/:id/perspectives
   */
  fastify.post<{
    Params: { id: string };
    Body: {
      tenantId?: string;
      stakeholderId?: string;
      perspective?: string;
      preferredResolution?: string;
    };
  }>('/tensions/:id/perspectives', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const {
      tenantId, stakeholderId, perspective, preferredResolution
    } = request.body || {};
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default' || !stakeholderId || !perspective) {
      return sendError(reply, 'tenantId, stakeholderId, and perspective are required');
    }

    try {
      const tension = await getTensionService().addStakeholderPerspective(
        effectiveTenantId,
        id,
        stakeholderId,
        {
          perspective,
          preferredResolution
        }
      );

      if (!tension) {
        return sendNotFound(reply, 'Tension', id);
      }

      return sendCreated(reply, tension);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'addStakeholderPerspective', tenantId: effectiveTenantId, tensionId: id });
    }
  });

  /**
   * Get unresolved tensions
   * GET /tensions/unresolved
   */
  fastify.get<{
    Querystring: { tenantId?: string; aiSystemId?: string };
  }>('/tensions/unresolved', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { tenantId, aiSystemId } = request.query;
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default' || !aiSystemId) {
      return sendError(reply, 'tenantId and aiSystemId query parameters are required');
    }

    try {
      const tensions = await getTensionService().getUnresolvedTensions(effectiveTenantId, aiSystemId);
      return sendSuccess(reply, tensions);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'getUnresolvedTensions', tenantId: effectiveTenantId, aiSystemId });
    }
  });

  /**
   * Get tension statistics
   * GET /tensions/stats
   */
  fastify.get<{
    Querystring: { tenantId?: string; aiSystemId?: string };
  }>('/tensions/stats', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { tenantId, aiSystemId } = request.query;
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default' || !aiSystemId) {
      return sendError(reply, 'tenantId and aiSystemId query parameters are required');
    }

    try {
      const stats = await getTensionService().getTensionStats(effectiveTenantId, aiSystemId);
      return sendSuccess(reply, stats);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'getTensionStats', tenantId: effectiveTenantId, aiSystemId });
    }
  });

  // ==========================================================================
  // Z-Inspection
  // ==========================================================================

  /**
   * Import Z-Inspection report
   * POST /z-inspection/import
   */
  fastify.post<{
    Body: {
      tenantId?: string;
      aiSystemId?: string;
      title?: string;
      reportDate?: string;
      inspectionTeam?: Array<{ name: string; role: string; organization?: string }>;
      importMethod?: string;
      sourceDocumentType?: string;
      sourceDocumentUrl?: string;
      content?: string;
      createdBy?: string;
    };
  }>('/z-inspection/import', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const {
      tenantId, aiSystemId, title, reportDate, inspectionTeam,
      importMethod, sourceDocumentType, sourceDocumentUrl, content, createdBy
    } = request.body || {};
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default' || !aiSystemId || !title || !content) {
      return sendError(reply, 'tenantId, aiSystemId, title, and content are required');
    }

    try {
      const report = await getZInspectionService().importReport(
        effectiveTenantId,
        {
          aiSystemId,
          title,
          reportDate: reportDate ? new Date(reportDate) : new Date(),
          inspectionTeam,
          importMethod: (importMethod || 'manual_entry') as any,
          sourceDocumentType: sourceDocumentType as any,
          sourceDocumentUrl,
          content
        },
        createdBy
      );
      return sendCreated(reply, report);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'importZInspectionReport', tenantId: effectiveTenantId, aiSystemId });
    }
  });

  /**
   * Get Z-Inspection report by ID
   * GET /z-inspection/reports/:id
   */
  fastify.get<{
    Params: { id: string };
    Querystring: { tenantId?: string };
  }>('/z-inspection/reports/:id', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { tenantId } = request.query;
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default') {
      return sendError(reply, 'tenantId query parameter is required');
    }

    try {
      const report = await getZInspectionService().getReport(effectiveTenantId, id);

      if (!report) {
        return sendNotFound(reply, 'Report', id);
      }

      return sendSuccess(reply, report);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'getZInspectionReport', tenantId: effectiveTenantId, reportId: id });
    }
  });

  /**
   * List Z-Inspection reports
   * GET /z-inspection/reports
   */
  fastify.get<{
    Querystring: {
      tenantId?: string;
      aiSystemId?: string;
      status?: string;
      page?: string;
      limit?: string;
    };
  }>('/z-inspection/reports', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { tenantId, aiSystemId, status, page, limit } = request.query;
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default' || !aiSystemId) {
      return sendError(reply, 'tenantId and aiSystemId query parameters are required');
    }

    try {
      const reports = await getZInspectionService().listReports(
        effectiveTenantId,
        aiSystemId,
        {
          status: status as any
        },
        {
          page: page ? parseInt(page, 10) : 1,
          limit: limit ? parseInt(limit, 10) : 20
        }
      );

      return sendSuccess(reply, reports);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'listZInspectionReports', tenantId: effectiveTenantId, aiSystemId });
    }
  });

  /**
   * Process Z-Inspection report
   * POST /z-inspection/reports/:id/process
   */
  fastify.post<{
    Params: { id: string };
    Body: { tenantId?: string };
  }>('/z-inspection/reports/:id/process', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { tenantId } = request.body || {};
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default') {
      return sendError(reply, 'tenantId is required');
    }

    try {
      const result = await getZInspectionService().processReport(effectiveTenantId, id);
      return sendSuccess(reply, result);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'processZInspectionReport', tenantId: effectiveTenantId, reportId: id });
    }
  });

  /**
   * Create assessment from Z-Inspection report
   * POST /z-inspection/reports/:id/create-assessment
   */
  fastify.post<{
    Params: { id: string };
    Body: {
      tenantId?: string;
      assessmentTitle?: string;
      createdBy?: string;
    };
  }>('/z-inspection/reports/:id/create-assessment', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { tenantId, assessmentTitle, createdBy } = request.body || {};
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default') {
      return sendError(reply, 'tenantId is required');
    }

    try {
      const result = await getZInspectionService().createAssessmentFromReport(effectiveTenantId, id, assessmentTitle, createdBy);
      return sendCreated(reply, result);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'createAssessmentFromZInspection', tenantId: effectiveTenantId, reportId: id });
    }
  });

  /**
   * Delete Z-Inspection report
   * DELETE /z-inspection/reports/:id
   */
  fastify.delete<{
    Params: { id: string };
    Querystring: { tenantId?: string };
  }>('/z-inspection/reports/:id', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { tenantId } = request.query;
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default') {
      return sendError(reply, 'tenantId query parameter is required');
    }

    try {
      const deleted = await getZInspectionService().deleteReport(effectiveTenantId, id);

      if (!deleted) {
        return sendNotFound(reply, 'Report', id);
      }

      return sendSuccess(reply, { deleted: true });
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'deleteZInspectionReport', tenantId: effectiveTenantId, reportId: id });
    }
  });

  /**
   * Generate monitoring rules from Z-Inspection report
   * GET /z-inspection/reports/:id/monitoring-rules
   */
  fastify.get<{
    Params: { id: string };
    Querystring: { tenantId?: string };
  }>('/z-inspection/reports/:id/monitoring-rules', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { tenantId } = request.query;
    const effectiveTenantId = tenantId || ctx.tenantId;

    if (!effectiveTenantId || effectiveTenantId === 'default') {
      return sendError(reply, 'tenantId query parameter is required');
    }

    try {
      const rules = await getZInspectionService().generateMonitoringRules(effectiveTenantId, id);
      return sendSuccess(reply, rules);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'generateMonitoringRules', tenantId: effectiveTenantId, reportId: id });
    }
  });
}
