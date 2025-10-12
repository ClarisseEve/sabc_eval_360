import * as React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/UI/Tabs/Tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Components/UI/Card/Card';
import { DataExport } from '@/Components/UI/Export/DataExport';
import { Button, buttonVariants } from '@/Components/UI/Button/Button';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Avatar } from '@/Components/UI/Avatar/Avatar';
import { Progress } from '@/Components/UI/Progress/Progress';
import { BarChart, LineChart, PieChart } from '@/Components/UI/Charts';
import {
  AnalyticsFiltersProvider,
  AnalyticsFilterPanel,
  AnalyticsKpiOverview,
  CompetencyHeatmapSection,
  DemographicInsightsSection,
  PerformanceInsightsSection,
  AlertsRecommendationsSection,
  RoleCompetencyDetailsSection,
  UserInsightsDrawer,
  useAnalyticsData,
  useAnalyticsExport,
  useAnalyticsFilters,
} from '@/Components/Analytics';
import { MOCK_ANALYTICS_DATA } from '@/Components/Analytics/mockData';
import type {
  AnalyticsDataset,
  UserAnalyticsSummary,
  BiasIndicator,
  AnalyticsFilters,
} from '@/Components/Analytics/types';
import {
  FileImage,
  FileSpreadsheet,
  FileText,
  Filter,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/Components/UI/Dialog/Dialog';
import { cn } from '@/utils/helpers';

interface AuthUser {
  name: string;
  email: string;
  role: string;
  avatar?: string;
  [key: string]: unknown;
}

interface AdminAnalyticsPageProps {
  auth?: {
    user?: AuthUser;
  };
  section?: string | null;
  dataset?: AnalyticsDataset;
}

type AnalyticsTab =
  | 'synthese'
  | 'competences'
  | 'demographie'
  | 'performance'
  | 'alertes';

const TAB_KEYS: AnalyticsTab[] = [
  'synthese',
  'competences',
  'demographie',
  'performance',
  'alertes',
];

const channelLabelMap: Record<string, string> = {
  auto: 'Auto-évaluation',
  pairs: 'Pairs',
  descendante: 'Descendante',
};

const formatChannelLabel = (channel: string) =>
  channelLabelMap[channel] ?? `${channel.charAt(0).toUpperCase()}${channel.slice(1)}`;

const resolveInitialTab = (section?: string | null): AnalyticsTab => {
  if (!section) {
    return 'synthese';
  }

  const normalized = section.toLowerCase() as AnalyticsTab;
  return TAB_KEYS.includes(normalized) ? normalized : 'synthese';
};

const exportFormats = [
  {
    id: 'png',
    label: 'PNG',
    extension: '.png',
    icon: <FileImage className="h-4 w-4" />,
    mimeType: 'image/png',
  },
  {
    id: 'jpeg',
    label: 'JPEG',
    extension: '.jpeg',
    icon: <FileImage className="h-4 w-4" />,
    mimeType: 'image/jpeg',
  },
  {
    id: 'pdf',
    label: 'PDF',
    extension: '.pdf',
    icon: <FileText className="h-4 w-4" />,
    mimeType: 'application/pdf',
  },
  {
    id: 'excel',
    label: 'Excel',
    extension: '.xlsx',
    icon: <FileSpreadsheet className="h-4 w-4" />,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
];

const channelOrder: Array<BiasIndicator['channel']> = ['auto', 'pairs', 'descendante'];

const computeActiveFiltersCount = (filters: AnalyticsFilters) => {
  let count = 0;
  if (filters.roles.length) count += filters.roles.length;
  if (filters.regions.length) count += filters.regions.length;
  if (filters.branches.length) count += filters.branches.length;
  if (filters.hierarchyLevels.length) count += filters.hierarchyLevels.length;
  if (filters.competencies.length) count += filters.competencies.length;
  if (filters.trainingStatuses.length) count += filters.trainingStatuses.length;
  if (filters.sexes.length) count += filters.sexes.length;
  if (filters.evaluationChannels.length && filters.evaluationChannels.length < 3) count += filters.evaluationChannels.length;
  if (filters.structureScope !== 'all') count += 1;
  if (filters.ageRange[0] !== 20 || filters.ageRange[1] !== 60) count += 1;
  if (filters.anciennete[0] !== 0 || filters.anciennete[1] !== 20) count += 1;
  if (filters.periode !== 'last_6_months') count += 1;
  return count;
};

const buildFilterSummary = (filters: AnalyticsFilters) => {
  const summaries: string[] = [];
  if (filters.periode !== 'last_6_months') summaries.push('Période personnalisée');
  if (filters.roles.length) summaries.push(`${filters.roles.length} rôle(s)`);
  if (filters.regions.length) summaries.push(`${filters.regions.length} région(s)`);
  if (filters.branches.length) summaries.push(`${filters.branches.length} branche(s)`);
  if (filters.hierarchyLevels.length) summaries.push(`${filters.hierarchyLevels.length} niveau(x)`);
  if (filters.competencies.length) summaries.push(`${filters.competencies.length} compétence(s)`);
  if (filters.trainingStatuses.length) summaries.push('Formation ciblée');
  if (filters.sexes.length && filters.sexes.length < 2) summaries.push(`Sexe: ${filters.sexes.join(', ')}`);
  if (filters.evaluationChannels.length && filters.evaluationChannels.length < 3) {
    summaries.push(`Canaux: ${filters.evaluationChannels.map((c) => formatChannelLabel(c)).join(', ')}`);
  }
  if (filters.structureScope !== 'all') {
    summaries.push(`Structure: ${filters.structureScope === 'taniere' ? 'Tanière' : 'Non-Tanière'}`);
  }
  if (filters.ageRange[0] !== 20 || filters.ageRange[1] !== 60) {
    summaries.push(`Âge ${filters.ageRange[0]}-${filters.ageRange[1]} ans`);
  }
  if (filters.anciennete[0] !== 0 || filters.anciennete[1] !== 20) {
    summaries.push(`Ancienneté ${filters.anciennete[0]}-${filters.anciennete[1]} ans`);
  }
  return summaries;
};

const AdminAnalyticsPage: React.FC<AdminAnalyticsPageProps> = ({ auth, section, dataset }) => {
  const initialTab = React.useMemo(() => resolveInitialTab(section), [section]);
  const [activeTab, setActiveTab] = React.useState<AnalyticsTab>(initialTab);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const resolvedUser = React.useMemo<AuthUser>(() => {
    if (auth?.user) {
      return auth.user;
    }

    return {
      name: 'Administrateur SABC',
      email: 'admin@sabc.cm',
      role: 'ADMIN',
    };
  }, [auth]);

  const resolvedDataset = React.useMemo<AnalyticsDataset>(
    () => dataset ?? MOCK_ANALYTICS_DATA,
    [dataset]
  );

  return (
    <AppLayout user={resolvedUser} pageTitle="Hub Analytics">
      <Head title="Analytics Administrateur" />
      <AnalyticsFiltersProvider>
        <AnalyticsDashboard
          dataset={resolvedDataset}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </AnalyticsFiltersProvider>
    </AppLayout>
  );
};

interface AnalyticsDashboardProps {
  dataset: AnalyticsDataset;
  activeTab: AnalyticsTab;
  onTabChange: (tab: AnalyticsTab) => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ dataset, activeTab, onTabChange }) => {
  const dashboardRef = React.useRef<HTMLDivElement | null>(null);
  const analytics = useAnalyticsData(dataset);
  const { filters, resetFilters } = useAnalyticsFilters();
  const [filtersSheetOpen, setFiltersSheetOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<UserAnalyticsSummary | null>(null);

  const { exportAsPNG, exportAsJPEG, exportAsPDF, exportAsExcel } = useAnalyticsExport({
    targetRef: dashboardRef,
    dataset: analytics,
    fileName: 'analytics-admin',
  });

  const handleExport = React.useCallback(
    (format: string) => {
      switch (format) {
        case 'png':
          exportAsPNG();
          break;
        case 'jpeg':
          exportAsJPEG();
          break;
        case 'pdf':
          exportAsPDF();
          break;
        case 'excel':
          exportAsExcel();
          break;
        default:
          console.warn('Format non pris en charge', format);
      }
    },
    [exportAsExcel, exportAsJPEG, exportAsPDF, exportAsPNG]
  );

  const handleUserSelect = React.useCallback((user: UserAnalyticsSummary) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  }, []);

  const handleHeatmapSelect = React.useCallback(
    (role: string) => {
      const match = analytics.topUsers.find(
        (user) => user.role.toLowerCase() === role.toLowerCase()
      );
      if (match) {
        handleUserSelect(match);
      }
    },
    [analytics.topUsers, handleUserSelect]
  );

  const statusChartData = React.useMemo(
    () =>
      analytics.evaluationStatusDistribution.map((status) => ({
        name: status.label,
        filtered: status.filteredCount,
        global: status.globalCount ?? 0,
      })),
    [analytics.evaluationStatusDistribution]
  );

  const channelChartData = React.useMemo(
    () =>
      analytics.evaluationChannelDistribution.map((channel) => ({
        name: channel.label,
        value: channel.value,
      })),
    [analytics.evaluationChannelDistribution]
  );

  const seniorityTrend = React.useMemo(
    () =>
      analytics.scoreBySeniority.map((bucket) => ({
        name: bucket.bucket,
        score: bucket.score,
      })),
    [analytics.scoreBySeniority]
  );

  const topUsers = React.useMemo(
    () => analytics.topUsers.slice(0, 6),
    [analytics.topUsers]
  );

  const orderedBiasIndicators = React.useMemo(() => {
    const order = new Map(channelOrder.map((channel, index) => [channel, index]));
    return [...analytics.biasIndicators].sort((a, b) => {
      const indexA = order.get(a.channel) ?? Number.MAX_SAFE_INTEGER;
      const indexB = order.get(b.channel) ?? Number.MAX_SAFE_INTEGER;
      return indexA - indexB;
    });
  }, [analytics.biasIndicators]);

  const activeFiltersCount = React.useMemo(() => computeActiveFiltersCount(filters), [filters]);
  const filterSummaries = React.useMemo(() => buildFilterSummary(filters), [filters]);

  const filterPreview = React.useMemo(() => {
    const preview = filterSummaries.slice(0, 3);
    const remaining = filterSummaries.length - preview.length;
    return { preview, remaining };
  }, [filterSummaries]);

  const toolbarClass = 'sticky top-[5.5rem] z-30 flex flex-col gap-4 bg-sabc-gray-50/95 px-3 py-4 shadow-sm backdrop-blur';
  const tabTriggerClass = cn(
    buttonVariants({ variant: 'outline', size: 'sm' }),
    'rounded-full px-4 text-sabc-gray-700 transition-colors dark:text-sabc-gray-200 data-[state=active]:!border-sabc-red-primary data-[state=active]:!bg-sabc-red-primary data-[state=active]:!text-white data-[state=active]:shadow-sm'
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="max-w-screen-2xl flex-1 space-y-6 px-0 md:px-2">
            <div className="md:hidden">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Vue synthétique</CardTitle>
                  <CardDescription>
                    Pour une analyse complète, veuillez utiliser une tablette ou un écran plus large.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AnalyticsKpiOverview kpis={analytics.kpis.slice(0, 2)} />
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setFiltersSheetOpen(true)}>
                    <Filter className="mr-2 h-4 w-4" />
                    Ajuster les filtres
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="hidden md:block">
              <Tabs
                value={activeTab}
                onValueChange={(value) => onTabChange(value as AnalyticsTab)}
              >
                <div className={toolbarClass}>
                  <div className="flex flex-col gap-3">
                    <header className="flex flex-col gap-1 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-sabc-gray-900 dark:text-white">
                          Hub Analytics Administrateur
                        </h1>
                        <p className="text-sm text-sabc-gray-600 dark:text-sabc-gray-300">
                          Visualisez les indicateurs 360°, détectez les écarts de compétences et pilotez les actions correctives.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="hidden lg:inline-flex"
                          onClick={() => handleExport('png')}
                        >
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Snapshot rapide
                        </Button>
                        <DataExport onExport={handleExport} formats={exportFormats} />
                      </div>
                    </header>

                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFiltersSheetOpen(true)}
                          className="flex items-center gap-2"
                        >
                          <Filter className="h-4 w-4" />
                          Filtres
                          {activeFiltersCount > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {activeFiltersCount}
                            </Badge>
                          )}
                        </Button>
                        {filterPreview.preview.map((summary) => (
                          <Badge
                            key={summary}
                            variant="secondary"
                            className="rounded-full bg-sabc-gray-100 text-xs text-sabc-gray-700"
                          >
                            {summary}
                          </Badge>
                        ))}
                        {filterPreview.remaining > 0 && (
                          <Badge variant="secondary" className="rounded-full text-xs">
                            +{filterPreview.remaining}
                          </Badge>
                        )}
                        {activeFiltersCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetFilters}
                            className="text-xs text-sabc-gray-500 hover:text-sabc-red-primary"
                          >
                            Réinitialiser
                          </Button>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 justify-start lg:justify-end">
                        <TabsList className="flex w-full flex-wrap justify-start gap-2 bg-transparent p-0">
                          <TabsTrigger value="synthese" className={tabTriggerClass}>
                            Synthèse
                          </TabsTrigger>
                          <TabsTrigger value="competences" className={tabTriggerClass}>
                            Compétences
                          </TabsTrigger>
                          <TabsTrigger value="demographie" className={tabTriggerClass}>
                            Démographie
                          </TabsTrigger>
                          <TabsTrigger value="performance" className={tabTriggerClass}>
                            Performance
                          </TabsTrigger>
                          <TabsTrigger value="alertes" className={tabTriggerClass}>
                            Alertes & Recos
                          </TabsTrigger>
                        </TabsList>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  ref={(node) => {
                    dashboardRef.current = node;
                  }}
                  className="space-y-6 pb-8 pt-4"
                >
                  <TabsContent value="synthese" className="space-y-6">
                    <AnalyticsKpiOverview kpis={analytics.kpis} />

                    {topUsers.length > 0 && (
                      <Card className="shadow-sm">
                        <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-center gap-2 text-sabc-gray-800 dark:text-white">
                            <Trophy className="h-4 w-4" />
                            <CardTitle className="text-base font-semibold">
                              Profils à surveiller
                            </CardTitle>
                          </div>
                          <CardDescription>
                            Sélectionnez un collaborateur pour afficher ses insights détaillés.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <TopUsersHighlights users={topUsers} onSelect={handleUserSelect} />
                        </CardContent>
                      </Card>
                    )}

                    <PerformanceInsightsSection
                      performanceTrend={analytics.performanceTrend}
                      cohortTrend={analytics.cohortTrend}
                    />
                  </TabsContent>

                  <TabsContent value="competences" className="space-y-6">
                    <CompetencyHeatmapSection
                      cells={analytics.competencyHeatmap}
                      roles={analytics.roles}
                      families={analytics.competencyFamilies}
                      onSelect={handleHeatmapSelect}
                    />
                    <RoleCompetencyDetailsSection insights={analytics.roleCompetencyInsights} />
                  </TabsContent>

                  <TabsContent value="demographie" className="space-y-6">
                    <DemographicInsightsSection
                      sexe={analytics.demographicBySexe}
                      age={analytics.demographicByAge}
                      anciennete={analytics.demographicByAnciennete}
                    />
                  </TabsContent>

                  <TabsContent value="performance" className="space-y-6">
                    <PerformanceInsightsSection
                      performanceTrend={analytics.performanceTrend}
                      cohortTrend={analytics.cohortTrend}
                    />

                    <div className="grid gap-4 lg:grid-cols-2">
                      <Card className="shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base text-sabc-gray-800 dark:text-white">
                            Statut des évaluations
                          </CardTitle>
                          <CardDescription>
                            Volumes filtrés vs parc global
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <BarChart
                            data={statusChartData}
                            xAxisDataKey="name"
                            bars={[
                              {
                                dataKey: 'filtered',
                                name: 'Population filtrée',
                                color: 'var(--sabc-red-primary)',
                              },
                              {
                                dataKey: 'global',
                                name: 'Global SABC',
                                color: 'var(--sabc-gray-300)',
                              },
                            ]}
                            layout="vertical"
                            height={300}
                            showLegend
                            barSize={22}
                          />
                        </CardContent>
                      </Card>

                      <Card className="shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base text-sabc-gray-800 dark:text-white">
                            Canaux d'évaluation
                          </CardTitle>
                          <CardDescription>
                            Répartition des collectes selon le type d'évaluateur
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <PieChart
                            data={channelChartData}
                            height={260}
                            showLegend
                            innerRadius={50}
                            outerRadius={90}
                          />
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <Card className="shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base text-sabc-gray-800 dark:text-white">
                            Score moyen par ancienneté
                          </CardTitle>
                          <CardDescription>
                            Positionnement des cohortes en fonction de l'ancienneté
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <LineChart
                            data={seniorityTrend}
                            xAxisDataKey="name"
                            lines={[
                              {
                                dataKey: 'score',
                                name: 'Score moyen',
                                color: 'var(--sabc-red-primary)',
                              },
                            ]}
                            height={240}
                          />
                        </CardContent>
                      </Card>

                      <BiasIndicatorsCard indicators={orderedBiasIndicators} />
                    </div>
                  </TabsContent>

                  <TabsContent value="alertes" className="space-y-6">
                    <AlertsRecommendationsSection alerts={analytics.alerts} />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={filtersSheetOpen} onOpenChange={setFiltersSheetOpen}>
        <DialogContent className="max-w-4xl">
          <AnalyticsFilterPanel mode="sheet" />
        </DialogContent>
      </Dialog>

      <UserInsightsDrawer
        user={selectedUser}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  );
};

