import React from 'react';
import { useAnalyticsFilters } from './AnalyticsFiltersContext';
import type {
  AnalyticsDataset,
  BiasIndicator,
  ChannelDistribution,
  CompetencyHeatmapCell,
  RoleCompetencyInsight,
  RoleCompetencyMatrixIndividual,
  RolePerformancePoint,
  ScoreSeniorityPoint,
} from './types';

const TANIERE_REGIONS = new Set(['littoral', 'centre']);

const normalize = (value?: string | null) => (value ? value.trim().toLowerCase() : '');

const clampNumber = (value: number, decimals = 2) => Number(value.toFixed(decimals));

const recomputeAverageScoreKpi = (kpis: AnalyticsDataset['kpis'], rolePerformance: RolePerformancePoint[]) => {
  const kpiClone = kpis.map((kpi) => ({ ...kpi }));
  const avgScoreKpi = kpiClone.find((kpi) => kpi.id === 'avg_score');
  if (!avgScoreKpi) {
    return kpiClone;
  }

  if (rolePerformance.length === 0) {
    avgScoreKpi.value = 0;
    return kpiClone;
  }

  const avgScore = rolePerformance.reduce((acc, item) => acc + item.score, 0) / rolePerformance.length;
  avgScoreKpi.value = clampNumber(avgScore, 2);
  return kpiClone;
};

