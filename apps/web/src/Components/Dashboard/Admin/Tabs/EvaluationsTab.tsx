import React, { useRef } from 'react';
import { Link } from '@/lib/inertia-shim';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import {
  Clock, AlertTriangle, CheckCircle, UserCheck, Award, Activity,
  Eye, BarChart3, ArrowUpRight, Target, Filter, Download, RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { useAdminDashboard } from '@/Hooks/queries';
import { ChartExportButton } from '@/Components/Charts/ChartExportButton';

const SABC_COLORS = {
  primary: '#E53E3E',
  accent: '#FF9800',
  success: '#48BB78',
  warning: '#D69E2E',
  error: '#E53E3E',
  info: '#3182CE',
  gray: '#9E9E9E'
};

const EvaluationsTab: React.FC = () => {
  const { data } = useAdminDashboard();
  const chartRefCompetences = useRef<HTMLDivElement>(null);
  const chartRefTypes = useRef<HTMLDivElement>(null);
  const chartRefAnalytics = useRef<HTMLDivElement>(null);
  const chartRefSuperviseurs = useRef<HTMLDivElement>(null);
  const chartRefQualite = useRef<HTMLDivElement>(null);

  const supervisionMetrics = [
    {
      label: 'Evaluations en attente',
      value: data.evaluations_en_attente ?? 0,
      total: data.total_evaluations || 1,
      icon: Clock,
      color: SABC_COLORS.warning,
      trend: '',
      priority: 'high' as const
    },
    {
      label: 'Validations effectuees',
      value: data.evaluations_validees ?? 0,
      total: data.total_evaluations || 1,
      icon: CheckCircle,
      color: SABC_COLORS.success,
      trend: '',
      priority: 'normal' as const
    },
    {
      label: 'Evaluations en cours',
      value: data.evaluations_en_cours ?? 0,
      total: data.total_evaluations || 1,
      icon: Award,
      color: SABC_COLORS.info,
      trend: '',
      priority: 'normal' as const
    },
    {
      label: 'Taux completion',
      value: Math.round(data.taux_completion ?? 0),
      total: 100,
      icon: Target,
      color: SABC_COLORS.success,
      trend: '',
      priority: 'normal' as const
    },
    {
      label: 'Utilisateurs actifs',
      value: data.utilisateurs_actifs ?? 0,
      total: data.total_utilisateurs || 1,
      icon: UserCheck,
      color: SABC_COLORS.primary,
      trend: '',
      priority: 'normal' as const
    },
    {
      label: 'Remplacements actifs',
      value: data.remplacements_actifs ?? 0,
      total: Math.max(data.remplacements_actifs ?? 1, 1),
      icon: Activity,
      color: SABC_COLORS.info,
      trend: '',
      priority: 'normal' as const
    }
  ];

  // Donnees graphiques — viendront de l'API enrichie (Task 13)
  const globalCompetencyMatrix = data.competences_globales ?? [];
  const evaluationTypeData = data.types_evaluation ?? [];
  const userAnalytics = data.analytics_utilisateurs ?? [];
  const supervisorPerformance = data.performance_superviseurs ?? [];
  const qualityMetrics = data.metriques_qualite ?? [];

  return (
    <div className="space-y-8">
      {/* Section Supervision des Evaluations */}
      <Card className="border border-sabc-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-sabc-gray-900 flex items-center gap-2">
              <Eye className="w-6 h-6 text-sabc-red-primary" />
              Supervision des Evaluations 360
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Filter className="w-4 h-4" />
                Filtrer
              </Button>
              <Link href="/admin/evaluations/management" className="flex items-center gap-1 text-sabc-red-primary hover:text-sabc-red-dark">
                <span className="text-sm font-medium">Voir en attente</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* KPIs de supervision */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {supervisionMetrics.map((metric) => {
              const IconComponent = metric.icon;
              const priorityColor = metric.priority === 'high' ? 'border-l-red-500' : 'border-l-green-500';
              return (
                <div key={metric.label} className={`bg-white border border-sabc-gray-200 rounded-lg p-4 border-l-4 ${priorityColor} hover:shadow-md transition-shadow`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: metric.color + '20' }}>
                        <IconComponent className="w-4 h-4" style={{ color: metric.color }} />
                      </div>
                      <div className="text-sm text-sabc-gray-600">{metric.label}</div>
                    </div>
                    {metric.trend && (
                      <span className={`text-xs font-medium ${metric.trend.startsWith('+') ? 'text-sabc-success' : 'text-sabc-error'}`}>
                        {metric.trend}
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-sabc-gray-900 mb-2">
                    {metric.value}
                    <span className="text-sm text-sabc-gray-400 ml-1">/ {metric.total}</span>
                  </div>
                  <div className="w-full bg-sabc-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: metric.color,
                        width: `${Math.min((metric.value / metric.total) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Graphiques de supervision */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {globalCompetencyMatrix.length > 0 && (
              <div className="bg-sabc-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-sabc-gray-900 mb-2">Matrice de Competences</h3>
                <div className="relative">
                  <div className="absolute top-0 right-0 z-10">
                    <ChartExportButton chartRef={chartRefCompetences} filename="sabc-competences" />
                  </div>
                  <div ref={chartRefCompetences} className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={globalCompetencyMatrix}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="competence" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10 }} />
                        <Radar name="Score Global" dataKey="score" stroke={SABC_COLORS.primary} fill={SABC_COLORS.primary + '30'} strokeWidth={2} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {evaluationTypeData.length > 0 && (
              <div className="bg-sabc-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-sabc-gray-900 mb-2">Types d'Evaluation</h3>
                <div className="relative">
                  <div className="absolute top-0 right-0 z-10">
                    <ChartExportButton chartRef={chartRefTypes} filename="sabc-types-evaluation" />
                  </div>
                  <div ref={chartRefTypes} className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={evaluationTypeData} layout="horizontal" margin={{ left: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--sabc-gray-200)" />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis dataKey="type" type="category" tick={{ fontSize: 10 }} width={80} />
                        <Tooltip />
                        <Bar dataKey="completed" fill={SABC_COLORS.success} name="Completees" />
                        <Bar dataKey="target" fill={SABC_COLORS.gray} name="Objectif" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {userAnalytics.length > 0 && (
              <div className="bg-sabc-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-sabc-gray-900 mb-2">Analytics Utilisateurs</h3>
                <div className="relative">
                  <div className="absolute top-0 right-0 z-10">
                    <ChartExportButton chartRef={chartRefAnalytics} filename="sabc-analytics-utilisateurs" />
                  </div>
                  <div ref={chartRefAnalytics} className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={userAnalytics}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--sabc-gray-200)" />
                        <XAxis dataKey="periode" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="evaluations_donnees" stroke={SABC_COLORS.primary} strokeWidth={3} name="Donnees" />
                        <Line type="monotone" dataKey="evaluations_recues" stroke={SABC_COLORS.success} strokeWidth={2} name="Recues" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Performance Superviseurs */}
      {(supervisorPerformance.length > 0 || qualityMetrics.length > 0) && (
        <Card className="border border-sabc-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-sabc-gray-900 flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-sabc-red-primary" />
                Performance des Superviseurs
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {supervisorPerformance.length > 0 && (
                <div className="bg-sabc-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-sabc-gray-900 mb-2">Performance par Role</h3>
                  <div className="relative">
                    <div className="absolute top-0 right-0 z-10">
                      <ChartExportButton chartRef={chartRefSuperviseurs} filename="sabc-performance-superviseurs" />
                    </div>
                    <div ref={chartRefSuperviseurs} className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={supervisorPerformance}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--sabc-gray-200)" />
                          <XAxis dataKey="role" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Area type="monotone" dataKey="taux_validation" stroke={SABC_COLORS.primary} fill={SABC_COLORS.primary + '30'} strokeWidth={3} name="Taux validation %" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {qualityMetrics.length > 0 && (
                <div className="bg-sabc-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-sabc-gray-900 mb-2">Analyse Qualite</h3>
                  <div className="relative">
                    <div className="absolute top-0 right-0 z-10">
                      <ChartExportButton chartRef={chartRefQualite} filename="sabc-qualite" />
                    </div>
                    <div ref={chartRefQualite} className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={qualityMetrics}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="critere" tick={{ fontSize: 10 }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Radar name="Score" dataKey="score" stroke={SABC_COLORS.primary} fill={SABC_COLORS.primary + '30'} strokeWidth={2} />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions de Supervision */}
      <Card className="border border-sabc-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-sabc-gray-900 flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-sabc-red-primary" />
            Actions de Supervision
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/evaluations/management" className="group">
              <div className="w-full h-20 border border-sabc-gray-200 rounded-lg p-4 hover:border-sabc-red-primary hover:shadow-md transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-sabc-warning" />
                  <div>
                    <div className="font-medium text-sabc-gray-900">En Attente</div>
                    <div className="text-sm text-sabc-gray-600">{data.evaluations_en_attente ?? 0} evaluations</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-sabc-gray-400 group-hover:text-sabc-red-primary transition-colors" />
              </div>
            </Link>

            <Link href="/admin/evaluations/management" className="group">
              <div className="w-full h-20 border border-sabc-gray-200 rounded-lg p-4 hover:border-sabc-red-primary hover:shadow-md transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-sabc-warning" />
                  <div>
                    <div className="font-medium text-sabc-gray-900">En cours</div>
                    <div className="text-sm text-sabc-gray-600">{data.evaluations_en_cours ?? 0} a completer</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-sabc-gray-400 group-hover:text-sabc-red-primary transition-colors" />
              </div>
            </Link>

            <Link href="/admin/evaluations/history" className="group">
              <div className="w-full h-20 border border-sabc-gray-200 rounded-lg p-4 hover:border-sabc-red-primary hover:shadow-md transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Download className="w-6 h-6 text-sabc-info" />
                  <div>
                    <div className="font-medium text-sabc-gray-900">Historique</div>
                    <div className="text-sm text-sabc-gray-600">Rapports</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-sabc-gray-400 group-hover:text-sabc-red-primary transition-colors" />
              </div>
            </Link>

            <Link href="/admin/dashboard?tab=overview" className="group">
              <div className="w-full h-20 border border-sabc-gray-200 rounded-lg p-4 hover:border-sabc-red-primary hover:shadow-md transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-sabc-success" />
                  <div>
                    <div className="font-medium text-sabc-gray-900">Analytics</div>
                    <div className="text-sm text-sabc-gray-600">Detaillees</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-sabc-gray-400 group-hover:text-sabc-red-primary transition-colors" />
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EvaluationsTab;
