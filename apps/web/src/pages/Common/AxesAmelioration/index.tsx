import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Search } from 'lucide-react';
import { useAuthContext } from '@/Contexts/AuthContext';
import { useRoleDashboardData } from '@/Hooks/queries/useRoleDashboards';
import { adminApi, analyticsApi } from '@/Services/api';
import { RadarChart } from '@/Components/UI/Charts/RadarChart';
import { Input } from '@/Components/UI/Input/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { TruncatedList, TruncatedTableBody } from '@/Components/UI/TruncatedList/TruncatedList';
import { HierarchyBreakdownCard, HierarchyFocusCard } from '@/Components/Dashboard/HierarchyDrilldownCards';
import {
  HierarchyChainCard,
  SubjectSummaryCard,
} from '@/Components/Dashboard/IndividualAnalyticsCards';
import {
  AnalyticsFiltersCard,
  ImprovementAxesListCard,
  RecommendationsListCard,
} from '@/Components/Dashboard/ImprovementInsightsCards';
import { TeamAxisFrequencyChartCard, TeamMemberAnalyticsTableCard } from '@/Components/Dashboard/TeamAnalyticsCards';
import {
  buildAggregatedAxesFromMembers,
  buildFocusHierarchyMember,
  buildLevelOptions,
  buildRoleRowsFromMembers,
  loadAdminHierarchyBranch,
  matchesLevel,
} from '@/utils/hierarchyDrilldown';
import {
  ActiveRulesCard,
  DashboardPageFrame,
  EmptyState,
  MetricCard,
  QuickActionsCard,
} from '@/Components/Dashboard/RoleDashboardShared';

type ImprovementAxis = {
  critere: string;
  scoreActuel: number;
  priorite: string;
  suggestion: string;
};

type Recommendation = {
  type: string;
  priorite: string;
  titre: string;
  description: string;
};

const INDIVIDUAL_ROLES = new Set(['AS', 'TMO']);
const MANAGER_ROLES = new Set(['CDV', 'CDS', 'CSC', 'RTM', 'SRMO', 'SS']);
const DIRECTOR_ROLES = new Set(['DR', 'CDTT']);

function getFullName(person: any, fallback = 'Utilisateur') {
  if (!person) return fallback;
  const fullName = [person?.prenom, person?.nom].filter(Boolean).join(' ').trim();
  return fullName || person?.nom_complet || person?.name || person?.matricule || fallback;
}

function normalizeAxes(payload: any): ImprovementAxis[] {
  const axes = Array.isArray(payload?.axes_amelioration)
    ? payload.axes_amelioration
    : Array.isArray(payload?.axes)
      ? payload.axes
      : [];

  return axes.map((axis: any) => ({
    critere: String(axis?.critere || axis?.title || 'Critère'),
    scoreActuel: Number(axis?.score_actuel ?? axis?.moyenne ?? 0),
    priorite: String(axis?.priorite || 'moyenne'),
    suggestion: String(axis?.suggestion || axis?.description || ''),
  }));
}

function normalizeRecommendations(payload: any): Recommendation[] {
  const recommandations = Array.isArray(payload?.recommandations) ? payload.recommandations : [];

  return recommandations.map((recommendation: any) => ({
    type: String(recommendation?.type || 'recommandation'),
    priorite: String(recommendation?.priorite || 'moyenne'),
    titre: String(recommendation?.titre || 'Recommandation'),
    description: String(recommendation?.description || ''),
  }));
}

function buildRadarData(axes: ImprovementAxis[], maxItems = 6) {
  return axes.slice(0, maxItems).map((axis) => ({
    axe: axis.critere,
    score: Number(axis.scoreActuel ?? 0),
    cible: 5,
  }));
}

function buildRoleOptions(members: Array<{ role: string }>) {
  return Array.from(new Set(members.map((member) => member.role).filter(Boolean))).sort((left, right) => left.localeCompare(right));
}

function matchesPriority(priority: string, filter: string) {
  if (filter === 'all') return true;
  return String(priority || '').toLowerCase() === filter.toLowerCase();
}

function resolveScope(user: ReturnType<typeof useAuthContext>['user']) {
  const role = String(user?.role || user?.role_nom || '').toUpperCase();
  if (user?.est_admin || role === 'ADMIN') return 'admin';
  if (DIRECTOR_ROLES.has(role)) return 'director';
  if (MANAGER_ROLES.has(role)) return 'manager';
  return 'individual';
}

