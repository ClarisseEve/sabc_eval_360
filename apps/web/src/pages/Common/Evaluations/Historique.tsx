import React, { useState } from 'react';
import { Head } from '@/lib/inertia-shim';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert';
import Badge from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/UI/Select';
import { evaluationsApi, periodesApi } from '@/Services/api';
import { EvaluationPageLayout, formatDisplayName } from './shared';
import { buildCommonHistoryParams } from './history-query';
import { PageHeader } from '@/Components/UI/Page/PageHeader';
import {
  formatEvaluationType,
  formatStatusLabel,
  getStatusBadgeVariant,
} from '@/Components/Dashboard/RoleDashboardShared';
import { formatDateFr, formatScore } from '@/utils/helpers';

// ─── Types ───────────────────────────────────────────────────────────────────

type Evaluation = Record<string, any>;

// ─── Component ───────────────────────────────────────────────────────────────

const Historique: React.FC = () => {
  const navigate = useNavigate();

  const [statut, setStatut]   = useState<string>('tous');
  const [periode, setPeriode] = useState<string>('tous');
  const [type, setType]       = useState<string>('tous');
  const [page, setPage]       = useState(1);

  const historyParams = buildCommonHistoryParams({ page, statut, periode, type });

  // Fetch historique already filtered and paginated by the API.
  const { data: historiqueData, isLoading, isError } = useQuery({
    queryKey: ['evaluations', 'historique', historyParams],
    queryFn: () => evaluationsApi.historique(historyParams).then((r) => r.data),
  });

  // Fetch périodes for the filter dropdown
  const { data: periodesData } = useQuery({
    queryKey: ['periodes', 'list'],
    queryFn: () => periodesApi.list().then((r) => r.data),
  });

  const evaluations: Evaluation[] = Array.isArray(historiqueData)
    ? historiqueData
    : (historiqueData?.data ?? historiqueData?.evaluations ?? []);
  const historyMeta = Array.isArray(historiqueData) ? undefined : historiqueData?.meta;
  const total = Number(historyMeta?.total ?? evaluations.length);
  const totalPages = Math.max(
    1,
    Number(historyMeta?.totalPages ?? Math.ceil(total / historyParams.limit!)),
  );
  const currentPage = Number(historyMeta?.page ?? page);

  const periodes: Record<string, any>[] = Array.isArray(periodesData)
    ? periodesData
    : (periodesData?.data ?? periodesData?.periodes ?? []);

  // Reset to page 1 when filters change
  function handleStatutChange(v: string)  { setStatut(v);  setPage(1); }
  function handlePeriodeChange(v: string) { setPeriode(v); setPage(1); }
  function handleTypeChange(v: string)    { setType(v);    setPage(1); }

  return (
    <EvaluationPageLayout pageTitle="Historique des évaluations">
      <Head title="Historique des évaluations" />

      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <PageHeader
          title="Historique des évaluations"
          description="Consultez l’ensemble de vos évaluations passées et filtrez par statut, période ou type."
        />

        <Card>
          <CardContent className="p-4">
            {/* ── Filters ── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              {/* Statut */}
              <div className="flex flex-col gap-1 sm:w-48">
                <span className="text-sm font-medium text-sabc-gray-700">Statut</span>
                <Select value={statut} onValueChange={handleStatutChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous</SelectItem>
                    <SelectItem value="brouillon">Brouillon</SelectItem>
                    <SelectItem value="soumis">Soumise</SelectItem>
                    <SelectItem value="valide">Validée</SelectItem>
                    <SelectItem value="rejete">Rejetée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Période */}
              <div className="flex flex-col gap-1 sm:w-56">
                <span className="text-sm font-medium text-sabc-gray-700">Période</span>
                <Select value={periode} onValueChange={handlePeriodeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les périodes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Toutes</SelectItem>
                    {periodes.map((p) => (
                      <SelectItem key={p.id_periode ?? p.id} value={String(p.id_periode ?? p.id)}>
                        {p.nom_periode ?? p.code_periode ?? p.nom ?? String(p.id_periode ?? p.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div className="flex flex-col gap-1 sm:w-48">
                <span className="text-sm font-medium text-sabc-gray-700">Type</span>
                <Select value={type} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous</SelectItem>
                    <SelectItem value="auto">Auto-évaluation</SelectItem>
                    <SelectItem value="descendante">Évaluation descendante</SelectItem>
                    <SelectItem value="pairs">Évaluation pair</SelectItem>
                    <SelectItem value="ascendante">Évaluation ascendante</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Result count */}
              <div className="hidden pb-2 text-sm text-sabc-gray-500 sm:ml-auto sm:block" aria-live="polite">
                {total} résultat{total > 1 ? 's' : ''}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Body ── */}
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-sabc-gray-400">
            Chargement…
          </div>
        )}

        {isError && (
          <Alert variant="destructive">
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              Impossible de charger l’historique des évaluations. Veuillez réessayer.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !isError && evaluations.length === 0 && (
          <Alert>
            <AlertTitle>Aucune évaluation dans l’historique</AlertTitle>
            <AlertDescription>
              Aucune évaluation ne correspond aux filtres sélectionnés.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !isError && evaluations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Évaluations ({total})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-sabc-gray-100">
                {evaluations.map((ev) => {
                  const evalueName = formatDisplayName(ev.evalue ?? {});
                  const statutLabel = formatStatusLabel(ev.statut);
                  const typeLabel   = formatEvaluationType(ev.type_evaluation);
                  const regleLabel  = ev.regle?.nom_regle ?? ev.regle?.libelle ?? typeLabel;
                  const note        = ev.note_globale ?? ev.score_global ?? null;
                  const dateRef     = ev.date_soumission ?? ev.updated_at ?? ev.created_at;

                  return (
                    <div
                      key={ev.id_evaluation ?? ev.id}
                      className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      {/* Left: info */}
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-sabc-gray-900">
                          {evalueName}
                        </span>
                        <span className="text-sm text-sabc-gray-500">{regleLabel}</span>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-sabc-gray-500">
                          {dateRef && <span>{formatDateFr(dateRef)}</span>}
                          {ev.periode?.nom_periode && (
                            <span className="rounded bg-sabc-gray-100 px-1.5 py-0.5">
                              {ev.periode.nom_periode}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: badge + note + action */}
                      <div className="flex flex-shrink-0 items-center gap-3">
                        {note != null && (
                          <span className="text-sm font-semibold tabular-nums text-sabc-gray-700">
                            {formatScore(note)}
                          </span>
                        )}
                        <Badge variant={getStatusBadgeVariant(ev.statut)}>
                          {statutLabel}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/evaluations/${ev.id_evaluation ?? ev.id}`)}
                        >
                          Voir
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Pagination ── */}
        {!isLoading && !isError && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Précédent
            </Button>
            <span className="text-sm text-sabc-gray-500" aria-live="polite">
              Page {currentPage} sur {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Suivant
            </Button>
          </div>
        )}
      </div>
    </EvaluationPageLayout>
  );
};

export default Historique;
