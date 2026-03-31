import { Skill } from './EvaluationForm';

// Type pour les rôles supportés
export type EvaluationRole = 'CDS' | 'CDV' | 'CSC' | 'CDTT' | 'RTM' | 'TMO' | 'SRMO' | 'SS' | 'AS';

// Configuration des titres et descriptions par rôle
export const roleConfig: Record<EvaluationRole, { title: string; description: string }> = {
  CDS: {
    title: "Formulaire d'Évaluation CDS : Chef de Secteur",
    description: 'Veuillez évaluer chaque compétence en sélectionnant un niveau de 1 à 5'
  },
  CDV: {
    title: "Formulaire d'Évaluation CDV : Chef de District de Vente",
    description: 'Veuillez évaluer chaque compétence en sélectionnant un niveau de 1 à 5'
  },
  CSC: {
    title: "Formulaire d'Évaluation CSC : Chef de Service Commercial",
    description: 'Veuillez évaluer chaque compétence en sélectionnant un niveau de 1 à 5'
  },
  CDTT: {
    title: "Formulaire d'Évaluation CDTT : Chef Département Tanière et Territoire",
    description: 'Veuillez évaluer chaque compétence en sélectionnant un niveau de 1 à 5'
  },
  RTM: {
    title: "Formulaire d'Évaluation RTM : Responsable Trade Marketing",
    description: 'Veuillez évaluer chaque compétence en sélectionnant un niveau de 1 à 5'
  },
  TMO: {
    title: "Formulaire d'Évaluation TMO : Trade Marketing Officer",
    description: 'Veuillez évaluer chaque compétence en sélectionnant un niveau de 1 à 5'
  },
  SRMO: {
    title: "Formulaire d'Évaluation SRMO : Senior Route Marketing Officer",
    description: 'Veuillez évaluer chaque compétence en sélectionnant un niveau de 1 à 5'
  },
  SS: {
    title: "Formulaire d'Évaluation SS : Superviseur Sponsoring",
    description: 'Veuillez évaluer chaque compétence en sélectionnant un niveau de 1 à 5'
  },
  AS: {
    title: "Formulaire d'Évaluation AS : Assistant Superviseur Sponsoring",
    description: 'Veuillez évaluer chaque compétence en sélectionnant un niveau de 1 à 5'
  }
};

// Compétences par rôle
export const skillsByRole: Record<EvaluationRole, Skill[]> = {
  CDS: [
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
      name: "Utilisation des Outils d'Analyse des Données",
      description: "Maîtrise des outils informatiques d'analyse commerciale",
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
      description: "Clarté et efficacité de la communication avec les clients et l'équipe",
      category: 'Compétences Relationnelles'
    },
    {
      id: 'esprit-equipe',
      name: "Esprit d'Équipe",
      description: "Capacité à collaborer et contribuer positivement à l'équipe",
      category: 'Compétences Relationnelles'
    }
  ],

  CSC: [
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
      name: "Techniques d'Analyse du Marché",
      description: 'Capacité à analyser les tendances du marché et la position concurrentielle',
      category: 'Compétences Analytiques'
    },
    {
      id: 'techniques-statistiques',
      name: 'Techniques Statistiques',
      description: "Maîtrise des méthodes statistiques appliquées à l'analyse commerciale",
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
      name: "Capacité d'impliquer les équipes",
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
  ],

  // Placeholders pour les autres rôles - à compléter
  CDV: [
    {
      id: 'placeholder',
      name: 'Compétence à définir',
      description: 'Description à définir',
      category: 'Catégorie à définir'
    }
  ],

  CDTT: [
    {
      id: 'placeholder',
      name: 'Compétence à définir',
      description: 'Description à définir',
      category: 'Catégorie à définir'
    }
  ],

  RTM: [
    {
      id: 'placeholder',
      name: 'Compétence à définir',
      description: 'Description à définir',
      category: 'Catégorie à définir'
    }
  ],

  TMO: [
    {
      id: 'placeholder',
      name: 'Compétence à définir',
      description: 'Description à définir',
      category: 'Catégorie à définir'
    }
  ],

  SRMO: [
    {
      id: 'placeholder',
      name: 'Compétence à définir',
      description: 'Description à définir',
      category: 'Catégorie à définir'
    }
  ],

  SS: [
    {
      id: 'placeholder',
      name: 'Compétence à définir',
      description: 'Description à définir',
      category: 'Catégorie à définir'
    }
  ],

  AS: [
    {
      id: 'placeholder',
      name: 'Compétence à définir',
      description: 'Description à définir',
      category: 'Catégorie à définir'
    }
  ]
};

// Fonction utilitaire pour obtenir les skills d'un rôle
export const getSkillsForRole = (role: EvaluationRole): Skill[] => {
  return skillsByRole[role] || [];
};

// Fonction utilitaire pour obtenir la config d'un rôle
export const getRoleConfig = (role: EvaluationRole) => {
  return roleConfig[role];
};