function AxisRadarCard({
  title,
  description,
  axes,
}: {
  title: string;
  description: string;
  axes: ImprovementAxis[];
}) {
  const radarData = buildRadarData(axes);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {radarData.length === 0 ? (
          <EmptyState message="Aucune donnée d’axes n’est disponible pour construire le radar." />
        ) : (
          <RadarChart
            data={radarData}
            angleKey="axe"
            dataKeys={[
              { key: 'score', name: 'Score observé', color: 'var(--sabc-red-primary)', fillOpacity: 0.28 },
              { key: 'cible', name: 'Cible', color: 'var(--sabc-info)', fillOpacity: 0.08 },
            ]}
            height={320}
          />
        )}
      </CardContent>
    </Card>
  );
}


function IndividualAxesPage({ fallbackRole }: { fallbackRole: string }) {
  const { data } = useRoleDashboardData('individual', fallbackRole);
  const activeRules = data.rules.asEvaluatee.length > 0 ? data.rules.asEvaluatee : data.rules.relevant;

  return (
    <DashboardPageFrame
      layoutUser={data.layoutUser}
      title="Mes axes d’amélioration"
      subtitle="Lecture consolidée de vos points faibles, recommandations et règles actives"
      periodName={data.dashboard?.periode_active?.nom ?? null}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Axes prioritaires"
          value={data.selfAxes.length}
          caption="Critères faibles remontés par les évaluations"
          accentClassName="border-l-sabc-red-primary"
        />
        <MetricCard
          label="Recommandations"
          value={data.selfRecommendations.length}
          caption="Actions proposées pour le cycle actif"
          accentClassName="border-l-sabc-info"
        />
        <MetricCard
          label="Score global"
          value={data.canSeeSelfScore && data.selfScores.scoreGlobal != null ? `${data.selfScores.scoreGlobal}/5` : 'Non applicable'}
          caption="Lecture autorisée selon la règle active"
          accentClassName="border-l-sabc-success"
        />
        <MetricCard
          label="Évaluations reçues"
          value={data.receivedEvaluations.length}
          caption="Historique reçu sur la période active"
          accentClassName="border-l-sabc-accent"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <AxisRadarCard
          title="Radar des axes"
          description="Visualisation des critères les plus faibles"
          axes={data.selfAxes}
        />
        <ImprovementAxesListCard
          title="Axes détaillés"
          description="Liste priorisée des compétences à renforcer"
          axes={data.selfAxes}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <RecommendationsListCard
          title="Recommandations"
          description="Formations, mentorat et actions proposées"
          recommendations={data.selfRecommendations}
        />
        <ActiveRulesCard
          rules={activeRules}
          description="Règles qui cadrent les axes et recommandations visibles pour votre rôle"
        />
      </div>

      <QuickActionsCard
        actions={[
          { label: 'Mon dashboard', href: `/${fallbackRole.toLowerCase()}/dashboard` },
          { label: 'Mes évaluations', href: '/evaluations/mine' },
          { label: 'À compléter', href: '/evaluations/pending', variant: 'secondary' },
        ]}
      />
    </DashboardPageFrame>
  );
}

