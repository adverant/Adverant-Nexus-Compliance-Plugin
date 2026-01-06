/**
 * Nexus Compliance Engine - Adapter Registry
 * Manages lifecycle and discovery of evidence collection adapters
 */

import { createLogger } from '../utils/logger.js';
import { query, type DatabaseRow } from '../database/client.js';
import {
  EvidenceAdapter,
  type AdapterConfig,
  type AdapterType,
  type CollectedEvidence,
  type AdapterHealthStatus,
  type CollectionResult,
} from './base-adapter.js';
import { QualysAdapter } from './qualys-adapter.js';
import { SplunkAdapter } from './splunk-adapter.js';
import { AWSConfigAdapter } from './aws-config-adapter.js';

const logger = createLogger('adapter-registry');

/**
 * Adapter constructor type
 */
type AdapterConstructor = new (config: AdapterConfig) => EvidenceAdapter;

/**
 * Registered adapter types and their constructors
 */
const ADAPTER_CONSTRUCTORS: Record<string, AdapterConstructor> = {
  'qualys': QualysAdapter,
  'vulnerability_scanner': QualysAdapter, // Default vulnerability scanner
  'splunk': SplunkAdapter,
  'siem': SplunkAdapter, // Default SIEM
  'aws-config': AWSConfigAdapter,
  'cloud_config': AWSConfigAdapter, // Default cloud config
};

/**
 * Database row for adapter configuration
 */
interface AdapterRow extends DatabaseRow {
  id: string;
  tenant_id: string;
  name: string;
  adapter_type: string;
  base_url: string;
  credentials: string | AdapterConfig['credentials'];
  polling_interval_ms: number | null;
  enabled: boolean;
  last_collection_at: string | null;
  last_health_check_at: string | null;
  health_status: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Registry health status
 */
export interface RegistryHealth {
  initialized: boolean;
  adapterCount: number;
  healthyCount: number;
  unhealthyCount: number;
  adapters: Array<{
    id: string;
    name: string;
    type: AdapterType;
    healthy: boolean;
    lastCheckAt?: Date;
    latencyMs?: number;
    errorMessage?: string;
  }>;
}

/**
 * Bulk collection result
 */
export interface BulkCollectionResult {
  success: boolean;
  totalAdapters: number;
  successfulAdapters: number;
  failedAdapters: number;
  totalEvidenceCollected: number;
  results: Map<string, CollectionResult>;
  durationMs: number;
}

/**
 * Adapter Registry - Manages evidence collection adapters for a tenant
 */
export class AdapterRegistry {
  private readonly tenantId: string;
  private adapters: Map<string, EvidenceAdapter> = new Map();
  private initialized: boolean = false;
  private initializationError: Error | null = null;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Initialize the registry by loading adapter configurations from database
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn({ tenantId: this.tenantId }, 'Adapter registry already initialized');
      return;
    }

    logger.info({ tenantId: this.tenantId }, 'Initializing adapter registry');

