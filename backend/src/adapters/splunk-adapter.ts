/**
 * Nexus Compliance Engine - Splunk SIEM Adapter
 * Integrates with Splunk Enterprise for security event monitoring evidence
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
 * Splunk search job response
 */
interface SplunkSearchJob {
  sid: string;
  dispatchState: string;
  doneProgress: number;
  scanCount: number;
  eventCount: number;
  resultCount: number;
  messages?: Array<{ type: string; text: string }>;
}

/**
 * Splunk search result
 */
interface SplunkSearchResult {
  results: Record<string, unknown>[];
  fields?: Array<{ name: string }>;
  preview?: boolean;
}

/**
 * Splunk security event structure
 */
interface SplunkSecurityEvent {
  _time: string;
  source: string;
  sourcetype: string;
  eventtype?: string;
  severity?: string;
  user?: string;
  src_ip?: string;
  dest_ip?: string;
  action?: string;
  message?: string;
  status?: string;
  signature?: string;
  category?: string;
  _raw?: string;
}

/**
 * Splunk index statistics
 */
interface SplunkIndexStats {
  index: string;
  eventCount: number;
  totalEventCount: number;
  earliestTime?: string;
  latestTime?: string;
  totalRawSize?: string;
}

/**
 * Splunk SIEM Adapter
 *
 * Collects evidence from:
 * - Security event logs
 * - Authentication logs
 * - Access control logs
 * - Incident alerts
 * - Compliance reports
 */
export class SplunkAdapter extends EvidenceAdapter {
  private readonly searchEndpoint = '/services/search/jobs';
  private readonly searchTimeout = 120000; // 2 minutes

  get adapterTypeName(): string {
    return 'Splunk Enterprise SIEM';
  }

  /**
   * Control types this adapter provides evidence for
   */
  get supportedControlTypes(): string[] {
    return [
      // ISO 27001 controls
      'ISO27001:A.8.15',  // Logging
      'ISO27001:A.8.16',  // Monitoring activities
      'ISO27001:A.5.24',  // Information security incident management
      'ISO27001:A.5.25',  // Assessment and decision on security events
      'ISO27001:A.5.26',  // Response to security incidents
      'ISO27001:A.8.17',  // Clock synchronization

      // SOC 2 controls
      'SOC2:CC7.2',       // System Operations - Incident Management
      'SOC2:CC6.1',       // Logical and Physical Access
      'SOC2:CC7.3',       // Change detection

      // GDPR controls
      'GDPR:ART.33',      // Breach notification (72-hour rule)
      'GDPR:ART.34',      // Communication to data subjects

      // NIS2 controls
      'NIS2:INC.1',       // Incident handling
      'NIS2:INC.2',       // Incident reporting
      'NIS2:LOG.1',       // Logging and monitoring
    ];
  }

