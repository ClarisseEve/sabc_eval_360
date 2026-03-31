import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle, AlertCircle, Save, Send } from 'lucide-react';
import { cn } from '@/utils/helpers';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/Components/UI/Card/Card';
import { Slider } from '@/Components/UI/Slider/Slider';
import { Progress } from '@/Components/UI/Progress/Progress';
import { StatusBadge } from '@/Components/UI/Status/StatusBadge';

// Types pour les compétences et les évaluations
export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface SkillRating {
  skillId: string;
  rating: number;
  comment?: string;
}

export interface EvaluationFormData {
  id?: string;
  evaluatorId: string;
  evaluatedId: string;
  status: 'draft' | 'submitted' | 'validated' | 'rejected';
  ratings: SkillRating[];
  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string;
  validatedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

// Descriptions des niveaux de compétence
const ratingDescriptions: Record<number, string> = {
  1: 'Niveau insuffisant - Nécessite un accompagnement constant',
  2: 'Niveau basique - Compétence en développement',
  3: 'Niveau intermédiaire - Autonomie sur les tâches courantes',
  4: 'Niveau avancé - Maîtrise complète et peut former les autres',
  5: 'Niveau expert - Référent sur cette compétence'
};

export interface EvaluationFormProps {
  skills: Skill[];
  evaluation: EvaluationFormData;
  onSaveDraft: (data: EvaluationFormData) => Promise<void>;
  onSubmit: (data: EvaluationFormData) => Promise<void>;
  readOnly?: boolean;
  className?: string;
}

export const EvaluationForm: React.FC<EvaluationFormProps> = ({
  skills,
  evaluation,
  onSaveDraft,
  onSubmit,
  readOnly = false,
  className,
}) => {
  const [formData, setFormData] = React.useState<EvaluationFormData>(evaluation);
  const [saving, setSaving] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  
  // Regrouper les compétences par catégorie
  const skillsByCategory = React.useMemo(() => {
    const categories: Record<string, Skill[]> = {};
    
    skills.forEach(skill => {
      if (!categories[skill.category]) {
        categories[skill.category] = [];
      }
      categories[skill.category].push(skill);
    });
    
    return categories;
  }, [skills]);
  
  // Définir la catégorie active par défaut
  React.useEffect(() => {
    if (!activeCategory && Object.keys(skillsByCategory).length > 0) {
      setActiveCategory(Object.keys(skillsByCategory)[0]);
    }
  }, [skillsByCategory, activeCategory]);
  
  // Calculer la progression de l'évaluation
  const progress = React.useMemo(() => {
    if (skills.length === 0) return 0;
    const ratedSkills = formData.ratings.filter(r => r.rating > 0).length;
    return Math.round((ratedSkills / skills.length) * 100);
  }, [formData.ratings, skills.length]);
  
  // Vérifier si tous les champs requis sont remplis
  const isFormValid = React.useMemo(() => {
    // Toutes les compétences doivent être notées
    const allSkillsRated = skills.every(skill => 
      formData.ratings.some(rating => rating.skillId === skill.id && rating.rating > 0)
    );
    
    // Les notes inférieures à 3 doivent avoir un commentaire
    const lowRatingsHaveComments = formData.ratings.every(rating => 
      rating.rating >= 3 || (rating.rating < 3 && rating.comment && rating.comment.trim().length > 0)
    );
    
    return allSkillsRated && lowRatingsHaveComments;
  }, [formData.ratings, skills]);
  
  // Auto-save après modifications
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (autoSaveStatus === 'idle' && formData !== evaluation) {
        handleSaveDraft();
      }
    }, 3000);
    
    return () => clearTimeout(timeoutId);
  }, [formData]);
  
  // Mettre à jour une note
  const handleRatingChange = (skillId: string, rating: number) => {
    if (readOnly) return;
    
    setFormData(prev => {
      const existingRatingIndex = prev.ratings.findIndex(r => r.skillId === skillId);
      
      if (existingRatingIndex >= 0) {
        const updatedRatings = [...prev.ratings];
        updatedRatings[existingRatingIndex] = {
          ...updatedRatings[existingRatingIndex],
          rating
        };
        return { ...prev, ratings: updatedRatings };
      } else {
        return {
          ...prev,
          ratings: [...prev.ratings, { skillId, rating }]
        };
      }
    });
    
    setAutoSaveStatus('idle');
  };
  
  // Mettre à jour un commentaire
  const handleCommentChange = (skillId: string, comment: string) => {
    if (readOnly) return;
    
    setFormData(prev => {
      const existingRatingIndex = prev.ratings.findIndex(r => r.skillId === skillId);
      
      if (existingRatingIndex >= 0) {
        const updatedRatings = [...prev.ratings];
        updatedRatings[existingRatingIndex] = {
          ...updatedRatings[existingRatingIndex],
          comment
        };
        return { ...prev, ratings: updatedRatings };
      } else {
        return {
          ...prev,
          ratings: [...prev.ratings, { skillId, rating: 0, comment }]
        };
      }
    });
    
    setAutoSaveStatus('idle');
  };
  
  // Sauvegarder le brouillon
  const handleSaveDraft = async () => {
    try {
      setAutoSaveStatus('saving');
      setSaving(true);
      await onSaveDraft(formData);
      setAutoSaveStatus('saved');
    } catch (error) {
      setAutoSaveStatus('error');
      console.error('Erreur lors de la sauvegarde du brouillon', error);
    } finally {
      setSaving(false);
      // Réinitialiser le statut après 3 secondes
      setTimeout(() => {
        if (autoSaveStatus === 'saved') {
          setAutoSaveStatus('idle');
        }
      }, 3000);
    }
  };
  
  // Soumettre l'évaluation
  const handleSubmit = async () => {
    if (!isFormValid) return;
    
    try {
      setSubmitting(true);
      await onSubmit({
        ...formData,
        status: 'submitted',
        submittedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur lors de la soumission de l\'évaluation', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Obtenir la note pour une compétence donnée
  const getRatingForSkill = (skillId: string): number => {
    const rating = formData.ratings.find(r => r.skillId === skillId);
    return rating ? rating.rating : 0;
  };
  
  // Obtenir le commentaire pour une compétence donnée
  const getCommentForSkill = (skillId: string): string => {
    const rating = formData.ratings.find(r => r.skillId === skillId);
    return rating?.comment || '';
  };
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* En-tête avec progression et statut */}
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-sabc-gray-900 dark:text-white">
            Évaluation des compétences
          </h2>
          <p className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
            {readOnly 
              ? 'Consultation de l\'évaluation' 
              : 'Évaluez chaque compétence sur une échelle de 1 à 5'}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="mr-2 w-32">
              <Progress 
                value={progress} 
                variant={progress === 100 ? 'success' : 'default'} 
                size="sm"
                showValue
                valuePosition="right"
              />
            </div>
          </div>
          
          <StatusBadge 
            variant={formData.status === 'draft' ? 'draft' : 
                    formData.status === 'submitted' ? 'pending' :
                    formData.status === 'validated' ? 'validated' :
                    'rejected'} 
          />
        </div>
      </div>
      
      {/* Navigation des catégories */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(skillsByCategory).map(category => (
          <Button
            key={category}
            variant={activeCategory === category ? 'default' : 'outline'}
            onClick={() => setActiveCategory(category)}
            className="text-sm"
          >
            {category}
          </Button>
        ))}
      </div>
      
      {/* Formulaire d'évaluation */}
      {activeCategory && skillsByCategory[activeCategory] && (
        <div className="space-y-4">
          {skillsByCategory[activeCategory].map(skill => {
            const rating = getRatingForSkill(skill.id);
            const comment = getCommentForSkill(skill.id);
            const needsComment = rating > 0 && rating < 3;
            
            return (
              <Card key={skill.id} className={cn(
                needsComment && !comment && !readOnly && 'border-sabc-warning bg-sabc-warning/5',
                rating === 0 && !readOnly && 'border-sabc-gray-300 bg-sabc-gray-50'
              )}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{skill.name}</CardTitle>
                      <CardDescription>{skill.description}</CardDescription>
                    </div>
                    {rating > 0 && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sabc-gray-100 text-lg font-bold dark:bg-sabc-gray-800">
                        {rating}
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {!readOnly ? (
                      <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={rating || undefined}
                        onChange={value => handleRatingChange(skill.id, value)}
                        showLabels
                        marks={[
                          { value: 1, label: '1' },
                          { value: 2, label: '2' },
                          { value: 3, label: '3' },
                          { value: 4, label: '4' },
                          { value: 5, label: '5' },
                        ]}
                        tooltip
                        disabled={readOnly}
                      />
                    ) : (
                      <div className="mb-2 flex items-center">
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-sabc-gray-200 dark:bg-sabc-gray-800">
                          <div 
                            className="h-full rounded-full bg-sabc-red-primary dark:bg-sabc-red-400" 
                            style={{ width: `${(rating / 5) * 100}%` }}
                          />
                        </div>
                        <span className="ml-2 text-sm font-medium">{rating}/5</span>
                      </div>
                    )}
                    
                    {rating > 0 && (
                      <div className="rounded-md bg-sabc-gray-50 p-2 text-sm text-sabc-gray-700 dark:bg-sabc-gray-800/50 dark:text-sabc-gray-300">
                        {ratingDescriptions[rating]}
                      </div>
                    )}
                    
                    {(needsComment || comment || readOnly) && (
                      <div>
                        <label 
                          htmlFor={`comment-${skill.id}`} 
                          className="mb-1 block text-sm font-medium text-sabc-gray-700 dark:text-sabc-gray-300"
                        >
                          {needsComment && !readOnly ? (
                            <span className="flex items-center text-sabc-warning">
                              <AlertCircle className="mr-1 h-4 w-4" />
                              Commentaire obligatoire pour les notes inférieures à 3
                            </span>
                          ) : 'Commentaire (optionnel)'}
                        </label>
                        {readOnly ? (
                          <div className="rounded-md border border-sabc-gray-200 bg-sabc-gray-50 p-3 text-sm dark:border-sabc-gray-700 dark:bg-sabc-gray-800/50">
                            {comment || 'Aucun commentaire'}
                          </div>
                        ) : (
                          <textarea
                            id={`comment-${skill.id}`}
                            value={comment}
                            onChange={e => handleCommentChange(skill.id, e.target.value)}
                            className={cn(
                              'w-full rounded-md border border-sabc-gray-300 p-2 text-sm focus:border-sabc-red-primary focus:outline-none focus:ring-1 focus:ring-sabc-red-primary dark:border-sabc-gray-700 dark:bg-sabc-gray-800 dark:text-white',
                              needsComment && !comment && 'border-sabc-warning bg-sabc-warning/5'
                            )}
                            rows={3}
                            placeholder={needsComment ? 'Veuillez expliquer votre évaluation (obligatoire)' : 'Commentaire optionnel'}
                            disabled={readOnly}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Pied de page avec actions */}
      {!readOnly && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {autoSaveStatus === 'saving' && (
              <span className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                Sauvegarde en cours...
              </span>
            )}
            {autoSaveStatus === 'saved' && (
              <span className="flex items-center text-sm text-sabc-success">
                <CheckCircle className="mr-1 h-4 w-4" />
                Sauvegardé
              </span>
            )}
            {autoSaveStatus === 'error' && (
              <span className="flex items-center text-sm text-sabc-error">
                <AlertCircle className="mr-1 h-4 w-4" />
                Erreur de sauvegarde
              </span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saving || submitting}
            >
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || submitting || saving}
            >
              <Send className="mr-2 h-4 w-4" />
              Soumettre
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationForm;
