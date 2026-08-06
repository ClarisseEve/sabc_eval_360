import React, { Suspense } from 'react';
import RoleDirectorDashboardPage from '@/Components/Dashboard/RoleDirectorDashboardPage';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';

const CDTTDashboard: React.FC = () => (
  <ErrorBoundary>
    <Suspense fallback={<DashboardSkeleton />}>
      <RoleDirectorDashboardPage
        fallbackRole="CDTT"
        title="Tableau de bord Chef Département Trade"
        subtitle="Pilotage opérationnel des évaluations et de la performance de l'équipe Trade."
        perimeterTitle="Périmètre Trade"
        enableDomaineToggle
      />
    </Suspense>
  </ErrorBoundary>
);

export default CDTTDashboard;
