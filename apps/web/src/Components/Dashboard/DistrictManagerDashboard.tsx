import * as React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { TrendingUp, TrendingDown, Users, CheckCircle, Target, AlertCircle } from 'lucide-react';
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

export interface SalesPerson {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  performance: number;
  salesTarget: number;
  salesAchieved: number;
  evaluationsCompleted: number;
  evaluationsTotal: number;
  lastEvaluation?: string;
}

export interface SalesPerformance {
  month: string;
  target: number;
  achieved: number;
}

// Import du type User depuis types/index.d.ts
import { User as BaseUser } from '@/types';

// Extension du type User pour les besoins spécifiques du dashboard
export interface User extends BaseUser {
  district?: string; // Rendu optionnel pour être compatible avec BaseUser
}

export interface DistrictManagerDashboardProps {
  user: User;
  stats?: any;
  metrics?: {
    districtPerformance: DashboardMetric;
    salesPerformance: DashboardMetric;
    evaluationCompletion: DashboardMetric;
    targetAchievement: DashboardMetric;
  };
  salesTrends?: SalesPerformance[];
  salesTeam?: SalesPerson[];
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

export const DistrictManagerDashboard: React.FC<DistrictManagerDashboardProps> = ({
  user,
  stats,
  metrics = {
    districtPerformance: { value: 0, label: 'Performance District' },
    salesPerformance: { value: 0, label: 'Performance Ventes' },
    evaluationCompletion: { value: 0, label: 'Évaluations Complétées' },
    targetAchievement: { value: 0, label: 'Objectifs Atteints' }
  },
  salesTrends = [
    { month: 'Jan', target: 100, achieved: 85 },
    { month: 'Fév', target: 100, achieved: 90 },
    { month: 'Mar', target: 100, achieved: 95 },
    { month: 'Avr', target: 100, achieved: 88 },
    { month: 'Mai', target: 100, achieved: 92 },
    { month: 'Juin', target: 100, achieved: 97 }
  ],
  salesTeam = [],
  pendingEvaluations = [],
  className,
}) => {
  return (
    <div className={className}>
      {/* Métriques principales */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Performance District"
          value={metrics.districtPerformance.value}
          previousValue={metrics.districtPerformance.previousValue}
          change={metrics.districtPerformance.change}
          changeType={metrics.districtPerformance.changeType}
          format="percentage"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="default"
        />
        
        <MetricCard
          title="Performance Ventes"
          value={metrics.salesPerformance.value}
          previousValue={metrics.salesPerformance.previousValue}
          change={metrics.salesPerformance.change}
          changeType={metrics.salesPerformance.changeType}
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
          title="Objectifs Atteints"
          value={metrics.targetAchievement.value}
          previousValue={metrics.targetAchievement.previousValue}
          change={metrics.targetAchievement.change}
          changeType={metrics.targetAchievement.changeType}
          format="percentage"
          icon={<Target className="h-5 w-5" />}
          variant="info"
        />
      </div>
      
      {/* Graphiques et tableaux */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tendances des ventes */}
        <Card>
          <CardHeader>
            <CardTitle>Tendances des Ventes</CardTitle>
            <CardDescription>Performance mensuelle vs objectifs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={salesTrends}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E53E3E" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#E53E3E" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAchieved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#48BB78" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#48BB78" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#E53E3E" 
                    fillOpacity={1} 
                    fill="url(#colorTarget)" 
                    name="Objectif"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="achieved" 
                    stroke="#48BB78" 
                    fillOpacity={1} 
                    fill="url(#colorAchieved)" 
                    name="Réalisé"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Performance de l'équipe */}
        <Card>
          <CardHeader>
            <CardTitle>Performance de l'Équipe</CardTitle>
            <CardDescription>Progression des objectifs de vente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {salesTeam.map((member, index) => (
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
                          Ventes
                        </span>
                        <span className="font-medium text-sabc-gray-900 dark:text-white">
                          {formatPercentage(member.salesAchieved / member.salesTarget * 100)}
                        </span>
                      </div>
                      <Progress 
                        value={(member.salesAchieved / member.salesTarget) * 100} 
                        variant={
                          (member.salesAchieved / member.salesTarget) >= 0.9 ? 'success' : 
                          (member.salesAchieved / member.salesTarget) >= 0.7 ? 'warning' : 
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
              
              {salesTeam.length === 0 && (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-sabc-gray-500 dark:text-sabc-gray-400">
                    Aucun membre d'équipe à afficher
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Évaluations en attente */}
      <div className="mb-6">
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

export default DistrictManagerDashboard;
