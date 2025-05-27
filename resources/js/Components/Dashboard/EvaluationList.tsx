import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, AlertCircle, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/Components/UI/Card/Card';
import { StatusBadge } from '@/Components/UI/Status/StatusBadge';
import { Avatar } from '@/Components/UI/Avatar/Avatar';
import { Button } from '@/Components/UI/Button/Button';
import { Progress } from '@/Components/UI/Progress/Progress';
import { Skeleton } from '@/Components/UI/Skeleton/Skeleton';
import { cn, formatDate } from '@/utils/helpers';

export interface Evaluation {
  id: string;
  evaluatedId: string;
  evaluatedName: string;
  evaluatedRole: string;
  evaluatedDepartment: string;
  evaluatedAvatar?: string;
  status: 'draft' | 'submitted' | 'validated' | 'rejected' | 'overdue';
  dueDate: string;
  progress: number;
  createdAt: string;
  updatedAt?: string;
}

export interface EvaluationListProps {
  title?: string;
  description?: string;
  evaluations: Evaluation[];
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  loading?: boolean;
  showProgress?: boolean;
  onViewEvaluation?: (evaluationId: string) => void;
  onEditEvaluation?: (evaluationId: string) => void;
  className?: string;
}

export const EvaluationList: React.FC<EvaluationListProps> = ({
  title = "Évaluations à compléter",
  description = "Liste des évaluations en attente",
  evaluations,
  emptyMessage = "Aucune évaluation en attente",
  emptyIcon = <CheckCircle className="h-8 w-8 text-sabc-success" />,
  loading = false,
  showProgress = true,
  onViewEvaluation,
  onEditEvaluation,
  className,
}) => {
  // Fonction pour obtenir la couleur de la bordure en fonction du statut
  const getBorderColor = (status: Evaluation['status']) => {
    switch (status) {
      case 'draft':
        return 'border-sabc-gray-200 dark:border-sabc-gray-800';
      case 'submitted':
        return 'border-sabc-accent/20 dark:border-sabc-accent/30';
      case 'validated':
        return 'border-sabc-success/20 dark:border-sabc-success/30';
      case 'rejected':
        return 'border-sabc-error/20 dark:border-sabc-error/30';
      case 'overdue':
        return 'border-sabc-error/20 dark:border-sabc-error/30';
      default:
        return 'border-sabc-gray-200 dark:border-sabc-gray-800';
    }
  };
  
  // Fonction pour obtenir le libellé du statut
  const getStatusLabel = (status: Evaluation['status']) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'submitted': return 'Soumise';
      case 'validated': return 'Validée';
      case 'rejected': return 'Rejetée';
      case 'overdue': return 'En retard';
      default: return status;
    }
  };
  
  // Fonction pour obtenir la variante du badge de statut
  const getStatusVariant = (status: Evaluation['status']): 'draft' | 'pending' | 'validated' | 'rejected' | 'error' => {
    switch (status) {
      case 'draft': return 'draft';
      case 'submitted': return 'pending';
      case 'validated': return 'validated';
      case 'rejected': return 'rejected';
      case 'overdue': return 'error';
      default: return 'draft';
    }
  };
  
  // Fonction pour obtenir l'action principale en fonction du statut
  const getPrimaryAction = (evaluation: Evaluation) => {
    if (evaluation.status === 'draft' && onEditEvaluation) {
      return (
        <Button 
          onClick={() => onEditEvaluation(evaluation.id)}
          size="sm"
        >
          Continuer
        </Button>
      );
    }
    
    if (onViewEvaluation) {
      return (
        <Button 
          onClick={() => onViewEvaluation(evaluation.id)}
          variant="outline"
          size="sm"
        >
          Consulter
        </Button>
      );
    }
    
    return null;
  };
  
  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        {loading ? (
          // État de chargement
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-md border border-sabc-gray-200 p-4 dark:border-sabc-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton variant="avatar" />
                    <div className="space-y-2">
                      <Skeleton width={150} height={20} />
                      <Skeleton width={100} height={16} />
                    </div>
                  </div>
                  <Skeleton width={80} height={28} />
                </div>
                {showProgress && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton width={80} height={16} />
                      <Skeleton width={40} height={16} />
                    </div>
                    <Skeleton height={8} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : evaluations.length === 0 ? (
          // État vide
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-sabc-gray-300 bg-sabc-gray-50 p-6 text-center dark:border-sabc-gray-700 dark:bg-sabc-gray-800/50">
            {emptyIcon}
            <p className="mt-2 text-sm font-medium text-sabc-gray-900 dark:text-white">
              {emptyMessage}
            </p>
          </div>
        ) : (
          // Liste des évaluations
          <div className="space-y-4">
            {evaluations.map((evaluation) => (
              <div 
                key={evaluation.id}
                className={cn(
                  "rounded-md border p-4",
                  getBorderColor(evaluation.status)
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar 
                      name={evaluation.evaluatedName}
                      src={evaluation.evaluatedAvatar}
                      size="default"
                    />
                    <div>
                      <p className="font-medium text-sabc-gray-900 dark:text-white">
                        {evaluation.evaluatedName}
                      </p>
                      <p className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                        {evaluation.evaluatedRole} • {evaluation.evaluatedDepartment}
                      </p>
                      <div className="mt-1 flex items-center">
                        <StatusBadge 
                          variant={getStatusVariant(evaluation.status)}
                          withDot
                          className="mr-2"
                        >
                          {getStatusLabel(evaluation.status)}
                        </StatusBadge>
                        
                        <span className="flex items-center text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                          <Clock className="mr-1 h-3 w-3" />
                          {evaluation.status === 'overdue' ? 'Échéance dépassée: ' : 'Échéance: '}
                          {formatDate(evaluation.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {getPrimaryAction(evaluation)}
                </div>
                
                {showProgress && evaluation.status === 'draft' && (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                        Progression
                      </span>
                      <span className="text-xs font-medium text-sabc-gray-900 dark:text-white">
                        {evaluation.progress}%
                      </span>
                    </div>
                    <Progress 
                      value={evaluation.progress} 
                      variant={
                        evaluation.progress === 100 ? 'success' :
                        evaluation.progress >= 50 ? 'info' : 'default'
                      }
                      size="sm"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {evaluations.length > 0 && (
        <CardFooter>
          <Button variant="outline" className="w-full" size="sm">
            Voir toutes les évaluations
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default EvaluationList;
