/**
 * Nexus Compliance Engine - AWS Config Adapter
 * Integrates with AWS Config for cloud configuration compliance evidence
 */

import {
  EvidenceAdapter,
  type AdapterConfig,
  type CollectedEvidence,
  type CollectionOptions,
  type CollectionResult,
  type AdapterHealthStatus,
  type EvidenceSeverity,
} from './base-adapter.js';

/**
 * AWS Config rule structure
 */
interface AWSConfigRule {
  ConfigRuleName: string;
  ConfigRuleArn: string;
  ConfigRuleId: string;
  Description?: string;
  Source: {
    Owner: string;
    SourceIdentifier: string;
  };
  ConfigRuleState: 'ACTIVE' | 'DELETING' | 'DELETING_RESULTS' | 'EVALUATING';
}

/**
 * AWS Config compliance result
 */
interface AWSComplianceResult {
  ConfigRuleName: string;
  Compliance?: {
    ComplianceType: 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_APPLICABLE' | 'INSUFFICIENT_DATA';
    ComplianceContributorCount?: {
      CappedCount?: number;
      CapExceeded?: boolean;
    };
  };
}

/**
 * AWS Config evaluation result
 */
interface AWSEvaluationResult {
  EvaluationResultIdentifier: {
    EvaluationResultQualifier: {
      ConfigRuleName: string;
      ResourceType: string;
      ResourceId: string;
    };
    OrderingTimestamp: string;
  };
  ComplianceType: 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_APPLICABLE' | 'INSUFFICIENT_DATA';
  ResultRecordedTime: string;
  Annotation?: string;
}

/**
 * AWS Config Adapter
 *
 * Collects evidence from:
 * - AWS Config Rules compliance status
 * - Resource configuration compliance
 * - Security Hub findings (if integrated)
 * - IAM configuration
 * - Encryption settings
 */
export class AWSConfigAdapter extends EvidenceAdapter {
  private readonly apiVersion = '2014-11-12';

  get adapterTypeName(): string {
    return 'AWS Config';
  }

  /**
   * Control types this adapter provides evidence for
   */
  get supportedControlTypes(): string[] {
    return [
      // ISO 27001 controls
      'ISO27001:A.8.9',   // Configuration management
      'ISO27001:A.8.2',   // Privileged access rights
      'ISO27001:A.8.24',  // Use of cryptography
      'ISO27001:A.8.20',  // Network security
      'ISO27001:A.8.21',  // Security of network services

      // SOC 2 controls
      'SOC2:CC6.1',       // Logical and Physical Access
      'SOC2:CC8.1',       // Change Management

      // GDPR controls
      'GDPR:ART.32',      // Security of processing (encryption)

      // NIS2 controls
      'NIS2:NET.1',       // Network security
      'NIS2:ACC.1',       // Access control

      // AWS-specific
      'AWS:CIS.1.1',      // AWS CIS Benchmark
      'AWS:CIS.1.2',
    ];
  }

