import React, { Suspense } from 'react';
import RoleIndividualDashboardPage from '@/Components/Dashboard/RoleIndividualDashboardPage';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';

const TMODashboard: React.FC = () => (
  <ErrorBoundary>
    <Suspense fallback={<DashboardSkeleton />}>
      <RoleIndividualDashboardPage
        fallbackRole="TMO"
        title="Tableau de bord Trade Marketing Operator"
        subtitle="Mon activité, mes scores et les évaluations à traiter dans le cycle courant."
      />
    </Suspense>
  </ErrorBoundary>
);

export default TMODashboard;
