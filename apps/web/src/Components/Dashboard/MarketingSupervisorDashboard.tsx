import * as React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { TrendingUp, TrendingDown, Users, CheckCircle, Target, AlertCircle, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/Components/UI/Card/Card';
import { StatusBadge } from '@/Components/UI/Status/StatusBadge';
import { Progress } from '@/Components/UI/Progress/Progress';
import { Avatar } from '@/Components/UI/Avatar/Avatar';
import { Button } from '@/Components/UI/Button/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/UI/Tabs/Tabs';
import { formatDate, cn, formatPercentage } from '@/utils/helpers';
import { EvaluationStats } from '@/Components/Dashboard/EvaluationStats';

// Types pour les données du tableau de bord
export interface DashboardMetric {
  label: string;
  value: number;
  previousValue?: number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  format?: 'percentage' | 'number';
}

export interface MarketingTeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  performance: number;
  campaignsCompleted: number;
  campaignsTotal: number;
  evaluationsCompleted: number;
  evaluationsTotal: number;
  lastEvaluation?: string;
}

export interface CampaignPerformance {
  name: string;
  impact: number;
  budget: number;
  roi: number;
}

// Import du type User depuis types/index.d.ts
import { User as BaseUser } from '@/types';

// Extension du type User pour les besoins spécifiques du dashboard
export interface User extends BaseUser {
  // Tous les champs sont déjà présents dans BaseUser
}

export interface MarketingSupervisorDashboardProps {
  user: User;
  stats?: any;
  metrics?: {
    teamPerformance: DashboardMetric;
    campaignEffectiveness: DashboardMetric;
    evaluationCompletion: DashboardMetric;
    budgetUtilization: DashboardMetric;
  };
  campaignPerformance?: CampaignPerformance[];
  marketingTeam?: MarketingTeamMember[];
  pendingEvaluations?: {
    id: string;
    evaluatedName: string;
    evaluatedRole: string;
    evaluatedAvatar?: string;
    dueDate: string;
    isOverdue: boolean;
  }[];
  skillsRadar?: {
    skill: string;
    value: number;
    fullMark: number;
  }[];
  className?: string;
}