  /**
   * Health check - verify AWS Config API connectivity
   */
  async healthCheck(): Promise<AdapterHealthStatus> {
    const startTime = Date.now();

    try {
      const response = await this.makeAWSRequest(
        'DescribeConfigRules',
        { ConfigRuleNames: [] }
      );

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        return {
          healthy: false,
          lastCheckAt: new Date(),
          latencyMs,
          errorMessage: `AWS Config API returned ${response.status}: ${errorText.substring(0, 200)}`,
        };
      }

      return {
        healthy: true,
        lastCheckAt: new Date(),
        latencyMs,
        details: {
          region: this.getRegion(),
          apiVersion: this.apiVersion,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        lastCheckAt: new Date(),
        latencyMs: Date.now() - startTime,
        errorMessage: `AWS Config access failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Collect configuration compliance evidence from AWS Config
   */
  async collectEvidence(options?: CollectionOptions): Promise<CollectionResult> {
    const startedAt = new Date();
    const evidence: CollectedEvidence[] = [];
    const errors: CollectionResult['errors'] = [];

    this.logger.info({
      adapterId: this.config.id,
      region: this.getRegion(),
      options,
    }, 'Starting AWS Config evidence collection');

    try {
      // Get all Config rules
      const rules = await this.getConfigRules();
      const complianceByRule = await this.getComplianceByRule();

      // Categorize rules
      const rulesByCategory = this.categorizeRules(rules);

      // Collect encryption compliance evidence
      if (rulesByCategory.encryption.length > 0) {
        const encryptionEvidence = await this.collectEncryptionEvidence(
          rulesByCategory.encryption,
          complianceByRule
        );
        evidence.push(encryptionEvidence);
      }

      // Collect access control compliance evidence
      if (rulesByCategory.access.length > 0) {
        const accessEvidence = await this.collectAccessControlEvidence(
          rulesByCategory.access,
          complianceByRule
        );
        evidence.push(accessEvidence);
      }

      // Collect network security compliance evidence
      if (rulesByCategory.network.length > 0) {
        const networkEvidence = await this.collectNetworkSecurityEvidence(
          rulesByCategory.network,
          complianceByRule
        );
        evidence.push(networkEvidence);
      }

      // Create overall compliance summary
      evidence.push(this.createOverallComplianceEvidence(rules, complianceByRule));

      // Collect non-compliant resource details for critical rules
      const criticalNonCompliant = await this.collectCriticalNonCompliantResources(
        rules,
        complianceByRule
      );
      evidence.push(...criticalNonCompliant);

    } catch (error) {
      errors.push({
        code: 'COLLECTION_FAILED',
        message: 'AWS Config evidence collection failed',
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }

    const completedAt = new Date();

    this.logger.info({
      adapterId: this.config.id,
      evidenceCount: evidence.length,
      errorCount: errors.length,
      durationMs: completedAt.getTime() - startedAt.getTime(),
    }, 'AWS Config evidence collection completed');

    return {
      success: errors.length === 0,
      evidence,
      errors,
      metadata: {
        startedAt,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        itemsCollected: evidence.length,
        itemsFailed: errors.length,
      },
    };
  }

  /**
   * Map AWS Config rules to compliance controls
   */
  mapToControls(rules: AWSConfigRule[]): string[] {
    const controls: Set<string> = new Set();

    for (const rule of rules) {
      const ruleName = rule.ConfigRuleName.toLowerCase();
      const sourceId = (rule.Source.SourceIdentifier || '').toLowerCase();

      // Encryption rules
      if (ruleName.includes('encrypt') || ruleName.includes('kms') ||
          ruleName.includes('ssl') || ruleName.includes('tls') ||
          sourceId.includes('encrypted')) {
        controls.add('ISO27001:A.8.24');
        controls.add('GDPR:ART.32');
      }

      // IAM and access control rules
      if (ruleName.includes('iam') || ruleName.includes('access') ||
          ruleName.includes('mfa') || ruleName.includes('password') ||
          ruleName.includes('policy') || sourceId.includes('iam')) {
        controls.add('ISO27001:A.8.2');
        controls.add('SOC2:CC6.1');
        controls.add('NIS2:ACC.1');
      }

      // Network security rules
      if (ruleName.includes('vpc') || ruleName.includes('security-group') ||
          ruleName.includes('nacl') || ruleName.includes('network') ||
          ruleName.includes('sg-') || sourceId.includes('vpc')) {
        controls.add('NIS2:NET.1');
        controls.add('ISO27001:A.8.20');
        controls.add('ISO27001:A.8.21');
      }

      // Configuration management rules
      if (ruleName.includes('config') || ruleName.includes('cloudtrail') ||
          ruleName.includes('logging')) {
        controls.add('ISO27001:A.8.9');
        controls.add('SOC2:CC8.1');
      }

      // CIS Benchmark rules
      if (ruleName.includes('cis') || sourceId.includes('cis')) {
        controls.add('AWS:CIS.1.1');
      }
    }

    return Array.from(controls);
  }

  /**
   * Get all AWS Config rules
   */
  private async getConfigRules(): Promise<AWSConfigRule[]> {
    const allRules: AWSConfigRule[] = [];
    let nextToken: string | undefined;

    do {
      const response = await this.makeAWSRequest('DescribeConfigRules', {
        NextToken: nextToken,
      });

      if (!response.ok) {
        throw new Error(`Failed to get config rules: ${response.status}`);
      }

      const data = await response.json() as {
        ConfigRules?: AWSConfigRule[];
        NextToken?: string;
      };

      if (data.ConfigRules) {
        allRules.push(...data.ConfigRules);
      }

      nextToken = data.NextToken;
    } while (nextToken);

    return allRules;
  }

  /**
   * Get compliance status for all rules
   */
  private async getComplianceByRule(): Promise<Map<string, string>> {
    const complianceMap = new Map<string, string>();
    let nextToken: string | undefined;

    do {
      const response = await this.makeAWSRequest('DescribeComplianceByConfigRule', {
        NextToken: nextToken,
      });

      if (!response.ok) {
        throw new Error(`Failed to get compliance status: ${response.status}`);
      }

      const data = await response.json() as {
        ComplianceByConfigRules?: AWSComplianceResult[];
        NextToken?: string;
      };

      if (data.ComplianceByConfigRules) {
        for (const result of data.ComplianceByConfigRules) {
          if (result.Compliance?.ComplianceType) {
            complianceMap.set(result.ConfigRuleName, result.Compliance.ComplianceType);
          }
        }
      }

      nextToken = data.NextToken;
    } while (nextToken);

    return complianceMap;
  }

  /**
   * Categorize rules by type
   */
  private categorizeRules(rules: AWSConfigRule[]): Record<string, AWSConfigRule[]> {
    return {
      encryption: rules.filter(r => {
        const name = r.ConfigRuleName.toLowerCase();
        return name.includes('encrypt') || name.includes('kms') ||
               name.includes('ssl') || name.includes('tls');
      }),
      access: rules.filter(r => {
        const name = r.ConfigRuleName.toLowerCase();
        return name.includes('iam') || name.includes('access') ||
               name.includes('mfa') || name.includes('password');
      }),
      network: rules.filter(r => {
        const name = r.ConfigRuleName.toLowerCase();
        return name.includes('vpc') || name.includes('security-group') ||
               name.includes('nacl') || name.includes('network');
      }),
    };
  }

  /**
   * Collect encryption compliance evidence
   */
  private async collectEncryptionEvidence(
    rules: AWSConfigRule[],
    compliance: Map<string, string>
  ): Promise<CollectedEvidence> {
    const compliantCount = rules.filter(r => compliance.get(r.ConfigRuleName) === 'COMPLIANT').length;
    const nonCompliantCount = rules.filter(r => compliance.get(r.ConfigRuleName) === 'NON_COMPLIANT').length;

    const severity: EvidenceSeverity = nonCompliantCount > 0 ? 'high' : 'info';

    return {
      externalId: `aws-config-encryption-${Date.now()}`,
      type: 'encryption_compliance',
      title: 'AWS Encryption Configuration Compliance',
      description: `${compliantCount}/${rules.length} encryption-related AWS Config rules are compliant. ` +
        `${nonCompliantCount} rules require attention for data protection compliance.`,
      rawData: {
        rules: rules.map(r => ({
          name: r.ConfigRuleName,
          status: compliance.get(r.ConfigRuleName) || 'UNKNOWN',
          description: r.Description,
        })),
        summary: {
          compliant: compliantCount,
          nonCompliant: nonCompliantCount,
          total: rules.length,
          complianceRate: rules.length > 0 ? Math.round((compliantCount / rules.length) * 100) : 0,
        },
      },
      collectedAt: new Date(),
      source: 'aws-config',
      controlMappings: ['ISO27001:A.8.24', 'GDPR:ART.32'],
      severity,
      status: 'valid',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Collect access control compliance evidence
   */
  private async collectAccessControlEvidence(
    rules: AWSConfigRule[],
    compliance: Map<string, string>
  ): Promise<CollectedEvidence> {
    const compliantCount = rules.filter(r => compliance.get(r.ConfigRuleName) === 'COMPLIANT').length;
    const nonCompliantCount = rules.filter(r => compliance.get(r.ConfigRuleName) === 'NON_COMPLIANT').length;

    const severity: EvidenceSeverity = nonCompliantCount > 0 ? 'high' : 'info';

    return {
      externalId: `aws-config-access-${Date.now()}`,
      type: 'access_control_compliance',
      title: 'AWS IAM and Access Control Compliance',
      description: `${compliantCount}/${rules.length} access control Config rules are compliant. ` +
        `${nonCompliantCount} rules require attention for identity and access management.`,
      rawData: {
        rules: rules.map(r => ({
          name: r.ConfigRuleName,
          status: compliance.get(r.ConfigRuleName) || 'UNKNOWN',
          description: r.Description,
        })),
        summary: {
          compliant: compliantCount,
          nonCompliant: nonCompliantCount,
          total: rules.length,
          complianceRate: rules.length > 0 ? Math.round((compliantCount / rules.length) * 100) : 0,
        },
      },
      collectedAt: new Date(),
      source: 'aws-config',
      controlMappings: ['ISO27001:A.8.2', 'SOC2:CC6.1', 'NIS2:ACC.1'],
      severity,
      status: 'valid',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Collect network security compliance evidence
   */
  private async collectNetworkSecurityEvidence(
    rules: AWSConfigRule[],
    compliance: Map<string, string>
  ): Promise<CollectedEvidence> {
    const compliantCount = rules.filter(r => compliance.get(r.ConfigRuleName) === 'COMPLIANT').length;
    const nonCompliantCount = rules.filter(r => compliance.get(r.ConfigRuleName) === 'NON_COMPLIANT').length;

    const severity: EvidenceSeverity = nonCompliantCount > 0 ? 'high' : 'info';

    return {
      externalId: `aws-config-network-${Date.now()}`,
      type: 'network_security_compliance',
      title: 'AWS Network Security Configuration Compliance',
      description: `${compliantCount}/${rules.length} network security Config rules are compliant. ` +
        `${nonCompliantCount} rules require attention for network protection.`,
      rawData: {
        rules: rules.map(r => ({
          name: r.ConfigRuleName,
          status: compliance.get(r.ConfigRuleName) || 'UNKNOWN',
          description: r.Description,
        })),
        summary: {
          compliant: compliantCount,
          nonCompliant: nonCompliantCount,
          total: rules.length,
          complianceRate: rules.length > 0 ? Math.round((compliantCount / rules.length) * 100) : 0,
        },
      },
      collectedAt: new Date(),
      source: 'aws-config',
      controlMappings: ['NIS2:NET.1', 'ISO27001:A.8.20', 'ISO27001:A.8.21'],
      severity,
      status: 'valid',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Create overall compliance summary evidence
   */
  private createOverallComplianceEvidence(
    rules: AWSConfigRule[],
    compliance: Map<string, string>
  ): CollectedEvidence {
    const compliantCount = Array.from(compliance.values()).filter(v => v === 'COMPLIANT').length;
    const nonCompliantCount = Array.from(compliance.values()).filter(v => v === 'NON_COMPLIANT').length;
    const totalRules = rules.length;
    const complianceRate = totalRules > 0 ? Math.round((compliantCount / totalRules) * 100) : 0;

    const severity: EvidenceSeverity =
      complianceRate < 80 ? 'high' :
      complianceRate < 95 ? 'medium' : 'info';

    return {
      externalId: `aws-config-overall-${Date.now()}`,
      type: 'configuration_compliance_summary',
      title: 'AWS Config Overall Compliance Summary',
      description: `Overall AWS Config compliance rate: ${complianceRate}%. ` +
        `${compliantCount} compliant, ${nonCompliantCount} non-compliant out of ${totalRules} rules evaluated.`,
      rawData: {
        summary: {
          totalRules,
          compliant: compliantCount,
          nonCompliant: nonCompliantCount,
          insufficientData: Array.from(compliance.values()).filter(v => v === 'INSUFFICIENT_DATA').length,
          notApplicable: Array.from(compliance.values()).filter(v => v === 'NOT_APPLICABLE').length,
          complianceRate,
        },
        timestamp: new Date().toISOString(),
        region: this.getRegion(),
      },
      collectedAt: new Date(),
      source: 'aws-config',
      controlMappings: ['ISO27001:A.8.9', 'SOC2:CC8.1'],
      severity,
      status: 'valid',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Collect details on critical non-compliant resources
   */
  private async collectCriticalNonCompliantResources(
    rules: AWSConfigRule[],
    compliance: Map<string, string>
  ): Promise<CollectedEvidence[]> {
    const evidence: CollectedEvidence[] = [];

    // Find critical non-compliant rules (encryption, MFA, root account)
    const criticalRules = rules.filter(r => {
      const name = r.ConfigRuleName.toLowerCase();
      const isNonCompliant = compliance.get(r.ConfigRuleName) === 'NON_COMPLIANT';
      const isCritical = name.includes('root') || name.includes('mfa') ||
                         name.includes('encrypt') || name.includes('kms');
      return isNonCompliant && isCritical;
    });

    for (const rule of criticalRules.slice(0, 5)) { // Limit to 5 critical findings
      try {
        const details = await this.getNonCompliantResourceDetails(rule.ConfigRuleName);

        if (details.length > 0) {
          evidence.push({
            externalId: `aws-config-finding-${rule.ConfigRuleName}-${Date.now()}`,
            type: 'compliance_finding',
            title: `Critical Finding: ${rule.ConfigRuleName}`,
            description: `${details.length} resource(s) non-compliant with ${rule.ConfigRuleName}. ${rule.Description || ''}`,
            rawData: {
              rule: {
                name: rule.ConfigRuleName,
                description: rule.Description,
                sourceIdentifier: rule.Source.SourceIdentifier,
              },
              nonCompliantResources: details.slice(0, 10),
              totalNonCompliant: details.length,
            },
            collectedAt: new Date(),
            source: 'aws-config',
            controlMappings: this.mapToControls([rule]),
            severity: 'critical',
            status: 'valid',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            metadata: {
              ruleName: rule.ConfigRuleName,
              resourceCount: details.length,
            },
          });
        }
      } catch (error) {
        this.logger.warn({
          ruleName: rule.ConfigRuleName,
          error: error instanceof Error ? error.message : String(error),
        }, 'Failed to get non-compliant resource details');
      }
    }

    return evidence;
  }

  /**
   * Get non-compliant resource details for a rule
   */
  private async getNonCompliantResourceDetails(
    ruleName: string
  ): Promise<AWSEvaluationResult[]> {
    const response = await this.makeAWSRequest('GetComplianceDetailsByConfigRule', {
      ConfigRuleName: ruleName,
      ComplianceTypes: ['NON_COMPLIANT'],
      Limit: 100,
    });

    if (!response.ok) {
      throw new Error(`Failed to get compliance details: ${response.status}`);
    }

    const data = await response.json() as {
      EvaluationResults?: AWSEvaluationResult[];
    };

    return data.EvaluationResults || [];
  }

  /**
   * Make AWS Config API request
   */
  private async makeAWSRequest(
    action: string,
    params: Record<string, unknown>
  ): Promise<Response> {
    const region = this.getRegion();
    const endpoint = `https://config.${region}.amazonaws.com`;

    // For production, use AWS SDK or proper SigV4 signing
    // This is a simplified version for demonstration
    const headers = this.buildAWSHeaders(action);

    return this.fetchWithRetry(
      endpoint,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      }
    );
  }

  /**
   * Build AWS request headers
   */
  private buildAWSHeaders(action: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `StarlingDoveService.${action}`,
    };

    // Add authorization based on credential type
    const creds = this.config.credentials;

    if (creds.authType === 'api_key' && creds.apiKey && creds.clientSecret) {
      // For explicit credentials, we'd need SigV4 signing
      // In production, use @aws-sdk/client-config-service
      headers['Authorization'] = 'AWS4-HMAC-SHA256 ...'; // Placeholder
    }

    // For IAM role, credentials come from instance metadata
    // In production, use @aws-sdk/credential-providers

    return headers;
  }

  /**
   * Get AWS region from config
   */
  private getRegion(): string {
    // baseUrl is used to store region for AWS adapter
    return this.config.baseUrl || 'us-east-1';
  }
}
