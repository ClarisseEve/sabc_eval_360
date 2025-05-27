export interface AnalyticsData {
  // Données de performance par région
  performanceByRegion: Array<{
    name: string;
    commercial: number;
    marketing: number;
  }>;
  
  // Données d'achèvement des évaluations
  evaluationCompletion: Array<{
    region: string;
    completed: number;
    total: number;
    percentage: number;
  }>;
  
  // Données d'achèvement des évaluations par région
  evaluationCompletionByRegion: Array<{
    region: string;
    completed: number;
    total: number;
    percentage: number;
  }>;
  
  // Scores moyens par région
  averageScores: Array<{
    region: string;
    average: number;
  }>;
  
  // Meilleurs performeurs
  topPerformers: Array<{
    id: number;
    name: string;
    role: string;
    score: number;
    region: string;
    department: string;
    progress: number;
    performanceIndex: number;
  }>;
  
  // Tendances historiques
  trends: Array<{
    period: string;
    value: number;
    type: string;
  }>;
  
  // Tendances de performance
  performanceTrends: Array<{
    period: string;
    commercial: number;
    marketing: number;
  }>;
  
  // Données de performance par compétence
  performanceBySkill: Array<{
    skill: string;
    score: number;
    category: string;
  }>;
  
  // Données de radar de compétences
  skillRadar: Array<{
    skill: string;
    score: number;
    average: number;
  }>;
  
  // Écarts de compétences
  skillGaps: Array<{
    skill: string;
    current: number;
    target: number;
    gap: number;
    priority: string;
  }>;
}
