/**
 * Qualitative Assessment Types for Z-Inspection Aligned Trustworthy AI Evaluation
 * Complements quantitative compliance controls with narrative-based ethical assessment
 */

// ============================================================================
// 7 EU TRUSTWORTHY AI REQUIREMENTS
// ============================================================================

export type TrustworthyAIRequirementId =
  | 'human_agency_oversight'
  | 'technical_robustness_safety'
  | 'privacy_data_governance'
  | 'transparency'
  | 'diversity_fairness_nondiscrimination'
  | 'societal_environmental_wellbeing'
  | 'accountability';

export interface TrustworthyAIRequirement {
  id: TrustworthyAIRequirementId;
  name: string;
  shortName: string;
  description: string;
  assessmentGuidance: string;
  keyConsiderations: string[];
  relatedControls: string[]; // Control IDs from compliance_controls
  displayOrder: number;
}

// ============================================================================
// STAKEHOLDERS
// ============================================================================

export type StakeholderType =
  | 'end_user'
  | 'affected_person'
  | 'vulnerable_group'
  | 'operator'
  | 'provider'
  | 'society'
  | 'environment'
  | 'regulator'
  | 'third_party';

export type ImpactLevel = 'critical' | 'high' | 'moderate' | 'low' | 'minimal';
export type PowerLevel = 'high' | 'medium' | 'low';
export type InterestLevel = 'high' | 'medium' | 'low';
export type EngagementStatus = 'identified' | 'contacted' | 'engaged' | 'consulted' | 'ongoing';

export type VulnerabilityFactor =
  | 'age_minor'
  | 'age_elderly'
  | 'disability_physical'
  | 'disability_cognitive'
  | 'disability_sensory'
  | 'economic_disadvantage'
  | 'digital_literacy'
  | 'language_barrier'
  | 'geographic_isolation'
  | 'power_imbalance'
  | 'other';

export interface Stakeholder {
  id: string;
  tenantId: string;
  aiSystemId: string;

  // Stakeholder Information
  name: string;
  stakeholderType: StakeholderType;
  category?: string;
  description?: string;

  // Impact Assessment
  impactLevel: ImpactLevel;
  impactDescription?: string;
  powerLevel: PowerLevel;
  interestLevel: InterestLevel;

  // Vulnerability Assessment
  isVulnerableGroup: boolean;
  vulnerabilityFactors: VulnerabilityFactor[];

  // Engagement
  engagementStatus: EngagementStatus;
  engagementNotes?: string;
  lastEngagementDate?: Date;

  // Concerns and Interests
  keyConcerns: string[];
  keyInterests: string[];

  // Metadata
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface CreateStakeholderInput {
  aiSystemId: string;
  name: string;
  stakeholderType: StakeholderType;
  category?: string;
  description?: string;
  impactLevel?: ImpactLevel;
  impactDescription?: string;
  powerLevel?: PowerLevel;
  interestLevel?: InterestLevel;
  isVulnerableGroup?: boolean;
  vulnerabilityFactors?: VulnerabilityFactor[];
  keyConcerns?: string[];
  keyInterests?: string[];
}

export interface StakeholderEngagement {
  id: string;
  stakeholderId: string;
  tenantId: string;
  engagementType: 'interview' | 'survey' | 'workshop' | 'observation' | 'feedback' | 'consultation';
  engagementDate: Date;
  durationMinutes?: number;
  participants: string[];
  summary: string;
  keyInsights: string[];
  concernsRaised: string[];
  suggestions: string[];
  followUpRequired: boolean;
  followUpNotes?: string;
  evidenceId?: string;
  createdAt: Date;
  createdBy?: string;
}

// ============================================================================
// SOCIO-TECHNICAL SCENARIOS
// ============================================================================

export type ScenarioType =
  | 'use_case'
  | 'failure_mode'
  | 'edge_case'
  | 'stakeholder_impact'
  | 'adversarial'
  | 'emergent';

export type Likelihood = 'certain' | 'likely' | 'possible' | 'unlikely' | 'rare';
export type Severity = 'critical' | 'high' | 'moderate' | 'low' | 'minimal';
export type ScenarioStatus = 'draft' | 'under_review' | 'validated' | 'archived';

export interface ScenarioActor {
  stakeholderId?: string;
  name: string;
  role: string;
  actions: string[];
}

export interface SocioTechnicalScenario {
  id: string;
  tenantId: string;
  aiSystemId: string;

