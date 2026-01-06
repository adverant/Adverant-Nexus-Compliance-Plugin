/**
 * Trustworthiness Assessment
 *
 * Qualitative assessment dashboard for AI systems based on
 * Z-Inspection methodology and 7 EU Trustworthy AI Requirements.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  Users,
  FileText,
  GitBranch,
  Brain,
  Eye,
  Lock,
  Scale,
  Globe,
  UserCheck,
  RefreshCw,
  Plus,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from 'recharts';
import { complianceApi, TrustworthyAIRequirement } from '@/api/compliance';
import { useAuthStore } from '@/stores/auth';
import { Link } from 'react-router-dom';

const REQUIREMENT_CONFIG: Record<
  TrustworthyAIRequirement,
  { label: string; icon: React.ReactNode; color: string }
> = {
  human_agency_oversight: {
    label: 'Human Agency & Oversight',
    icon: <UserCheck className="h-5 w-5" />,
    color: '#3b82f6',
  },
  technical_robustness_safety: {
    label: 'Technical Robustness & Safety',
    icon: <ShieldCheck className="h-5 w-5" />,
    color: '#10b981',
  },
  privacy_data_governance: {
    label: 'Privacy & Data Governance',
    icon: <Lock className="h-5 w-5" />,
    color: '#8b5cf6',
  },
  transparency: {
    label: 'Transparency',
    icon: <Eye className="h-5 w-5" />,
    color: '#f59e0b',
  },
  diversity_fairness_nondiscrimination: {
    label: 'Diversity, Fairness & Non-discrimination',
    icon: <Scale className="h-5 w-5" />,
    color: '#ec4899',
  },
  societal_environmental_wellbeing: {
    label: 'Societal & Environmental Wellbeing',
    icon: <Globe className="h-5 w-5" />,
    color: '#14b8a6',
  },
  accountability: {
    label: 'Accountability',
    icon: <UserCheck className="h-5 w-5" />,
    color: '#6366f1',
  },
};

const RATING_BADGES = {
  trustworthy: { variant: 'default' as const, icon: <ShieldCheck className="h-4 w-4" /> },
  conditionally_trustworthy: { variant: 'secondary' as const, icon: <ShieldAlert className="h-4 w-4" /> },
  not_trustworthy: { variant: 'destructive' as const, icon: <ShieldX className="h-4 w-4" /> },
  inconclusive: { variant: 'outline' as const, icon: <Clock className="h-4 w-4" /> },
};

const TENSION_SEVERITY_COLORS = {
  critical: '#ef4444',
  significant: '#f97316',
  moderate: '#eab308',
  minor: '#22c55e',
};

function RequirementScoreCard({
  requirement,
  score,
  findings,
  tensions,
  rating,
}: {
  requirement: TrustworthyAIRequirement;
  score: number;
  findings: number;
  tensions: number;
  rating: string;
}) {
  const config = REQUIREMENT_CONFIG[requirement];

  return (
    <Card className="hover:border-primary transition-colors cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${config.color}20` }}>
            <div style={{ color: config.color }}>{config.icon}</div>
          </div>
          <Badge
            variant={
              score >= 80 ? 'default' : score >= 60 ? 'secondary' : 'destructive'
            }
          >
            {score}%
          </Badge>
        </div>
        <CardTitle className="text-sm font-medium mt-2">{config.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Progress value={score} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{findings} findings</span>
            {tensions > 0 && (
              <span className="text-orange-600">{tensions} tensions</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TensionCard({
  tension,
}: {
  tension: {
    id: string;
    valueA: string;
    valueB: string;
    description: string;
    severity: 'critical' | 'significant' | 'moderate' | 'minor';
    status: string;
    affectedRequirement: TrustworthyAIRequirement;
  };
}) {
  return (
    <Card className="border-l-4" style={{ borderLeftColor: TENSION_SEVERITY_COLORS[tension.severity] }}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{tension.valueA}</Badge>
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline">{tension.valueB}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{tension.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                style={{
                  backgroundColor: `${TENSION_SEVERITY_COLORS[tension.severity]}20`,
                  color: TENSION_SEVERITY_COLORS[tension.severity],
                }}
              >
                {tension.severity}
              </Badge>
              <Badge variant="secondary">
                {REQUIREMENT_CONFIG[tension.affectedRequirement]?.label.split(' ')[0]}
              </Badge>
            </div>
          </div>
          <Badge
            variant={
              tension.status === 'mitigated'
                ? 'default'
                : tension.status === 'under_review'
                ? 'secondary'
                : 'outline'
            }
          >
            {tension.status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TrustworthinessAssessment() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || 'default';
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null);

  // Fetch assessments list
  const { data: assessments, isLoading: assessmentsLoading } = useQuery({
    queryKey: ['compliance', 'trustworthiness', 'assessments'],
    queryFn: async () => {
      const response = await complianceApi.listTrustworthinessAssessments();
      return response.data;
    },
    initialData: [
      {
        id: 'ta-1',
        aiSystemId: 'ai-sys-1',
        aiSystemName: 'Customer Service Chatbot',
        overallRating: 'conditionally_trustworthy' as const,
        overallScore: 72,
        requirementAssessments: [
          { requirement: 'human_agency_oversight' as const, label: 'Human Agency', rating: 'good', score: 78, findings: 5, tensions: 1 },
          { requirement: 'technical_robustness_safety' as const, label: 'Robustness', rating: 'good', score: 85, findings: 3, tensions: 0 },
          { requirement: 'privacy_data_governance' as const, label: 'Privacy', rating: 'good', score: 82, findings: 4, tensions: 1 },
          { requirement: 'transparency' as const, label: 'Transparency', rating: 'moderate', score: 65, findings: 6, tensions: 2 },
          { requirement: 'diversity_fairness_nondiscrimination' as const, label: 'Fairness', rating: 'needs_improvement', score: 55, findings: 8, tensions: 3 },
          { requirement: 'societal_environmental_wellbeing' as const, label: 'Society', rating: 'moderate', score: 68, findings: 4, tensions: 1 },
          { requirement: 'accountability' as const, label: 'Accountability', rating: 'good', score: 88, findings: 2, tensions: 0 },
        ],
        tensionCount: 8,
        stakeholderCount: 12,
        scenarioCount: 15,
        createdAt: new Date().toISOString(),
        assessedBy: 'John Doe',
      },
    ],
  });

  // Fetch tensions
  const { data: tensions } = useQuery({
    queryKey: ['compliance', 'tensions'],
    queryFn: async () => {
      const response = await complianceApi.listTensions();
      return response.data;
    },
    initialData: [
      {
        id: 't-1',
        valueA: 'Accuracy',
        valueB: 'Privacy',
        description: 'Improving model accuracy requires more personal data, conflicting with data minimization principles.',
        severity: 'significant' as const,
        status: 'under_review',
        affectedRequirement: 'privacy_data_governance' as TrustworthyAIRequirement,
        stakeholdersAffected: ['End Users', 'Data Subjects'],
        createdAt: new Date().toISOString(),
      },
      {
        id: 't-2',
        valueA: 'Efficiency',
        valueB: 'Human Oversight',
        description: 'Full automation increases efficiency but reduces human control over decisions.',
        severity: 'critical' as const,
        status: 'identified',
        affectedRequirement: 'human_agency_oversight' as TrustworthyAIRequirement,
        stakeholdersAffected: ['Operators', 'Affected Persons'],
        createdAt: new Date().toISOString(),
      },
      {
        id: 't-3',
        valueA: 'Personalization',
        valueB: 'Fairness',
        description: 'Personalized recommendations may inadvertently discriminate against certain groups.',
        severity: 'significant' as const,
        status: 'mitigated',
        affectedRequirement: 'diversity_fairness_nondiscrimination' as TrustworthyAIRequirement,
        stakeholdersAffected: ['End Users', 'Vulnerable Groups'],
        createdAt: new Date().toISOString(),
      },
    ],
  });

  const currentAssessment = assessments.find((a) => a.id === (selectedAssessment || assessments[0]?.id));

  const radarData = currentAssessment?.requirementAssessments.map((ra) => ({
    requirement: ra.label,
    score: ra.score,
    fullMark: 100,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Trustworthiness Assessment</h2>
          <p className="text-muted-foreground">
            Qualitative AI assessment based on 7 EU Trustworthy AI Requirements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/compliance/z-inspection">
              <FileText className="h-4 w-4 mr-2" />
              Import Z-Inspection
            </Link>
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Assessment
          </Button>
        </div>
      </div>

      {/* Assessment Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select
                value={selectedAssessment || assessments[0]?.id}
                onValueChange={setSelectedAssessment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select AI System" />
                </SelectTrigger>
                <SelectContent>
                  {assessments.map((assessment) => (
                    <SelectItem key={assessment.id} value={assessment.id}>
                      {assessment.aiSystemName} - {new Date(assessment.createdAt).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {currentAssessment && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {RATING_BADGES[currentAssessment.overallRating].icon}
                  <span className="font-medium capitalize">
                    {currentAssessment.overallRating.replace(/_/g, ' ')}
                  </span>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-1">
                  {currentAssessment.overallScore}%
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {currentAssessment && (
        <>
          {/* Stats Row */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{currentAssessment.overallScore}%</div>
                <Progress value={currentAssessment.overallScore} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ethical Tensions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {currentAssessment.tensionCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  Value conflicts identified
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Stakeholders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{currentAssessment.stakeholderCount}</div>
                <p className="text-xs text-muted-foreground">Groups analyzed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Scenarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{currentAssessment.scenarioCount}</div>
                <p className="text-xs text-muted-foreground">
                  Socio-technical scenarios
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Requirements Radar</CardTitle>
                <CardDescription>Score across 7 EU Trustworthy AI Requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="requirement" className="text-xs" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value}%`, 'Score']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Requirement Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Requirement Scores</CardTitle>
                <CardDescription>Individual requirement performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={currentAssessment.requirementAssessments} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="label" width={90} className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value}%`, 'Score']}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                      {currentAssessment.requirementAssessments.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            REQUIREMENT_CONFIG[entry.requirement as TrustworthyAIRequirement]?.color ||
                            'hsl(var(--primary))'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Requirement Cards */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Requirement Details</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {currentAssessment.requirementAssessments.map((ra) => (
                <RequirementScoreCard
                  key={ra.requirement}
                  requirement={ra.requirement as TrustworthyAIRequirement}
                  score={ra.score}
                  findings={ra.findings}
                  tensions={ra.tensions}
                  rating={ra.rating}
                />
              ))}
            </div>
          </div>

          {/* Ethical Tensions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Ethical Tensions</CardTitle>
                <CardDescription>
                  Value conflicts and trade-offs requiring resolution
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Tension
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tensions.map((tension) => (
                  <TensionCard key={tension.id} tension={tension} />
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
