import React, { Suspense } from 'react';
import RoleIndividualDashboardPage from '@/Components/Dashboard/RoleIndividualDashboardPage';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';

const ASDashboard: React.FC = () => (
  <ErrorBoundary>
    <Suspense fallback={<DashboardSkeleton />}>
      <RoleIndividualDashboardPage
        fallbackRole="AS"
        title="Tableau de bord Assistant Sponsoring"
        subtitle="Vue personnelle des évaluations et de la progression sur le cycle actif."
      />
    </Suspense>
  </ErrorBoundary>
);

export default ASDashboard;
