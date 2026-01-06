import { createLogger } from '../utils/logger.js';
import { config } from '../config/index.js';

const logger = createLogger('mageagent-client');

/**
 * MageAgent API Response
 */
export interface MageAgentResponse {
  success: boolean;
  data: {
    response: string;
    model: string;
    usage: {
      inputTokens: number;
      outputTokens: number;
    };
    metadata?: Record<string, unknown>;
  };
  error?: string;
}

/**
 * Query options for MageAgent
 */
export interface QueryOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  responseFormat?: 'text' | 'json';
  timeout?: number;
}

/**
 * Structured assessment response from AI
 */
export interface AIAssessmentResult {
  status: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
  confidence: number;
  reasoning: string;
  findings: string[];
  recommendations: string[];
  evidenceGaps: string[];
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableStatusCodes: number[];
}

/**
 * Circuit breaker configuration
 */
interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
}

type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Circuit Breaker implementation for resilient service calls
 * Prevents cascading failures when MageAgent service is unavailable
 */
class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly config: CircuitBreakerConfig;

  constructor(circuitConfig: CircuitBreakerConfig) {
    this.config = circuitConfig;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.config.resetTimeoutMs) {
        this.state = 'half-open';
        logger.info({
          previousState: 'open',
          newState: 'half-open',
          resetTimeoutMs: this.config.resetTimeoutMs
        }, 'Circuit breaker transitioning to half-open state');
      } else {
        const error = new Error('Circuit breaker is open - MageAgent service unavailable');
        logger.warn({
          state: this.state,
          failureCount: this.failureCount,
          timeSinceLastFailure: Date.now() - this.lastFailureTime,
          resetTimeoutMs: this.config.resetTimeoutMs
        }, 'Circuit breaker rejecting request');
        throw error;
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      logger.info({
        previousState: 'half-open',
        newState: 'closed',
        previousFailureCount: this.failureCount
      }, 'Circuit breaker closed - MageAgent recovered');
    }
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold && this.state !== 'open') {
      const previousState = this.state;
      this.state = 'open';
      logger.error({
        previousState,
        newState: 'open',
        failureCount: this.failureCount,
        threshold: this.config.failureThreshold,
        resetTimeoutMs: this.config.resetTimeoutMs
      }, 'Circuit breaker opened - MageAgent failures exceeded threshold');
    }
  }

  getState(): { state: CircuitState; failureCount: number; lastFailureTime: number } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.lastFailureTime = 0;
    logger.info('Circuit breaker manually reset');
  }
}

/**
 * MageAgent Client for AI-powered compliance assessment
 * Connects to the MageAgent multi-model orchestration service
 *
 * Features:
 * - Retry logic with exponential backoff and jitter
 * - Circuit breaker pattern for resilience
 * - Configurable timeouts
 * - Comprehensive error handling
 */
