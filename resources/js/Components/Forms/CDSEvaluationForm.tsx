import * as React from 'react';
import { EvaluationForm, Skill, EvaluationFormData } from './EvaluationForm';

// Compétences spécifiques au rôle CDS (Chef de Secteur)
const cdsSkills: Skill[] = [
  // Compétences techniques
  {
    id: 'connaissance-produit',
    name: 'Connaissance du produit',
    description: 'Maîtrise des caractéristiques, avantages et positionnement des produits SABC',
    category: 'Compétences Techniques'
  },
  {
    id: 'techniques-ventes',
    name: 'Techniques de ventes',
    description: 'Maîtrise des méthodes et techniques de vente sur le terrain',
    category: 'Compétences Techniques'
  },
  {
    id: 'negociation-commerciale',
    name: 'Négociation commerciale',
    description: 'Capacité à négocier efficacement avec les clients et points de vente',
    category: 'Compétences Techniques'
  },
  
  // Compétences analytiques
  {
    id: 'analyses-donnees',
    name: 'Analyses des données',
    description: 'Capacité à analyser les données de vente du secteur',
    category: 'Compétences Analytiques'
  },
  {
    id: 'competence-reporting',
    name: 'Compétence en Reporting',
    description: 'Aptitude à produire des rapports précis et pertinents',
    category: 'Compétences Analytiques'
  },
  {
    id: 'outils-analyse',
    name: 'Utilisation des Outils d\'Analyse des Données',
    description: 'Maîtrise des outils informatiques d\'analyse commerciale',
    category: 'Compétences Analytiques'
  },
  {
    id: 'analyse-marche',
    name: 'Analyse du Marché et de la Concurrence',
    description: 'Capacité à comprendre et analyser le marché local et les concurrents',
    category: 'Compétences Analytiques'
  },
  
  // Compétences organisationnelles
  {
    id: 'gestion-temps',
    name: 'Gestion du temps',
    description: 'Organisation efficace des tournées et des activités quotidiennes',
    category: 'Compétences Organisationnelles'
  },
  {
    id: 'organisation-informations',
    name: 'Organisation des Informations',
    description: 'Capacité à structurer et classer les informations commerciales',
    category: 'Compétences Organisationnelles'
  },
  {
    id: 'organisation-travail',
    name: 'Organisation du Travail',
    description: 'Planification et exécution méthodique des tâches commerciales',
    category: 'Compétences Organisationnelles'
  },
  {
    id: 'suivi-animation-ventes',
    name: 'Suivi et Animation des Ventes',
    description: 'Capacité à suivre les performances et à stimuler les ventes',
    category: 'Compétences Organisationnelles'
  },
  {
    id: 'gestion-priorites',
    name: 'Gestion des Priorités',
    description: 'Aptitude à identifier et traiter les actions prioritaires',
    category: 'Compétences Organisationnelles'
  },
  
  // Compétences relationnelles
  {
    id: 'relation-client',
    name: 'Relation Client',
    description: 'Qualité des interactions et de la fidélisation des clients',
    category: 'Compétences Relationnelles'
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Clarté et efficacité de la communication avec les clients et l\'équipe',
    category: 'Compétences Relationnelles'
  },
  {
    id: 'esprit-equipe',
    name: 'Esprit d\'Équipe',
    description: 'Capacité à collaborer et contribuer positivement à l\'équipe',
    category: 'Compétences Relationnelles'
  }
];

interface CDSEvaluationFormProps {
  evaluation: EvaluationFormData;
  onSaveDraft: (data: EvaluationFormData) => Promise<void>;
  onSubmit: (data: EvaluationFormData) => Promise<void>;
  readOnly?: boolean;
  className?: string;
}

export const CDSEvaluationForm: React.FC<CDSEvaluationFormProps> = ({
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
          Formulaire d'Évaluation CDS : Chef de Secteur
        </h2>
        <p className="mt-1 text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
          Veuillez évaluer chaque compétence en sélectionnant un niveau de 1 à 5
        </p>
      </div>
      
      <EvaluationForm
        skills={cdsSkills}
        evaluation={evaluation}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
        readOnly={readOnly}
        className={className}
      />
    </div>
  );
};

export default CDSEvaluationForm;