  // Scenario Details
  title: string;
  scenarioType: ScenarioType;
  description: string;
  narrative?: string;

  // Context
  contextSetting?: string;
  actors: ScenarioActor[];
  preconditions: string[];

  // Trustworthy AI Mapping
  primaryRequirement?: TrustworthyAIRequirementId;
  affectedRequirements: TrustworthyAIRequirementId[];

  // Impact Assessment
  likelihood: Likelihood;
  severity: Severity;
  riskScore?: number; // Calculated

  // Outcomes
  potentialHarms: string[];
  potentialBenefits: string[];
  mitigations: string[];

  // Status
  status: ScenarioStatus;
  reviewNotes?: string;

  // AI Generation
  isAiGenerated: boolean;
  generationPrompt?: string;

  // Metadata
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface CreateScenarioInput {
  aiSystemId: string;
  title: string;
  scenarioType: ScenarioType;
  description: string;
  narrative?: string;
  contextSetting?: string;
  actors?: ScenarioActor[];
  preconditions?: string[];
  primaryRequirement?: TrustworthyAIRequirementId;
  affectedRequirements?: TrustworthyAIRequirementId[];
  likelihood?: Likelihood;
  severity?: Severity;
  potentialHarms?: string[];
  potentialBenefits?: string[];
  mitigations?: string[];
}

export interface GenerateScenarioInput {
  aiSystemId: string;
  scenarioType?: ScenarioType;
  focusRequirement?: TrustworthyAIRequirementId;
  context?: string;
  count?: number;
}

// ============================================================================
// ETHICAL TENSIONS
// ============================================================================

export type TensionType =
  | 'value_vs_value'
  | 'stakeholder_vs_stakeholder'
  | 'requirement_vs_requirement'
  | 'short_term_vs_long_term';

export type TensionSeverity = 'critical' | 'significant' | 'moderate' | 'minor';
export type TensionStatus = 'identified' | 'under_review' | 'mitigated' | 'accepted' | 'unresolved';

export interface StakeholderPerspective {
  stakeholderId: string;
  perspective: string;
  preferredResolution?: string;
}

export interface EthicalTension {
  id: string;
  tenantId: string;
  aiSystemId: string;
  scenarioId?: string;

  // Tension Definition
  title: string;
  description: string;

  // Values in Tension
  valueA: string;
  valueADescription?: string;
  valueB: string;
  valueBDescription?: string;

  // Tension Type
  tensionType: TensionType;

  // Related Requirements
  requirementA?: TrustworthyAIRequirementId;
  requirementB?: TrustworthyAIRequirementId;

  // Affected Stakeholders
  affectedStakeholders: string[]; // Stakeholder IDs
  stakeholderPerspectives: Record<string, StakeholderPerspective>;

  // Severity and Status
  severity: TensionSeverity;
  status: TensionStatus;

  // Resolution
  resolutionApproach?: string;
  resolutionRationale?: string;
  tradeOffDecision?: string;
  residualConcerns?: string;
  resolvedAt?: Date;
  resolvedBy?: string;

  // AI Analysis
  isAiIdentified: boolean;
  aiAnalysis: Record<string, unknown>;

  // Metadata
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface CreateTensionInput {
  aiSystemId: string;
  scenarioId?: string;
  title: string;
  description: string;
  valueA: string;
  valueADescription?: string;
  valueB: string;
  valueBDescription?: string;
  tensionType: TensionType;
  requirementA?: TrustworthyAIRequirementId;
  requirementB?: TrustworthyAIRequirementId;
  affectedStakeholders?: string[];
  severity?: TensionSeverity;
}

export interface ResolveTensionInput {
  resolutionApproach: string;
  resolutionRationale: string;
  tradeOffDecision?: string;
  residualConcerns?: string;
  newStatus: 'mitigated' | 'accepted';
}

// ============================================================================
// TRUSTWORTHINESS ASSESSMENTS
// ============================================================================

export type TrustworthinessRating = 'trustworthy' | 'conditionally_trustworthy' | 'not_trustworthy' | 'inconclusive';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type AssessmentType = 'comprehensive' | 'targeted' | 'periodic' | 'z_inspection_import';
export type TrustworthinessAssessmentStatus = 'draft' | 'in_progress' | 'review' | 'final' | 'archived';

export interface RequirementAssessment {
  requirementId: TrustworthyAIRequirementId;
  rating: TrustworthinessRating;
  narrative: string;
  findings: string[];
  evidenceRefs: string[]; // Evidence IDs
  confidence: ConfidenceLevel;
  keyStrengths: string[];
  keyWeaknesses: string[];
}

export interface TrustworthinessAssessment {
  id: string;
  tenantId: string;
  aiSystemId: string;