    try {
      // Load adapter configurations from database
      const configs = await this.loadAdapterConfigs();

      for (const config of configs) {
        if (!config.enabled) {
          logger.debug({ adapterId: config.id, name: config.name }, 'Skipping disabled adapter');
          continue;
        }

        try {
          await this.registerAdapter(config);
        } catch (error) {
          logger.error({
            adapterId: config.id,
            name: config.name,
            error: error instanceof Error ? error.message : String(error),
          }, 'Failed to register adapter - continuing with others');
          // Don't fail initialization for a single adapter failure
        }
      }

      this.initialized = true;

      logger.info({
        tenantId: this.tenantId,
        adapterCount: this.adapters.size,
        adapters: Array.from(this.adapters.keys()),
      }, 'Adapter registry initialization complete');

    } catch (error) {
      this.initializationError = error instanceof Error ? error : new Error(String(error));
      logger.error({
        tenantId: this.tenantId,
        error: this.initializationError.message,
      }, 'Adapter registry initialization failed');
      throw this.initializationError;
    }
  }

  /**
   * Register a new adapter
   */
  async registerAdapter(config: AdapterConfig): Promise<EvidenceAdapter> {
    // Determine adapter constructor
    const constructorKey = config.metadata?.adapterClass as string || config.type;
    const AdapterClass = ADAPTER_CONSTRUCTORS[constructorKey];

    if (!AdapterClass) {
      throw new Error(`Unknown adapter type: ${config.type} (constructor key: ${constructorKey})`);
    }

    logger.info({
      adapterId: config.id,
      name: config.name,
      type: config.type,
    }, 'Registering adapter');

    // Create and initialize adapter
    const adapter = new AdapterClass(config);
    await adapter.initialize();

    // Store in registry
    this.adapters.set(config.id, adapter);

    // Update health status in database
    const healthStatus = adapter.getLastHealthCheck();
    if (healthStatus) {
      await this.updateAdapterHealth(config.id, healthStatus);
    }

    logger.info({
      adapterId: config.id,
      name: config.name,
      supportedControls: adapter.supportedControlTypes.length,
    }, 'Adapter registered successfully');

    return adapter;
  }

  /**
   * Unregister an adapter
   */
  unregisterAdapter(adapterId: string): boolean {
    const removed = this.adapters.delete(adapterId);
    if (removed) {
      logger.info({ adapterId }, 'Adapter unregistered');
    }
    return removed;
  }

  /**
   * Get a specific adapter
   */
  getAdapter(adapterId: string): EvidenceAdapter | undefined {
    return this.adapters.get(adapterId);
  }

  /**
   * Get all registered adapters
   */
  getAllAdapters(): EvidenceAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get adapters that support a specific control type
   */
  getAdaptersByControlType(controlType: string): EvidenceAdapter[] {
    return Array.from(this.adapters.values()).filter(
      adapter => adapter.supportedControlTypes.includes(controlType)
    );
  }

  /**
   * Get adapters by adapter type
   */
  getAdaptersByType(type: AdapterType): EvidenceAdapter[] {
    return Array.from(this.adapters.values()).filter(
      adapter => adapter.type === type
    );
  }

  /**
   * Collect evidence from all adapters
   */
  async collectAllEvidence(): Promise<BulkCollectionResult> {
    const startTime = Date.now();
    const results = new Map<string, CollectionResult>();
    let totalEvidenceCollected = 0;
    let successfulAdapters = 0;
    let failedAdapters = 0;

    logger.info({
      tenantId: this.tenantId,
      adapterCount: this.adapters.size,
    }, 'Starting bulk evidence collection');

    // Run collection in parallel with concurrency limit
    const adaptersArray = Array.from(this.adapters.entries());
    const concurrencyLimit = 5;

    for (let i = 0; i < adaptersArray.length; i += concurrencyLimit) {
      const batch = adaptersArray.slice(i, i + concurrencyLimit);

      const batchResults = await Promise.all(
        batch.map(async ([id, adapter]) => {
          try {
            const result = await adapter.collectEvidence();
            results.set(id, result);

            if (result.success) {
              successfulAdapters++;
              totalEvidenceCollected += result.evidence.length;

              logger.info({
                adapterId: id,
                evidenceCount: result.evidence.length,
                durationMs: result.metadata.durationMs,
              }, 'Evidence collected from adapter');
            } else {
              failedAdapters++;
              logger.warn({
                adapterId: id,
                errors: result.errors,
              }, 'Adapter collection completed with errors');
            }

            // Update last collection time
            await this.updateLastCollectionTime(id);

            return { id, result };
          } catch (error) {
            failedAdapters++;
            const errorResult: CollectionResult = {
              success: false,
              evidence: [],
              errors: [{
                code: 'COLLECTION_EXCEPTION',
                message: error instanceof Error ? error.message : String(error),
              }],
              metadata: {
                startedAt: new Date(),
                completedAt: new Date(),
                durationMs: 0,
                itemsCollected: 0,
                itemsFailed: 1,
              },
            };
            results.set(id, errorResult);

            logger.error({
              adapterId: id,
              error: error instanceof Error ? error.message : String(error),
            }, 'Adapter collection failed with exception');

            return { id, result: errorResult };
          }
        })
      );
    }

    const durationMs = Date.now() - startTime;

    logger.info({
      tenantId: this.tenantId,
      totalAdapters: this.adapters.size,
      successfulAdapters,
      failedAdapters,
      totalEvidenceCollected,
      durationMs,
    }, 'Bulk evidence collection completed');

    return {
      success: failedAdapters === 0,
      totalAdapters: this.adapters.size,
      successfulAdapters,
      failedAdapters,
      totalEvidenceCollected,
      results,
      durationMs,
    };
  }

  /**
   * Health check all adapters
   */
  async healthCheckAll(): Promise<Map<string, AdapterHealthStatus>> {
    const results = new Map<string, AdapterHealthStatus>();

    for (const [id, adapter] of this.adapters) {
      try {
        const status = await adapter.healthCheck();
        results.set(id, status);

        // Update health status in database
        await this.updateAdapterHealth(id, status);
      } catch (error) {
        const errorStatus: AdapterHealthStatus = {
          healthy: false,
          lastCheckAt: new Date(),
          latencyMs: 0,
          errorMessage: error instanceof Error ? error.message : String(error),
        };
        results.set(id, errorStatus);
        await this.updateAdapterHealth(id, errorStatus);
      }
    }

    return results;
  }

  /**
   * Get registry health status
   */
  async getHealth(): Promise<RegistryHealth> {
    const adapters: RegistryHealth['adapters'] = [];
    let healthyCount = 0;
    let unhealthyCount = 0;

    for (const [id, adapter] of this.adapters) {
      const lastCheck = adapter.getLastHealthCheck();
      const healthy = lastCheck?.healthy ?? false;

      if (healthy) {
        healthyCount++;
      } else {
        unhealthyCount++;
      }

      adapters.push({
        id,
        name: adapter.getConfig().name,
        type: adapter.type,
        healthy,
        lastCheckAt: lastCheck?.lastCheckAt,
        latencyMs: lastCheck?.latencyMs,
        errorMessage: lastCheck?.errorMessage,
      });
    }

    return {
      initialized: this.initialized,
      adapterCount: this.adapters.size,
      healthyCount,
      unhealthyCount,
      adapters,
    };
  }

  /**
   * Load adapter configurations from database
   */
  private async loadAdapterConfigs(): Promise<AdapterConfig[]> {
    const result = await query<AdapterRow>(
      `SELECT id, tenant_id, name, adapter_type, base_url, credentials,
              polling_interval_ms, enabled, metadata
       FROM compliance_adapters
       WHERE tenant_id = $1 AND enabled = true`,
      [this.tenantId]
    );

    return result.rows.map(row => {
      // Parse credentials if stored as JSON string
      let credentials = row.credentials;
      if (typeof credentials === 'string') {
        try {
          credentials = JSON.parse(credentials);
        } catch {
          logger.warn({ adapterId: row.id }, 'Failed to parse adapter credentials');
          credentials = { authType: 'api_key' as const };
        }
      }

      // Parse metadata if stored as JSON string
      let metadata: Record<string, unknown> | undefined;
      if (row.metadata) {
        try {
          metadata = typeof row.metadata === 'string'
            ? JSON.parse(row.metadata)
            : row.metadata;
        } catch {
          metadata = undefined;
        }
      }

      return {
        id: row.id,
        name: row.name,
        type: row.adapter_type as AdapterType,
        baseUrl: row.base_url,
        credentials: credentials as AdapterConfig['credentials'],
        pollingIntervalMs: row.polling_interval_ms || undefined,
        enabled: row.enabled,
        tenantId: row.tenant_id,
        metadata,
      };
    });
  }

  /**
   * Update adapter health status in database
   */
  private async updateAdapterHealth(
    adapterId: string,
    status: AdapterHealthStatus
  ): Promise<void> {
    try {
      await query(
        `UPDATE compliance_adapters
         SET last_health_check_at = NOW(),
             health_status = $1,
             updated_at = NOW()
         WHERE id = $2 AND tenant_id = $3`,
        [JSON.stringify(status), adapterId, this.tenantId]
      );
    } catch (error) {
      logger.warn({
        adapterId,
        error: error instanceof Error ? error.message : String(error),
      }, 'Failed to update adapter health status');
    }
  }

  /**
   * Update last collection time in database
   */
  private async updateLastCollectionTime(adapterId: string): Promise<void> {
    try {
      await query(
        `UPDATE compliance_adapters
         SET last_collection_at = NOW(),
             updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2`,
        [adapterId, this.tenantId]
      );
    } catch (error) {
      logger.warn({
        adapterId,
        error: error instanceof Error ? error.message : String(error),
      }, 'Failed to update adapter last collection time');
    }
  }

  /**
   * Check if registry is initialized
   */
  get isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get initialization error if any
   */
  getInitializationError(): Error | null {
    return this.initializationError;
  }
}

