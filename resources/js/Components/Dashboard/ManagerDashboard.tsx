import * as React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { Users, CheckCircle, Clock, AlertCircle, TrendingUp, TrendingDown, Award, Target } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/Components/UI/Card/Card';
import { StatusBadge } from '@/Components/UI/Status/StatusBadge';
import { Progress } from '@/Components/UI/Progress/Progress';
import { Avatar } from '@/Components/UI/Avatar/Avatar';
import { Button } from '@/Components/UI/Button/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/Components/UI/Table/Table';
import { formatDate, cn, formatPercentage } from '@/utils/helpers';

// Types pour les données du tableau de bord
export interface DashboardMetric {
  label: string;
  value: number;
  previousValue?: number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  format?: 'percentage' | 'number';
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  performanceIndex: number;
  evaluationsCompleted: number;
  evaluationsTotal: number;
  lastEvaluation?: string;
  skillGaps?: {
    skillName: string;
    currentLevel: number;
    targetLevel: number;
  }[];
}

export interface PerformanceTrend {
  month: string;
  teamAverage: number;
  topPerformer: number;
  bottomPerformer: number;
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

export interface ManagerDashboardProps {
  user: User;
  stats?: any;
  metrics?: {
    teamPerformance: DashboardMetric;
    evaluationCompletion: DashboardMetric;
    improvementRate: DashboardMetric;
    talentRetention: DashboardMetric;
  };
  performanceTrends?: PerformanceTrend[];
  teamMembers?: TeamMember[];
  pendingEvaluations?: {
    id: string;
    evaluatedName: string;
    evaluatedRole: string;
    evaluatedAvatar?: string;
    dueDate: string;
    isOverdue: boolean;
  }[];
  className?: string;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  user,
  stats,
  metrics = {
    teamPerformance: { value: 0, label: 'Performance Équipe' },
    evaluationCompletion: { value: 0, label: 'Évaluations Complétées' },
    improvementRate: { value: 0, label: 'Taux d\'Amélioration' },
    talentRetention: { value: 0, label: 'Rétention Talents' }
  },
  performanceTrends = [
    { month: 'Jan', teamAverage: 72, topPerformer: 85, bottomPerformer: 60 },
    { month: 'Fév', teamAverage: 74, topPerformer: 87, bottomPerformer: 62 },
    { month: 'Mar', teamAverage: 78, topPerformer: 90, bottomPerformer: 65 },
    { month: 'Avr', teamAverage: 75, topPerformer: 88, bottomPerformer: 63 },
    { month: 'Mai', teamAverage: 80, topPerformer: 92, bottomPerformer: 68 },
    { month: 'Juin', teamAverage: 82, topPerformer: 95, bottomPerformer: 70 }
  ],
  teamMembers = [],
  pendingEvaluations = [],
  className,
}) => {
  // Trier les membres de l'équipe par indice de performance (décroissant)
  const sortedTeamMembers = [...teamMembers].sort((a, b) => b.performanceIndex - a.performanceIndex);
  
  // Identifier les membres nécessitant une attention particulière (performance < 70%)
  const membersNeedingAttention = teamMembers.filter(member => member.performanceIndex < 70);
  
  return (
    <div className={className}>
      {/* Métriques principales */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Performance Équipe"
          value={metrics.teamPerformance.value}
          previousValue={metrics.teamPerformance.previousValue}
          change={metrics.teamPerformance.change}
          changeType={metrics.teamPerformance.changeType}
          format="percentage"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="primary"
        />
        
        <MetricCard
          title="Évaluations Complétées"
          value={metrics.evaluationCompletion.value}
          previousValue={metrics.evaluationCompletion.previousValue}
          change={metrics.evaluationCompletion.change}
          changeType={metrics.evaluationCompletion.changeType}
          format="percentage"
          icon={<CheckCircle className="h-5 w-5" />}
          variant="success"
        />
        
        <MetricCard
          title="Taux d'Amélioration"
          value={metrics.improvementRate.value}
          previousValue={metrics.improvementRate.previousValue}
          change={metrics.improvementRate.change}
          changeType={metrics.improvementRate.changeType}
          format="percentage"
          icon={<Target className="h-5 w-5" />}
          variant="info"
        />
        
        <MetricCard
          title="Rétention Talents"
          value={metrics.talentRetention.value}
          previousValue={metrics.talentRetention.previousValue}
          change={metrics.talentRetention.change}
          changeType={metrics.talentRetention.changeType}
          format="percentage"
          icon={<Award className="h-5 w-5" />}
          variant="warning"
        />
      </div>
      
      {/* Contenu principal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Graphique de tendance de performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tendance de Performance</CardTitle>
            <CardDescription>
              Évolution de la performance de l'équipe sur les 6 derniers mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={performanceTrends}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="topPerformer" 
                    name="Top Performer" 
                    stroke="#48BB78" 
                    fill="#48BB78" 
                    fillOpacity={0.2} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="teamAverage" 
                    name="Moyenne Équipe" 
                    stroke="#E53E3E" 
                    fill="#E53E3E" 
                    fillOpacity={0.2} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="bottomPerformer" 
                    name="Bottom Performer" 
                    stroke="#9E9E9E" 
                    fill="#9E9E9E" 
                    fillOpacity={0.2} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Évaluations en attente */}
        <Card>
          <CardHeader>
            <CardTitle>Actions Requises</CardTitle>
            <CardDescription>
              Évaluations en attente de votre attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingEvaluations.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-sabc-gray-300 bg-sabc-gray-50 p-4 text-center dark:border-sabc-gray-700 dark:bg-sabc-gray-800/50">
                  <CheckCircle className="mb-2 h-8 w-8 text-sabc-success" />
                  <p className="text-sm font-medium text-sabc-gray-900 dark:text-white">
                    Aucune action requise
                  </p>
                  <p className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                    Toutes les évaluations sont à jour
                  </p>
                </div>
              ) : (
                pendingEvaluations.slice(0, 4).map((evaluation) => (
                  <div 
                    key={evaluation.id}
                    className="flex items-center justify-between rounded-md border border-sabc-gray-200 p-3 dark:border-sabc-gray-800"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar 
                        name={evaluation.evaluatedName}
                        src={evaluation.evaluatedAvatar}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium text-sabc-gray-900 dark:text-white">
                          {evaluation.evaluatedName}
                        </p>
                        <p className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                          {evaluation.evaluatedRole}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <StatusBadge 
                        variant={evaluation.isOverdue ? 'error' : 'pending'}
                        withDot
                      >
                        {evaluation.isOverdue ? 'En retard' : 'En attente'}
                      </StatusBadge>
                      <p className="mt-1 flex items-center text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                        <Clock className="mr-1 h-3 w-3" />
                        {formatDate(evaluation.dueDate)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          {pendingEvaluations.length > 4 && (
            <CardFooter>
              <Button className="w-full">
                Voir toutes les actions ({pendingEvaluations.length})
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
      
      {/* Tableau de l'équipe */}
      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Performance de l'Équipe</CardTitle>
              <CardDescription>
                Vue d'ensemble des performances et des évaluations
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Users className="mr-2 h-4 w-4" />
              Gérer l'équipe
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collaborateur</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Évaluations</TableHead>
                  <TableHead>Dernière Évaluation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTeamMembers.map((member, index) => (
                  <TableRow key={member.id} isEven={index % 2 === 1}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar 
                          name={member.name}
                          src={member.avatar}
                          size="sm"
                          variant={
                            member.performanceIndex >= 90 ? 'success' :
                            member.performanceIndex >= 75 ? 'warning' :
                            member.performanceIndex >= 60 ? 'info' : 'error'
                          }
                        />
                        <div>
                          <p className="font-medium text-sabc-gray-900 dark:text-white">
                            {member.name}
                          </p>
                          <p className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                            {member.role}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-sabc-gray-900 dark:text-white">
                            {member.performanceIndex}%
                          </span>
                        </div>
                        <Progress 
                          value={member.performanceIndex} 
                          variant={
                            member.performanceIndex >= 90 ? 'success' :
                            member.performanceIndex >= 75 ? 'warning' :
                            member.performanceIndex >= 60 ? 'info' : 'error'
                          }
                          size="sm"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-sabc-gray-900 dark:text-white">
                            {member.evaluationsCompleted}/{member.evaluationsTotal}
                          </span>
                        </div>
                        <Progress 
                          value={(member.evaluationsCompleted / member.evaluationsTotal) * 100} 
                          variant="info"
                          size="sm"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.lastEvaluation ? (
                        <span className="text-sm text-sabc-gray-700 dark:text-sabc-gray-300">
                          {formatDate(member.lastEvaluation)}
                        </span>
                      ) : (
                        <span className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                          Aucune
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        Détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Collaborateurs nécessitant une attention */}
      {membersNeedingAttention.length > 0 && (
        <div className="mt-6">
          <Card className="border-sabc-warning/20 bg-sabc-warning/5 dark:border-sabc-warning/30 dark:bg-sabc-warning/10">
            <CardHeader>
              <CardTitle className="flex items-center text-sabc-warning">
                <AlertCircle className="mr-2 h-5 w-5" />
                Attention Requise
              </CardTitle>
              <CardDescription>
                Collaborateurs nécessitant un accompagnement particulier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {membersNeedingAttention.map((member) => (
                  <div 
                    key={member.id}
                    className="rounded-md border border-sabc-warning/20 bg-white p-4 dark:border-sabc-warning/30 dark:bg-sabc-gray-900"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar 
                          name={member.name}
                          src={member.avatar}
                          size="default"
                          variant="error"
                        />
                        <div>
                          <p className="font-medium text-sabc-gray-900 dark:text-white">
                            {member.name}
                          </p>
                          <p className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                            {member.role}
                          </p>
                          <div className="mt-1 flex items-center">
                            <span className="text-sm font-medium text-sabc-error">
                              Performance: {member.performanceIndex}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Plan d'action
                      </Button>
                    </div>
                    
                    {member.skillGaps && member.skillGaps.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-medium text-sabc-gray-900 dark:text-white">
                          Compétences à développer:
                        </p>
                        <div className="space-y-2">
                          {member.skillGaps.map((skill, index) => (
                            <div key={index} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-sabc-gray-700 dark:text-sabc-gray-300">
                                  {skill.skillName}
                                </span>
                                <span className="text-xs font-medium text-sabc-gray-900 dark:text-white">
                                  {skill.currentLevel}/5 → {skill.targetLevel}/5
                                </span>
                              </div>
                              <div className="relative h-2 w-full overflow-hidden rounded-full bg-sabc-gray-200 dark:bg-sabc-gray-800">
                                <div 
                                  className="absolute h-full rounded-full bg-sabc-error dark:bg-sabc-error" 
                                  style={{ width: `${(skill.currentLevel / 5) * 100}%` }}
                                />
                                <div 
                                  className="absolute h-full rounded-full border-r-2 border-dashed border-sabc-success dark:border-sabc-success" 
                                  style={{ width: `${(skill.targetLevel / 5) * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Composant pour les cartes de métriques
interface MetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  format?: 'percentage' | 'number';
  icon?: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  previousValue,
  change,
  changeType = 'neutral',
  format = 'number',
  icon,
  variant = 'default',
}) => {
  const formattedValue = format === 'percentage' ? `${value}%` : value;
  
  const changeColors = {
    positive: 'text-sabc-success',
    negative: 'text-sabc-error',
    neutral: 'text-sabc-gray-500 dark:text-sabc-gray-400',
  };
  
  const variantStyles = {
    default: 'border-sabc-gray-200 dark:border-sabc-gray-800',
    primary: 'border-sabc-red-primary/20 bg-sabc-red-primary/5 dark:border-sabc-red-primary/30 dark:bg-sabc-red-primary/10',
    success: 'border-sabc-success/20 bg-sabc-success/5 dark:border-sabc-success/30 dark:bg-sabc-success/10',
    warning: 'border-sabc-warning/20 bg-sabc-warning/5 dark:border-sabc-warning/30 dark:bg-sabc-warning/10',
    error: 'border-sabc-error/20 bg-sabc-error/5 dark:border-sabc-error/30 dark:bg-sabc-error/10',
    info: 'border-sabc-info/20 bg-sabc-info/5 dark:border-sabc-info/30 dark:bg-sabc-info/10',
  };
  
  const iconColors = {
    default: 'text-sabc-gray-500 dark:text-sabc-gray-400',
    primary: 'text-sabc-red-primary dark:text-sabc-red-400',
    success: 'text-sabc-success dark:text-sabc-success',
    warning: 'text-sabc-warning dark:text-sabc-warning',
    error: 'text-sabc-error dark:text-sabc-error',
    info: 'text-sabc-info dark:text-sabc-info',
  };
  
  return (
    <Card className={variantStyles[variant]}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-sabc-gray-500 dark:text-sabc-gray-400">
            {title}
          </p>
          {icon && (
            <div className={`rounded-full p-2 ${iconColors[variant]}`}>
              {icon}
            </div>
          )}
        </div>
        
        <div className="mt-2">
          <p className="text-3xl font-bold text-sabc-gray-900 dark:text-white">
            {formattedValue}
          </p>
          
          {change !== undefined && (
            <div className="mt-1 flex items-center">
              {changeType === 'positive' ? (
                <TrendingUp className="mr-1 h-4 w-4 text-sabc-success" />
              ) : changeType === 'negative' ? (
                <TrendingDown className="mr-1 h-4 w-4 text-sabc-error" />
              ) : null}
              
              <p className={`text-sm ${changeColors[changeType]}`}>
                {change > 0 ? '+' : ''}{format === 'percentage' ? `${change}%` : change}
                {previousValue !== undefined && (
                  <span className="ml-1 text-sabc-gray-500 dark:text-sabc-gray-400">
                    vs période précédente
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ManagerDashboard;
