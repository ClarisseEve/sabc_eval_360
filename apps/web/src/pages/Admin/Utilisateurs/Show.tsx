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
import { scoreOnTwenty } from './evaluation-score';
import { buildEvaluationCriteria } from '@/pages/Common/Evaluations/shared';
import {
  getAdminUserSelfEvaluations,
  getLatestSubmittedSelfEvaluation,
} from './evaluation-history-data';
import { formatDateFr, formatScore } from '@/utils/helpers';
import { KpiCard } from '@/Components/UI/KpiCard';

const TYPE_LABELS: Record<string, string> = {
  auto: 'Auto-évaluation',
  pairs: 'Pairs',
  descendante: 'Manager',
  ascendante: 'Ascendante',
};

/** Note sur 20 au format français (« 14,80 / 20 »). Absente : « n.d. ». */
function formatOnTwenty(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return null;
  return `${Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / 20`;
}

/** Statut affiché : libellé et couleur suivent la même valeur. */
function userStatusLabel(user: any): string | null {
  const raw = String(user?.statut ?? '').trim();
  if (raw) return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  if (user?.est_actif === undefined || user?.est_actif === null) return null;
  return user.est_actif ? 'Actif' : 'Inactif';
}

function userStatusVariant(label: string | null): 'success' | 'warning' | 'error' | 'secondary' {
  const key = String(label ?? '').toLowerCase();
  if (key === 'actif') return 'success';
  if (key === 'indisponible') return 'warning';
  if (key === 'suspendu') return 'error';
  return 'secondary';
}

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
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['admin', 'users', matricule, 'historique'],
    queryFn: () => adminApi.users.historique(matricule).then((response) => response.data),
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
  const selfEvaluations = getAdminUserSelfEvaluations(historyData?.data);
  const pendingSelfEvaluation = getLatestSubmittedSelfEvaluation(selfEvaluations);
  const pendingSelfScore = pendingSelfEvaluation?.note_globale ?? null;
  const typeScore = (type: string) => profileGap?.types?.[type]?.score
    ?? scoreData?.par_type?.find((entry: any) => entry.type === type)?.moyenne
    ?? (type === 'auto' ? pendingSelfScore : null);
  const typeEvaluationCount = (type: string) => Number(
    profileGap?.types?.[type]?.nb_evaluations
      ?? scoreData?.par_type?.find((entry: any) => entry.type === type)?.nb_evaluations
      ?? (type === 'auto' && pendingSelfEvaluation ? 1 : 0),
  );
  const axes = Array.isArray(axesData?.axes_amelioration) ? axesData.axes_amelioration : [];
  const recommendations = Array.isArray(recommendationsData?.recommandations)
    ? recommendationsData.recommandations
    : Array.isArray(recommendationsData) ? recommendationsData : [];
  const criticalCompetences = Array.isArray(profileGap?.competences)
    ? profileGap.competences.filter((competence: any) => Array.isArray(competence.gap_types) && competence.gap_types.length > 0)
    : [];
  const totalEvaluations = ['auto', 'pairs', 'descendante'].reduce((sum, type) => sum + typeEvaluationCount(type), 0);
  const maxGap = Number(profileGap?.divergence ?? 0);
  const profileScoreOnTwenty = scoreOnTwenty(stats.score_moyen);
  const statusLabel = userStatusLabel(user);
  const overallScoreOnTwenty = scoreOnTwenty(scoreData?.score_global);

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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Rôle" value={user?.role} />
        <KpiCard label="Statut" value={statusLabel} />
        <KpiCard label="Score moyen validé" value={formatOnTwenty(profileScoreOnTwenty)} />
        <KpiCard label="Subordonnés" value={stats.subordonnes ?? subs.length} />
      </div>

      <Card>
        <CardHeader><CardTitle>Résultats des évaluations</CardTitle></CardHeader>
        <CardContent>
          {scoresLoading || gapsLoading ? (
            <div className="p-6 text-center text-sm text-sabc-gray-500">Chargement des résultats d’évaluation…</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
              <KpiCard
                label="Score global"
                value={formatOnTwenty(overallScoreOnTwenty)}
                caption={`Sur 5 : ${formatScore(scoreData?.score_global, 2)}`}
              />
              {[
                ['auto', 'Auto-évaluation'],
                ['pairs', 'Évaluations des pairs'],
                ['descendante', 'Évaluation du manager'],
              ].map(([type, label]) => (
                <KpiCard
                  key={type}
                  label={label}
                  value={formatOnTwenty(scoreOnTwenty(typeScore(type)))}
                  caption={
                    type === 'auto' && pendingSelfEvaluation && !profileGap?.types?.auto && !scoreData?.par_type?.some((entry: any) => entry.type === 'auto')
                      ? 'Soumise, en attente de validation'
                      : `Sur 5 : ${formatScore(typeScore(type), 2)} · ${typeEvaluationCount(type)} évaluation(s)`
                  }
                />
              ))}
              <KpiCard
                label="Écart maximal"
                value={profileGap ? `${maxGap.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pt` : null}
                caption={profileGap && maxGap >= 1.5 ? 'Au-dessus du seuil de 1,5 pt' : 'Seuil : 1,5 pt'}
              />
              <KpiCard label="Nombre d’évaluations" value={totalEvaluations || null} caption="Auto + pairs + manager" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notes de l’auto-évaluation</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {historyLoading ? (
            <div className="p-4 text-center text-sm text-sabc-gray-500">Chargement des notes…</div>
          ) : selfEvaluations.length === 0 ? (
            <p className="text-sm text-sabc-gray-500">Aucune auto-évaluation soumise ou validée avec des notes.</p>
          ) : (
            selfEvaluations.map((evaluation, evaluationIndex) => {
              const criteria = buildEvaluationCriteria(evaluation);
              const evaluationId = evaluation.id_evaluation ?? evaluationIndex;
              const periodLabel =
                evaluation.periode?.nom_periode ??
                evaluation.periode?.code_periode ??
                evaluation.periode_code ??
                'Période non renseignée';

              return (
                <section key={evaluationId} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-sabc-gray-900">{periodLabel}</h3>
                      {evaluation.date_soumission ? (
                        <p className="text-xs text-sabc-gray-500">
                          Soumise le {formatDateFr(evaluation.date_soumission)}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant={evaluation.statut === 'valide' ? 'success' : 'warning'}>
                      {evaluation.statut === 'valide' ? 'Validée' : 'En attente de validation'}
                    </Badge>
                  </div>
                  {criteria.length === 0 ? (
                    <p className="text-sm text-sabc-gray-500">Les notes de cette auto-évaluation ne sont pas disponibles.</p>
                  ) : (
                    <Table className="min-w-[560px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Compétence</TableHead>
                          <TableHead>Note</TableHead>
                          <TableHead>Commentaire</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {criteria.map((criterion) => (
                          <TableRow key={String(criterion.id)}>
                            <TableCell>
                              <div className="font-medium">{criterion.libelle}</div>
                              <div className="text-xs text-sabc-gray-500">{criterion.section}</div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap tabular-nums">{formatScore(criterion.note, 0)}</TableCell>
                            <TableCell>{criterion.commentaire || 'Aucun commentaire'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </section>
              );
            })
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Compétences sous le niveau requis</CardTitle></CardHeader>
          <CardContent>
            {criticalCompetences.length === 0 ? <p className="text-sm text-sabc-gray-500">Aucune compétence sous le niveau requis détectée.</p> : (
              <div className="space-y-3">{criticalCompetences.map((competence: any) => (
                <div key={competence.critere_id} className="rounded-lg border border-sabc-gray-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-sabc-gray-900">{competence.critere_id}</span>
                    <Badge variant="warning">À renforcer</Badge>
                  </div>
                  <div className="mt-1 text-xs text-sabc-gray-600">Niveau requis : {formatScore(competence.niveau_requis, 2)}</div>
                  <div className="mt-2 text-xs text-sabc-gray-700">{competence.gap_types.map((gap: any) => `${TYPE_LABELS[String(gap.type).toLowerCase()] ?? gap.type} : ${formatScore(gap.score, 2)}`).join(' · ')}</div>
                </div>
              ))}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Axes d’amélioration et recommandations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {axes.slice(0, 5).map((axis: any, index: number) => (
              <div key={`${axis.critere ?? 'axe'}-${index}`} className="rounded-lg border border-sabc-gray-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{axis.critere}</div>
                  <Badge variant={axis.priorite === 'haute' ? 'warning' : 'secondary'}>
                    {axis.priorite === 'haute' ? 'Priorité haute' : 'À renforcer'}
                  </Badge>
                </div>
                <div className="mt-1 text-sm text-sabc-gray-600">
                  Score : {formatScore(axis.score_actuel ?? axis.moyenne, 2)} · niveau requis : {formatScore(axis.niveau_requis, 2)} · écart : {axis.ecart != null ? `${Number(axis.ecart).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} pt(s)` : 'n.d.'}
                </div>
                <p className="mt-2 text-sm">{axis.suggestion}</p>
                {axis.objectif_smart ? <p className="mt-1 text-xs text-sabc-gray-500">{axis.objectif_smart}</p> : null}
                {Array.isArray(axis.commentaires_evaluateurs) && axis.commentaires_evaluateurs.length > 0 ? (
                  <div className="mt-2 border-t border-sabc-gray-200 pt-2 text-xs text-sabc-gray-600">
                    <span className="font-medium">Commentaires des évaluateurs : </span>
                    {axis.commentaires_evaluateurs.join(' · ')}
                  </div>
                ) : null}
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

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader><CardTitle>Détails</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="font-medium">Matricule :</span> {user?.matricule || 'n.d.'}</div>
            <div><span className="font-medium">Téléphone :</span> {user?.telephone || 'n.d.'}</div>
            <div><span className="font-medium">Région :</span> {user?.region?.nom_region || 'n.d.'}</div>
            <div><span className="font-medium">Branche :</span> {user?.branche?.nom_branche || 'n.d.'}</div>
            <div><span className="font-medium">Manager :</span> {user?.manager_matricule || 'n.d.'}</div>
            <div className="flex gap-2 pt-2">
              <Badge variant={userStatusVariant(statusLabel)}>{statusLabel ?? 'Statut non renseigné'}</Badge>
              <Badge variant="outline">{user?.est_admin ? 'Administrateur' : 'Utilisateur standard'}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Subordonnés directs</CardTitle></CardHeader>
          <CardContent>
            {subs.length === 0 ? (
              <EmptyState title="Aucun subordonné" description="Cet utilisateur n’encadre aucun collaborateur direct." />
            ) : (
              <Table className="min-w-[420px]">
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
                      <TableCell>{sub.role || 'n.d.'}</TableCell>
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
