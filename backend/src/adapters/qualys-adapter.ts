/**
 * Nexus Compliance Engine - Qualys Vulnerability Scanner Adapter
 * Integrates with Qualys Cloud Platform for vulnerability assessment evidence
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
 * Qualys vulnerability data structure
 */
interface QualysVulnerability {
  qid: number;
  title: string;
  severity: number;  // 1-5 scale
  cvss_base?: number;
  cvss_temporal?: number;
  cvss3_base?: number;
  cvss3_temporal?: number;
  cve_list: string[];
  vendor_reference?: string;
  first_detected: string;
  last_detected: string;
  status: string;
  solution?: string;
  affected_hosts: number;
  pci_flag?: boolean;
  category?: string;
  port?: number;
  protocol?: string;
  ssl?: boolean;
}

/**
 * Qualys scan result structure
 */
interface QualysScanResult {
  scan_id: string;
  scan_ref: string;
  scan_title: string;
  scan_date: string;
  launch_date: string;
  status: string;
  target_count: number;
  processed_count: number;
  duration: number;
  type: string;
  vulnerabilities: QualysVulnerability[];
}

/**
 * Qualys API host response
 */
interface QualysHostAsset {
  id: number;
  ip: string;
  hostname?: string;
  os?: string;
  last_vuln_scan_date?: string;
  tracking_method?: string;
  dns?: string;
  netbios?: string;
}

/**
 * Qualys Vulnerability Scanner Adapter
 *
 * Supports:
 * - Vulnerability scan results
 * - Asset inventory
 * - PCI compliance status
 * - CVSS scoring data
 */
export class QualysAdapter extends EvidenceAdapter {
  private readonly apiVersion = 'v2';

  get adapterTypeName(): string {
    return 'Qualys Vulnerability Scanner';
  }

  /**
   * Control types this adapter provides evidence for
   */
  get supportedControlTypes(): string[] {
    return [
      // ISO 27001 controls
      'ISO27001:A.8.8',   // Management of technical vulnerabilities
      'ISO27001:A.8.7',   // Protection against malware
      'ISO27001:A.8.9',   // Configuration management
      'ISO27001:A.8.32',  // Change management

      // SOC 2 controls
      'SOC2:CC7.1',       // System Operations - Vulnerability Management
      'SOC2:CC6.1',       // Logical and Physical Access

      // NIS2 controls
      'NIS2:VULN.1',      // Vulnerability handling
      'NIS2:VULN.2',      // Vulnerability disclosure
      'NIS2:SEC.2',       // Security testing

      // GDPR (technical measures)
      'GDPR:ART.32',      // Security of processing

      // PCI DSS
      'PCI-DSS:11.2',     // Vulnerability scanning
      'PCI-DSS:6.1',      // Security vulnerabilities patching
    ];
  }

