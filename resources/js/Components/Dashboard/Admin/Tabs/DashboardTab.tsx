import React from 'react';
import { Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Progress } from '@/Components/UI/Progress/Progress';
import { 
  Users, 
  Building, 
  MapPin, 
  Activity, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Plus,
  Settings,
  FileText,
  TrendingUp,
  BarChart3,
  PieChart,
  ArrowUpRight,
  Target,
  Calendar,
  Award,
  UserCheck,
  AlertCircle,
  Shield,
  Database,
  LineChart,
  Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart as RechartsLineChart, Line, AreaChart, Area, Legend } from 'recharts';

/**
 * Onglet Vue d'ensemble - Tableau de bord Administrateur SABC
 * 
 * Affiche les KPIs principaux, gestion des régions et supervision des évaluations
 * Respecte les règles métier SABC avec maximum 2 onglets
 */
const DashboardTab: React.FC = () => {
  // Couleurs SABC pour les graphiques
  const SABC_COLORS = {
    primary: '#E53E3E',
    accent: '#FF9800',
    success: '#48BB78',
    warning: '#D69E2E',
    error: '#E53E3E',
    info: '#3182CE',
    gray: '#9E9E9E'
  };

  // Section Supervision des Évaluations (enrichie)
  const supervisionStats = [
    { 
      label: 'Évaluations complétées', 
      value: 120, 
      total: 200, 
      color: SABC_COLORS.primary,
      icon: CheckCircle,
      trend: '+12%'
    },
    { 
      label: 'Taux de participation', 
      value: 78, 
      total: 100, 
      color: SABC_COLORS.primary,
      icon: Users,
      trend: '+5%'
    },
    { 
      label: 'Score moyen global', 
      value: 3.8, 
      total: 5, 
      color: SABC_COLORS.primary,
      icon: Award,
      trend: '+0.2'
    },
    { 
      label: 'Délai moyen (jours)', 
      value: 4, 
      total: 30, 
      color: SABC_COLORS.success,
      icon: Clock,
      trend: '-2j'
    },
    { 
      label: 'Évaluations en retard', 
      value: 15, 
      total: 200, 
      color: SABC_COLORS.warning,
      icon: AlertTriangle,
      trend: '-3'
    },
    { 
      label: 'Taux de validation', 
      value: 92, 
      total: 100, 
      color: SABC_COLORS.success,
      icon: UserCheck,
      trend: '+8%'
    }
  ];

  // Données pour graphiques - Performance par région
  const regionPerformanceData = [
    { region: 'Littoral', completion: 78, evaluations: 87, users: 24, performance: 85, type: 'Tanière' },
    { region: 'Centre', completion: 60, evaluations: 65, users: 18, performance: 78, type: 'Tanière' },
    { region: 'Ouest', completion: 45, evaluations: 43, users: 12, performance: 72, type: 'Non-tanière' },
    { region: 'Nord', completion: 30, evaluations: 38, users: 10, performance: 68, type: 'Non-tanière' }
  ];

  // Données pour graphique en secteurs - Évaluations par statut
  const evaluationsByStatus = [
    { name: 'Validé', value: 120, color: SABC_COLORS.success },
    { name: 'En attente', value: 45, color: SABC_COLORS.warning },
    { name: 'Rejetées', value: 15, color: SABC_COLORS.error },
    { name: 'Brouillons', value: 20, color: SABC_COLORS.gray }
  ];

  // Données évolution temporelle - Évaluations par mois
  const monthlyEvaluations = [
    { month: 'Jan', completed: 18, submitted: 25, target: 30 },
    { month: 'Fév', completed: 22, submitted: 28, target: 30 },
    { month: 'Mar', completed: 28, submitted: 35, target: 30 },
    { month: 'Avr', completed: 35, submitted: 42, target: 35 },
    { month: 'Mai', completed: 32, submitted: 38, target: 35 },
    { month: 'Jun', completed: 40, submitted: 45, target: 40 }
  ];

  // Données performance par rôle hiérarchique
  const rolePerformanceData = [
    { role: 'DR', count: 4, avgScore: 4.2, completion: 100 },
    { role: 'CDTT', count: 8, avgScore: 4.0, completion: 95 },
    { role: 'CSC', count: 12, avgScore: 3.8, completion: 88 },
    { role: 'RTM', count: 6, avgScore: 3.9, completion: 92 },
    { role: 'CDV', count: 15, avgScore: 3.7, completion: 85 },
    { role: 'CDS', count: 25, avgScore: 3.6, completion: 78 },
    { role: 'TMO', count: 18, avgScore: 3.5, completion: 82 }
  ];

  // Données système et sécurité
  const systemStats = [
    { label: 'Utilisateurs actifs', value: 88, total: 100, icon: Users, color: SABC_COLORS.success },
    { label: 'Connexions aujourd\'hui', value: 42, total: 88, icon: Zap, color: SABC_COLORS.info },
    { label: 'Sécurité système', value: 98, total: 100, icon: Shield, color: SABC_COLORS.success },
    { label: 'Base de données', value: 85, total: 100, icon: Database, color: SABC_COLORS.warning }
  ];

  // Données alertes et notifications
  const alertsData = [
    { type: 'Évaluations en retard', count: 15, priority: 'high', color: SABC_COLORS.error },
    { type: 'Validations en attente', count: 8, priority: 'medium', color: SABC_COLORS.warning },
    { type: 'Nouveaux utilisateurs', count: 5, priority: 'low', color: SABC_COLORS.info },
    { type: 'Mises à jour système', count: 2, priority: 'medium', color: SABC_COLORS.accent }
  ];

  // Gestion des Régions (comme Image 2)
  const regions = [
    { 
      nom: 'Littoral', 
      type: 'Tanière', 
      description: 'Région tanière incluant Douala',
      utilisateurs: 24, 
      evaluations: 87,
      badgeColor: '#E53E3E',
      badgeText: 'Tanière'
    },
    { 
      nom: 'Centre', 
      type: 'Tanière', 
      description: 'Région tanière incluant Yaoundé',
      utilisateurs: 18, 
      evaluations: 65,
      badgeColor: '#E53E3E',
      badgeText: 'Tanière'
    },
    { 
      nom: 'Ouest', 
      type: 'Non-tanière', 
      description: 'Région non-tanière incluant Bafoussam',
      utilisateurs: 12, 
      evaluations: 43,
      badgeColor: '#FF9800',
      badgeText: 'Non-tanière'
    },
    { 
      nom: 'Nord', 
      type: 'Non-tanière', 
      description: 'Région non-tanière incluant Garoua',
      utilisateurs: 10, 
      evaluations: 38,
      badgeColor: '#FF9800',
      badgeText: 'Non-tanière'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Section Supervision des Évaluations - Enrichie avec graphiques */}
      <Card className="border border-sabc-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-sabc-gray-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-sabc-red-primary" />
              Statistique Globale
            </CardTitle>
            <Link href="/admin/evaluations" className="flex items-center gap-1 text-sabc-red-primary hover:text-sabc-red-dark">
              <span className="text-sm font-medium">Voir détails</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {/* KPIs principaux - 6 cartes en grille */}
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
                    <span className="text-xs font-medium text-sabc-success">{stat.trend}</span>
                  </div>
                  <div className="text-2xl font-bold text-sabc-gray-900 mb-2">
                    {stat.label.includes('Score') ? stat.value : stat.value}
                    <span className="text-sm text-sabc-gray-400 ml-1">
                      {stat.label.includes('Score') ? '/ 5' : `/ ${stat.total}`}
                    </span>
                  </div>
                  <div className="w-full bg-sabc-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        backgroundColor: stat.color, 
                        width: `${(stat.value / stat.total) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Graphiques avancés - 3 sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Graphique en barres - Performance par région */}
            <div className="bg-sabc-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-sabc-gray-900 mb-2">Performance par Région</h3>
              <p className="text-sm text-sabc-gray-600 mb-4">Comparaison Tanières vs Non-tanières</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionPerformanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis dataKey="region" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E0E0E0',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '5px' }} />
                    <Bar dataKey="completion" fill={SABC_COLORS.primary} name="Taux complétion %" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="performance" fill={SABC_COLORS.accent} name="Performance %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Graphique en secteurs - Statut des évaluations */}
            <div className="bg-sabc-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-sabc-gray-900 mb-2">Répartition par Statut</h3>
              <p className="text-sm text-sabc-gray-600 mb-4">État actuel des évaluations</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie 
                      data={evaluationsByStatus} 
                      cx="50%" 
                      cy="45%" 
                      outerRadius={70} 
                      dataKey="value"
                    >
                      {evaluationsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Graphique linéaire - Évolution mensuelle */}
            <div className="bg-sabc-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-sabc-gray-900 mb-2">Évolution Mensuelle</h3>
              <p className="text-sm text-sabc-gray-600 mb-4">Tendance des 6 derniers mois</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={monthlyEvaluations} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ paddingTop: '5px' }} />
                    <Line type="monotone" dataKey="completed" stroke={SABC_COLORS.primary} strokeWidth={3} dot={{ fill: SABC_COLORS.primary }} name="Complétées" />
                    <Line type="monotone" dataKey="target" stroke={SABC_COLORS.gray} strokeDasharray="5 5" name="Objectif" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Performance par Rôle Hiérarchique */}
      <Card className="border border-sabc-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-sabc-gray-900 flex items-center gap-2">
              <Target className="w-6 h-6 text-sabc-red-primary" />
              Performance par Rôle Hiérarchique
            </CardTitle>
            <Link href="/admin/analytics" className="flex items-center gap-1 text-sabc-red-primary hover:text-sabc-red-dark">
              <span className="text-sm font-medium">Analytics détaillées</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique en aires - Scores par rôle */}
            <div className="bg-sabc-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-sabc-gray-900 mb-2">Scores Moyens par Rôle</h3>
              <p className="text-sm text-sabc-gray-600 mb-4">Hiérarchie SABC selon règles métier</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rolePerformanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis dataKey="role" tick={{ fontSize: 12 }} />
                    <YAxis domain={[3, 4.5]} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E0E0E0',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '5px' }} />
                    <Area type="monotone" dataKey="avgScore" stroke={SABC_COLORS.primary} fill={SABC_COLORS.primary + '30'} strokeWidth={3} name="Score moyen /5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tableau détaillé des rôles */}
            <div className="bg-sabc-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-sabc-gray-900 mb-2">Détail par Rôle</h3>
              <p className="text-sm text-sabc-gray-600 mb-4">Effectifs et taux de complétion</p>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {rolePerformanceData.map((role, index) => (
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
                      <div 
                        className="h-2 rounded-full bg-sabc-red-primary" 
                        style={{ width: `${role.completion}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-sabc-gray-600 mt-1">{role.completion}% complété</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Gestion des Régions - Enrichie */}
      <Card className="border border-sabc-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-sabc-gray-900 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-sabc-red-primary" />
              Gestion des Régions & Structure Organisationnelle
            </CardTitle>
            <Link href="/admin/structure/regions" className="flex items-center gap-1 text-sabc-red-primary hover:text-sabc-red-dark">
              <span className="text-sm font-medium">Gérer structure</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {regions.map((region, index) => (
              <div key={index} className="bg-white border border-sabc-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-sabc-gray-900">{region.nom}</h3>
                  <Badge 
                    className="text-white text-xs px-2 py-1"
                    style={{ backgroundColor: region.badgeColor }}
                  >
                    {region.badgeText}
                  </Badge>
                </div>
                <p className="text-sm text-sabc-gray-600 mb-4">{region.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-sabc-gray-600">Utilisateurs</span>
                    <span className="font-semibold text-sabc-gray-900">{region.utilisateurs}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-sabc-gray-600">Évaluations</span>
                    <span className="font-semibold text-sabc-gray-900">{region.evaluations}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Graphique comparatif régions */}
          <div className="bg-sabc-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-sabc-gray-900 mb-2">Comparaison Performance Régionale</h3>
            <p className="text-sm text-sabc-gray-600 mb-4">Analyse Tanières vs Non-tanières selon règles SABC</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionPerformanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                  <XAxis dataKey="region" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E0E0E0',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '5px' }} />
                  <Bar dataKey="users" fill={SABC_COLORS.info} name="Utilisateurs" />
                  <Bar dataKey="evaluations" fill={SABC_COLORS.primary} name="Évaluations" />
                  <Bar dataKey="performance" fill={SABC_COLORS.success} name="Performance %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Système & Alertes */}
      <Card className="border border-sabc-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-sabc-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-sabc-red-primary" />
              Système & Alertes
            </CardTitle>
            <Link href="/admin/system" className="flex items-center gap-1 text-sabc-red-primary hover:text-sabc-red-dark">
              <span className="text-sm font-medium">Voir détails</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
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
                      <div className="text-lg font-bold text-sabc-gray-900">{stat.value}%</div>
                    </div>
                  </div>
                  <Progress value={stat.value} className="h-2" />
                </div>
              );
            })}
          </div>
          
          <div className="bg-sabc-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-sabc-gray-900 mb-4">Alertes Récentes</h3>
            <div className="space-y-3">
              {alertsData.slice(0, 3).map((alert, index) => (
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
        </CardContent>
      </Card>

      {/* Actions Rapides avec flèches */}
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
                    <div className="text-sm text-sabc-gray-600">88 actifs</div>
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
                    <div className="text-sm text-sabc-gray-600">4 régions</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-sabc-gray-400 group-hover:text-sabc-red-primary transition-colors" />
              </div>
            </Link>

            <Link href="/admin/evaluations" className="group">
              <div className="w-full h-20 border border-sabc-gray-200 rounded-lg p-4 hover:border-sabc-red-primary hover:shadow-md transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-sabc-red-primary" />
                  <div>
                    <div className="font-medium text-sabc-gray-900">Évaluations</div>
                    <div className="text-sm text-sabc-gray-600">200 total</div>
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
