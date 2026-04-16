import React, { Suspense } from 'react';
import RoleManagerDashboardPage from '@/Components/Dashboard/RoleManagerDashboardPage';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';

const SRMODashboard: React.FC = () => (
  <ErrorBoundary>
    <Suspense fallback={<DashboardSkeleton />}>
      <RoleManagerDashboardPage
        fallbackRole="SRMO"
        title="Tableau de bord Superviseur Regional Marketing Operation"
        subtitle="Pilotage des scores, de la progression et des subordonnés marketing."
        teamTitle="Équipe marketing opérationnelle"
      />
    </Suspense>
  </ErrorBoundary>
);

export default SRMODashboard;
