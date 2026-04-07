import React, { Suspense } from 'react';
import RoleDashboardPage from '@/Components/Dashboard/RoleDashboardPage';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';

const CDTTDashboard: React.FC = () => (
  <ErrorBoundary>
    <Suspense fallback={<DashboardSkeleton />}>
      <RoleDashboardPage
        fallbackRole="CDTT"
        title="Tableau de bord Chef Département Trade"
        subtitle="Pilotage opérationnel des évaluations et de la performance de l'équipe Trade."
        teamTitle="Équipe Trade"
      />
    </Suspense>
  </ErrorBoundary>
);

export default CDTTDashboard;
