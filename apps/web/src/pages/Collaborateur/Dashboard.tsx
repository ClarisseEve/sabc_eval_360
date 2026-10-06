import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Star, TrendingUp, TrendingDown, ClipboardList, CheckCircle, Inbox } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Button } from '@/Components/UI/Button';
import { EvaluationPageLayout } from '@/pages/Common/Evaluations/shared';
import api from '@/Services/api';
import { DashboardExportMenu } from '@/Components/Dashboard/DashboardExportMenu';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvaluationACompleter {
  id_evaluation: string;
  evaluateur_nom: string;
  evalue_nom: string;
  statut: 'brouillon' | 'soumis';
  id_periode: string;
  nom_periode: string;
  note_globale: null;
  date_soumission: null | string;
  created_at: string;
}

interface EvaluationRecue {
  id_evaluation: string;
  evaluateur_nom: string;
  evalue_nom: string;
  statut: 'soumis' | 'valide';
  id_periode: string;
  nom_periode: string;
  note_globale: number | null;
  date_soumission: string | null;
  created_at: string;
}

interface DashboardKpi {
  score_global: number;
  progression_vs_periode_precedente: number | null;
  nb_a_completer: number;
}

interface CollaborateurDashboardData {
  a_completer: EvaluationACompleter[];
  recues: EvaluationRecue[];
  kpi: DashboardKpi;
}

// ─── Query ────────────────────────────────────────────────────────────────────

