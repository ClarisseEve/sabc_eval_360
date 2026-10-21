import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { adminApi, analyticsApi } from '@/Services/api';
import { buildFocusHierarchyMember, loadAdminHierarchyBranch } from '@/utils/hierarchyDrilldown';
import { formatPersonName } from '@/utils/helpers';

function asArray<T = any>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && 'data' in value && Array.isArray((value as any).data)) return (value as any).data;
  return [];
}

export function getAdminDisplayName(user: any) {
  return formatPersonName(user);
}

export function useAdminOverviewTabData(
  dateRange?: { start_date?: string; end_date?: string },
  periodeId?: string,
) {
  return useSuspenseQuery({
    queryKey: [
      'admin',
      'dashboard',
      'tab',
      'overview',
      dateRange?.start_date ?? 'all',
      dateRange?.end_date ?? 'all',
      periodeId ?? 'all',
    ],
    queryFn: async () => {
      const analytics = (
        await analyticsApi.adminOverview({
          ...dateRange,
          ...(periodeId ? { id_periode: periodeId } : {}),
        })
      ).data;

      return {
        totalEvaluations: Number(analytics?.kpis?.total_evaluations ?? 0),
        uniqueUsers: analytics?.kpis?.unique_users ?? 0,
        averageScore: analytics?.kpis?.average_score != null ? Number(analytics.kpis.average_score) : 0,
        completionRate: Number(analytics?.kpis?.completion_rate ?? 0),
        validatedEvaluations: Number(analytics?.kpis?.validated_evaluations ?? 0),
        statusData: asArray(analytics?.status_distribution),
        channelData: asArray(analytics?.channel_distribution),
        trendData: asArray(analytics?.performance_trend).map((row: any) => ({
          period: String(row?.period ?? ''),
          score: Number(row?.score ?? 0),
          count: Number(row?.count ?? 0),
        })),
        regionData: asArray(analytics?.regions).map((region: any) => ({
          region: region.region,
          utilisateurs: Number(region.utilisateurs ?? 0),
          evaluations: Number(region.evaluations ?? 0),
        })),
        topRoles: asArray(analytics?.top_roles).slice(0, 6),
      };
    },
  });
}

export function useAdminRoleAnalysisTabData(dateRange?: { start_date?: string; end_date?: string }) {
  return useSuspenseQuery({
    queryKey: ['admin', 'dashboard', 'tab', 'roles', dateRange?.start_date ?? 'all', dateRange?.end_date ?? 'all'],
    queryFn: async () => {
      const response = await analyticsApi.adminRoles(dateRange);
      const rolePerf = asArray(response.data?.roles);
      const channels = asArray(response.data?.channels);
      const globalAvg = Number(response.data?.global_average ?? 0);

      return {
        rolePerf,
        channels,
        globalAvg,
        sortedByScore: [...rolePerf].sort((a: any, b: any) => (Number(b.avgScore) || 0) - (Number(a.avgScore) || 0)),
        sortedByCompletion: [...rolePerf].sort((a: any, b: any) => (Number(b.completion) || 0) - (Number(a.completion) || 0)),
      };
    },
  });
}

export function useAdminRegionsTabData(selectedRegion: string, dateRange?: { start_date?: string; end_date?: string }) {
  const overviewQuery = useSuspenseQuery({
    queryKey: ['admin', 'dashboard', 'tab', 'regions', 'overview', dateRange?.start_date ?? 'all', dateRange?.end_date ?? 'all'],
    queryFn: () => analyticsApi.adminRegionsOverview(dateRange).then((response) => response.data),
  });

  const regionAnalyticsQuery = useQuery({
    queryKey: ['analytics', 'admin', 'region', selectedRegion],
    queryFn: () => analyticsApi.adminRegionDetail(selectedRegion).then((response) => response.data),
    enabled: Boolean(selectedRegion),
  });

  return {
    regions: asArray(overviewQuery.data?.regions),
    interRegionData: asArray(overviewQuery.data?.inter_region),
    selectedRegionStats: regionAnalyticsQuery.data?.stats ?? null,
    regionClassement: regionAnalyticsQuery.data?.classement ?? null,
  };
}

export function useAdminAnomaliesTabData() {
  return useSuspenseQuery({
    queryKey: ['admin', 'dashboard', 'tab', 'anomalies'],
    queryFn: async () => {
      const response = await analyticsApi.anomalies();
      return {
        total: Number(response.data?.total ?? 0),
        severityStats: response.data?.par_severite ?? {},
        rows: asArray(response.data?.anomalies),
      };
    },
  });
}

export function useAdminImprovementPlansTabData(filters: {
  roleFilter: string;
  regionFilter: string;
  typeFilter: string;
}) {
  const rolesQuery = useQuery({
    queryKey: ['admin', 'roles', 'options'],
    queryFn: () => adminApi.roles.list().then((response) => response.data),
  });

  const regionsQuery = useQuery({
    queryKey: ['admin', 'regions', 'options'],
    queryFn: () => adminApi.structure.regions().then((response) => response.data),
  });

  const plansQuery = useQuery({
    queryKey: ['analytics', 'admin', 'improvement-plans', filters.roleFilter, filters.regionFilter, filters.typeFilter],
    queryFn: () => analyticsApi.improvementPlans({
      ...(filters.roleFilter !== 'all' ? { role: filters.roleFilter } : {}),
      ...(filters.regionFilter !== 'all' ? { id_region: filters.regionFilter } : {}),
      ...(filters.typeFilter !== 'all' ? { type: filters.typeFilter } : {}),
    }).then((response) => response.data),
  });

  return {
    rolesQuery,
    regionsQuery,
    plansQuery,
    roleOptions: asArray(rolesQuery.data)
      .map((role: any) => String(role?.nom_role || '').trim())
      .filter(Boolean),
    regionOptions: asArray(regionsQuery.data),
    byType: asArray(plansQuery.data?.by_type),
    topAxes: asArray(plansQuery.data?.top_axes),
    rows: asArray(plansQuery.data?.rows),
    totals: plansQuery.data?.totals ?? {},
  };
}

