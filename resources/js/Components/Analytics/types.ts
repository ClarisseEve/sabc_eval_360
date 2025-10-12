export type EvaluationChannel = 'auto' | 'pairs' | 'descendante';

export interface AnalyticsFilters {
  periode: string;
  roles: string[];
  regions: string[];
  branches: string[];
  hierarchyLevels: string[];
  ageRange: [number, number];
  anciennete: [number, number];
  sexes: string[];
  evaluationChannels: EvaluationChannel[];
  competencies: string[];
  trainingStatuses: string[];
  structureScope: 'all' | 'taniere' | 'non_taniere';
}

export interface KpiMetric {
  id: string;
  label: string;
  value: number;
  unit?: string;
  globalValue?: number;
  variation?: number;
  description?: string;
}

export interface CompetencyHeatmapCell {
  role: string;
  family: string;
  score: number;
  target: number;
}

export interface DemographicBreakdown {
  label: string;
  value: number;
  comparison?: number;
}

export interface PerformanceTrendPoint {
  period: string;
  score: number;
  participation?: number;
}

export interface AlertInsight {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  impactedPopulation: number;
  suggestedActions: string[];
}

export interface RolePerformancePoint {
  role: string;
  score: number;
  participation?: number;
}

export interface ChannelDistribution {
  channel: string;
  label: string;
  value: number;
}

export interface EvaluationStatusDistribution {
  status: string;
  label: string;
  filteredCount: number;
  globalCount?: number;
}

export interface BiasIndicator {
  channel: EvaluationChannel;
  averageScore: number;
  deltaVsGlobal: number;
}

export interface ScoreSeniorityPoint {
  bucket: string;
  score: number;
  population: number;
}

export interface CompetencySummary {
  id: string;
  label: string;
  acquisitionRate: number;
  averageScore: number;
}

export interface AcquisitionDistributionSegment {
  bracket: string;
  percentage: number;
  count: number;
}

export interface RoleCompetencyMatrixCompetency {
  id: string;
  label: string;
  requiredLevel?: number;
  weight?: number;
}

export interface RoleCompetencyMatrixIndividual {
  id: string;
  name: string;
  region?: string;
  sexe?: string;
  age?: number;
  anciennete?: number;
  scores: Record<string, number>;
  acquisitionRate?: number;
  averageScore?: number;
}

export interface RoleCompetencyMatrix {
  competencies: RoleCompetencyMatrixCompetency[];
  individuals: RoleCompetencyMatrixIndividual[];
}

export interface RoleCompetencyInsight {
  role: string;
  acquisitionThresholdScore: number;
  matrix: RoleCompetencyMatrix;
  population?: number;
  competencies?: CompetencySummary[];
  acquisitionDistribution?: AcquisitionDistributionSegment[];
  topCompetencies?: CompetencySummary[];
  bottomCompetencies?: CompetencySummary[];
  overallAcquisitionRate?: number;
  overallAverageScore?: number;
}

export interface UserAnalyticsSummary {
  matricule: string;
  name: string;
  role: string;
  region: string;
  sexe?: string;
  age?: number;
  anciennete?: number;
  latestScore: number;
  scoreTrend: number[];
  competencies: Array<{
    family: string;
    score: number;
    target: number;
  }>;
  evaluationBreakdown: Record<EvaluationChannel, number>;
  recommendations: string[];
}

export interface AnalyticsDataset {
  kpis: KpiMetric[];
  competencyHeatmap: CompetencyHeatmapCell[];
  competencyFamilies: string[];
  roles: string[];
  demographicBySexe: DemographicBreakdown[];
  demographicByAge: DemographicBreakdown[];
  demographicByAnciennete: DemographicBreakdown[];
  performanceTrend: PerformanceTrendPoint[];
  cohortTrend: PerformanceTrendPoint[];
  rolePerformance: RolePerformancePoint[];
  evaluationChannelDistribution: ChannelDistribution[];
  evaluationStatusDistribution: EvaluationStatusDistribution[];
  biasIndicators: BiasIndicator[];
  scoreBySeniority: ScoreSeniorityPoint[];
  alerts: AlertInsight[];
  topUsers: UserAnalyticsSummary[];
  roleCompetencyInsights: RoleCompetencyInsight[];
}