export const useAnalyticsData = (dataset: AnalyticsDataset) => {
  const { filters } = useAnalyticsFilters();

  const filteredDataset = React.useMemo(() => {
    const {
      roles,
      competencies,
      evaluationChannels,
      regions,
      sexes,
      ageRange,
      anciennete,
      structureScope,
    } = filters;

    const roleSet = new Set(roles.map(normalize));
    const familySet = new Set(competencies.map(normalize));
    const regionSet = new Set(regions.map(normalize));
    const sexeSet = new Set(sexes.map(normalize));
    const channelSet = new Set(evaluationChannels);

    const isRoleAllowed = (role: string) => roleSet.size === 0 || roleSet.has(normalize(role));
    const isFamilyAllowed = (family: string) => familySet.size === 0 || familySet.has(normalize(family));
    const isRegionAllowed = (region?: string | null) => regionSet.size === 0 || regionSet.has(normalize(region));
    const isSexeAllowed = (sexe?: string | null) => sexeSet.size === 0 || sexeSet.has(normalize(sexe));
    const isStructureScopeAllowed = (region?: string | null) => {
      if (structureScope === 'all') {
        return true;
      }

      const normalizedRegion = normalize(region);
      const isTaniereRegion = TANIERE_REGIONS.has(normalizedRegion);
      return structureScope === 'taniere' ? isTaniereRegion : !isTaniereRegion;
    };

    const isAgeAllowed = (age?: number) => {
      if (!age) {
        return true;
      }
      const [minAge, maxAge] = ageRange;
      return age >= minAge && age <= maxAge;
    };

    const isSeniorityAllowed = (years?: number) => {
      if (years === undefined || years === null) {
        return true;
      }
      const [minYears, maxYears] = anciennete;
      return years >= minYears && years <= maxYears;
    };

    const filteredTopUsers = dataset.topUsers.filter((user) => {
      const matchesRole = isRoleAllowed(user.role);
      const matchesRegion = isRegionAllowed(user.region);
      const matchesSexe = isSexeAllowed(user.sexe);
      const matchesAge = isAgeAllowed(user.age);
      const matchesSeniority = isSeniorityAllowed(user.anciennete);
      const matchesStructure = isStructureScopeAllowed(user.region);
      const matchesCompetencies =
        familySet.size === 0 || (user.competencies || []).some((comp) => isFamilyAllowed(comp.family));

      if (channelSet.size === 0) {
        return matchesRole && matchesRegion && matchesSexe && matchesAge && matchesSeniority && matchesStructure && matchesCompetencies;
      }

      const evaluationChannelsKeys = Object.keys(user.evaluationBreakdown || {}) as Array<keyof typeof user.evaluationBreakdown>;
      const hasChannels = evaluationChannelsKeys.some((channel) => channelSet.has(channel));

      return (
        matchesRole &&
        matchesRegion &&
        matchesSexe &&
        matchesAge &&
        matchesSeniority &&
        matchesStructure &&
        matchesCompetencies &&
        hasChannels
      );
    });

    const filteredCompetencyHeatmap: CompetencyHeatmapCell[] = dataset.competencyHeatmap.filter(
      (cell) => isRoleAllowed(cell.role) && isFamilyAllowed(cell.family)
    );

    const filteredRolePerformance: RolePerformancePoint[] = dataset.rolePerformance.filter((point) =>
      isRoleAllowed(point.role)
    );

    const filteredChannelDistribution: ChannelDistribution[] = dataset.evaluationChannelDistribution.filter(
      (channel) => channelSet.size === 0 || channelSet.has(channel.channel as typeof evaluationChannels[number])
    );

    const filteredBiasIndicators: BiasIndicator[] = dataset.biasIndicators.filter(
      (indicator) => channelSet.size === 0 || channelSet.has(indicator.channel)
    );

    const filteredScoreBySeniority: ScoreSeniorityPoint[] = dataset.scoreBySeniority.filter((bucket) => {
      // If specific seniority filters exist, retain buckets that overlap roughly with selected range
      const [minYears, maxYears] = anciennete;
      if (minYears <= 0 && maxYears >= 20) {
        return true;
      }

      // Try to parse bucket labels like "0-2 ans" or "11+ ans"
      const parts = bucket.bucket.split('-');
      if (parts.length === 2) {
        const bucketMin = Number(parts[0]);
        const bucketMax = Number(parts[1].replace(/[^0-9]/g, ''));
        if (Number.isFinite(bucketMin) && Number.isFinite(bucketMax)) {
          return bucketMax >= minYears && bucketMin <= maxYears;
        }
      }

      if (bucket.bucket.includes('+')) {
        const base = Number(bucket.bucket.replace(/[^0-9]/g, ''));
        if (Number.isFinite(base)) {
          return maxYears >= base;
        }
      }

      return true;
    });

    const filteredFamilies = Array.from(
      new Set(filteredCompetencyHeatmap.map((cell) => cell.family))
    ).sort();

    const filteredRoles = Array.from(
      new Set([
        ...filteredRolePerformance.map((point) => point.role),
        ...filteredCompetencyHeatmap.map((cell) => cell.role),
      ])
    ).sort();

    const filteredRoleCompetencyInsights = computeRoleCompetencySummaries({
      insights: dataset.roleCompetencyInsights,
      isRoleAllowed,
      isRegionAllowed,
      isSexeAllowed,
      isAgeAllowed,
      isSeniorityAllowed,
      isStructureScopeAllowed,
    });

    const recalculatedKpis = recomputeAverageScoreKpi(dataset.kpis, filteredRolePerformance);

    return {
      ...dataset,
      kpis: recalculatedKpis,
      topUsers: filteredTopUsers,
      competencyHeatmap: filteredCompetencyHeatmap,
      competencyFamilies: filteredFamilies.length > 0 ? filteredFamilies : dataset.competencyFamilies,
      roles: filteredRoles.length > 0 ? filteredRoles : dataset.roles,
      rolePerformance: filteredRolePerformance,
      evaluationChannelDistribution: filteredChannelDistribution,
      biasIndicators: filteredBiasIndicators,
      scoreBySeniority: filteredScoreBySeniority,
      roleCompetencyInsights: filteredRoleCompetencyInsights,
    } satisfies AnalyticsDataset;
  }, [dataset, filters]);

  return filteredDataset;
};

interface RoleCompetencySummaryOptions {
  insights: RoleCompetencyInsight[];
  isRoleAllowed: (role: string) => boolean;
  isRegionAllowed: (region?: string | null) => boolean;
  isSexeAllowed: (sexe?: string | null) => boolean;
  isAgeAllowed: (age?: number) => boolean;
  isSeniorityAllowed: (years?: number) => boolean;
  isStructureScopeAllowed: (region?: string | null) => boolean;
}

const BUCKETS = [
  { label: '<50%', predicate: (value: number) => value < 50 },
  { label: '50-70%', predicate: (value: number) => value >= 50 && value < 70 },
  { label: '70-80%', predicate: (value: number) => value >= 70 && value < 80 },
  { label: '>80%', predicate: (value: number) => value >= 80 },
];

