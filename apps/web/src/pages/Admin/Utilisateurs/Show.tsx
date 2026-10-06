import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table';
import { PageHeader } from '@/Components/UI/Page';
import { EmptyState } from '@/Components/UI/EmptyState';
import { adminApi, analyticsApi } from '@/Services/api';
import { useAdminUser } from '@/Hooks/queries';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { useToast } from '@/Contexts/ToastContext';
import { AdminUsersLayout } from './shared';

export default function ShowUser() {
  const { matricule = '' } = useParams();
  const { data } = useAdminUser(matricule);
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { success, error } = useToast();
  const { data: subordinates } = useSuspenseQuery({
    queryKey: ['admin', 'users', matricule, 'subordonnes'],
    queryFn: () => adminApi.users.subordonnes(matricule).then((r) => r.data),
  });
  const { data: scoreData, isLoading: scoresLoading } = useQuery({
    queryKey: ['analytics', 'scores', matricule],
    queryFn: () => analyticsApi.scores(matricule).then((response) => response.data),
    enabled: Boolean(matricule),
  });
  const { data: gapData, isLoading: gapsLoading } = useQuery({
    queryKey: ['analytics', 'evaluation-gaps', matricule],
    queryFn: () => analyticsApi.evaluationGaps(matricule).then((response) => response.data),
    enabled: Boolean(matricule),
  });
  const { data: axesData } = useQuery({
    queryKey: ['analytics', 'axes', matricule],
    queryFn: () => analyticsApi.axesAmelioration(matricule).then((response) => response.data),
    enabled: Boolean(matricule),
  });
  const { data: recommendationsData } = useQuery({
    queryKey: ['analytics', 'recommendations', matricule],
    queryFn: () => analyticsApi.recommandations(matricule).then((response) => response.data),
    enabled: Boolean(matricule),
  });

  const deactivateMutation = useMutation({
    mutationFn: async () => adminApi.users.delete(matricule),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users', matricule] });
      success('Utilisateur désactivé.');
    },
    onError: (e: any) => error(e?.response?.data?.message || e?.message || 'La désactivation a échoué.'),
  });

  const handleDeactivate = async () => {
    const ok = await confirm({
      title: 'Désactiver cet utilisateur ?',
      description: 'Le compte ne pourra plus se connecter tant qu’il n’est pas réactivé.',
      confirmLabel: 'Désactiver',
      variant: 'destructive',
    });
    if (ok) deactivateMutation.mutate();
  };

  const user = data;
  const stats = user?.stats || {};
  const subs = Array.isArray(subordinates) ? subordinates : [];
  const profileGap = Array.isArray(gapData?.profils) ? gapData.profils[0] : null;
  const typeScore = (type: string) => profileGap?.types?.[type]?.score ?? scoreData?.par_type?.find((entry: any) => entry.type === type)?.moyenne ?? null;
  const typeEvaluationCount = (type: string) => Number(profileGap?.types?.[type]?.nb_evaluations ?? scoreData?.par_type?.find((entry: any) => entry.type === type)?.nb_evaluations ?? 0);
  const axes = Array.isArray(axesData?.axes_amelioration) ? axesData.axes_amelioration : [];
  const recommendations = Array.isArray(recommendationsData?.recommandations)
    ? recommendationsData.recommandations
    : Array.isArray(recommendationsData) ? recommendationsData : [];
  const criticalCompetences = Array.isArray(profileGap?.competences)
    ? profileGap.competences.filter((competence: any) => Array.isArray(competence.gap_types) && competence.gap_types.length > 0)
    : [];
  const totalEvaluations = ['auto', 'pairs', 'descendante'].reduce((sum, type) => sum + typeEvaluationCount(type), 0);
  const maxGap = Number(profileGap?.divergence ?? 0);

  return (
    <AdminUsersLayout title={`Utilisateur ${matricule}`}>
      <PageHeader
        title={[user?.prenom, user?.nom].filter(Boolean).join(' ') || matricule}
        description={user?.email}
        breadcrumbs={[{ label: 'Administration' }, { label: 'Utilisateurs', to: '/admin/utilisateurs' }, { label: matricule }]}
        actions={
          <>
            <Link to="/admin/utilisateurs"><Button variant="outline">Retour</Button></Link>
            <Link to={`/admin/utilisateurs/${matricule}/edit`}><Button variant="outline">Modifier</Button></Link>
            <Button variant="destructive" onClick={handleDeactivate} disabled={deactivateMutation.isPending}>Désactiver</Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Rôle</div><div className="text-xl font-bold">{user?.role}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Statut</div><div className="text-xl font-bold">{user?.statut}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Score moyen</div><div className="text-xl font-bold">{stats.score_moyen ?? 'N/A'}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Subordonnés</div><div className="text-xl font-bold">{stats.subordonnes ?? 0}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Résultats des évaluations</CardTitle></CardHeader>
        <CardContent>
          {scoresLoading || gapsLoading ? (
            <div className="p-6 text-center text-sm text-sabc-gray-500">Chargement des résultats d’évaluation…</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <div className="rounded-lg border border-sabc-gray-200 bg-sabc-gray-50 p-4">
                <div className="text-xs text-sabc-gray-500">Score global</div>
                <div className="mt-1 text-2xl font-bold">{scoreData?.score_global != null ? `${Number(scoreData.score_global).toFixed(2)}/5` : '—'}</div>
              </div>
              {[
                ['auto', 'Auto-évaluation'],
                ['pairs', 'Évaluations pairs'],
                ['descendante', 'Évaluation manager'],
              ].map(([type, label]) => (
                <div key={type} className="rounded-lg border border-sabc-gray-200 bg-white p-4">
                  <div className="text-xs text-sabc-gray-500">{label}</div>
                  <div className="mt-1 text-2xl font-bold">{typeScore(type) != null ? `${Number(typeScore(type)).toFixed(2)}/5` : '—'}</div>
                  <div className="mt-1 text-xs text-sabc-gray-500">{typeEvaluationCount(type)} évaluation(s)</div>
                </div>
              ))}
              <div className="rounded-lg border border-sabc-gray-200 bg-white p-4">
                <div className="text-xs text-sabc-gray-500">Écart maximal</div>
                <div className={`mt-1 text-2xl font-bold ${maxGap >= 1.5 ? 'text-sabc-error' : 'text-sabc-success'}`}>{profileGap ? `${maxGap.toFixed(2)} pts` : '—'}</div>
                <div className="mt-1 text-xs text-sabc-gray-500">Seuil : 1,5 pt</div>
              </div>
              <div className="rounded-lg border border-sabc-gray-200 bg-white p-4">
                <div className="text-xs text-sabc-gray-500">Nombre d’évaluations</div>
                <div className="mt-1 text-2xl font-bold">{totalEvaluations || '—'}</div>
                <div className="mt-1 text-xs text-sabc-gray-500">Auto + pairs + manager</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Compétences sous le niveau requis</CardTitle></CardHeader>
          <CardContent>
            {criticalCompetences.length === 0 ? <p className="text-sm text-sabc-gray-500">Aucune compétence sous le niveau requis détectée.</p> : (
              <div className="space-y-3">{criticalCompetences.map((competence: any) => (
                <div key={competence.critere_id} className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-sabc-gray-900">{competence.critere_id}</span>
                    <Badge variant="warning">À renforcer</Badge>
                  </div>
                  <div className="mt-1 text-xs text-sabc-gray-600">Niveau requis : {Number(competence.niveau_requis).toFixed(2)}/5</div>
                  <div className="mt-2 text-xs text-sabc-gray-700">{competence.gap_types.map((gap: any) => `${gap.type} : ${Number(gap.score).toFixed(2)}/5`).join(' · ')}</div>
                </div>
              ))}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Axes d’amélioration et recommandations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {axes.slice(0, 5).map((axis: any) => (
              <div key={axis.critere ?? `${axis.score_actuel ?? axis.moyenne ?? 'axe'}-${Math.random()}`} className="rounded-lg border border-sabc-gray-200 p-3">
                <div className="font-medium">{axis.critere}</div>
                <div className="text-sm text-sabc-gray-600">Score actuel : {axis.score_actuel ?? axis.moyenne ?? '—'}/5 · {axis.suggestion ?? 'Formation ciblée recommandée'}</div>
              </div>
            ))}
            {recommendations.slice(0, 5).map((recommendation: any, index: number) => (
              <div key={recommendation.id ?? `${recommendation.titre ?? 'reco'}-${index}`} className="rounded-lg border border-sabc-gray-200 bg-sabc-gray-50 p-3 text-sm">
                {recommendation.titre ?? recommendation.description ?? recommendation.suggestion ?? 'Recommandation de développement'}
              </div>
            ))}
            {axes.length === 0 && recommendations.length === 0 ? <p className="text-sm text-sabc-gray-500">Aucune recommandation disponible.</p> : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
        <Card>
          <CardHeader><CardTitle>Détails</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="font-medium">Matricule:</span> {user?.matricule}</div>
            <div><span className="font-medium">Téléphone:</span> {user?.telephone || 'N/A'}</div>
            <div><span className="font-medium">Région:</span> {user?.region?.nom_region || user?.id_region}</div>
            <div><span className="font-medium">Branche:</span> {user?.branche?.nom_branche || user?.id_branche}</div>
            <div><span className="font-medium">Manager:</span> {user?.manager_matricule || 'N/A'}</div>
            <div className="flex gap-2 pt-2">
              <Badge variant={user?.est_actif ? 'success' : 'secondary'}>{user?.est_actif ? 'Actif' : 'Inactif'}</Badge>
              <Badge variant={user?.est_admin ? 'primary' : 'secondary'}>{user?.est_admin ? 'Admin' : 'Standard'}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Subordonnés directs</CardTitle></CardHeader>
          <CardContent>
            {subs.length === 0 ? (
              <EmptyState title="Aucun subordonné" description="Cet utilisateur n’encadre aucun collaborateur direct." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Rôle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subs.map((sub: any) => (
                    <TableRow key={sub.matricule}>
                      <TableCell>{sub.matricule}</TableCell>
                      <TableCell>{[sub.prenom, sub.nom].filter(Boolean).join(' ')}</TableCell>
                      <TableCell>{sub.role}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminUsersLayout>
  );
}