export class MageAgentClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly retryConfig: RetryConfig;
  private readonly defaultTimeout: number;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = (baseUrl || config.mageagent.url).replace(/\/$/, '');
    this.apiKey = apiKey || config.mageagent.apiKey || '';
    this.defaultTimeout = config.mageagent.timeoutMs;

    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeoutMs: 30000 // 30 seconds
    });

    this.retryConfig = {
      maxRetries: config.mageagent.retryCount,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504]
    };

    logger.info({
      baseUrl: this.baseUrl,
      timeoutMs: this.defaultTimeout,
      maxRetries: this.retryConfig.maxRetries
    }, 'MageAgent client initialized');
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateBackoff(attempt: number): number {
    // Exponential backoff with jitter
    const exponentialDelay = this.retryConfig.baseDelayMs * Math.pow(2, attempt);
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, this.retryConfig.maxDelayMs);
  }

  /**
   * Send a query to MageAgent with retry and circuit breaker
   */
  async query(prompt: string, options: QueryOptions = {}): Promise<MageAgentResponse> {
    try {
      return await this.circuitBreaker.execute(async () => {
        return this.queryWithRetry(prompt, options);
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Circuit breaker open error - return graceful failure
      if (errorMessage.includes('Circuit breaker is open')) {
        return {
          success: false,
          data: { response: '', model: '', usage: { inputTokens: 0, outputTokens: 0 } },
          error: 'MageAgent service temporarily unavailable. Please try again later.'
        };
      }

      logger.error({ error: errorMessage }, 'MageAgent query failed');
      return {
        success: false,
        data: { response: '', model: '', usage: { inputTokens: 0, outputTokens: 0 } },
        error: errorMessage
      };
    }
  }

  private async queryWithRetry(
    prompt: string,
    options: QueryOptions
  ): Promise<MageAgentResponse> {
    const {
      model = 'claude-sonnet-4-20250514',
      temperature = 0.3,
      maxTokens = 4096,
      systemPrompt,
      responseFormat = 'text',
      timeout = this.defaultTimeout
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        if (attempt > 0) {
          const backoffMs = this.calculateBackoff(attempt - 1);
          logger.warn({
            attempt,
            maxRetries: this.retryConfig.maxRetries,
            backoffMs,
            previousError: lastError?.message
          }, 'Retrying MageAgent query after backoff');
          await this.sleep(backoffMs);
        }

        const requestStart = Date.now();
        const response = await fetch(`${this.baseUrl}/api/v1/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
          },
          body: JSON.stringify({
            prompt,
            model,
            temperature,
            maxTokens,
            systemPrompt,
            responseFormat
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const latencyMs = Date.now() - requestStart;

        if (!response.ok) {
          const errorText = await response.text();

          // Check if this is a retryable error
          if (this.retryConfig.retryableStatusCodes.includes(response.status)) {
            lastError = new Error(
              `MageAgent API error (retryable): ${response.status} - ${errorText}`
            );
            logger.warn({
              status: response.status,
              attempt,
              latencyMs,
              error: errorText.substring(0, 200)
            }, 'Retryable MageAgent error');
            continue; // Retry
          }

          // Non-retryable error - fail immediately
          throw new Error(`MageAgent API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json() as Record<string, unknown>;
        const usage = data.usage as Record<string, number> | undefined;

        logger.debug({
          latencyMs,
          model: (data.model as string) || model,
          inputTokens: usage?.input_tokens || 0,
          outputTokens: usage?.output_tokens || 0,
          attempt
        }, 'MageAgent query successful');

        return {
          success: true,
          data: {
            response: (data.response || data.content || data.text) as string,
            model: (data.model as string) || model,
            usage: {
              inputTokens: usage?.input_tokens || 0,
              outputTokens: usage?.output_tokens || 0
            },
            metadata: data.metadata as Record<string, unknown> | undefined
          }
        };
      } catch (error: unknown) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new Error(`MageAgent request timed out after ${timeout}ms`);
          logger.warn({
            attempt,
            timeoutMs: timeout
          }, 'MageAgent request timed out, will retry');
          continue; // Retry on timeout
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        lastError = error instanceof Error ? error : new Error(errorMessage);

        // Don't retry on non-retryable errors
        if (!errorMessage.includes('retryable')) {
          logger.error({
            error: errorMessage,
            attempt
          }, 'Non-retryable MageAgent error');
          break;
        }
      }
    }

    // All retries exhausted
    logger.error({
      error: lastError?.message,
      maxRetries: this.retryConfig.maxRetries,
      baseUrl: this.baseUrl
    }, 'MageAgent query failed after all retries');

    throw lastError || new Error('MageAgent query failed after all retries');
  }

  /**
   * Perform a compliance control assessment using AI
   */
  async assessControl(
    controlId: string,
    controlTitle: string,
    controlDescription: string,
    aiPrompt: string,
    context: {
      organization?: string;
      industry?: string;
      evidence?: Array<{ type: string; description: string; date: string; source?: string; status?: string }>;
      previousFindings?: string[];
    }
  ): Promise<AIAssessmentResult> {
    const systemPrompt = `You are an expert compliance auditor with deep knowledge of regulatory frameworks including GDPR, ISO 27001, SOC 2, NIS2, EU AI Act, and ISO 27701.

Your task is to assess compliance with a specific control based on the provided context and evidence.

IMPORTANT: You must respond with ONLY valid JSON in this exact format:
{
  "status": "compliant" | "partial" | "non_compliant" | "not_applicable",
  "confidence": <number between 0 and 1>,
  "reasoning": "<detailed explanation of your assessment>",
  "findings": ["<specific finding 1>", "<specific finding 2>"],
  "recommendations": ["<actionable recommendation 1>", "<actionable recommendation 2>"],
  "evidenceGaps": ["<missing evidence 1>", "<missing evidence 2>"],
  "riskLevel": "critical" | "high" | "medium" | "low"
}

Assessment Guidelines:
- "compliant": Full implementation with documented evidence
- "partial": Some implementation but gaps exist
- "non_compliant": Control not implemented or major deficiencies
- "not_applicable": Control does not apply to this organization

Be thorough but fair in your assessment. If evidence is missing, note it as an evidence gap rather than assuming non-compliance.`;

    const evidenceSection = context.evidence?.length
      ? `\n\nAvailable Evidence:\n${context.evidence.map(e =>
          `- [${e.type}] ${e.description} (${e.date})${e.source ? ` [Source: ${e.source}]` : ''}${e.status ? ` [Status: ${e.status}]` : ''}`
        ).join('\n')}`
      : '\n\nNo evidence currently provided.';

    const previousSection = context.previousFindings?.length
      ? `\n\nPrevious Assessment Findings:\n${context.previousFindings.map(f => `- ${f}`).join('\n')}`
      : '';

    const prompt = `Assess the following compliance control:

Control ID: ${controlId}
Control Title: ${controlTitle}
Control Description: ${controlDescription}

Organization: ${context.organization || 'Not specified'}
Industry: ${context.industry || 'Not specified'}
${evidenceSection}
${previousSection}

Assessment Prompt: ${aiPrompt}

Provide your assessment as a JSON object.`;

    const response = await this.query(prompt, {
      systemPrompt,
      responseFormat: 'json',
      temperature: 0.2,
      maxTokens: 2048
    });

    if (!response.success || !response.data.response) {
      logger.warn({
        controlId,
        error: response.error
      }, 'AI assessment failed, using fallback');
      return this.createFallbackAssessment(controlId, response.error);
    }

    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response.data.response;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const result = JSON.parse(jsonStr) as AIAssessmentResult;

      // Validate and normalize the response
      return {
        status: this.validateStatus(result.status),
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
        reasoning: result.reasoning || 'Assessment completed.',
        findings: Array.isArray(result.findings) ? result.findings : [],
        recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
        evidenceGaps: Array.isArray(result.evidenceGaps) ? result.evidenceGaps : [],
        riskLevel: this.validateRiskLevel(result.riskLevel)
      };
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error';
      logger.error({
        controlId,
        error: errorMessage,
        responseLength: response.data.response.length
      }, 'Failed to parse AI response');
      return this.createFallbackAssessment(controlId, 'Failed to parse AI response');
    }
  }

  /**
   * Batch assess multiple controls
   */
  async batchAssessControls(
    controls: Array<{
      id: string;
      title: string;
      description: string;
      aiPrompt: string;
    }>,
    context: {
      organization?: string;
      industry?: string;
      evidence?: Array<{ controlId: string; type: string; description: string; date: string }>;
    },
    concurrency: number = 3
  ): Promise<Map<string, AIAssessmentResult>> {
    const results = new Map<string, AIAssessmentResult>();

    logger.info({
      totalControls: controls.length,
      concurrency
    }, 'Starting batch assessment');

    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < controls.length; i += concurrency) {
      const batch = controls.slice(i, i + concurrency);

      const batchPromises = batch.map(control => {
        const controlEvidence = context.evidence?.filter(e => e.controlId === control.id) || [];

        return this.assessControl(
          control.id,
          control.title,
          control.description,
          control.aiPrompt,
          {
            organization: context.organization,
            industry: context.industry,
            evidence: controlEvidence.map(e => ({
              type: e.type,
              description: e.description,
              date: e.date
            }))
          }
        ).then(result => ({ controlId: control.id, result }));
      });

      const batchResults = await Promise.all(batchPromises);

      for (const { controlId, result } of batchResults) {
        results.set(controlId, result);
      }

      // Add a small delay between batches to be respectful to the API
      if (i + concurrency < controls.length) {
        await this.sleep(500);
      }
    }

    logger.info({
      totalControls: controls.length,
      assessedControls: results.size
    }, 'Batch assessment complete');

    return results;
  }

  /**
   * Generate remediation guidance for a finding
   */
  async generateRemediationGuidance(
    controlId: string,
    controlTitle: string,
    finding: string,
    context: { industry?: string; organizationSize?: string }
  ): Promise<{ steps: string[]; priority: string; estimatedEffort: string; resources: string[] }> {
    const prompt = `Generate specific remediation guidance for the following compliance finding:

Control: ${controlId} - ${controlTitle}
Finding: ${finding}
Industry: ${context.industry || 'General'}
Organization Size: ${context.organizationSize || 'Medium'}

Provide practical, actionable remediation steps as JSON:
{
  "steps": ["step 1", "step 2", ...],
  "priority": "immediate" | "short-term" | "medium-term" | "long-term",
  "estimatedEffort": "hours" | "days" | "weeks" | "months",
  "resources": ["resource or tool 1", "resource or tool 2"]
}`;

    const response = await this.query(prompt, {
      temperature: 0.3,
      responseFormat: 'json'
    });

    if (!response.success) {
      return {
        steps: ['Review the control requirements', 'Implement necessary controls', 'Document implementation'],
        priority: 'short-term',
        estimatedEffort: 'weeks',
        resources: []
      };
    }

    try {
      let jsonStr = response.data.response;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      return JSON.parse(jsonStr);
    } catch {
      return {
        steps: ['Review the control requirements', 'Implement necessary controls', 'Document implementation'],
        priority: 'short-term',
        estimatedEffort: 'weeks',
        resources: []
      };
    }
  }

  /**
   * Health check for MageAgent service
   */
  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; circuitState: CircuitState }> {
    const startTime = Date.now();
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });

      const latencyMs = Date.now() - startTime;
      const circuitState = this.circuitBreaker.getState();

      return {
        healthy: response.ok,
        latencyMs,
        circuitState: circuitState.state
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const circuitState = this.circuitBreaker.getState();

      return {
        healthy: false,
        latencyMs,
        circuitState: circuitState.state
      };
    }
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(): { state: CircuitState; failureCount: number; lastFailureTime: number } {
    return this.circuitBreaker.getState();
  }

  /**
   * Reset circuit breaker (use with caution)
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }

  private validateStatus(status: string): AIAssessmentResult['status'] {
    const validStatuses = ['compliant', 'partial', 'non_compliant', 'not_applicable'];
    return validStatuses.includes(status)
      ? status as AIAssessmentResult['status']
      : 'partial';
  }

  private validateRiskLevel(level: string): AIAssessmentResult['riskLevel'] {
    const validLevels = ['critical', 'high', 'medium', 'low'];
    return validLevels.includes(level)
      ? level as AIAssessmentResult['riskLevel']
      : 'medium';
  }

  private createFallbackAssessment(controlId: string, error?: string): AIAssessmentResult {
    return {
      status: 'partial',
      confidence: 0.3,
      reasoning: `Automated assessment could not be completed${error ? `: ${error}` : ''}. Manual review required.`,
      findings: ['Automated assessment incomplete'],
      recommendations: ['Conduct manual assessment', 'Provide additional evidence'],
      evidenceGaps: ['Automated evidence collection not available'],
      riskLevel: 'medium'
    };
  }
}

// ============================================================================
// Qualitative Assessment Types
// ============================================================================

export interface ScenarioAnalysisResult {
  scenarios: GeneratedScenario[];
  overallRiskAssessment: string;
  priorityAreas: string[];
}

export interface GeneratedScenario {
  title: string;
  scenarioType: 'use_case' | 'failure_mode' | 'edge_case' | 'stakeholder_impact' | 'ethical_dilemma';
  description: string;
  actors: string[];
  potentialHarms: string[];
  affectedRequirements: string[];
  likelihood: number;
  severity: number;
}

export interface TensionIdentificationResult {
  tensions: IdentifiedTension[];
  overallEthicalComplexity: 'low' | 'medium' | 'high' | 'very_high';
  recommendations: string[];
}

export interface IdentifiedTension {
  valueA: string;
  valueB: string;
  description: string;
  severity: 'critical' | 'significant' | 'moderate' | 'minor';
  affectedStakeholders: string[];
  requirementId?: string;
  resolutionApproaches: string[];
}

export interface RequirementAssessmentResult {
  requirementId: string;
  rating: 'excellent' | 'good' | 'adequate' | 'poor' | 'critical';
  narrative: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  evidenceReviewed: string[];
  confidence: number;
}

export interface ZInspectionParseResult {
  reportMetadata: {
    title: string;
    date: string;
    inspectionTeam: string[];
    aiSystemName: string;
  };
  findings: ParsedFinding[];
  scenarios: ParsedScenario[];
  tensions: ParsedTension[];
  overallAssessment: {
    rating: string;
    summary: string;
  };
  recommendations: string[];
}

export interface ParsedFinding {
  type: 'strength' | 'weakness' | 'opportunity' | 'threat' | 'recommendation';
  category: string;
  title: string;
  description: string;
  severity?: string;
  requirementId?: string;
}

export interface ParsedScenario {
  title: string;
  type: string;
  description: string;
  stakeholders: string[];
  risks: string[];
}

export interface ParsedTension {
  values: [string, string];
  description: string;
  severity: string;
  resolution?: string;
}

// ============================================================================
// Learning System Types
// ============================================================================

export interface RegulatoryAnalysisResult {
  documentType: 'regulation' | 'directive' | 'guidance' | 'standard' | 'amendment';
  jurisdiction: string;
  effectiveDate?: string;
  summary: string;
  keyRequirements: ExtractedRequirement[];
  affectedFrameworks: string[];
  impactAssessment: string;
  actionRequired: 'immediate' | 'short_term' | 'long_term' | 'monitoring';
}

export interface ExtractedRequirement {
  id: string;
  title: string;
  text: string;
  obligationType: 'shall' | 'must' | 'should' | 'may';
  category: string;
  applicability: string;
}

export interface GeneratedControlResult {
  controls: AIGeneratedControl[];
  mappings: ControlMapping[];
  confidence: number;
  notes: string[];
}

export interface AIGeneratedControl {
  controlId: string;
  title: string;
  description: string;
  category: 'organizational' | 'people' | 'physical' | 'technological';
  controlType: 'preventive' | 'detective' | 'corrective' | 'deterrent';
  domain: string;
  guidance: string;
  evidenceTypes: string[];
  assessmentCriteria: string;
  aiPrompt: string;
  implementationDifficulty: 'low' | 'medium' | 'high' | 'very_high';
  sourceReference: string;
}

export interface ControlMapping {
  generatedControlId: string;
  existingControlId: string;
  relationship: 'equivalent' | 'partial' | 'related' | 'supersedes';
  confidence: number;
}

export interface FrameworkRelevanceResult {
  frameworkName: string;
  relevanceScore: number;
  applicabilityFactors: ApplicabilityFactor[];
  recommendation: 'required' | 'recommended' | 'optional' | 'not_applicable';
  rationale: string;
  implementationPriority: 'immediate' | 'high' | 'medium' | 'low';
}

export interface ApplicabilityFactor {
  factor: string;
  applies: boolean;
  weight: number;
  explanation: string;
}

export interface PromptImprovementResult {
  originalPrompt: string;
  improvedPrompt: string;
  improvements: string[];
  expectedConfidenceGain: number;
  testCases: string[];
}

// ============================================================================
// Extended MageAgent Client Methods
// ============================================================================

/**
 * Extended MageAgent Client with Qualitative and Learning Capabilities
 */
