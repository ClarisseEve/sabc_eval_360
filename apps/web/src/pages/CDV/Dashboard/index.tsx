import React, { Suspense } from 'react';
import RoleManagerDashboardPage from '@/Components/Dashboard/RoleManagerDashboardPage';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';

const CDVDashboard: React.FC = () => (
  <ErrorBoundary>
    <Suspense fallback={<DashboardSkeleton />}>
      <RoleManagerDashboardPage
        fallbackRole="CDV"
        title="Tableau de bord Chef District Vente"
        subtitle="Suivi du district, des évaluations en attente et de la performance individuelle."
        teamTitle="Équipe du district"
      />
    </Suspense>
  </ErrorBoundary>
);

export default CDVDashboard;
