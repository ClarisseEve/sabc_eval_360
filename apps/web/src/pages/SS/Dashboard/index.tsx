import React, { Suspense } from 'react';
import RoleManagerDashboardPage from '@/Components/Dashboard/RoleManagerDashboardPage';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';

const SSDashboard: React.FC = () => (
  <ErrorBoundary>
    <Suspense fallback={<DashboardSkeleton />}>
      <RoleManagerDashboardPage
        fallbackRole="SS"
        title="Tableau de bord Superviseur Sponsoring"
        subtitle="Suivi des évaluations, des scores et de l'encadrement sponsoring."
        teamTitle="Équipe sponsoring"
      />
    </Suspense>
  </ErrorBoundary>
);

export default SSDashboard;