export function useAdminTendancesTabData(filters: { regionFilter: string; roleFilter: string }) {
  const rolesQuery = useQuery({
    queryKey: ['admin', 'roles', 'options'],
    queryFn: () => adminApi.roles.list().then((r) => r.data),
    staleTime: 300_000,
  });
  const regionsQuery = useQuery({
    queryKey: ['admin', 'regions', 'options'],
    queryFn: () => adminApi.structure.regions().then((r) => r.data),
    staleTime: 300_000,
  });
  const tendancesQuery = useSuspenseQuery({
    queryKey: ['analytics', 'admin', 'tendances', filters.regionFilter, filters.roleFilter],
    queryFn: () =>
      analyticsApi
        .tendances({
          ...(filters.regionFilter !== 'all' ? { id_region: filters.regionFilter } : {}),
          ...(filters.roleFilter !== 'all' ? { role: filters.roleFilter } : {}),
        })
        .then((r) => r.data),
  });
  return {
    tendances: asArray(tendancesQuery.data?.tendances),
    regionOptions: asArray(regionsQuery.data),
    roleOptions: asArray(rolesQuery.data)
      .map((r: any) => String(r?.nom_role || ''))
      .filter(Boolean),
    generatedAt: tendancesQuery.data?.generated_at ?? null,
  };
}

export function useAdminIndividualSearchTabData({
  search,
  selectedMatricule,
}: {
  search: string;
  selectedMatricule: string;
}) {
  const usersQuery = useQuery({
    queryKey: ['admin', 'users', 'search', search],
    queryFn: () => adminApi.users.list(search.trim() ? { search: search.trim() } : undefined).then((response) => response.data),
  });

  const userQuery = useQuery({
    queryKey: ['admin', 'user360', selectedMatricule, 'profile'],
    queryFn: () => adminApi.users.get(selectedMatricule).then((response) => response.data),
    enabled: Boolean(selectedMatricule),
  });

  const historyQuery = useQuery({
    queryKey: ['admin', 'user360', selectedMatricule, 'history'],
    queryFn: () => adminApi.users.historique(selectedMatricule).then((response) => response.data),
    enabled: Boolean(selectedMatricule),
  });

  const chainQuery = useQuery({
    queryKey: ['admin', 'user360', selectedMatricule, 'chain'],
    queryFn: () => adminApi.users.chaine(selectedMatricule).then((response) => response.data),
    enabled: Boolean(selectedMatricule),
  });

  const branchQuery = useQuery({
    queryKey: ['admin', 'user360', selectedMatricule, 'branch'],
    queryFn: () => loadAdminHierarchyBranch(selectedMatricule),
    enabled: Boolean(selectedMatricule),
  });

  const scoresQuery = useQuery({
    queryKey: ['admin', 'user360', selectedMatricule, 'scores'],
    queryFn: () => analyticsApi.scores(selectedMatricule).then((response) => response.data),
    enabled: Boolean(selectedMatricule),
  });

  const axesQuery = useQuery({
    queryKey: ['admin', 'user360', selectedMatricule, 'axes'],
    queryFn: () => analyticsApi.axesAmelioration(selectedMatricule).then((response) => response.data),
    enabled: Boolean(selectedMatricule),
  });

  const recommendationsQuery = useQuery({
    queryKey: ['admin', 'user360', selectedMatricule, 'recommandations'],
    queryFn: () => analyticsApi.recommandations(selectedMatricule).then((response) => response.data),
    enabled: Boolean(selectedMatricule),
  });

  const history = asArray(historyQuery.data);
  const selectedUser = userQuery.data;
  const axes = asArray(axesQuery.data?.axes_amelioration);

  return {
    usersQuery,
    selectedUser,
    users: asArray(usersQuery.data),
    receivedEvaluations: history.filter((evaluation: any) => String(evaluation?.evalue_matricule || '') === selectedMatricule),
    givenEvaluations: history.filter((evaluation: any) => String(evaluation?.evaluateur_matricule || '') === selectedMatricule),
    scoreByType: asArray(scoresQuery.data?.par_type),
    axes,
    recommendations: asArray(recommendationsQuery.data?.recommandations),
    chain: asArray(chainQuery.data),
    branchMembers: asArray(branchQuery.data),
    focusUser: buildFocusHierarchyMember(selectedUser, scoresQuery.data, axesQuery.data),
    scores: scoresQuery.data,
    isDetailsLoading:
      userQuery.isLoading ||
      historyQuery.isLoading ||
      chainQuery.isLoading ||
      scoresQuery.isLoading ||
      axesQuery.isLoading ||
      recommendationsQuery.isLoading ||
      branchQuery.isLoading,
  };
}