export const MarketingSupervisorDashboard: React.FC<MarketingSupervisorDashboardProps> = ({
  user,
  stats,
  metrics = {
    teamPerformance: { value: 0, label: 'Performance Équipe' },
    campaignEffectiveness: { value: 0, label: 'Efficacité Campagnes' },
    evaluationCompletion: { value: 0, label: 'Évaluations Complétées' },
    budgetUtilization: { value: 0, label: 'Utilisation Budget' }
  },
  campaignPerformance = [
    { name: 'Campagne A', impact: 85, budget: 75, roi: 113 },
    { name: 'Campagne B', impact: 78, budget: 65, roi: 120 },
    { name: 'Campagne C', impact: 90, budget: 85, roi: 106 },
    { name: 'Campagne D', impact: 82, budget: 70, roi: 117 }
  ],
  marketingTeam = [],
  pendingEvaluations = [],
  skillsRadar = [
    { skill: 'Créativité', value: 85, fullMark: 100 },
    { skill: 'Analyse', value: 75, fullMark: 100 },
    { skill: 'Communication', value: 90, fullMark: 100 },
    { skill: 'Planification', value: 80, fullMark: 100 },
    { skill: 'Exécution', value: 85, fullMark: 100 }
  ],
  className,
}) => {
  // Couleurs pour les graphiques
  const COLORS = ['#E53E3E', '#48BB78', '#3182CE', '#D69E2E', '#9E9E9E'];
  
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
          title="Efficacité Campagnes"
          value={metrics.campaignEffectiveness.value}
          previousValue={metrics.campaignEffectiveness.previousValue}
          change={metrics.campaignEffectiveness.change}
          changeType={metrics.campaignEffectiveness.changeType}
          format="percentage"
          icon={<Award className="h-5 w-5" />}
          variant="info"
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
          title="Utilisation Budget"
          value={metrics.budgetUtilization.value}
          previousValue={metrics.budgetUtilization.previousValue}
          change={metrics.budgetUtilization.change}
          changeType={metrics.budgetUtilization.changeType}
          format="percentage"
          icon={<Target className="h-5 w-5" />}
          variant="warning"
        />
      </div>
      
      {/* Graphiques et tableaux */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Performance des campagnes */}
        <Card>
          <CardHeader>
            <CardTitle>Performance des Campagnes</CardTitle>
            <CardDescription>Impact, budget et ROI par campagne</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={campaignPerformance}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="impact" name="Impact" fill="#E53E3E" />
                  <Bar dataKey="budget" name="Budget" fill="#3182CE" />
                  <Bar dataKey="roi" name="ROI" fill="#48BB78" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Compétences de l'équipe */}
        <Card>
          <CardHeader>
            <CardTitle>Compétences de l'Équipe</CardTitle>
            <CardDescription>Évaluation des compétences marketing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsRadar}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Compétences"
                    dataKey="value"
                    stroke="#E53E3E"
                    fill="#E53E3E"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Équipe et évaluations */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Membres de l'équipe */}
        <Card>
          <CardHeader>
            <CardTitle>Équipe Marketing</CardTitle>
            <CardDescription>Performance et progression</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {marketingTeam.map((member, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <Avatar 
                    name={member.name} 
                    src={member.avatar} 
                    size="lg"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sabc-gray-900 dark:text-white">{member.name}</h4>
                        <p className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">{member.role}</p>
                      </div>
                      <StatusBadge 
                        variant={member.performance >= 85 ? 'success' : member.performance >= 70 ? 'warning' : 'error'}
                      >
                        {member.performance}%
                      </StatusBadge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-sabc-gray-700 dark:text-sabc-gray-300">
                          Campagnes
                        </span>
                        <span className="font-medium text-sabc-gray-900 dark:text-white">
                          {member.campaignsCompleted}/{member.campaignsTotal}
                        </span>
                      </div>
                      <Progress 
                        value={(member.campaignsCompleted / member.campaignsTotal) * 100} 
                        variant={
                          (member.campaignsCompleted / member.campaignsTotal) >= 0.9 ? 'success' : 
                          (member.campaignsCompleted / member.campaignsTotal) >= 0.7 ? 'warning' : 
                          'error'
                        }
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-sabc-gray-700 dark:text-sabc-gray-300">
                          Évaluations
                        </span>
                        <span className="font-medium text-sabc-gray-900 dark:text-white">
                          {member.evaluationsCompleted}/{member.evaluationsTotal}
                        </span>
                      </div>
                      <Progress 
                        value={(member.evaluationsCompleted / member.evaluationsTotal) * 100} 
                        variant="info"
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {marketingTeam.length === 0 && (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-sabc-gray-500 dark:text-sabc-gray-400">
                    Aucun membre d'équipe à afficher
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Évaluations en attente */}
        <Card>
          <CardHeader>
            <CardTitle>Évaluations en Attente</CardTitle>
            <CardDescription>Évaluations à compléter</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingEvaluations.length > 0 ? (
              <div className="space-y-4">
                {pendingEvaluations.map((evaluation, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between rounded-md border border-sabc-gray-200 p-4 dark:border-sabc-gray-800"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar 
                        name={evaluation.evaluatedName} 
                        src={evaluation.evaluatedAvatar} 
                        size="sm"
                      />
                      <div>
                        <h4 className="font-medium text-sabc-gray-900 dark:text-white">
                          {evaluation.evaluatedName}
                        </h4>
                        <p className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                          {evaluation.evaluatedRole}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-sabc-gray-900 dark:text-white">
                          Échéance
                        </p>
                        <p className={cn(
                          "text-sm",
                          evaluation.isOverdue ? "text-sabc-error" : "text-sabc-gray-500 dark:text-sabc-gray-400"
                        )}>
                          {evaluation.dueDate}
                          {evaluation.isOverdue && " (En retard)"}
                        </p>
                      </div>
                      
                      <Button size="sm" variant="default">
                        Évaluer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center">
                <p className="text-sabc-gray-500 dark:text-sabc-gray-400">
                  Aucune évaluation en attente
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
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

export default MarketingSupervisorDashboard;
