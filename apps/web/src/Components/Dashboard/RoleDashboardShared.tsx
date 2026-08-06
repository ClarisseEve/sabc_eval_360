import React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  ClipboardList,
  Eye,
  EyeOff,
  ListChecks,
  RefreshCw,
  ScrollText,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Head } from '@/lib/inertia-shim';
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
  accentClassName: string;
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

/** Ancre visuelle (icône + couleur) par type d'évaluation pour un repérage immédiat. */
export function getEvaluationTypeMeta(value: unknown): EvaluationTypeMeta {
  switch (String(value || '').toLowerCase()) {
    case 'descendante':
      return {
        Icon: ArrowDownRight,
        iconWrap: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        border: 'border-l-blue-400 dark:border-l-blue-500',
      };
    case 'ascendante':
      return {
        Icon: ArrowUpRight,
        iconWrap: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        border: 'border-l-emerald-400 dark:border-l-emerald-500',
      };
    case 'auto':
      return {
        Icon: UserRound,
        iconWrap: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        border: 'border-l-amber-400 dark:border-l-amber-500',
      };
    case 'pairs':
      return {
        Icon: Users,
        iconWrap: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
        border: 'border-l-indigo-400 dark:border-l-indigo-500',
      };
    case '360':
      return {
        Icon: RefreshCw,
        iconWrap: 'bg-sabc-red-primary/10 text-sabc-red-primary dark:bg-sabc-red-primary/20 dark:text-sabc-red-light',
        border: 'border-l-sabc-red-primary/60',
      };
    default:
      return {
        Icon: ClipboardList,
        iconWrap: 'bg-sabc-gray-100 text-sabc-gray-500 dark:bg-sabc-gray-800 dark:text-sabc-gray-400',
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
  return (
    <AppLayout user={layoutUser} notifications={[]} pageTitle={title}>
      <Head title={`${title} - SABC Eval360`} />

      <div className="container mx-auto space-y-6 px-4 py-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-sabc-gray-900 dark:text-white">{title}</h1>
            <p className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">{subtitle}</p>
          </div>
          {periodName ? (
            <Badge variant="info" className="w-fit">
              Période active: {periodName}
            </Badge>
          ) : null}
        </div>

        {degradedSources.length > 0 && (
          <div
            role="alert"
            className="rounded-md border-l-4 border-sabc-warning bg-sabc-gray-50 px-4 py-3 text-sm text-sabc-gray-700 dark:bg-sabc-gray-800 dark:text-sabc-gray-200"
          >
            <span className="font-medium">Données partielles — </span>
            {degradedSources.join(', ')} n'ont pas pu être chargées. Les chiffres
            affichés sont incomplets: ne les interprétez pas comme des zéros réels.
          </div>
        )}

        {children}
      </div>
    </AppLayout>
  );
}

export function MetricCard({ label, value, caption, accentClassName }: MetricCardProps) {
  return (
    <Card className={`border-l-4 ${accentClassName}`}>
      <CardContent className="p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sabc-gray-500 dark:text-sabc-gray-400">{label}</p>
        <div className="mt-1.5 text-2xl font-bold text-sabc-gray-900 dark:text-white">{value}</div>
        <p className="mt-1.5 text-xs text-sabc-gray-400 dark:text-sabc-gray-500">{caption}</p>
      </CardContent>
    </Card>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-sabc-gray-300 p-6 text-center text-sm text-sabc-gray-500 dark:border-sabc-gray-700 dark:text-sabc-gray-400">
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
    <Card className="border-sabc-info/40 bg-sabc-info/20 dark:border-sabc-info/30 dark:bg-sabc-info/15">
      <CardHeader className="flex-row items-center gap-2.5 space-y-0">
        <span
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sabc-info text-white"
          aria-hidden
        >
          <ScrollText className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        {rules.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <ul className="divide-y divide-sabc-gray-100 overflow-hidden rounded-xl border border-sabc-info/15 bg-white shadow-sm dark:divide-sabc-gray-800 dark:border-sabc-info/20 dark:bg-sabc-gray-900">
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
                  className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-sabc-info/[0.06] dark:hover:bg-sabc-info/10"
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
                        <Badge variant="info" className="gap-1" title={`${rule.criteres.length} critères`}>
                          <ListChecks className="h-3 w-3" aria-hidden />
                          {rule.criteres.length}
                        </Badge>
                        <Badge variant={detailed ? 'success' : 'warning'} className="gap-1" title={visibilityLabel}>
                          {detailed ? <Eye className="h-3 w-3" aria-hidden /> : <EyeOff className="h-3 w-3" aria-hidden />}
                          {detailed ? 'Détaillée' : 'Agrégée'}
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
    <Card className="border-sabc-red-primary/20 bg-gradient-to-r from-sabc-red-primary/5 to-transparent dark:from-sabc-red-primary/10">
      <CardHeader>
        <CardTitle className="text-sabc-red-primary dark:text-sabc-red-light">Actions rapides</CardTitle>
        <CardDescription>Accès direct aux flux déjà en production</CardDescription>
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
