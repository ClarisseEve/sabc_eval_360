import React, { useState } from 'react';
import { Head, Link } from '@/lib/inertia-shim';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import Badge from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { periodesApi } from '@/Services/api';
import { EvaluationPageLayout } from './shared';
import { Inbox, Star, Trophy } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TypeEvaluation = 'auto' | 'pairs' | 'descendante' | '';
type StatutRecue = 'soumis' | 'valide' | '';

interface FiltersRecues {
  statut: StatutRecue;
  id_periode: string;
  type_evaluation: TypeEvaluation;
}

interface EvaluationRecue {
  id_evaluation: string;
  type_evaluation: string;
  statut: 'soumis' | 'valide';
  note_globale: number | null;
  evaluateur: {
    prenom?: string;
    nom?: string;
    matricule?: string;
  } | null;
  periode: {
    nom_periode?: string;
    code_periode?: string;
  } | null;
  created_at: string;
}

interface StatsRecues {
  total: number;
  valide: number;
  note_moyenne: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    auto: 'Auto-évaluation',
    pairs: 'Pairs',
    descendante: 'Hiérarchique',
    ascendante: 'Ascendante',
  };
  return labels[type] ?? type;
}

function periodLabel(evaluation: EvaluationRecue): string {
  return (
    evaluation.periode?.nom_periode ||
    evaluation.periode?.code_periode ||
    'Période inconnue'
  );
}