const computeRoleCompetencySummaries = ({
  insights,
  isRoleAllowed,
  isRegionAllowed,
  isSexeAllowed,
  isAgeAllowed,
  isSeniorityAllowed,
  isStructureScopeAllowed,
}: RoleCompetencySummaryOptions): RoleCompetencyInsight[] => {
  if (!Array.isArray(insights) || insights.length === 0) {
    return [];
  }

  return insights
    .filter((insight) => isRoleAllowed(insight.role))
    .map((insight) => {
      const { matrix, acquisitionThresholdScore } = insight;
      const filteredIndividuals = matrix.individuals.filter((individual) => {
        if (!isRegionAllowed(individual.region)) return false;
        if (!isStructureScopeAllowed(individual.region)) return false;
        if (!isSexeAllowed(individual.sexe)) return false;
        if (!isAgeAllowed(individual.age)) return false;
        if (!isSeniorityAllowed(individual.anciennete)) return false;
        return true;
      });

      const selectedIndividuals =
        filteredIndividuals.length > 0 ? filteredIndividuals : matrix.individuals;

      const population = selectedIndividuals.length;

      if (population === 0) {
        return {
          ...insight,
          population: 0,
          competencies: matrix.competencies.map((competency) => ({
            id: competency.id,
            label: competency.label,
            acquisitionRate: 0,
            averageScore: 0,
          })),
          acquisitionDistribution: BUCKETS.map((bucket) => ({ bracket: bucket.label, percentage: 0, count: 0 })),
          topCompetencies: [],
          bottomCompetencies: [],
          matrix: {
            ...matrix,
            individuals: [],
          },
          overallAcquisitionRate: 0,
          overallAverageScore: 0,
        } satisfies RoleCompetencyInsight;
      }

      const competencySummaries = matrix.competencies.map((competency) => {
        const scores = selectedIndividuals
          .map((individual) => individual.scores[competency.id])
          .filter((score): score is number => typeof score === 'number');

        const averageScore = scores.length > 0 ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0;
        const acquiredCount = scores.filter((score) => score >= acquisitionThresholdScore).length;
        const acquisitionRate = scores.length > 0 ? (acquiredCount / scores.length) * 100 : 0;

        return {
          id: competency.id,
          label: competency.label,
          acquisitionRate: clampNumber(acquisitionRate, 1),
          averageScore: clampNumber(averageScore, 2),
        };
      });

      const sortedByAcquisition = [...competencySummaries].sort(
        (a, b) => a.acquisitionRate - b.acquisitionRate
      );

      const enhancedIndividuals: RoleCompetencyMatrixIndividual[] = selectedIndividuals.map((individual) => {
        const scores = matrix.competencies.map((competency) => individual.scores[competency.id] ?? 0);
        const acquired = scores.filter((score) => score >= acquisitionThresholdScore).length;
        const acquisitionRate = scores.length > 0 ? (acquired / scores.length) * 100 : 0;
        const averageScore = scores.length > 0 ? scores.reduce((acc, value) => acc + value, 0) / scores.length : 0;

        return {
          ...individual,
          acquisitionRate: clampNumber(acquisitionRate, 1),
          averageScore: clampNumber(averageScore, 2),
        };
      });

      const acquisitionDistribution = BUCKETS.map((bucket) => {
        const count = enhancedIndividuals.filter((individual) => bucket.predicate(individual.acquisitionRate ?? 0)).length;
        const percentage = population > 0 ? clampNumber((count / population) * 100) : 0;
        return { bracket: bucket.label, percentage, count };
      });

      const overallAcquisitionRate = enhancedIndividuals.reduce((sum, individual) => sum + (individual.acquisitionRate ?? 0), 0) / population;
      const overallAverageScore = enhancedIndividuals.reduce((sum, individual) => sum + (individual.averageScore ?? 0), 0) / population;

      return {
        ...insight,
        population,
        competencies: sortedByAcquisition,
        acquisitionDistribution,
        topCompetencies: [...sortedByAcquisition].reverse().slice(0, 8),
        bottomCompetencies: sortedByAcquisition.slice(0, 8),
        matrix: {
          ...matrix,
          individuals: enhancedIndividuals,
        },
        overallAcquisitionRate: clampNumber(overallAcquisitionRate, 1),
        overallAverageScore: clampNumber(overallAverageScore, 2),
      } satisfies RoleCompetencyInsight;
    });
};
