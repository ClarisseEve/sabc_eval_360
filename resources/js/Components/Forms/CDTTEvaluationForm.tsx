import * as React from 'react';
import { EvaluationForm, Skill, EvaluationFormData } from './EvaluationForm';

// Compétences spécifiques au rôle CDTT (Chef Département Tanière et Territoire)
// À compléter lorsque le formulaire sera disponible
const cdttSkills: Skill[] = [
  // Placeholder pour les compétences qui seront ajoutées ultérieurement
  {
    id: 'placeholder',
    name: 'Compétence à définir',
    description: 'Description à définir',
    category: 'Catégorie à définir'
  }
];

interface CDTTEvaluationFormProps {
  evaluation: EvaluationFormData;
  onSaveDraft: (data: EvaluationFormData) => Promise<void>;
  onSubmit: (data: EvaluationFormData) => Promise<void>;
  readOnly?: boolean;
  className?: string;
}

export const CDTTEvaluationForm: React.FC<CDTTEvaluationFormProps> = ({
  evaluation,
  onSaveDraft,
  onSubmit,
  readOnly = false,
  className,
}) => {
  return (
    <div className="space-y-6">
      <div className="rounded-md bg-white p-4 shadow-sm dark:bg-sabc-gray-800">
        <h2 className="text-xl font-semibold text-sabc-gray-900 dark:text-white">
          Formulaire d'Évaluation CDTT : Chef Département Tanière et Territoire
        </h2>
        <p className="mt-1 text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
          Veuillez évaluer chaque compétence en sélectionnant un niveau de 1 à 5
        </p>
      </div>
      
      <EvaluationForm
        skills={cdttSkills}
        evaluation={evaluation}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
        readOnly={readOnly}
        className={className}
      />
    </div>
  );
};

export default CDTTEvaluationForm;
