/**
 * Learning System API Routes (Fastify)
 *
 * Endpoints for regulatory monitoring, framework discovery,
 * control generation, and auto-assessment scheduling.
 */

import { FastifyInstance, FastifyReply } from 'fastify';
import { getPool } from '../../database/client.js';
import { RegulatoryMonitorService } from '../../services/regulatory-monitor-service.js';
import { FrameworkDiscovererService } from '../../services/framework-discoverer-service.js';
import { ControlGeneratorService } from '../../services/control-generator-service.js';
import { AutoAssessmentService } from '../../services/auto-assessment-service.js';
import {
  getContext,
  handleRouteError,
  sendSuccess,
  sendCreated,
  sendNotFound,
} from '../middleware/index.js';

// Lazy singleton services
let _regulatoryMonitorService: RegulatoryMonitorService | null = null;
let _frameworkDiscovererService: FrameworkDiscovererService | null = null;
let _controlGeneratorService: ControlGeneratorService | null = null;
let _autoAssessmentService: AutoAssessmentService | null = null;

function getRegulatoryMonitorService(): RegulatoryMonitorService {
  if (!_regulatoryMonitorService) {
    _regulatoryMonitorService = new RegulatoryMonitorService(getPool());
  }
  return _regulatoryMonitorService;
}

function getFrameworkDiscovererService(): FrameworkDiscovererService {
  if (!_frameworkDiscovererService) {
    _frameworkDiscovererService = new FrameworkDiscovererService(getPool());
  }
  return _frameworkDiscovererService;
}

function getControlGeneratorService(): ControlGeneratorService {
  if (!_controlGeneratorService) {
    _controlGeneratorService = new ControlGeneratorService(getPool());
  }
  return _controlGeneratorService;
}

function getAutoAssessmentService(): AutoAssessmentService {
  if (!_autoAssessmentService) {
    _autoAssessmentService = new AutoAssessmentService(getPool());
  }
  return _autoAssessmentService;
}

// ============================================================================
// Route Registration
// ============================================================================

