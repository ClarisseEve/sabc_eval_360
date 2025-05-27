import * as React from 'react';
import { EvaluationForm, Skill, EvaluationFormData } from './EvaluationForm';

// Compétences spécifiques au rôle CSC (Chef de Service Commercial)
const cscSkills: Skill[] = [
  // Compétences techniques
  {
    id: 'management-equipes',
    name: 'Techniques de Management des Équipes',
    description: 'Capacité à diriger, motiver et développer une équipe commerciale',
    category: 'Compétences Techniques'
  },
  {
    id: 'commercialisation',
    name: 'Techniques de Commercialisation',
    description: 'Maîtrise des stratégies et techniques de vente et de distribution',
    category: 'Compétences Techniques'
  },
  {
    id: 'conduite-changement',
    name: 'Techniques de Conduite du Changement',
    description: 'Capacité à implémenter et gérer des changements organisationnels',
    category: 'Compétences Techniques'
  },
  
  // Compétences analytiques
  {
    id: 'analyse-donnees',
    name: 'Analyse des Données et Reporting',
    description: 'Capacité à analyser les données commerciales et à produire des rapports pertinents',
    category: 'Compétences Analytiques'
  },
  {
    id: 'analyse-marche',
    name: 'Techniques d\'Analyse du Marché',
    description: 'Capacité à analyser les tendances du marché et la position concurrentielle',
    category: 'Compétences Analytiques'
  },
  {
    id: 'techniques-statistiques',
    name: 'Techniques Statistiques',
    description: 'Maîtrise des méthodes statistiques appliquées à l\'analyse commerciale',
    category: 'Compétences Analytiques'
  },
  
  // Compétences managériales
  {
    id: 'gestion-budgets',
    name: 'Gestion des budgets',
    description: 'Capacité à planifier, allouer et suivre les budgets commerciaux',
    category: 'Compétences Managériales'
  },
  {
    id: 'impliquer-equipes',
    name: 'Capacité d\'impliquer les équipes',
    description: 'Aptitude à engager et mobiliser les équipes vers des objectifs communs',
    category: 'Compétences Managériales'
  },
  
  // Compétences métier
  {
    id: 'connaissance-produit',
    name: 'Connaissance produit',
    description: 'Maîtrise des caractéristiques, avantages et positionnement des produits',
    category: 'Compétences Métier'
  },
  {
    id: 'veille-concurrentielle',
    name: 'Techniques de Veille Concurrentielle',
    description: 'Capacité à surveiller et analyser les activités des concurrents',
    category: 'Compétences Métier'
  },
  
  // Compétences personnelles
  {
    id: 'presentation',
    name: 'Présentation',
    description: 'Qualité de la communication orale et des présentations professionnelles',
    category: 'Compétences Personnelles'
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Efficacité de la communication écrite et verbale avec différents interlocuteurs',
    category: 'Compétences Personnelles'
  },
  {
    id: 'courage-managerial',
    name: 'Courage managérial',
    description: 'Capacité à prendre des décisions difficiles et à les assumer',
    category: 'Compétences Personnelles'
  },
  {
    id: 'leadership',
    name: 'Leadership',
    description: 'Capacité à inspirer et influencer positivement son équipe',
    category: 'Compétences Personnelles'
  }
];

interface CSCEvaluationFormProps {
  evaluation: EvaluationFormData;
  onSaveDraft: (data: EvaluationFormData) => Promise<void>;
  onSubmit: (data: EvaluationFormData) => Promise<void>;
  readOnly?: boolean;
  className?: string;
}

export const CSCEvaluationForm: React.FC<CSCEvaluationFormProps> = ({
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
          Formulaire d'Évaluation CSC : Chef de Service Commercial
        </h2>
        <p className="mt-1 text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
          Veuillez évaluer chaque compétence en sélectionnant un niveau de 1 à 5
        </p>
      </div>
      
      <EvaluationForm
        skills={cscSkills}
        evaluation={evaluation}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
        readOnly={readOnly}
        className={className}
      />
    </div>
  );
};

export default CSCEvaluationForm;