/**
 * Registry cache - one registry per tenant
 */
const registryCache = new Map<string, AdapterRegistry>();

/**
 * Get or create adapter registry for a tenant
 */
export async function getAdapterRegistry(
  tenantId: string,
  autoInitialize: boolean = true
): Promise<AdapterRegistry> {
  let registry = registryCache.get(tenantId);

  if (!registry) {
    registry = new AdapterRegistry(tenantId);
    registryCache.set(tenantId, registry);
  }

  if (autoInitialize && !registry.isInitialized) {
    await registry.initialize();
  }

  return registry;
}

/**
 * Clear registry cache for a tenant
 */
export function clearRegistryCache(tenantId?: string): void {
  if (tenantId) {
    registryCache.delete(tenantId);
  } else {
    registryCache.clear();
  }
}

/**
 * Get list of supported adapter types
 */
export function getSupportedAdapterTypes(): Array<{
  type: string;
  name: string;
  description: string;
}> {
  return [
    {
      type: 'qualys',
      name: 'Qualys Vulnerability Scanner',
      description: 'Collect vulnerability scan results from Qualys Cloud Platform',
    },
    {
      type: 'splunk',
      name: 'Splunk Enterprise SIEM',
      description: 'Collect security events and logs from Splunk Enterprise',
    },
    {
      type: 'aws-config',
      name: 'AWS Config',
      description: 'Collect cloud configuration compliance from AWS Config',
    },
  ];
}
