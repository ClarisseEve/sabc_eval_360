import React from 'react';
import {
  AdminSearchEmptySelection,
  AdminSearchLoadingSection,
  AdminUserSearchSection,
} from '@/Components/Dashboard/Admin/Sections/SearchSections';
import { EvaluationHistoryTableCard } from '@/Components/Dashboard/EvaluationHistoryCards';
import { HierarchyBreakdownCard, HierarchyFocusCard } from '@/Components/Dashboard/HierarchyDrilldownCards';
import { ImprovementAxesListCard, RecommendationsListCard } from '@/Components/Dashboard/ImprovementInsightsCards';
import {
  HierarchyChainCard,
  ScoresByTypeCard,
  SubjectSummaryCard,
} from '@/Components/Dashboard/IndividualAnalyticsCards';
import { getAdminDisplayName, useAdminIndividualSearchTabData } from '@/Hooks/queries/useAdminDashboardTabs';

const getFullName = getAdminDisplayName;

export default function IndividualSearchTab() {
  const [search, setSearch] = React.useState('');
  const [selectedMatricule, setSelectedMatricule] = React.useState<string>('');
  const {
    usersQuery,
    users,
    selectedUser,
    receivedEvaluations,
    givenEvaluations,
    scoreByType,
    axes,
    recommendations,
    chain,
    branchMembers,
    focusUser,
    scores,
    isDetailsLoading,
  } = useAdminIndividualSearchTabData({
    search,
    selectedMatricule,
  });

  return (
    <div className="space-y-5">
      <AdminUserSearchSection
        search={search}
        onSearchChange={setSearch}
        users={users}
        selectedMatricule={selectedMatricule}
        onSelect={setSelectedMatricule}
        isLoading={usersQuery.isLoading}
        getDisplayName={getFullName}
      />

      {!selectedMatricule ? (
        <AdminSearchEmptySelection />
      ) : null}

      {selectedMatricule && selectedUser ? (
        <div className="space-y-5">
          <SubjectSummaryCard
            title={getFullName(selectedUser)}
            description={`${selectedUser.role_nom || selectedUser.role} · ${selectedUser.region?.nom_region || selectedUser.region_nom || 'Région non renseignée'} · manager ${selectedUser.manager_matricule || '—'}`}
            metrics={[
              {
                label: 'Score global',
                value: scores?.score_global != null ? `${scores.score_global}/5` : '—',
              },
              {
                label: 'Score pondéré',
                value: scores?.score_pondere != null ? `${scores.score_pondere}/5` : '—',
              },
              {
                label: 'Progression',
                value: `${scores?.progression > 0 ? '+' : ''}${scores?.progression ?? 0}`,
              },
              {
                label: 'Évaluations reçues',
                value: receivedEvaluations.length,
              },
            ]}
          />

          {isDetailsLoading ? (
            <AdminSearchLoadingSection />
          ) : null}

          <div className="grid gap-5 xl:grid-cols-2">
            <ScoresByTypeCard
              title="Scores par type"
              description="Distribution consolidée des évaluations reçues"
              entries={scoreByType}
            />

            <HierarchyChainCard
              title="Chaîne hiérarchique"
              description="Positionnement organisationnel du collaborateur"
              nodes={chain}
              selectedMatricule={selectedMatricule}
              onSelect={setSelectedMatricule}
              emptyMessage="Aucune chaîne hiérarchique disponible."
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <HierarchyFocusCard
              title="Branche hiérarchique sélectionnée"
              description="Navigation de branche à partir du collaborateur sélectionné"
              focus={focusUser}
              members={branchMembers}
              onSelect={setSelectedMatricule}
              emptyMessage="Aucun collaborateur sélectionné."
              directReportsEmptyMessage="Aucun subordonné direct visible pour ce collaborateur."
            />

            <HierarchyBreakdownCard
              title="Répartition par niveau"
              description="Coupe hiérarchique de la branche chargée"
              members={focusUser ? [focusUser, ...branchMembers] : []}
              emptyMessage="Aucun descendant n’est disponible pour construire la coupe hiérarchique."
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <EvaluationHistoryTableCard
              title="Qui a donné quel score"
              description="Évaluations reçues par le collaborateur sélectionné"
              evaluations={receivedEvaluations}
              emptyMessage="Aucune évaluation reçue n’est disponible."
              subjectHeader="Évaluateur"
              subjectCell={(evaluation: any) => getFullName(evaluation.evaluateur)}
              secondaryHeader="Rôle"
              secondaryCell={(evaluation: any) => evaluation.evaluateur?.role_nom || evaluation.evaluateur?.role || '—'}
            />

            <EvaluationHistoryTableCard
              title="Évaluations données"
              description="Historique des notations réalisées par ce collaborateur"
              evaluations={givenEvaluations}
              emptyMessage="Aucune évaluation donnée n’est disponible."
              subjectHeader="Évalué"
              subjectCell={(evaluation: any) => getFullName(evaluation.evalue)}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <ImprovementAxesListCard
              title="Axes d’amélioration"
              description="Faiblesses prioritaires remontées par les évaluations validées"
              axes={axes}
            />

            <RecommendationsListCard
              title="Recommandations"
              description="Actions suggérées par le moteur analytics"
              recommendations={recommendations}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
