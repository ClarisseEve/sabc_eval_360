import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { adaptUserForLayout } from '@/utils/userAdapter';
import { ClipboardCheck, Clock } from 'lucide-react';

const EvaluationsIndex: React.FC<{ user: any; stats?: any }> = ({ user, stats }) => {
  const layoutUser = adaptUserForLayout(user);
  const actions = [
    {
      title: 'Évaluations à compléter',
      description: 'Liste des évaluations en attente de vos retours.',
      href: '/common/evaluations/pending',
      icon: <Clock className="h-5 w-5 text-sabc-red-primary" />,
    },
    {
      title: 'Mes évaluations',
      description: 'Consultez les évaluations que vous avez réalisées ou reçues.',
      href: '/common/evaluations/mine',
      icon: <ClipboardCheck className="h-5 w-5 text-sabc-red-primary" />,
    },
  ];

  return (
    <AppLayout user={layoutUser} pageTitle="Évaluations" notifications={[]}> 
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
    </AppLayout>
  );
};

export default EvaluationsIndex;
