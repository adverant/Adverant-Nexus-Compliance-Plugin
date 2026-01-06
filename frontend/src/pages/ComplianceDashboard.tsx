/**
 * Compliance Dashboard
 *
 * Main compliance overview with KPIs, framework radar, heatmap,
 * trustworthiness gauge, and risk distribution.
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  BarChart3,
  FileText,
  RefreshCw,
  ChevronRight,
  ExternalLink,
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
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { complianceApi } from '@/api/compliance';
import { useAuthStore } from '@/stores/auth';
import { Link } from 'react-router-dom';

const REQUIREMENT_LABELS: Record<string, string> = {
  human_agency_oversight: 'Human Agency',
  technical_robustness_safety: 'Robustness',
  privacy_data_governance: 'Privacy',
  transparency: 'Transparency',
  diversity_fairness_nondiscrimination: 'Fairness',
  societal_environmental_wellbeing: 'Society',
  accountability: 'Accountability',
};

const RISK_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const FRAMEWORK_COLORS = [
  'hsl(var(--primary))',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f59e0b',
];

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

function getScoreBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (score >= 80) return 'default';
  if (score >= 60) return 'secondary';
  return 'destructive';
}

export default function ComplianceDashboard() {
  const { user } = useAuthStore();
  const tenantId = user?.tenantId || 'default';

  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['compliance', 'dashboard', tenantId],
    queryFn: async () => {
      const response = await complianceApi.getDashboard(tenantId);
      return response.data;
    },
    initialData: {
      kpis: {
        overallScore: 72,
        scoreChange: 5.2,
        totalControls: 688,
        implementedControls: 495,
        criticalGaps: 12,
        upcomingDeadlines: 3,
      },
      frameworkScores: [
        { frameworkId: 'iso_27001', frameworkName: 'ISO 27001', score: 85, controlCount: 93, implementedCount: 79 },
        { frameworkId: 'gdpr', frameworkName: 'GDPR', score: 78, controlCount: 220, implementedCount: 172 },
        { frameworkId: 'eu_ai_act', frameworkName: 'EU AI Act', score: 65, controlCount: 149, implementedCount: 97 },
        { frameworkId: 'nis2', frameworkName: 'NIS2', score: 71, controlCount: 112, implementedCount: 80 },
        { frameworkId: 'soc2', frameworkName: 'SOC 2', score: 82, controlCount: 64, implementedCount: 52 },
        { frameworkId: 'iso_27701', frameworkName: 'ISO 27701', score: 68, controlCount: 50, implementedCount: 34 },
      ],
      requirementScores: [
        { requirement: 'human_agency_oversight', label: 'Human Agency', score: 75, controlCount: 45 },
        { requirement: 'technical_robustness_safety', label: 'Robustness', score: 82, controlCount: 62 },
        { requirement: 'privacy_data_governance', label: 'Privacy', score: 78, controlCount: 85 },
        { requirement: 'transparency', label: 'Transparency', score: 68, controlCount: 38 },
        { requirement: 'diversity_fairness_nondiscrimination', label: 'Fairness', score: 55, controlCount: 28 },
        { requirement: 'societal_environmental_wellbeing', label: 'Society', score: 62, controlCount: 22 },
        { requirement: 'accountability', label: 'Accountability', score: 88, controlCount: 52 },
      ],
      recentAlerts: [
        { id: '1', type: 'gap', severity: 'critical', message: 'EU AI Act Article 9 controls not implemented', createdAt: new Date().toISOString(), acknowledged: false },
        { id: '2', type: 'deadline', severity: 'high', message: 'NIS2 compliance deadline in 30 days', createdAt: new Date().toISOString(), acknowledged: false },
        { id: '3', type: 'update', severity: 'medium', message: 'New GDPR guidance published by EDPB', createdAt: new Date().toISOString(), acknowledged: true },
      ],
      riskDistribution: [
        { level: 'Critical', count: 12, percentage: 15 },
        { level: 'High', count: 28, percentage: 25 },
        { level: 'Medium', count: 45, percentage: 35 },
        { level: 'Low', count: 35, percentage: 25 },
      ],
    },
  });

  const { data: radarData } = useQuery({
    queryKey: ['compliance', 'radar', tenantId],
    queryFn: async () => {
      const response = await complianceApi.getRadarData(tenantId, 'requirements');
      return response.data;
    },
    initialData: {
      labels: Object.values(REQUIREMENT_LABELS),
      datasets: [
        {
          label: 'Current Score',
          data: [75, 82, 78, 68, 55, 62, 88],
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgba(16, 185, 129, 1)',
        },
        {
          label: 'Target Score',
          data: [85, 90, 85, 80, 75, 75, 90],
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 0.5)',
        },
      ],
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { kpis, frameworkScores, requirementScores, recentAlerts, riskDistribution } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Compliance Dashboard</h2>
          <p className="text-muted-foreground">
            688 controls across 6 frameworks with Z-Inspection integration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button asChild>
            <Link to="/compliance/assessment">
              <FileText className="h-4 w-4 mr-2" />
              New Assessment
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(kpis.overallScore)}`}>
              {kpis.overallScore}%
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {kpis.scoreChange >= 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+{kpis.scoreChange}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">{kpis.scoreChange}%</span>
                </>
              )}
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Controls Implemented</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.implementedControls} / {kpis.totalControls}
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(kpis.implementedControls / kpis.totalControls) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Gaps</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{kpis.criticalGaps}</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.upcomingDeadlines}</div>
            <p className="text-xs text-muted-foreground">Within next 90 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trustworthiness Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Trustworthy AI Requirements</CardTitle>
            <CardDescription>7 EU Requirements Compliance Score</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={requirementScores.map(r => ({ ...r, fullMark: 100 }))}>
                <PolarGrid />
                <PolarAngleAxis dataKey="label" className="text-xs" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Current Score"
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

        {/* Framework Scores */}
        <Card>
          <CardHeader>
            <CardTitle>Framework Compliance</CardTitle>
            <CardDescription>Score by regulatory framework</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={frameworkScores} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" domain={[0, 100]} className="text-xs" tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="frameworkName" className="text-xs" width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value}%`,
                    name === 'score' ? 'Compliance Score' : name,
                  ]}
                />
                <Bar dataKey="score" name="score" radius={[0, 4, 4, 0]}>
                  {frameworkScores.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={FRAMEWORK_COLORS[index % FRAMEWORK_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>Gaps by risk level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="count"
                  label={({ level, percentage }) => `${level} ${percentage}%`}
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={RISK_COLORS[entry.level.toLowerCase() as keyof typeof RISK_COLORS]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Compliance notifications requiring attention</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/compliance/alerts">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 ${
                    alert.acknowledged ? 'opacity-60' : ''
                  }`}
                >
                  {alert.severity === 'critical' && (
                    <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                  )}
                  {alert.severity === 'high' && (
                    <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0" />
                  )}
                  {alert.severity === 'medium' && (
                    <Clock className="h-5 w-5 text-yellow-600 shrink-0" />
                  )}
                  {alert.severity === 'low' && (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          alert.severity === 'critical' || alert.severity === 'high'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {alert.severity}
                      </Badge>
                      <Badge variant="outline">{alert.type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <Button variant="ghost" size="sm">
                      Acknowledge
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
              <Link to="/compliance/controls">
                <BarChart3 className="h-6 w-6" />
                <span>Control Library</span>
                <span className="text-xs text-muted-foreground">688 controls</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
              <Link to="/compliance/cross-framework">
                <ExternalLink className="h-6 w-6" />
                <span>Cross-Framework Analysis</span>
                <span className="text-xs text-muted-foreground">Compare frameworks</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
              <Link to="/compliance/trustworthiness">
                <ShieldCheck className="h-6 w-6" />
                <span>Trustworthiness</span>
                <span className="text-xs text-muted-foreground">Qualitative assessment</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
              <Link to="/compliance/z-inspection">
                <FileText className="h-6 w-6" />
                <span>Z-Inspection</span>
                <span className="text-xs text-muted-foreground">Import reports</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
