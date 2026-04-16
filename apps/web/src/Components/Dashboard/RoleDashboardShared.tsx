import React from 'react';
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
  children,
}: DashboardPageFrameProps) {
  return (
    <AppLayout user={layoutUser} notifications={[]} pageTitle={title}>
      <Head title={`${title} - SABC Eval360`} />

      <div className="container mx-auto space-y-5 px-4 py-5">
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

        {children}
      </div>
    </AppLayout>
  );
}

export function MetricCard({ label, value, caption, accentClassName }: MetricCardProps) {
  return (
    <Card className={`border-l-4 ${accentClassName}`}>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-sabc-gray-500 dark:text-sabc-gray-400">{label}</p>
        <div className="mt-1 text-2xl font-semibold text-sabc-gray-900 dark:text-white">{value}</div>
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
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rules.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          rules.slice(0, maxItems).map((rule) => (
            <div key={rule.id_regle} className="rounded-xl border border-sabc-gray-200 p-4 dark:border-sabc-gray-700">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-medium text-sabc-gray-900 dark:text-white">{rule.nom_regle}</div>
                {rule.type_evaluation ? <Badge variant="primary">{formatEvaluationType(rule.type_evaluation)}</Badge> : null}
                <Badge variant="info">{rule.criteres.length} critères</Badge>
                <Badge variant="warning">visibilité {rule.visibility_policy.detail}</Badge>
              </div>
              {rule.description ? (
                <p className="mt-2 text-sm text-sabc-gray-500 dark:text-sabc-gray-400">{rule.description}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {rule.sections.slice(0, 4).map((section) => (
                  <Badge key={`${rule.id_regle}-${section.id}`} variant="secondary">
                    {section.titre}
                  </Badge>
                ))}
              </div>
            </div>
          ))
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
