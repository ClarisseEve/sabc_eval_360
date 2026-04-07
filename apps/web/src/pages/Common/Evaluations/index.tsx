import React from 'react';
import { Head, Link } from '@/lib/inertia-shim';
import { ClipboardCheck, Clock } from 'lucide-react';
import { useEvaluations } from '@/Hooks/queries';
import { EvaluationPageLayout } from './shared';

const EvaluationsIndex: React.FC = () => {
  const { data } = useEvaluations();
  const pendingCount = Array.isArray(data?.en_attente) ? data.en_attente.length : 0;
  const validateCount = Array.isArray(data?.a_valider) ? data.a_valider.length : 0;
  const actions = [
    {
      title: 'Évaluations à compléter',
      description: `${pendingCount} évaluation(s) en attente de vos retours.`,
      href: '/evaluations/pending',
      icon: <Clock className="h-5 w-5 text-sabc-red-primary" />,
    },
    {
      title: 'Mes évaluations et brouillons',
      description: 'Consultez les évaluations que vous avez réalisées ou reçues.',
      href: '/evaluations/mine',
      icon: <ClipboardCheck className="h-5 w-5 text-sabc-red-primary" />,
    },
    ...(validateCount > 0
      ? [{
          title: 'Évaluations à valider',
          description: `${validateCount} soumission(s) attendent votre décision.`,
          href: '/evaluations/validate',
          icon: <ClipboardCheck className="h-5 w-5 text-sabc-red-primary" />,
        }]
      : []),
  ];

  return (
    <EvaluationPageLayout pageTitle="Évaluations">
      <Head title="Évaluations" />
      <div className="mx-auto max-w-6xl py-6">
        <div className="mb-6 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-2xl font-bold text-sabc-gray-900 dark:text-white">Évaluations</h1>
          <p className="text-sabc-gray-600 dark:text-sabc-gray-300">
            Accédez rapidement aux évaluations qui vous concernent.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex h-full flex-col rounded-lg border border-sabc-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-sabc-red-primary hover:shadow-md dark:border-sabc-gray-700 dark:bg-sabc-gray-900"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-md bg-sabc-red-primary/10 p-2">
                  {action.icon}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-sabc-gray-900 dark:text-white">{action.title}</h2>
              <p className="mt-2 text-sm text-sabc-gray-600 dark:text-sabc-gray-300">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </EvaluationPageLayout>
  );
};

export default EvaluationsIndex;
