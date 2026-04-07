import React, { Suspense } from 'react';
import RoleDashboardPage from '@/Components/Dashboard/RoleDashboardPage';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';

const TMODashboard: React.FC = () => (
  <ErrorBoundary>
    <Suspense fallback={<DashboardSkeleton />}>
      <RoleDashboardPage
        fallbackRole="TMO"
        title="Tableau de bord Trade Marketing Operator"
        subtitle="Mon activité, mes scores et les évaluations à traiter dans le cycle courant."
        teamTitle="Collaboration opérationnelle"
      />
    </Suspense>
  </ErrorBoundary>
);

export default TMODashboard;
