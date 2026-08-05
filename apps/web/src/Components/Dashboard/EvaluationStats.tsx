import * as React from 'react';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/Components/UI/Card/Card';
import { Progress } from '@/Components/UI/Progress/Progress';
import { Button } from '@/Components/UI/Button/Button';
import { Skeleton } from '@/Components/UI/Skeleton/Skeleton';
import { cn } from '@/utils/helpers';

export interface StatItem {
  label: string;
  value: number;
  previousValue?: number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  format?: 'percentage' | 'number';
  icon?: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
}

export interface EvaluationStatsProps {
  title?: string;
  description?: string;
  stats: StatItem[];
  loading?: boolean;
  layout?: 'grid' | 'row';
  columns?: 2 | 3 | 4;
  showFooter?: boolean;
  footerAction?: () => void;
  footerLabel?: string;
  className?: string;
}

// Type étendu pour inclure la propriété icons statique
interface EvaluationStatsComponent extends React.FC<EvaluationStatsProps> {
  icons: {
    Performance: React.ReactElement;
    Completion: React.ReactElement;
    Pending: React.ReactElement;
    Alert: React.ReactElement;
    Team: React.ReactElement;
  };
}

export const EvaluationStats: EvaluationStatsComponent = ({
  title,
  description,
  stats,
  loading = false,
  layout = 'grid',
  columns = 4,
  showFooter = false,
  footerAction,
  footerLabel = "Voir les détails",
  className,
}) => {
  // Fonction pour formater la valeur selon le format spécifié
  const formatValue = (value: number, format?: 'percentage' | 'number') => {
    return format === 'percentage' ? `${value}%` : value;
  };
  
  // Fonction pour obtenir les classes de couleur pour le changement
  const getChangeClasses = (changeType?: 'positive' | 'negative' | 'neutral') => {
    switch (changeType) {
      case 'positive': return 'text-sabc-success';
      case 'negative': return 'text-sabc-error';
      default: return 'text-sabc-gray-500 dark:text-sabc-gray-400';
    }
  };
  
  // Fonction pour obtenir les classes de style pour la variante
  const getVariantClasses = (variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info') => {
    switch (variant) {
      case 'primary':
        return 'border-sabc-red-primary/20 bg-sabc-red-primary/5 dark:border-sabc-red-primary/30 dark:bg-sabc-red-primary/10';
      case 'success':
        return 'border-sabc-success/20 bg-sabc-success/5 dark:border-sabc-success/30 dark:bg-sabc-success/10';
      case 'warning':
        return 'border-sabc-warning/20 bg-sabc-warning/5 dark:border-sabc-warning/30 dark:bg-sabc-warning/10';
      case 'error':
        return 'border-sabc-error/20 bg-sabc-error/5 dark:border-sabc-error/30 dark:bg-sabc-error/10';
      case 'info':
        return 'border-sabc-info/20 bg-sabc-info/5 dark:border-sabc-info/30 dark:bg-sabc-info/10';
      default:
        return 'border-sabc-gray-200 dark:border-sabc-gray-800';
    }
  };
  
  // Fonction pour obtenir les classes de couleur pour l'icône
  const getIconClasses = (variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info') => {
    switch (variant) {
      case 'primary': return 'text-sabc-red-primary dark:text-sabc-red-400';
      case 'success': return 'text-sabc-success dark:text-sabc-success';
      case 'warning': return 'text-sabc-warning dark:text-sabc-warning';
      case 'error': return 'text-sabc-error dark:text-sabc-error';
      case 'info': return 'text-sabc-info dark:text-sabc-info';
      default: return 'text-sabc-gray-500 dark:text-sabc-gray-400';
    }
  };
  
  // Déterminer les classes de grille en fonction du nombre de colonnes
  const getGridClasses = () => {
    switch (columns) {
      case 2: return 'grid-cols-1 sm:grid-cols-2';
      case 3: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    }
  };
  
  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        {loading ? (
          // État de chargement
          <div className={cn(
            layout === 'grid' ? `grid ${getGridClasses()} gap-4` : 'flex flex-wrap gap-4'
          )}>
            {Array.from({ length: columns }).map((_, index) => (
              <div 
                key={index}
                className={cn(
                  "rounded-md border border-sabc-gray-200 p-4 dark:border-sabc-gray-800",
                  layout === 'row' && "flex-1 min-w-[200px]"
                )}
              >
                <div className="flex items-center justify-between">
                  <Skeleton width={100} height={16} />
                  <Skeleton width={24} height={24} className="rounded-full" />
                </div>
                <div className="mt-2">
                  <Skeleton width={80} height={32} />
                  <div className="mt-1">
                    <Skeleton width={120} height={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Affichage des statistiques
          <div className={cn(
            layout === 'grid' ? `grid ${getGridClasses()} gap-4` : 'flex flex-wrap gap-4'
          )}>
            {stats.map((stat, index) => (
              <div 
                key={index}
                className={cn(
                  "rounded-md border p-5",
                  getVariantClasses(stat.variant),
                  layout === 'row' && "flex-1 min-w-[200px]"
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-sabc-gray-500 dark:text-sabc-gray-400">
                    {stat.label}
                  </p>
                  {stat.icon && (
                    <div className={cn(
                      "rounded-full bg-sabc-red-primary/10 p-3",
                      getIconClasses(stat.variant)
                    )}>
                      {stat.icon}
                    </div>
                  )}
                </div>
                
                <div className="mt-2">
                  <p className="text-2xl font-bold text-sabc-gray-900 dark:text-white">
                    {formatValue(stat.value, stat.format)}
                  </p>
                  
                  {stat.change !== undefined && (
                    <div className="mt-1 flex items-center">
                      {stat.changeType === 'positive' ? (
                        <TrendingUp className="mr-1 h-4 w-4 text-sabc-success" />
                      ) : stat.changeType === 'negative' ? (
                        <TrendingDown className="mr-1 h-4 w-4 text-sabc-error" />
                      ) : null}
                      
                      <p className={cn(
                        "text-sm",
                        getChangeClasses(stat.changeType)
                      )}>
                        {stat.change > 0 ? '+' : ''}{formatValue(stat.change, stat.format)}
                        {stat.previousValue !== undefined && (
                          <span className="ml-1 text-sabc-gray-500 dark:text-sabc-gray-400">
                            vs période précédente
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {showFooter && (
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={footerAction}
          >
            {footerLabel}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

// Composants prédéfinis pour les icônes courantes
EvaluationStats.icons = {
  Performance: <TrendingUp className="h-5 w-5" />,
  Completion: <CheckCircle className="h-5 w-5" />,
  Pending: <Clock className="h-5 w-5" />,
  Alert: <AlertCircle className="h-5 w-5" />,
  Team: <Users className="h-5 w-5" />,
};

export default EvaluationStats as React.FC<EvaluationStatsProps>;
