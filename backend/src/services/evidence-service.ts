/**
 * Nexus Compliance Engine - Evidence Service
 * Manages compliance evidence collection, storage, and linking to controls
 */

import { v4 as uuidv4 } from 'uuid';
import {
  query,
  transaction,
  type DatabaseRow,
} from '../database/client.js';
import { createLogger } from '../utils/logger.js';
import type { ComplianceServiceContext } from '../types/index.js';

const logger = createLogger('evidence-service');

/**
 * Evidence types supported by the system
 */
export type EvidenceType =
  | 'document'        // Policy documents, procedures
  | 'screenshot'      // Screenshot evidence
  | 'configuration'   // System configuration exports
  | 'log'             // Audit log samples
  | 'attestation'     // Manual attestations
  | 'scan_result'     // Vulnerability/security scan results
  | 'certificate'     // Certificates, audit reports
  | 'interview'       // Interview notes
  | 'observation'     // Direct observation notes
  | 'api_export';     // Automated API data exports

/**
 * Evidence status
 */
export type EvidenceStatus =
  | 'pending'         // Uploaded, awaiting review
  | 'approved'        // Reviewed and approved
  | 'rejected'        // Reviewed and rejected
  | 'expired';        // Evidence has expired

/**
 * Evidence entity
 */
export interface Evidence {
  id: string;
  tenantId: string;
  controlId: string;
  findingId?: string;
  assessmentId?: string;
  type: EvidenceType;
  title: string;
  description?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  checksum?: string;
  sourceSystem?: string;
  sourceUrl?: string;
  collectedAt: Date;
  collectedBy: string;
  validFrom?: Date;
  validUntil?: Date;
  status: EvidenceStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Attestation record
 */
export interface Attestation {
  id: string;
  tenantId: string;
  controlId: string;
  evidenceId?: string;
  attestationType: 'self' | 'manager' | 'auditor' | 'third_party';
  attestedBy: string;
  attestedAt: Date;
  statement: string;
  isCompliant: boolean;
  validUntil: Date;
  supportingNotes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Create evidence request
 */
export interface CreateEvidenceRequest {
  controlId: string;
  findingId?: string;
  assessmentId?: string;
  type: EvidenceType;
  title: string;
  description?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  checksum?: string;
  sourceSystem?: string;
  sourceUrl?: string;
  collectedAt?: Date;
  validFrom?: Date;
  validUntil?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Create attestation request
 */
export interface CreateAttestationRequest {
  controlId: string;
  attestationType: 'self' | 'manager' | 'auditor' | 'third_party';
  statement: string;
  isCompliant: boolean;
  validUntil: Date;
  supportingNotes?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Evidence search options
 */
export interface EvidenceSearchOptions {
  controlId?: string;
  findingId?: string;
  assessmentId?: string;
  type?: EvidenceType;
  status?: EvidenceStatus;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * Evidence gap analysis result
 */
export interface EvidenceGapAnalysis {
  controlId: string;
  controlNumber: string;
  controlTitle: string;
  requiredEvidenceTypes: EvidenceType[];
  existingEvidence: {
    type: EvidenceType;
    count: number;
    latestDate: Date | null;
    status: EvidenceStatus;
  }[];
  missingTypes: EvidenceType[];
  gapScore: number; // 0-100, 100 = no gaps
  recommendations: string[];
}

function mapRowToEvidence(row: DatabaseRow): Evidence {
  return {
    id: row['id'] as string,
    tenantId: row['tenant_id'] as string,
    controlId: row['control_id'] as string,
    findingId: row['finding_id'] as string | undefined,
    assessmentId: row['assessment_id'] as string | undefined,
    type: row['type'] as EvidenceType,
    title: row['title'] as string,
    description: row['description'] as string | undefined,
    filePath: row['file_path'] as string | undefined,
    fileSize: row['file_size'] as number | undefined,
    mimeType: row['mime_type'] as string | undefined,
    checksum: row['checksum'] as string | undefined,
    sourceSystem: row['source_system'] as string | undefined,
    sourceUrl: row['source_url'] as string | undefined,
    collectedAt: new Date(row['collected_at'] as string),
    collectedBy: row['collected_by'] as string,
    validFrom: row['valid_from'] ? new Date(row['valid_from'] as string) : undefined,
    validUntil: row['valid_until'] ? new Date(row['valid_until'] as string) : undefined,
    status: row['status'] as EvidenceStatus,
    reviewedBy: row['reviewed_by'] as string | undefined,
    reviewedAt: row['reviewed_at'] ? new Date(row['reviewed_at'] as string) : undefined,
    reviewNotes: row['review_notes'] as string | undefined,
    metadata: typeof row['metadata'] === 'string'
      ? JSON.parse(row['metadata'] as string)
      : (row['metadata'] as Record<string, unknown> | undefined),
    createdAt: new Date(row['created_at'] as string),
    updatedAt: new Date(row['updated_at'] as string),
  };
}

function mapRowToAttestation(row: DatabaseRow): Attestation {
  return {
    id: row['id'] as string,
    tenantId: row['tenant_id'] as string,
    controlId: row['control_id'] as string,
    evidenceId: row['evidence_id'] as string | undefined,
    attestationType: row['attestation_type'] as Attestation['attestationType'],
    attestedBy: row['attested_by'] as string,
    attestedAt: new Date(row['attested_at'] as string),
    statement: row['statement'] as string,
    isCompliant: row['is_compliant'] as boolean,
    validUntil: new Date(row['valid_until'] as string),
    supportingNotes: row['supporting_notes'] as string | undefined,
    metadata: typeof row['metadata'] === 'string'
      ? JSON.parse(row['metadata'] as string)
      : (row['metadata'] as Record<string, unknown> | undefined),
    createdAt: new Date(row['created_at'] as string),
  };
}

/**
 * Evidence Service - Manages compliance evidence lifecycle
 */
export class EvidenceService {
  /**
   * Create new evidence record
   */
  async createEvidence(
    context: ComplianceServiceContext,
    request: CreateEvidenceRequest
  ): Promise<Evidence> {
    const id = uuidv4();

    // Verify control exists
    const controlResult = await query<{ id: string }>(
      `SELECT id FROM compliance_controls WHERE id = $1`,
      [request.controlId]
    );

    if (controlResult.rows.length === 0) {
      throw new Error(`Control not found: ${request.controlId}`);
    }

    const result = await query<DatabaseRow>(
      `INSERT INTO compliance_evidence (
        id, tenant_id, control_id, finding_id, assessment_id, type, title,
        description, file_path, file_size, mime_type, checksum, source_system,
        source_url, collected_at, collected_by, valid_from, valid_until,
        status, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        id,
        context.tenantId,
        request.controlId,
        request.findingId,
        request.assessmentId,
        request.type,
        request.title,
        request.description,
        request.filePath,
        request.fileSize,
        request.mimeType,
        request.checksum,
        request.sourceSystem,
        request.sourceUrl,
        request.collectedAt ?? new Date(),
        context.userId,
        request.validFrom,
        request.validUntil,
        'pending',
        request.metadata ? JSON.stringify(request.metadata) : null
      ]
    );

    const evidence = mapRowToEvidence(result.rows[0]!);

    logger.info({
      tenantId: context.tenantId,
      evidenceId: id,
      controlId: request.controlId,
      type: request.type
    }, 'Evidence created');

    return evidence;
  }

  /**
   * Create attestation for a control
   */
  async createAttestation(
    context: ComplianceServiceContext,
    request: CreateAttestationRequest
  ): Promise<{ attestation: Attestation; evidence: Evidence }> {
    return transaction(async (client) => {
      // Verify control exists
      const controlResult = await client.query<{ id: string; title: string }>(
        `SELECT id, title FROM compliance_controls WHERE id = $1`,
        [request.controlId]
      );

      if (controlResult.rows.length === 0) {
        throw new Error(`Control not found: ${request.controlId}`);
      }

      const control = controlResult.rows[0]!;
      const attestationId = uuidv4();
      const evidenceId = uuidv4();

      // Create evidence record for the attestation
      const evidenceResult = await client.query<DatabaseRow>(
        `INSERT INTO compliance_evidence (
          id, tenant_id, control_id, type, title, description,
          collected_at, collected_by, valid_from, valid_until, status, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          evidenceId,
          context.tenantId,
          request.controlId,
          'attestation',
          `Attestation: ${control.title}`,
          request.statement,
          new Date(),
          context.userId,
          new Date(),
          request.validUntil,
          'approved', // Attestations are auto-approved
          JSON.stringify({
            attestationType: request.attestationType,
            isCompliant: request.isCompliant
          })
        ]
      );

      // Create attestation record
      const attestationResult = await client.query<DatabaseRow>(
        `INSERT INTO compliance_attestations (
          id, tenant_id, control_id, evidence_id, attestation_type,
          attested_by, attested_at, statement, is_compliant,
          valid_until, supporting_notes, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          attestationId,
          context.tenantId,
          request.controlId,
          evidenceId,
          request.attestationType,
          context.userId,
          new Date(),
          request.statement,
          request.isCompliant,
          request.validUntil,
          request.supportingNotes,
          request.metadata ? JSON.stringify(request.metadata) : null
        ]
      );

      const evidence = mapRowToEvidence(evidenceResult.rows[0]!);
      const attestation = mapRowToAttestation(attestationResult.rows[0]!);

      logger.info({
        tenantId: context.tenantId,
        attestationId,
        evidenceId,
        controlId: request.controlId,
        isCompliant: request.isCompliant
      }, 'Attestation created');

      return { attestation, evidence };
    });
  }

  /**
   * Get evidence by ID
   */
  async getEvidence(
    tenantId: string,
    evidenceId: string
  ): Promise<Evidence | null> {
    const result = await query<DatabaseRow>(
      `SELECT * FROM compliance_evidence
       WHERE id = $1 AND tenant_id = $2`,
      [evidenceId, tenantId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapRowToEvidence(result.rows[0]!);
  }

  /**
   * Search evidence
   */
  async searchEvidence(
    tenantId: string,
    options: EvidenceSearchOptions
  ): Promise<{ data: Evidence[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE tenant_id = $1';
    const queryParams: unknown[] = [tenantId];
    let paramIndex = 2;

    if (options.controlId) {
      whereClause += ` AND control_id = $${paramIndex}`;
      queryParams.push(options.controlId);
      paramIndex++;
    }

    if (options.findingId) {
      whereClause += ` AND finding_id = $${paramIndex}`;
      queryParams.push(options.findingId);
      paramIndex++;
    }

    if (options.assessmentId) {
      whereClause += ` AND assessment_id = $${paramIndex}`;
      queryParams.push(options.assessmentId);
      paramIndex++;
    }

    if (options.type) {
      whereClause += ` AND type = $${paramIndex}`;
      queryParams.push(options.type);
      paramIndex++;
    }

    if (options.status) {
      whereClause += ` AND status = $${paramIndex}`;
      queryParams.push(options.status);
      paramIndex++;
    }

    if (options.fromDate) {
      whereClause += ` AND collected_at >= $${paramIndex}`;
      queryParams.push(options.fromDate);
      paramIndex++;
    }

    if (options.toDate) {
      whereClause += ` AND collected_at <= $${paramIndex}`;
      queryParams.push(options.toDate);
      paramIndex++;
    }

    // Count total
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM compliance_evidence ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    // Get evidence
    const result = await query<DatabaseRow>(
      `SELECT * FROM compliance_evidence
       ${whereClause}
       ORDER BY collected_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    return {
      data: result.rows.map(mapRowToEvidence),
      total,
      page,
      limit
    };
  }

  /**
   * Get evidence for a control
   */
  async getControlEvidence(
    tenantId: string,
    controlId: string,
    options: { status?: EvidenceStatus; limit?: number } = {}
  ): Promise<Evidence[]> {
    let queryText = `
      SELECT * FROM compliance_evidence
      WHERE tenant_id = $1 AND control_id = $2
    `;
    const params: unknown[] = [tenantId, controlId];

    if (options.status) {
      queryText += ` AND status = $3`;
      params.push(options.status);
    }

    queryText += ` ORDER BY collected_at DESC`;

    if (options.limit) {
      queryText += ` LIMIT $${params.length + 1}`;
      params.push(options.limit);
    }

    const result = await query<DatabaseRow>(queryText, params);
    return result.rows.map(mapRowToEvidence);
  }

  /**
   * Update evidence status (approve/reject)
   */
  async updateEvidenceStatus(
    context: ComplianceServiceContext,
    evidenceId: string,
    status: 'approved' | 'rejected',
    reviewNotes?: string
  ): Promise<Evidence> {
    const result = await query<DatabaseRow>(
      `UPDATE compliance_evidence
       SET status = $1, reviewed_by = $2, reviewed_at = NOW(),
           review_notes = $3, updated_at = NOW()
       WHERE id = $4 AND tenant_id = $5
       RETURNING *`,
      [status, context.userId, reviewNotes, evidenceId, context.tenantId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Evidence not found: ${evidenceId}`);
    }

    const evidence = mapRowToEvidence(result.rows[0]!);

    logger.info({
      tenantId: context.tenantId,
      evidenceId,
      status,
      reviewedBy: context.userId
    }, 'Evidence status updated');

    return evidence;
  }

  /**
   * Link evidence to a finding
   */
  async linkToFinding(
    context: ComplianceServiceContext,
    evidenceId: string,
    findingId: string
  ): Promise<Evidence> {
    // Verify finding exists and belongs to tenant
    const findingResult = await query<{ id: string }>(
      `SELECT id FROM control_findings WHERE id = $1 AND tenant_id = $2`,
      [findingId, context.tenantId]
    );

    if (findingResult.rows.length === 0) {
      throw new Error(`Finding not found: ${findingId}`);
    }

    const result = await query<DatabaseRow>(
      `UPDATE compliance_evidence
       SET finding_id = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3
       RETURNING *`,
      [findingId, evidenceId, context.tenantId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Evidence not found: ${evidenceId}`);
    }

    return mapRowToEvidence(result.rows[0]!);
  }

  /**
   * Analyze evidence gaps for controls
   */
  async analyzeEvidenceGaps(
    tenantId: string,
    controlIds: string[]
  ): Promise<EvidenceGapAnalysis[]> {
    const results: EvidenceGapAnalysis[] = [];

    for (const controlId of controlIds) {
      // Get control details
      const controlResult = await query<DatabaseRow>(
        `SELECT id, control_number, title, evidence_requirements
         FROM compliance_controls WHERE id = $1`,
        [controlId]
      );

      if (controlResult.rows.length === 0) continue;

      const control = controlResult.rows[0]!;
      const requiredTypes = this.parseEvidenceRequirements(
        control['evidence_requirements'] as string[] | null
      );

      // Get existing evidence
      const evidenceResult = await query<{
        type: string;
        count: string;
        latest_date: string | null;
        status: string;
      }>(
        `SELECT type, COUNT(*) as count, MAX(collected_at) as latest_date,
                COALESCE(
                  (SELECT status FROM compliance_evidence e2
                   WHERE e2.control_id = $1 AND e2.tenant_id = $2 AND e2.type = compliance_evidence.type
                   ORDER BY collected_at DESC LIMIT 1),
                  'pending'
                ) as status
         FROM compliance_evidence
         WHERE control_id = $1 AND tenant_id = $2
         GROUP BY type`,
        [controlId, tenantId]
      );

      const existingEvidence = evidenceResult.rows.map(row => ({
        type: row.type as EvidenceType,
        count: parseInt(row.count, 10),
        latestDate: row.latest_date ? new Date(row.latest_date) : null,
        status: row.status as EvidenceStatus
      }));

      const existingTypes = new Set(existingEvidence.map(e => e.type));
      const missingTypes = requiredTypes.filter(t => !existingTypes.has(t));

      // Calculate gap score
      const gapScore = requiredTypes.length > 0
        ? Math.round(((requiredTypes.length - missingTypes.length) / requiredTypes.length) * 100)
        : 100;

      // Generate recommendations
      const recommendations = this.generateEvidenceRecommendations(
        missingTypes,
        existingEvidence
      );

      results.push({
        controlId,
        controlNumber: control['control_number'] as string,
        controlTitle: control['title'] as string,
        requiredEvidenceTypes: requiredTypes,
        existingEvidence,
        missingTypes,
        gapScore,
        recommendations
      });
    }

    return results;
  }

  /**
   * Delete evidence
   */
  async deleteEvidence(
    context: ComplianceServiceContext,
    evidenceId: string
  ): Promise<void> {
    const result = await query(
      `DELETE FROM compliance_evidence
       WHERE id = $1 AND tenant_id = $2`,
      [evidenceId, context.tenantId]
    );

    if (result.rowCount === 0) {
      throw new Error(`Evidence not found: ${evidenceId}`);
    }

    logger.info({
      tenantId: context.tenantId,
      evidenceId
    }, 'Evidence deleted');
  }

  /**
   * Check for expired evidence
   */
  async getExpiringEvidence(
    tenantId: string,
    daysAhead: number = 30
  ): Promise<Evidence[]> {
    const result = await query<DatabaseRow>(
      `SELECT * FROM compliance_evidence
       WHERE tenant_id = $1
         AND valid_until IS NOT NULL
         AND valid_until <= NOW() + INTERVAL '${daysAhead} days'
         AND status = 'approved'
       ORDER BY valid_until ASC`,
      [tenantId]
    );

    return result.rows.map(mapRowToEvidence);
  }

  /**
   * Mark expired evidence
   */
  async markExpiredEvidence(tenantId: string): Promise<number> {
    const result = await query(
      `UPDATE compliance_evidence
       SET status = 'expired', updated_at = NOW()
       WHERE tenant_id = $1
         AND valid_until < NOW()
         AND status = 'approved'`,
      [tenantId]
    );

    const count = result.rowCount ?? 0;

    if (count > 0) {
      logger.info({ tenantId, count }, 'Marked evidence as expired');
    }

    return count;
  }

  /**
   * Get evidence statistics for a tenant
   */
  async getEvidenceStats(tenantId: string): Promise<{
    total: number;
    byType: Record<EvidenceType, number>;
    byStatus: Record<EvidenceStatus, number>;
    expiringIn30Days: number;
    recentlyAdded: number;
  }> {
    const [totalResult, typeResult, statusResult, expiringResult, recentResult] =
      await Promise.all([
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM compliance_evidence WHERE tenant_id = $1`,
          [tenantId]
        ),
        query<{ type: string; count: string }>(
          `SELECT type, COUNT(*) as count FROM compliance_evidence
           WHERE tenant_id = $1 GROUP BY type`,
          [tenantId]
        ),
        query<{ status: string; count: string }>(
          `SELECT status, COUNT(*) as count FROM compliance_evidence
           WHERE tenant_id = $1 GROUP BY status`,
          [tenantId]
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM compliance_evidence
           WHERE tenant_id = $1
             AND valid_until IS NOT NULL
             AND valid_until <= NOW() + INTERVAL '30 days'
             AND status = 'approved'`,
          [tenantId]
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM compliance_evidence
           WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '7 days'`,
          [tenantId]
        )
      ]);

    const byType: Record<string, number> = {};
    for (const row of typeResult.rows) {
      byType[row.type] = parseInt(row.count, 10);
    }

    const byStatus: Record<string, number> = {};
    for (const row of statusResult.rows) {
      byStatus[row.status] = parseInt(row.count, 10);
    }

    return {
      total: parseInt(totalResult.rows[0]?.count ?? '0', 10),
      byType: byType as Record<EvidenceType, number>,
      byStatus: byStatus as Record<EvidenceStatus, number>,
      expiringIn30Days: parseInt(expiringResult.rows[0]?.count ?? '0', 10),
      recentlyAdded: parseInt(recentResult.rows[0]?.count ?? '0', 10)
    };
  }

  /**
   * Parse evidence requirements from control metadata
   */
  private parseEvidenceRequirements(requirements: string[] | null): EvidenceType[] {
    if (!requirements || requirements.length === 0) {
      // Default evidence types for any control
      return ['document', 'attestation'];
    }

    const typeMap: Record<string, EvidenceType> = {
      'policy': 'document',
      'procedure': 'document',
      'document': 'document',
      'screenshot': 'screenshot',
      'config': 'configuration',
      'configuration': 'configuration',
      'log': 'log',
      'audit_log': 'log',
      'attestation': 'attestation',
      'scan': 'scan_result',
      'vulnerability_scan': 'scan_result',
      'certificate': 'certificate',
      'audit_report': 'certificate',
      'interview': 'interview',
      'observation': 'observation',
      'api': 'api_export'
    };

    const types: EvidenceType[] = [];
    for (const req of requirements) {
      const normalized = req.toLowerCase().replace(/\s+/g, '_');
      if (typeMap[normalized]) {
        types.push(typeMap[normalized]);
      }
    }

    return types.length > 0 ? [...new Set(types)] : ['document', 'attestation'];
  }

  /**
   * Generate evidence recommendations based on gaps
   */
  private generateEvidenceRecommendations(
    missingTypes: EvidenceType[],
    existingEvidence: { type: EvidenceType; latestDate: Date | null; status: EvidenceStatus }[]
  ): string[] {
    const recommendations: string[] = [];

    // Check for missing types
    for (const type of missingTypes) {
      switch (type) {
        case 'document':
          recommendations.push('Upload policy or procedure documents that support this control');
          break;
        case 'screenshot':
          recommendations.push('Capture screenshots showing control implementation');
          break;
        case 'configuration':
          recommendations.push('Export and upload system configuration settings');
          break;
        case 'log':
          recommendations.push('Provide audit log samples demonstrating control operation');
          break;
        case 'attestation':
          recommendations.push('Complete a management attestation for this control');
          break;
        case 'scan_result':
          recommendations.push('Upload security or vulnerability scan results');
          break;
        case 'certificate':
          recommendations.push('Provide relevant certificates or third-party audit reports');
          break;
        case 'interview':
          recommendations.push('Document interviews with key personnel about control implementation');
          break;
        case 'observation':
          recommendations.push('Record direct observations of control operation');
          break;
        case 'api_export':
          recommendations.push('Configure automated evidence collection from source systems');
          break;
      }
    }

    // Check for stale evidence
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    for (const ev of existingEvidence) {
      if (ev.latestDate && ev.latestDate < oneYearAgo) {
        recommendations.push(`${ev.type} evidence is over 1 year old - consider refreshing`);
      }
      if (ev.status === 'rejected') {
        recommendations.push(`Rejected ${ev.type} evidence needs to be replaced`);
      }
    }

    return recommendations;
  }
}

export const evidenceService = new EvidenceService();