  // Assessment Info
  title: string;
  assessmentType: AssessmentType;
  scope?: string;

  // Overall Rating
  overallRating?: TrustworthinessRating;
  overallNarrative?: string;
  overallConfidence?: ConfidenceLevel;

  // Requirement-Level Assessments
  requirementAssessments: Record<TrustworthyAIRequirementId, RequirementAssessment>;

  // Linked Elements
  scenariosAssessed: string[];
  tensionsIdentified: string[];
  stakeholdersConsulted: string[];

  // Methodology
  methodology?: string;
  assessors: string[];
  assessmentDate: Date;

  // Status
  status: TrustworthinessAssessmentStatus;

  // Z-Inspection Import
  zInspectionSourceId?: string;

  // Recommendations
  recommendations: string[];
  priorityActions: string[];

  // Metadata
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface CreateAssessmentInput {
  aiSystemId: string;
  title: string;
  assessmentType?: AssessmentType;
  scope?: string;
  methodology?: string;
  assessors?: string[];
}

export interface RunAssessmentInput {
  assessmentId: string;
  includeAiAnalysis?: boolean;
  focusRequirements?: TrustworthyAIRequirementId[];
}

// ============================================================================
// QUALITATIVE FINDINGS
// ============================================================================

export type FindingType = 'strength' | 'weakness' | 'opportunity' | 'threat' | 'recommendation' | 'observation';
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low';
export type FindingPriority = 'immediate' | 'short_term' | 'medium_term' | 'long_term';
export type FindingStatus = 'open' | 'in_progress' | 'addressed' | 'accepted' | 'deferred';

export interface RecommendedAction {
  action: string;
  priority: FindingPriority;
  responsibleParty?: string;
  dueDate?: Date;
}

export interface QualitativeFinding {
  id: string;
  tenantId: string;
  assessmentId: string;
  aiSystemId: string;

  // Finding Details
  title: string;
  findingType: FindingType;
  description: string;

  // Classification
  requirementId?: TrustworthyAIRequirementId;
  category?: string;

  // Severity/Priority
  severity?: FindingSeverity;
  priority?: FindingPriority;

  // Evidence
  evidenceDescription?: string;
  evidenceSources: string[]; // Evidence IDs

  // Recommendations
  recommendation?: string;
  recommendedActions: RecommendedAction[];

  // Status
  status: FindingStatus;
  resolutionNotes?: string;
  resolvedAt?: Date;

  // Control Mapping
  relatedControls: string[]; // Control IDs

  // Metadata
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface CreateFindingInput {
  assessmentId: string;
  aiSystemId: string;
  title: string;
  findingType: FindingType;
  description: string;
  requirementId?: TrustworthyAIRequirementId;
  category?: string;
  severity?: FindingSeverity;
  priority?: FindingPriority;
  evidenceDescription?: string;
  evidenceSources?: string[];
  recommendation?: string;
  recommendedActions?: RecommendedAction[];
  relatedControls?: string[];
}

// ============================================================================
// Z-INSPECTION REPORTS
// ============================================================================

export type ImportMethod = 'manual' | 'json_import' | 'xml_import' | 'ai_parsed';
export type SourceDocumentType = 'pdf' | 'word' | 'structured_json' | 'structured_xml' | 'text';
export type ImportStatus = 'imported' | 'processing' | 'processed' | 'verified' | 'error';

export interface ZInspectionTeamMember {
  name: string;
  role: string;
  affiliation?: string;
}

export interface ExtractedFinding {
  title: string;
  description: string;
  requirementId?: TrustworthyAIRequirementId;
  findingType: FindingType;
  severity?: FindingSeverity;
}

export interface ExtractedScenario {
  title: string;
  description: string;
  scenarioType: ScenarioType;
  primaryRequirement?: TrustworthyAIRequirementId;
}

export interface ExtractedTension {
  title: string;
  description: string;
  valueA: string;
  valueB: string;
  tensionType: TensionType;
}

export interface ExtractedRecommendation {
  recommendation: string;
  priority?: FindingPriority;
  relatedRequirement?: TrustworthyAIRequirementId;
}

export interface ZInspectionReport {
  id: string;
  tenantId: string;
  aiSystemId: string;