  /**
   * Health check - verify Qualys API connectivity
   */
  async healthCheck(): Promise<AdapterHealthStatus> {
    const startTime = Date.now();

    try {
      const response = await this.fetchWithRetry(
        this.buildUrl('/api/2.0/fo/appliance/', { action: 'list' }),
        {
          method: 'GET',
          headers: {
            ...this.getAuthHeaders(),
            'X-Requested-With': 'Nexus Compliance Engine',
          },
        },
        1  // Only one retry for health check
      );

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        return {
          healthy: false,
          lastCheckAt: new Date(),
          latencyMs,
          errorMessage: `Qualys API returned ${response.status}: ${errorText.substring(0, 200)}`,
        };
      }

      // Parse and verify response
      const text = await response.text();
      const isXml = text.startsWith('<?xml') || text.startsWith('<');

      return {
        healthy: true,
        lastCheckAt: new Date(),
        latencyMs,
        details: {
          apiVersion: this.apiVersion,
          responseFormat: isXml ? 'xml' : 'json',
          platform: 'Qualys Cloud Platform',
        },
      };
    } catch (error) {
      return {
        healthy: false,
        lastCheckAt: new Date(),
        latencyMs: Date.now() - startTime,
        errorMessage: `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Collect vulnerability evidence from Qualys
   */
  async collectEvidence(options?: CollectionOptions): Promise<CollectionResult> {
    const startedAt = new Date();
    const evidence: CollectedEvidence[] = [];
    const errors: CollectionResult['errors'] = [];

    this.logger.info({
      adapterId: this.config.id,
      options,
    }, 'Starting Qualys evidence collection');

    try {
      // Collect vulnerability scan results
      const scans = await this.fetchRecentScans(options?.fromDate);

      for (const scan of scans) {
        try {
          const vulnerabilities = await this.fetchScanVulnerabilities(scan.scan_ref);

          // Group vulnerabilities by severity for analysis
          const criticalVulns = vulnerabilities.filter(v => v.severity >= 5);
          const highVulns = vulnerabilities.filter(v => v.severity === 4);
          const mediumVulns = vulnerabilities.filter(v => v.severity === 3);
          const lowVulns = vulnerabilities.filter(v => v.severity <= 2);

          // Create comprehensive evidence record for the scan
          const scanEvidence = this.createScanEvidence(scan, vulnerabilities, {
            critical: criticalVulns,
            high: highVulns,
            medium: mediumVulns,
            low: lowVulns,
          });

          evidence.push(scanEvidence);

          // Create individual evidence for critical vulnerabilities
          for (const vuln of criticalVulns.slice(0, 20)) {
            evidence.push(this.createVulnerabilityEvidence(scan, vuln));
          }

          this.logger.debug({
            scanId: scan.scan_id,
            vulnerabilitiesFound: vulnerabilities.length,
            criticalCount: criticalVulns.length,
          }, 'Processed scan results');

        } catch (scanError) {
          errors.push({
            code: 'SCAN_FETCH_FAILED',
            message: `Failed to fetch vulnerabilities for scan ${scan.scan_id}`,
            details: {
              scanId: scan.scan_id,
              error: scanError instanceof Error ? scanError.message : String(scanError),
            },
          });
        }
      }

      // Collect PCI compliance status if applicable
      try {
        const pciEvidence = await this.collectPciComplianceEvidence();
        if (pciEvidence) {
          evidence.push(pciEvidence);
        }
      } catch (pciError) {
        this.logger.warn({
          error: pciError instanceof Error ? pciError.message : String(pciError),
        }, 'PCI compliance evidence collection failed');
      }

    } catch (error) {
      errors.push({
        code: 'COLLECTION_FAILED',
        message: 'Qualys evidence collection failed',
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
    }, 'Qualys evidence collection completed');

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
   * Map vulnerability data to compliance controls
   */
  mapToControls(vulnerabilities: QualysVulnerability[]): string[] {
    const controls: Set<string> = new Set();

    // Always map to vulnerability management controls
    controls.add('ISO27001:A.8.8');
    controls.add('SOC2:CC7.1');
    controls.add('NIS2:VULN.1');

    for (const vuln of vulnerabilities) {
      const title = vuln.title.toLowerCase();
      const category = (vuln.category || '').toLowerCase();

      // Malware-related vulnerabilities
      if (title.includes('malware') || title.includes('virus') ||
          title.includes('trojan') || category.includes('malware')) {
        controls.add('ISO27001:A.8.7');
      }

      // CVE vulnerabilities (public disclosure)
      if (vuln.cve_list && vuln.cve_list.length > 0) {
        controls.add('NIS2:VULN.2');
      }

      // Configuration issues
      if (title.includes('misconfigur') || title.includes('default') ||
          category.includes('config')) {
        controls.add('ISO27001:A.8.9');
      }

      // PCI-related
      if (vuln.pci_flag) {
        controls.add('PCI-DSS:11.2');
        controls.add('PCI-DSS:6.1');
      }

      // SSL/TLS vulnerabilities (encryption controls)
      if (vuln.ssl || title.includes('ssl') || title.includes('tls') ||
          title.includes('certificate')) {
        controls.add('GDPR:ART.32');
      }
    }

    return Array.from(controls);
  }

  /**
   * Fetch recent vulnerability scans
   */
  private async fetchRecentScans(fromDate?: Date): Promise<QualysScanResult[]> {
    const launchedAfter = fromDate || this.getDateNDaysAgo(7);

    const response = await this.fetchWithRetry(
      this.buildUrl('/api/2.0/fo/scan/', {
        action: 'list',
        launched_after_datetime: this.formatDate(launchedAfter, 'ymd'),
        status: 'Finished',
      }),
      {
        method: 'GET',
        headers: {
          ...this.getAuthHeaders(),
          'X-Requested-With': 'Nexus Compliance Engine',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch scans: ${response.status}`);
    }

