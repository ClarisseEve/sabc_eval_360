import React, { Suspense } from 'react';
import RoleIndividualDashboardPage from '@/Components/Dashboard/RoleIndividualDashboardPage';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';

/**
 * Gabarit individuel et non manager: aucun agent ne rapporte à un chef de
 * secteur dans l'organigramme (les CSC rapportent aux CDV, les TMO aux RTM).
 * Le gabarit manager laissait donc six blocs sur neuf vides en permanence et
 * privait le rôle de ses vues personnelles — évolution, benchmarks,
 * recommandations. À rebasculer si l'organigramme lui donne des subordonnés.
 */
const CDSDashboard: React.FC = () => (
  <ErrorBoundary>
    <Suspense fallback={<DashboardSkeleton />}>
      <RoleIndividualDashboardPage
        fallbackRole="CDS"
        title="Tableau de bord Chef de secteur"
        subtitle="Suivi de vos évaluations et de votre progression sur le secteur."
      />
    </Suspense>
  </ErrorBoundary>
);

export default CDSDashboard;
