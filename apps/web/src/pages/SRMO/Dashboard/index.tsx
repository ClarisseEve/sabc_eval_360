import React, { Suspense } from 'react';
import RoleIndividualDashboardPage from '@/Components/Dashboard/RoleIndividualDashboardPage';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';

/**
 * Gabarit individuel et non manager: le rôle n'encadre personne — il rapporte
 * lui-même au RTM et l'API lui refuse l'évaluation de subordonnés
 * (peut_evaluer_subordonnes = false). Le gabarit manager promettait donc une
 * équipe inexistante.
 */
const SRMODashboard: React.FC = () => (
  <ErrorBoundary>
    <Suspense fallback={<DashboardSkeleton />}>
      <RoleIndividualDashboardPage
        fallbackRole="SRMO"
        title="Tableau de bord Superviseur régional marketing opérationnel"
        subtitle="Suivi de vos évaluations et de votre progression."
      />
    </Suspense>
  </ErrorBoundary>
);

export default SRMODashboard;
