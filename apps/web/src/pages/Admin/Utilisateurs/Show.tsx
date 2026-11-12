import React, { useState } from 'react';
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
  filterAdminUserEvaluations,
  getAdminUserEvaluations,
  getAdminUserEvaluationPeriods,
  getEvaluationGapSummary,
  getLatestSubmittedEvaluation,
} from './evaluation-history-data';
import { formatDateFr, formatScore } from '@/utils/helpers';
import { KpiCard } from '@/Components/UI/KpiCard';

const TYPE_LABELS: Record<string, string> = {
  auto: 'Auto-évaluation',
  pairs: 'Pairs',
  descendante: 'Manager',
  ascendante: 'Ascendante',
  '360': 'Évaluation 360°',
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
  const [evaluationTypeFilter, setEvaluationTypeFilter] = useState('all');
  const [evaluationPeriodFilter, setEvaluationPeriodFilter] = useState('latest');
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
  const profileEvaluations = getAdminUserEvaluations(historyData?.data, matricule);
  const evaluationPeriods = getAdminUserEvaluationPeriods(profileEvaluations);
  const selectedPeriodId = evaluationPeriodFilter === 'latest'
    ? evaluationPeriods[0]?.id ?? ''
    : evaluationPeriodFilter === 'all' ? '' : evaluationPeriodFilter;
  const detailedEvaluations = filterAdminUserEvaluations(profileEvaluations, {
    type: evaluationTypeFilter,
    periodId: selectedPeriodId,
  });
  const filteredCompetences = getEvaluationGapSummary(detailedEvaluations);
  const criticalCompetences = filteredCompetences.filter(
    (competence) => competence.moyenne < competence.niveau_requis,
  );
  const improvementAxes = criticalCompetences;
  const selectedPeriodLabel = evaluationPeriods.find((period) => period.id === selectedPeriodId)?.label;
  const pendingEvaluation = (type: string) => getLatestSubmittedEvaluation(profileEvaluations, type);
  const typeScore = (type: string) => profileGap?.types?.[type]?.score
    ?? scoreData?.par_type?.find((entry: any) => entry.type === type)?.moyenne
    ?? pendingEvaluation(type)?.note_globale
    ?? null;
  const typeEvaluationCount = (type: string) => Number(
    profileGap?.types?.[type]?.nb_evaluations
      ?? scoreData?.par_type?.find((entry: any) => entry.type === type)?.nb_evaluations
      ?? (pendingEvaluation(type) ? 1 : 0),
  );
  const recommendations = Array.isArray(recommendationsData?.recommandations)
    ? recommendationsData.recommandations
    : Array.isArray(recommendationsData) ? recommendationsData : [];
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
                    pendingEvaluation(type) &&
                    !profileGap?.types?.[type] &&
                    !scoreData?.par_type?.some((entry: any) => entry.type === type)
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
        <CardHeader><CardTitle>Notes des évaluations</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 rounded-lg bg-sabc-gray-50 p-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-sabc-gray-700">
              Type d’évaluation
              <select
                className="block w-full rounded-md border border-sabc-gray-300 bg-white px-3 py-2 font-normal"
                value={evaluationTypeFilter}
                onChange={(event) => setEvaluationTypeFilter(event.target.value)}
              >
                <option value="all">Tous les types</option>
                {Object.entries(TYPE_LABELS).map(([type, label]) => (
                  <option key={type} value={type}>{label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium text-sabc-gray-700">
              Trimestre / période
              <select
                className="block w-full rounded-md border border-sabc-gray-300 bg-white px-3 py-2 font-normal"
                value={evaluationPeriodFilter}
                onChange={(event) => setEvaluationPeriodFilter(event.target.value)}
              >
                <option value="latest">Période la plus récente</option>
                <option value="all">Toutes les périodes</option>
                {evaluationPeriods.map((period) => (
                  <option key={period.id} value={period.id}>{period.label}</option>
                ))}
              </select>
            </label>
            <p className="text-xs text-sabc-gray-500 sm:col-span-2">
              Les compétences ci-dessous utilisent les notes des évaluations soumises ou validées
              {selectedPeriodLabel ? ` pour ${selectedPeriodLabel}` : ''}.
            </p>
          </div>
          {historyLoading ? (
            <div className="p-4 text-center text-sm text-sabc-gray-500">Chargement des notes…</div>
          ) : detailedEvaluations.length === 0 ? (
            <p className="text-sm text-sabc-gray-500">Aucune évaluation ne correspond aux filtres sélectionnés.</p>
          ) : (
            detailedEvaluations.map((evaluation, evaluationIndex) => {
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
                      <h3 className="font-semibold text-sabc-gray-900">
                        {TYPE_LABELS[evaluation.type_evaluation] ?? evaluation.type_evaluation} · {periodLabel}
                      </h3>
                      {evaluation.date_soumission ?? evaluation.created_at ? (
                        <p className="text-xs text-sabc-gray-500">
                          Soumise le {formatDateFr(evaluation.date_soumission ?? evaluation.created_at)}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant={evaluation.statut === 'valide' ? 'success' : 'warning'}>
                      {evaluation.statut === 'valide' ? 'Validée' : 'En attente de validation'}
                    </Badge>
                  </div>
                  {evaluation.note_globale != null && Number.isFinite(Number(evaluation.note_globale)) ? (
                    <p className="text-sm font-medium text-sabc-gray-700">
                      Note globale : {formatScore(Number(evaluation.note_globale), 2)} / 5
                    </p>
                  ) : null}
                  {criteria.length === 0 ? (
                    <p className="text-sm text-sabc-gray-500">Les notes de cette évaluation ne sont pas disponibles.</p>
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
              <div className="space-y-3">{criticalCompetences.map((competence) => (
                <div key={competence.id} className="rounded-lg border border-sabc-gray-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-sabc-gray-900">{competence.critere}</span>
                    <Badge variant="warning">À renforcer</Badge>
                  </div>
                  <div className="mt-1 text-xs text-sabc-gray-600">Niveau requis : {formatScore(competence.niveau_requis, 2)}</div>
                  <div className="mt-2 text-xs text-sabc-gray-700">
                    Note : {formatScore(competence.moyenne, 2)} · écart : {formatScore(competence.moyenne - competence.niveau_requis, 2)}
                    {' · '}{competence.nb_evaluations} évaluation(s)
                  </div>
                </div>
              ))}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Axes d’amélioration et recommandations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {improvementAxes.slice(0, 5).map((axis, index) => (
              <div key={`${axis.id}-${index}`} className="rounded-lg border border-sabc-gray-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{axis.critere}</div>
                  <Badge variant={axis.moyenne < 2 ? 'warning' : 'secondary'}>À renforcer</Badge>
                </div>
                <div className="mt-1 text-sm text-sabc-gray-600">
                  Note moyenne : {formatScore(axis.moyenne, 2)} · niveau requis : {formatScore(axis.niveau_requis, 2)} · écart : {formatScore(axis.moyenne - axis.niveau_requis, 2)}
                </div>
                <p className="mt-2 text-sm">Cette compétence est sous le niveau requis dans les évaluations sélectionnées.</p>
                {axis.commentaires.length > 0 ? (
                  <div className="mt-2 border-t border-sabc-gray-200 pt-2 text-xs text-sabc-gray-600">
                    <span className="font-medium">Commentaires des évaluateurs : </span>
                    {axis.commentaires.join(' · ')}
                  </div>
                ) : null}
              </div>
            ))}
            {improvementAxes.length === 0 ? <p className="text-sm text-sabc-gray-500">Aucun axe d’amélioration dans les évaluations sélectionnées.</p> : null}
            {recommendations.length > 0 ? (
              <div className="border-t border-sabc-gray-200 pt-3">
                <h3 className="mb-2 text-sm font-semibold">Recommandations générales (toutes périodes)</h3>
                {recommendations.slice(0, 5).map((recommendation: any, index: number) => (
                  <div key={recommendation.id ?? `${recommendation.titre ?? 'reco'}-${index}`} className="mb-2 rounded-lg border border-sabc-gray-200 bg-sabc-gray-50 p-3 text-sm">
                    {recommendation.titre ?? recommendation.description ?? recommendation.suggestion ?? 'Recommandation de développement'}
                  </div>
                ))}
              </div>
            ) : null}
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
            <div>
              <span className="font-medium">Manager :</span>{' '}
              {user?.manager
                ? `${[user.manager.prenom, user.manager.nom].filter(Boolean).join(' ')} (${user.manager.matricule})`
                : user?.manager_matricule || 'n.d.'}
            </div>
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
