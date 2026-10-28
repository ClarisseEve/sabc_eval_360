import React from 'react';
import {
  type LucideIcon,
  ArrowDownRight,
  ArrowUpRight,
  ClipboardList,
  RefreshCw,
  UserRound,
  Users,
} from 'lucide-react';
import { Head } from '@/lib/inertia-shim';
import { DashboardExportMenu } from '@/Components/Dashboard/DashboardExportMenu';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Button } from '@/Components/UI/Button/Button';
import type { PublishedRule } from '@/types/rules';

type LayoutUser = {
  name: string;
  email: string;
  role: string;
  avatar?: string;
};

type DashboardPageFrameProps = {
  layoutUser: LayoutUser;
  title: string;
  subtitle: string;
  periodName?: string | null;
  /** Sources en échec: leur absence rend les chiffres partiels, pas nuls. */
  degradedSources?: string[];
  children: React.ReactNode;
};

type MetricCardProps = {
  label: string;
  value: React.ReactNode;
  caption: string;
  accentClassName?: string;
};

type QuickAction = {
  label: string;
  href: string;
  variant?: 'outline' | 'secondary' | 'default';
};

type ActiveRulesCardProps = {
  rules: PublishedRule[];
  title?: string;
  description?: string;
  emptyMessage?: string;
  maxItems?: number;
};

export function navigateTo(path: string) {
  window.location.href = path;
}

export function formatDateLabel(value: unknown) {
  if (!value) return 'Date non renseignée';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatEvaluationType(value: unknown) {
  const normalized = String(value || '').trim();
  if (!normalized) return 'Type non défini';

  const labelByType: Record<string, string> = {
    auto: 'Auto-évaluation',
    ascendante: 'Évaluation ascendante',
    descendante: 'Évaluation descendante',
    pairs: 'Évaluation pair',
    '360': 'Évaluation 360',
  };

  return labelByType[normalized.toLowerCase()] ?? normalized;
}

type EvaluationTypeMeta = {
  Icon: LucideIcon;
  iconWrap: string;
  border: string;
};

/** Icône par type d'évaluation; une seule teinte neutre pour rester dans la charte. */
export function getEvaluationTypeMeta(value: unknown): EvaluationTypeMeta {
  switch (String(value || '').toLowerCase()) {
    case 'descendante':
      return {
        Icon: ArrowDownRight,
        iconWrap: 'bg-sabc-gray-100 text-sabc-gray-600 dark:bg-sabc-gray-800 dark:text-sabc-gray-300',
        border: 'border-l-sabc-gray-300 dark:border-l-sabc-gray-600',
      };
    case 'ascendante':
      return {
        Icon: ArrowUpRight,
        iconWrap: 'bg-sabc-gray-100 text-sabc-gray-600 dark:bg-sabc-gray-800 dark:text-sabc-gray-300',
        border: 'border-l-sabc-gray-300 dark:border-l-sabc-gray-600',
      };
    case 'auto':
      return {
        Icon: UserRound,
        iconWrap: 'bg-sabc-gray-100 text-sabc-gray-600 dark:bg-sabc-gray-800 dark:text-sabc-gray-300',
        border: 'border-l-sabc-gray-300 dark:border-l-sabc-gray-600',
      };
    case 'pairs':
      return {
        Icon: Users,
        iconWrap: 'bg-sabc-gray-100 text-sabc-gray-600 dark:bg-sabc-gray-800 dark:text-sabc-gray-300',
        border: 'border-l-sabc-gray-300 dark:border-l-sabc-gray-600',
      };
    case '360':
      return {
        Icon: RefreshCw,
        iconWrap: 'bg-sabc-gray-100 text-sabc-gray-600 dark:bg-sabc-gray-800 dark:text-sabc-gray-300',
        border: 'border-l-sabc-gray-300 dark:border-l-sabc-gray-600',
      };
    default:
      return {
        Icon: ClipboardList,
        iconWrap: 'bg-sabc-gray-100 text-sabc-gray-600 dark:bg-sabc-gray-800 dark:text-sabc-gray-300',
        border: 'border-l-sabc-gray-300 dark:border-l-sabc-gray-600',
      };
  }
}

/** Traduit la politique de visibilité technique en libellé lisible. */
export function formatVisibilityLabel(detail: unknown) {
  return String(detail) === 'detailed' ? 'Visibilité détaillée' : 'Visibilité agrégée';
}

export function getPriorityBadgeVariant(priority: unknown): 'error' | 'warning' | 'info' | 'secondary' {
  const value = String(priority || '').toLowerCase();
  if (value === 'haute' || value === 'high') return 'error';
  if (value === 'moyenne' || value === 'medium') return 'warning';
  if (value === 'basse' || value === 'low') return 'info';
  return 'secondary';
}

const STATUS_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  draft: 'Brouillon',
  soumis: 'Soumise',
  submitted: 'Soumise',
  valide: 'Validée',
  validated: 'Validée',
  rejete: 'Rejetée',
  rejeté: 'Rejetée',
};

