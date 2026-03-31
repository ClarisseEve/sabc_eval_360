export type CompetencyLevel = 'fondamentale' | 'avancée' | 'experte';

export interface CompetencyDefinition {
  id: string;
  label: string;
  description: string;
  level: CompetencyLevel;
  families: string[];
}

export interface RoleCompetencyProfile {
  role: string;
  families: string[];
  focusCompetencies: string[];
  minimumScore: number;
}

export const COMPETENCY_FAMILIES: string[] = [
  'Leadership stratégique',
  'Pilotage commercial',
  'Coaching équipes',
  'Gestion client',
  'Animation commerciale',
  'Exécution terrain',
  'Gestion portefeuille',
  'Conformité & reporting',
  'Marketing opérationnel',
  'Analyse & data',
  'Innovation & croissance',
];

export const COMPETENCY_DEFINITIONS: CompetencyDefinition[] = [
  {
    id: 'leadership_vision',
    label: 'Vision & Alignement',
    description: 'Capacité à définir une vision claire et à aligner les équipes sur les priorités commerciales.',
    level: 'experte',
    families: ['Leadership stratégique'],
  },
  {
    id: 'coaching_field',
    label: 'Coaching terrain',
    description: 'Accompagner les managers et commerciaux dans leur progression via coaching structuré.',
    level: 'avancée',
    families: ['Coaching équipes', 'Gestion client'],
  },
  {
    id: 'data_insight',
    label: 'Exploitation des données',
    description: 'Analyse des indicateurs pour orienter les décisions et identifier les axes de croissance.',
    level: 'avancée',
    families: ['Analyse & data', 'Innovation & croissance'],
  },
  {
    id: 'route_to_market',
    label: 'Route-to-Market',
    description: 'Optimisation des circuits de distribution et animation des forces de vente.',
    level: 'experte',
    families: ['Pilotage commercial', 'Animation commerciale'],
  },
  {
    id: 'brand_activation',
    label: 'Activation marketing',
    description: 'Déployer des plans marketing différenciés selon zones et segments.',
    level: 'fondamentale',
    families: ['Marketing opérationnel'],
  },
  {
    id: 'process_compliance',
    label: 'Maîtrise process & conformité',
    description: 'Garantir le respect des standards SABC, reporting et procédures réglementaires.',
    level: 'fondamentale',
    families: ['Conformité & reporting'],
  },
  {
    id: 'portfolio_development',
    label: 'Développement portefeuille',
    description: 'Prospecter, fidéliser et développer la valeur du portefeuille clients.',
    level: 'avancée',
    families: ['Gestion portefeuille', 'Gestion client'],
  },
];

export const ROLE_COMPETENCY_PROFILES: RoleCompetencyProfile[] = [
  {
    role: 'DR',
    families: ['Leadership stratégique', 'Pilotage commercial', 'Coaching équipes', 'Analyse & data'],
    focusCompetencies: ['leadership_vision', 'data_insight', 'coaching_field'],
    minimumScore: 4.2,
  },
  {
    role: 'CDTT',
    families: ['Leadership stratégique', 'Pilotage commercial', 'Marketing opérationnel', 'Innovation & croissance'],
    focusCompetencies: ['route_to_market', 'data_insight'],
    minimumScore: 4.0,
  },
  {
    role: 'CSC',
    families: ['Pilotage commercial', 'Coaching équipes', 'Gestion client', 'Conformité & reporting'],
    focusCompetencies: ['coaching_field', 'process_compliance'],
    minimumScore: 3.8,
  },
  {
    role: 'CDV',
    families: ['Gestion client', 'Animation commerciale', 'Gestion portefeuille'],
    focusCompetencies: ['portfolio_development', 'route_to_market'],
    minimumScore: 3.7,
  },
  {
    role: 'CDS',
    families: ['Exécution terrain', 'Gestion portefeuille', 'Conformité & reporting'],
    focusCompetencies: ['portfolio_development', 'process_compliance'],
    minimumScore: 3.5,
  },
  {
    role: 'RTM',
    families: ['Marketing opérationnel', 'Analyse & data', 'Innovation & croissance'],
    focusCompetencies: ['brand_activation', 'data_insight'],
    minimumScore: 3.8,
  },
  {
    role: 'SRMO',
    families: ['Marketing opérationnel', 'Pilotage commercial', 'Analyse & data'],
    focusCompetencies: ['brand_activation', 'route_to_market'],
    minimumScore: 3.7,
  },
  {
    role: 'AS',
    families: ['Conformité & reporting', 'Exécution terrain'],
    focusCompetencies: ['process_compliance'],
    minimumScore: 3.2,
  },
];