    const data = await this.parseQualysResponse<{ SCAN_LIST: { SCAN: QualysScanResult[] } }>(response);
    return data?.SCAN_LIST?.SCAN || [];
  }

  /**
   * Fetch vulnerabilities for a specific scan
   */
  private async fetchScanVulnerabilities(scanRef: string): Promise<QualysVulnerability[]> {
    const response = await this.fetchWithRetry(
      this.buildUrl('/api/2.0/fo/scan/', {
        action: 'fetch',
        scan_ref: scanRef,
        output_format: 'json',
      }),
      {
        method: 'GET',
        headers: {
          ...this.getAuthHeaders(),
          'X-Requested-With': 'Nexus Compliance Engine',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch scan results: ${response.status}`);
    }

    const data = await this.parseQualysResponse<{ VULN_LIST: { VULN: QualysVulnerability[] } }>(response);
    return data?.VULN_LIST?.VULN || [];
  }

  /**
   * Collect PCI compliance evidence
   */
  private async collectPciComplianceEvidence(): Promise<CollectedEvidence | null> {
    try {
      const response = await this.fetchWithRetry(
        this.buildUrl('/api/2.0/fo/compliance/pci/', {
          action: 'list',
        }),
        {
          method: 'GET',
          headers: {
            ...this.getAuthHeaders(),
            'X-Requested-With': 'Nexus Compliance Engine',
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await this.parseQualysResponse<{
        PCI_STATUS: {
          pass: boolean;
          last_scan_date: string;
          failing_requirements: string[];
        };
      }>(response);

      if (!data?.PCI_STATUS) {
        return null;
      }

      return {
        externalId: `qualys-pci-${Date.now()}`,
        type: 'compliance_scan',
        title: 'Qualys PCI Compliance Status',
        description: data.PCI_STATUS.pass
          ? 'PCI DSS compliance requirements met based on Qualys scan.'
          : `PCI DSS compliance requirements not met. ${data.PCI_STATUS.failing_requirements?.length || 0} failing requirements.`,
        rawData: data.PCI_STATUS as unknown as Record<string, unknown>,
        collectedAt: new Date(),
        source: 'qualys',
        controlMappings: ['PCI-DSS:11.2', 'PCI-DSS:6.1'],
        severity: data.PCI_STATUS.pass ? 'info' : 'critical',
        status: 'valid',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };
    } catch {
      return null;
    }
  }

  /**
   * Create evidence record for a vulnerability scan
   */
  private createScanEvidence(
    scan: QualysScanResult,
    vulnerabilities: QualysVulnerability[],
    grouped: {
      critical: QualysVulnerability[];
      high: QualysVulnerability[];
      medium: QualysVulnerability[];
      low: QualysVulnerability[];
    }
  ): CollectedEvidence {
    const severity = this.determineScanSeverity(grouped);

    return {
      externalId: scan.scan_id,
      type: 'vulnerability_scan',
      title: `Vulnerability Scan: ${scan.scan_title}`,
      description: this.formatScanDescription(scan, vulnerabilities, grouped),
      rawData: {
        scan: {
          id: scan.scan_id,
          ref: scan.scan_ref,
          title: scan.scan_title,
          date: scan.scan_date,
          targetCount: scan.target_count,
          status: scan.status,
        },
        summary: {
          total: vulnerabilities.length,
          critical: grouped.critical.length,
          high: grouped.high.length,
          medium: grouped.medium.length,
          low: grouped.low.length,
        },
        topVulnerabilities: grouped.critical.slice(0, 10).map(v => ({
          qid: v.qid,
          title: v.title,
          severity: v.severity,
          cvss: v.cvss3_base || v.cvss_base,
          cves: v.cve_list,
        })),
      },
      collectedAt: new Date(),
      source: 'qualys',
      controlMappings: this.mapToControls(vulnerabilities),
      severity,
      status: 'valid',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };
  }

  /**
   * Create evidence record for a single critical vulnerability
   */
  private createVulnerabilityEvidence(
    scan: QualysScanResult,
    vuln: QualysVulnerability
  ): CollectedEvidence {
    return {
      externalId: `qualys-vuln-${scan.scan_id}-${vuln.qid}`,
      type: 'vulnerability_finding',
      title: `Critical Vulnerability: ${vuln.title}`,
      description: this.formatVulnerabilityDescription(vuln),
      rawData: vuln as unknown as Record<string, unknown>,
      collectedAt: new Date(),
      source: 'qualys',
      controlMappings: this.mapToControls([vuln]),
      severity: this.mapQualysSeverity(vuln.severity),
      status: 'valid',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours for critical vulns
      metadata: {
        qid: vuln.qid,
        cvss: vuln.cvss3_base || vuln.cvss_base,
        cves: vuln.cve_list,
        affectedHosts: vuln.affected_hosts,
        scanId: scan.scan_id,
      },
    };
  }

  /**
   * Determine overall scan severity based on findings
   */
  private determineScanSeverity(grouped: {
    critical: QualysVulnerability[];
    high: QualysVulnerability[];
    medium: QualysVulnerability[];
    low: QualysVulnerability[];
  }): EvidenceSeverity {
    if (grouped.critical.length > 0) return 'critical';
    if (grouped.high.length > 0) return 'high';
    if (grouped.medium.length > 0) return 'medium';
    if (grouped.low.length > 0) return 'low';
    return 'info';
  }

  /**
   * Map Qualys severity (1-5) to our severity levels
   */
  private mapQualysSeverity(severity: number): EvidenceSeverity {
    if (severity >= 5) return 'critical';
    if (severity === 4) return 'high';
    if (severity === 3) return 'medium';
    if (severity === 2) return 'low';
    return 'info';
  }

  /**
   * Format scan description for evidence
   */
  private formatScanDescription(
    scan: QualysScanResult,
    vulnerabilities: QualysVulnerability[],
    grouped: {
      critical: QualysVulnerability[];
      high: QualysVulnerability[];
      medium: QualysVulnerability[];
      low: QualysVulnerability[];
    }
  ): string {
    return `Qualys vulnerability scan "${scan.scan_title}" completed on ${scan.scan_date}. ` +
      `Scanned ${scan.target_count} targets. Found ${vulnerabilities.length} total vulnerabilities: ` +
      `${grouped.critical.length} critical, ${grouped.high.length} high, ` +
      `${grouped.medium.length} medium, ${grouped.low.length} low severity.`;
  }

  /**
   * Format vulnerability description for evidence
   */
  private formatVulnerabilityDescription(vuln: QualysVulnerability): string {
    const parts = [
      `QID ${vuln.qid}: ${vuln.title}`,
      `Severity: ${vuln.severity}/5`,
    ];

    if (vuln.cvss3_base) {
      parts.push(`CVSS v3.0: ${vuln.cvss3_base}`);
    } else if (vuln.cvss_base) {
      parts.push(`CVSS v2.0: ${vuln.cvss_base}`);
    }

    if (vuln.cve_list && vuln.cve_list.length > 0) {
      parts.push(`CVE(s): ${vuln.cve_list.slice(0, 5).join(', ')}`);
    }

    if (vuln.affected_hosts) {
      parts.push(`Affected hosts: ${vuln.affected_hosts}`);
    }

    if (vuln.solution) {
      parts.push(`Solution: ${vuln.solution.substring(0, 200)}`);
    }

    return parts.join('. ');
  }

  /**
   * Get date N days ago
   */
  private getDateNDaysAgo(n: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - n);
    return date;
  }

  /**
   * Parse Qualys API response (handles both XML and JSON)
   */
  private async parseQualysResponse<T>(response: Response): Promise<T | null> {
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    if (contentType.includes('application/json') || text.startsWith('{')) {
      try {
        return JSON.parse(text) as T;
      } catch {
        this.logger.warn('Failed to parse JSON response from Qualys');
        return null;
      }
    }

    // Qualys often returns XML - for now, log a warning
    // A full implementation would parse XML here
    if (text.startsWith('<?xml') || text.startsWith('<')) {
      this.logger.debug('Received XML response from Qualys - XML parsing not yet implemented');
      // TODO: Implement XML parsing for Qualys responses
      return null;
    }

    return null;
  }
}