function evaluatorName(evaluation: EvaluationRecue): string {
  if (evaluation.type_evaluation === 'pairs') return 'Anonyme';
  const ev = evaluation.evaluateur;
  if (!ev) return 'Inconnu';
  return `${ev.prenom ?? ''} ${ev.nom ?? ''}`.trim() || ev.matricule || 'Inconnu';
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  iconClassName: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-6">
        <div className={`rounded-full p-3 ${iconClassName}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-2xl font-semibold text-sabc-gray-900">{value}</div>
          <div className="text-sm text-sabc-gray-500">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const EvaluationsRecues: React.FC = () => {
  const [filters, setFilters] = useState<FiltersRecues>({
    statut: '',
    id_periode: '',
    type_evaluation: '',
  });

  const { data: periodesData } = useQuery({
    queryKey: ['periodes'],
    queryFn: () => periodesApi.list().then((r) => (Array.isArray(r.data) ? r.data : [])),
    staleTime: 60_000,
  });
  const periodes = Array.isArray(periodesData) ? periodesData : [];

  const { data, isLoading } = useQuery<{ data: EvaluationRecue[]; stats: StatsRecues }>({
    queryKey: ['evaluations', 'recues', filters],
    queryFn: async () => {
      const token = localStorage.getItem('sabc_access_token');
      const params = new URLSearchParams();
      if (filters.statut) params.set('statut', filters.statut);
      if (filters.id_periode) params.set('id_periode', filters.id_periode);
      if (filters.type_evaluation) params.set('type_evaluation', filters.type_evaluation);
      const res = await fetch(`/api/evaluations/recues?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });

  const evaluations: EvaluationRecue[] = data?.data ?? [];
  const stats: StatsRecues = data?.stats ?? { total: 0, valide: 0, note_moyenne: null };

  function statutBadgeVariant(statut: string): 'info' | 'success' {
    return statut === 'valide' ? 'success' : 'info';
  }

  return (
    <EvaluationPageLayout pageTitle="Évaluations reçues">
      <Head title="Évaluations reçues" />

      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-2xl font-bold text-sabc-gray-900 dark:text-white">
            Évaluations reçues
          </h1>
          <p className="text-sm text-sabc-gray-500">
            Évaluations dont vous êtes la personne évaluée.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatTile
            label="Total reçues"
            value={isLoading ? '…' : stats.total}
            icon={Inbox}
            iconClassName="bg-blue-100 text-blue-700"
          />
          <StatTile
            label="Validées"
            value={isLoading ? '…' : stats.valide}
            icon={Trophy}
            iconClassName="bg-emerald-100 text-emerald-700"
          />
          <StatTile
            label="Score moyen"
            value={
              isLoading
                ? '…'
                : stats.note_moyenne != null
                  ? `${Number(stats.note_moyenne).toFixed(1)} / 5`
                  : '—'
            }
            icon={Star}
            iconClassName="bg-amber-100 text-amber-700"
          />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="flex flex-wrap gap-4 p-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-sabc-gray-500">Période</label>
              <Select
                value={filters.id_periode}
                onValueChange={(val) =>
                  setFilters((prev) => ({ ...prev, id_periode: val === '__all__' ? '' : val }))
                }
              >
                <SelectTrigger className="h-9 w-48">
                  <SelectValue placeholder="Toutes les périodes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Toutes les périodes</SelectItem>
                  {periodes.map((p: any) => (
                    <SelectItem key={p.id_periode} value={p.id_periode}>
                      {p.nom_periode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-sabc-gray-500">Type</label>
              <select
                value={filters.type_evaluation}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    type_evaluation: e.target.value as TypeEvaluation,
                  }))
                }
                className="h-9 rounded-md border border-sabc-gray-200 bg-white px-3 text-sm text-sabc-gray-900 focus:outline-none focus:ring-2 focus:ring-sabc-red-primary dark:border-sabc-gray-700 dark:bg-sabc-gray-900 dark:text-white"
              >
                <option value="">Tous les types</option>
                <option value="auto">Auto-évaluation</option>
                <option value="pairs">Pairs</option>
                <option value="descendante">Hiérarchique</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-sabc-gray-500">Statut</label>
              <select
                value={filters.statut}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    statut: e.target.value as StatutRecue,
                  }))
                }
                className="h-9 rounded-md border border-sabc-gray-200 bg-white px-3 text-sm text-sabc-gray-900 focus:outline-none focus:ring-2 focus:ring-sabc-red-primary dark:border-sabc-gray-700 dark:bg-sabc-gray-900 dark:text-white"
              >
                <option value="">Tous les statuts</option>
                <option value="soumis">Soumis</option>
                <option value="valide">Validé</option>
              </select>
            </div>

            {(filters.statut || filters.id_periode || filters.type_evaluation) && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters({ statut: '', id_periode: '', type_evaluation: '' })
                  }
                >
                  Réinitialiser
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Évaluations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="py-8 text-center text-sm text-sabc-gray-400">
                Chargement…
              </div>
            ) : evaluations.length === 0 ? (
              <div className="rounded-lg border border-sabc-gray-200 py-12 text-center">
                <Inbox className="mx-auto mb-3 h-10 w-10 text-sabc-gray-400" />
                <p className="text-sm text-sabc-gray-500">
                  Aucune évaluation reçue pour les filtres sélectionnés.
                </p>
              </div>
            ) : (
              evaluations.map((evaluation) => (
                <div
                  key={evaluation.id_evaluation}
                  className="flex flex-col gap-3 rounded-lg border border-sabc-gray-200 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{typeLabel(evaluation.type_evaluation)}</Badge>
                      <Badge variant={statutBadgeVariant(evaluation.statut)}>
                        {evaluation.statut === 'valide' ? 'Validé' : 'Soumis'}
                      </Badge>
                    </div>
                    <div className="mt-1 font-medium text-sabc-gray-900">
                      Évalué par : {evaluatorName(evaluation)}
                    </div>
                    <div className="text-sm text-sabc-gray-500">{periodLabel(evaluation)}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    {evaluation.statut === 'valide' && evaluation.note_globale != null && (
                      <Badge variant="info">
                        {Number(evaluation.note_globale).toFixed(1)} / 5
                      </Badge>
                    )}
                    <Link href={`/evaluations/${evaluation.id_evaluation}`}>
                      <Button variant="outline" size="sm">
                        Consulter
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </EvaluationPageLayout>
  );
};

export default EvaluationsRecues;
