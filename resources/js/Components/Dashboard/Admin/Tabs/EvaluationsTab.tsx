import React from 'react';
import { Link } from '@/lib/inertia-shim';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Progress } from '@/Components/UI/Progress/Progress';

import { 
  Target, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  TrendingUp,
  Calendar,
  FileText,
  ArrowUpRight,
  BarChart3,
  Eye,
  UserCheck,
  Award,
  Activity,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

/**
 * Onglet Supervision - Tableau de bord Administrateur SABC
 * 
 * Supervision des évaluations 360°, validation et suivi des performances
 * Respecte les règles métier SABC pour le workflow d'évaluation
 */
const EvaluationsTab: React.FC = () => {
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

  // Métriques de supervision avancées
  const supervisionMetrics = [
    {
      label: 'Évaluations en attente',
      value: 25,
      total: 200,
      icon: Clock,
      color: SABC_COLORS.warning,
      trend: '-5',
      priority: 'high'
    },
    {
      label: 'Validations effectuées',
      value: 153,
      total: 178,
      icon: CheckCircle,
      color: SABC_COLORS.success,
      trend: '+15',
      priority: 'normal'
    },
    {
      label: 'Évaluations complètes',
      value: 128,
      total: 153,
      icon: Award,
      color: SABC_COLORS.success,
      trend: '+8',
      priority: 'normal'
    },
    {
      label: 'Délai moyen validation',
      value: 2.5,
      total: 7,
      icon: Activity,
      color: SABC_COLORS.info,
      trend: '-0.5j',
      priority: 'normal'
    },
    {
      label: 'Taux conformité',
      value: 94,
      total: 100,
      icon: Target,
      color: SABC_COLORS.success,
      trend: '+2%',
      priority: 'normal'
    },
    {
      label: 'Superviseurs actifs',
      value: 18,
      total: 20,
      icon: UserCheck,
      color: SABC_COLORS.primary,
      trend: '+1',
      priority: 'normal'
    }
  ];

  // Matrice de compétences globale (radar)
  const globalCompetencyMatrix = [
    { competence: 'Communication', score: 4.2, max: 5 },
    { competence: 'Leadership', score: 3.8, max: 5 },
    { competence: 'Innovation', score: 3.5, max: 5 },
    { competence: 'Organisation', score: 4.1, max: 5 },
    { competence: 'Service Client', score: 4.4, max: 5 },
    { competence: 'Outils Digitaux', score: 3.2, max: 5 },
    { competence: 'Négociation', score: 3.9, max: 5 },
    { competence: 'Planification', score: 4.0, max: 5 }
  ];

  // Performance par type d'évaluation selon règles SABC
  const evaluationTypeData = [
    { type: 'Auto-évaluation', completed: 88, target: 100, score: 3.8 },
    { type: 'Éval. pairs', completed: 75, target: 88, score: 3.6 },
    { type: 'Éval. manager', completed: 82, target: 88, score: 4.1 },
    { type: 'Éval. 360°', completed: 65, target: 88, score: 3.9 }
  ];

  // Analytics utilisateurs actifs
  const userAnalytics = [
    { periode: 'S1', evaluations_donnees: 45, evaluations_recues: 38, connexions: 125 },
    { periode: 'S2', evaluations_donnees: 52, evaluations_recues: 48, connexions: 142 },
    { periode: 'S3', evaluations_donnees: 48, evaluations_recues: 45, connexions: 138 },
    { periode: 'S4', evaluations_donnees: 58, evaluations_recues: 52, connexions: 156 },
    { periode: 'S5', evaluations_donnees: 62, evaluations_recues: 58, connexions: 168 }
  ];

  // Performance par rôle superviseur selon hiérarchie SABC
  const supervisorPerformance = [
    { role: 'DR', evaluations: 45, delai_moyen: 1.2, taux_validation: 98 },
    { role: 'CDTT', evaluations: 38, delai_moyen: 1.8, taux_validation: 95 },
    { role: 'CSC', evaluations: 52, delai_moyen: 2.1, taux_validation: 92 },
    { role: 'RTM', evaluations: 28, delai_moyen: 1.5, taux_validation: 96 },
    { role: 'CDV', evaluations: 35, delai_moyen: 2.8, taux_validation: 88 }
  ];

  // Analyse qualité évaluations (radar chart)
  const qualityMetrics = [
    { critere: 'Complétude', score: 85, max: 100 },
    { critere: 'Cohérence', score: 78, max: 100 },
    { critere: 'Objectivité', score: 92, max: 100 },
    { critere: 'Délai respect', score: 88, max: 100 },
    { critere: 'Commentaires', score: 75, max: 100 },
    { critere: 'Différenciation', score: 82, max: 100 }
  ];

  // Utilisateurs récents avec détails pour vue admin
  const recentUsers = [
    {
      id: 1,
      matricule: 'JPM001',
      nom: 'Jean-Paul Mbarga',
      role: 'Chef de Secteur (CDS)',
      region: 'Littoral',
      branche: 'Commerciale',
      performance_globale: 78,
      evaluations_recues: 3,
      evaluations_donnees: 5,
      pairs_a_evaluer: 2,
      competences: {
        'Communication': 4.2,
        'Service Client': 4.5,
        'Négociation': 2.7,
        'Organisation': 3.8,
        'Outils Digitaux': 2.5
      }
    },
    {
      id: 2,
      matricule: 'SM002',
      nom: 'Sophie Manga',
      role: 'Trade Marketing Operator (TMO)',
      region: 'Centre',
      branche: 'Marketing',
      performance_globale: 85,
      evaluations_recues: 4,
      evaluations_donnees: 3,
      pairs_a_evaluer: 1,
      competences: {
        'Innovation': 4.1,
        'Outils Digitaux': 4.3,
        'Communication': 3.9,
        'Planification': 4.2,
        'Leadership': 3.5
      }
    },
    {
      id: 3,
      matricule: 'RM003',
      nom: 'Robert Manga',
      role: 'Chef de Secteur (CDS)',
      region: 'Ouest',
      branche: 'Commerciale',
      performance_globale: 72,
      evaluations_recues: 2,
      evaluations_donnees: 4,
      pairs_a_evaluer: 3,
      competences: {
        'Service Client': 3.8,
        'Communication': 3.2,
        'Négociation': 4.1,
        'Organisation': 3.5,
        'Leadership': 3.0
      }
    }
  ];

  return (
    <div className="space-y-8">
      {/* Section Métriques de Supervision */}
      <Card className="border border-sabc-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-sabc-gray-900 flex items-center gap-2">
              <Eye className="w-6 h-6 text-sabc-red-primary" />
              Supervision des Évaluations 360°
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Filter className="w-4 h-4" />
                Filtrer
              </Button>
              <Link href="/admin/evaluations/pending" className="flex items-center gap-1 text-sabc-red-primary hover:text-sabc-red-dark">
                <span className="text-sm font-medium">Voir en attente</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* KPIs de supervision - 6 cartes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {supervisionMetrics.map((metric, index) => {
              const IconComponent = metric.icon;
              const priorityColor = metric.priority === 'high' ? 'border-l-red-500' : 
                                  metric.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500';
              return (
                <div key={index} className={`bg-white border border-sabc-gray-200 rounded-lg p-4 border-l-4 ${priorityColor} hover:shadow-md transition-shadow`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: metric.color + '20' }}>
                        <IconComponent className="w-4 h-4" style={{ color: metric.color }} />
                      </div>
                      <div className="text-sm text-sabc-gray-600">{metric.label}</div>
                    </div>
                    <span className={`text-xs font-medium ${metric.trend.startsWith('+') ? 'text-sabc-success' : metric.trend.startsWith('-') ? 'text-sabc-error' : 'text-sabc-gray-600'}`}>
                      {metric.trend}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-sabc-gray-900 mb-2">
                    {metric.label.includes('Délai') ? `${metric.value}j` : metric.value}
                    <span className="text-sm text-sabc-gray-400 ml-1">
                      {metric.label.includes('Délai') ? '/ 7j' : `/ ${metric.total}`}
                    </span>
                  </div>
                  <div className="w-full bg-sabc-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        backgroundColor: metric.color, 
                        width: `${(metric.value / metric.total) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Graphiques de supervision - 3 sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Matrice de compétences globale */}
            <div className="bg-sabc-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-sabc-gray-900 mb-2">Matrice de Compétences Globale</h3>
              <p className="text-sm text-sabc-gray-600 mb-4">Aperçu des compétences organisationnelles</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={globalCompetencyMatrix} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="competence" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10 }} />
                    <Radar name="Score Global" dataKey="score" stroke={SABC_COLORS.primary} fill={SABC_COLORS.primary + '30'} strokeWidth={2} />
                    <Tooltip />
                    <Legend wrapperStyle={{ paddingTop: '5px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance par type d'évaluation */}
            <div className="bg-sabc-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-sabc-gray-900 mb-2">Types d'Évaluation</h3>
              <p className="text-sm text-sabc-gray-600 mb-4">Selon règles métier SABC</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evaluationTypeData} layout="horizontal" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="type" type="category" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip />
                    <Legend wrapperStyle={{ paddingTop: '5px' }} />
                    <Bar dataKey="completed" fill={SABC_COLORS.success} name="Complétées" />
                    <Bar dataKey="target" fill={SABC_COLORS.gray} name="Objectif" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Analytics utilisateurs */}
            <div className="bg-sabc-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-sabc-gray-900 mb-2">Analytics Utilisateurs</h3>
              <p className="text-sm text-sabc-gray-600 mb-4">Activité et engagement</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userAnalytics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis dataKey="periode" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ paddingTop: '5px' }} />
                    <Line type="monotone" dataKey="evaluations_donnees" stroke={SABC_COLORS.primary} strokeWidth={3} name="Évaluations données" />
                    <Line type="monotone" dataKey="evaluations_recues" stroke={SABC_COLORS.success} strokeWidth={2} name="Évaluations reçues" />
                    <Line type="monotone" dataKey="connexions" stroke={SABC_COLORS.info} strokeWidth={2} strokeDasharray="5 5" name="Connexions" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Performance Superviseurs */}
      <Card className="border border-sabc-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-sabc-gray-900 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-sabc-red-primary" />
              Performance des Superviseurs
            </CardTitle>
            <Link href="/admin/supervisors" className="flex items-center gap-1 text-sabc-red-primary hover:text-sabc-red-dark">
              <span className="text-sm font-medium">Gérer superviseurs</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique performance par rôle */}
            <div className="bg-sabc-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-sabc-gray-900 mb-2">Performance par Rôle</h3>
              <p className="text-sm text-sabc-gray-600 mb-4">Hiérarchie SABC - Délais et taux</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={supervisorPerformance} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis dataKey="role" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ paddingTop: '5px' }} />
                    <Area type="monotone" dataKey="taux_validation" stroke={SABC_COLORS.primary} fill={SABC_COLORS.primary + '30'} strokeWidth={3} name="Taux validation %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Analyse qualité - Radar chart */}
            <div className="bg-sabc-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-sabc-gray-900 mb-2">Analyse Qualité</h3>
              <p className="text-sm text-sabc-gray-600 mb-4">Critères d'évaluation</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={qualityMetrics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="critere" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="Score" dataKey="score" stroke={SABC_COLORS.primary} fill={SABC_COLORS.primary + '30'} strokeWidth={2} />
                    <Tooltip />
                    <Legend wrapperStyle={{ paddingTop: '5px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Section Actions de Supervision */}
      <Card className="border border-sabc-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-sabc-gray-900 flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-sabc-red-primary" />
            Actions de Supervision
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/evaluations/pending" className="group">
              <div className="w-full h-20 border border-sabc-gray-200 rounded-lg p-4 hover:border-sabc-red-primary hover:shadow-md transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-sabc-warning" />
                  <div>
                    <div className="font-medium text-sabc-gray-900">En Attente</div>
                    <div className="text-sm text-sabc-gray-600">25 évaluations</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-sabc-gray-400 group-hover:text-sabc-red-primary transition-colors" />
              </div>
            </Link>
            
            <Link href="/admin/evaluations/incomplete" className="group">
              <div className="w-full h-20 border border-sabc-gray-200 rounded-lg p-4 hover:border-sabc-red-primary hover:shadow-md transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-sabc-warning" />
                  <div>
                    <div className="font-medium text-sabc-gray-900">Incomplètes</div>
                    <div className="text-sm text-sabc-gray-600">12 à compléter</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-sabc-gray-400 group-hover:text-sabc-red-primary transition-colors" />
              </div>
            </Link>

            <Link href="/admin/evaluations/reports" className="group">
              <div className="w-full h-20 border border-sabc-gray-200 rounded-lg p-4 hover:border-sabc-red-primary hover:shadow-md transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Download className="w-6 h-6 text-sabc-info" />
                  <div>
                    <div className="font-medium text-sabc-gray-900">Rapports</div>
                    <div className="text-sm text-sabc-gray-600">Exporter</div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-sabc-gray-400 group-hover:text-sabc-red-primary transition-colors" />
              </div>
            </Link>

            <Link href="/admin/evaluations/analytics" className="group">
              <div className="w-full h-20 border border-sabc-gray-200 rounded-lg p-4 hover:border-sabc-red-primary hover:shadow-md transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-sabc-success" />
                  <div>
                    <div className="font-medium text-sabc-gray-900">Analytics</div>
                    <div className="text-sm text-sabc-gray-600">Détaillées</div>
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
