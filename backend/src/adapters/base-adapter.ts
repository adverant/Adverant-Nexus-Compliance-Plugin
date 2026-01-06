/**
 * Nexus Compliance Engine - Evidence Collection Adapter Base
 * Abstract interface for integrating with external security and compliance tools
 */

import { createLogger } from '../utils/logger.js';
import type { Logger } from 'pino';

/**
 * Adapter authentication types
 */
export type AuthType = 'api_key' | 'oauth2' | 'iam_role' | 'basic' | 'certificate';

/**
 * Adapter types categorized by function
 */
export type AdapterType =
  | 'vulnerability_scanner'  // Qualys, Nessus, Rapid7
  | 'siem'                   // Splunk, Elastic, Sumo Logic
  | 'cloud_config'           // AWS Config, Azure Policy, GCP Security Command
  | 'code_scanner'           // SonarQube, Snyk, Veracode
  | 'identity_provider'      // Okta, Azure AD, OneLogin
  | 'endpoint_protection'    // CrowdStrike, SentinelOne, Carbon Black
  | 'network_security'       // Palo Alto, Cisco Firepower, Fortinet
  | 'container_security';    // Aqua, Twistlock, Sysdig

/**
 * Adapter credentials configuration
 */
export interface AdapterCredentials {
  authType: AuthType;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  roleArn?: string;
  certificatePath?: string;
  privateKeyPath?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
}

/**
 * Adapter configuration
 */
export interface AdapterConfig {
  id: string;
  name: string;
  type: AdapterType;
  baseUrl: string;
  credentials: AdapterCredentials;
  pollingIntervalMs?: number;
  enabled: boolean;
  tenantId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Evidence severity levels
 */
export type EvidenceSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Evidence status
 */
export type CollectedEvidenceStatus = 'valid' | 'expired' | 'superseded' | 'pending_review';

/**
 * Collected evidence from external source
 */
export interface CollectedEvidence {
  /** Unique identifier from the source system */
  externalId: string;
  /** Type of evidence (maps to compliance evidence types) */
  type: string;
  /** Evidence title */
  title: string;
  /** Detailed description */
  description: string;
  /** Raw data from source (preserved for audit) */
  rawData: Record<string, unknown>;
  /** When evidence was collected */
  collectedAt: Date;
  /** Source system identifier */
  source: string;
  /** Control IDs this evidence supports */
  controlMappings: string[];
  /** Severity level if applicable */
  severity?: EvidenceSeverity;
  /** Evidence status */
  status: CollectedEvidenceStatus;
  /** When evidence expires */
  expiresAt?: Date;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Adapter health check result
 */
export interface AdapterHealthStatus {
  healthy: boolean;
  lastCheckAt: Date;
  latencyMs: number;
  errorMessage?: string;
  details?: Record<string, unknown>;
}

/**
 * Collection options
 */
export interface CollectionOptions {
  /** Specific control IDs to collect evidence for */
  controlIds?: string[];
  /** Only collect evidence from after this date */
  fromDate?: Date;
  /** Only collect evidence from before this date */
  toDate?: Date;
  /** Maximum number of evidence items to collect */
  limit?: number;
  /** Include raw API responses */
  includeRawData?: boolean;
}

/**
 * Collection result
 */
export interface CollectionResult {
  success: boolean;
  evidence: CollectedEvidence[];
  errors: Array<{
    code: string;
    message: string;
    details?: Record<string, unknown>;
  }>;
  metadata: {
    startedAt: Date;
    completedAt: Date;
    durationMs: number;
    itemsCollected: number;
    itemsFailed: number;
  };
}

/**
 * Abstract base class for evidence collection adapters
 *
 * All adapters must extend this class and implement:
 * - supportedControlTypes: List of control types this adapter provides evidence for
 * - healthCheck(): Verify connectivity to the external system
 * - collectEvidence(): Collect evidence from the external system
 * - mapToControls(): Map raw data to compliance control IDs
 */
export abstract class EvidenceAdapter {
  protected readonly logger: Logger;
  protected readonly config: AdapterConfig;
  protected lastHealthCheck: AdapterHealthStatus | null = null;
  protected isInitialized: boolean = false;

