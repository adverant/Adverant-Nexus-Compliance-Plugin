/**
 * Regulatory Monitor Service - Monitors regulatory sources for updates
 * Part of the autonomous compliance learning system
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

export interface RegulatorySource {
  id: string;
  name: string;
  sourceType: 'official_journal' | 'regulator_website' | 'standards_body' | 'rss' | 'api';
  url: string;
  jurisdiction: string;
  category: string;
  relatedFrameworks: string[];
  checkFrequency: 'hourly' | 'daily' | 'weekly';
  contentSelectors: Record<string, string>;
  changeDetectionMethod: 'hash' | 'text_diff' | 'structured';
  lastCheckedAt?: Date;
  lastChangeDetectedAt?: Date;
  lastContentHash?: string;
  consecutiveFailures: number;
  isActive: boolean;
  status: 'active' | 'paused' | 'error' | 'retired';
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegulatoryUpdate {
  id: string;
  sourceId: string;
  frameworkId?: string;
  updateType: 'new_framework' | 'amendment' | 'guidance' | 'enforcement' | 'deadline' | 'repeal';
  title: string;
  summary?: string;
  originalUrl?: string;
  detectedAt: Date;
  effectiveDate?: Date;
  publicationDate?: Date;
  impactLevel: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  affectedSectors: string[];
  affectedEntityTypes: string[];
  aiAnalysis: Record<string, unknown>;
  aiSummary?: string;
  aiRecommendedActions: string[];
  generatedControls: unknown[];
  controlsImplemented: boolean;
  status: 'pending' | 'analyzed' | 'implementing' | 'implemented' | 'rejected' | 'archived';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  notificationsSent: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DetectedChange {
  sourceId: string;
  changeType: 'new_content' | 'modified_content' | 'structural_change';
  summary: string;
  affectedUrl: string;
  contentSnippet?: string;
  detectedAt: Date;
}

export interface ChangeAnalysis {
  isRelevant: boolean;
  updateType: RegulatoryUpdate['updateType'];
  impactLevel: RegulatoryUpdate['impactLevel'];
  summary: string;
  recommendedActions: string[];
  affectedFrameworks: string[];
}

export interface MageAgentClient {
  analyzeRegulatoryChange(content: string, sourceInfo: { name: string; jurisdiction: string; category: string }): Promise<ChangeAnalysis>;
}

export class RegulatoryMonitorService {
  constructor(
    private pool: Pool,
    private mageAgentClient?: MageAgentClient
  ) {}

  // ============================================================================
  // SOURCE MANAGEMENT
  // ============================================================================

  /**
   * Add a new regulatory source
   */
  async addSource(
    source: Omit<RegulatorySource, 'id' | 'lastCheckedAt' | 'lastChangeDetectedAt' | 'lastContentHash' | 'consecutiveFailures' | 'createdAt' | 'updatedAt'>
  ): Promise<RegulatorySource> {
    const id = uuidv4();

    const result = await this.pool.query(
      `INSERT INTO compliance_regulatory_sources (
        id, name, source_type, url, jurisdiction, category, related_frameworks,
        check_frequency, content_selectors, change_detection_method,
        is_active, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        id,
        source.name,
        source.sourceType,
        source.url,
        source.jurisdiction,
        source.category,
        JSON.stringify(source.relatedFrameworks),
        source.checkFrequency,
        JSON.stringify(source.contentSelectors),
        source.changeDetectionMethod,
        source.isActive,
        source.status,
      ]
    );

    return this.mapRowToSource(result.rows[0]);
  }

  /**
   * Get source by ID
   */
  async getSource(id: string): Promise<RegulatorySource | null> {
    const result = await this.pool.query(
      `SELECT * FROM compliance_regulatory_sources WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToSource(result.rows[0]);
  }

  /**
   * List all active sources
   */
  async listSources(filters?: {
    isActive?: boolean;
    jurisdiction?: string;
    category?: string;
  }): Promise<RegulatorySource[]> {
    let whereClause = 'WHERE 1=1';
    const params: (string | boolean)[] = [];
    let paramIndex = 1;

    if (filters?.isActive !== undefined) {
      whereClause += ` AND is_active = $${paramIndex}`;
      params.push(filters.isActive);
      paramIndex++;
    }

    if (filters?.jurisdiction) {
      whereClause += ` AND jurisdiction = $${paramIndex}`;
      params.push(filters.jurisdiction);
      paramIndex++;
    }

    if (filters?.category) {
      whereClause += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    const result = await this.pool.query(
      `SELECT * FROM compliance_regulatory_sources ${whereClause} ORDER BY name`,
      params
    );

    return result.rows.map((row) => this.mapRowToSource(row));
  }

  /**
   * Update source status
   */
  async updateSourceStatus(
    id: string,
    status: RegulatorySource['status'],
    isActive?: boolean
  ): Promise<RegulatorySource | null> {
    const result = await this.pool.query(
      `UPDATE compliance_regulatory_sources
       SET status = $2, is_active = COALESCE($3, is_active), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, status, isActive]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToSource(result.rows[0]);
  }

  /**
   * Delete source
   */
  async deleteSource(id: string): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM compliance_regulatory_sources WHERE id = $1`,
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  // ============================================================================
  // MONITORING
  // ============================================================================

  /**
   * Get sources due for checking
   */
  async getSourcesDueForCheck(): Promise<RegulatorySource[]> {
    const result = await this.pool.query(
      `SELECT * FROM compliance_regulatory_sources
       WHERE is_active = true
         AND status = 'active'
         AND (
           last_checked_at IS NULL
           OR (check_frequency = 'hourly' AND last_checked_at < NOW() - INTERVAL '1 hour')
           OR (check_frequency = 'daily' AND last_checked_at < NOW() - INTERVAL '1 day')
           OR (check_frequency = 'weekly' AND last_checked_at < NOW() - INTERVAL '7 days')
         )
       ORDER BY last_checked_at NULLS FIRST
       LIMIT 10`
    );

    return result.rows.map((row) => this.mapRowToSource(row));
  }

  /**
   * Check a source for updates (stub - actual implementation would fetch content)
   */
  async checkForUpdates(sourceId: string): Promise<DetectedChange[]> {
    const source = await this.getSource(sourceId);
    if (!source) {
      throw new Error('Source not found');
    }

    const detectedChanges: DetectedChange[] = [];

    try {
      // In production, this would:
      // 1. Fetch content from source.url
      // 2. Apply content_selectors to extract relevant parts
      // 3. Compare with lastContentHash using change_detection_method
      // 4. Return detected changes

      // Simulate content fetch (replace with actual HTTP fetch)
      const simulatedContent = `Regulatory content from ${source.name} at ${new Date().toISOString()}`;
      const contentHash = crypto.createHash('sha256').update(simulatedContent).digest('hex');

      // Check for changes
      if (source.lastContentHash && source.lastContentHash !== contentHash) {
        detectedChanges.push({
          sourceId: source.id,
          changeType: 'modified_content',
          summary: `Content change detected at ${source.name}`,
          affectedUrl: source.url,
          contentSnippet: simulatedContent.substring(0, 500),
          detectedAt: new Date(),
        });
      }

      // Update source with check results
      await this.pool.query(
        `UPDATE compliance_regulatory_sources
         SET last_checked_at = NOW(),
             last_content_hash = $2,
             consecutive_failures = 0,
             updated_at = NOW()
         WHERE id = $1`,
        [sourceId, contentHash]
      );

      if (detectedChanges.length > 0) {
        await this.pool.query(
          `UPDATE compliance_regulatory_sources
           SET last_change_detected_at = NOW()
           WHERE id = $1`,
          [sourceId]
        );
      }
    } catch (error) {
      // Record failure
      await this.pool.query(
        `UPDATE compliance_regulatory_sources
         SET last_checked_at = NOW(),
             consecutive_failures = consecutive_failures + 1,
             status = CASE WHEN consecutive_failures >= 5 THEN 'error' ELSE status END,
             updated_at = NOW()
         WHERE id = $1`,
        [sourceId]
      );
      throw error;
    }

    return detectedChanges;
  }

  /**
   * Run scheduled checks for all due sources
   */
  async runScheduledChecks(): Promise<{ checked: number; changesDetected: number; errors: number }> {
    const sources = await this.getSourcesDueForCheck();
    let checked = 0;
    let changesDetected = 0;
    let errors = 0;

    for (const source of sources) {
      try {
        const changes = await this.checkForUpdates(source.id);
        checked++;

        for (const change of changes) {
          await this.processDetectedChange(change);
          changesDetected++;
        }
      } catch (error) {
        errors++;
        console.error(`Error checking source ${source.id}:`, error);
      }
    }

    return { checked, changesDetected, errors };
  }

  // ============================================================================
  // CHANGE PROCESSING
  // ============================================================================

  /**
   * Process a detected change
   */
  async processDetectedChange(change: DetectedChange): Promise<RegulatoryUpdate> {
    const source = await this.getSource(change.sourceId);
    if (!source) {
      throw new Error('Source not found');
    }

    // Analyze change with AI if available
    let analysis: ChangeAnalysis | null = null;
    if (this.mageAgentClient && change.contentSnippet) {
      try {
        analysis = await this.mageAgentClient.analyzeRegulatoryChange(change.contentSnippet, {
          name: source.name,
          jurisdiction: source.jurisdiction,
          category: source.category,
        });
      } catch (error) {
        console.error('Error analyzing regulatory change:', error);
      }
    }

    // Create regulatory update record
    const id = uuidv4();
    const result = await this.pool.query(
      `INSERT INTO compliance_regulatory_updates (
        id, source_id, update_type, title, summary, original_url,
        impact_level, affected_sectors, affected_entity_types,
        ai_analysis, ai_summary, ai_recommended_actions, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        id,
        source.id,
        analysis?.updateType || 'guidance',
        change.summary,
        analysis?.summary || change.contentSnippet?.substring(0, 1000),
        change.affectedUrl,
        analysis?.impactLevel || 'medium',
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify(analysis || {}),
        analysis?.summary,
        JSON.stringify(analysis?.recommendedActions || []),
        analysis ? 'analyzed' : 'pending',
      ]
    );

    return this.mapRowToUpdate(result.rows[0]);
  }

  /**
   * Analyze a pending update with AI
   */
  async analyzeUpdate(updateId: string): Promise<RegulatoryUpdate | null> {
    const update = await this.getUpdate(updateId);
    if (!update || !this.mageAgentClient) {
      return null;
    }

    const source = await this.getSource(update.sourceId);
    if (!source) {
      return null;
    }

    try {
      const analysis = await this.mageAgentClient.analyzeRegulatoryChange(
        update.summary || '',
        {
          name: source.name,
          jurisdiction: source.jurisdiction,
          category: source.category,
        }
      );

      const result = await this.pool.query(
        `UPDATE compliance_regulatory_updates
         SET update_type = $2,
             impact_level = $3,
             ai_analysis = $4,
             ai_summary = $5,
             ai_recommended_actions = $6,
             status = 'analyzed',
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          updateId,
          analysis.updateType,
          analysis.impactLevel,
          JSON.stringify(analysis),
          analysis.summary,
          JSON.stringify(analysis.recommendedActions),
        ]
      );

      return this.mapRowToUpdate(result.rows[0]);
    } catch (error) {
      console.error('Error analyzing update:', error);
      return null;
    }
  }

  // ============================================================================
  // UPDATE MANAGEMENT
  // ============================================================================

  /**
   * Get update by ID
   */
  async getUpdate(id: string): Promise<RegulatoryUpdate | null> {
    const result = await this.pool.query(
      `SELECT * FROM compliance_regulatory_updates WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUpdate(result.rows[0]);
  }

  /**
   * List updates
   */
  async listUpdates(filters?: {
    sourceId?: string;
    frameworkId?: string;
    status?: RegulatoryUpdate['status'];
    updateType?: RegulatoryUpdate['updateType'];
    impactLevel?: RegulatoryUpdate['impactLevel'];
  }): Promise<RegulatoryUpdate[]> {
    let whereClause = 'WHERE 1=1';
    const params: string[] = [];
    let paramIndex = 1;

    if (filters?.sourceId) {
      whereClause += ` AND source_id = $${paramIndex}`;
      params.push(filters.sourceId);
      paramIndex++;
    }

    if (filters?.frameworkId) {
      whereClause += ` AND framework_id = $${paramIndex}`;
      params.push(filters.frameworkId);
      paramIndex++;
    }

    if (filters?.status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.updateType) {
      whereClause += ` AND update_type = $${paramIndex}`;
      params.push(filters.updateType);
      paramIndex++;
    }

    if (filters?.impactLevel) {
      whereClause += ` AND impact_level = $${paramIndex}`;
      params.push(filters.impactLevel);
      paramIndex++;
    }

    const result = await this.pool.query(
      `SELECT * FROM compliance_regulatory_updates ${whereClause}
       ORDER BY detected_at DESC
       LIMIT 100`,
      params
    );

    return result.rows.map((row) => this.mapRowToUpdate(row));
  }

  /**
   * Update status of a regulatory update
   */
  async updateStatus(
    id: string,
    status: RegulatoryUpdate['status'],
    reviewedBy?: string,
    reviewNotes?: string
  ): Promise<RegulatoryUpdate | null> {
    const result = await this.pool.query(
      `UPDATE compliance_regulatory_updates
       SET status = $2,
           reviewed_by = COALESCE($3, reviewed_by),
           reviewed_at = CASE WHEN $3 IS NOT NULL THEN NOW() ELSE reviewed_at END,
           review_notes = COALESCE($4, review_notes),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, status, reviewedBy || null, reviewNotes || null]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUpdate(result.rows[0]);
  }

  /**
   * Mark update as implemented with generated controls
   */
  async markImplemented(
    id: string,
    generatedControlIds: string[]
  ): Promise<RegulatoryUpdate | null> {
    const result = await this.pool.query(
      `UPDATE compliance_regulatory_updates
       SET generated_controls = $2,
           controls_implemented = true,
           status = 'implemented',
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, JSON.stringify(generatedControlIds)]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUpdate(result.rows[0]);
  }

  /**
   * Get pending updates by impact level
   */
  async getPendingUpdates(): Promise<RegulatoryUpdate[]> {
    const result = await this.pool.query(
      `SELECT * FROM compliance_regulatory_updates
       WHERE status IN ('pending', 'analyzed')
       ORDER BY
         CASE impact_level
           WHEN 'critical' THEN 1
           WHEN 'high' THEN 2
           WHEN 'medium' THEN 3
           WHEN 'low' THEN 4
           WHEN 'informational' THEN 5
         END,
         detected_at DESC
       LIMIT 50`
    );

    return result.rows.map((row) => this.mapRowToUpdate(row));
  }

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================

  /**
   * Notify tenants of updates affecting their applicable frameworks
   */
  async notifyAffectedTenants(updateId: string): Promise<string[]> {
    const update = await this.getUpdate(updateId);
    if (!update) {
      return [];
    }

    const source = await this.getSource(update.sourceId);
    if (!source) {
      return [];
    }

    // Find tenants with applicable frameworks
    const result = await this.pool.query(
      `SELECT DISTINCT ep.tenant_id
       FROM compliance_entity_profiles ep
       WHERE ep.applicable_frameworks ?| $1`,
      [source.relatedFrameworks]
    );

    const notifiedTenants = result.rows.map((row) => row.tenant_id);

    // Update notifications sent
    await this.pool.query(
      `UPDATE compliance_regulatory_updates
       SET notifications_sent = $2, updated_at = NOW()
       WHERE id = $1`,
      [updateId, JSON.stringify(notifiedTenants)]
    );

    return notifiedTenants;
  }

  // ============================================================================
  // MAPPERS
  // ============================================================================

  private mapRowToSource(row: Record<string, unknown>): RegulatorySource {
    return {
      id: row.id as string,
      name: row.name as string,
      sourceType: row.source_type as RegulatorySource['sourceType'],
      url: row.url as string,
      jurisdiction: row.jurisdiction as string,
      category: row.category as string,
      relatedFrameworks: (row.related_frameworks as string[]) || [],
      checkFrequency: row.check_frequency as RegulatorySource['checkFrequency'],
      contentSelectors: (row.content_selectors as Record<string, string>) || {},
      changeDetectionMethod: row.change_detection_method as RegulatorySource['changeDetectionMethod'],
      lastCheckedAt: row.last_checked_at ? new Date(row.last_checked_at as string) : undefined,
      lastChangeDetectedAt: row.last_change_detected_at
        ? new Date(row.last_change_detected_at as string)
        : undefined,
      lastContentHash: row.last_content_hash as string | undefined,
      consecutiveFailures: (row.consecutive_failures as number) || 0,
      isActive: row.is_active as boolean,
      status: row.status as RegulatorySource['status'],
      metadata: (row.metadata as Record<string, unknown>) || {},
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  private mapRowToUpdate(row: Record<string, unknown>): RegulatoryUpdate {
    return {
      id: row.id as string,
      sourceId: row.source_id as string,
      frameworkId: row.framework_id as string | undefined,
      updateType: row.update_type as RegulatoryUpdate['updateType'],
      title: row.title as string,
      summary: row.summary as string | undefined,
      originalUrl: row.original_url as string | undefined,
      detectedAt: new Date(row.detected_at as string),
      effectiveDate: row.effective_date ? new Date(row.effective_date as string) : undefined,
      publicationDate: row.publication_date ? new Date(row.publication_date as string) : undefined,
      impactLevel: row.impact_level as RegulatoryUpdate['impactLevel'],
      affectedSectors: (row.affected_sectors as string[]) || [],
      affectedEntityTypes: (row.affected_entity_types as string[]) || [],
      aiAnalysis: (row.ai_analysis as Record<string, unknown>) || {},
      aiSummary: row.ai_summary as string | undefined,
      aiRecommendedActions: (row.ai_recommended_actions as string[]) || [],
      generatedControls: (row.generated_controls as unknown[]) || [],
      controlsImplemented: row.controls_implemented as boolean,
      status: row.status as RegulatoryUpdate['status'],
      reviewedBy: row.reviewed_by as string | undefined,
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at as string) : undefined,
      reviewNotes: row.review_notes as string | undefined,
      notificationsSent: (row.notifications_sent as string[]) || [],
      metadata: (row.metadata as Record<string, unknown>) || {},
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}
