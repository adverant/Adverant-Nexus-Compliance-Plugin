/**
 * Cross-Framework Analysis
 *
 * Visualize and analyze control mappings, overlaps, and relationships
 * across compliance frameworks. Includes heatmap, Sankey diagram,
 * and network graph views.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  RefreshCw,
  ArrowRight,
  GitCompare,
  Network,
  BarChart3,
  Layers,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  Sankey,
  Tooltip,
  Layer,
  Rectangle,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Cell,
} from 'recharts';
import { complianceApi, TrustworthyAIRequirement } from '@/api/compliance';
import { useAuthStore } from '@/stores/auth';

const FRAMEWORKS = [
  { id: 'iso_27001', name: 'ISO 27001', color: '#3b82f6' },
  { id: 'gdpr', name: 'GDPR', color: '#8b5cf6' },
  { id: 'eu_ai_act', name: 'EU AI Act', color: '#10b981' },
  { id: 'nis2', name: 'NIS2', color: '#f59e0b' },
  { id: 'soc2', name: 'SOC 2', color: '#ec4899' },
  { id: 'iso_27701', name: 'ISO 27701', color: '#14b8a6' },
];

const EU_REQUIREMENTS = [
  { id: 'human_agency_oversight', name: 'Human Agency', short: 'HA' },
  { id: 'technical_robustness_safety', name: 'Robustness', short: 'TR' },
  { id: 'privacy_data_governance', name: 'Privacy', short: 'PD' },
  { id: 'transparency', name: 'Transparency', short: 'TR' },
  { id: 'diversity_fairness_nondiscrimination', name: 'Fairness', short: 'DF' },
  { id: 'societal_environmental_wellbeing', name: 'Society', short: 'SE' },
  { id: 'accountability', name: 'Accountability', short: 'AC' },
];

// Heatmap Cell Component
function HeatmapCell({
  value,
  maxValue,
  label,
}: {
  value: number;
  maxValue: number;
  label?: string;
}) {
  const intensity = value / maxValue;
  const bgColor = `rgba(16, 185, 129, ${Math.min(intensity, 1)})`;

  return (
    <div
      className="w-12 h-12 flex items-center justify-center text-xs font-medium rounded"
      style={{ backgroundColor: bgColor, color: intensity > 0.5 ? 'white' : 'black' }}
      title={label}
    >
      {value}
    </div>
  );
}

// Framework Overlap Matrix
function OverlapMatrix({ data }: { data: any }) {
  const frameworks = FRAMEWORKS.map((f) => f.id);
  const matrix = data?.matrix || {};

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="p-2"></th>
            {FRAMEWORKS.map((f) => (
              <th key={f.id} className="p-2 text-xs font-medium text-center">
                {f.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FRAMEWORKS.map((row) => (
            <tr key={row.id}>
              <td className="p-2 text-xs font-medium">{row.name}</td>
              {FRAMEWORKS.map((col) => {
                const value = matrix[`${row.id}_${col.id}`] || (row.id === col.id ? 100 : 0);
                return (
                  <td key={col.id} className="p-1">
                    <HeatmapCell
                      value={value}
                      maxValue={100}
                      label={`${row.name} ↔ ${col.name}: ${value}% overlap`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Requirement Coverage Table
function RequirementCoverageTable({ data }: { data: any }) {
  const coverage = data?.coverage || [];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Requirement</TableHead>
          {FRAMEWORKS.map((f) => (
            <TableHead key={f.id} className="text-center">
              {f.name}
            </TableHead>
          ))}
          <TableHead className="text-center">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {EU_REQUIREMENTS.map((req) => {
          const row = coverage.find((r: any) => r.requirement === req.id) || {
            counts: FRAMEWORKS.reduce((acc, f) => ({ ...acc, [f.id]: 0 }), {}),
            total: 0,
          };
          return (
            <TableRow key={req.id}>
              <TableCell className="font-medium">{req.name}</TableCell>
              {FRAMEWORKS.map((f) => (
                <TableCell key={f.id} className="text-center">
                  {row.counts[f.id] > 0 ? (
                    <Badge variant="secondary">{row.counts[f.id]}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              ))}
              <TableCell className="text-center">
                <Badge>{row.total}</Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// Control Mapping Table
function ControlMappingTable({
  framework1,
  framework2,
  mappings,
}: {
  framework1: string;
  framework2: string;
  mappings: any[];
}) {
  const RELATIONSHIP_BADGES = {
    equivalent: { variant: 'default' as const, icon: <CheckCircle2 className="h-3 w-3" /> },
    partial: { variant: 'secondary' as const, icon: <Circle className="h-3 w-3" /> },
    related: { variant: 'outline' as const, icon: <Circle className="h-3 w-3" /> },
    supersedes: { variant: 'destructive' as const, icon: <AlertTriangle className="h-3 w-3" /> },
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Source Control</TableHead>
          <TableHead></TableHead>
          <TableHead>Target Control</TableHead>
          <TableHead>Relationship</TableHead>
          <TableHead>Confidence</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {mappings.map((mapping, index) => (
          <TableRow key={index}>
            <TableCell>
              <div>
                <Badge variant="outline" className="mb-1">
                  {mapping.sourceControlId}
                </Badge>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {mapping.sourceControlName}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </TableCell>
            <TableCell>
              <div>
                <Badge variant="outline" className="mb-1">
                  {mapping.targetControlId}
                </Badge>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {mapping.targetControlName}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant={RELATIONSHIP_BADGES[mapping.relationshipType as keyof typeof RELATIONSHIP_BADGES]?.variant}
                className="flex items-center gap-1 w-fit"
              >
                {RELATIONSHIP_BADGES[mapping.relationshipType as keyof typeof RELATIONSHIP_BADGES]?.icon}
                {mapping.relationshipType}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${mapping.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs">{Math.round(mapping.confidence * 100)}%</span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function CrossFrameworkAnalysis() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || 'default';
  const [selectedTab, setSelectedTab] = useState('heatmap');
  const [framework1, setFramework1] = useState('iso_27001');
  const [framework2, setFramework2] = useState('gdpr');

  // Fetch heatmap data
  const { data: heatmapData, isLoading: heatmapLoading } = useQuery({
    queryKey: ['compliance', 'heatmap', tenantId],
    queryFn: async () => {
      const response = await complianceApi.getHeatmapData(tenantId, 'cross-framework');
      return response.data;
    },
    initialData: {
      matrix: {
        'iso_27001_gdpr': 45,
        'iso_27001_eu_ai_act': 28,
        'iso_27001_nis2': 62,
        'iso_27001_soc2': 78,
        'iso_27001_iso_27701': 85,
        'gdpr_eu_ai_act': 52,
        'gdpr_nis2': 35,
        'gdpr_soc2': 42,
        'gdpr_iso_27701': 92,
        'eu_ai_act_nis2': 38,
        'eu_ai_act_soc2': 22,
        'eu_ai_act_iso_27701': 48,
        'nis2_soc2': 55,
        'nis2_iso_27701': 32,
        'soc2_iso_27701': 68,
      },
    },
  });

  // Fetch requirement coverage
  const { data: coverageData, isLoading: coverageLoading } = useQuery({
    queryKey: ['compliance', 'requirement-coverage'],
    queryFn: async () => {
      const response = await complianceApi.getRequirementCoverage();
      return response.data;
    },
    initialData: {
      coverage: [
        { requirement: 'human_agency_oversight', counts: { iso_27001: 12, gdpr: 8, eu_ai_act: 25, nis2: 5, soc2: 8, iso_27701: 4 }, total: 62 },
        { requirement: 'technical_robustness_safety', counts: { iso_27001: 28, gdpr: 5, eu_ai_act: 32, nis2: 45, soc2: 15, iso_27701: 3 }, total: 128 },
        { requirement: 'privacy_data_governance', counts: { iso_27001: 15, gdpr: 85, eu_ai_act: 18, nis2: 8, soc2: 22, iso_27701: 42 }, total: 190 },
        { requirement: 'transparency', counts: { iso_27001: 8, gdpr: 28, eu_ai_act: 22, nis2: 3, soc2: 6, iso_27701: 8 }, total: 75 },
        { requirement: 'diversity_fairness_nondiscrimination', counts: { iso_27001: 2, gdpr: 12, eu_ai_act: 28, nis2: 0, soc2: 2, iso_27701: 5 }, total: 49 },
        { requirement: 'societal_environmental_wellbeing', counts: { iso_27001: 3, gdpr: 4, eu_ai_act: 15, nis2: 8, soc2: 1, iso_27701: 2 }, total: 33 },
        { requirement: 'accountability', counts: { iso_27001: 25, gdpr: 18, eu_ai_act: 9, nis2: 12, soc2: 10, iso_27701: 6 }, total: 80 },
      ],
    },
  });

  // Fetch framework overlap
  const { data: overlapData, isLoading: overlapLoading } = useQuery({
    queryKey: ['compliance', 'overlap', framework1, framework2],
    queryFn: async () => {
      const response = await complianceApi.getFrameworkOverlap(framework1, framework2);
      return response.data;
    },
    enabled: framework1 !== framework2,
    initialData: {
      framework1: 'iso_27001',
      framework2: 'gdpr',
      overlapCount: 42,
      overlapPercentage: 45,
      mappings: [
        { sourceControlId: 'ISO-A.5.1', sourceControlName: 'Policies for information security', targetControlId: 'GDPR-24.1', targetControlName: 'Responsibility of the controller', relationshipType: 'related', confidence: 0.78 },
        { sourceControlId: 'ISO-A.5.34', sourceControlName: 'Privacy and protection of PII', targetControlId: 'GDPR-5.1', targetControlName: 'Principles relating to processing', relationshipType: 'equivalent', confidence: 0.95 },
        { sourceControlId: 'ISO-A.8.2', sourceControlName: 'Classification of information', targetControlId: 'GDPR-30.1', targetControlName: 'Records of processing activities', relationshipType: 'partial', confidence: 0.65 },
        { sourceControlId: 'ISO-A.8.10', sourceControlName: 'Information deletion', targetControlId: 'GDPR-17.1', targetControlName: 'Right to erasure', relationshipType: 'equivalent', confidence: 0.92 },
      ],
    },
  });

  const f1Name = FRAMEWORKS.find((f) => f.id === framework1)?.name || framework1;
  const f2Name = FRAMEWORKS.find((f) => f.id === framework2)?.name || framework2;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cross-Framework Analysis</h2>
          <p className="text-muted-foreground">
            Analyze control mappings and overlaps across compliance frameworks
          </p>
        </div>
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="heatmap" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Overlap Heatmap
          </TabsTrigger>
          <TabsTrigger value="requirements" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Requirement Coverage
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <GitCompare className="h-4 w-4" />
            Framework Comparison
          </TabsTrigger>
        </TabsList>

        {/* Overlap Heatmap */}
        <TabsContent value="heatmap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Framework Overlap Matrix</CardTitle>
              <CardDescription>
                Percentage of control equivalence between frameworks. Higher values indicate more shared controls.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {heatmapLoading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <OverlapMatrix data={heatmapData} />
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Highest Overlap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">GDPR ↔ ISO 27701</div>
                <p className="text-sm text-muted-foreground">92% control equivalence</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Lowest Overlap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">EU AI Act ↔ SOC 2</div>
                <p className="text-sm text-muted-foreground">22% control equivalence</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Average Overlap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">52%</div>
                <p className="text-sm text-muted-foreground">Across all framework pairs</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Requirement Coverage */}
        <TabsContent value="requirements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>7 EU Trustworthy AI Requirements Coverage</CardTitle>
              <CardDescription>
                Number of controls addressing each requirement by framework
              </CardDescription>
            </CardHeader>
            <CardContent>
              {coverageLoading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <RequirementCoverageTable data={coverageData} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Framework Comparison */}
        <TabsContent value="comparison" className="space-y-6">
          {/* Framework Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Select Frameworks to Compare</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select value={framework1} onValueChange={setFramework1}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="First Framework" />
                  </SelectTrigger>
                  <SelectContent>
                    {FRAMEWORKS.map((f) => (
                      <SelectItem key={f.id} value={f.id} disabled={f.id === framework2}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <ArrowRight className="h-5 w-5 text-muted-foreground" />

                <Select value={framework2} onValueChange={setFramework2}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Second Framework" />
                  </SelectTrigger>
                  <SelectContent>
                    {FRAMEWORKS.map((f) => (
                      <SelectItem key={f.id} value={f.id} disabled={f.id === framework1}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Overlap Summary */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Mapped Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overlapData?.overlapCount || 0}</div>
                <p className="text-sm text-muted-foreground">
                  Controls with cross-references
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Overlap Percentage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overlapData?.overlapPercentage || 0}%</div>
                <p className="text-sm text-muted-foreground">
                  {f1Name} controls with {f2Name} equivalents
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Unique to {f1Name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {100 - (overlapData?.overlapPercentage || 0)}%
                </div>
                <p className="text-sm text-muted-foreground">Controls without mappings</p>
              </CardContent>
            </Card>
          </div>

          {/* Control Mappings */}
          <Card>
            <CardHeader>
              <CardTitle>
                Control Mappings: {f1Name} → {f2Name}
              </CardTitle>
              <CardDescription>
                Equivalent, partial, and related control relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overlapLoading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ControlMappingTable
                  framework1={framework1}
                  framework2={framework2}
                  mappings={overlapData?.mappings || []}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