  constructor(config: AdapterConfig) {
    this.config = config;
    this.logger = createLogger(`adapter:${config.type}:${config.id}`);
  }

  /**
   * Get the list of control types this adapter can provide evidence for
   * These are framework:control format strings, e.g., 'ISO27001:A.8.8'
   */
  abstract get supportedControlTypes(): string[];

  /**
   * Get a human-readable name for this adapter type
   */
  abstract get adapterTypeName(): string;

  /**
   * Check connectivity and authentication with the external system
   */
  abstract healthCheck(): Promise<AdapterHealthStatus>;

  /**
   * Collect evidence from the external system
   * @param options Collection options (date range, control filter, etc.)
   */
  abstract collectEvidence(options?: CollectionOptions): Promise<CollectionResult>;

  /**
   * Map raw data from the external system to compliance control IDs
   * @param rawData Raw data from the external API
   */
  abstract mapToControls(rawData: unknown): string[];

  /**
   * Initialize the adapter (validate config, test connection, etc.)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn({ adapterId: this.config.id }, 'Adapter already initialized');
      return;
    }

    this.logger.info({
      adapterId: this.config.id,
      adapterType: this.config.type,
      baseUrl: this.config.baseUrl,
    }, 'Initializing adapter');

    // Validate configuration
    this.validateConfig();

    // Test connectivity
    const health = await this.healthCheck();
    if (!health.healthy) {
      const error = new Error(
        `Adapter ${this.config.id} failed health check: ${health.errorMessage}`
      );
      this.logger.error({
        adapterId: this.config.id,
        error: health.errorMessage,
        latencyMs: health.latencyMs,
      }, 'Adapter initialization failed');
      throw error;
    }

    this.lastHealthCheck = health;
    this.isInitialized = true;

    this.logger.info({
      adapterId: this.config.id,
      latencyMs: health.latencyMs,
      supportedControls: this.supportedControlTypes.length,
    }, 'Adapter initialized successfully');
  }

  /**
   * Validate adapter configuration
   */
  protected validateConfig(): void {
    if (!this.config.id) {
      throw new Error('Adapter ID is required');
    }
    if (!this.config.baseUrl) {
      throw new Error('Adapter base URL is required');
    }
    if (!this.config.credentials) {
      throw new Error('Adapter credentials are required');
    }
    if (!this.config.credentials.authType) {
      throw new Error('Adapter authentication type is required');
    }

    // Validate credentials based on auth type
    switch (this.config.credentials.authType) {
      case 'api_key':
        if (!this.config.credentials.apiKey) {
          throw new Error('API key is required for api_key authentication');
        }
        break;
      case 'basic':
        if (!this.config.credentials.username || !this.config.credentials.password) {
          throw new Error('Username and password are required for basic authentication');
        }
        break;
      case 'oauth2':
        if (!this.config.credentials.clientId || !this.config.credentials.clientSecret) {
          throw new Error('Client ID and secret are required for OAuth2 authentication');
        }
        break;
      case 'iam_role':
        // IAM role uses instance credentials or environment
        break;
      case 'certificate':
        if (!this.config.credentials.certificatePath) {
          throw new Error('Certificate path is required for certificate authentication');
        }
        break;
    }
  }

  /**
   * Get adapter configuration (sanitized - no secrets)
   */
  getConfig(): Omit<AdapterConfig, 'credentials'> & { credentials: { authType: AuthType } } {
    return {
      ...this.config,
      credentials: {
        authType: this.config.credentials.authType,
      },
    };
  }

  /**
   * Get last health check result
   */
  getLastHealthCheck(): AdapterHealthStatus | null {
    return this.lastHealthCheck;
  }