export class ExtendedMageAgentClient extends MageAgentClient {
  // ==========================================================================
  // Qualitative Assessment Methods
  // ==========================================================================

  /**
   * Analyze an AI system and generate socio-technical scenarios
   */
  async analyzeScenarios(
    aiSystemDescription: string,
    context: {
      industry: string;
      stakeholders: string[];
      existingControls?: string[];
      knownRisks?: string[];
    }
  ): Promise<ScenarioAnalysisResult> {
    const systemPrompt = `You are an expert in AI ethics and socio-technical systems analysis, specializing in the Z-Inspection methodology for trustworthy AI assessment.

Your task is to generate comprehensive socio-technical scenarios for an AI system that could reveal ethical issues, risks, and areas requiring human oversight.

Respond with ONLY valid JSON in this format:
{
  "scenarios": [
    {
      "title": "Scenario title",
      "scenarioType": "use_case" | "failure_mode" | "edge_case" | "stakeholder_impact" | "ethical_dilemma",
      "description": "Detailed scenario description",
      "actors": ["actor1", "actor2"],
      "potentialHarms": ["harm1", "harm2"],
      "affectedRequirements": ["human_agency_oversight", "transparency", etc.],
      "likelihood": 1-5,
      "severity": 1-5
    }
  ],
  "overallRiskAssessment": "Summary of overall risk landscape",
  "priorityAreas": ["Area requiring immediate attention"]
}

The 7 EU Trustworthy AI Requirements are:
1. human_agency_oversight
2. technical_robustness_safety
3. privacy_data_governance
4. transparency
5. diversity_fairness_nondiscrimination
6. societal_environmental_wellbeing
7. accountability`;

    const prompt = `Analyze the following AI system and generate socio-technical scenarios:

AI System Description:
${aiSystemDescription}

Industry: ${context.industry}
Key Stakeholders: ${context.stakeholders.join(', ')}
${context.existingControls?.length ? `Existing Controls: ${context.existingControls.join(', ')}` : ''}
${context.knownRisks?.length ? `Known Risks: ${context.knownRisks.join(', ')}` : ''}

Generate at least 5 diverse scenarios covering different scenario types and requirements.`;

    const response = await this.query(prompt, {
      systemPrompt,
      responseFormat: 'json',
      temperature: 0.4,
      maxTokens: 4096
    });

    if (!response.success) {
      return {
        scenarios: [],
        overallRiskAssessment: 'Analysis could not be completed',
        priorityAreas: []
      };
    }

    try {
      let jsonStr = response.data.response;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();
      return JSON.parse(jsonStr);
    } catch {
      return {
        scenarios: [],
        overallRiskAssessment: 'Failed to parse analysis results',
        priorityAreas: []
      };
    }
  }

