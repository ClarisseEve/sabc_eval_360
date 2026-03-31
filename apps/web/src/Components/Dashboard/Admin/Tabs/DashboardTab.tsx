import React from 'react';
import { Link } from '@/lib/inertia-shim';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Progress } from '@/Components/UI/Progress/Progress';
import {
  Users, Building, MapPin, CheckCircle, Clock, AlertTriangle,
  FileText, TrendingUp, BarChart3, ArrowUpRight, Target, Award,
  UserCheck, AlertCircle, Shield, Database, Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart as RechartsLineChart, Line, AreaChart, Area, Legend } from 'recharts';
import { useAdminDashboard } from '@/Hooks/queries';

const SABC_COLORS = {
  primary: '#E53E3E',
  accent: '#FF9800',
  success: '#48BB78',
  warning: '#D69E2E',
  error: '#E53E3E',
  info: '#3182CE',
  gray: '#9E9E9E'
};

const DashboardTab: React.FC = () => {
  const { data } = useAdminDashboard();

  // Transformer les données API en format attendu par le UI
  const supervisionStats = [
    {
      label: 'Evaluations validees',
      value: data.evaluations_validees ?? 0,
      total: data.total_evaluations || 1,
      color: SABC_COLORS.primary,
      icon: CheckCircle,
      trend: ''
    },
    {
      label: 'Taux de participation',
      value: data.utilisateurs_actifs ?? 0,
      total: data.total_utilisateurs || 1,
      color: SABC_COLORS.primary,
      icon: Users,
      trend: ''
    },
    {
      label: 'Score moyen global',
      value: data.score_personnel ?? 0,
      total: 5,
      color: SABC_COLORS.primary,
      icon: Award,
      trend: ''
    },
    {
      label: 'Evaluations en cours',
      value: data.evaluations_en_cours ?? 0,
      total: data.total_evaluations || 1,
      color: SABC_COLORS.warning,
      icon: Clock,
      trend: ''
    },
    {
      label: 'En attente de validation',
      value: data.evaluations_en_attente ?? 0,
      total: data.total_evaluations || 1,
      color: SABC_COLORS.warning,
      icon: AlertTriangle,
      trend: ''
    },
    {
      label: 'Taux de completion',
      value: Math.round(data.taux_completion ?? 0),
      total: 100,
      color: SABC_COLORS.success,
      icon: UserCheck,
      trend: ''
    }
  ];

  // Données graphiques — viendront de l'API enrichie (Task 13)
  const regionPerformanceData = data.regions_performance ?? [];
  const evaluationsByStatus = data.evaluations_par_statut ?? [
    { name: 'Validees', value: data.evaluations_validees ?? 0, color: SABC_COLORS.success },
    { name: 'En cours', value: data.evaluations_en_cours ?? 0, color: SABC_COLORS.warning },
    { name: 'En attente', value: data.evaluations_en_attente ?? 0, color: SABC_COLORS.accent },
  ].filter(d => d.value > 0);
  const monthlyEvaluations = data.evaluations_mensuelles ?? [];
  const rolePerformanceData = data.performance_par_role ?? [];
  const regions = data.regions ?? [];
  const alertsData = data.alertes ?? [];

  const systemStats = [
    { label: 'Utilisateurs actifs', value: data.total_utilisateurs ? Math.round((data.utilisateurs_actifs / data.total_utilisateurs) * 100) : 0, total: 100, icon: Users, color: SABC_COLORS.success },
    { label: 'Taux completion', value: Math.round(data.taux_completion ?? 0), total: 100, icon: Zap, color: SABC_COLORS.info },
    { label: 'Remplacements actifs', value: data.remplacements_actifs ?? 0, total: Math.max(data.remplacements_actifs ?? 1, 1), icon: Shield, color: SABC_COLORS.warning },
    { label: 'Total evaluations', value: data.total_evaluations ?? 0, total: Math.max(data.total_evaluations ?? 1, 1), icon: Database, color: SABC_COLORS.info }
  ];

  return (
    <div className="space-y-8">
      {/* Section Statistiques Globales */}
      <Card className="border border-sabc-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-sabc-gray-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-sabc-red-primary" />
              Statistique Globale
            </CardTitle>
            <Link href="/admin/evaluations/management" className="flex items-center gap-1 text-sabc-red-primary hover:text-sabc-red-dark">
              <span className="text-sm font-medium">Voir details</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {supervisionStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="bg-white border border-sabc-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: stat.color + '20' }}>
                        <IconComponent className="w-4 h-4" style={{ color: stat.color }} />
                      </div>
                      <div className="text-sm text-sabc-gray-600">{stat.label}</div>
                    </div>
                    {stat.trend && <span className="text-xs font-medium text-sabc-success">{stat.trend}</span>}
                  </div>
                  <div className="text-2xl font-bold text-sabc-gray-900 mb-2">
                    {stat.value}
                    <span className="text-sm text-sabc-gray-400 ml-1">
                      {stat.label.includes('Score') ? '/ 5' : `/ ${stat.total}`}
                    </span>
                  </div>
                  <div className="w-full bg-sabc-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: stat.color,
                        width: `${Math.min((stat.value / stat.total) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {regionPerformanceData.length > 0 && (
              <div className="bg-sabc-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-sabc-gray-900 mb-2">Performance par Region</h3>
                <p className="text-sm text-sabc-gray-600 mb-4">Comparaison Tanieres vs Non-tanieres</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regionPerformanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                      <XAxis dataKey="region" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E0E0E0', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ paddingTop: '5px' }} />
                      <Bar dataKey="completion" fill={SABC_COLORS.primary} name="Taux completion %" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="performance" fill={SABC_COLORS.accent} name="Performance %" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {evaluationsByStatus.length > 0 && (
              <div className="bg-sabc-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-sabc-gray-900 mb-2">Repartition par Statut</h3>
                <p className="text-sm text-sabc-gray-600 mb-4">Etat actuel des evaluations</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie data={evaluationsByStatus} cx="50%" cy="45%" outerRadius={70} dataKey="value">
                        {evaluationsByStatus.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {monthlyEvaluations.length > 0 && (
              <div className="bg-sabc-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-sabc-gray-900 mb-2">Evolution Mensuelle</h3>
                <p className="text-sm text-sabc-gray-600 mb-4">Tendance des 6 derniers mois</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={monthlyEvaluations} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ paddingTop: '5px' }} />
                      <Line type="monotone" dataKey="completed" stroke={SABC_COLORS.primary} strokeWidth={3} dot={{ fill: SABC_COLORS.primary }} name="Completees" />
                      <Line type="monotone" dataKey="target" stroke={SABC_COLORS.gray} strokeDasharray="5 5" name="Objectif" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Performance par Role Hierarchique */}
      {rolePerformanceData.length > 0 && (
        <Card className="border border-sabc-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-sabc-gray-900 flex items-center gap-2">
                <Target className="w-6 h-6 text-sabc-red-primary" />
                Performance par Role Hierarchique
              </CardTitle>
              <Link href="/admin/analytics" className="flex items-center gap-1 text-sabc-red-primary hover:text-sabc-red-dark">
                <span className="text-sm font-medium">Analytics detaillees</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-sabc-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-sabc-gray-900 mb-2">Scores Moyens par Role</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={rolePerformanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                      <XAxis dataKey="role" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E0E0E0', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="avgScore" stroke={SABC_COLORS.primary} fill={SABC_COLORS.primary + '30'} strokeWidth={3} name="Score moyen /5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-sabc-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-sabc-gray-900 mb-2">Detail par Role</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {rolePerformanceData.map((role: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-sabc-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-sabc-red-primary"></div>
                          <span className="font-semibold text-sabc-gray-900">{role.role}</span>
                          <Badge variant="outline" className="text-xs">{role.count} pers.</Badge>
                        </div>
                        <span className="text-sm font-bold text-sabc-gray-900">{role.avgScore}/5</span>
                      </div>
                      <div className="w-full bg-sabc-gray-200 rounded-full h-2">
                        <div className="h-2 rounded-full bg-sabc-red-primary" style={{ width: `${role.completion}%` }}></div>
                      </div>
                      <div className="text-xs text-sabc-gray-600 mt-1">{role.completion}% complete</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Gestion des Regions */}
      {regions.length > 0 && (
        <Card className="border border-sabc-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-sabc-gray-900 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-sabc-red-primary" />
                Gestion des Regions
              </CardTitle>
              <Link href="/admin/structure/regions" className="flex items-center gap-1 text-sabc-red-primary hover:text-sabc-red-dark">
                <span className="text-sm font-medium">Gerer structure</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {regions.map((region: any, index: number) => (
                <div key={index} className="bg-white border border-sabc-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-sabc-gray-900">{region.nom}</h3>
                    {region.badgeText && (
                      <Badge className="text-white text-xs px-2 py-1" style={{ backgroundColor: region.badgeColor }}>
                        {region.badgeText}
                      </Badge>
                    )}
                  </div>
                  {region.description && <p className="text-sm text-sabc-gray-600 mb-4">{region.description}</p>}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-sabc-gray-600">Utilisateurs</span>
                      <span className="font-semibold text-sabc-gray-900">{region.utilisateurs ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-sabc-gray-600">Evaluations</span>
                      <span className="font-semibold text-sabc-gray-900">{region.evaluations ?? 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Systeme & Alertes */}
      <Card className="border border-sabc-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-sabc-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-sabc-red-primary" />
              Systeme & Alertes
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {systemStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="bg-white border border-sabc-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: stat.color + '20' }}>
                      <IconComponent className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                    <div>
                      <div className="text-sm text-sabc-gray-600">{stat.label}</div>
                      <div className="text-lg font-bold text-sabc-gray-900">{stat.value}</div>
                    </div>
                  </div>
                  <Progress value={Math.min((stat.value / stat.total) * 100, 100)} className="h-2" />
                </div>
              );
            })}
          </div>

          {alertsData.length > 0 && (
            <div className="bg-sabc-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-sabc-gray-900 mb-4">Alertes Recentes</h3>
              <div className="space-y-3">
                {alertsData.slice(0, 3).map((alert: any, index: number) => (
                  <div key={index} className="bg-white rounded-lg p-3 border-l-4 flex items-center justify-between" style={{ borderLeftColor: alert.color }}>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" style={{ color: alert.color }} />
                      <span className="font-medium text-sabc-gray-900">{alert.type}</span>
                    </div>
                    <Badge variant="outline" className="text-xs" style={{ color: alert.color, borderColor: alert.color }}>
                      {alert.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Rapide */}
      <Card className="border border-sabc-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-sabc-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-sabc-red-primary" />
            Navigation Rapide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/utilisateurs" className="group">
              <div className="w-full h-20 border border-sabc-gray-200 rounded-lg p-4 hover:border-sabc-red-primary hover:shadow-md transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-sabc-red-primary" />
                  <div>
                    <div className="font-medium text-sabc-gray-900">Utilisateurs</div>
                    <div className="text-sm text-sabc-gray-600">{data.utilisateurs_actifs ?? 0} actifs</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-sabc-gray-400 group-hover:text-sabc-red-primary transition-colors" />
              </div>
            </Link>

            <Link href="/admin/structure/regions" className="group">
              <div className="w-full h-20 border border-sabc-gray-200 rounded-lg p-4 hover:border-sabc-red-primary hover:shadow-md transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building className="w-6 h-6 text-sabc-red-primary" />
                  <div>
                    <div className="font-medium text-sabc-gray-900">Structure</div>
                    <div className="text-sm text-sabc-gray-600">{regions.length} regions</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-sabc-gray-400 group-hover:text-sabc-red-primary transition-colors" />
              </div>
            </Link>

            <Link href="/admin/evaluations/management" className="group">
              <div className="w-full h-20 border border-sabc-gray-200 rounded-lg p-4 hover:border-sabc-red-primary hover:shadow-md transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-sabc-red-primary" />
                  <div>
                    <div className="font-medium text-sabc-gray-900">Evaluations</div>
                    <div className="text-sm text-sabc-gray-600">{data.total_evaluations ?? 0} total</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-sabc-gray-400 group-hover:text-sabc-red-primary transition-colors" />
              </div>
            </Link>

            <Link href="/admin/analytics" className="group">
              <div className="w-full h-20 border border-sabc-gray-200 rounded-lg p-4 hover:border-sabc-red-primary hover:shadow-md transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-sabc-red-primary" />
                  <div>
                    <div className="font-medium text-sabc-gray-900">Analytics</div>
                    <div className="text-sm text-sabc-gray-600">Rapports</div>
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

export default DashboardTab;
