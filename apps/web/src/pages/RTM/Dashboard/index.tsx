import React, { Suspense } from 'react';
import RoleManagerDashboardPage from '@/Components/Dashboard/RoleManagerDashboardPage';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';

const RTMDashboard: React.FC = () => (
  <ErrorBoundary>
    <Suspense fallback={<DashboardSkeleton />}>
      <RoleManagerDashboardPage
        fallbackRole="RTM"
        title="Tableau de bord Trade marketing régional"
        subtitle="Indicateurs réels des évaluations et de la performance marketing régionale."
        teamTitle="Équipe marketing régionale"
      />
    </Suspense>
  </ErrorBoundary>
);

export default RTMDashboard;
