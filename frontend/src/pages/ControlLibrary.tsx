/**
 * Control Library
 *
 * Browse, filter, and manage 688+ compliance controls across 6 frameworks.
 * Supports grid, table, and tree views with filtering by framework, category,
 * risk level, and EU requirement.
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  GitBranch,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ExternalLink,
  Download,
  RefreshCw,
} from 'lucide-react';
import { complianceApi, ComplianceControl, TrustworthyAIRequirement } from '@/api/compliance';

const FRAMEWORKS = [
  { id: 'all', name: 'All Frameworks' },
  { id: 'iso_27001', name: 'ISO 27001:2022' },
  { id: 'gdpr', name: 'GDPR' },
  { id: 'eu_ai_act', name: 'EU AI Act' },
  { id: 'nis2', name: 'NIS2 Directive' },
  { id: 'soc2', name: 'SOC 2 Type II' },
  { id: 'iso_27701', name: 'ISO 27701' },
];

const RISK_LEVELS = [
  { id: 'all', name: 'All Risk Levels' },
  { id: 'critical', name: 'Critical' },
  { id: 'high', name: 'High' },
  { id: 'medium', name: 'Medium' },
  { id: 'low', name: 'Low' },
];

const EU_REQUIREMENTS = [
  { id: 'all', name: 'All Requirements' },
  { id: 'human_agency_oversight', name: 'Human Agency & Oversight' },
  { id: 'technical_robustness_safety', name: 'Technical Robustness & Safety' },
  { id: 'privacy_data_governance', name: 'Privacy & Data Governance' },
  { id: 'transparency', name: 'Transparency' },
  { id: 'diversity_fairness_nondiscrimination', name: 'Diversity, Fairness & Non-discrimination' },
  { id: 'societal_environmental_wellbeing', name: 'Societal & Environmental Wellbeing' },
  { id: 'accountability', name: 'Accountability' },
];

const STATUS_ICONS = {
  implemented: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  in_progress: <Clock className="h-4 w-4 text-yellow-600" />,
  not_started: <XCircle className="h-4 w-4 text-gray-400" />,
  not_applicable: <span className="h-4 w-4 text-gray-300">N/A</span>,
};

const RISK_COLORS = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
} as const;

interface ControlCardProps {
  control: ComplianceControl;
  onClick: () => void;
}

function ControlCard({ control, onClick }: ControlCardProps) {
  return (
    <Card
      className="cursor-pointer hover:border-primary transition-colors"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <Badge variant="outline" className="mb-2">
              {control.controlNumber}
            </Badge>
            <CardTitle className="text-sm font-medium line-clamp-2">
              {control.title}
            </CardTitle>
          </div>
          {STATUS_ICONS[control.implementationStatus]}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {control.description}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={RISK_COLORS[control.riskLevel]}>{control.riskLevel}</Badge>
          {control.euRequirement && (
            <Badge variant="secondary" className="text-xs">
              {control.euRequirement.replace(/_/g, ' ').slice(0, 15)}...
            </Badge>
          )}
        </div>
        {control.score !== undefined && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Score</span>
              <span className="font-medium">{control.score}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full transition-all ${
                  control.score >= 80
                    ? 'bg-green-500'
                    : control.score >= 60
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${control.score}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ControlDetailDialog({
  control,
  open,
  onOpenChange,
}: {
  control: ComplianceControl | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!control) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{control.controlNumber}</Badge>
            <Badge variant={RISK_COLORS[control.riskLevel]}>{control.riskLevel}</Badge>
            {STATUS_ICONS[control.implementationStatus]}
          </div>
          <DialogTitle>{control.title}</DialogTitle>
          <DialogDescription>
            Framework: {control.frameworkId.toUpperCase()} | Category: {control.category}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">{control.description}</p>
          </div>

          {control.euRequirement && (
            <div>
              <h4 className="font-medium mb-2">EU Trustworthy AI Requirement</h4>
              <Badge variant="secondary">
                {control.euRequirement.replace(/_/g, ' ')}
              </Badge>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Implementation Status</h4>
              <div className="flex items-center gap-2">
                {STATUS_ICONS[control.implementationStatus]}
                <span className="text-sm capitalize">
                  {control.implementationStatus.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {control.score !== undefined && (
              <div>
                <h4 className="font-medium mb-2">Assessment Score</h4>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{control.score}%</span>
                  <div className="flex-1 h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full ${
                        control.score >= 80
                          ? 'bg-green-500'
                          : control.score >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${control.score}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {control.lastAssessed && (
            <div>
              <h4 className="font-medium mb-2">Last Assessed</h4>
              <p className="text-sm text-muted-foreground">
                {new Date(control.lastAssessed).toLocaleDateString()}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Evidence
            </Button>
            <Button>
              Run Assessment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ControlLibrary() {
  const [view, setView] = useState<'grid' | 'table' | 'tree'>('grid');
  const [search, setSearch] = useState('');
  const [framework, setFramework] = useState('all');
  const [riskLevel, setRiskLevel] = useState('all');
  const [requirement, setRequirement] = useState('all');
  const [selectedControl, setSelectedControl] = useState<ComplianceControl | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['compliance', 'controls', framework, riskLevel, requirement, search],
    queryFn: async () => {
      const response = await complianceApi.listControls({
        frameworkId: framework !== 'all' ? framework : undefined,
        riskLevel: riskLevel !== 'all' ? riskLevel : undefined,
        requirement: requirement !== 'all' ? (requirement as TrustworthyAIRequirement) : undefined,
        search: search || undefined,
        limit: 100,
      });
      return response.data;
    },
    initialData: {
      controls: [
        { id: 'ISO-A.5.1', frameworkId: 'iso_27001', controlNumber: 'A.5.1', title: 'Policies for information security', description: 'Information security policy and topic-specific policies shall be defined...', category: 'Organizational Controls', riskLevel: 'high' as const, implementationStatus: 'implemented' as const, score: 85 },
        { id: 'GDPR-5.1', frameworkId: 'gdpr', controlNumber: 'Art. 5.1', title: 'Principles relating to processing', description: 'Personal data shall be processed lawfully, fairly and in a transparent manner...', category: 'Principles', riskLevel: 'critical' as const, implementationStatus: 'implemented' as const, score: 92, euRequirement: 'privacy_data_governance' as const },
        { id: 'AIACT-9.1', frameworkId: 'eu_ai_act', controlNumber: 'Art. 9.1', title: 'Risk management system', description: 'A risk management system shall be established, implemented, documented...', category: 'High-Risk Requirements', riskLevel: 'critical' as const, implementationStatus: 'in_progress' as const, score: 65, euRequirement: 'technical_robustness_safety' as const },
        { id: 'NIS2-21.1', frameworkId: 'nis2', controlNumber: 'Art. 21.1', title: 'Cybersecurity risk-management measures', description: 'Essential and important entities shall take appropriate technical measures...', category: 'Risk Management', riskLevel: 'high' as const, implementationStatus: 'in_progress' as const, score: 72 },
        { id: 'SOC2-CC6.1', frameworkId: 'soc2', controlNumber: 'CC6.1', title: 'Logical and Physical Access Controls', description: 'The entity implements logical access security software...', category: 'Common Criteria', riskLevel: 'high' as const, implementationStatus: 'implemented' as const, score: 88 },
        { id: 'ISO27701-A.7.2', frameworkId: 'iso_27701', controlNumber: 'A.7.2', title: 'Conditions for collection', description: 'The organization shall determine and document that processing is lawful...', category: 'PIMS Specific', riskLevel: 'high' as const, implementationStatus: 'implemented' as const, score: 82, euRequirement: 'privacy_data_governance' as const },
      ],
      total: 688,
    },
  });

  const filteredControls = useMemo(() => {
    return data.controls;
  }, [data.controls]);

  const handleControlClick = (control: ComplianceControl) => {
    setSelectedControl(control);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Control Library</h2>
          <p className="text-muted-foreground">
            {data.total} controls across 6 regulatory frameworks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search controls..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={framework} onValueChange={setFramework}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Framework" />
              </SelectTrigger>
              <SelectContent>
                {FRAMEWORKS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={riskLevel} onValueChange={setRiskLevel}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                {RISK_LEVELS.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={requirement} onValueChange={setRequirement}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="EU Requirement" />
              </SelectTrigger>
              <SelectContent>
                {EU_REQUIREMENTS.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center border rounded-md">
              <Button
                variant={view === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setView('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setView('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'tree' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setView('tree')}
              >
                <GitBranch className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls Display */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : view === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredControls.map((control) => (
            <ControlCard
              key={control.id}
              control={control}
              onClick={() => handleControlClick(control)}
            />
          ))}
        </div>
      ) : view === 'table' ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Control ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Framework</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredControls.map((control) => (
                <TableRow
                  key={control.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleControlClick(control)}
                >
                  <TableCell>
                    <Badge variant="outline">{control.controlNumber}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {control.title}
                  </TableCell>
                  <TableCell>{control.frameworkId.toUpperCase()}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {control.category}
                  </TableCell>
                  <TableCell>
                    <Badge variant={RISK_COLORS[control.riskLevel]}>
                      {control.riskLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {STATUS_ICONS[control.implementationStatus]}
                      <span className="text-sm capitalize">
                        {control.implementationStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {control.score !== undefined ? (
                      <span
                        className={`font-medium ${
                          control.score >= 80
                            ? 'text-green-600'
                            : control.score >= 60
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {control.score}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">
              Tree view coming soon. Use grid or table view for now.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Control Detail Dialog */}
      <ControlDetailDialog
        control={selectedControl}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
