import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, GraduationCap, ShieldAlert } from 'lucide-react';
import { analyticsApi } from '@/Services/api';
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

const TYPE_LABELS: Record<string, string> = {
  auto: 'Auto-évaluation',
  pairs: 'Évaluation pair',
  descendante: 'Évaluation manager',
  ascendante: 'Évaluation ascendante',
  '360': 'Évaluation 360°',
};

function formatScore(score: number | null | undefined) {
  return score == null ? '—' : `${Number(score).toFixed(2)}/5`;
}

function AggregatedScore({ entry }: { entry?: { score?: number | null; nb_evaluateurs?: number; nb_evaluations?: number } }) {
  if (!entry) return <span>—</span>;
  return (
    <span title={`${entry.nb_evaluations ?? 0} évaluation(s), ${entry.nb_evaluateurs ?? 0} évaluateur(s)`}>
      {formatScore(entry.score)}
      <span className="ml-1 text-xs text-sabc-gray-500">({entry.nb_evaluateurs ?? 0})</span>
    </span>
  );
}

export default function UserGaps() {
  const { data: usersData } = useAdminUsers({ limit: 1000 });
  const { data: gapData, isLoading } = useQuery({
    queryKey: ['admin', 'evaluation-gaps'],
    queryFn: () => analyticsApi.evaluationGaps().then((response) => response.data),
  });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedMatricule, setSelectedMatricule] = useState<string | null>(null);
  const pageSize = 15;

  const users: any[] = usersData?.data ?? (Array.isArray(usersData) ? usersData : []);
  const usersByMatricule = useMemo(
    () => new Map<string, any>(users.map((user: any) => [String(user.matricule), user])),
    [users],
  );
  const profiles = Array.isArray(gapData?.profils) ? gapData.profils : [];
  const filteredProfiles = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return profiles;
    return profiles.filter((profile: any) => {
      const user = usersByMatricule.get(String(profile.matricule));
      return [profile.matricule, user?.nom, user?.prenom, user?.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [profiles, search, usersByMatricule]);
  const paginatedProfiles = useMemo(
    () => paginateList(filteredProfiles, { page, pageSize }),
    [filteredProfiles, page],
  );
  const anomalyCount = profiles.filter((profile: any) => profile.anomalie).length;
  const deficitCount = profiles.reduce((total: number, profile: any) => total + Number(profile.deficits ?? 0), 0);
  const selectedProfile = profiles.find((profile: any) => profile.matricule === selectedMatricule);
  const selectedUser = selectedProfile ? usersByMatricule.get(String(selectedProfile.matricule)) : null;

  React.useEffect(() => setPage(1), [search]);

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
        <CardHeader><CardTitle>Comparaison des profils</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher par matricule, nom, rôle..." />
          {isLoading ? <div className="p-8 text-center text-sabc-gray-500">Analyse des évaluations…</div> : null}
          {!isLoading && filteredProfiles.length === 0 ? <EmptyState title="Aucun gap d’évaluation" description="Aucune évaluation valide par compétence n’est disponible pour l’administration." /> : null}
          {!isLoading && filteredProfiles.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Profil</TableHead><TableHead>Rôle</TableHead><TableHead>Auto</TableHead><TableHead>Pairs</TableHead><TableHead>Manager</TableHead><TableHead>Écart max.</TableHead><TableHead>Besoin</TableHead><TableHead className="text-right">Détail</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {paginatedProfiles.items.map((profile: any) => {
                      const user = usersByMatricule.get(String(profile.matricule));
                      const expanded = selectedMatricule === profile.matricule;
                      return (
                        <React.Fragment key={profile.matricule}>
                          <TableRow className={profile.anomalie ? 'bg-amber-50/40' : undefined}>
                            <TableCell><div className="font-medium">{[user?.prenom, user?.nom].filter(Boolean).join(' ') || profile.matricule}</div><div className="text-xs text-sabc-gray-500">{profile.matricule}</div></TableCell>
                            <TableCell>{user?.role ?? '—'}</TableCell>
                            <TableCell><AggregatedScore entry={profile.types?.auto} /></TableCell>
                            <TableCell><AggregatedScore entry={profile.types?.pairs} /></TableCell>
                            <TableCell><AggregatedScore entry={profile.types?.descendante} /></TableCell>
                            <TableCell><span className={Number(profile.divergence) >= 1.5 ? 'font-semibold text-sabc-error' : 'text-sabc-gray-700'}>{Number(profile.divergence).toFixed(2)} pts</span></TableCell>
                            <TableCell>{profile.deficits > 0 ? <Badge variant="destructive">{profile.deficits} déficit(s)</Badge> : <Badge variant="success">Concordant</Badge>}</TableCell>
                            <TableCell className="text-right"><button type="button" className="inline-flex items-center gap-1 text-sm font-medium text-sabc-red-primary" onClick={() => setSelectedMatricule(expanded ? null : profile.matricule)}>{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}Voir</button></TableCell>
                          </TableRow>
                          {expanded ? (
                            <TableRow><TableCell colSpan={8} className="bg-sabc-gray-50/70 p-4">
                              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-sabc-gray-800"><ShieldAlert className="h-4 w-4 text-sabc-red-primary" />Détail par compétence pour {selectedUser ? `${selectedUser.prenom} ${selectedUser.nom}` : profile.matricule}</div>
                              <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Compétence</TableHead><TableHead>Niveau requis</TableHead><TableHead>Types en déficit</TableHead><TableHead>Action recommandée</TableHead></TableRow></TableHeader><TableBody>
                                {profile.competences.map((competence: any) => <TableRow key={competence.critere_id}><TableCell className="font-medium">{competence.critere_id}</TableCell><TableCell>{formatScore(competence.niveau_requis)}</TableCell><TableCell>{competence.gap_types.length > 0 ? competence.gap_types.map((gap: any) => `${TYPE_LABELS[gap.type] ?? gap.type} (${formatScore(gap.score)})`).join(', ') : 'Aucun'}</TableCell><TableCell>{competence.gap_types.length > 0 ? <span className="inline-flex items-center gap-1 text-sabc-warning"><GraduationCap className="h-4 w-4" />Formation ou réévaluation ciblée</span> : 'Suivi normal'}</TableCell></TableRow>)}
                              </TableBody></Table></div>
                            </TableCell></TableRow>
                          ) : null}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {filteredProfiles.length > pageSize ? <Pagination className="pt-2"><PaginationContent><PaginationItem><PaginationPrevious onClick={() => setPage((current) => Math.max(1, current - 1))} aria-disabled={page === 1} className={page === 1 ? 'pointer-events-none opacity-50' : ''} /></PaginationItem>{Array.from({ length: paginatedProfiles.pageCount }, (_, index) => index + 1).map((pageNumber) => <PaginationItem key={pageNumber}><PaginationLink isActive={page === pageNumber} onClick={() => setPage(pageNumber)}>{pageNumber}</PaginationLink></PaginationItem>)}<PaginationItem><PaginationNext onClick={() => setPage((current) => Math.min(paginatedProfiles.pageCount, current + 1))} aria-disabled={page === paginatedProfiles.pageCount} className={page === paginatedProfiles.pageCount ? 'pointer-events-none opacity-50' : ''} /></PaginationItem></PaginationContent></Pagination> : null}
            </>
          ) : null}
        </CardContent>
      </Card>
    </AdminUsersLayout>
  );
}