function ManagerAxesPage({ fallbackRole }: { fallbackRole: string }) {
  const { data } = useRoleDashboardData('manager', fallbackRole);
  const [memberSearch, setMemberSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [levelFilter, setLevelFilter] = React.useState('all');
  const [priorityFilter, setPriorityFilter] = React.useState('all');
  const [selectedMatricule, setSelectedMatricule] = React.useState('');

  const roleOptions = React.useMemo(() => buildRoleOptions(data.teamMembers), [data.teamMembers]);
  const levelOptions = React.useMemo(() => buildLevelOptions(data.teamMembers), [data.teamMembers]);
  const filteredMembers = React.useMemo(() => {
    return data.teamMembers.filter((member) => {
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;
      const levelOk = matchesLevel(member.niveauHierarchique, levelFilter);
      const searchable = `${member.nomComplet} ${member.matricule} ${member.role}`.toLowerCase();
      const searchOk = !memberSearch.trim() || searchable.includes(memberSearch.trim().toLowerCase());
      const priorityOk = priorityFilter === 'all'
        || member.topAxes.some((axis) => matchesPriority(axis.priorite, priorityFilter));
      return matchesRole && levelOk && searchOk && priorityOk;
    });
  }, [data.teamMembers, levelFilter, memberSearch, priorityFilter, roleFilter]);

  const filteredTeamTopAxes = React.useMemo(() => {
    return buildAggregatedAxesFromMembers(filteredMembers).filter((axis) => matchesPriority(axis.priorite, priorityFilter));
  }, [filteredMembers, priorityFilter]);

  React.useEffect(() => {
    if (filteredMembers.length === 0) {
      if (selectedMatricule) setSelectedMatricule('');
      return;
    }

    if (!filteredMembers.some((member) => member.matricule === selectedMatricule)) {
      setSelectedMatricule(filteredMembers[0].matricule);
    }
  }, [filteredMembers, selectedMatricule]);

  const selectedMember = filteredMembers.find((member) => member.matricule === selectedMatricule);

  const selectedAxesQuery = useQuery({
    queryKey: ['axes-page', 'manager', 'axes', selectedMatricule],
    queryFn: () => analyticsApi.axesAmelioration(selectedMatricule).then((response) => normalizeAxes(response.data)),
    enabled: Boolean(selectedMatricule),
  });

  const selectedRecommendationsQuery = useQuery({
    queryKey: ['axes-page', 'manager', 'recommendations', selectedMatricule],
    queryFn: () => analyticsApi.recommandations(selectedMatricule).then((response) => normalizeRecommendations(response.data)),
    enabled: Boolean(selectedMatricule),
  });

  return (
    <DashboardPageFrame
      layoutUser={data.layoutUser}
      title="Axes d’amélioration équipe"
      subtitle="Vue agrégée de votre équipe, avec drill-down par collaborateur"
      periodName={data.dashboard?.periode_active?.nom ?? null}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Collaborateurs suivis"
          value={data.teamMembers.length}
          caption="Périmètre direct actuellement remonté"
          accentClassName="border-l-sabc-red-primary"
        />
        <MetricCard
          label="Couverture équipe"
          value={`${data.completionRate}%`}
          caption="Part de l’équipe avec score consolidé"
          accentClassName="border-l-sabc-info"
        />
        <MetricCard
          label="Axes dominants"
          value={filteredTeamTopAxes.length}
          caption="Critères faibles remontés le plus souvent"
          accentClassName="border-l-sabc-success"
        />
        <MetricCard
          label="Mes recommandations"
          value={data.selfRecommendations.length}
          caption="Lecture personnelle conservée en parallèle"
          accentClassName="border-l-sabc-accent"
        />
      </div>

      <AnalyticsFiltersCard
        title="Filtres équipe"
        description="Restreindre la vue par rôle, priorité et recherche textuelle"
      >
          <div className="min-w-[160px] flex-1 space-y-1">
            <div className="text-xs font-medium text-sabc-gray-500 dark:text-sabc-gray-400">Recherche</div>
            <Input
              value={memberSearch}
              onChange={(event) => setMemberSearch(event.target.value)}
              placeholder="Nom, matricule ou rôle"
              className="h-9"
            />
          </div>
          <div className="min-w-[140px] space-y-1">
            <div className="text-xs font-medium text-sabc-gray-500 dark:text-sabc-gray-400">Rôle</div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Tous les rôles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {roleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[140px] space-y-1">
            <div className="text-xs font-medium text-sabc-gray-500 dark:text-sabc-gray-400">Niveau</div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Tous les niveaux" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                {levelOptions.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level === 'unknown' ? 'Niveau non défini' : `Niveau ${level}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[140px] space-y-1">
            <div className="text-xs font-medium text-sabc-gray-500 dark:text-sabc-gray-400">Priorité</div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Toutes les priorités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les priorités</SelectItem>
                <SelectItem value="haute">Haute</SelectItem>
                <SelectItem value="moyenne">Moyenne</SelectItem>
                <SelectItem value="basse">Basse</SelectItem>
              </SelectContent>
            </Select>
          </div>
      </AnalyticsFiltersCard>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <TeamAxisFrequencyChartCard
          title="Top axes de l’équipe"
          description="Fréquence d’apparition des axes faibles sur les subordonnés directs"
          axes={filteredTeamTopAxes}
        />
        <ImprovementAxesListCard
          title="Mes propres axes"
          description="Synthèse personnelle conservée pour le manager"
          axes={data.selfAxes}
        />
        <HierarchyBreakdownCard
          title="Coupe hiérarchique"
          description="Vue des axes et scores consolidés par niveau visible"
          members={filteredMembers}
        />
      </div>

      <TeamMemberAnalyticsTableCard
        members={filteredMembers}
        selectedMatricule={selectedMatricule}
        onSelect={setSelectedMatricule}
        title="Axes par collaborateur"
        description="Vue agrégée: seuls les axes et scores consolidés remontent hors admin"
        showLevelColumn
        selector={{
          value: selectedMatricule,
          onChange: setSelectedMatricule,
        }}
        renderIdentityMeta={(member) => member.matricule}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <HierarchyFocusCard
          title="Branche hiérarchique sélectionnée"
          description="Lecture de la branche visible à partir du collaborateur sélectionné"
          focus={selectedMember ?? null}
          members={filteredMembers}
          onSelect={setSelectedMatricule}
        />
        <AxisRadarCard
          title={selectedMember ? `Radar de ${selectedMember.nomComplet}` : 'Radar collaborateur'}
          description="Lecture détaillée du collaborateur sélectionné"
          axes={selectedAxesQuery.data ?? []}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <RecommendationsListCard
          title={selectedMember ? `Recommandations pour ${selectedMember.nomComplet}` : 'Recommandations'}
          description="Actions proposées pour le collaborateur sélectionné"
          recommendations={selectedRecommendationsQuery.data ?? []}
        />
        <ActiveRulesCard
          rules={data.rules.relevant}
          description="Règles qui cadrent les axes visibles sur votre périmètre direct"
        />
      </div>

      <QuickActionsCard
        actions={[
          { label: 'Mon dashboard', href: `/${fallbackRole.toLowerCase()}/dashboard` },
          { label: 'Vue équipe', href: '/equipe/subordonnes' },
          { label: 'Évaluations équipe', href: '/equipe/evaluations', variant: 'secondary' },
        ]}
      />
    </DashboardPageFrame>
  );
}

function DirectorAxesPage({ fallbackRole }: { fallbackRole: string }) {
  const { data } = useRoleDashboardData('director', fallbackRole);
  const [memberSearch, setMemberSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [levelFilter, setLevelFilter] = React.useState('all');
  const [priorityFilter, setPriorityFilter] = React.useState('all');
  const [selectedMatricule, setSelectedMatricule] = React.useState('');

  const roleOptions = React.useMemo(() => buildRoleOptions(data.teamMembers), [data.teamMembers]);
  const levelOptions = React.useMemo(() => buildLevelOptions(data.teamMembers), [data.teamMembers]);
  const filteredMembers = React.useMemo(() => {
    return data.teamMembers.filter((member) => {
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;
      const levelOk = matchesLevel(member.niveauHierarchique, levelFilter);
      const searchable = `${member.nomComplet} ${member.matricule} ${member.role}`.toLowerCase();
      const searchOk = !memberSearch.trim() || searchable.includes(memberSearch.trim().toLowerCase());
      const priorityOk = priorityFilter === 'all'
        || member.topAxes.some((axis) => matchesPriority(axis.priorite, priorityFilter));
      return matchesRole && levelOk && searchOk && priorityOk;
    });
  }, [data.teamMembers, levelFilter, memberSearch, priorityFilter, roleFilter]);

  const filteredTeamTopAxes = React.useMemo(() => {
    return buildAggregatedAxesFromMembers(filteredMembers).filter((axis) => matchesPriority(axis.priorite, priorityFilter));
  }, [filteredMembers, priorityFilter]);
  const filteredRoleBreakdown = React.useMemo(() => buildRoleRowsFromMembers(filteredMembers), [filteredMembers]);

  React.useEffect(() => {
    if (filteredMembers.length === 0) {
      if (selectedMatricule) setSelectedMatricule('');
      return;
    }

    if (!filteredMembers.some((member) => member.matricule === selectedMatricule)) {
      setSelectedMatricule(filteredMembers[0].matricule);
    }
  }, [filteredMembers, selectedMatricule]);

  const selectedMember = filteredMembers.find((member) => member.matricule === selectedMatricule);

  const selectedAxesQuery = useQuery({
    queryKey: ['axes-page', 'director', 'axes', selectedMatricule],
    queryFn: () => analyticsApi.axesAmelioration(selectedMatricule).then((response) => normalizeAxes(response.data)),
    enabled: Boolean(selectedMatricule),
  });

  const selectedRecommendationsQuery = useQuery({
    queryKey: ['axes-page', 'director', 'recommendations', selectedMatricule],
    queryFn: () => analyticsApi.recommandations(selectedMatricule).then((response) => normalizeRecommendations(response.data)),
    enabled: Boolean(selectedMatricule),
  });

  return (
    <DashboardPageFrame
      layoutUser={data.layoutUser}
      title="Axes d’amélioration du périmètre"
      subtitle="Vue étendue N-1/N-2 avec axes dominants et drill-down sur un collaborateur"
      periodName={data.dashboard?.periode_active?.nom ?? null}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Périmètre total"
          value={data.teamMembers.length}
          caption="Chaîne complète remontée via tous-subordonnés"
          accentClassName="border-l-sabc-red-primary"
        />
        <MetricCard
          label="Couverture globale"
          value={`${data.completionRate}%`}
          caption="Part du périmètre avec score consolidé"
          accentClassName="border-l-sabc-info"
        />
        <MetricCard
          label="Axes dominants"
          value={filteredTeamTopAxes.length}
          caption="Critères faibles les plus fréquents"
          accentClassName="border-l-sabc-success"
        />
        <MetricCard
          label="Évaluations données"
          value={data.givenEvaluations.length}
          caption="Historique des évaluations réalisées par vous"
          accentClassName="border-l-sabc-accent"
        />
      </div>

      <AnalyticsFiltersCard
        title="Filtres périmètre"
        description="Restreindre la vue par rôle, priorité et recherche textuelle"
      >
          <div className="min-w-[160px] flex-1 space-y-1">
            <div className="text-xs font-medium text-sabc-gray-500 dark:text-sabc-gray-400">Recherche</div>
            <Input
              value={memberSearch}
              onChange={(event) => setMemberSearch(event.target.value)}
              placeholder="Nom, matricule ou rôle"
              className="h-9"
            />
          </div>
          <div className="min-w-[140px] space-y-1">
            <div className="text-xs font-medium text-sabc-gray-500 dark:text-sabc-gray-400">Rôle</div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Tous les rôles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {roleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[140px] space-y-1">
            <div className="text-xs font-medium text-sabc-gray-500 dark:text-sabc-gray-400">Niveau</div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Tous les niveaux" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                {levelOptions.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level === 'unknown' ? 'Niveau non défini' : `Niveau ${level}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[140px] space-y-1">
            <div className="text-xs font-medium text-sabc-gray-500 dark:text-sabc-gray-400">Priorité</div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Toutes les priorités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les priorités</SelectItem>
                <SelectItem value="haute">Haute</SelectItem>
                <SelectItem value="moyenne">Moyenne</SelectItem>
                <SelectItem value="basse">Basse</SelectItem>
              </SelectContent>
            </Select>
          </div>
      </AnalyticsFiltersCard>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <TeamAxisFrequencyChartCard
          title="Axes dominants du périmètre"
          description="Axes faibles les plus fréquents sur l’ensemble de la chaîne supervisée"
          axes={filteredTeamTopAxes}
        />
        <Card>
          <CardHeader>
            <CardTitle>Répartition par rôle</CardTitle>
            <CardDescription>Lecture du périmètre sous l’angle des rôles supervisés</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRoleBreakdown.length === 0 ? (
              <EmptyState message="Aucune répartition par rôle n’est disponible." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Effectif</TableHead>
                    <TableHead>Couverture</TableHead>
                    <TableHead>Score moyen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TruncatedTableBody
                    items={filteredRoleBreakdown}
                    previewCount={8}
                    colSpan={4}
                    keyExtractor={(entry) => entry.role}
                    renderRow={(entry) => (
                      <TableRow key={entry.role}>
                        <TableCell>{entry.role}</TableCell>
                        <TableCell>{entry.members}</TableCell>
                        <TableCell>{entry.couverture}%</TableCell>
                        <TableCell>{entry.scoreMoyen != null ? `${entry.scoreMoyen}/5` : '—'}</TableCell>
                      </TableRow>
                    )}
                  />
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <HierarchyBreakdownCard
          title="Coupe hiérarchique"
          description="Vue des axes et scores par niveau sur le périmètre filtré"
          members={filteredMembers}
        />
      </div>

      <TeamMemberAnalyticsTableCard
        members={filteredMembers}
        selectedMatricule={selectedMatricule}
        onSelect={setSelectedMatricule}
        title="Drill-down collaborateur"
        description="Sélection d’un collaborateur du périmètre pour afficher ses axes et recommandations"
        showLevelColumn
        selector={{
          value: selectedMatricule,
          onChange: setSelectedMatricule,
        }}
        renderIdentityMeta={(member) => member.matricule}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <HierarchyFocusCard
          title="Branche hiérarchique sélectionnée"
          description="Descendre dans la chaîne en sélectionnant un collaborateur ou l’un de ses subordonnés directs"
          focus={selectedMember ?? null}
          members={filteredMembers}
          onSelect={setSelectedMatricule}
        />
        <AxisRadarCard
          title={selectedMember ? `Radar de ${selectedMember.nomComplet}` : 'Radar collaborateur'}
          description="Lecture détaillée du collaborateur sélectionné"
          axes={selectedAxesQuery.data ?? []}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <RecommendationsListCard
          title={selectedMember ? `Recommandations pour ${selectedMember.nomComplet}` : 'Recommandations'}
          description="Actions proposées pour le collaborateur sélectionné"
          recommendations={selectedRecommendationsQuery.data ?? []}
        />
        <ActiveRulesCard
          rules={data.rules.relevant}
          description="Règles qui cadrent les axes visibles sur votre périmètre hiérarchique"
        />
      </div>

      <QuickActionsCard
        actions={[
          { label: 'Mon dashboard', href: `/${fallbackRole.toLowerCase()}/dashboard` },
          { label: 'Vue équipe', href: '/equipe/subordonnes' },
          { label: 'Évaluations équipe', href: '/equipe/evaluations', variant: 'secondary' },
        ]}
      />
    </DashboardPageFrame>
  );
}

function AdminAxesPage() {
  const { user } = useAuthContext();
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [regionFilter, setRegionFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [selectedMatricule, setSelectedMatricule] = React.useState('');

  const rolesQuery = useQuery({
    queryKey: ['axes-page', 'admin', 'roles'],
    queryFn: () => adminApi.roles.list().then((response) => response.data),
  });

  const regionsQuery = useQuery({
    queryKey: ['axes-page', 'admin', 'regions'],
    queryFn: () => adminApi.structure.regions().then((response) => response.data),
  });

  const plansQuery = useQuery({
    queryKey: ['axes-page', 'admin', 'plans', roleFilter, regionFilter, typeFilter],
    queryFn: () => analyticsApi.improvementPlans({
      ...(roleFilter !== 'all' ? { role: roleFilter } : {}),
      ...(regionFilter !== 'all' ? { id_region: regionFilter } : {}),
      ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
    }).then((response) => response.data),
  });

  const usersQuery = useQuery({
    queryKey: ['axes-page', 'admin', 'users', search, roleFilter, regionFilter],
    queryFn: () => adminApi.users.list({
      statut: 'Actif',
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(roleFilter !== 'all' ? { role: roleFilter } : {}),
      ...(regionFilter !== 'all' ? { id_region: regionFilter } : {}),
    }).then((response) => response.data),
  });

  const userQuery = useQuery({
    queryKey: ['axes-page', 'admin', 'user', selectedMatricule],
    queryFn: () => adminApi.users.get(selectedMatricule).then((response) => response.data),
    enabled: Boolean(selectedMatricule),
  });

  const scoresQuery = useQuery({
    queryKey: ['axes-page', 'admin', 'scores', selectedMatricule],
    queryFn: () => analyticsApi.scores(selectedMatricule).then((response) => response.data),
    enabled: Boolean(selectedMatricule),
  });

  const axesQuery = useQuery({
    queryKey: ['axes-page', 'admin', 'axes', selectedMatricule],
    queryFn: () => analyticsApi.axesAmelioration(selectedMatricule).then((response) => normalizeAxes(response.data)),
    enabled: Boolean(selectedMatricule),
  });

  const recommendationsQuery = useQuery({
    queryKey: ['axes-page', 'admin', 'recommendations', selectedMatricule],
    queryFn: () => analyticsApi.recommandations(selectedMatricule).then((response) => normalizeRecommendations(response.data)),
    enabled: Boolean(selectedMatricule),
  });

  const chainQuery = useQuery({
    queryKey: ['axes-page', 'admin', 'chain', selectedMatricule],
    queryFn: () => adminApi.users.chaine(selectedMatricule).then((response) => response.data),
    enabled: Boolean(selectedMatricule),
  });

  const branchQuery = useQuery({
    queryKey: ['axes-page', 'admin', 'branch', selectedMatricule],
    queryFn: () => loadAdminHierarchyBranch(selectedMatricule),
    enabled: Boolean(selectedMatricule),
  });

  const users = Array.isArray(usersQuery.data) ? usersQuery.data : [];
  const roleOptions = Array.isArray(rolesQuery.data)
    ? rolesQuery.data.map((role: any) => String(role?.nom_role || '')).filter(Boolean)
    : [];
  const regionOptions = Array.isArray(regionsQuery.data) ? regionsQuery.data : [];
  const planByType = Array.isArray(plansQuery.data?.by_type) ? plansQuery.data.by_type : [];
  const planTopAxes = Array.isArray(plansQuery.data?.top_axes) ? plansQuery.data.top_axes : [];
  const planTotals = plansQuery.data?.totals ?? {};
  const layoutUser = {
    name: user ? getFullName(user, 'Administrateur') : 'Administrateur',
    email: user?.email || '',
    role: user?.role_nom || user?.role || 'ADMIN',
    avatar: user?.avatar,
  };
  const selectedUser = userQuery.data;
  const chain = Array.isArray(chainQuery.data) ? chainQuery.data : [];
  const branchMembers = Array.isArray(branchQuery.data) ? branchQuery.data : [];
  const focusUser = buildFocusHierarchyMember(selectedUser, scoresQuery.data, axesQuery.data);

  return (
    <DashboardPageFrame
      layoutUser={layoutUser}
      title="Axes d’amélioration"
      subtitle="Vue admin focalisée sur les axes, recommandations et la chaîne hiérarchique"
      periodName={null}
    >
      <AnalyticsFiltersCard
        title="Filtres admin"
        description="Affinez le périmètre analysé avant de sélectionner un collaborateur."
      >
          <div className="min-w-[160px] flex-1 space-y-1">
            <div className="text-xs font-medium text-sabc-gray-500 dark:text-sabc-gray-400">Recherche</div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sabc-gray-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un collaborateur"
                className="h-9 pl-10"
              />
            </div>
          </div>
          <div className="min-w-[140px] space-y-1">
            <div className="text-xs font-medium text-sabc-gray-500 dark:text-sabc-gray-400">Rôle</div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Tous les rôles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {roleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[140px] space-y-1">
            <div className="text-xs font-medium text-sabc-gray-500 dark:text-sabc-gray-400">Région</div>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Toutes les régions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les régions</SelectItem>
                {regionOptions.map((region: any) => (
                  <SelectItem key={String(region.id_region)} value={String(region.id_region)}>
                    {region.nom_region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[140px] space-y-1">
            <div className="text-xs font-medium text-sabc-gray-500 dark:text-sabc-gray-400">Type</div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {planByType.map((entry: any) => (
                  <SelectItem key={entry.type} value={entry.type}>
                    {entry.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
      </AnalyticsFiltersCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Utilisateurs filtrés"
          value={planTotals.users_filtered ?? 0}
          caption="Périmètre ramené par les filtres admin"
          accentClassName="border-l-sabc-red-primary"
        />
        <MetricCard
          label="Utilisateurs concernés"
          value={planTotals.users_with_recommendations ?? 0}
          caption="Collaborateurs avec recommandations actives"
          accentClassName="border-l-sabc-info"
        />
        <MetricCard
          label="Recommandations"
          value={planTotals.recommendations_total ?? 0}
          caption="Volume du type sélectionné"
          accentClassName="border-l-sabc-success"
        />
        <MetricCard
          label="Priorité haute"
          value={planTotals.high_priority ?? 0}
          caption="Actions à traiter en premier"
          accentClassName="border-l-sabc-accent"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Répartition par type</CardTitle>
            <CardDescription>Volume des recommandations sur le périmètre filtré</CardDescription>
          </CardHeader>
          <CardContent>
            {planByType.length === 0 ? (
              <EmptyState message="Aucune recommandation agrégée n’est disponible." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={planByType} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#C62828" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <TeamAxisFrequencyChartCard
          title="Top axes globaux"
          description="Axes faibles remontant le plus souvent sur le périmètre filtré"
          axes={planTopAxes}
          barColor="#1D4ED8"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recherche utilisateur</CardTitle>
          <CardDescription>
            Saisie par matricule, nom ou email. Le détail nominatif complet des scores reste centralisé dans le dashboard admin, onglet recherche individuelle.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TruncatedList
            items={users}
            previewCount={12}
            keyExtractor={(entry: any) => entry.matricule}
            modalTitle="Tous les utilisateurs"
            modalDescription={`${users.length} utilisateur(s)`}
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
            modalClassName="grid gap-3 md:grid-cols-2"
            renderItem={(entry: any) => (
              <button
                type="button"
                onClick={() => setSelectedMatricule(String(entry.matricule))}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  selectedMatricule === String(entry.matricule)
                    ? 'border-sabc-red-primary bg-sabc-red-primary/5'
                    : 'border-sabc-gray-200 hover:border-sabc-gray-300'
                }`}
              >
                <div className="font-medium text-sabc-gray-900 dark:text-white">{getFullName(entry)}</div>
                <div className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">{entry.role_nom || entry.role}</div>
                <div className="mt-1 text-xs text-sabc-gray-400 dark:text-sabc-gray-500">
                  {entry.matricule} · {entry.region?.nom_region || entry.region_nom || 'Région non renseignée'}
                </div>
              </button>
            )}
          />
        </CardContent>
      </Card>

      {!selectedMatricule ? (
        <EmptyState message="Sélectionnez un collaborateur pour afficher ses axes d’amélioration et ses recommandations." />
      ) : null}

      {selectedMatricule && selectedUser ? (
        <>
          <SubjectSummaryCard
            title={getFullName(selectedUser)}
            description={`${selectedUser.role_nom || selectedUser.role} · ${selectedUser.region?.nom_region || selectedUser.region_nom || 'Région non renseignée'} · manager ${selectedUser.manager_matricule || '—'}`}
            metrics={[
              {
                label: 'Axes prioritaires',
                value: axesQuery.data?.length ?? 0,
              },
              {
                label: 'Recommandations',
                value: recommendationsQuery.data?.length ?? 0,
              },
              {
                label: 'Score global',
                value: scoresQuery.data?.score_global != null ? `${scoresQuery.data.score_global}/5` : '—',
              },
              {
                label: 'Progression',
                value: `${scoresQuery.data?.progression > 0 ? '+' : ''}${scoresQuery.data?.progression ?? 0}`,
              },
            ]}
          />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <AxisRadarCard
              title={`Radar de ${getFullName(selectedUser)}`}
              description={`${selectedUser.role_nom || selectedUser.role} · ${selectedUser.region?.nom_region || selectedUser.region_nom || 'Région non renseignée'}`}
              axes={axesQuery.data ?? []}
            />
            <ImprovementAxesListCard
              title="Axes détaillés"
              description="Lecture des critères faibles de l’utilisateur sélectionné"
              axes={axesQuery.data ?? []}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <RecommendationsListCard
              title="Recommandations"
              description="Actions proposées pour le collaborateur sélectionné"
              recommendations={recommendationsQuery.data ?? []}
            />
            <HierarchyChainCard
              title="Chaîne hiérarchique"
              description="Positionnement organisationnel de l’utilisateur sélectionné"
              nodes={chain}
              selectedMatricule={selectedMatricule}
              onSelect={setSelectedMatricule}
              emptyMessage="Aucune chaîne hiérarchique disponible pour cet utilisateur."
            />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <HierarchyFocusCard
              title="Drill-down hiérarchique"
              description="Navigation niveau par niveau dans la branche du collaborateur sélectionné"
              focus={focusUser}
              members={branchMembers}
              onSelect={setSelectedMatricule}
            />
            <HierarchyBreakdownCard
              title="Coupe hiérarchique de la branche"
              description="Vue par niveau de la sous-branche chargée pour l’utilisateur sélectionné"
              members={branchMembers}
            />
          </div>

          <QuickActionsCard
            actions={[
              { label: 'Dashboard admin', href: '/admin/analytics?tab=improvement' },
              { label: 'Recherche 360°', href: '/admin/analytics?tab=individual' },
            ]}
          />
        </>
      ) : null}
    </DashboardPageFrame>
  );
}

export default function AxesAmeliorationPage() {
  const { user } = useAuthContext();
  const scope = resolveScope(user);
  const fallbackRole = String(user?.role || user?.role_nom || 'TMO').toUpperCase();

  if (scope === 'admin') {
    return <AdminAxesPage />;
  }

  if (scope === 'director') {
    return <DirectorAxesPage fallbackRole={fallbackRole} />;
  }

  if (scope === 'manager') {
    return <ManagerAxesPage fallbackRole={fallbackRole} />;
  }

  return <IndividualAxesPage fallbackRole={INDIVIDUAL_ROLES.has(fallbackRole) ? fallbackRole : 'TMO'} />;
}
