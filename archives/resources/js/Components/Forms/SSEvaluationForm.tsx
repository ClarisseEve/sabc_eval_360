import * as React from 'react';
import { EvaluationForm, Skill, EvaluationFormData } from './EvaluationForm';

// Compétences spécifiques au rôle SS (Superviseur Sponsoring)
// Ces compétences seront complétées ultérieurement
const ssSkills: Skill[] = [
  // Placeholder pour les compétences qui seront ajoutées ultérieurement
  {
    id: 'placeholder-1',
    name: 'Compétence à définir',
    description: 'Description à compléter',
    category: 'Catégorie à définir'
  }
];

interface SSEvaluationFormProps {
  evaluation: EvaluationFormData;
  onSaveDraft: (data: EvaluationFormData) => Promise<void>;
  onSubmit: (data: EvaluationFormData) => Promise<void>;
  readOnly?: boolean;
  className?: string;
}

export const SSEvaluationForm: React.FC<SSEvaluationFormProps> = ({
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
          Formulaire d'Évaluation SS : Superviseur Sponsoring
        </h2>
        <p className="mt-1 text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
          Veuillez évaluer chaque compétence en sélectionnant un niveau de 1 à 5
        </p>
      </div>
      
      <div className="rounded-md border border-sabc-accent-light bg-sabc-accent-light/10 p-4 text-sabc-accent">
        <p>Ce formulaire sera complété ultérieurement avec les compétences spécifiques au rôle SS.</p>
      </div>
      
      <EvaluationForm
        skills={ssSkills}
        evaluation={evaluation}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
        readOnly={readOnly}
        className={className}
      />
    </div>
  );
};

export default SSEvaluationForm;