  // Report Information
  title: string;
  reportDate: Date;
  inspectionTeam: ZInspectionTeamMember[];

  // Import Details
  importMethod: ImportMethod;
  sourceDocumentType?: SourceDocumentType;
  sourceDocumentUrl?: string;
  sourceDocumentHash?: string;

  // Raw/Parsed Content
  rawContent?: string;
  parsedContent: Record<string, unknown>;

  // Extracted Elements
  extractedFindings: ExtractedFinding[];
  extractedScenarios: ExtractedScenario[];
  extractedTensions: ExtractedTension[];
  extractedRecommendations: ExtractedRecommendation[];

  // Overall Conclusions
  overallConclusion?: string;
  trustworthinessRating?: TrustworthinessRating;

  // Processing Status
  status: ImportStatus;
  processingNotes?: string;
  errorMessage?: string;

  // Linked Assessment
  generatedAssessmentId?: string;

  // Metadata
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface ImportZInspectionInput {
  aiSystemId: string;
  title: string;
  reportDate: Date;
  inspectionTeam?: ZInspectionTeamMember[];
  importMethod: ImportMethod;
  sourceDocumentType?: SourceDocumentType;
  content: string; // Raw content or structured JSON/XML
  sourceDocumentUrl?: string;
}

// ============================================================================
// REQUIREMENT-CONTROL MAPPINGS
// ============================================================================

export type MappingStrength = 'strong' | 'moderate' | 'weak';
export type MappedBy = 'system' | 'manual' | 'ai';

export interface RequirementControlMapping {
  id: string;
  requirementId: TrustworthyAIRequirementId;
  controlId: string;
  frameworkId: string;
  mappingStrength: MappingStrength;
  mappingRationale?: string;
  coverageAspect?: string;
  mappedBy: MappedBy;
  createdAt: Date;
}

// ============================================================================
// DASHBOARD AND ANALYSIS TYPES
// ============================================================================

export interface TrustworthinessDashboard {
  aiSystemId: string;
  aiSystemName: string;
  riskClassification: string;

  // Latest Assessment
  latestAssessment?: {
    id: string;
    overallRating: TrustworthinessRating;
    overallConfidence: ConfidenceLevel;
    assessmentDate: Date;
    requirementSummary: Record<TrustworthyAIRequirementId, {
      rating: TrustworthinessRating;
      openFindings: number;
      unresolvedTensions: number;
    }>;
  };

  // Counts
  scenarioCount: number;
  unresolvedTensionCount: number;
  stakeholderCount: number;
  openFindingCount: number;

  // Trends
  ratingHistory: Array<{
    date: Date;
    rating: TrustworthinessRating;
    confidence: ConfidenceLevel;
  }>;
}

export interface RequirementCoverage {
  requirementId: TrustworthyAIRequirementId;
  requirementName: string;

  // Quantitative (Controls)
  totalControls: number;
  controlsByFramework: Record<string, number>;

  // Qualitative
  scenarioCount: number;
  tensionCount: number;
  findingCount: number;

  // Assessment Status
  latestRating?: TrustworthinessRating;
  latestConfidence?: ConfidenceLevel;
}

// ============================================================================
// AI INTEGRATION TYPES (for MageAgent)
// ============================================================================

export interface ScenarioGenerationResult {
  scenarios: SocioTechnicalScenario[];
  generationPrompt: string;
  modelUsed: string;
  confidenceScore: number;
}

export interface TensionIdentificationResult {
  tensions: EthicalTension[];
  analysisContext: string;
  modelUsed: string;
  confidenceScore: number;
}

export interface RequirementAssessmentResult {
  requirementId: TrustworthyAIRequirementId;
  assessment: RequirementAssessment;
  supportingEvidence: string[];
  modelUsed: string;
  confidenceScore: number;
}

export interface ZInspectionParseResult {
  extractedFindings: ExtractedFinding[];
  extractedScenarios: ExtractedScenario[];
  extractedTensions: ExtractedTension[];
  extractedRecommendations: ExtractedRecommendation[];
  overallConclusion: string;
  trustworthinessRating: TrustworthinessRating;
  parseConfidence: number;
}