  /**
   * Identify ethical tensions from scenarios and context
   */
  async identifyTensions(
    scenarios: Array<{ title: string; description: string; stakeholders?: string[] }>,
    context: {
      aiSystemName: string;
      industry: string;
      values?: string[];
    }
  ): Promise<TensionIdentificationResult> {
    const systemPrompt = `You are an expert in AI ethics specializing in identifying ethical tensions and value conflicts in AI systems.

Ethical tensions arise when:
- Two legitimate values or principles are in conflict
- Different stakeholder interests cannot be simultaneously satisfied
- Trade-offs must be made between competing goods

Respond with ONLY valid JSON:
{
  "tensions": [
    {
      "valueA": "First value in tension",
      "valueB": "Second value in tension",
      "description": "Description of the tension",
      "severity": "critical" | "significant" | "moderate" | "minor",
      "affectedStakeholders": ["stakeholder1", "stakeholder2"],
      "requirementId": "human_agency_oversight" | "transparency" | etc.,
      "resolutionApproaches": ["Approach 1", "Approach 2"]
    }
  ],
  "overallEthicalComplexity": "low" | "medium" | "high" | "very_high",
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

    const prompt = `Analyze the following scenarios and identify ethical tensions:

AI System: ${context.aiSystemName}
Industry: ${context.industry}
${context.values?.length ? `Organizational Values: ${context.values.join(', ')}` : ''}

Scenarios:
${scenarios.map((s, i) => `${i + 1}. ${s.title}\n   ${s.description}\n   Stakeholders: ${s.stakeholders?.join(', ') || 'Not specified'}`).join('\n\n')}

Identify all ethical tensions that could arise from these scenarios.`;

    const response = await this.query(prompt, {
      systemPrompt,
      responseFormat: 'json',
      temperature: 0.3,
      maxTokens: 4096
    });

    if (!response.success) {
      return {
        tensions: [],
        overallEthicalComplexity: 'medium',
        recommendations: []
      };
    }

    try {
      let jsonStr = response.data.response;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();
      return JSON.parse(jsonStr);
    } catch {
      return {
        tensions: [],
        overallEthicalComplexity: 'medium',
        recommendations: []
      };
    }
  }

  /**
   * Assess a trustworthy AI requirement
   */
  async assessRequirement(
    requirementId: string,
    requirementName: string,
    context: {
      aiSystemDescription: string;
      scenarios?: string[];
      evidence?: string[];
      stakeholderFeedback?: string[];
    }
  ): Promise<RequirementAssessmentResult> {
    const systemPrompt = `You are an expert in trustworthy AI assessment, evaluating AI systems against the 7 EU Trustworthy AI Requirements.

Provide a thorough, balanced assessment. Consider both positive indicators and areas for improvement.

Respond with ONLY valid JSON:
{
  "requirementId": "${requirementId}",
  "rating": "excellent" | "good" | "adequate" | "poor" | "critical",
  "narrative": "Detailed narrative assessment",
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "evidenceReviewed": ["Evidence item 1"],
  "confidence": 0.0-1.0
}

Rating Guidelines:
- excellent: Exemplary implementation exceeding requirements
- good: Solid implementation meeting requirements
- adequate: Basic implementation with some gaps
- poor: Significant deficiencies requiring attention
- critical: Fundamental issues posing serious risks`;

    const prompt = `Assess the following AI system against the requirement: ${requirementName}

AI System: ${context.aiSystemDescription}

${context.scenarios?.length ? `Related Scenarios:\n${context.scenarios.join('\n')}` : ''}
${context.evidence?.length ? `Available Evidence:\n${context.evidence.join('\n')}` : 'No specific evidence provided.'}
${context.stakeholderFeedback?.length ? `Stakeholder Feedback:\n${context.stakeholderFeedback.join('\n')}` : ''}

Provide a comprehensive assessment of this requirement.`;

    const response = await this.query(prompt, {
      systemPrompt,
      responseFormat: 'json',
      temperature: 0.2,
      maxTokens: 2048
    });

    if (!response.success) {
      return {
        requirementId,
        rating: 'adequate',
        narrative: 'Assessment could not be completed automatically.',
        strengths: [],
        weaknesses: [],
        recommendations: ['Conduct manual assessment'],
        evidenceReviewed: [],
        confidence: 0.3
      };
    }

    try {
      let jsonStr = response.data.response;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();
      return JSON.parse(jsonStr);
    } catch {
      return {
        requirementId,
        rating: 'adequate',
        narrative: 'Failed to parse assessment results.',
        strengths: [],
        weaknesses: [],
        recommendations: ['Conduct manual assessment'],
        evidenceReviewed: [],
        confidence: 0.3
      };
    }
  }

  /**
   * Parse a Z-Inspection report document
   */
  async parseZInspectionReport(
    documentContent: string,
    documentFormat: 'pdf' | 'docx' | 'text' | 'markdown'
  ): Promise<ZInspectionParseResult> {
    const systemPrompt = `You are an expert at parsing Z-Inspection reports for AI trustworthiness assessment.

Extract structured information from the report, identifying:
- Report metadata (title, date, team, AI system)
- Findings (strengths, weaknesses, opportunities, threats, recommendations)
- Socio-technical scenarios described
- Ethical tensions identified
- Overall assessment

Respond with ONLY valid JSON:
{
  "reportMetadata": {
    "title": "Report title",
    "date": "YYYY-MM-DD",
    "inspectionTeam": ["Name 1", "Name 2"],
    "aiSystemName": "AI system name"
  },
  "findings": [
    {
      "type": "strength" | "weakness" | "opportunity" | "threat" | "recommendation",
      "category": "Category (e.g., human_agency_oversight)",
      "title": "Finding title",
      "description": "Finding description",
      "severity": "critical" | "high" | "medium" | "low",
      "requirementId": "Optional requirement ID"
    }
  ],
  "scenarios": [
    {
      "title": "Scenario title",
      "type": "Type of scenario",
      "description": "Scenario description",
      "stakeholders": ["Stakeholder 1"],
      "risks": ["Risk 1"]
    }
  ],
  "tensions": [
    {
      "values": ["Value 1", "Value 2"],
      "description": "Tension description",
      "severity": "critical" | "significant" | "moderate" | "minor",
      "resolution": "Resolution approach if mentioned"
    }
  ],
  "overallAssessment": {
    "rating": "trustworthy" | "conditionally_trustworthy" | "not_trustworthy" | "inconclusive",
    "summary": "Overall assessment summary"
  },
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

    const prompt = `Parse the following Z-Inspection report (format: ${documentFormat}):

${documentContent.substring(0, 50000)}

Extract all structured information from this report.`;

    const response = await this.query(prompt, {
      systemPrompt,
      responseFormat: 'json',
      temperature: 0.1,
      maxTokens: 8192
    });

    if (!response.success) {
      return {
        reportMetadata: { title: 'Unknown', date: '', inspectionTeam: [], aiSystemName: 'Unknown' },
        findings: [],
        scenarios: [],
        tensions: [],
        overallAssessment: { rating: 'inconclusive', summary: 'Failed to parse report' },
        recommendations: []
      };
    }

    try {
      let jsonStr = response.data.response;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();
      return JSON.parse(jsonStr);
    } catch {
      return {
        reportMetadata: { title: 'Unknown', date: '', inspectionTeam: [], aiSystemName: 'Unknown' },
        findings: [],
        scenarios: [],
        tensions: [],
        overallAssessment: { rating: 'inconclusive', summary: 'Failed to parse report' },
        recommendations: []
      };
    }
  }

  // ==========================================================================
  // Learning System Methods
  // ==========================================================================

  /**
   * Analyze a regulatory document and extract requirements
   */
  async analyzeRegulatoryDocument(
    documentContent: string,
    metadata: {
      documentName: string;
      jurisdiction?: string;
      documentType?: string;
    }
  ): Promise<RegulatoryAnalysisResult> {
    const systemPrompt = `You are an expert regulatory analyst specializing in data protection, cybersecurity, and AI governance regulations.

Analyze regulatory documents to extract actionable compliance requirements.

Respond with ONLY valid JSON:
{
  "documentType": "regulation" | "directive" | "guidance" | "standard" | "amendment",
  "jurisdiction": "Jurisdiction (e.g., EU, US, UK)",
  "effectiveDate": "YYYY-MM-DD if found",
  "summary": "Executive summary of the document",
  "keyRequirements": [
    {
      "id": "REQ-001",
      "title": "Requirement title",
      "text": "Full requirement text",
      "obligationType": "shall" | "must" | "should" | "may",
      "category": "Category (security, privacy, governance, etc.)",
      "applicability": "Who this applies to"
    }
  ],
  "affectedFrameworks": ["GDPR", "ISO 27001", etc.],
  "impactAssessment": "Assessment of impact on organizations",
  "actionRequired": "immediate" | "short_term" | "long_term" | "monitoring"
}`;

    const prompt = `Analyze the following regulatory document:

Document: ${metadata.documentName}
${metadata.jurisdiction ? `Jurisdiction: ${metadata.jurisdiction}` : ''}
${metadata.documentType ? `Type: ${metadata.documentType}` : ''}

Content:
${documentContent.substring(0, 50000)}

Extract all compliance requirements and provide analysis.`;

    const response = await this.query(prompt, {
      systemPrompt,
      responseFormat: 'json',
      temperature: 0.1,
      maxTokens: 8192
    });

    if (!response.success) {
      return {
        documentType: 'regulation',
        jurisdiction: metadata.jurisdiction || 'Unknown',
        summary: 'Analysis could not be completed',
        keyRequirements: [],
        affectedFrameworks: [],
        impactAssessment: 'Unable to assess',
        actionRequired: 'monitoring'
      };
    }

    try {
      let jsonStr = response.data.response;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();
      return JSON.parse(jsonStr);
    } catch {
      return {
        documentType: 'regulation',
        jurisdiction: metadata.jurisdiction || 'Unknown',
        summary: 'Failed to parse analysis',
        keyRequirements: [],
        affectedFrameworks: [],
        impactAssessment: 'Unable to assess',
        actionRequired: 'monitoring'
      };
    }
  }

  /**
   * Generate compliance controls from regulatory requirements
   */
  async generateControlsFromRequirements(
    requirements: Array<{ id: string; title: string; text: string }>,
    frameworkContext: {
      frameworkId: string;
      frameworkName: string;
      existingControls?: Array<{ id: string; title: string }>;
    }
  ): Promise<GeneratedControlResult> {
    const systemPrompt = `You are an expert in compliance control design, creating actionable controls from regulatory requirements.

For each requirement, generate one or more specific, measurable, and implementable controls.

Respond with ONLY valid JSON:
{
  "controls": [
    {
      "controlId": "${frameworkContext.frameworkId.toUpperCase()}-XXX",
      "title": "Control title",
      "description": "Detailed control description",
      "category": "organizational" | "people" | "physical" | "technological",
      "controlType": "preventive" | "detective" | "corrective" | "deterrent",
      "domain": "Control domain",
      "guidance": "Implementation guidance",
      "evidenceTypes": ["policy_document", "audit_log", etc.],
      "assessmentCriteria": "Criteria for assessing compliance",
      "aiPrompt": "Prompt for AI-assisted assessment",
      "implementationDifficulty": "low" | "medium" | "high" | "very_high",
      "sourceReference": "Reference to source requirement"
    }
  ],
  "mappings": [
    {
      "generatedControlId": "Control ID",
      "existingControlId": "Existing control ID",
      "relationship": "equivalent" | "partial" | "related" | "supersedes",
      "confidence": 0.0-1.0
    }
  ],
  "confidence": 0.0-1.0,
  "notes": ["Note about generation process"]
}`;

    const prompt = `Generate compliance controls for the following requirements:

Framework: ${frameworkContext.frameworkName} (${frameworkContext.frameworkId})

Requirements:
${requirements.map(r => `${r.id}: ${r.title}\n${r.text}`).join('\n\n')}

${frameworkContext.existingControls?.length
  ? `Existing Controls (map if similar):\n${frameworkContext.existingControls.map(c => `${c.id}: ${c.title}`).join('\n')}`
  : ''}

Generate specific, actionable controls.`;

    const response = await this.query(prompt, {
      systemPrompt,
      responseFormat: 'json',
      temperature: 0.2,
      maxTokens: 8192
    });

    if (!response.success) {
      return { controls: [], mappings: [], confidence: 0, notes: ['Generation failed'] };
    }

    try {
      let jsonStr = response.data.response;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();
      return JSON.parse(jsonStr);
    } catch {
      return { controls: [], mappings: [], confidence: 0, notes: ['Failed to parse generated controls'] };
    }
  }

  /**
   * Assess framework relevance for an entity
   */
  async assessFrameworkRelevance(
    entityProfile: {
      industry: string;
      jurisdictions: string[];
      entitySize: string;
      processesPersonalData: boolean;
      usesAiSystems: boolean;
      isCriticalInfrastructure: boolean;
      dataCategories?: string[];
    },
    frameworkInfo: {
      name: string;
      description: string;
      jurisdiction: string;
      category: string;
    }
  ): Promise<FrameworkRelevanceResult> {
    const systemPrompt = `You are an expert in regulatory compliance, determining which frameworks apply to specific organizations.

Analyze the entity profile and framework to determine applicability.

Respond with ONLY valid JSON:
{
  "frameworkName": "${frameworkInfo.name}",
  "relevanceScore": 0.0-1.0,
  "applicabilityFactors": [
    {
      "factor": "Factor name",
      "applies": true | false,
      "weight": 0.0-1.0,
      "explanation": "Why this factor applies or not"
    }
  ],
  "recommendation": "required" | "recommended" | "optional" | "not_applicable",
  "rationale": "Detailed rationale for the recommendation",
  "implementationPriority": "immediate" | "high" | "medium" | "low"
}`;

    const prompt = `Assess framework relevance:

Entity Profile:
- Industry: ${entityProfile.industry}
- Jurisdictions: ${entityProfile.jurisdictions.join(', ')}
- Size: ${entityProfile.entitySize}
- Processes Personal Data: ${entityProfile.processesPersonalData}
- Uses AI Systems: ${entityProfile.usesAiSystems}
- Critical Infrastructure: ${entityProfile.isCriticalInfrastructure}
${entityProfile.dataCategories?.length ? `- Data Categories: ${entityProfile.dataCategories.join(', ')}` : ''}

Framework:
- Name: ${frameworkInfo.name}
- Description: ${frameworkInfo.description}
- Jurisdiction: ${frameworkInfo.jurisdiction}
- Category: ${frameworkInfo.category}

Determine if this framework is applicable and to what extent.`;

    const response = await this.query(prompt, {
      systemPrompt,
      responseFormat: 'json',
      temperature: 0.2,
      maxTokens: 2048
    });

    if (!response.success) {
      return {
        frameworkName: frameworkInfo.name,
        relevanceScore: 0.5,
        applicabilityFactors: [],
        recommendation: 'optional',
        rationale: 'Assessment could not be completed',
        implementationPriority: 'medium'
      };
    }

    try {
      let jsonStr = response.data.response;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();
      return JSON.parse(jsonStr);
    } catch {
      return {
        frameworkName: frameworkInfo.name,
        relevanceScore: 0.5,
        applicabilityFactors: [],
        recommendation: 'optional',
        rationale: 'Failed to parse assessment',
        implementationPriority: 'medium'
      };
    }
  }

  /**
   * Learn from feedback and improve assessment prompts
   */
  async improveAssessmentPrompt(
    controlId: string,
    originalPrompt: string,
    feedback: {
      incorrectRating?: string;
      correctRating: string;
      feedbackText: string;
      falsePositive?: boolean;
      falseNegative?: boolean;
    }
  ): Promise<PromptImprovementResult> {
    const systemPrompt = `You are an expert in improving AI assessment prompts based on feedback.

Analyze the feedback and create an improved prompt that:
1. Addresses the identified issues
2. Reduces false positives/negatives
3. Improves clarity and specificity
4. Maintains objectivity

Respond with ONLY valid JSON:
{
  "originalPrompt": "Original prompt",
  "improvedPrompt": "Improved prompt text",
  "improvements": ["Improvement 1", "Improvement 2"],
  "expectedConfidenceGain": 0.0-0.5,
  "testCases": ["Test case 1 to validate improvement"]
}`;

    const prompt = `Improve the following assessment prompt based on feedback:

Control ID: ${controlId}

Original Prompt:
${originalPrompt}

Feedback:
- ${feedback.incorrectRating ? `Incorrect Rating Given: ${feedback.incorrectRating}` : ''}
- Correct Rating Should Be: ${feedback.correctRating}
- Feedback: ${feedback.feedbackText}
${feedback.falsePositive ? '- Issue: False Positive (marked compliant when not)' : ''}
${feedback.falseNegative ? '- Issue: False Negative (marked non-compliant when it was)' : ''}

Create an improved prompt that addresses this feedback.`;

    const response = await this.query(prompt, {
      systemPrompt,
      responseFormat: 'json',
      temperature: 0.3,
      maxTokens: 2048
    });

    if (!response.success) {
      return {
        originalPrompt,
        improvedPrompt: originalPrompt,
        improvements: [],
        expectedConfidenceGain: 0,
        testCases: []
      };
    }

    try {
      let jsonStr = response.data.response;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();
      return JSON.parse(jsonStr);
    } catch {
      return {
        originalPrompt,
        improvedPrompt: originalPrompt,
        improvements: [],
        expectedConfidenceGain: 0,
        testCases: []
      };
    }
  }
}

export default MageAgentClient;
