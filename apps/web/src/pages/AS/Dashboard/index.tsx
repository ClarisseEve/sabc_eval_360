import React, { Suspense } from 'react';
import RoleDashboardPage from '@/Components/Dashboard/RoleDashboardPage';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';

const ASDashboard: React.FC = () => (
  <ErrorBoundary>
    <Suspense fallback={<DashboardSkeleton />}>
      <RoleDashboardPage
        fallbackRole="AS"
        title="Tableau de bord Assistant Sponsoring"
        subtitle="Vue personnelle des évaluations et de la progression sur le cycle actif."
        teamTitle="Collaboration sponsoring"
      />
    </Suspense>
  </ErrorBoundary>
);

export default ASDashboard;
