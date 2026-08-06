import React from 'react';
import { Head } from '@/lib/inertia-shim';
import { Card, CardContent } from '@/Components/UI/Card';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert';
import { Button } from '@/Components/UI/Button';
import Badge from '@/Components/UI/Badge';
import { useEvaluationWorkflowData } from '@/Hooks/queries';
import { EvaluationPageLayout } from './shared';
import { formatDateLabel } from '@/Components/Dashboard/RoleDashboardShared';
import { useAuthContext } from '@/Contexts/AuthContext';
import { filterApplicableRules } from '@/utils/rules';
import {
  CalendarClock,
  PlayCircle,
  CheckCircle2,
  Clock,
  Users2,
  ClipboardCheck,
  Inbox,
  Send,
  BarChart2,
} from 'lucide-react';

const EvaluationsIndex: React.FC = () => {
  const { user } = useAuthContext();
  const { data } = useEvaluationWorkflowData();

  const hasPeriod = Boolean(data.activePeriod);
  const hasTargets = data.summary.eligibleTargets > 0;
  const hasApplicableTarget = data.eligibleGroups.some((group) =>
    group.targets.some((target: Record<string, any>) =>
      filterApplicableRules(
        data.rules,
        user?.role_nom || user?.role,
        target.role_nom || target.role,
        target.workflowType ?? null,
      ).length > 0,
    ),
  );
  const canStart = hasPeriod && hasTargets && hasApplicableTarget;
  const blockedStartLabel = !hasPeriod
    ? 'Aucune campagne ouverte'
    : !hasTargets
      ? 'Aucune cible éligible'
      : 'Aucune règle applicable';

  const draftsCount = data.summary.drafts;
  const submittedCount = data.summary.submitted;

  const quickLinks = [
    {
      title: 'Mes évaluations',
      href: '/evaluations/mine',
      icon: <ClipboardCheck className="h-5 w-5 text-sabc-red-primary" />,
    },
    {
      title: 'À compléter',
      href: '/evaluations/pending',
      icon: <Clock className="h-5 w-5 text-sabc-red-primary" />,
    },
    {
      title: 'Reçues',
      href: '/evaluations/recues',
      icon: <Inbox className="h-5 w-5 text-sabc-red-primary" />,
    },
    {
      title: 'Données',
      href: '/evaluations/donnees',
      icon: <Send className="h-5 w-5 text-sabc-red-primary" />,
    },
    {
      title: 'Historique',
      href: '/evaluations/historique',
      icon: <BarChart2 className="h-5 w-5 text-sabc-red-primary" />,
    },
  ];

  return (
    <EvaluationPageLayout pageTitle="Évaluations">
      <Head title="Évaluations" />
      <div className="mx-auto max-w-6xl space-y-6 py-6">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-sabc-gray-900 dark:text-white">Évaluations</h1>
          <p className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
            Tableau de bord personnel — campagne en cours et progression.
          </p>
        </div>

        {/* ── Statut période active ───────────────────────────────────────────── */}
        {hasPeriod ? (
          <Alert className="border-sabc-red-primary/30 bg-sabc-red-primary/5">
            <CalendarClock className="h-4 w-4 text-sabc-red-primary" />
            <AlertTitle className="text-sabc-red-primary">Campagne ouverte</AlertTitle>
            <AlertDescription className="text-sabc-gray-700 dark:text-sabc-gray-300">
              <span className="font-medium">
                {data.activePeriod!.nom_periode || data.activePeriod!.code_periode}
              </span>
              {data.activePeriod!.date_fin && (
                <span>
                  {' '}— clôture le{' '}
                  <span className="font-semibold">
                    {formatDateLabel(data.activePeriod!.date_fin)}
                  </span>
                </span>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <CalendarClock className="h-4 w-4" />
            <AlertTitle>Aucune campagne ouverte</AlertTitle>
            <AlertDescription>
              Aucun cycle d'évaluation n'est actif pour l'instant. Contactez l'administrateur pour ouvrir une période.
            </AlertDescription>
          </Alert>
        )}

        {/* ── Carte de progression ────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Badge variant="primary">Ma progression</Badge>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Cibles éligibles */}
              <div className="flex items-center gap-3 rounded-lg border border-sabc-gray-200 bg-sabc-gray-50 p-4 dark:border-sabc-gray-700 dark:bg-sabc-gray-800">
                <span className="rounded-lg bg-sabc-red-primary/10 p-2">
                  <Users2 className="h-6 w-6 text-sabc-red-primary" />
                </span>
                <div>
                  <div className="text-2xl font-bold text-sabc-gray-900 dark:text-white">
                    {data.summary.eligibleTargets}
                  </div>
                  <div className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">Cibles éligibles</div>
                </div>
              </div>

              {/* Évaluations en cours */}
              <div className="flex items-center gap-3 rounded-lg border border-sabc-gray-200 bg-sabc-gray-50 p-4 dark:border-sabc-gray-700 dark:bg-sabc-gray-800">
                <span className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
                  <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </span>
                <div>
                  <div className="text-2xl font-bold text-sabc-gray-900 dark:text-white">
                    {draftsCount}
                  </div>
                  <div className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">En cours (brouillons)</div>
                </div>
              </div>

              {/* Évaluations soumises */}
              <div className="flex items-center gap-3 rounded-lg border border-sabc-gray-200 bg-sabc-gray-50 p-4 dark:border-sabc-gray-700 dark:bg-sabc-gray-800">
                <span className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                  <CheckCircle2 className="h-6 w-6 text-sabc-success dark:text-green-400" />
                </span>
                <div>
                  <div className="text-2xl font-bold text-sabc-gray-900 dark:text-white">
                    {submittedCount}
                  </div>
                  <div className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">Soumises / validées</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── CTA principal ───────────────────────────────────────────────────── */}
        <div className="flex justify-center">
          {canStart ? (
            <a href="/evaluations/mine">
              <Button className="h-12 gap-2 bg-sabc-red-primary px-8 text-base font-semibold text-white hover:bg-sabc-red-dark">
                <PlayCircle className="h-5 w-5" />
                Démarrer / Reprendre mes évaluations
              </Button>
            </a>
          ) : (
            <Button
              disabled
              className="h-12 gap-2 px-8 text-base font-semibold"
              variant="outline"
            >
              <PlayCircle className="h-5 w-5" />
              {blockedStartLabel}
            </Button>
          )}
        </div>

        {/* ── Liens rapides ───────────────────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-sabc-gray-500 dark:text-sabc-gray-400">
            Accès rapide
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {quickLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-2 rounded-lg border border-sabc-gray-200 bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-sabc-red-primary hover:shadow-md dark:border-sabc-gray-700 dark:bg-sabc-gray-900"
              >
                <span className="rounded-md bg-sabc-red-primary/10 p-2">
                  {link.icon}
                </span>
                <span className="text-sm font-medium text-sabc-gray-800 dark:text-sabc-gray-200">
                  {link.title}
                </span>
              </a>
            ))}
          </div>
        </div>

      </div>
    </EvaluationPageLayout>
  );
};

export default EvaluationsIndex;
