import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Users, Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Button } from '@/Components/UI/Button';
import { EvaluationPageLayout } from '@/pages/Common/Evaluations/shared';
import api from '@/Services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

type StatutCouleur = 'grey' | 'green' | 'orange' | 'red';

interface KpiData {
  total: number;
  completes: number;
  en_attente: number;
  restantes: number;
  taux_completion: number;
}

interface SubordonnéRow {
  matricule: string;
  nom: string;
  prenom: string;
  role_nom: string;
  nb_recues: number;
  nb_donnees: number;
  nb_en_attente: number;
  statut_couleur: StatutCouleur;
}

interface HistoriquePoint {
  mois: string;
  completes: number;
  en_attente: number;
}

interface DashboardManagerData {
  kpi: KpiData;
  subordonnes: SubordonnéRow[];
  historique: HistoriquePoint[];
}

type PrioriteType = 'urgente' | 'normale';

interface ValidationRow {
  id_evaluation: string;
  evaluateur_nom: string;
  evalue_nom: string;
  date_soumission: string;
  jours_attente: number;
  nom_periode: string;
  priorite: PrioriteType;
}

interface ValidationsData {
  data: ValidationRow[];
  meta: {
    total: number;
    page: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statutBadgeClass(couleur: StatutCouleur): string {
  switch (couleur) {
    case 'green':
      return 'bg-green-100 text-green-700';
    case 'orange':
      return 'bg-orange-100 text-orange-700';
    case 'red':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function prioriteBadgeClass(priorite: PrioriteType): string {
  return priorite === 'urgente'
    ? 'bg-red-100 text-red-700'
    : 'bg-gray-100 text-gray-600';
}

async function fetchDashboardManager(idPeriode: string): Promise<DashboardManagerData> {
  const response = await api.get<DashboardManagerData>('/dashboard/manager', {
    params: {
      id_periode: idPeriode || undefined,
    },
  });
  return response.data;
}

async function fetchValidations(
  idPeriode: string,
  page: number,
): Promise<ValidationsData> {
  const response = await api.get<ValidationsData>('/dashboard/manager/validations', {
    params: {
      page,
      limit: 20,
      id_periode: idPeriode || undefined,
    },
  });
  return response.data;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  iconClass?: string;
}

function KpiCard({ icon: Icon, label, value, iconClass = 'text-sabc-red-primary' }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <Icon className={`h-8 w-8 flex-shrink-0 ${iconClass}`} />
        <div>
          <div className="text-2xl font-semibold text-sabc-gray-900">{value}</div>
          <div className="text-sm text-sabc-gray-500">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const ManagerDashboard: React.FC = () => {
  const [selectedPeriode, setSelectedPeriode] = useState('');
  const [validationsPage, setValidationsPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'manager', 'progression', selectedPeriode],
    queryFn: () => fetchDashboardManager(selectedPeriode),
    refetchInterval: 30_000,
  });

  const { data: validationsData, isLoading: validationsLoading } = useQuery({
    queryKey: ['dashboard', 'manager', 'validations', selectedPeriode, validationsPage],
    queryFn: () => fetchValidations(selectedPeriode, validationsPage),
    refetchInterval: 30_000,
  });

  const taux = data?.kpi?.taux_completion ?? 0;
  const tauxDisplay = Math.min(100, Math.round(taux));

  return (
    <EvaluationPageLayout pageTitle="Dashboard Manager">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">

        {/* ── Section 1 — Filtre période ── */}
        <Card>
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:gap-4">
            <div className="flex-1">
              <label
                htmlFor="periode-input"
                className="mb-1 block text-sm font-medium text-sabc-gray-700"
              >
                Identifiant de période (UUID)
              </label>
              <input
                id="periode-input"
                type="text"
                value={selectedPeriode}
                onChange={(e) => {
                  setSelectedPeriode(e.target.value);
                  setValidationsPage(1);
                }}
                placeholder="Ex : 550e8400-e29b-41d4-a716-446655440000"
                className="w-full rounded-lg border border-sabc-gray-300 px-3 py-2 text-sm text-sabc-gray-900 placeholder-sabc-gray-400 focus:border-sabc-red-primary focus:outline-none focus:ring-1 focus:ring-sabc-red-primary"
              />
            </div>
            {selectedPeriode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPeriode('');
                  setValidationsPage(1);
                }}
              >
                Effacer
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ── Section 2 — KPI Cards ── */}
        {isLoading ? (
          <div className="py-8 text-center text-sm text-sabc-gray-400">Chargement…</div>
        ) : isError ? (
          <div className="py-8 text-center text-sm text-red-500">
            Erreur lors du chargement des données du dashboard.
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                icon={Users}
                label="Total évaluations attendues"
                value={data?.kpi?.total ?? 0}
              />
              <KpiCard
                icon={CheckCircle}
                label="Évaluations complétées"
                value={data?.kpi?.completes ?? 0}
                iconClass="text-green-600"
              />
              <KpiCard
                icon={Clock}
                label="En attente"
                value={data?.kpi?.en_attente ?? 0}
                iconClass="text-orange-500"
              />
              <Card>
                <CardContent className="flex flex-col gap-3 p-6">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 flex-shrink-0 text-sabc-red-primary" />
                    <div>
                      <div className="text-2xl font-semibold text-sabc-gray-900">
                        {tauxDisplay}%
                      </div>
                      <div className="text-sm text-sabc-gray-500">Taux de complétion</div>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-sabc-gray-200">
                    <div
                      className="h-2 rounded-full bg-green-500 transition-all duration-500"
                      style={{ width: `${tauxDisplay}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Section 3 — Tableau subordonnés ── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-sabc-red-primary" />
                  Progression de l'équipe
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                {!data?.subordonnes?.length ? (
                  <div className="py-8 text-center text-sm text-sabc-gray-400">
                    Aucun subordonné trouvé pour cette période.
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="border-b border-sabc-gray-200 bg-sabc-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-sabc-gray-600">Nom</th>
                        <th className="px-4 py-3 text-left font-medium text-sabc-gray-600">Rôle</th>
                        <th className="px-4 py-3 text-center font-medium text-sabc-gray-600">Reçues</th>
                        <th className="px-4 py-3 text-center font-medium text-sabc-gray-600">Données</th>
                        <th className="px-4 py-3 text-center font-medium text-sabc-gray-600">En attente</th>
                        <th className="px-4 py-3 text-center font-medium text-sabc-gray-600">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sabc-gray-100">
                      {data.subordonnes.map((row) => (
                        <tr key={row.matricule} className="hover:bg-sabc-gray-50">
                          <td className="px-4 py-3 font-medium text-sabc-gray-900">
                            {row.prenom} {row.nom}
                          </td>
                          <td className="px-4 py-3 text-sabc-gray-500">{row.role_nom}</td>
                          <td className="px-4 py-3 text-center text-sabc-gray-700">{row.nb_recues}</td>
                          <td className="px-4 py-3 text-center text-sabc-gray-700">{row.nb_donnees}</td>
                          <td className="px-4 py-3 text-center text-sabc-gray-700">{row.nb_en_attente}</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${statutBadgeClass(row.statut_couleur)}`}
                            >
                              {row.statut_couleur}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* ── Section 4 — LineChart Recharts ── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-sabc-red-primary" />
                  Historique des 6 derniers mois
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data?.historique ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="completes"
                      stroke="#48BB78"
                      name="Complétées"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="en_attente"
                      stroke="#ED8936"
                      name="En attente"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── Section 5 — Validations en attente ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Validations en attente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {validationsLoading ? (
              <div className="py-8 text-center text-sm text-sabc-gray-400">Chargement…</div>
            ) : !validationsData?.data?.length ? (
              <div className="py-8 text-center text-sm text-sabc-gray-400">
                Aucune validation en attente.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-sabc-gray-200 bg-sabc-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-sabc-gray-600">Évaluateur</th>
                        <th className="px-4 py-3 text-left font-medium text-sabc-gray-600">Évalué</th>
                        <th className="px-4 py-3 text-left font-medium text-sabc-gray-600">Date soumission</th>
                        <th className="px-4 py-3 text-center font-medium text-sabc-gray-600">Jours d'attente</th>
                        <th className="px-4 py-3 text-left font-medium text-sabc-gray-600">Période</th>
                        <th className="px-4 py-3 text-center font-medium text-sabc-gray-600">Priorité</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sabc-gray-100">
                      {validationsData.data.map((row) => (
                        <tr key={row.id_evaluation} className="hover:bg-sabc-gray-50">
                          <td className="px-4 py-3 text-sabc-gray-900">{row.evaluateur_nom}</td>
                          <td className="px-4 py-3 text-sabc-gray-900">{row.evalue_nom}</td>
                          <td className="px-4 py-3 text-sabc-gray-500">
                            {new Date(row.date_soumission).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={
                                row.jours_attente > 3
                                  ? 'font-semibold text-red-600'
                                  : 'text-sabc-gray-700'
                              }
                            >
                              {row.jours_attente}j
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sabc-gray-500">{row.nom_periode}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              className={prioriteBadgeClass(row.priorite)}
                            >
                              {row.priorite}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {validationsData.meta.total > 20 && (
                  <div className="flex items-center justify-between border-t border-sabc-gray-200 px-4 py-3">
                    <span className="text-xs text-sabc-gray-500">
                      {validationsData.meta.total} résultat{validationsData.meta.total > 1 ? 's' : ''} au total
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={validationsPage <= 1}
                        onClick={() => setValidationsPage((p) => Math.max(1, p - 1))}
                      >
                        Précédent
                      </Button>
                      <span className="flex items-center px-2 text-sm text-sabc-gray-700">
                        Page {validationsPage}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={validationsPage * 20 >= validationsData.meta.total}
                        onClick={() => setValidationsPage((p) => p + 1)}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

      </div>
    </EvaluationPageLayout>
  );
};

export default ManagerDashboard;
