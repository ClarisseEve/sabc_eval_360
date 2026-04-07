import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSuspenseQuery } from '@tanstack/react-query';
import { AlertTriangle, BarChart3, Globe2, MapPinned, RefreshCw, TrendingUp } from 'lucide-react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { Head } from '@/lib/inertia-shim';
import { useAuthContext } from '@/Contexts/AuthContext';
import { adminApi, analyticsApi } from '@/Services/api';

type AnalyticsSection = 'dashboard' | 'regions' | 'anomalies';

function useAnalyticsLayoutUser() {
  const { user } = useAuthContext();

  return {
    name: user ? [user.prenom, user.nom].filter(Boolean).join(' ') || 'Administrateur' : 'Administrateur',
    email: user?.email || '',
    role: user?.role_nom || user?.role || 'ADMIN',
    avatar: user?.avatar,
  };
}

function resolveSection(pathname: string): AnalyticsSection {
  if (pathname.includes('/analytics/regions')) return 'regions';
  if (pathname.includes('/analytics/anomalies')) return 'anomalies';
  return 'dashboard';
}

export default function AdminAnalyticsPage() {
  const location = useLocation();
  const section = resolveSection(location.pathname);
  const layoutUser = useAnalyticsLayoutUser();
  const [selectedRegion, setSelectedRegion] = React.useState<string>('');

  const { data: dashboard } = useSuspenseQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => analyticsApi.dashboard().then((r) => r.data),
  });

  const { data: evaluationStats } = useSuspenseQuery({
    queryKey: ['analytics', 'evaluations'],
    queryFn: () => analyticsApi.evaluations().then((r) => r.data),
  });

  const { data: performances } = useSuspenseQuery({
    queryKey: ['analytics', 'performances'],
    queryFn: () => analyticsApi.performances().then((r) => r.data),
  });

  const { data: anomalies } = useSuspenseQuery({
    queryKey: ['analytics', 'anomalies'],
    queryFn: () => analyticsApi.anomalies().then((r) => r.data),
  });

  const { data: structureOverview } = useSuspenseQuery({
    queryKey: ['admin', 'structure', 'overview'],
    queryFn: () => adminApi.structure.overview().then((r) => r.data),
  });

  const regions = Array.isArray(structureOverview?.regions) ? structureOverview.regions : [];

  React.useEffect(() => {
    if (!selectedRegion && regions.length > 0) {
      setSelectedRegion(regions[0].id_region);
    }
  }, [regions, selectedRegion]);

  const { data: regionAnalytics } = useSuspenseQuery({
    queryKey: ['analytics', 'region', selectedRegion],
    queryFn: () => analyticsApi.region(selectedRegion).then((r) => r.data),
    enabled: !!selectedRegion,
  });

  const { data: regionClassement } = useSuspenseQuery({
    queryKey: ['analytics', 'region', selectedRegion, 'classement'],
    queryFn: () => analyticsApi.classementRegional(selectedRegion).then((r) => r.data),
    enabled: !!selectedRegion,
  });

  const channels = Array.isArray(dashboard?.channel_distribution)
    ? dashboard.channel_distribution
    : Array.isArray(performances)
      ? performances
      : [];

  const trend = Array.isArray(dashboard?.performance_trend) ? dashboard.performance_trend : [];
  const statuses = Array.isArray(evaluationStats) ? evaluationStats : [];
  const anomalyRows = Array.isArray(anomalies?.anomalies) ? anomalies.anomalies : [];
  const regionStats = Array.isArray(regionAnalytics) ? regionAnalytics[0] : regionAnalytics;

  return (
    <AppLayout user={layoutUser} pageTitle="Analytics" notifications={[]}>
      <Head title="Analytics Administrateur" />
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-sabc-gray-900">Analytics administrateur</h1>
            <p className="text-sm text-sabc-gray-600">Vue branchée sur les endpoints NestJS disponibles, sans mock frontend.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/analytics/dashboard">
              <Button variant={section === 'dashboard' ? 'default' : 'outline'} className={section === 'dashboard' ? 'bg-sabc-red-primary text-white hover:bg-sabc-red-dark' : ''}>
                <Globe2 className="mr-2 h-4 w-4" />
                Vue d'ensemble
              </Button>
            </Link>
            <Link to="/analytics/regions">
              <Button variant={section === 'regions' ? 'default' : 'outline'} className={section === 'regions' ? 'bg-sabc-red-primary text-white hover:bg-sabc-red-dark' : ''}>
                <MapPinned className="mr-2 h-4 w-4" />
                Par région
              </Button>
            </Link>
            <Link to="/analytics/anomalies">
              <Button variant={section === 'anomalies' ? 'default' : 'outline'} className={section === 'anomalies' ? 'bg-sabc-red-primary text-white hover:bg-sabc-red-dark' : ''}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Anomalies
              </Button>
            </Link>
          </div>
        </div>

        {section === 'dashboard' ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm text-sabc-gray-600">
                    <BarChart3 className="h-4 w-4" />
                    Total évaluations
                  </div>
                  <div className="text-3xl font-bold text-sabc-gray-900">{dashboard?.kpis?.total_evaluations ?? 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm text-sabc-gray-600">
                    <Globe2 className="h-4 w-4" />
                    Collaborateurs évalués
                  </div>
                  <div className="text-3xl font-bold text-sabc-gray-900">{dashboard?.kpis?.unique_users ?? 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm text-sabc-gray-600">
                    <TrendingUp className="h-4 w-4" />
                    Score moyen
                  </div>
                  <div className="text-3xl font-bold text-sabc-gray-900">
                    {dashboard?.kpis?.average_score != null ? Number(dashboard.kpis.average_score).toFixed(2) : '0.00'}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Répartition des statuts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {statuses.length === 0 ? (
                    <p className="text-sm text-sabc-gray-500">Aucune donnée de statut disponible.</p>
                  ) : statuses.map((row: any, index: number) => (
                    <div key={`${row.statut}-${index}`} className="flex items-center justify-between rounded-lg border border-sabc-gray-200 p-3">
                      <span className="font-medium text-sabc-gray-900">{row.statut}</span>
                      <Badge variant="outline">{row.count}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Canaux d’évaluation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {channels.length === 0 ? (
                    <p className="text-sm text-sabc-gray-500">Aucune donnée de canal disponible.</p>
                  ) : channels.map((row: any, index: number) => (
                    <div key={`${row.channel}-${index}`} className="rounded-lg border border-sabc-gray-200 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sabc-gray-900">{row.channel}</span>
                        <Badge variant="outline">{row.total ?? row.count ?? 0}</Badge>
                      </div>
                      <div className="mt-1 text-sm text-sabc-gray-600">
                        Score moyen: {row.average_score != null ? Number(row.average_score).toFixed(2) : Number(row.moyenne ?? 0).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tendance de performance</CardTitle>
              </CardHeader>
              <CardContent>
                {trend.length === 0 ? (
                  <p className="text-sm text-sabc-gray-500">Aucune tendance disponible.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Période</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Volume</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trend.map((row: any, index: number) => (
                        <TableRow key={`${row.period}-${index}`}>
                          <TableCell>{row.period}</TableCell>
                          <TableCell>{row.score != null ? Number(row.score).toFixed(2) : '0.00'}</TableCell>
                          <TableCell>{row.count ?? 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}

        {section === 'regions' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analyse régionale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-w-sm">
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une région" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region: any) => (
                        <SelectItem key={region.id_region} value={region.id_region}>
                          {region.nom_region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Total évaluations</div><div className="text-2xl font-bold">{regionStats?.total_evaluations ?? 0}</div></CardContent></Card>
                  <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Validées</div><div className="text-2xl font-bold">{regionStats?.validees ?? 0}</div></CardContent></Card>
                  <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Score moyen</div><div className="text-2xl font-bold">{regionStats?.score_moyen != null ? Number(regionStats.score_moyen).toFixed(2) : '0.00'}</div></CardContent></Card>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Classement régional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Évalués</div><div className="text-2xl font-bold">{regionClassement?.total_evalues ?? 0}</div></CardContent></Card>
                  <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Moyenne région</div><div className="text-2xl font-bold">{regionClassement?.moyenne_region != null ? Number(regionClassement.moyenne_region).toFixed(2) : '0.00'}</div></CardContent></Card>
                  <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Excellents</div><div className="text-2xl font-bold">{regionClassement?.distribution?.excellent ?? 0}</div></CardContent></Card>
                  <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Faibles</div><div className="text-2xl font-bold">{regionClassement?.distribution?.faible ?? 0}</div></CardContent></Card>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Niveau</TableHead>
                      <TableHead>Volume</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(regionClassement?.distribution || {}).map(([label, value]) => (
                      <TableRow key={label}>
                        <TableCell className="capitalize">{label}</TableCell>
                        <TableCell>{String(value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {section === 'anomalies' ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Total</div><div className="text-2xl font-bold">{anomalies?.total ?? 0}</div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Critiques</div><div className="text-2xl font-bold">{anomalies?.par_severite?.critical ?? 0}</div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Warnings</div><div className="text-2xl font-bold">{anomalies?.par_severite?.warning ?? 0}</div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Info</div><div className="text-2xl font-bold">{anomalies?.par_severite?.info ?? 0}</div></CardContent></Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Liste des anomalies</span>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Rafraîchir
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {anomalyRows.length === 0 ? (
                  <p className="text-sm text-sabc-gray-500">Aucune anomalie détectée.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Matricule</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Sévérité</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {anomalyRows.map((row: any, index: number) => (
                        <TableRow key={`${row.type}-${row.matricule ?? 'global'}-${index}`}>
                          <TableCell>{row.type}</TableCell>
                          <TableCell>{row.matricule || 'Global'}</TableCell>
                          <TableCell>{row.description}</TableCell>
                          <TableCell>
                            <Badge variant={row.severite === 'critical' ? 'destructive' : row.severite === 'warning' ? 'secondary' : 'outline'}>
                              {row.severite}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