/** Libellé lisible d'un statut d'évaluation stocké en base (« valide » -> « Validée »). */
export function formatStatusLabel(status: unknown): string {
  const value = String(status || '').toLowerCase();
  return STATUS_LABELS[value] ?? (value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Inconnu');
}

export function getStatusBadgeVariant(status: unknown): 'success' | 'warning' | 'info' | 'secondary' {
  const value = String(status || '').toLowerCase();
  if (value === 'valide' || value === 'validated') return 'success';
  if (value === 'soumis' || value === 'submitted') return 'info';
  if (value === 'brouillon' || value === 'draft') return 'warning';
  return 'secondary';
}

export function DashboardPageFrame({
  layoutUser,
  title,
  subtitle,
  periodName,
  degradedSources = [],
  children,
}: DashboardPageFrameProps) {
  const dashboardRef = React.useRef<HTMLDivElement>(null);

  return (
    <AppLayout user={layoutUser} notifications={[]} pageTitle={title}>
      <Head title={`${title} - SABC Eval360`} />

      <div ref={dashboardRef} className="container mx-auto space-y-6 px-4 py-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-sabc-gray-900 dark:text-white">{title}</h1>
            <p className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            {periodName ? (
              <Badge variant="secondary" className="w-fit">
                Période active : {periodName}
              </Badge>
            ) : null}
            <DashboardExportMenu targetRef={dashboardRef} filename={title} />
          </div>
        </div>

        {degradedSources.length > 0 && (
          <div
            role="alert"
            className="rounded-md border border-sabc-accent/40 bg-sabc-accent-light px-4 py-3 text-sm text-sabc-gray-800 dark:text-sabc-gray-200"
          >
            <span className="font-semibold">Données partielles : </span>
            {degradedSources.join(', ')} n'ont pas pu être chargées. Les chiffres
            affichés sont incomplets: ne les interprétez pas comme des zéros réels.
          </div>
        )}

        {children}
      </div>
    </AppLayout>
  );
}

export function MetricCard({ label, value, caption }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="px-5 py-4">
        <p className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">{label}</p>
        <div className="mt-1 sabc-display text-3xl tabular-nums text-sabc-gray-900 dark:text-white">{value}</div>
        <p className="mt-1 text-xs text-sabc-gray-500 dark:text-sabc-gray-400">{caption}</p>
      </CardContent>
    </Card>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md bg-sabc-gray-50 px-4 py-5 text-sm text-sabc-gray-500 dark:bg-sabc-gray-800 dark:text-sabc-gray-400">
      {message}
    </div>
  );
}

export function ActiveRulesCard({
  rules,
  title = 'Cadre d’évaluation actif',
  description = 'Règles publiées applicables au rôle et au périmètre courant',
  emptyMessage = 'Aucune règle active publiée pour ce périmètre.',
  maxItems = 4,
}: ActiveRulesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        {rules.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <ul className="divide-y divide-sabc-gray-200 overflow-hidden rounded-lg border border-sabc-gray-200 dark:divide-sabc-gray-800 dark:border-sabc-gray-700">
            {rules.slice(0, maxItems).map((rule) => {
              const typeMeta = getEvaluationTypeMeta(rule.type_evaluation);
              const TypeIcon = typeMeta.Icon;
              const detailed = String(rule.visibility_policy.detail) === 'detailed';
              const visibilityLabel = formatVisibilityLabel(rule.visibility_policy.detail);
              const domains = rule.sections.map((section) => section.titre);
              const shownDomains = domains.slice(0, 4);
              const extraDomains = Math.max(0, domains.length - shownDomains.length);

              return (
                <li
                  key={rule.id_regle}
                  className="flex items-start gap-3 px-4 py-3"
                >
                  <span
                    className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${typeMeta.iconWrap}`}
                    aria-hidden
                  >
                    <TypeIcon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <div className="flex min-w-0 items-baseline gap-2">
                        <span className="truncate text-sm font-semibold text-sabc-gray-900 dark:text-white">
                          {rule.nom_regle}
                        </span>
                        {rule.type_evaluation ? (
                          <span className="hidden shrink-0 text-xs text-sabc-gray-400 dark:text-sabc-gray-500 sm:inline">
                            {formatEvaluationType(rule.type_evaluation)}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                          {rule.criteres.length} critère{rule.criteres.length > 1 ? 's' : ''}
                        </span>
                        <Badge variant="outline" title={visibilityLabel}>
                          {detailed ? 'Résultats détaillés' : 'Synthèse agrégée'}
                        </Badge>
                      </div>
                    </div>
                    {shownDomains.length > 0 ? (
                      <p className="mt-1 truncate text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                        {shownDomains.join(' · ')}
                        {extraDomains > 0 ? ` · +${extraDomains}` : ''}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function QuickActionsCard({ actions }: { actions: QuickAction[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions rapides</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {actions.map((action) => (
          <Button
            key={action.href}
            variant={action.variant ?? 'default'}
            size="sm"
            onClick={() => navigateTo(action.href)}
          >
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
