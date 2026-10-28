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
import { formatScore } from '@/utils/helpers';

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
            description={`${selectedUser.role_nom || selectedUser.role} · ${selectedUser.region?.nom_region || selectedUser.region_nom || 'Région non renseignée'} · responsable ${selectedUser.manager_matricule || 'n.d.'}`}
            metrics={[
              {
                label: 'Score global',
                value: formatScore(scores?.score_global),
              },
              {
                label: 'Score pondéré',
                value: formatScore(scores?.score_pondere),
              },
              {
                label: 'Progression',
                value:
                  scores?.progression == null || !Number.isFinite(Number(scores.progression))
                    ? 'n.d.'
                    : `${Number(scores.progression) > 0 ? '+' : ''}${Number(scores.progression).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}`,
              },
              {
                label: 'Évaluations reçues',
                value: receivedEvaluations.length.toLocaleString('fr-FR'),
              },
            ]}
          />

          {isDetailsLoading ? (
            <AdminSearchLoadingSection />
          ) : null}

          <div className="grid gap-5 xl:grid-cols-2">
            <ScoresByTypeCard
              title="Scores par type"
              description="Score moyen des évaluations reçues, par type."
              entries={scoreByType}
            />

            <HierarchyChainCard
              title="Chaîne hiérarchique"
              description="Place du collaborateur dans l’organisation."
              nodes={chain}
              selectedMatricule={selectedMatricule}
              onSelect={setSelectedMatricule}
              emptyMessage="Aucune chaîne hiérarchique disponible."
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <HierarchyFocusCard
              title="Branche hiérarchique sélectionnée"
              description="Collaborateurs rattachés au collaborateur sélectionné."
              focus={focusUser}
              members={branchMembers}
              onSelect={setSelectedMatricule}
              emptyMessage="Aucun collaborateur sélectionné."
              directReportsEmptyMessage="Aucun subordonné direct visible pour ce collaborateur."
            />

            <HierarchyBreakdownCard
              title="Répartition par niveau"
              description="Nombre de collaborateurs par niveau hiérarchique."
              members={focusUser ? [focusUser, ...branchMembers] : []}
              emptyMessage="Aucun collaborateur rattaché."
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <EvaluationHistoryTableCard
              title="Évaluations reçues"
              description="Score attribué par chaque évaluateur."
              evaluations={receivedEvaluations}
              emptyMessage="Aucune évaluation reçue n’est disponible."
              subjectHeader="Évaluateur"
              subjectCell={(evaluation: any) => getFullName(evaluation.evaluateur)}
              secondaryHeader="Rôle"
              secondaryCell={(evaluation: any) => evaluation.evaluateur?.role_nom || evaluation.evaluateur?.role || 'n.d.'}
            />

            <EvaluationHistoryTableCard
              title="Évaluations données"
              description="Évaluations réalisées par ce collaborateur."
              evaluations={givenEvaluations}
              emptyMessage="Aucune évaluation donnée n’est disponible."
              subjectHeader="Évalué"
              subjectCell={(evaluation: any) => getFullName(evaluation.evalue)}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <ImprovementAxesListCard
              title="Axes d’amélioration"
              description="Points faibles prioritaires issus des évaluations validées."
              axes={axes}
            />

            <RecommendationsListCard
              title="Recommandations"
              description="Actions proposées à partir des résultats."
              recommendations={recommendations}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
