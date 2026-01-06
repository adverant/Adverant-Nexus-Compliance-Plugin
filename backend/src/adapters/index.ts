/**
 * Nexus Compliance Engine - Adapters Module
 * Evidence collection adapters for external security and compliance tools
 */

// Base adapter interface
export {
  EvidenceAdapter,
  type AdapterConfig,
  type AdapterType,
  type AdapterCredentials,
  type AuthType,
  type CollectedEvidence,
  type CollectedEvidenceStatus,
  type EvidenceSeverity,
  type CollectionOptions,
  type CollectionResult,
  type AdapterHealthStatus,
  isCollectedEvidence,
} from './base-adapter.js';

// Specific adapters
export { QualysAdapter } from './qualys-adapter.js';
export { SplunkAdapter } from './splunk-adapter.js';
export { AWSConfigAdapter } from './aws-config-adapter.js';

// Registry and factory
export {
  AdapterRegistry,
  getAdapterRegistry,
  clearRegistryCache,
  getSupportedAdapterTypes,
  type RegistryHealth,
  type BulkCollectionResult,
} from './adapter-registry.js';
