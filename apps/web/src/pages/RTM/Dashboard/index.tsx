import React, { Suspense } from 'react';
import RoleDashboardPage from '@/Components/Dashboard/RoleDashboardPage';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';

const RTMDashboard: React.FC = () => (
  <ErrorBoundary>
    <Suspense fallback={<DashboardSkeleton />}>
      <RoleDashboardPage
        fallbackRole="RTM"
        title="Tableau de bord Regional Trade Marketing"
        subtitle="Indicateurs réels des évaluations et de la performance marketing régionale."
        teamTitle="Équipe marketing régionale"
      />
    </Suspense>
  </ErrorBoundary>
);

export default RTMDashboard;
