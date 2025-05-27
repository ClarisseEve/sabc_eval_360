import * as React from 'react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend
} from 'recharts';
import { Users, CheckCircle, Clock, AlertCircle, TrendingUp, TrendingDown, Award, BookOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/Components/UI/Card/Card';
import { StatusBadge } from '@/Components/UI/Status/StatusBadge';
import { Progress } from '@/Components/UI/Progress/Progress';
import { Avatar } from '@/Components/UI/Avatar/Avatar';
import { Button } from '@/Components/UI/Button/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/UI/Tabs/Tabs';
import { formatDate, cn, formatPercentage } from '@/utils/helpers';

// Types pour les données du tableau de bord
export interface SkillRadarData {
  skill: string;
  value: number;
  fullMark: number;
}

export interface PerformanceHistory {
  date: string;
  value: number;
}

export interface PeerEvaluation {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  dueDate: string;
  isCompleted: boolean;
  isOverdue: boolean;
}

export interface TrainingRecommendation {
  id: string;
  title: string;
  skillCategory: string;
  duration: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  region: string;
  department: string;
  avatar?: string;
}

export interface OperationalDashboardProps {
  user: User;
  stats?: any;
  userProfile?: {
    name: string;
    role: string;
    department: string;
    avatar?: string;
    performanceIndex: number;
    rank?: string;
    improvementRate?: number;
  };
  skillsRadarData?: SkillRadarData[];
  performanceHistory?: PerformanceHistory[];
  peerEvaluations?: PeerEvaluation[];
  trainingRecommendations?: TrainingRecommendation[];
  className?: string;
}

export const OperationalDashboard: React.FC<OperationalDashboardProps> = ({
  user,
  stats,
  userProfile = {
    name: user?.name || 'Utilisateur',
    role: user?.role || 'CDS',
    department: user?.department || user?.region || 'Département',
    avatar: user?.avatar,
    performanceIndex: 75,
    rank: 'Collaborateur Prometteur',
    improvementRate: 12
  },
  skillsRadarData = [
    { skill: 'Leadership', value: 70, fullMark: 100 },
    { skill: 'Communication', value: 80, fullMark: 100 },
    { skill: 'Analyse', value: 65, fullMark: 100 },
    { skill: 'Innovation', value: 60, fullMark: 100 },
    { skill: 'Travail d\'équipe', value: 85, fullMark: 100 }
  ],
  performanceHistory = [
    { date: 'Jan', value: 65 },
    { date: 'Fév', value: 68 },
    { date: 'Mar', value: 72 },
    { date: 'Avr', value: 70 },
    { date: 'Mai', value: 75 },
    { date: 'Juin', value: 78 }
  ],
  peerEvaluations = [],
  trainingRecommendations = [],
  className,
}) => {
  // Filtrer les évaluations par état
  const pendingEvaluations = peerEvaluations.filter(evaluation => !evaluation.isCompleted);
  const completedEvaluations = peerEvaluations.filter(evaluation => evaluation.isCompleted);
  
  // Calculer le pourcentage d'évaluations complétées
  const evaluationCompletionRate = peerEvaluations.length > 0
    ? (completedEvaluations.length / peerEvaluations.length) * 100
    : 0;
  
  return (
    <div className={className}>
      {/* Profil de l'utilisateur */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center space-x-4">
              <Avatar 
                name={userProfile.name}
                src={userProfile.avatar}
                size="lg"
              />
              <div>
                <h2 className="text-2xl font-bold text-sabc-gray-900 dark:text-white">
                  {userProfile.name}
                </h2>
                <p className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                  {userProfile.role} • {userProfile.department}
                </p>
                {userProfile.rank && (
                  <div className="mt-1 flex items-center">
                    <Award className="mr-1 h-4 w-4 text-sabc-accent" />
                    <span className="text-sm font-medium text-sabc-accent">
                      {userProfile.rank}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex w-full flex-col space-y-2 md:w-auto md:min-w-[200px]">
              <div className="flex items-center justify-between">
                <span className="text-sm text-sabc-gray-700 dark:text-sabc-gray-300">
                  Performance
                </span>
                <span className="font-medium text-sabc-gray-900 dark:text-white">
                  {userProfile.performanceIndex}%
                </span>
              </div>
              <Progress 
                value={userProfile.performanceIndex} 
                variant={
                  userProfile.performanceIndex >= 90 ? 'success' :
                  userProfile.performanceIndex >= 75 ? 'warning' :
                  userProfile.performanceIndex >= 60 ? 'info' : 'error'
                }
              />
              
              {userProfile.improvementRate !== undefined && (
                <div className="flex items-center text-xs">
                  {userProfile.improvementRate > 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3 text-sabc-success" />
                  ) : userProfile.improvementRate < 0 ? (
                    <TrendingDown className="mr-1 h-3 w-3 text-sabc-error" />
                  ) : null}
                  
                  <span className={
                    userProfile.improvementRate > 0 ? 'text-sabc-success' :
                    userProfile.improvementRate < 0 ? 'text-sabc-error' :
                    'text-sabc-gray-500 dark:text-sabc-gray-400'
                  }>
                    {userProfile.improvementRate > 0 ? '+' : ''}
                    {userProfile.improvementRate}% vs période précédente
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Contenu principal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Radar des compétences */}
        <Card>
          <CardHeader>
            <CardTitle>Profil de Compétences</CardTitle>
            <CardDescription>
              Évaluation de vos compétences par catégorie
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={90} data={skillsRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar
                    name="Compétences"
                    dataKey="value"
                    stroke="#E53E3E"
                    fill="#E53E3E"
                    fillOpacity={0.6}
                  />
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Historique de performance */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution de Performance</CardTitle>
            <CardDescription>
              Progression de votre performance sur les 6 derniers mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={performanceHistory}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Performance']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name="Performance" 
                    stroke="#E53E3E" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Évaluations par les pairs */}
      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Évaluations par les Pairs</CardTitle>
              <CardDescription>
                Évaluations à compléter et statut
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex h-9 items-center rounded-md bg-sabc-gray-100 px-3 dark:bg-sabc-gray-800">
                <span className="text-sm font-medium text-sabc-gray-900 dark:text-white">
                  {completedEvaluations.length}/{peerEvaluations.length} complétées
                </span>
              </div>
              <Progress 
                value={evaluationCompletionRate} 
                variant={
                  evaluationCompletionRate === 100 ? 'success' :
                  evaluationCompletionRate >= 75 ? 'info' :
                  evaluationCompletionRate >= 50 ? 'warning' : 'error'
                }
                className="w-24"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" variant="card">
              <TabsList>
                <TabsTrigger value="pending">
                  À compléter ({pendingEvaluations.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Complétées ({completedEvaluations.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending">
                <div className="mt-4 space-y-4">
                  {pendingEvaluations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-sabc-gray-300 bg-sabc-gray-50 p-6 text-center dark:border-sabc-gray-700 dark:bg-sabc-gray-800/50">
                      <CheckCircle className="mb-2 h-8 w-8 text-sabc-success" />
                      <p className="text-sm font-medium text-sabc-gray-900 dark:text-white">
                        Toutes les évaluations sont complétées
                      </p>
                      <p className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                        Vous avez terminé toutes vos évaluations par les pairs
                      </p>
                    </div>
                  ) : (
                    pendingEvaluations.map((evaluation) => (
                      <div 
                        key={evaluation.id}
                        className={`flex items-center justify-between rounded-md border p-4 ${
                          evaluation.isOverdue 
                            ? 'border-sabc-error/20 bg-sabc-error/5 dark:border-sabc-error/30 dark:bg-sabc-error/10' 
                            : 'border-sabc-gray-200 dark:border-sabc-gray-800'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar 
                            name={evaluation.name}
                            src={evaluation.avatar}
                            size="default"
                          />
                          <div>
                            <p className="font-medium text-sabc-gray-900 dark:text-white">
                              {evaluation.name}
                            </p>
                            <p className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                              {evaluation.role}
                            </p>
                            <div className="mt-1 flex items-center">
                              <Clock className="mr-1 h-3 w-3 text-sabc-gray-500 dark:text-sabc-gray-400" />
                              <span className={`text-xs ${
                                evaluation.isOverdue 
                                  ? 'text-sabc-error' 
                                  : 'text-sabc-gray-500 dark:text-sabc-gray-400'
                              }`}>
                                {evaluation.isOverdue ? 'En retard - ' : ''}
                                Échéance: {formatDate(evaluation.dueDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button>
                          Évaluer
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="completed">
                <div className="mt-4 space-y-4">
                  {completedEvaluations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-sabc-gray-300 bg-sabc-gray-50 p-6 text-center dark:border-sabc-gray-700 dark:bg-sabc-gray-800/50">
                      <AlertCircle className="mb-2 h-8 w-8 text-sabc-warning" />
                      <p className="text-sm font-medium text-sabc-gray-900 dark:text-white">
                        Aucune évaluation complétée
                      </p>
                      <p className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                        Vous n'avez pas encore complété d'évaluation
                      </p>
                    </div>
                  ) : (
                    completedEvaluations.map((evaluation) => (
                      <div 
                        key={evaluation.id}
                        className="flex items-center justify-between rounded-md border border-sabc-gray-200 p-4 dark:border-sabc-gray-800"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar 
                            name={evaluation.name}
                            src={evaluation.avatar}
                            size="default"
                          />
                          <div>
                            <p className="font-medium text-sabc-gray-900 dark:text-white">
                              {evaluation.name}
                            </p>
                            <p className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                              {evaluation.role}
                            </p>
                            <div className="mt-1 flex items-center">
                              <CheckCircle className="mr-1 h-3 w-3 text-sabc-success" />
                              <span className="text-xs text-sabc-success">
                                Complétée le {formatDate(evaluation.dueDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline">
                          Voir
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Recommandations de formation */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5 text-sabc-info" />
              Plan de Développement
            </CardTitle>
            <CardDescription>
              Formations recommandées basées sur votre profil de compétences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trainingRecommendations.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-sabc-gray-300 bg-sabc-gray-50 p-6 text-center dark:border-sabc-gray-700 dark:bg-sabc-gray-800/50">
                  <Award className="mb-2 h-8 w-8 text-sabc-success" />
                  <p className="text-sm font-medium text-sabc-gray-900 dark:text-white">
                    Aucune formation recommandée
                  </p>
                  <p className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                    Votre profil de compétences est complet
                  </p>
                </div>
              ) : (
                trainingRecommendations.map((training) => (
                  <div 
                    key={training.id}
                    className="rounded-md border border-sabc-gray-200 p-4 dark:border-sabc-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center">
                          <p className="font-medium text-sabc-gray-900 dark:text-white">
                            {training.title}
                          </p>
                          <StatusBadge 
                            variant={
                              training.priority === 'high' ? 'error' :
                              training.priority === 'medium' ? 'warning' : 'info'
                            }
                            className="ml-2"
                          >
                            {training.priority === 'high' ? 'Prioritaire' :
                             training.priority === 'medium' ? 'Recommandé' : 'Optionnel'}
                          </StatusBadge>
                        </div>
                        <p className="mt-1 text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                          Catégorie: {training.skillCategory} • Durée: {training.duration}
                        </p>
                      </div>
                      <StatusBadge 
                        variant={
                          training.status === 'completed' ? 'success' :
                          training.status === 'in_progress' ? 'warning' : 'draft'
                        }
                      >
                        {training.status === 'completed' ? 'Terminée' :
                         training.status === 'in_progress' ? 'En cours' : 'À faire'}
                      </StatusBadge>
                    </div>
                    
                    <div className="mt-3 flex justify-end">
                      <Button 
                        variant={training.status === 'pending' ? 'default' : 'outline'}
                        size="sm"
                      >
                        {training.status === 'pending' ? 'Commencer' : 
                         training.status === 'in_progress' ? 'Continuer' : 'Détails'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          {trainingRecommendations.length > 0 && (
            <CardFooter>
              <Button variant="outline" className="w-full">
                Voir tout le plan de développement
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};

export default OperationalDashboard;