  /**
   * Health check - verify Splunk API connectivity
   */
  async healthCheck(): Promise<AdapterHealthStatus> {
    const startTime = Date.now();

    try {
      const response = await this.fetchWithRetry(
        this.buildUrl('/services/server/info', { output_mode: 'json' }),
        {
          method: 'GET',
          headers: {
            ...this.getAuthHeaders(),
            'Accept': 'application/json',
          },
        },
        1
      );

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        return {
          healthy: false,
          lastCheckAt: new Date(),
          latencyMs,
          errorMessage: `Splunk API returned ${response.status}`,
        };
      }

      const data = await response.json() as {
        entry?: Array<{
          content?: {
            serverName?: string;
            version?: string;
            build?: string;
          };
        }>;
      };

      const serverInfo = data.entry?.[0]?.content;

      return {
        healthy: true,
        lastCheckAt: new Date(),
        latencyMs,
        details: {
          serverName: serverInfo?.serverName,
          version: serverInfo?.version,
          build: serverInfo?.build,
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
   * Collect security evidence from Splunk
   */
  async collectEvidence(options?: CollectionOptions): Promise<CollectionResult> {
    const startedAt = new Date();
    const evidence: CollectedEvidence[] = [];
    const errors: CollectionResult['errors'] = [];

    this.logger.info({
      adapterId: this.config.id,
      options,
    }, 'Starting Splunk evidence collection');

    try {
      // Collect logging infrastructure evidence
      const loggingEvidence = await this.collectLoggingEvidence();
      evidence.push(...loggingEvidence);

      // Collect security incident evidence
      const incidentEvidence = await this.collectIncidentEvidence(options?.fromDate);
      evidence.push(...incidentEvidence);

      // Collect access monitoring evidence
      const accessEvidence = await this.collectAccessMonitoringEvidence();
      evidence.push(...accessEvidence);

      // Collect authentication evidence
      const authEvidence = await this.collectAuthenticationEvidence(options?.fromDate);
      evidence.push(...authEvidence);

    } catch (error) {
      errors.push({
        code: 'COLLECTION_FAILED',
        message: 'Splunk evidence collection failed',
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
    }, 'Splunk evidence collection completed');

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
   * Map Splunk events to compliance controls
   */
  mapToControls(events: SplunkSecurityEvent[]): string[] {
    const controls: Set<string> = new Set();

    for (const event of events) {
      const eventType = (event.eventtype || '').toLowerCase();
      const sourceType = (event.sourcetype || '').toLowerCase();
      const severity = (event.severity || '').toLowerCase();
      const category = (event.category || '').toLowerCase();

      // Security incidents
      if (eventType.includes('security') || eventType.includes('incident') ||
          category.includes('incident')) {
        controls.add('ISO27001:A.5.24');
        controls.add('SOC2:CC7.2');
        controls.add('NIS2:INC.1');

        // Critical/high severity incidents may require breach notification
        if (severity === 'critical' || severity === 'high') {
          controls.add('GDPR:ART.33');
          controls.add('NIS2:INC.2');
        }
      }

      // Authentication events
      if (sourceType.includes('auth') || eventType.includes('authentication') ||
          eventType.includes('login')) {
        controls.add('ISO27001:A.8.15');
        controls.add('SOC2:CC6.1');
      }

      // Access control events
      if (sourceType.includes('access') || eventType.includes('access')) {
        controls.add('ISO27001:A.8.16');
        controls.add('SOC2:CC6.1');
      }

      // Change detection
      if (eventType.includes('change') || category.includes('change')) {
        controls.add('SOC2:CC7.3');
      }

      // All events contribute to logging controls
      controls.add('ISO27001:A.8.15');
      controls.add('NIS2:LOG.1');
    }

    return Array.from(controls);
  }

  /**
   * Collect logging infrastructure evidence
   */
  private async collectLoggingEvidence(): Promise<CollectedEvidence[]> {
    const query = `| tstats count WHERE index=* by index, sourcetype
      | stats count as event_count, dc(sourcetype) as sourcetype_count by index`;

    const results = await this.runSearch(query);

    if (results.length === 0) {
      return [];
    }

    const totalEvents = results.reduce(
      (sum, r) => sum + parseInt(String(r.event_count || 0), 10),
      0
    );
    const indexCount = results.length;

    return [{
      externalId: `splunk-logging-${Date.now()}`,
      type: 'logging_configuration',
      title: 'Splunk Logging Infrastructure Status',
      description: `Splunk logging infrastructure active with ${indexCount} indexes containing ${totalEvents.toLocaleString()} events. ` +
        `Log collection and centralization is operational.`,
      rawData: {
        indexStats: results,
        summary: {
          totalIndexes: indexCount,
          totalEvents,
        },
      },
      collectedAt: new Date(),
      source: 'splunk',
      controlMappings: ['ISO27001:A.8.15', 'SOC2:CC7.2', 'NIS2:LOG.1'],
      severity: 'info',
      status: 'valid',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    }];
  }

  /**
   * Collect security incident evidence
   */
  private async collectIncidentEvidence(fromDate?: Date): Promise<CollectedEvidence[]> {
    const timeRange = fromDate
      ? `earliest="${this.formatDate(fromDate, 'ymd')}" latest=now`
      : 'earliest=-7d@d latest=now';

    const query = `index=security sourcetype=*incident* OR sourcetype=*alert* ${timeRange}
      | stats count as incident_count by severity, eventtype
      | sort -incident_count`;

    const results = await this.runSearch(query);

    if (results.length === 0) {
      return [{
        externalId: `splunk-incidents-${Date.now()}`,
        type: 'security_incident_report',
        title: 'Security Incident Summary - Last 7 Days',
        description: 'No security incidents detected in the last 7 days.',
        rawData: { incidents: [], summary: { total: 0 } },
        collectedAt: new Date(),
        source: 'splunk',
        controlMappings: ['ISO27001:A.5.24', 'NIS2:INC.1'],
        severity: 'info',
        status: 'valid',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }];
    }

    const criticalCount = results
      .filter(r => String(r.severity).toLowerCase() === 'critical')
      .reduce((sum, r) => sum + parseInt(String(r.incident_count || 0), 10), 0);

    const highCount = results
      .filter(r => String(r.severity).toLowerCase() === 'high')
      .reduce((sum, r) => sum + parseInt(String(r.incident_count || 0), 10), 0);

    const totalIncidents = results.reduce(
      (sum, r) => sum + parseInt(String(r.incident_count || 0), 10),
      0
    );

    const severity: EvidenceSeverity =
      criticalCount > 0 ? 'critical' :
      highCount > 0 ? 'high' : 'medium';

    return [{
      externalId: `splunk-incidents-${Date.now()}`,
      type: 'security_incident_report',
      title: 'Security Incident Summary - Last 7 Days',
      description: `${totalIncidents} security incidents detected. ${criticalCount} critical, ${highCount} high severity. Review and response procedures should be verified.`,
      rawData: {
        incidentSummary: results,
        summary: {
          total: totalIncidents,
          critical: criticalCount,
          high: highCount,
        },
      },
      collectedAt: new Date(),
      source: 'splunk',
      controlMappings: this.mapToControls(results as unknown as SplunkSecurityEvent[]),
      severity,
      status: 'valid',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }];
  }

  /**
   * Collect access monitoring evidence
   */
  private async collectAccessMonitoringEvidence(): Promise<CollectedEvidence[]> {
    const query = `index=access_log OR index=security sourcetype=*access* earliest=-24h@h latest=now
      | stats count as total_events,
              dc(user) as unique_users,
              count(eval(action="failed" OR action="denied")) as failed_access
      | eval success_rate=round((total_events-failed_access)/total_events*100, 2)`;

    const results = await this.runSearch(query);

    if (results.length === 0) {
      return [];
    }

    const data = results[0]!;
    const totalEvents = parseInt(String(data.total_events || 0), 10);
    const uniqueUsers = parseInt(String(data.unique_users || 0), 10);
    const failedAccess = parseInt(String(data.failed_access || 0), 10);
    const successRate = parseFloat(String(data.success_rate || 100));

    const severity: EvidenceSeverity =
      failedAccess > 100 ? 'high' :
      failedAccess > 50 ? 'medium' :
      failedAccess > 10 ? 'low' : 'info';

    return [{
      externalId: `splunk-access-${Date.now()}`,
      type: 'access_monitoring_report',
      title: 'Access Monitoring Summary - Last 24 Hours',
      description: `Access monitoring active. ${totalEvents.toLocaleString()} events from ${uniqueUsers} users. ` +
        `${failedAccess} failed access attempts. Success rate: ${successRate}%.`,
      rawData: {
        accessStats: data,
        summary: {
          totalEvents,
          uniqueUsers,
          failedAccess,
          successRate,
        },
      },
      collectedAt: new Date(),
      source: 'splunk',
      controlMappings: ['ISO27001:A.8.16', 'SOC2:CC6.1'],
      severity,
      status: 'valid',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }];
  }

  /**
   * Collect authentication evidence
   */
  private async collectAuthenticationEvidence(fromDate?: Date): Promise<CollectedEvidence[]> {
    const timeRange = fromDate
      ? `earliest="${this.formatDate(fromDate, 'ymd')}" latest=now`
      : 'earliest=-24h@h latest=now';

    const query = `index=* sourcetype=*auth* OR eventtype=authentication ${timeRange}
      | stats count as total_auth,
              count(eval(action="success" OR status="success")) as successful,
              count(eval(action="failure" OR status="failed")) as failed,
              dc(user) as unique_users,
              dc(src_ip) as unique_sources
      | eval failure_rate=round(failed/total_auth*100, 2)`;

    const results = await this.runSearch(query);

    if (results.length === 0) {
      return [];
    }

    const data = results[0]!;
    const totalAuth = parseInt(String(data.total_auth || 0), 10);
    const successful = parseInt(String(data.successful || 0), 10);
    const failed = parseInt(String(data.failed || 0), 10);
    const uniqueUsers = parseInt(String(data.unique_users || 0), 10);
    const uniqueSources = parseInt(String(data.unique_sources || 0), 10);
    const failureRate = parseFloat(String(data.failure_rate || 0));

    // High failure rate could indicate brute force attempts
    const severity: EvidenceSeverity =
      failureRate > 20 ? 'high' :
      failureRate > 10 ? 'medium' :
      failureRate > 5 ? 'low' : 'info';

    return [{
      externalId: `splunk-auth-${Date.now()}`,
      type: 'authentication_report',
      title: 'Authentication Activity Summary - Last 24 Hours',
      description: `${totalAuth.toLocaleString()} authentication events. ${successful.toLocaleString()} successful, ` +
        `${failed} failed (${failureRate}% failure rate). ${uniqueUsers} unique users from ${uniqueSources} sources.`,
      rawData: {
        authStats: data,
        summary: {
          totalAuth,
          successful,
          failed,
          uniqueUsers,
          uniqueSources,
          failureRate,
        },
      },
      collectedAt: new Date(),
      source: 'splunk',
      controlMappings: ['ISO27001:A.8.15', 'SOC2:CC6.1', 'NIS2:LOG.1'],
      severity,
      status: 'valid',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }];
  }

  /**
   * Run a Splunk search and wait for results
   */
  private async runSearch(query: string): Promise<Record<string, unknown>[]> {
    // Create search job
    const createResponse = await this.fetchWithRetry(
      this.buildUrl(this.searchEndpoint),
      {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          search: `search ${query}`,
          output_mode: 'json',
          exec_mode: 'blocking', // Wait for completion
        }),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Splunk search failed: ${createResponse.status} - ${errorText.substring(0, 200)}`);
    }

    const jobData = await createResponse.json() as { sid?: string };
    const sid = jobData.sid;

    if (!sid) {
      // For blocking mode, results may be directly in response
      const directResults = jobData as unknown as SplunkSearchResult;
      return directResults.results || [];
    }

    // Fetch results
    const resultsResponse = await this.fetchWithRetry(
      this.buildUrl(`${this.searchEndpoint}/${sid}/results`, { output_mode: 'json' }),
      {
        method: 'GET',
        headers: {
          ...this.getAuthHeaders(),
          'Accept': 'application/json',
        },
      }
    );

    if (!resultsResponse.ok) {
      throw new Error(`Failed to fetch search results: ${resultsResponse.status}`);
    }

    const resultsData = await resultsResponse.json() as SplunkSearchResult;
    return resultsData.results || [];
  }
}
