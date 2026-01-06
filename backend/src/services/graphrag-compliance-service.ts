/**
 * GraphRAG Compliance Service
 *
 * Integrates the Nexus Compliance Engine with GraphRAG for intelligent
 * querying and analysis of:
 * - Controls library (500+ controls across 6+ frameworks)
 * - Quantitative assessment results
 * - Qualitative assessment results (Z-Inspection, stakeholders, scenarios)
 * - Cross-framework relationships
 * - Regulatory updates and trends
 *
 * Uses GraphRAG ontologies optimized for compliance knowledge graphs.
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types
// ============================================================================

export interface GraphRAGNode {
  id: string;
  type: NodeType;
  properties: Record<string, any>;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GraphRAGRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  properties: Record<string, any>;
  weight?: number;
  createdAt: Date;
}

export type NodeType =
  | 'Framework'
  | 'Control'
  | 'Requirement'
  | 'Evidence'
  | 'Assessment'
  | 'Finding'
  | 'Stakeholder'
  | 'Scenario'
  | 'Tension'
  | 'AISystem'
  | 'RegulatoryUpdate'
  | 'Entity';

export type RelationshipType =
  | 'BELONGS_TO'
  | 'IMPLEMENTS'
  | 'MAPS_TO'
  | 'EQUIVALENT_TO'
  | 'PARTIALLY_OVERLAPS'
  | 'SUPERSEDES'
  | 'REQUIRES'
  | 'ADDRESSES'
  | 'AFFECTS'
  | 'IDENTIFIED_IN'
  | 'ASSESSED_BY'
  | 'USES'
  | 'IMPACTS'
  | 'MITIGATES'
  | 'CONFLICTS_WITH'
  | 'RELATES_TO';

export interface ComplianceOntology {
  name: string;
  version: string;
  description: string;
  nodeTypes: NodeTypeDefinition[];
  relationshipTypes: RelationshipTypeDefinition[];
  inferenceRules: InferenceRule[];
}

export interface NodeTypeDefinition {
  type: NodeType;
  label: string;
  description: string;
  requiredProperties: string[];
  optionalProperties: string[];
  indexedProperties: string[];
}

export interface RelationshipTypeDefinition {
  type: RelationshipType;
  label: string;
  description: string;
  sourceTypes: NodeType[];
  targetTypes: NodeType[];
  properties?: string[];
}

export interface InferenceRule {
  name: string;
  description: string;
  condition: string;
  inference: string;
  priority: number;
}

export interface IngestionResult {
  nodesCreated: number;
  nodesUpdated: number;
  relationshipsCreated: number;
  errors: string[];
  duration: number;
}

export interface GraphQuery {
  query: string;
  parameters?: Record<string, any>;
  maxDepth?: number;
  limit?: number;
}

export interface GraphQueryResult {
  nodes: GraphRAGNode[];
  relationships: GraphRAGRelationship[];
  paths?: GraphPath[];
  metadata: {
    queryTime: number;
    nodesScanned: number;
    relationshipsTraversed: number;
  };
}

export interface GraphPath {
  nodes: string[];
  relationships: string[];
  totalWeight: number;
}

export interface ComplianceInsight {
  type: 'gap' | 'overlap' | 'trend' | 'risk' | 'recommendation';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  affectedEntities: string[];
  suggestedActions: string[];
  confidence: number;
  sources: string[];
}

// ============================================================================
// Compliance Ontology Definition
// ============================================================================

export const COMPLIANCE_ONTOLOGY: ComplianceOntology = {
  name: 'NexusComplianceOntology',
  version: '2.0.0',
  description: 'Ontology for compliance controls, assessments, and cross-framework analysis with qualitative Z-Inspection support',

  nodeTypes: [
    {
      type: 'Framework',
      label: 'Compliance Framework',
      description: 'A regulatory or standard framework (e.g., GDPR, ISO 27001)',
      requiredProperties: ['id', 'name', 'jurisdiction'],
      optionalProperties: ['version', 'effectiveDate', 'category', 'description', 'controlCount'],
      indexedProperties: ['id', 'name', 'jurisdiction']
    },
    {
      type: 'Control',
      label: 'Compliance Control',
      description: 'A specific control or requirement within a framework',
      requiredProperties: ['id', 'frameworkId', 'title'],
      optionalProperties: ['description', 'category', 'domain', 'guidance', 'evidenceTypes', 'aiPrompt'],
      indexedProperties: ['id', 'frameworkId', 'category', 'domain']
    },
    {
      type: 'Requirement',
      label: 'Trustworthy AI Requirement',
      description: 'One of the 7 EU Trustworthy AI Requirements',
      requiredProperties: ['id', 'name'],
      optionalProperties: ['description', 'assessmentCriteria', 'keyIndicators'],
      indexedProperties: ['id', 'name']
    },
    {
      type: 'Evidence',
      label: 'Compliance Evidence',
      description: 'Documentary or system evidence supporting compliance',
      requiredProperties: ['id', 'tenantId', 'evidenceType'],
      optionalProperties: ['fileName', 'description', 'verified', 'uploadedAt', 'validUntil'],
      indexedProperties: ['id', 'tenantId', 'evidenceType']
    },
    {
      type: 'Assessment',
      label: 'Compliance Assessment',
      description: 'A quantitative or qualitative assessment result',
      requiredProperties: ['id', 'tenantId', 'type'],
      optionalProperties: ['score', 'rating', 'assessedAt', 'assessedBy', 'findings'],
      indexedProperties: ['id', 'tenantId', 'type']
    },
    {
      type: 'Finding',
      label: 'Assessment Finding',
      description: 'A specific finding from an assessment',
      requiredProperties: ['id', 'assessmentId', 'type'],
      optionalProperties: ['title', 'description', 'severity', 'status', 'requirementId'],
      indexedProperties: ['id', 'assessmentId', 'type', 'severity']
    },
    {
      type: 'Stakeholder',
      label: 'Stakeholder',
      description: 'A stakeholder affected by AI systems',
      requiredProperties: ['id', 'tenantId', 'name', 'stakeholderType'],
      optionalProperties: ['category', 'description', 'vulnerabilities'],
      indexedProperties: ['id', 'tenantId', 'stakeholderType']
    },
    {
      type: 'Scenario',
      label: 'Socio-Technical Scenario',
      description: 'A scenario describing potential AI system impacts',
      requiredProperties: ['id', 'tenantId', 'title', 'scenarioType'],
      optionalProperties: ['description', 'actors', 'potentialHarms', 'riskScore'],
      indexedProperties: ['id', 'tenantId', 'scenarioType']
    },
    {
      type: 'Tension',
      label: 'Ethical Tension',
      description: 'A tension or conflict between values or stakeholder interests',
      requiredProperties: ['id', 'assessmentId', 'valueA', 'valueB'],
      optionalProperties: ['description', 'severity', 'status', 'resolutionApproach'],
      indexedProperties: ['id', 'assessmentId', 'severity', 'status']
    },
    {
      type: 'AISystem',
      label: 'AI System',
      description: 'An AI system registered for compliance assessment',
      requiredProperties: ['id', 'tenantId', 'name'],
      optionalProperties: ['description', 'riskCategory', 'deploymentStatus', 'aiActClassification'],
      indexedProperties: ['id', 'tenantId', 'riskCategory']
    },
    {
      type: 'RegulatoryUpdate',
      label: 'Regulatory Update',
      description: 'A detected update or change to regulations',
      requiredProperties: ['id', 'sourceId', 'title'],
      optionalProperties: ['summary', 'effectiveDate', 'status', 'impactAssessment'],
      indexedProperties: ['id', 'sourceId', 'status']
    },
    {
      type: 'Entity',
      label: 'Entity Profile',
      description: 'An organization or entity subject to compliance requirements',
      requiredProperties: ['id', 'tenantId', 'entityName'],
      optionalProperties: ['industry', 'jurisdictions', 'entitySize', 'applicableFrameworks'],
      indexedProperties: ['id', 'tenantId', 'industry']
    }
  ],

  relationshipTypes: [
    {
      type: 'BELONGS_TO',
      label: 'Belongs To',
      description: 'Control belongs to a framework',
      sourceTypes: ['Control'],
      targetTypes: ['Framework']
    },
    {
      type: 'IMPLEMENTS',
      label: 'Implements',
      description: 'Control implements a requirement',
      sourceTypes: ['Control'],
      targetTypes: ['Requirement'],
      properties: ['mappingStrength', 'rationale']
    },
    {
      type: 'MAPS_TO',
      label: 'Maps To',
      description: 'Cross-framework control mapping',
      sourceTypes: ['Control'],
      targetTypes: ['Control'],
      properties: ['relationshipType', 'confidence']
    },
    {
      type: 'EQUIVALENT_TO',
      label: 'Equivalent To',
      description: 'Controls are functionally equivalent',
      sourceTypes: ['Control'],
      targetTypes: ['Control'],
      properties: ['confidence']
    },
    {
      type: 'PARTIALLY_OVERLAPS',
      label: 'Partially Overlaps',
      description: 'Controls have partial overlap',
      sourceTypes: ['Control'],
      targetTypes: ['Control'],
      properties: ['overlapPercentage']
    },
    {
      type: 'SUPERSEDES',
      label: 'Supersedes',
      description: 'Control supersedes another',
      sourceTypes: ['Control', 'RegulatoryUpdate'],
      targetTypes: ['Control'],
      properties: ['effectiveDate']
    },
    {
      type: 'REQUIRES',
      label: 'Requires',
      description: 'Entity requires compliance with framework',
      sourceTypes: ['Entity'],
      targetTypes: ['Framework'],
      properties: ['priority', 'dueDate']
    },
    {
      type: 'ADDRESSES',
      label: 'Addresses',
      description: 'Evidence addresses a control',
      sourceTypes: ['Evidence'],
      targetTypes: ['Control'],
      properties: ['coverage', 'verified']
    },
    {
      type: 'AFFECTS',
      label: 'Affects',
      description: 'Scenario or tension affects a stakeholder',
      sourceTypes: ['Scenario', 'Tension', 'AISystem'],
      targetTypes: ['Stakeholder'],
      properties: ['impactLevel']
    },
    {
      type: 'IDENTIFIED_IN',
      label: 'Identified In',
      description: 'Finding or tension identified in assessment',
      sourceTypes: ['Finding', 'Tension', 'Scenario'],
      targetTypes: ['Assessment'],
      properties: ['identifiedAt']
    },
    {
      type: 'ASSESSED_BY',
      label: 'Assessed By',
      description: 'Control or AI system assessed',
      sourceTypes: ['Control', 'AISystem', 'Requirement'],
      targetTypes: ['Assessment'],
      properties: ['score', 'rating', 'assessedAt']
    },
    {
      type: 'USES',
      label: 'Uses',
      description: 'Entity uses an AI system',
      sourceTypes: ['Entity'],
      targetTypes: ['AISystem'],
      properties: ['deployedAt', 'purpose']
    },
    {
      type: 'IMPACTS',
      label: 'Impacts',
      description: 'Regulatory update impacts a framework or control',
      sourceTypes: ['RegulatoryUpdate'],
      targetTypes: ['Framework', 'Control'],
      properties: ['impactType', 'severity']
    },
    {
      type: 'MITIGATES',
      label: 'Mitigates',
      description: 'Control mitigates a risk or tension',
      sourceTypes: ['Control'],
      targetTypes: ['Tension', 'Scenario', 'Finding'],
      properties: ['effectiveness']
    },
    {
      type: 'CONFLICTS_WITH',
      label: 'Conflicts With',
      description: 'Values or requirements in conflict',
      sourceTypes: ['Requirement'],
      targetTypes: ['Requirement'],
      properties: ['tensionId']
    },
    {
      type: 'RELATES_TO',
      label: 'Relates To',
      description: 'General relationship between entities',
      sourceTypes: ['Control', 'Finding', 'Scenario', 'Stakeholder'],
      targetTypes: ['Control', 'Finding', 'Scenario', 'Stakeholder', 'Requirement'],
      properties: ['relationshipNature']
    }
  ],

  inferenceRules: [
    {
      name: 'TransitiveEquivalence',
      description: 'If A is equivalent to B, and B is equivalent to C, then A is equivalent to C',
      condition: '(a:Control)-[:EQUIVALENT_TO]->(b:Control)-[:EQUIVALENT_TO]->(c:Control)',
      inference: 'CREATE (a)-[:EQUIVALENT_TO {inferred: true, confidence: 0.8}]->(c)',
      priority: 1
    },
    {
      name: 'RequirementCoverage',
      description: 'If a control implements a requirement and is compliant, the requirement is partially covered',
      condition: '(c:Control)-[:IMPLEMENTS]->(r:Requirement) AND (c)-[:ASSESSED_BY {status: "compliant"}]->(:Assessment)',
      inference: 'SET r.partialCoverage = true',
      priority: 2
    },
    {
      name: 'RiskPropagation',
      description: 'If a scenario affects multiple stakeholders with vulnerabilities, escalate risk',
      condition: '(s:Scenario)-[:AFFECTS]->(sh:Stakeholder {hasVulnerabilities: true}) WITH s, COUNT(sh) as vulnCount WHERE vulnCount > 2',
      inference: 'SET s.escalatedRisk = true',
      priority: 3
    },
    {
      name: 'CrossFrameworkGap',
      description: 'If a control has no cross-framework mappings, flag as potential gap',
      condition: '(c:Control) WHERE NOT (c)-[:MAPS_TO|EQUIVALENT_TO]-(:Control)',
      inference: 'SET c.potentialGap = true',
      priority: 4
    }
  ]
};

// ============================================================================
// Service Implementation
// ============================================================================

export class GraphRAGComplianceService {
  private graphragEndpoint: string;
  private graphragApiKey: string;

  constructor(
    private pool: Pool,
    graphragEndpoint?: string,
    graphragApiKey?: string
  ) {
    this.graphragEndpoint = graphragEndpoint || process.env.GRAPHRAG_ENDPOINT || 'http://localhost:8090';
    this.graphragApiKey = graphragApiKey || process.env.GRAPHRAG_API_KEY || '';
  }

  // ==========================================================================
  // Ontology Management
  // ==========================================================================

  /**
   * Get the compliance ontology definition
   */
  getOntology(): ComplianceOntology {
    return COMPLIANCE_ONTOLOGY;
  }

  /**
   * Initialize the ontology in GraphRAG
   */
  async initializeOntology(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.graphragEndpoint}/api/v1/ontology`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.graphragApiKey && { 'Authorization': `Bearer ${this.graphragApiKey}` })
        },
        body: JSON.stringify({
          ontology: COMPLIANCE_ONTOLOGY,
          namespace: 'nexus_compliance'
        })
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, message: `Failed to initialize ontology: ${error}` };
      }

      return { success: true, message: 'Ontology initialized successfully' };
    } catch (error) {
      return {
        success: false,
        message: `Error initializing ontology: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // ==========================================================================
  // Control Library Ingestion
  // ==========================================================================

  /**
   * Ingest the entire controls library into GraphRAG
   */
  async ingestControlsLibrary(): Promise<IngestionResult> {
    const startTime = Date.now();
    let nodesCreated = 0;
    let nodesUpdated = 0;
    let relationshipsCreated = 0;
    const errors: string[] = [];

    try {
      // Ingest frameworks
      const frameworks = await this.pool.query(
        `SELECT id, name, jurisdiction, version, effective_date, category, description
         FROM compliance_frameworks WHERE is_active = true`
      );

      for (const fw of frameworks.rows) {
        try {
          await this.upsertNode({
            id: `framework:${fw.id}`,
            type: 'Framework',
            properties: {
              id: fw.id,
              name: fw.name,
              jurisdiction: fw.jurisdiction,
              version: fw.version,
              effectiveDate: fw.effective_date,
              category: fw.category,
              description: fw.description
            },
            createdAt: new Date(),
            updatedAt: new Date()
          });
          nodesCreated++;
        } catch (e) {
          errors.push(`Framework ${fw.id}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

      // Ingest controls
      const controls = await this.pool.query(
        `SELECT id, framework_id, title, description, category, domain, guidance,
                evidence_types, ai_assessment_prompt
         FROM compliance_controls WHERE is_active = true`
      );

      for (const control of controls.rows) {
        try {
          await this.upsertNode({
            id: `control:${control.id}`,
            type: 'Control',
            properties: {
              id: control.id,
              frameworkId: control.framework_id,
              title: control.title,
              description: control.description,
              category: control.category,
              domain: control.domain,
              guidance: control.guidance,
              evidenceTypes: control.evidence_types,
              aiPrompt: control.ai_assessment_prompt
            },
            createdAt: new Date(),
            updatedAt: new Date()
          });
          nodesCreated++;

          // Create BELONGS_TO relationship
          await this.createRelationship({
            id: uuidv4(),
            sourceId: `control:${control.id}`,
            targetId: `framework:${control.framework_id}`,
            type: 'BELONGS_TO',
            properties: {},
            createdAt: new Date()
          });
          relationshipsCreated++;
        } catch (e) {
          errors.push(`Control ${control.id}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

      // Ingest trustworthy AI requirements
      const requirements = await this.pool.query(
        `SELECT id, name, description, assessment_criteria, key_indicators
         FROM trustworthy_ai_requirements`
      );

      for (const req of requirements.rows) {
        try {
          await this.upsertNode({
            id: `requirement:${req.id}`,
            type: 'Requirement',
            properties: {
              id: req.id,
              name: req.name,
              description: req.description,
              assessmentCriteria: req.assessment_criteria,
              keyIndicators: req.key_indicators
            },
            createdAt: new Date(),
            updatedAt: new Date()
          });
          nodesCreated++;
        } catch (e) {
          errors.push(`Requirement ${req.id}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

      // Ingest requirement-control mappings
      const mappings = await this.pool.query(
        `SELECT requirement_id, control_id, mapping_strength, mapping_rationale
         FROM requirement_control_mappings`
      );

      for (const mapping of mappings.rows) {
        try {
          await this.createRelationship({
            id: uuidv4(),
            sourceId: `control:${mapping.control_id}`,
            targetId: `requirement:${mapping.requirement_id}`,
            type: 'IMPLEMENTS',
            properties: {
              mappingStrength: mapping.mapping_strength,
              rationale: mapping.mapping_rationale
            },
            createdAt: new Date()
          });
          relationshipsCreated++;
        } catch (e) {
          errors.push(`Mapping ${mapping.control_id}->${mapping.requirement_id}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

      // Ingest cross-framework control mappings
      const crossRefs = await this.pool.query(
        `SELECT source_control_id, target_control_id, relationship_type, mapping_confidence
         FROM control_cross_references`
      );

      for (const ref of crossRefs.rows) {
        try {
          const relType = this.mapRelationshipType(ref.relationship_type);
          await this.createRelationship({
            id: uuidv4(),
            sourceId: `control:${ref.source_control_id}`,
            targetId: `control:${ref.target_control_id}`,
            type: relType,
            properties: {
              confidence: ref.mapping_confidence
            },
            weight: ref.mapping_confidence,
            createdAt: new Date()
          });
          relationshipsCreated++;
        } catch (e) {
          errors.push(`CrossRef ${ref.source_control_id}->${ref.target_control_id}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

    } catch (error) {
      errors.push(`General error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      nodesCreated,
      nodesUpdated,
      relationshipsCreated,
      errors,
      duration: Date.now() - startTime
    };
  }

  // ==========================================================================
  // Assessment Results Ingestion
  // ==========================================================================

  /**
   * Ingest quantitative assessment results for a tenant
   */
  async ingestQuantitativeAssessments(tenantId: string): Promise<IngestionResult> {
    const startTime = Date.now();
    let nodesCreated = 0;
    let relationshipsCreated = 0;
    const errors: string[] = [];

    try {
      // Get recent assessments
      const assessments = await this.pool.query(
        `SELECT ca.id, ca.tenant_id, ca.control_id, ca.score, ca.status,
                ca.assessed_at, ca.assessed_by, ca.ai_reasoning, ca.findings
         FROM control_assessments ca
         WHERE ca.tenant_id = $1
         AND ca.assessed_at > NOW() - INTERVAL '90 days'`,
        [tenantId]
      );

      for (const assessment of assessments.rows) {
        try {
          // Create assessment node
          await this.upsertNode({
            id: `assessment:${assessment.id}`,
            type: 'Assessment',
            properties: {
              id: assessment.id,
              tenantId: assessment.tenant_id,
              type: 'quantitative',
              score: assessment.score,
              status: assessment.status,
              assessedAt: assessment.assessed_at,
              assessedBy: assessment.assessed_by,
              aiReasoning: assessment.ai_reasoning,
              findings: assessment.findings
            },
            createdAt: new Date(),
            updatedAt: new Date()
          });
          nodesCreated++;

          // Create ASSESSED_BY relationship
          await this.createRelationship({
            id: uuidv4(),
            sourceId: `control:${assessment.control_id}`,
            targetId: `assessment:${assessment.id}`,
            type: 'ASSESSED_BY',
            properties: {
              score: assessment.score,
              rating: assessment.status,
              assessedAt: assessment.assessed_at
            },
            createdAt: new Date()
          });
          relationshipsCreated++;
        } catch (e) {
          errors.push(`Assessment ${assessment.id}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

      // Ingest evidence
      const evidence = await this.pool.query(
        `SELECT id, tenant_id, control_id, evidence_type, file_name, description, verified
         FROM compliance_evidence
         WHERE tenant_id = $1`,
        [tenantId]
      );

      for (const ev of evidence.rows) {
        try {
          await this.upsertNode({
            id: `evidence:${ev.id}`,
            type: 'Evidence',
            properties: {
              id: ev.id,
              tenantId: ev.tenant_id,
              evidenceType: ev.evidence_type,
              fileName: ev.file_name,
              description: ev.description,
              verified: ev.verified
            },
            createdAt: new Date(),
            updatedAt: new Date()
          });
          nodesCreated++;

          if (ev.control_id) {
            await this.createRelationship({
              id: uuidv4(),
              sourceId: `evidence:${ev.id}`,
              targetId: `control:${ev.control_id}`,
              type: 'ADDRESSES',
              properties: { verified: ev.verified },
              createdAt: new Date()
            });
            relationshipsCreated++;
          }
        } catch (e) {
          errors.push(`Evidence ${ev.id}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

    } catch (error) {
      errors.push(`General error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      nodesCreated,
      nodesUpdated: 0,
      relationshipsCreated,
      errors,
      duration: Date.now() - startTime
    };
  }

  /**
   * Ingest qualitative assessment results for a tenant
   */
  async ingestQualitativeAssessments(tenantId: string): Promise<IngestionResult> {
    const startTime = Date.now();
    let nodesCreated = 0;
    let relationshipsCreated = 0;
    const errors: string[] = [];

    try {
      // Ingest trustworthiness assessments
      const assessments = await this.pool.query(
        `SELECT id, tenant_id, ai_system_id, assessment_name, assessment_type,
                overall_rating, overall_narrative, assessed_by, created_at
         FROM trustworthiness_assessments
         WHERE tenant_id = $1`,
        [tenantId]
      );

      for (const assessment of assessments.rows) {
        try {
          await this.upsertNode({
            id: `qualitative_assessment:${assessment.id}`,
            type: 'Assessment',
            properties: {
              id: assessment.id,
              tenantId: assessment.tenant_id,
              type: 'qualitative',
              aiSystemId: assessment.ai_system_id,
              name: assessment.assessment_name,
              assessmentType: assessment.assessment_type,
              overallRating: assessment.overall_rating,
              overallNarrative: assessment.overall_narrative,
              assessedBy: assessment.assessed_by
            },
            createdAt: new Date(assessment.created_at),
            updatedAt: new Date()
          });
          nodesCreated++;
        } catch (e) {
          errors.push(`Qualitative Assessment ${assessment.id}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

      // Ingest stakeholders
      const stakeholders = await this.pool.query(
        `SELECT id, tenant_id, name, stakeholder_type, category, description,
                vulnerabilities, has_vulnerabilities
         FROM stakeholder_registry
         WHERE tenant_id = $1`,
        [tenantId]
      );

      for (const sh of stakeholders.rows) {
        try {
          await this.upsertNode({
            id: `stakeholder:${sh.id}`,
            type: 'Stakeholder',
            properties: {
              id: sh.id,
              tenantId: sh.tenant_id,
              name: sh.name,
              stakeholderType: sh.stakeholder_type,
              category: sh.category,
              description: sh.description,
              vulnerabilities: sh.vulnerabilities,
              hasVulnerabilities: sh.has_vulnerabilities
            },
            createdAt: new Date(),
            updatedAt: new Date()
          });
          nodesCreated++;
        } catch (e) {
          errors.push(`Stakeholder ${sh.id}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

      // Ingest scenarios
      const scenarios = await this.pool.query(
        `SELECT id, tenant_id, ai_system_id, title, scenario_type, description,
                context, actors, potential_harms, affected_requirements,
                likelihood, severity, risk_score
         FROM socio_technical_scenarios
         WHERE tenant_id = $1`,
        [tenantId]
      );

      for (const scenario of scenarios.rows) {
        try {
          await this.upsertNode({
            id: `scenario:${scenario.id}`,
            type: 'Scenario',
            properties: {
              id: scenario.id,
              tenantId: scenario.tenant_id,
              aiSystemId: scenario.ai_system_id,
              title: scenario.title,
              scenarioType: scenario.scenario_type,
              description: scenario.description,
              actors: scenario.actors,
              potentialHarms: scenario.potential_harms,
              affectedRequirements: scenario.affected_requirements,
              likelihood: scenario.likelihood,
              severity: scenario.severity,
              riskScore: scenario.risk_score
            },
            createdAt: new Date(),
            updatedAt: new Date()
          });
          nodesCreated++;

          // Create relationships to affected requirements
          const affectedReqs = scenario.affected_requirements || [];
          for (const reqId of affectedReqs) {
            await this.createRelationship({
              id: uuidv4(),
              sourceId: `scenario:${scenario.id}`,
              targetId: `requirement:${reqId}`,
              type: 'RELATES_TO',
              properties: { relationshipNature: 'affects_requirement' },
              createdAt: new Date()
            });
            relationshipsCreated++;
          }
        } catch (e) {
          errors.push(`Scenario ${scenario.id}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

      // Ingest ethical tensions
      const tensions = await this.pool.query(
        `SELECT id, assessment_id, scenario_id, requirement_id, value_a, value_b,
                tension_description, severity, status, affected_stakeholders
         FROM ethical_tensions
         WHERE assessment_id IN (
           SELECT id FROM trustworthiness_assessments WHERE tenant_id = $1
         )`,
        [tenantId]
      );

      for (const tension of tensions.rows) {
        try {
          await this.upsertNode({
            id: `tension:${tension.id}`,
            type: 'Tension',
            properties: {
              id: tension.id,
              assessmentId: tension.assessment_id,
              scenarioId: tension.scenario_id,
              requirementId: tension.requirement_id,
              valueA: tension.value_a,
              valueB: tension.value_b,
              description: tension.tension_description,
              severity: tension.severity,
              status: tension.status,
              affectedStakeholders: tension.affected_stakeholders
            },
            createdAt: new Date(),
            updatedAt: new Date()
          });
          nodesCreated++;

          // Create IDENTIFIED_IN relationship
          await this.createRelationship({
            id: uuidv4(),
            sourceId: `tension:${tension.id}`,
            targetId: `qualitative_assessment:${tension.assessment_id}`,
            type: 'IDENTIFIED_IN',
            properties: {},
            createdAt: new Date()
          });
          relationshipsCreated++;

          // Create AFFECTS relationships to stakeholders
          const affectedSh = tension.affected_stakeholders || [];
          for (const shId of affectedSh) {
            await this.createRelationship({
              id: uuidv4(),
              sourceId: `tension:${tension.id}`,
              targetId: `stakeholder:${shId}`,
              type: 'AFFECTS',
              properties: {},
              createdAt: new Date()
            });
            relationshipsCreated++;
          }
        } catch (e) {
          errors.push(`Tension ${tension.id}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

      // Ingest qualitative findings
      const findings = await this.pool.query(
        `SELECT id, assessment_id, finding_type, requirement_id, title,
                description, severity, status, category
         FROM qualitative_findings
         WHERE assessment_id IN (
           SELECT id FROM trustworthiness_assessments WHERE tenant_id = $1
         )`,
        [tenantId]
      );

      for (const finding of findings.rows) {
        try {
          await this.upsertNode({
            id: `finding:${finding.id}`,
            type: 'Finding',
            properties: {
              id: finding.id,
              assessmentId: finding.assessment_id,
              type: finding.finding_type,
              requirementId: finding.requirement_id,
              title: finding.title,
              description: finding.description,
              severity: finding.severity,
              status: finding.status,
              category: finding.category
            },
            createdAt: new Date(),
            updatedAt: new Date()
          });
          nodesCreated++;

          await this.createRelationship({
            id: uuidv4(),
            sourceId: `finding:${finding.id}`,
            targetId: `qualitative_assessment:${finding.assessment_id}`,
            type: 'IDENTIFIED_IN',
            properties: {},
            createdAt: new Date()
          });
          relationshipsCreated++;
        } catch (e) {
          errors.push(`Finding ${finding.id}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

    } catch (error) {
      errors.push(`General error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      nodesCreated,
      nodesUpdated: 0,
      relationshipsCreated,
      errors,
      duration: Date.now() - startTime
    };
  }

  // ==========================================================================
  // Querying
  // ==========================================================================

  /**
   * Query the compliance knowledge graph
   */
  async query(graphQuery: GraphQuery): Promise<GraphQueryResult> {
    try {
      const response = await fetch(`${this.graphragEndpoint}/api/v1/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.graphragApiKey && { 'Authorization': `Bearer ${this.graphragApiKey}` })
        },
        body: JSON.stringify({
          query: graphQuery.query,
          parameters: graphQuery.parameters || {},
          options: {
            maxDepth: graphQuery.maxDepth || 3,
            limit: graphQuery.limit || 100,
            namespace: 'nexus_compliance'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Query failed: ${await response.text()}`);
      }

      return await response.json() as GraphQueryResult;
    } catch (error) {
      return {
        nodes: [],
        relationships: [],
        metadata: {
          queryTime: 0,
          nodesScanned: 0,
          relationshipsTraversed: 0
        }
      };
    }
  }

  /**
   * Find compliance insights using GraphRAG analysis
   */
  async findInsights(tenantId: string): Promise<ComplianceInsight[]> {
    const insights: ComplianceInsight[] = [];

    try {
      // Find controls without cross-framework mappings (gaps)
      const gapQuery = await this.query({
        query: `
          MATCH (c:Control)
          WHERE NOT (c)-[:MAPS_TO|EQUIVALENT_TO]-(:Control)
          AND NOT (c)-[:ASSESSED_BY]->(:Assessment {tenantId: $tenantId, status: 'compliant'})
          RETURN c LIMIT 20
        `,
        parameters: { tenantId }
      });

      if (gapQuery.nodes.length > 0) {
        insights.push({
          type: 'gap',
          severity: 'medium',
          title: 'Unmapped Controls Detected',
          description: `${gapQuery.nodes.length} controls lack cross-framework mappings, potentially indicating coverage gaps.`,
          affectedEntities: gapQuery.nodes.map(n => n.properties.id),
          suggestedActions: [
            'Review controls for potential mappings to other frameworks',
            'Prioritize assessment of unmapped controls'
          ],
          confidence: 0.8,
          sources: ['cross_reference_analysis']
        });
      }

      // Find unresolved critical tensions
      const tensionQuery = await this.query({
        query: `
          MATCH (t:Tension {severity: 'critical', status: 'identified'})
          RETURN t LIMIT 10
        `
      });

      if (tensionQuery.nodes.length > 0) {
        insights.push({
          type: 'risk',
          severity: 'high',
          title: 'Unresolved Critical Ethical Tensions',
          description: `${tensionQuery.nodes.length} critical ethical tensions remain unresolved.`,
          affectedEntities: tensionQuery.nodes.map(n => n.properties.id),
          suggestedActions: [
            'Prioritize resolution of critical tensions',
            'Engage stakeholders for tension mediation',
            'Document resolution approaches'
          ],
          confidence: 0.9,
          sources: ['tension_analysis']
        });
      }

      // Find highly-connected requirements (central to compliance)
      const centralityQuery = await this.query({
        query: `
          MATCH (r:Requirement)<-[:IMPLEMENTS]-(c:Control)
          WITH r, COUNT(c) as controlCount
          ORDER BY controlCount DESC
          RETURN r, controlCount LIMIT 5
        `
      });

      if (centralityQuery.nodes.length > 0) {
        const topReq = centralityQuery.nodes[0];
        insights.push({
          type: 'recommendation',
          severity: 'info',
          title: 'Key Compliance Requirements Identified',
          description: `${topReq.properties.name} is addressed by the most controls, making it central to your compliance posture.`,
          affectedEntities: centralityQuery.nodes.map(n => n.properties.id),
          suggestedActions: [
            'Ensure robust assessment coverage for key requirements',
            'Monitor changes to central requirements closely'
          ],
          confidence: 0.85,
          sources: ['requirement_centrality_analysis']
        });
      }

    } catch (error) {
      // Return empty insights on error
    }

    return insights;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private async upsertNode(node: GraphRAGNode): Promise<void> {
    try {
      await fetch(`${this.graphragEndpoint}/api/v1/nodes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(this.graphragApiKey && { 'Authorization': `Bearer ${this.graphragApiKey}` })
        },
        body: JSON.stringify({
          ...node,
          namespace: 'nexus_compliance'
        })
      });
    } catch (error) {
      throw error;
    }
  }

  private async createRelationship(rel: GraphRAGRelationship): Promise<void> {
    try {
      await fetch(`${this.graphragEndpoint}/api/v1/relationships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.graphragApiKey && { 'Authorization': `Bearer ${this.graphragApiKey}` })
        },
        body: JSON.stringify({
          ...rel,
          namespace: 'nexus_compliance'
        })
      });
    } catch (error) {
      throw error;
    }
  }

  private mapRelationshipType(type: string): RelationshipType {
    switch (type) {
      case 'equivalent':
        return 'EQUIVALENT_TO';
      case 'partial':
        return 'PARTIALLY_OVERLAPS';
      case 'related':
        return 'RELATES_TO';
      case 'supersedes':
        return 'SUPERSEDES';
      default:
        return 'MAPS_TO';
    }
  }
}
