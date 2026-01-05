import * as React from 'react';
import { EvaluationForm, Skill, EvaluationFormData } from './EvaluationForm';

// Compétences spécifiques au rôle CDV (Chef de District Vente)
const cdvSkills: Skill[] = [
  // Compétences techniques
  {
    id: 'management-equipes',
    name: 'Techniques de Management des Équipes',
    description: 'Capacité à diriger, motiver et développer une équipe de vente au niveau district',
    category: 'Compétences Techniques'
  },
  {
    id: 'commercialisation',
    name: 'Techniques de Commercialisation',
    description: 'Maîtrise des stratégies et techniques de vente adaptées au district',
    category: 'Compétences Techniques'
  },
  {
    id: 'marketing',
    name: 'Techniques de Marketing',
    description: 'Capacité à appliquer les stratégies marketing au niveau local',
    category: 'Compétences Techniques'
  },
  {
    id: 'vente-negociation',
    name: 'Techniques de Vente et de Négociation',
    description: 'Maîtrise des techniques de négociation et de closing avec les clients',
    category: 'Compétences Techniques'
  },
  
  // Compétences analytiques
  {
    id: 'analyse-donnees',
    name: 'Analyse des Données et Reporting',
    description: 'Capacité à analyser les données de vente et à produire des rapports pertinents',
    category: 'Compétences Analytiques'
  },
  {
    id: 'analyse-marche',
    name: 'Techniques d\'Analyse du Marché',
    description: 'Capacité à analyser les tendances du marché local et la position concurrentielle',
    category: 'Compétences Analytiques'
  },
  {
    id: 'techniques-statistiques',
    name: 'Techniques Statistiques',
    description: 'Maîtrise des méthodes statistiques pour l\'analyse des performances de vente',
    category: 'Compétences Analytiques'
  },
  
  // Compétences organisationnelles
  {
    id: 'planification-methode',
    name: 'Sens de la Planification et de la Méthode',
    description: 'Capacité à planifier et organiser les activités de vente du district',
    category: 'Compétences Organisationnelles'
  },
  {
    id: 'gestion-temps',
    name: 'Gestion du temps',
    description: 'Efficacité dans la gestion des priorités et du temps de l\'équipe',
    category: 'Compétences Organisationnelles'
  },
  {
    id: 'gestion-priorites',
    name: 'Gestion des priorités',
    description: 'Capacité à identifier et prioriser les actions à forte valeur ajoutée',
    category: 'Compétences Organisationnelles'
  },
  {
    id: 'organisation-informations',
    name: 'Organisation des informations',
    description: 'Aptitude à structurer et partager efficacement l\'information commerciale',
    category: 'Compétences Organisationnelles'
  },
  
  // Compétences de leadership
  {
    id: 'capacite-influencer',
    name: 'Capacité à influencer',
    description: 'Aptitude à convaincre et à obtenir l\'adhésion de l\'équipe et des partenaires',
    category: 'Compétences Leadership'
  },
  {
    id: 'force-conviction',
    name: 'Force de conviction',
    description: 'Capacité à défendre ses idées et à persuader les autres',
    category: 'Compétences Leadership'
  },
  {
    id: 'leadership',
    name: 'Leadership',
    description: 'Capacité à guider et inspirer son équipe vers l\'atteinte des objectifs',
    category: 'Compétences Leadership'
  },
  {
    id: 'leadership-inspirationnel',
    name: 'Leadership inspirationnel',
    description: 'Capacité à créer une vision et à motiver l\'équipe à se dépasser',
    category: 'Compétences Leadership'
  },
  
  // Compétences relationnelles
  {
    id: 'partage-connaissances',
    name: 'Partage des connaissances et compétences',
    description: 'Volonté et capacité à transmettre son savoir et développer les autres',
    category: 'Compétences Relationnelles'
  },
  {
    id: 'respect-ecoute',
    name: 'Respect et écoute des opinions des autres',
    description: 'Capacité à prendre en compte les avis et suggestions de l\'équipe',
    category: 'Compétences Relationnelles'
  },
  
  // Compétences métier
  {
    id: 'connaissance-produit',
    name: 'Connaissance produit',
    description: 'Maîtrise des caractéristiques et avantages des produits SABC',
    category: 'Compétences Métier'
  },
  {
    id: 'veille-concurrentielle',
    name: 'Techniques de Veille Concurrentielle',
    description: 'Capacité à surveiller et analyser les activités des concurrents dans le district',
    category: 'Compétences Métier'
  }
];

interface CDVEvaluationFormProps {
  evaluation: EvaluationFormData;
  onSaveDraft: (data: EvaluationFormData) => Promise<void>;
  onSubmit: (data: EvaluationFormData) => Promise<void>;
  readOnly?: boolean;
  className?: string;
}

export const CDVEvaluationForm: React.FC<CDVEvaluationFormProps> = ({
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
          Formulaire d'Évaluation CDV : Chef de District Vente
        </h2>
        <p className="mt-1 text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
          Veuillez évaluer chaque compétence en sélectionnant un niveau de 1 à 5
        </p>
      </div>
      
      <EvaluationForm
        skills={cdvSkills}
        evaluation={evaluation}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
        readOnly={readOnly}
        className={className}
      />
    </div>
  );
};

export default CDVEvaluationForm;