interface TopUsersHighlightsProps {
  users: UserAnalyticsSummary[];
  onSelect: (user: UserAnalyticsSummary) => void;
}

const TopUsersHighlights: React.FC<TopUsersHighlightsProps> = ({ users, onSelect }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {users.map((user) => (
        <button
          key={user.matricule}
          type="button"
          onClick={() => onSelect(user)}
          className="group flex w-full min-w-0 items-start gap-4 rounded-2xl border border-sabc-gray-100 bg-white p-4 text-left transition-all hover:border-sabc-red-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sabc-red-primary focus:ring-offset-2 dark:border-sabc-gray-700 dark:bg-sabc-gray-900"
        >
          <Avatar name={user.name} size="lg" variant="info" />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-sabc-gray-900 dark:text-white">
                  {user.name}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-sabc-gray-500">
                  <Badge variant="secondary">{user.role}</Badge>
                  <span>{user.region}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-sabc-gray-900 dark:text-white">
                  {user.latestScore.toFixed(2)}
                </span>
                <p className="text-xxs uppercase tracking-wide text-sabc-gray-500">
                  Score
                </p>
              </div>
            </div>
            <Progress value={Math.min(100, user.latestScore * 20)} className="h-2" />
            <div className="flex flex-wrap gap-2 text-xs text-sabc-gray-500">
              {Object.entries(user.evaluationBreakdown).map(([channel, value]) => (
                <span
                  key={`${user.matricule}-${channel}`}
                  className="rounded-full bg-sabc-gray-100 px-2 py-0.5 dark:bg-sabc-gray-800"
                >
                  {formatChannelLabel(channel)} : {value.toFixed(0)}%
                </span>
              ))}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

interface BiasIndicatorsCardProps {
  indicators: BiasIndicator[];
}

const BiasIndicatorsCard: React.FC<BiasIndicatorsCardProps> = ({ indicators }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base text-sabc-gray-800 dark:text-white">
          Indicateurs de biais
        </CardTitle>
        <CardDescription>
          Comparaison des scores moyens par canal vs global
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {indicators.length === 0 && (
          <p className="text-sm text-sabc-gray-500">Aucun biais détecté avec les filtres sélectionnés.</p>
        )}
        {indicators.map((indicator) => {
          const delta = indicator.deltaVsGlobal;
          return (
            <div
              key={indicator.channel}
              className="flex items-center justify-between rounded-xl border border-sabc-gray-100 p-3 dark:border-sabc-gray-800"
            >
              <div>
                <p className="text-sm font-semibold text-sabc-gray-800 dark:text-white">
                  {formatChannelLabel(indicator.channel)}
                </p>
                <p className="text-xs text-sabc-gray-500">
                  Score moyen {indicator.averageScore.toFixed(2)} / écart {delta >= 0 ? '+' : ''}
                  {delta.toFixed(2)} vs global
                </p>
              </div>
              <Badge
                variant={delta >= 0 ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {delta >= 0 ? 'Surperformance' : 'À surveiller'}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default AdminAnalyticsPage;
