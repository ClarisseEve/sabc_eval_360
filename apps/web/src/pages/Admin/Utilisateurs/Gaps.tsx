import React, { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, GraduationCap, ShieldAlert, Table2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, LabelList, Legend, Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { adminApi, analyticsApi } from '@/Services/api';
import { useAdminUsers } from '@/Hooks/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Input } from '@/Components/UI/Input';
import { Badge } from '@/Components/UI/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/Components/UI/Pagination';
import { PageHeader } from '@/Components/UI/Page';
import { EmptyState } from '@/Components/UI/EmptyState';
import { AdminUsersLayout } from './shared';
import { paginateList } from '@/utils/adminUi';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/Components/UI/Dialog';
import { DashboardExportMenu } from '@/Components/Dashboard/DashboardExportMenu';

const TYPE_LABELS: Record<string, string> = {
  auto: 'Auto-évaluation',
  pairs: 'Évaluation pair',
  descendante: 'Évaluation manager',
  ascendante: 'Évaluation ascendante',
  '360': 'Évaluation 360°',
};

const EVALUATION_TYPES = [
  ['Auto-évaluation', 'auto'],
  ['Évaluation pairs', 'pairs'],
  ['Évaluation manager', 'descendante'],
] as const;

function formatScore(score: number | null | undefined) {
  return score == null ? '—' : `${Number(score).toFixed(2)}/5`;
}

function roundScore(value: number) {
  return Number(value.toFixed(2));
}

function AggregatedScore({ entry }: { entry?: { score?: number | null; nb_evaluateurs?: number; nb_evaluations?: number } }) {
  if (!entry) return <span>—</span>;
  return (
    <span title={`${entry.nb_evaluations ?? 0} évaluation(s), ${entry.nb_evaluateurs ?? 0} évaluateur(s)`}>
      {formatScore(entry.score)}
      <span className="ml-1 text-xs text-sabc-gray-500">×{entry.nb_evaluations ?? 0}</span>
    </span>
  );
}

export default function UserGaps() {
  const chartsRef = useRef<HTMLDivElement>(null);
  const { data: usersData } = useAdminUsers({ limit: 1000 });
  const { data: gapData, isLoading } = useQuery({
    queryKey: ['admin', 'evaluation-gaps'],
    queryFn: () => analyticsApi.evaluationGaps().then((response) => response.data),
  });
  const { data: branchesData } = useQuery({
    queryKey: ['admin', 'structure', 'branches'],
    queryFn: () => adminApi.structure.branches().then((response) => response.data),
  });
  const [search, setSearch] = useState('');
  const [metierFilter, setMetierFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [brancheFilter, setBrancheFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedMatricule, setSelectedMatricule] = useState<string | null>(null);
  const [tableOpen, setTableOpen] = useState(false);
  const pageSize = 15;

  const users: any[] = usersData?.data ?? (Array.isArray(usersData) ? usersData : []);
  const usersByMatricule = useMemo(
    () => new Map<string, any>(users.map((user: any) => [String(user.matricule), user])),
    [users],
  );
  const profiles = Array.isArray(gapData?.profils) ? gapData.profils : [];
  const branches: any[] = Array.isArray(branchesData) ? branchesData : [];
  const filterOptions = useMemo(() => ({
    metiers: [...new Set(users.map((user) => String(user.role_nom || user.role || '').trim()).values())].filter(Boolean).sort(),
    regions: [...new Set(users.map((user) => String(user.region_nom || '').trim()).values())].filter(Boolean).sort(),
    branches: branches
      .map((branch) => ({ id: String(branch.id_branche), label: String(branch.nom_branche || branch.id_branche) }))
      .sort((left, right) => left.label.localeCompare(right.label, 'fr')),
  }), [branches, users]);
  const filteredProfiles = useMemo(() => {
    const term = search.trim().toLowerCase();
    return profiles.filter((profile: any) => {
      const user = usersByMatricule.get(String(profile.matricule));
      const matchesSearch = !term || [profile.matricule, user?.nom, user?.prenom, user?.role_nom, user?.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
      const matchesMetier = metierFilter === 'all' || String(user?.role_nom || user?.role || '') === metierFilter;
      const matchesRegion = regionFilter === 'all' || String(user?.region_nom || '') === regionFilter;
      const matchesBranche = brancheFilter === 'all' || String(user?.id_branche || '') === brancheFilter;
      return matchesSearch && matchesMetier && matchesRegion && matchesBranche;
    });
  }, [profiles, search, metierFilter, regionFilter, brancheFilter, usersByMatricule]);
  const paginatedProfiles = useMemo(
    () => paginateList(filteredProfiles, { page, pageSize }),
    [filteredProfiles, page],
  );
  const anomalyCount = filteredProfiles.filter((profile: any) => profile.anomalie).length;
  const deficitCount = filteredProfiles.reduce((total: number, profile: any) => total + Number(profile.deficits ?? 0), 0);
  const selectedProfile = profiles.find((profile: any) => profile.matricule === selectedMatricule);
  const selectedUser = selectedProfile ? usersByMatricule.get(String(selectedProfile.matricule)) : null;

  const evaluationChartData = useMemo(() => EVALUATION_TYPES.map(([label, key]) => {
    const values = filteredProfiles
      .map((profile: any) => profile.types?.[key]?.score)
      .filter((value: unknown): value is number => value != null && Number.isFinite(Number(value)))
      .map(Number);
    const average = values.length ? values.reduce((sum: number, value: number) => sum + value, 0) / values.length : 0;

    return {
      axe: label,
      score: roundScore(average),
      hasData: values.length > 0,
    };
  }), [filteredProfiles]);
  const radarData = evaluationChartData;
  const averageScores = evaluationChartData.filter((entry) => entry.hasData).map((entry) => entry.score);
  const sortedAverageScores = [...averageScores].sort((left, right) => left - right);
  const medianIndex = Math.floor(sortedAverageScores.length / 2);
  const evaluationMedian = sortedAverageScores.length === 0
    ? 0
    : roundScore(sortedAverageScores.length % 2 === 0
      ? (sortedAverageScores[medianIndex - 1] + sortedAverageScores[medianIndex]) / 2
      : sortedAverageScores[medianIndex]);
  const averageOfAverages = averageScores.length
    ? averageScores.reduce((sum, value) => sum + value, 0) / averageScores.length
    : 0;
  const evaluationVariance = averageScores.length
    ? roundScore(averageScores.reduce((sum, value) => sum + (value - averageOfAverages) ** 2, 0) / averageScores.length)
    : 0;

  React.useEffect(() => setPage(1), [search, metierFilter, regionFilter, brancheFilter]);

  return (
    <AdminUsersLayout title="Gaps d’évaluation par profil">
      <PageHeader
        title="Gaps d’évaluation par profil"
        description="Comparez l’auto-évaluation, les pairs et le manager pour repérer les écarts de perception et les besoins de développement."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Utilisateurs', to: '/admin/utilisateurs' }, { label: 'Gaps d’évaluation' }]}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Profils analysés</div><div className="text-2xl font-bold">{profiles.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Profils en anomalie</div><div className="text-2xl font-bold text-sabc-error">{anomalyCount}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Déficits de compétence</div><div className="text-2xl font-bold text-sabc-warning">{deficitCount}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Seuil de divergence</div><div className="text-2xl font-bold">{gapData?.seuil_divergence ?? 1.5} pts</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Radar des écarts de perception</CardTitle>
            <p className="mt-1 text-sm text-sabc-gray-600">Cliquez sur le graphique pour consulter le tableau détaillé des profils et des compétences.</p>
          </div>
          <DashboardExportMenu targetRef={chartsRef} filename="gaps-evaluation" />
        </CardHeader>
        <CardContent>
          <div ref={chartsRef} className="space-y-4">
          <div className="mb-5 grid gap-3 rounded-lg border border-sabc-gray-200 bg-sabc-gray-50 p-4 md:grid-cols-3">
            <label className="text-sm font-medium text-sabc-gray-700">
              Métier
              <select value={metierFilter} onChange={(event) => setMetierFilter(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-sabc-gray-300 bg-white px-3 text-sm font-normal text-sabc-gray-800 focus:border-sabc-red-primary focus:outline-none focus:ring-2 focus:ring-sabc-red-primary/20">
                <option value="all">Tous les métiers</option>
                {filterOptions.metiers.map((metier) => <option key={metier} value={metier}>{metier}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-sabc-gray-700">
              Région
              <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-sabc-gray-300 bg-white px-3 text-sm font-normal text-sabc-gray-800 focus:border-sabc-red-primary focus:outline-none focus:ring-2 focus:ring-sabc-red-primary/20">
                <option value="all">Toutes les régions</option>
                {filterOptions.regions.map((region) => <option key={region} value={region}>{region}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-sabc-gray-700">
              Branche
              <select value={brancheFilter} onChange={(event) => setBrancheFilter(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-sabc-gray-300 bg-white px-3 text-sm font-normal text-sabc-gray-800 focus:border-sabc-red-primary focus:outline-none focus:ring-2 focus:ring-sabc-red-primary/20">
                <option value="all">Toutes les branches</option>
                {filterOptions.branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.label}</option>)}
              </select>
            </label>
          </div>
          {isLoading ? <div className="p-8 text-center text-sabc-gray-500">Analyse des évaluations…</div> : null}
          {!isLoading && filteredProfiles.length === 0 ? <EmptyState title="Aucun gap d’évaluation" description="Aucune évaluation valide par compétence n’est disponible pour l’administration." /> : null}
          {!isLoading && filteredProfiles.length > 0 ? (
            <button type="button" className="block w-full cursor-pointer rounded-xl border border-sabc-gray-200 bg-white p-2 text-left transition hover:border-sabc-red-primary/60 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sabc-red-primary/40" onClick={() => setTableOpen(true)} aria-label="Ouvrir le tableau détaillé des gaps">
              <div className="grid gap-4 xl:grid-cols-2">
                <div>
                  <div className="px-3 pt-3 text-sm font-semibold text-sabc-gray-800">Écart de perception</div>
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={radarData} outerRadius="72%">
                      <PolarGrid stroke="var(--sabc-gray-200)" />
                      <PolarAngleAxis dataKey="axe" tick={{ fill: 'var(--sabc-gray-700)', fontSize: 14, fontWeight: 600 }} />
                      <PolarRadiusAxis domain={[0, 5]} tick={{ fill: 'var(--sabc-gray-500)', fontSize: 12 }} />
                      <Radar name="Score moyen / 5" dataKey="score" stroke="var(--sabc-red-primary)" fill="var(--sabc-red-primary)" fillOpacity={0.28} strokeWidth={3} />
                      <Tooltip cursor={false} formatter={(value: number) => [`${Number(value).toFixed(2)}/5`, 'Score moyen']} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div className="px-3 pt-3 text-sm font-semibold text-sabc-gray-800">Score moyen par type</div>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={radarData} layout="vertical" margin={{ top: 18, right: 24, left: 12, bottom: 18 }}>
                      <CartesianGrid stroke="var(--sabc-gray-200)" horizontal={false} />
                      <XAxis type="number" domain={[0, 5]} tick={{ fill: 'var(--sabc-gray-500)', fontSize: 12 }} />
                      <YAxis type="category" dataKey="axe" width={132} tick={{ fill: 'var(--sabc-gray-700)', fontSize: 12 }} />
                      <ReferenceLine x={evaluationMedian} stroke="var(--sabc-gray-700)" strokeDasharray="5 5" strokeWidth={2} />
                      <Bar name="Score moyen / 5" dataKey="score" fill="var(--sabc-red-primary)" radius={[0, 4, 4, 0]} barSize={24} activeBar={false}>
                        <LabelList dataKey="score" position="right" formatter={(value: number) => `${Number(value).toFixed(2)}/5`} fill="var(--sabc-gray-800)" fontSize={12} />
                      </Bar>
                      <Tooltip cursor={false} formatter={(value: number) => [`${Number(value).toFixed(2)}/5`, 'Score moyen']} />
                      <Legend content={() => (
                        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-2 text-xs text-sabc-gray-600">
                          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-sabc-red-primary" />Score moyen / 5</span>
                          <span className="inline-flex items-center gap-1.5"><span className="w-5 border-t-2 border-dashed border-sabc-gray-700" />Médiane : {evaluationMedian.toFixed(2)}/5</span>
                          <span>Variance moyenne : {evaluationVariance.toFixed(2)}</span>
                        </div>
                      )} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="grid gap-2 border-t border-sabc-gray-200 pt-3 sm:grid-cols-3" aria-label="Valeurs annotées du radar">
                {radarData.map((entry) => (
                  <div key={entry.axe} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-sabc-gray-600">{entry.axe}</span>
                    <span className="font-semibold text-sabc-gray-900">{entry.hasData ? `${entry.score.toFixed(2)}/5` : 'Non évalué'}</span>
                  </div>
                ))}
                <div className="text-xs text-sabc-gray-500 sm:col-span-3">Médiane : {evaluationMedian.toFixed(2)}/5 · Variance moyenne : {evaluationVariance.toFixed(2)}</div>
              </div>
              <div data-html2canvas-ignore="true" className="flex items-center justify-center gap-2 pb-3 text-sm font-medium text-sabc-red-primary"><Table2 className="h-4 w-4" />Cliquer pour ouvrir le tableau des données</div>
            </button>
          ) : null}
          </div>
        </CardContent>
      </Card>

      <Dialog open={tableOpen} onOpenChange={setTableOpen}>
        <DialogContent className="max-h-[90vh] w-[96vw] max-w-7xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Données détaillées des gaps d’évaluation</DialogTitle>
            <DialogDescription>Recherchez un profil et ouvrez son détail par compétence.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher par matricule, nom, rôle..." />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Profil</TableHead><TableHead>Rôle</TableHead><TableHead>Auto</TableHead><TableHead>Pairs</TableHead><TableHead>Manager</TableHead><TableHead>Écart max.</TableHead><TableHead>Besoin</TableHead><TableHead className="text-right">Détail</TableHead></TableRow></TableHeader>
                <TableBody>{paginatedProfiles.items.map((profile: any) => {
                  const user = usersByMatricule.get(String(profile.matricule));
                  const expanded = selectedMatricule === profile.matricule;
                  return <React.Fragment key={profile.matricule}>
                    <TableRow className={profile.anomalie ? 'bg-amber-50/40' : undefined}>
                      <TableCell><div className="font-medium">{[user?.prenom, user?.nom].filter(Boolean).join(' ') || profile.matricule}</div><div className="text-xs text-sabc-gray-500">{profile.matricule}</div></TableCell>
                      <TableCell>{user?.role ?? '—'}</TableCell><TableCell><AggregatedScore entry={profile.types?.auto} /></TableCell><TableCell><AggregatedScore entry={profile.types?.pairs} /></TableCell><TableCell><AggregatedScore entry={profile.types?.descendante} /></TableCell>
                      <TableCell><span className={Number(profile.divergence) >= 1.5 ? 'font-semibold text-sabc-error' : 'text-sabc-gray-700'}>{Number(profile.divergence).toFixed(2)} pts</span></TableCell>
                      <TableCell>{profile.deficits > 0 ? <Badge variant="destructive">{profile.deficits} déficit(s)</Badge> : <Badge variant="success">Concordant</Badge>}</TableCell>
                      <TableCell className="text-right"><button type="button" className="inline-flex items-center gap-1 text-sm font-medium text-sabc-red-primary" onClick={() => setSelectedMatricule(expanded ? null : profile.matricule)}>{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}Voir</button></TableCell>
                    </TableRow>
                    {expanded ? <TableRow><TableCell colSpan={8} className="bg-sabc-gray-50/70 p-4"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-sabc-gray-800"><ShieldAlert className="h-4 w-4 text-sabc-red-primary" />Détail par compétence pour {user ? `${user.prenom} ${user.nom}` : profile.matricule}</div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Compétence</TableHead><TableHead>Niveau requis</TableHead><TableHead>Types en déficit</TableHead><TableHead>Action recommandée</TableHead></TableRow></TableHeader><TableBody>{profile.competences.map((competence: any) => <TableRow key={competence.critere_id}><TableCell className="font-medium">{competence.critere_id}</TableCell><TableCell>{formatScore(competence.niveau_requis)}</TableCell><TableCell>{competence.gap_types.length > 0 ? competence.gap_types.map((gap: any) => `${TYPE_LABELS[gap.type] ?? gap.type} (${formatScore(gap.score)})`).join(', ') : 'Aucun'}</TableCell><TableCell>{competence.gap_types.length > 0 ? <span className="inline-flex items-center gap-1 text-sabc-warning"><GraduationCap className="h-4 w-4" />Formation ou réévaluation ciblée</span> : 'Suivi normal'}</TableCell></TableRow>)}</TableBody></Table></div></TableCell></TableRow> : null}
                  </React.Fragment>;
                })}</TableBody>
              </Table>
            </div>
            {filteredProfiles.length > pageSize ? <Pagination className="pt-2"><PaginationContent><PaginationItem><PaginationPrevious onClick={() => setPage((current) => Math.max(1, current - 1))} aria-disabled={page === 1} className={page === 1 ? 'pointer-events-none opacity-50' : ''} /></PaginationItem>{Array.from({ length: paginatedProfiles.pageCount }, (_, index) => index + 1).map((pageNumber) => <PaginationItem key={pageNumber}><PaginationLink isActive={page === pageNumber} onClick={() => setPage(pageNumber)}>{pageNumber}</PaginationLink></PaginationItem>)}<PaginationItem><PaginationNext onClick={() => setPage((current) => Math.min(paginatedProfiles.pageCount, current + 1))} aria-disabled={page === paginatedProfiles.pageCount} className={page === paginatedProfiles.pageCount ? 'pointer-events-none opacity-50' : ''} /></PaginationItem></PaginationContent></Pagination> : null}
          </div>
        </DialogContent>
      </Dialog>
    </AdminUsersLayout>
  );
}
