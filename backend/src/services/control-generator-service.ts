/**
 * Control Generator Service
 *
 * AI-powered service for generating compliance controls from regulatory documents,
 * updates, and discovered frameworks. Uses MageAgent for intelligent extraction
 * and mapping of requirements to actionable controls.
 *
 * Part of the Autonomous Compliance Learning System.
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types
// ============================================================================

export type ControlCategory =
  | 'organizational'
  | 'people'
  | 'physical'
  | 'technological';

export type ControlType =
  | 'preventive'
  | 'detective'
  | 'corrective'
  | 'deterrent';

export type ControlStatus =
  | 'generated'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'implemented';

export type ImplementationDifficulty =
  | 'low'
  | 'medium'
  | 'high'
  | 'very_high';

export interface GeneratedControl {
  id: string;
  frameworkId: string;
  controlId: string;
  title: string;
  description: string;
  category: ControlCategory;
  controlType: ControlType;
  domain: string;
  requirement?: string;
  guidance: string;
  implementationDifficulty: ImplementationDifficulty;
  evidenceTypes: string[];
  assessmentCriteria: string;
  aiPrompt?: string;
  sourceDocument?: string;
  sourceSection?: string;
  status: ControlStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  confidence: number;
  relatedControls: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ControlGenerationRequest {
  frameworkId: string;
  frameworkName: string;
  documentUrl?: string;
  documentContent?: string;
  sections?: DocumentSection[];
  generateAiPrompts?: boolean;
  mapToExisting?: boolean;
}

export interface DocumentSection {
  sectionId: string;
  title: string;
  content: string;
  articleNumber?: string;
  subSection?: string;
}

export interface GenerationResult {
  requestId: string;
  frameworkId: string;
  status: 'success' | 'partial' | 'failed';
  controlsGenerated: number;
  controlsSkipped: number;
  errors: GenerationError[];
  controls: GeneratedControl[];
  processingTime: number;
  timestamp: Date;
}

export interface GenerationError {
  section?: string;
  message: string;
  recoverable: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  controlId: string;
  field: string;
  message: string;
  severity: 'critical' | 'error';
}

export interface ValidationWarning {
  controlId: string;
  field: string;
  message: string;
}

export interface ControlRefinement {
  controlId: string;
  field: string;
  originalValue: string;
  newValue: string;
  reason: string;
}

export interface ExistingControlMapping {
  generatedControlId: string;
  existingControlId: string;
  frameworkId: string;
  similarity: number;
  mappingType: 'equivalent' | 'partial' | 'related' | 'supersedes';
}

export interface ControlGenerationContext {
  jurisdiction: string;
  industry?: string;
  aiSystemType?: string;
  riskLevel?: string;
  existingFrameworks?: string[];
}

// ============================================================================
// Service Implementation
// ============================================================================

export class ControlGeneratorService {
  constructor(private pool: Pool) {}

  // ==========================================================================
  // Control Generation
  // ==========================================================================

  /**
   * Generate controls from a regulatory document URL
   */
  async generateControlsFromUrl(
    documentUrl: string,
    frameworkId: string,
    frameworkName: string,
    context?: ControlGenerationContext
  ): Promise<GenerationResult> {
    const requestId = uuidv4();
    const startTime = Date.now();

    try {
      // In production, this would fetch and parse the document
      // For now, we'll create a placeholder result indicating the URL was received
      const result: GenerationResult = {
        requestId,
        frameworkId,
        status: 'partial',
        controlsGenerated: 0,
        controlsSkipped: 0,
        errors: [{
          message: 'Document fetching and parsing requires MageAgent integration',
          recoverable: true
        }],
        controls: [],
        processingTime: Date.now() - startTime,
        timestamp: new Date()
      };

      // Log the generation request
      await this.logGenerationRequest(requestId, frameworkId, documentUrl, result);

      return result;
    } catch (error) {
      return {
        requestId,
        frameworkId,
        status: 'failed',
        controlsGenerated: 0,
        controlsSkipped: 0,
        errors: [{
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: false
        }],
        controls: [],
        processingTime: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  /**
   * Generate controls from document text content
   */
  async generateControlsFromText(
    documentContent: string,
    frameworkId: string,
    frameworkName: string,
    context?: ControlGenerationContext
  ): Promise<GenerationResult> {
    const requestId = uuidv4();
    const startTime = Date.now();

    try {
      // Parse document into sections
      const sections = this.parseDocumentSections(documentContent);

      // Generate controls for each section
      const controls: GeneratedControl[] = [];
      const errors: GenerationError[] = [];

      for (const section of sections) {
        try {
          const sectionControls = await this.generateControlsFromSection(
            section,
            frameworkId,
            frameworkName,
            context
          );
          controls.push(...sectionControls);
        } catch (error) {
          errors.push({
            section: section.sectionId,
            message: error instanceof Error ? error.message : 'Unknown error',
            recoverable: true
          });
        }
      }

      // Store generated controls
      for (const control of controls) {
        await this.storeGeneratedControl(control);
      }

      const result: GenerationResult = {
        requestId,
        frameworkId,
        status: errors.length === 0 ? 'success' : (controls.length > 0 ? 'partial' : 'failed'),
        controlsGenerated: controls.length,
        controlsSkipped: errors.length,
        errors,
        controls,
        processingTime: Date.now() - startTime,
        timestamp: new Date()
      };

      await this.logGenerationRequest(requestId, frameworkId, 'text_content', result);

      return result;
    } catch (error) {
      return {
        requestId,
        frameworkId,
        status: 'failed',
        controlsGenerated: 0,
        controlsSkipped: 0,
        errors: [{
          message: error instanceof Error ? error.message : 'Unknown error',
          recoverable: false
        }],
        controls: [],
        processingTime: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  /**
   * Generate controls from a regulatory update
   */
  async generateControlsFromUpdate(
    updateId: string
  ): Promise<GenerationResult> {
    const requestId = uuidv4();
    const startTime = Date.now();

    // Fetch the regulatory update
    const updateResult = await this.pool.query(
      `SELECT * FROM compliance_regulatory_updates WHERE id = $1`,
      [updateId]
    );

    if (updateResult.rows.length === 0) {
      throw new Error(`Regulatory update not found: ${updateId}`);
    }

    const update = updateResult.rows[0];
    const frameworkId = update.framework_id;

    // Get existing controls for the framework
    const existingControls = await this.pool.query(
      `SELECT id, title, description FROM compliance_controls WHERE framework_id = $1`,
      [frameworkId]
    );

    // Analyze the update to determine what controls need to be added/modified
    const aiAnalysis = update.ai_analysis ? JSON.parse(update.ai_analysis) : {};

    const controls: GeneratedControl[] = [];
    const errors: GenerationError[] = [];

    // If the update has extracted requirements, generate controls
    if (aiAnalysis.extractedRequirements) {
      for (const requirement of aiAnalysis.extractedRequirements) {
        try {
          const control = this.createControlFromRequirement(
            requirement,
            frameworkId,
            update.title
          );
          controls.push(control);
        } catch (error) {
          errors.push({
            section: requirement.id,
            message: error instanceof Error ? error.message : 'Unknown error',
            recoverable: true
          });
        }
      }
    }

    // Store generated controls
    for (const control of controls) {
      await this.storeGeneratedControl(control);
    }

    // Update the regulatory update with generated controls
    await this.pool.query(
      `UPDATE compliance_regulatory_updates
       SET generated_controls = $1, status = 'analyzed'
       WHERE id = $2`,
      [JSON.stringify(controls.map(c => c.id)), updateId]
    );

    return {
      requestId,
      frameworkId,
      status: errors.length === 0 ? 'success' : 'partial',
      controlsGenerated: controls.length,
      controlsSkipped: errors.length,
      errors,
      controls,
      processingTime: Date.now() - startTime,
      timestamp: new Date()
    };
  }

  /**
   * Generate controls using AI/MageAgent
   */
  async aiGenerateControls(
    regulatoryText: string,
    context: ControlGenerationContext
  ): Promise<GeneratedControl[]> {
    // This method would call MageAgent for AI-powered control generation
    // For now, we'll use rule-based extraction

    const controls: GeneratedControl[] = [];

    // Pattern matching for common regulatory language
    const patterns = this.getExtractionPatterns();

    for (const pattern of patterns) {
      const matches = regulatoryText.match(pattern.regex);
      if (matches) {
        for (const match of matches) {
          const control = this.createControlFromPattern(
            match,
            pattern,
            context
          );
          if (control) {
            controls.push(control);
          }
        }
      }
    }

    return controls;
  }

  // ==========================================================================
  // Control Validation
  // ==========================================================================

  /**
   * Validate generated controls before implementation
   */
  async validateControls(controls: GeneratedControl[]): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    for (const control of controls) {
      // Required field validation
      if (!control.controlId || control.controlId.length < 3) {
        errors.push({
          controlId: control.id,
          field: 'controlId',
          message: 'Control ID must be at least 3 characters',
          severity: 'critical'
        });
      }

      if (!control.title || control.title.length < 10) {
        errors.push({
          controlId: control.id,
          field: 'title',
          message: 'Title must be at least 10 characters',
          severity: 'error'
        });
      }

      if (!control.description || control.description.length < 50) {
        warnings.push({
          controlId: control.id,
          field: 'description',
          message: 'Description should be more detailed (at least 50 characters)'
        });
      }

      // Check for duplicate control IDs
      const duplicateCheck = await this.pool.query(
        `SELECT id FROM compliance_controls WHERE id = $1`,
        [control.controlId]
      );
      if (duplicateCheck.rows.length > 0) {
        errors.push({
          controlId: control.id,
          field: 'controlId',
          message: `Control ID '${control.controlId}' already exists in the system`,
          severity: 'critical'
        });
      }

      // Check evidence types
      if (!control.evidenceTypes || control.evidenceTypes.length === 0) {
        warnings.push({
          controlId: control.id,
          field: 'evidenceTypes',
          message: 'No evidence types specified - assessment may be difficult'
        });
      }

      // Check AI prompt
      if (!control.aiPrompt) {
        suggestions.push(
          `Control ${control.controlId}: Consider adding an AI assessment prompt for automated evaluation`
        );
      }

      // Low confidence check
      if (control.confidence < 0.7) {
        warnings.push({
          controlId: control.id,
          field: 'confidence',
          message: `Low confidence (${control.confidence.toFixed(2)}) - manual review recommended`
        });
      }
    }

    return {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Refine controls based on feedback
   */
  async refineControls(
    controls: GeneratedControl[],
    feedback: string
  ): Promise<{ refinedControls: GeneratedControl[]; refinements: ControlRefinement[] }> {
    const refinements: ControlRefinement[] = [];
    const refinedControls = [...controls];

    // Parse feedback for specific refinement instructions
    const feedbackLower = feedback.toLowerCase();

    for (let i = 0; i < refinedControls.length; i++) {
      const control = refinedControls[i];

      // Check for title refinement requests
      if (feedbackLower.includes('title') && feedbackLower.includes(control.controlId.toLowerCase())) {
        // Would use AI to suggest better title
        refinements.push({
          controlId: control.id,
          field: 'title',
          originalValue: control.title,
          newValue: control.title, // Would be AI-refined
          reason: 'Title refinement based on feedback'
        });
      }

      // Check for description refinement
      if (feedbackLower.includes('description') || feedbackLower.includes('detail')) {
        refinements.push({
          controlId: control.id,
          field: 'description',
          originalValue: control.description,
          newValue: control.description, // Would be AI-enhanced
          reason: 'Description enhanced for clarity'
        });
      }

      // Check for difficulty adjustment
      if (feedbackLower.includes('easier') || feedbackLower.includes('simpler')) {
        if (control.implementationDifficulty !== 'low') {
          const newDifficulty = this.lowerDifficulty(control.implementationDifficulty);
          refinements.push({
            controlId: control.id,
            field: 'implementationDifficulty',
            originalValue: control.implementationDifficulty,
            newValue: newDifficulty,
            reason: 'Difficulty adjusted based on feedback'
          });
          refinedControls[i] = { ...control, implementationDifficulty: newDifficulty };
        }
      }
    }

    return { refinedControls, refinements };
  }

  // ==========================================================================
  // Control Implementation
  // ==========================================================================

  /**
   * Implement generated controls into the compliance framework
   */
  async implementControls(
    controlIds: string[],
    reviewedBy: string
  ): Promise<{ implemented: number; failed: number; errors: string[] }> {
    let implemented = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const controlId of controlIds) {
      try {
        // Get the generated control
        const genControl = await this.getGeneratedControl(controlId);
        if (!genControl) {
          errors.push(`Generated control not found: ${controlId}`);
          failed++;
          continue;
        }

        if (genControl.status === 'implemented') {
          errors.push(`Control ${controlId} is already implemented`);
          failed++;
          continue;
        }

        // Insert into the main compliance_controls table
        await this.pool.query(
          `INSERT INTO compliance_controls (
            id, framework_id, title, description, category, domain,
            guidance, evidence_types, assessment_criteria, ai_assessment_prompt,
            is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            guidance = EXCLUDED.guidance,
            updated_at = EXCLUDED.updated_at`,
          [
            genControl.controlId,
            genControl.frameworkId,
            genControl.title,
            genControl.description,
            genControl.category,
            genControl.domain,
            genControl.guidance,
            JSON.stringify(genControl.evidenceTypes),
            genControl.assessmentCriteria,
            genControl.aiPrompt,
            true,
            new Date(),
            new Date()
          ]
        );

        // Update generated control status
        await this.pool.query(
          `UPDATE compliance_generated_controls
           SET status = 'implemented',
               reviewed_by = $1,
               reviewed_at = $2,
               updated_at = $2
           WHERE id = $3`,
          [reviewedBy, new Date(), controlId]
        );

        implemented++;
      } catch (error) {
        errors.push(`Error implementing ${controlId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failed++;
      }
    }

    return { implemented, failed, errors };
  }

  /**
   * Approve a generated control
   */
  async approveControl(
    controlId: string,
    reviewedBy: string,
    notes?: string
  ): Promise<GeneratedControl | null> {
    const result = await this.pool.query(
      `UPDATE compliance_generated_controls
       SET status = 'approved',
           reviewed_by = $1,
           reviewed_at = $2,
           review_notes = $3,
           updated_at = $2
       WHERE id = $4
       RETURNING *`,
      [reviewedBy, new Date(), notes || null, controlId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToGeneratedControl(result.rows[0]);
  }

  /**
   * Reject a generated control
   */
  async rejectControl(
    controlId: string,
    reviewedBy: string,
    reason: string
  ): Promise<GeneratedControl | null> {
    const result = await this.pool.query(
      `UPDATE compliance_generated_controls
       SET status = 'rejected',
           reviewed_by = $1,
           reviewed_at = $2,
           review_notes = $3,
           updated_at = $2
       WHERE id = $4
       RETURNING *`,
      [reviewedBy, new Date(), reason, controlId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToGeneratedControl(result.rows[0]);
  }

  // ==========================================================================
  // Control Mapping
  // ==========================================================================

  /**
   * Map generated controls to existing controls in other frameworks
   */
  async mapToExistingControls(controlId: string): Promise<ExistingControlMapping[]> {
    const genControl = await this.getGeneratedControl(controlId);
    if (!genControl) {
      throw new Error(`Generated control not found: ${controlId}`);
    }

    const mappings: ExistingControlMapping[] = [];

    // Get existing controls from other frameworks
    const existingControls = await this.pool.query(
      `SELECT id, framework_id, title, description, category, domain
       FROM compliance_controls
       WHERE framework_id != $1
       AND is_active = true`,
      [genControl.frameworkId]
    );

    for (const existing of existingControls.rows) {
      const similarity = this.calculateControlSimilarity(genControl, existing);

      if (similarity >= 0.6) {
        const mapping: ExistingControlMapping = {
          generatedControlId: genControl.id,
          existingControlId: existing.id,
          frameworkId: existing.framework_id,
          similarity,
          mappingType: this.determineMappingType(similarity)
        };
        mappings.push(mapping);

        // Store the mapping
        await this.pool.query(
          `INSERT INTO control_cross_references (
            id, source_control_id, target_control_id, relationship_type,
            mapping_confidence, mapped_by, created_at
          ) VALUES ($1, $2, $3, $4, $5, 'ai', $6)
          ON CONFLICT (source_control_id, target_control_id) DO UPDATE SET
            mapping_confidence = EXCLUDED.mapping_confidence`,
          [
            uuidv4(),
            genControl.controlId,
            existing.id,
            mapping.mappingType,
            similarity,
            new Date()
          ]
        );
      }
    }

    return mappings.sort((a, b) => b.similarity - a.similarity);
  }

  // ==========================================================================
  // Query Methods
  // ==========================================================================

  /**
   * Get a generated control by ID
   */
  async getGeneratedControl(id: string): Promise<GeneratedControl | null> {
    const result = await this.pool.query(
      `SELECT * FROM compliance_generated_controls WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToGeneratedControl(result.rows[0]);
  }

  /**
   * List generated controls
   */
  async listGeneratedControls(options?: {
    frameworkId?: string;
    status?: ControlStatus;
    minConfidence?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ controls: GeneratedControl[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (options?.frameworkId) {
      conditions.push(`framework_id = $${paramIndex++}`);
      values.push(options.frameworkId);
    }
    if (options?.status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(options.status);
    }
    if (options?.minConfidence !== undefined) {
      conditions.push(`confidence >= $${paramIndex++}`);
      values.push(options.minConfidence);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const countResult = await this.pool.query(
      `SELECT COUNT(*) FROM compliance_generated_controls ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    values.push(limit, offset);

    const result = await this.pool.query(
      `SELECT * FROM compliance_generated_controls
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      values
    );

    return {
      controls: result.rows.map(row => this.mapRowToGeneratedControl(row)),
      total
    };
  }

  /**
   * Get controls pending review
   */
  async getPendingReviewControls(limit?: number): Promise<GeneratedControl[]> {
    const result = await this.pool.query(
      `SELECT * FROM compliance_generated_controls
       WHERE status IN ('generated', 'pending_review')
       ORDER BY confidence DESC, created_at ASC
       LIMIT $1`,
      [limit || 20]
    );

    return result.rows.map(row => this.mapRowToGeneratedControl(row));
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private parseDocumentSections(content: string): DocumentSection[] {
    const sections: DocumentSection[] = [];

    // Simple section parsing - split by numbered headings
    const sectionPattern = /(?:^|\n)(?:Article\s+(\d+)|(\d+\.)\s+|(?:##?\s*))(.*?)(?=(?:^|\n)(?:Article\s+\d+|\d+\.\s+|##?\s+)|$)/gis;

    let match;
    let index = 0;
    while ((match = sectionPattern.exec(content)) !== null) {
      const articleNumber = match[1] || match[2]?.replace('.', '') || undefined;
      const title = match[3]?.trim() || `Section ${index + 1}`;
      const sectionContent = match[0];

      sections.push({
        sectionId: `section-${index}`,
        title,
        content: sectionContent,
        articleNumber
      });
      index++;
    }

    // If no sections found, treat entire content as one section
    if (sections.length === 0) {
      sections.push({
        sectionId: 'section-0',
        title: 'Full Document',
        content
      });
    }

    return sections;
  }

  private async generateControlsFromSection(
    section: DocumentSection,
    frameworkId: string,
    frameworkName: string,
    context?: ControlGenerationContext
  ): Promise<GeneratedControl[]> {
    const controls: GeneratedControl[] = [];

    // Extract requirements from the section
    const requirements = this.extractRequirements(section.content);

    for (let i = 0; i < requirements.length; i++) {
      const req = requirements[i];
      const controlId = `${frameworkId.toUpperCase()}-${section.articleNumber || section.sectionId}-${i + 1}`;

      const control: GeneratedControl = {
        id: uuidv4(),
        frameworkId,
        controlId,
        title: this.generateControlTitle(req, section.title),
        description: req,
        category: this.inferCategory(req),
        controlType: this.inferControlType(req),
        domain: section.title,
        requirement: section.articleNumber ? `Article ${section.articleNumber}` : undefined,
        guidance: this.generateGuidance(req),
        implementationDifficulty: this.inferDifficulty(req),
        evidenceTypes: this.inferEvidenceTypes(req),
        assessmentCriteria: this.generateAssessmentCriteria(req),
        aiPrompt: this.generateAiPrompt(req, frameworkName),
        sourceDocument: frameworkName,
        sourceSection: section.title,
        status: 'generated',
        confidence: this.calculateConfidence(req),
        relatedControls: [],
        metadata: { context },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      controls.push(control);
    }

    return controls;
  }

  private extractRequirements(content: string): string[] {
    const requirements: string[] = [];

    // Pattern for "shall", "must", "required to" statements
    const patterns = [
      /[^.]*\b(?:shall|must|required to|obligated to|needs to)\b[^.]+\./gi,
      /[^.]*\b(?:ensure|maintain|implement|establish|provide)\b[^.]+\./gi
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          const cleaned = match.trim();
          if (cleaned.length > 20 && !requirements.includes(cleaned)) {
            requirements.push(cleaned);
          }
        }
      }
    }

    return requirements;
  }

  private generateControlTitle(requirement: string, sectionTitle: string): string {
    // Extract key action words and create a title
    const words = requirement.split(/\s+/).slice(0, 8);
    let title = words.join(' ');

    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }

    return title.charAt(0).toUpperCase() + title.slice(1);
  }

  private inferCategory(requirement: string): ControlCategory {
    const lower = requirement.toLowerCase();

    if (lower.includes('staff') || lower.includes('training') || lower.includes('personnel') || lower.includes('employee')) {
      return 'people';
    }
    if (lower.includes('physical') || lower.includes('premises') || lower.includes('access control') || lower.includes('facility')) {
      return 'physical';
    }
    if (lower.includes('system') || lower.includes('software') || lower.includes('technical') || lower.includes('encrypt') || lower.includes('network')) {
      return 'technological';
    }

    return 'organizational';
  }

  private inferControlType(requirement: string): ControlType {
    const lower = requirement.toLowerCase();

    if (lower.includes('prevent') || lower.includes('prohibit') || lower.includes('restrict') || lower.includes('block')) {
      return 'preventive';
    }
    if (lower.includes('detect') || lower.includes('monitor') || lower.includes('identify') || lower.includes('log') || lower.includes('audit')) {
      return 'detective';
    }
    if (lower.includes('correct') || lower.includes('remediat') || lower.includes('restor') || lower.includes('recover')) {
      return 'corrective';
    }

    return 'deterrent';
  }

  private inferDifficulty(requirement: string): ImplementationDifficulty {
    const lower = requirement.toLowerCase();

    if (lower.includes('complex') || lower.includes('comprehensive') || lower.includes('enterprise-wide')) {
      return 'very_high';
    }
    if (lower.includes('system') || lower.includes('technical') || lower.includes('architecture')) {
      return 'high';
    }
    if (lower.includes('process') || lower.includes('procedure') || lower.includes('policy')) {
      return 'medium';
    }

    return 'low';
  }

  private inferEvidenceTypes(requirement: string): string[] {
    const types: string[] = [];
    const lower = requirement.toLowerCase();

    if (lower.includes('document') || lower.includes('policy') || lower.includes('procedure')) {
      types.push('policy_document');
    }
    if (lower.includes('log') || lower.includes('record') || lower.includes('audit')) {
      types.push('audit_log');
    }
    if (lower.includes('test') || lower.includes('assess') || lower.includes('evaluat')) {
      types.push('test_report');
    }
    if (lower.includes('screen') || lower.includes('configur') || lower.includes('setting')) {
      types.push('screenshot');
    }
    if (lower.includes('train') || lower.includes('certif')) {
      types.push('certificate');
    }

    if (types.length === 0) {
      types.push('policy_document');
    }

    return types;
  }

  private generateGuidance(requirement: string): string {
    return `To comply with this control, organizations should implement measures to ${requirement.toLowerCase()}. This includes establishing appropriate policies, procedures, and technical controls.`;
  }

  private generateAssessmentCriteria(requirement: string): string {
    return `Verify that the organization has implemented controls to address the following: ${requirement}. Evidence should demonstrate ongoing compliance and regular review.`;
  }

  private generateAiPrompt(requirement: string, frameworkName: string): string {
    return `Assess the organization's compliance with the following ${frameworkName} requirement: "${requirement}"

Consider:
1. Are appropriate policies and procedures in place?
2. Is there evidence of implementation?
3. Are controls operating effectively?
4. Are there any gaps or areas for improvement?

Provide a compliance rating (compliant, partially_compliant, non_compliant) with justification.`;
  }

  private calculateConfidence(requirement: string): number {
    let confidence = 0.5;

    // Higher confidence for clearer requirement language
    if (requirement.includes('shall') || requirement.includes('must')) {
      confidence += 0.2;
    }
    if (requirement.length > 100) {
      confidence += 0.1;
    }
    if (requirement.includes('Article') || requirement.includes('Section')) {
      confidence += 0.1;
    }

    return Math.min(confidence, 0.95);
  }

  private createControlFromRequirement(
    requirement: any,
    frameworkId: string,
    sourceTitle: string
  ): GeneratedControl {
    return {
      id: uuidv4(),
      frameworkId,
      controlId: requirement.id || `${frameworkId.toUpperCase()}-GEN-${Date.now()}`,
      title: requirement.title || 'Generated Control',
      description: requirement.text || requirement.description,
      category: requirement.category || 'organizational',
      controlType: requirement.type || 'preventive',
      domain: requirement.domain || 'General',
      guidance: requirement.guidance || 'Implement appropriate controls.',
      implementationDifficulty: requirement.difficulty || 'medium',
      evidenceTypes: requirement.evidenceTypes || ['policy_document'],
      assessmentCriteria: requirement.criteria || 'Verify implementation.',
      sourceDocument: sourceTitle,
      status: 'generated',
      confidence: 0.7,
      relatedControls: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private createControlFromPattern(
    match: string,
    pattern: any,
    context: ControlGenerationContext
  ): GeneratedControl | null {
    if (match.length < 20) return null;

    return {
      id: uuidv4(),
      frameworkId: 'auto-generated',
      controlId: `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: this.generateControlTitle(match, pattern.name),
      description: match,
      category: pattern.category || 'organizational',
      controlType: pattern.controlType || 'preventive',
      domain: pattern.domain || 'General',
      guidance: this.generateGuidance(match),
      implementationDifficulty: this.inferDifficulty(match),
      evidenceTypes: this.inferEvidenceTypes(match),
      assessmentCriteria: this.generateAssessmentCriteria(match),
      status: 'generated',
      confidence: 0.6,
      relatedControls: [],
      metadata: { context, patternName: pattern.name },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private getExtractionPatterns(): any[] {
    return [
      {
        name: 'Obligation',
        regex: /[^.]*\bshall\b[^.]+\./gi,
        category: 'organizational',
        controlType: 'preventive'
      },
      {
        name: 'Requirement',
        regex: /[^.]*\bmust\b[^.]+\./gi,
        category: 'organizational',
        controlType: 'preventive'
      },
      {
        name: 'Security',
        regex: /[^.]*\b(?:security|protect|safeguard)\b[^.]+\./gi,
        category: 'technological',
        controlType: 'preventive'
      },
      {
        name: 'Audit',
        regex: /[^.]*\b(?:audit|log|monitor)\b[^.]+\./gi,
        category: 'organizational',
        controlType: 'detective'
      }
    ];
  }

  private calculateControlSimilarity(
    genControl: GeneratedControl,
    existing: any
  ): number {
    let similarity = 0;

    // Category match
    if (genControl.category === existing.category) {
      similarity += 0.2;
    }

    // Domain similarity
    if (genControl.domain?.toLowerCase().includes(existing.domain?.toLowerCase()) ||
        existing.domain?.toLowerCase().includes(genControl.domain?.toLowerCase())) {
      similarity += 0.2;
    }

    // Title word overlap
    const genWords = new Set(genControl.title.toLowerCase().split(/\W+/));
    const existWords = new Set(existing.title.toLowerCase().split(/\W+/));
    const intersection = [...genWords].filter(w => existWords.has(w));
    similarity += (intersection.length / Math.max(genWords.size, existWords.size)) * 0.3;

    // Description word overlap
    const genDescWords = new Set(genControl.description.toLowerCase().split(/\W+/).slice(0, 50));
    const existDescWords = new Set((existing.description || '').toLowerCase().split(/\W+/).slice(0, 50));
    const descIntersection = [...genDescWords].filter(w => existDescWords.has(w));
    similarity += (descIntersection.length / Math.max(genDescWords.size, existDescWords.size || 1)) * 0.3;

    return Math.min(similarity, 1.0);
  }

  private determineMappingType(similarity: number): 'equivalent' | 'partial' | 'related' | 'supersedes' {
    if (similarity >= 0.9) return 'equivalent';
    if (similarity >= 0.75) return 'partial';
    if (similarity >= 0.6) return 'related';
    return 'related';
  }

  private lowerDifficulty(current: ImplementationDifficulty): ImplementationDifficulty {
    const order: ImplementationDifficulty[] = ['low', 'medium', 'high', 'very_high'];
    const index = order.indexOf(current);
    return order[Math.max(0, index - 1)];
  }

  private async storeGeneratedControl(control: GeneratedControl): Promise<void> {
    await this.pool.query(
      `INSERT INTO compliance_generated_controls (
        id, framework_id, control_id, title, description, category,
        control_type, domain, requirement, guidance, implementation_difficulty,
        evidence_types, assessment_criteria, ai_prompt, source_document,
        source_section, status, confidence, related_controls, metadata,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at`,
      [
        control.id,
        control.frameworkId,
        control.controlId,
        control.title,
        control.description,
        control.category,
        control.controlType,
        control.domain,
        control.requirement || null,
        control.guidance,
        control.implementationDifficulty,
        JSON.stringify(control.evidenceTypes),
        control.assessmentCriteria,
        control.aiPrompt || null,
        control.sourceDocument || null,
        control.sourceSection || null,
        control.status,
        control.confidence,
        JSON.stringify(control.relatedControls),
        JSON.stringify(control.metadata || {}),
        control.createdAt,
        control.updatedAt
      ]
    );
  }

  private async logGenerationRequest(
    requestId: string,
    frameworkId: string,
    source: string,
    result: GenerationResult
  ): Promise<void> {
    // Log for audit/debugging purposes
    await this.pool.query(
      `INSERT INTO compliance_generated_controls (
        id, framework_id, control_id, title, description, category,
        control_type, domain, guidance, implementation_difficulty,
        evidence_types, assessment_criteria, status, confidence,
        related_controls, metadata, created_at, updated_at
      ) SELECT
        gen_random_uuid(), $1, 'LOG-' || $2, 'Generation Request Log', $3,
        'organizational', 'preventive', 'Logging', 'N/A', 'low',
        '[]'::jsonb, 'N/A', 'generated', 0, '[]'::jsonb, $4::jsonb, NOW(), NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM compliance_generated_controls WHERE control_id = 'LOG-' || $2
      )`,
      [
        frameworkId,
        requestId,
        `Source: ${source}, Generated: ${result.controlsGenerated}, Skipped: ${result.controlsSkipped}`,
        JSON.stringify({
          requestId,
          source,
          result: {
            status: result.status,
            controlsGenerated: result.controlsGenerated,
            controlsSkipped: result.controlsSkipped,
            processingTime: result.processingTime,
            errors: result.errors
          }
        })
      ]
    );
  }

  private mapRowToGeneratedControl(row: any): GeneratedControl {
    return {
      id: row.id,
      frameworkId: row.framework_id,
      controlId: row.control_id,
      title: row.title,
      description: row.description,
      category: row.category as ControlCategory,
      controlType: row.control_type as ControlType,
      domain: row.domain,
      requirement: row.requirement || undefined,
      guidance: row.guidance,
      implementationDifficulty: row.implementation_difficulty as ImplementationDifficulty,
      evidenceTypes: Array.isArray(row.evidence_types)
        ? row.evidence_types
        : JSON.parse(row.evidence_types || '[]'),
      assessmentCriteria: row.assessment_criteria,
      aiPrompt: row.ai_prompt || undefined,
      sourceDocument: row.source_document || undefined,
      sourceSection: row.source_section || undefined,
      status: row.status as ControlStatus,
      reviewedBy: row.reviewed_by || undefined,
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
      reviewNotes: row.review_notes || undefined,
      confidence: parseFloat(row.confidence) || 0,
      relatedControls: Array.isArray(row.related_controls)
        ? row.related_controls
        : JSON.parse(row.related_controls || '[]'),
      metadata: typeof row.metadata === 'string'
        ? JSON.parse(row.metadata)
        : (row.metadata || {}),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}