export async function learningRoutes(fastify: FastifyInstance): Promise<void> {
  // ==========================================================================
  // Regulatory Sources
  // ==========================================================================

  /**
   * List regulatory sources
   * GET /sources
   */
  fastify.get<{
    Querystring: { isActive?: string; jurisdiction?: string; category?: string };
  }>('/sources', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { isActive, jurisdiction, category } = request.query;

    try {
      const result = await getRegulatoryMonitorService().listSources({
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        jurisdiction,
        category
      });

      return sendSuccess(reply, result);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'list regulatory sources', tenantId: ctx.tenantId });
    }
  });

  /**
   * Add a regulatory source
   * POST /sources
   */
  fastify.post<{
    Body: {
      name?: string;
      sourceType?: string;
      url?: string;
      jurisdiction?: string;
      category?: string;
      relatedFrameworks?: string[];
      checkFrequency?: string;
      contentSelectors?: Record<string, unknown>;
      changeDetectionMethod?: string;
      isActive?: boolean;
      status?: string;
      metadata?: Record<string, unknown>;
    };
  }>('/sources', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const {
      name, sourceType, url, jurisdiction, category, relatedFrameworks,
      checkFrequency, contentSelectors, changeDetectionMethod, isActive, status, metadata
    } = request.body || {};

    if (!name || !sourceType || !url) {
      return reply.status(400).send({
        success: false,
        error: 'name, sourceType, and url are required'
      });
    }

    try {
      const source = await getRegulatoryMonitorService().addSource({
        name,
        sourceType: sourceType as any,
        url,
        jurisdiction: jurisdiction as any,
        category: category as any,
        relatedFrameworks: relatedFrameworks as any,
        checkFrequency: (checkFrequency || 'daily') as any,
        contentSelectors: contentSelectors as any,
        changeDetectionMethod: changeDetectionMethod as any,
        isActive: isActive !== false,
        status: (status || 'active') as any,
        metadata: metadata as any
      });

      return sendCreated(reply, source);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'add regulatory source', tenantId: ctx.tenantId });
    }
  });

  /**
   * Force check a source for updates
   * POST /sources/:id/check
   */
  fastify.post<{
    Params: { id: string };
  }>('/sources/:id/check', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;

    try {
      const updates = await getRegulatoryMonitorService().checkForUpdates(id);
      return sendSuccess(reply, { updates, count: updates.length });
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'check source for updates', tenantId: ctx.tenantId });
    }
  });

  /**
   * Run scheduled checks for all due sources
   * POST /sources/run-scheduled
   */
  fastify.post('/sources/run-scheduled', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);

    try {
      await getRegulatoryMonitorService().runScheduledChecks();
      return sendSuccess(reply, { message: 'Scheduled checks initiated' });
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'run scheduled checks', tenantId: ctx.tenantId });
    }
  });

  // ==========================================================================
  // Regulatory Updates
  // ==========================================================================

  /**
   * List regulatory updates
   * GET /updates
   */
  fastify.get<{
    Querystring: {
      sourceId?: string;
      frameworkId?: string;
      status?: string;
      updateType?: string;
      impactLevel?: string;
    };
  }>('/updates', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { sourceId, frameworkId, status, updateType, impactLevel } = request.query;

    try {
      const result = await getRegulatoryMonitorService().listUpdates({
        sourceId,
        frameworkId,
        status: status as any,
        updateType: updateType as any,
        impactLevel: impactLevel as any
      });

      return sendSuccess(reply, result);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'list regulatory updates', tenantId: ctx.tenantId });
    }
  });

  /**
   * Get update details
   * GET /updates/:id
   */
  fastify.get<{
    Params: { id: string };
  }>('/updates/:id', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;

    try {
      const update = await getRegulatoryMonitorService().getUpdate(id);

      if (!update) {
        return sendNotFound(reply, 'Update not found');
      }

      return sendSuccess(reply, update);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'get update', tenantId: ctx.tenantId });
    }
  });

  /**
   * Implement an update (generate controls)
   * POST /updates/:id/implement
   */
  fastify.post<{
    Params: { id: string };
    Body: { implementedBy?: string };
  }>('/updates/:id/implement', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { implementedBy } = request.body || {};

    try {
      const generationResult = await getControlGeneratorService().generateControlsFromUpdate(id);

      if (generationResult.status === 'failed') {
        return reply.status(500).send({
          success: false,
          error: 'Failed to generate controls',
          details: generationResult.errors
        });
      }

      // Mark update as implemented with the generated control IDs
      const controlIds = generationResult.controls?.map((c: any) => c.id) || [];
      await getRegulatoryMonitorService().markImplemented(id, controlIds);

      return sendSuccess(reply, {
        controlsGenerated: generationResult.controlsGenerated,
        controls: generationResult.controls,
        implementedBy
      });
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'implement update', tenantId: ctx.tenantId });
    }
  });

  // ==========================================================================
  // Entity Profile & Framework Discovery
  // ==========================================================================

  /**
   * Get entity profile
   * GET /profile
   */
  fastify.get<{
    Querystring: { tenantId?: string };
  }>('/profile', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { tenantId } = request.query;

    if (!tenantId) {
      return reply.status(400).send({
        success: false,
        error: 'tenantId query parameter is required'
      });
    }

    try {
      const profile = await getFrameworkDiscovererService().getEntityProfile(tenantId);

      if (!profile) {
        return sendNotFound(reply, 'Profile not found');
      }

      return sendSuccess(reply, profile);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'get entity profile', tenantId: ctx.tenantId });
    }
  });

  /**
   * Create or update entity profile
   * PUT /profile
   */
  fastify.put<{
    Body: {
      tenantId?: string;
      entityName?: string;
      industry?: string;
      subIndustry?: string;
      jurisdictions?: string[];
      entitySize?: string;
      isPubliclyTraded?: boolean;
      processesPersonalData?: boolean;
      usesAiSystems?: boolean;
      isCriticalInfrastructure?: boolean;
      dataCategories?: string[];
      annualRevenue?: number;
      employeeCount?: number;
      metadata?: Record<string, unknown>;
    };
  }>('/profile', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const {
      tenantId, entityName, industry, subIndustry, jurisdictions,
      entitySize, isPubliclyTraded, processesPersonalData, usesAiSystems,
      isCriticalInfrastructure, dataCategories, annualRevenue, employeeCount, metadata
    } = request.body || {};

    if (!tenantId || !entityName || !industry || !jurisdictions || !entitySize) {
      return reply.status(400).send({
        success: false,
        error: 'tenantId, entityName, industry, jurisdictions, and entitySize are required'
      });
    }

    try {
      const existing = await getFrameworkDiscovererService().getEntityProfile(tenantId);

      let profile;
      if (existing) {
        profile = await getFrameworkDiscovererService().updateEntityProfile(tenantId, {
          entityName, industry: industry as any, subIndustry, jurisdictions: jurisdictions as any, entitySize: entitySize as any,
          isPubliclyTraded, processesPersonalData, usesAiSystems,
          isCriticalInfrastructure, dataCategories: dataCategories as any, annualRevenue, employeeCount, metadata
        } as any);
      } else {
        profile = await getFrameworkDiscovererService().createEntityProfile({
          tenantId, entityName, industry: industry as any, subIndustry, jurisdictions: jurisdictions as any,
          entitySize: entitySize as any, isPubliclyTraded, processesPersonalData, usesAiSystems,
          isCriticalInfrastructure, dataCategories: dataCategories as any, annualRevenue, employeeCount, metadata
        } as any);
      }

      return sendSuccess(reply, profile);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'create/update entity profile', tenantId: ctx.tenantId });
    }
  });

  /**
   * Discover applicable frameworks for entity
   * POST /discover
   */
  fastify.post<{
    Body: { tenantId?: string };
  }>('/discover', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { tenantId } = request.body || {};

    if (!tenantId) {
      return reply.status(400).send({
        success: false,
        error: 'tenantId is required'
      });
    }

    try {
      const suggestions = await getFrameworkDiscovererService().discoverApplicableFrameworks(tenantId);
      return sendSuccess(reply, { suggestions, count: suggestions.length });
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'discover frameworks', tenantId: ctx.tenantId });
    }
  });

  /**
   * Get framework suggestions
   * GET /suggestions
   */
  fastify.get<{
    Querystring: { tenantId?: string };
  }>('/suggestions', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { tenantId } = request.query;

    if (!tenantId) {
      return reply.status(400).send({
        success: false,
        error: 'tenantId query parameter is required'
      });
    }

    try {
      const suggestions = await getFrameworkDiscovererService().discoverApplicableFrameworks(tenantId);
      return sendSuccess(reply, suggestions);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'get framework suggestions', tenantId: ctx.tenantId });
    }
  });

  /**
   * Accept a framework suggestion
   * POST /suggestions/:id/accept
   */
  fastify.post<{
    Params: { id: string };
    Body: { tenantId?: string };
  }>('/suggestions/:id/accept', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { tenantId } = request.body || {};

    if (!tenantId) {
      return reply.status(400).send({
        success: false,
        error: 'tenantId is required'
      });
    }

    try {
      const result = await getFrameworkDiscovererService().acceptSuggestion(tenantId, id);
      return sendSuccess(reply, result);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'accept suggestion', tenantId: ctx.tenantId });
    }
  });

  /**
   * Reject a framework suggestion
   * POST /suggestions/:id/reject
   */
  fastify.post<{
    Params: { id: string };
    Body: { tenantId?: string; reason?: string };
  }>('/suggestions/:id/reject', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { tenantId, reason } = request.body || {};

    if (!tenantId) {
      return reply.status(400).send({
        success: false,
        error: 'tenantId is required'
      });
    }

    try {
      const result = await getFrameworkDiscovererService().rejectSuggestion(tenantId, id, reason);
      return sendSuccess(reply, result);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'reject suggestion', tenantId: ctx.tenantId });
    }
  });

  /**
   * Analyze framework relevance for entity
   * GET /analyze-relevance
   */
  fastify.get<{
    Querystring: { tenantId?: string; frameworkId?: string };
  }>('/analyze-relevance', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { tenantId, frameworkId } = request.query;

    if (!tenantId || !frameworkId) {
      return reply.status(400).send({
        success: false,
        error: 'tenantId and frameworkId query parameters are required'
      });
    }

    try {
      const analysis = await getFrameworkDiscovererService().analyzeFrameworkRelevance(tenantId, frameworkId);
      return sendSuccess(reply, analysis);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'analyze framework relevance', tenantId: ctx.tenantId });
    }
  });

  // ==========================================================================
  // Control Generation
  // ==========================================================================

  /**
   * Generate controls from URL
   * POST /generate-from-url
   */
  fastify.post<{
    Body: {
      documentUrl?: string;
      frameworkId?: string;
      frameworkName?: string;
      context?: Record<string, unknown>;
    };
  }>('/generate-from-url', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { documentUrl, frameworkId, frameworkName, context } = request.body || {};

    if (!documentUrl || !frameworkId || !frameworkName) {
      return reply.status(400).send({
        success: false,
        error: 'documentUrl, frameworkId, and frameworkName are required'
      });
    }

    try {
      const result = await getControlGeneratorService().generateControlsFromUrl(
        documentUrl,
        frameworkId,
        frameworkName,
        context as any
      );

      return sendSuccess(reply, result);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'generate controls from URL', tenantId: ctx.tenantId });
    }
  });

  /**
   * Generate controls from text
   * POST /generate-from-text
   */
  fastify.post<{
    Body: {
      documentContent?: string;
      frameworkId?: string;
      frameworkName?: string;
      context?: Record<string, unknown>;
    };
  }>('/generate-from-text', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { documentContent, frameworkId, frameworkName, context } = request.body || {};

    if (!documentContent || !frameworkId || !frameworkName) {
      return reply.status(400).send({
        success: false,
        error: 'documentContent, frameworkId, and frameworkName are required'
      });
    }

    try {
      const result = await getControlGeneratorService().generateControlsFromText(
        documentContent,
        frameworkId,
        frameworkName,
        context as any
      );

      return sendSuccess(reply, result);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'generate controls from text', tenantId: ctx.tenantId });
    }
  });

  /**
   * Validate generated controls
   * POST /validate
   */
  fastify.post<{
    Body: { controls?: unknown[] };
  }>('/validate', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { controls } = request.body || {};

    if (!controls || !Array.isArray(controls)) {
      return reply.status(400).send({
        success: false,
        error: 'controls array is required'
      });
    }

    try {
      const validation = await getControlGeneratorService().validateControls(controls as any);
      return sendSuccess(reply, validation);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'validate controls', tenantId: ctx.tenantId });
    }
  });

  /**
   * List generated controls
   * GET /generated-controls
   */
  fastify.get<{
    Querystring: { frameworkId?: string; status?: string; minConfidence?: string };
  }>('/generated-controls', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { frameworkId, status, minConfidence } = request.query;

    try {
      const result = await getControlGeneratorService().listGeneratedControls({
        frameworkId,
        status: status as any,
        minConfidence: minConfidence ? parseFloat(minConfidence) : undefined
      });

      return sendSuccess(reply, result);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'list generated controls', tenantId: ctx.tenantId });
    }
  });

  /**
   * Get controls pending review
   * GET /pending-review
   */
  fastify.get<{
    Querystring: { limit?: string };
  }>('/pending-review', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { limit } = request.query;

    try {
      const controls = await getControlGeneratorService().getPendingReviewControls(
        limit ? parseInt(limit, 10) : undefined
      );
      return sendSuccess(reply, controls);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'get pending review controls', tenantId: ctx.tenantId });
    }
  });

  /**
   * Approve a generated control
   * POST /generated-controls/:id/approve
   */
  fastify.post<{
    Params: { id: string };
    Body: { reviewedBy?: string; notes?: string };
  }>('/generated-controls/:id/approve', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { reviewedBy, notes } = request.body || {};

    if (!reviewedBy) {
      return reply.status(400).send({
        success: false,
        error: 'reviewedBy is required'
      });
    }

    try {
      const control = await getControlGeneratorService().approveControl(id, reviewedBy, notes);

      if (!control) {
        return sendNotFound(reply, 'Control not found');
      }

      return sendSuccess(reply, control);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'approve control', tenantId: ctx.tenantId });
    }
  });

  /**
   * Reject a generated control
   * POST /generated-controls/:id/reject
   */
  fastify.post<{
    Params: { id: string };
    Body: { reviewedBy?: string; reason?: string };
  }>('/generated-controls/:id/reject', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { reviewedBy, reason } = request.body || {};

    if (!reviewedBy || !reason) {
      return reply.status(400).send({
        success: false,
        error: 'reviewedBy and reason are required'
      });
    }

    try {
      const control = await getControlGeneratorService().rejectControl(id, reviewedBy, reason);

      if (!control) {
        return sendNotFound(reply, 'Control not found');
      }

      return sendSuccess(reply, control);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'reject control', tenantId: ctx.tenantId });
    }
  });

  /**
   * Implement approved controls
   * POST /implement
   */
  fastify.post<{
    Body: { controlIds?: string[]; reviewedBy?: string };
  }>('/implement', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { controlIds, reviewedBy } = request.body || {};

    if (!controlIds || !Array.isArray(controlIds) || !reviewedBy) {
      return reply.status(400).send({
        success: false,
        error: 'controlIds array and reviewedBy are required'
      });
    }

    try {
      const result = await getControlGeneratorService().implementControls(controlIds, reviewedBy);
      return sendSuccess(reply, result);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'implement controls', tenantId: ctx.tenantId });
    }
  });

  // ==========================================================================
  // Auto Assessment
  // ==========================================================================

  /**
   * Create auto-assessment schedule
   * POST /schedule
   */
  fastify.post<{
    Body: {
      tenantId?: string;
      frameworkId?: string;
      frequency?: string;
      config?: Record<string, unknown>;
      notificationConfig?: Record<string, unknown>;
    };
  }>('/schedule', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { tenantId, frameworkId, frequency, config, notificationConfig } = request.body || {};

    if (!tenantId || !frameworkId || !frequency) {
      return reply.status(400).send({
        success: false,
        error: 'tenantId, frameworkId, and frequency are required'
      });
    }

    try {
      const schedule = await getAutoAssessmentService().createSchedule(
        tenantId,
        frameworkId,
        frequency as any,
        config,
        notificationConfig as any
      );

      return sendCreated(reply, schedule);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'create assessment schedule', tenantId: ctx.tenantId });
    }
  });

  /**
   * List scheduled assessments
   * GET /scheduled
   */
  fastify.get<{
    Querystring: { tenantId?: string; frameworkId?: string; isActive?: string };
  }>('/scheduled', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { tenantId, frameworkId, isActive } = request.query;

    if (!tenantId) {
      return reply.status(400).send({
        success: false,
        error: 'tenantId query parameter is required'
      });
    }

    try {
      const schedules = await getAutoAssessmentService().listSchedules(tenantId, {
        frameworkId,
        isActive: isActive !== undefined ? isActive === 'true' : undefined
      });

      return sendSuccess(reply, schedules);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'list scheduled assessments', tenantId: ctx.tenantId });
    }
  });

  /**
   * Update schedule frequency
   * PATCH /scheduled/:id/frequency
   */
  fastify.patch<{
    Params: { id: string };
    Body: { frequency?: string };
  }>('/scheduled/:id/frequency', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { frequency } = request.body || {};

    if (!frequency) {
      return reply.status(400).send({
        success: false,
        error: 'frequency is required'
      });
    }

    try {
      const schedule = await getAutoAssessmentService().updateScheduleFrequency(id, frequency as any);

      if (!schedule) {
        return sendNotFound(reply, 'Schedule not found');
      }

      return sendSuccess(reply, schedule);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'update schedule frequency', tenantId: ctx.tenantId });
    }
  });

  /**
   * Enable/disable schedule
   * PATCH /scheduled/:id/active
   */
  fastify.patch<{
    Params: { id: string };
    Body: { isActive?: boolean };
  }>('/scheduled/:id/active', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { id } = request.params;
    const { isActive } = request.body || {};

    if (isActive === undefined) {
      return reply.status(400).send({
        success: false,
        error: 'isActive is required'
      });
    }

    try {
      const schedule = await getAutoAssessmentService().setScheduleActive(id, isActive);

      if (!schedule) {
        return sendNotFound(reply, 'Schedule not found');
      }

      return sendSuccess(reply, schedule);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'update schedule active status', tenantId: ctx.tenantId });
    }
  });

  /**
   * Run assessment now
   * POST /run/:frameworkId
   */
  fastify.post<{
    Params: { frameworkId: string };
    Body: { tenantId?: string };
  }>('/run/:frameworkId', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { frameworkId } = request.params;
    const { tenantId } = request.body || {};

    if (!tenantId) {
      return reply.status(400).send({
        success: false,
        error: 'tenantId is required'
      });
    }

    try {
      const result = await getAutoAssessmentService().runAssessment(tenantId, frameworkId);
      return sendSuccess(reply, result);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'run assessment', tenantId: ctx.tenantId });
    }
  });

  /**
   * Run all scheduled assessments
   * POST /run-scheduled-assessments
   */
  fastify.post('/run-scheduled-assessments', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);

    try {
      const results = await getAutoAssessmentService().runScheduledAssessments();
      return sendSuccess(reply, { results, count: results.length });
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'run scheduled assessments', tenantId: ctx.tenantId });
    }
  });

  // ==========================================================================
  // Learning & Feedback
  // ==========================================================================

  /**
   * Record feedback on an assessment
   * POST /feedback
   */
  fastify.post<{
    Body: {
      tenantId?: string;
      assessmentId?: string;
      controlId?: string;
      eventType?: string;
      originalRating?: number;
      feedback?: string;
      correctedRating?: number;
      improvementSuggestion?: string;
    };
  }>('/feedback', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const {
      tenantId, assessmentId, controlId, eventType, originalRating, feedback,
      correctedRating, improvementSuggestion
    } = request.body || {};

    if (!tenantId || !assessmentId || !controlId || !eventType || originalRating === undefined || !feedback) {
      return reply.status(400).send({
        success: false,
        error: 'tenantId, assessmentId, controlId, eventType, originalRating, and feedback are required'
      });
    }

    try {
      const result = await getAutoAssessmentService().recordFeedback(
        tenantId,
        assessmentId,
        controlId,
        eventType as any,
        originalRating as any,
        feedback,
        correctedRating as any,
        improvementSuggestion
      );

      return sendCreated(reply, result);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'record feedback', tenantId: ctx.tenantId });
    }
  });

  /**
   * Process pending feedback
   * POST /process-feedback
   */
  fastify.post('/process-feedback', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);

    try {
      const result = await getAutoAssessmentService().processFeedback();
      return sendSuccess(reply, result);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'process feedback', tenantId: ctx.tenantId });
    }
  });

  /**
   * Learn from assessment
   * POST /learn-from-assessment
   */
  fastify.post<{
    Body: { assessmentId?: string };
  }>('/learn-from-assessment', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { assessmentId } = request.body || {};

    if (!assessmentId) {
      return reply.status(400).send({
        success: false,
        error: 'assessmentId is required'
      });
    }

    try {
      const result = await getAutoAssessmentService().learnFromAssessment(assessmentId);
      return sendSuccess(reply, result);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'learn from assessment', tenantId: ctx.tenantId });
    }
  });

  /**
   * Get learning metrics
   * GET /metrics
   */
  fastify.get<{
    Querystring: { tenantId?: string };
  }>('/metrics', async (request, reply: FastifyReply) => {
    const ctx = getContext(request);
    const { tenantId } = request.query;

    try {
      const metrics = await getAutoAssessmentService().getLearningMetrics(tenantId);
      return sendSuccess(reply, metrics);
    } catch (error) {
      return handleRouteError(error, reply, { operation: 'get learning metrics', tenantId: ctx.tenantId });
    }
  });
}