  /**
   * Check if adapter is initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get adapter ID
   */
  get id(): string {
    return this.config.id;
  }

  /**
   * Get adapter type
   */
  get type(): AdapterType {
    return this.config.type;
  }

  /**
   * Helper: Sleep for specified milliseconds
   */
  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Helper: Calculate exponential backoff delay
   */
  protected calculateBackoff(
    attempt: number,
    baseDelayMs: number = 1000,
    maxDelayMs: number = 30000
  ): number {
    const delay = baseDelayMs * Math.pow(2, attempt);
    const jitter = Math.random() * 1000;
    return Math.min(delay + jitter, maxDelayMs);
  }

  /**
   * Helper: Make HTTP request with retry logic
   */
  protected async fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries: number = 3
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const backoffMs = this.calculateBackoff(attempt - 1);
          this.logger.debug({
            attempt,
            maxRetries,
            backoffMs,
            url,
          }, 'Retrying request after backoff');
          await this.sleep(backoffMs);
        }

        const response = await fetch(url, options);

        // Retry on server errors
        if (response.status >= 500 && attempt < maxRetries) {
          lastError = new Error(`Server error: ${response.status}`);
          continue;
        }

        // Retry on rate limiting
        if (response.status === 429 && attempt < maxRetries) {
          const retryAfter = response.headers.get('Retry-After');
          const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : this.calculateBackoff(attempt);
          this.logger.warn({ waitMs, url }, 'Rate limited, waiting before retry');
          await this.sleep(waitMs);
          continue;
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt === maxRetries) {
          break;
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Helper: Get authorization headers based on auth type
   */
  protected getAuthHeaders(): Record<string, string> {
    const creds = this.config.credentials;

    switch (creds.authType) {
      case 'api_key':
        return {
          'Authorization': `Bearer ${creds.apiKey}`,
        };
      case 'basic':
        const basicAuth = Buffer.from(`${creds.username}:${creds.password}`).toString('base64');
        return {
          'Authorization': `Basic ${basicAuth}`,
        };
      case 'oauth2':
        if (creds.accessToken) {
          return {
            'Authorization': `Bearer ${creds.accessToken}`,
          };
        }
        throw new Error('OAuth2 access token not available');
      case 'iam_role':
        // IAM authentication is handled differently per cloud provider
        return {};
      case 'certificate':
        // Certificate auth is handled at the transport layer
        return {};
      default:
        return {};
    }
  }

  /**
   * Helper: Build URL with query parameters
   */
  protected buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, this.config.baseUrl);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  /**
   * Helper: Parse date string safely
   */
  protected parseDate(dateStr: string | null | undefined): Date | undefined {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  }

  /**
   * Helper: Format date for API requests
   */
  protected formatDate(date: Date, format: 'iso' | 'epoch' | 'ymd' = 'iso'): string {
    switch (format) {
      case 'iso':
        return date.toISOString();
      case 'epoch':
        return Math.floor(date.getTime() / 1000).toString();
      case 'ymd':
        return date.toISOString().split('T')[0]!;
      default:
        return date.toISOString();
    }
  }
}

/**
 * Type guard to check if an object is a valid CollectedEvidence
 */
export function isCollectedEvidence(obj: unknown): obj is CollectedEvidence {
  if (!obj || typeof obj !== 'object') return false;
  const evidence = obj as Partial<CollectedEvidence>;
  return (
    typeof evidence.externalId === 'string' &&
    typeof evidence.type === 'string' &&
    typeof evidence.title === 'string' &&
    typeof evidence.description === 'string' &&
    typeof evidence.source === 'string' &&
    evidence.collectedAt instanceof Date &&
    Array.isArray(evidence.controlMappings) &&
    ['valid', 'expired', 'superseded', 'pending_review'].includes(evidence.status as string)
  );
}
