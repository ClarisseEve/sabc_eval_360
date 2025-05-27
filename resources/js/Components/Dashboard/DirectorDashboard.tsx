import * as React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, TrendingDown, Users, CheckCircle, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/Components/UI/Card/Card';
import { StatusBadge } from '@/Components/UI/Status/StatusBadge';
import { Progress } from '@/Components/UI/Progress/Progress';
import { Avatar } from '@/Components/UI/Avatar/Avatar';
import { Button } from '@/Components/UI/Button/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/UI/Tabs/Tabs';
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
  department: string;
  avatar?: string;
  performanceIndex: number;
  evaluationsCompleted: number;
  evaluationsTotal: number;
  lastEvaluation?: string;
}

export interface DepartmentPerformance {
  name: string;
  commercial: number;
  marketing: number;
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

export interface DirectorDashboardProps {
  user: User;
  stats?: any;
  metrics?: {
    globalPerformance: DashboardMetric;
    commercialPerformance: DashboardMetric;
    marketingPerformance: DashboardMetric;
    evaluationCompletion: DashboardMetric;
  };
  departmentPerformance?: DepartmentPerformance[];
  topPerformers?: TeamMember[];
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

export const DirectorDashboard: React.FC<DirectorDashboardProps> = ({
  user,
  stats,
  metrics = {
    globalPerformance: { value: 0, label: 'Performance Globale' },
    commercialPerformance: { value: 0, label: 'Performance Commercial' },
    marketingPerformance: { value: 0, label: 'Performance Marketing' },
    evaluationCompletion: { value: 0, label: 'Évaluations Complétées' }
  },
  departmentPerformance = [
    { name: 'Littoral', commercial: 78, marketing: 82 },
    { name: 'Centre', commercial: 75, marketing: 70 },
    { name: 'Ouest', commercial: 65, marketing: 68 },
    { name: 'Nord', commercial: 72, marketing: 75 }
  ],
  topPerformers = [],
  pendingEvaluations = [],
  className,
}) => {
  return (
    <div className={className}>
      {/* Métriques principales */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Performance Globale"
          value={metrics.globalPerformance.value}
          previousValue={metrics.globalPerformance.previousValue}
          change={metrics.globalPerformance.change}
          changeType={metrics.globalPerformance.changeType}
          format="percentage"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="default"
        />
        
        <MetricCard
          title="Performance Commercial"
          value={metrics.commercialPerformance.value}
          previousValue={metrics.commercialPerformance.previousValue}
          change={metrics.commercialPerformance.change}
          changeType={metrics.commercialPerformance.changeType}
          format="percentage"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="primary"
        />
        
        <MetricCard
          title="Performance Marketing"
          value={metrics.marketingPerformance.value}
          previousValue={metrics.marketingPerformance.previousValue}
          change={metrics.marketingPerformance.change}
          changeType={metrics.marketingPerformance.changeType}
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
      </div>
      
      {/* Contenu principal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Graphique de performance par département */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance par Département</CardTitle>
            <CardDescription>
              Comparaison des performances entre les services Commercial et Marketing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentPerformance}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, '']}
                    labelFormatter={(label) => `Département: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="commercial" name="Commercial" fill="#E53E3E" />
                  <Bar dataKey="marketing" name="Marketing" fill="#3182CE" />
                </BarChart>
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
                pendingEvaluations.map((evaluation) => (
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
          {pendingEvaluations.length > 0 && (
            <CardFooter>
              <Button className="w-full">
                Voir toutes les actions
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
      
      {/* Top performers */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>
              Collaborateurs avec les meilleures performances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topPerformers.map((member) => (
                <div 
                  key={member.id}
                  className="flex flex-col rounded-md border border-sabc-gray-200 p-4 dark:border-sabc-gray-800"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar 
                      name={member.name}
                      src={member.avatar}
                      size="default"
                    />
                    <div>
                      <p className="font-medium text-sabc-gray-900 dark:text-white">
                        {member.name}
                      </p>
                      <p className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                        {member.role} • {member.department}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-sabc-gray-700 dark:text-sabc-gray-300">
                        Performance
                      </span>
                      <span className="font-medium text-sabc-gray-900 dark:text-white">
                        {member.performanceIndex}%
                      </span>
                    </div>
                    <Progress 
                      value={member.performanceIndex} 
                      variant={
                        member.performanceIndex >= 90 ? 'success' :
                        member.performanceIndex >= 75 ? 'warning' : 'default'
                      }
                      size="sm"
                    />
                    
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
              ))}
            </div>
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

export default DirectorDashboard;