async function fetchCollaborateurDashboard(): Promise<CollaborateurDashboardData> {
  const response = await api.get<CollaborateurDashboardData>('/dashboard/collaborateur');
  return response.data;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressionLabel({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <span className="text-sm text-sabc-gray-400">Données insuffisantes</span>;
  }
  if (delta > 0) {
    return (
      <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
        <TrendingUp className="h-4 w-4" />
        +{delta.toFixed(1)}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="flex items-center gap-1 text-sm font-medium text-red-600">
        <TrendingDown className="h-4 w-4" />
        {delta.toFixed(1)}
      </span>
    );
  }
  return <span className="text-sm text-sabc-gray-500">Stable</span>;
}

function StatutBadgeACompleter({ statut }: { statut: EvaluationACompleter['statut'] }) {
  if (statut === 'brouillon') {
    return (
      <span className="inline-flex items-center rounded-lg border border-transparent px-2 py-0.5 text-[0.6875rem] font-medium tracking-wide bg-yellow-100 text-yellow-700">
        Brouillon
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-lg border border-transparent px-2 py-0.5 text-[0.6875rem] font-medium tracking-wide bg-blue-100 text-blue-700">
      Soumis
    </span>
  );
}

function StatutBadgeRecue({ statut }: { statut: EvaluationRecue['statut'] }) {
  if (statut === 'valide') {
    return (
      <span className="inline-flex items-center rounded-lg border border-transparent px-2 py-0.5 text-[0.6875rem] font-medium tracking-wide bg-green-100 text-green-700">
        Validé
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-lg border border-transparent px-2 py-0.5 text-[0.6875rem] font-medium tracking-wide bg-blue-100 text-blue-700">
      Soumis
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const CollaborateurDashboard: React.FC = () => {
  const dashboardRef = React.useRef<HTMLDivElement>(null);
  const { data, isLoading } = useQuery<CollaborateurDashboardData>({
    queryKey: ['dashboard', 'collaborateur'],
    queryFn: fetchCollaborateurDashboard,
    refetchInterval: 60_000,
  });

  return (
    <EvaluationPageLayout pageTitle="Mon Tableau de Bord">
      <div ref={dashboardRef} className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-sabc-gray-900">Mon Tableau de Bord</h1>
            <p className="mt-1 text-sm text-sabc-gray-500">Suivez vos évaluations et votre score global.</p>
          </div>
          <DashboardExportMenu targetRef={dashboardRef} filename="mon-tableau-de-bord" />
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="py-8 text-center text-sm text-sabc-gray-400">Chargement…</div>
        ) : data ? (
          <>
            {/* ── Section 1 & 2 & 3 — KPI Cards ── */}
            <div data-dashboard-export-section className="grid gap-4 md:grid-cols-3">
              {/* Score Global */}
              <Card>
                <CardContent className="flex flex-col gap-3 p-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-sabc-gray-500">
                    <Star className="h-4 w-4 text-sabc-red-primary" />
                    Score global
                  </div>
                  <div className="text-3xl font-bold text-sabc-gray-900">
                    {data.kpi.score_global.toFixed(1)}{' '}
                    <span className="text-lg font-normal text-sabc-gray-400">/ 5</span>
                  </div>
                  {/* Barre de progression */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-sabc-gray-100">
                    <div
                      className="h-full rounded-full bg-sabc-red-primary transition-all duration-500"
                      style={{ width: `${(data.kpi.score_global / 5) * 100}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Progression */}
              <Card>
                <CardContent className="flex flex-col gap-3 p-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-sabc-gray-500">
                    <TrendingUp className="h-4 w-4 text-sabc-red-primary" />
                    Progression vs période précédente
                  </div>
                  <div className="flex items-center">
                    <ProgressionLabel delta={data.kpi.progression_vs_periode_precedente} />
                  </div>
                </CardContent>
              </Card>

              {/* Nb à compléter */}
              <Card>
                <CardContent className="flex flex-col gap-3 p-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-sabc-gray-500">
                    <ClipboardList className="h-4 w-4 text-sabc-red-primary" />
                    À compléter
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={data.kpi.nb_a_completer > 0 ? 'warning' : 'success'}>
                      {data.kpi.nb_a_completer}
                    </Badge>
                    <span className="text-sm text-sabc-gray-500">
                      évaluation{data.kpi.nb_a_completer !== 1 ? 's' : ''} en attente
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Section 4 — Évaluations à compléter ── */}
            <Card data-dashboard-export-section>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="h-5 w-5 text-sabc-red-primary" />
                  Évaluations à compléter
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                {data.a_completer.length === 0 ? (
                  <div className="py-6 text-center text-sm text-sabc-gray-400">
                    Aucune évaluation à compléter.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-sabc-gray-100 text-left text-xs font-medium uppercase tracking-wide text-sabc-gray-400">
                          <th className="py-3 pr-4">Évalué</th>
                          <th className="py-3 pr-4">Période</th>
                          <th className="py-3 pr-4">Statut</th>
                          <th className="py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sabc-gray-50">
                        {data.a_completer.map((item) => (
                          <tr key={item.id_evaluation} className="hover:bg-sabc-gray-50">
                            <td className="py-3 pr-4 font-medium text-sabc-gray-900">
                              {item.evalue_nom}
                            </td>
                            <td className="py-3 pr-4 text-sabc-gray-500">{item.nom_periode}</td>
                            <td className="py-3 pr-4">
                              <StatutBadgeACompleter statut={item.statut} />
                            </td>
                            <td className="py-3">
                              <Link to={`/evaluations/${item.id_evaluation}/edit`}>
                                <Button size="sm" className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark">
                                  Reprendre
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Section 5 — Évaluations reçues ── */}
            <Card data-dashboard-export-section>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Inbox className="h-5 w-5 text-sabc-red-primary" />
                  Évaluations reçues
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                {data.recues.length === 0 ? (
                  <div className="py-6 text-center text-sm text-sabc-gray-400">
                    Aucune évaluation reçue.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-sabc-gray-100 text-left text-xs font-medium uppercase tracking-wide text-sabc-gray-400">
                          <th className="py-3 pr-4">Évaluateur</th>
                          <th className="py-3 pr-4">Période</th>
                          <th className="py-3 pr-4">Statut</th>
                          <th className="py-3">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sabc-gray-50">
                        {data.recues.map((item) => (
                          <tr key={item.id_evaluation} className="hover:bg-sabc-gray-50">
                            <td className="py-3 pr-4 font-medium text-sabc-gray-900">
                              {item.evaluateur_nom}
                            </td>
                            <td className="py-3 pr-4 text-sabc-gray-500">{item.nom_periode}</td>
                            <td className="py-3 pr-4">
                              <StatutBadgeRecue statut={item.statut} />
                            </td>
                            <td className="py-3 font-medium text-sabc-gray-700">
                              {item.note_globale != null
                                ? `${item.note_globale.toFixed(1)} / 5`
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <div data-dashboard-export-section className="flex gap-3">
              <Link to="/evaluations/pending">
                <Button size="sm" className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Voir tout
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-sm text-sabc-gray-400">
            Impossible de charger les données.
          </div>
        )}
      </div>
    </EvaluationPageLayout>
  );
};

export default CollaborateurDashboard;
