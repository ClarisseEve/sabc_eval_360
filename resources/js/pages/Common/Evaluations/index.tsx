import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { adaptUserForLayout } from '@/utils/userAdapter';

const EvaluationsIndex: React.FC<{ user: any; stats?: any }> = ({ user, stats }) => {
  const layoutUser = adaptUserForLayout(user);
  return (
    <AppLayout user={layoutUser} pageTitle="Évaluations" notifications={[]}> 
      <Head title="Évaluations" />
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-4">Évaluations</h1>
        <div className="text-sabc-gray-600">Bienvenue dans le module d’évaluations.</div>
      </div>
    </AppLayout>
  );
};

export default EvaluationsIndex;
