import { useSuspenseQuery } from '@tanstack/react-query';
import { useAuthContext } from '@/Contexts/AuthContext';
import { analyticsApi, evaluationsApi, hierarchyApi, reglesApi } from '@/Services/api';
import { useMyDashboard } from './useDashboardQuery';
import { normalizePublishedRule } from '@/utils/rules';
import type { PublishedRule } from '@/types/rules';

export type DashboardScope = 'individual' | 'manager' | 'director';

type NormalizedScoreByType = {
  type: string;
  moyenne: number;
  nbEvaluations: number;
};

type NormalizedScores = {
  scoreGlobal: number | null;
  scorePondere: number | null;
  progression: number;
  parType: NormalizedScoreByType[];
};

export type ImprovementAxis = {
  critere: string;
  scoreActuel: number;
  priorite: string;
  suggestion: string;
};

export type Recommendation = {
  type: string;
  priorite: string;
  titre: string;
  description: string;
};

export type TeamMemberAnalytics = {
  matricule: string;
  nomComplet: string;
  role: string;
  email: string;
  managerMatricule: string | null;
  niveauHierarchique: number | null;
  scoreGlobal: number | null;
  scorePondere: number | null;
  progression: number;
  totalEvaluations: number;
  topAxes: ImprovementAxis[];
  parType: NormalizedScoreByType[];
};

export type RoleDashboardRuleGroups = {
  asEvaluatee: PublishedRule[];
  asEvaluateur: PublishedRule[];
  relevant: PublishedRule[];
};

export type TeamTypeAverage = {
  type: string;
  moyenne: number;
};

export type TeamAxisAggregate = {
  critere: string;
  count: number;
  priorite: string;
  scoreMoyen: number;
};

export type RoleBreakdownEntry = {
  role: string;
  members: number;
  couverture: number;
  scoreMoyen: number;
};

export type LevelBreakdownEntry = {
  niveau: string;
  count: number;
  scoreMoyen: number;
};

export interface RoleDashboardData {
  userName: string;
  userRole: string;
  layoutUser: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  dashboard: any;
  canSeeSelfScore: boolean;
  selfScores: NormalizedScores;
  selfAxes: ImprovementAxis[];
  selfRecommendations: Recommendation[];
  pendingEvaluations: any[];
  toValidateEvaluations: any[];
  history: any[];
  receivedEvaluations: any[];
  givenEvaluations: any[];
  directMembers: Array<{
    matricule: string;
    nomComplet: string;
    role: string;
    email: string;
    managerMatricule: string | null;
    niveauHierarchique: number | null;
  }>;
  allMembers: Array<{
    matricule: string;
    nomComplet: string;
    role: string;
    email: string;
    managerMatricule: string | null;
    niveauHierarchique: number | null;
  }>;
  chaine: any[];
  teamMembers: TeamMemberAnalytics[];
  teamAverageScore: number;
  completionRate: number;
  teamTypeAverages: TeamTypeAverage[];
  teamTopAxes: TeamAxisAggregate[];
  roleBreakdown: RoleBreakdownEntry[];
  levelBreakdown: LevelBreakdownEntry[];
  rules: RoleDashboardRuleGroups;
}

const NON_EVALUATED_ROLES = new Set(['DR', 'CDTT']);

function toNumber(value: any): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
}

function getFullName(person: any) {
  return [person?.prenom, person?.nom].filter(Boolean).join(' ').trim()
    || person?.name
    || person?.matricule
    || 'Utilisateur';
}

function normalizeScores(payload: any): NormalizedScores {
  const parType = Array.isArray(payload?.par_type)
    ? payload.par_type.map((entry: any) => ({
        type: String(entry?.type || 'autre'),
        moyenne: toNumber(entry?.moyenne) ?? 0,
        nbEvaluations: Number(entry?.nb_evaluations ?? 0),
      }))
    : [];

  return {
    scoreGlobal: toNumber(payload?.score_global),
    scorePondere: toNumber(payload?.score_pondere),
    progression: toNumber(payload?.progression) ?? 0,
    parType,
  };
}

function normalizeAxes(payload: any): ImprovementAxis[] {
  const axes = Array.isArray(payload?.axes_amelioration)
    ? payload.axes_amelioration
    : Array.isArray(payload?.axes)
      ? payload.axes
      : [];

  return axes.map((axis: any) => ({
    critere: String(axis?.critere || axis?.title || 'Critère'),
    scoreActuel: toNumber(axis?.score_actuel ?? axis?.moyenne) ?? 0,
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

function normalizeHistoryEntries(payload: any) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object' && Array.isArray(payload.data)) return payload.data;
  return [];
}

function normalizeMembers(payload: any) {
  if (!Array.isArray(payload)) return [];

  return payload.map((member: any) => ({
    matricule: String(member?.matricule || ''),
    nomComplet: getFullName(member),
    role: String(member?.role_nom || member?.role || 'Rôle non renseigné'),
    email: String(member?.email || member?.matricule || ''),
    managerMatricule: member?.manager_matricule ? String(member.manager_matricule) : null,
    niveauHierarchique: toNumber(member?.niveau_hierarchique),
  }));
}

function getUniqueRules(rules: any[]) {
  const seen = new Set<string>();
  return rules.filter((rule) => {
    if (!rule?.id_regle) return false;
    if (seen.has(rule.id_regle)) return false;
    seen.add(rule.id_regle);
    return true;
  });
}

async function fetchMemberAnalytics(member: {
  matricule: string;
  nomComplet: string;
  role: string;
  email: string;
  managerMatricule: string | null;
  niveauHierarchique: number | null;
}): Promise<TeamMemberAnalytics> {
  const [scoresResult, axesResult] = await Promise.allSettled([
    analyticsApi.scores(member.matricule),
    analyticsApi.axesAmelioration(member.matricule),
  ]);

  const scores = scoresResult.status === 'fulfilled' ? normalizeScores(scoresResult.value.data) : normalizeScores({});
  const axes = axesResult.status === 'fulfilled' ? normalizeAxes(axesResult.value.data) : [];
  const totalEvaluations = scores.parType.reduce((sum, entry) => sum + entry.nbEvaluations, 0);

  return {
    ...member,
    scoreGlobal: scores.scoreGlobal,
    scorePondere: scores.scorePondere,
    progression: scores.progression,
    totalEvaluations,
    topAxes: axes.slice(0, 2),
    parType: scores.parType,
  };
}

function buildRulesForRole(rawRules: any[], userRole: string): RoleDashboardRuleGroups {
  const normalized = rawRules.map((rule) => normalizePublishedRule(rule));
  const roleUpper = userRole.toUpperCase();
  const asEvaluatee = normalized.filter((rule) => String(rule.role_evalue || '').toUpperCase() === roleUpper);
  const asEvaluateur = normalized.filter((rule) => String(rule.role_evaluateur || '').toUpperCase() === roleUpper);

  return {
    asEvaluatee,
    asEvaluateur,
    relevant: getUniqueRules([...asEvaluatee, ...asEvaluateur]),
  };
}

function buildByTypeAverages(teamMembers: TeamMemberAnalytics[]): TeamTypeAverage[] {
  const aggregates = new Map<string, { total: number; count: number }>();

  teamMembers.forEach((member) => {
    member.parType.forEach((entry) => {
      const current = aggregates.get(entry.type) ?? { total: 0, count: 0 };
      current.total += entry.moyenne * Math.max(entry.nbEvaluations, 1);
      current.count += Math.max(entry.nbEvaluations, 1);
      aggregates.set(entry.type, current);
    });
  });

  return Array.from(aggregates.entries()).map(([type, aggregate]) => ({
    type,
    moyenne: aggregate.count > 0 ? Math.round((aggregate.total / aggregate.count) * 100) / 100 : 0,
  }));
}

function buildTopTeamAxes(teamMembers: TeamMemberAnalytics[]): TeamAxisAggregate[] {
  const grouped = new Map<string, { count: number; score: number; priorite: string }>();

  teamMembers.forEach((member) => {
    member.topAxes.forEach((axis) => {
      const current = grouped.get(axis.critere) ?? { count: 0, score: 0, priorite: axis.priorite };
      current.count += 1;
      current.score += axis.scoreActuel;
      if (axis.priorite === 'haute') current.priorite = 'haute';
      grouped.set(axis.critere, current);
    });
  });

  return Array.from(grouped.entries())
    .map(([critere, aggregate]) => ({
      critere,
      count: aggregate.count,
      priorite: aggregate.priorite,
      scoreMoyen: Math.round((aggregate.score / aggregate.count) * 100) / 100,
    }))
    .sort((a, b) => b.count - a.count || a.scoreMoyen - b.scoreMoyen)
    .slice(0, 5);
}

function buildRoleBreakdown(teamMembers: TeamMemberAnalytics[]): RoleBreakdownEntry[] {
  const grouped = new Map<string, { members: number; scored: number; totalScore: number }>();

  teamMembers.forEach((member) => {
    const current = grouped.get(member.role) ?? { members: 0, scored: 0, totalScore: 0 };
    current.members += 1;
    if (member.scoreGlobal != null) {
      current.scored += 1;
      current.totalScore += member.scoreGlobal;
    }
    grouped.set(member.role, current);
  });

  return Array.from(grouped.entries()).map(([role, aggregate]) => ({
    role,
    members: aggregate.members,
    couverture: aggregate.members > 0 ? Math.round((aggregate.scored / aggregate.members) * 100) : 0,
    scoreMoyen: aggregate.scored > 0 ? Math.round((aggregate.totalScore / aggregate.scored) * 100) / 100 : 0,
  }));
}

function buildLevelBreakdown(teamMembers: TeamMemberAnalytics[]): LevelBreakdownEntry[] {
  const grouped = new Map<string, { count: number; scoreTotal: number; scored: number }>();

  teamMembers.forEach((member) => {
    const label = member.niveauHierarchique != null ? `Niveau ${member.niveauHierarchique}` : 'Niveau non défini';
    const current = grouped.get(label) ?? { count: 0, scoreTotal: 0, scored: 0 };
    current.count += 1;
    if (member.scoreGlobal != null) {
      current.scored += 1;
      current.scoreTotal += member.scoreGlobal;
    }
    grouped.set(label, current);
  });

  return Array.from(grouped.entries()).map(([niveau, aggregate]) => ({
    niveau,
    count: aggregate.count,
    scoreMoyen: aggregate.scored > 0 ? Math.round((aggregate.scoreTotal / aggregate.scored) * 100) / 100 : 0,
  }));
}

export function useRoleDashboardData(scope: DashboardScope, fallbackRole: string) {
  const { user } = useAuthContext();
  const { data: dashboard } = useMyDashboard();

  return useSuspenseQuery<RoleDashboardData>({
    queryKey: ['dashboard', 'role', scope, user?.matricule ?? fallbackRole, dashboard?.periode_active?.id ?? 'no-period'],
    queryFn: async () => {
      const userName = user ? getFullName(user) : 'Utilisateur SABC';
      const userRole = String(user?.role || fallbackRole).toUpperCase();
      const userDisplayRole = String(user?.role_nom || user?.role || fallbackRole);

      const [
        selfScoresRes,
        selfAxesRes,
        selfRecommendationsRes,
        historyRes,
        evaluationIndexRes,
        reglesRes,
        directSubsRes,
        allSubsRes,
        chaineRes,
      ] = await Promise.allSettled([
        analyticsApi.scores(),
        analyticsApi.axesAmelioration(),
        analyticsApi.recommandations(),
        evaluationsApi.historique(),
        evaluationsApi.list(),
        reglesApi.list(),
        scope === 'individual' ? Promise.resolve({ data: [] }) : hierarchyApi.getSubordonnes(),
        scope === 'director' ? hierarchyApi.getTousSubordonnes() : Promise.resolve({ data: [] }),
        scope === 'director' ? hierarchyApi.getChaine() : Promise.resolve({ data: [] }),
      ]);

      const rules = buildRulesForRole(
        reglesRes.status === 'fulfilled' && Array.isArray(reglesRes.value.data) ? reglesRes.value.data : [],
        userRole,
      );
      const history = normalizeHistoryEntries(historyRes.status === 'fulfilled' ? historyRes.value.data : []);
      const pendingIndex = evaluationIndexRes.status === 'fulfilled' ? evaluationIndexRes.value.data ?? {} : {};
      const directMembers = normalizeMembers(directSubsRes.status === 'fulfilled' ? directSubsRes.value.data : []);
      const allMembers = normalizeMembers(allSubsRes.status === 'fulfilled' ? allSubsRes.value.data : []);
      const scopedMembers = scope === 'director' ? allMembers : scope === 'manager' ? directMembers : [];
      const teamMembers = scopedMembers.length > 0
        ? await Promise.all(scopedMembers.map((member) => fetchMemberAnalytics(member)))
        : [];

      const scoredMembers = teamMembers.filter((member) => member.scoreGlobal != null);
      const completionRate = teamMembers.length > 0
        ? Math.round((scoredMembers.length / teamMembers.length) * 100)
        : 0;

      const currentUserMatricule = String(user?.matricule || '');

      return {
        userName,
        userRole,
        layoutUser: {
          name: userName,
          email: user?.email || '',
          role: userDisplayRole,
          avatar: user?.avatar,
        },
        dashboard,
        canSeeSelfScore: !NON_EVALUATED_ROLES.has(userRole) && rules.asEvaluatee.length > 0,
        selfScores: normalizeScores(selfScoresRes.status === 'fulfilled' ? selfScoresRes.value.data : {}),
        selfAxes: normalizeAxes(selfAxesRes.status === 'fulfilled' ? selfAxesRes.value.data : {}),
        selfRecommendations: normalizeRecommendations(
          selfRecommendationsRes.status === 'fulfilled' ? selfRecommendationsRes.value.data : {},
        ),
        pendingEvaluations: Array.isArray(pendingIndex.en_attente) ? pendingIndex.en_attente : [],
        toValidateEvaluations: Array.isArray(pendingIndex.a_valider) ? pendingIndex.a_valider : [],
        history,
        receivedEvaluations: history.filter((evaluation: any) => String(evaluation?.evalue_matricule || evaluation?.evalue?.matricule || '') === currentUserMatricule),
        givenEvaluations: history.filter((evaluation: any) => String(evaluation?.evaluateur_matricule || evaluation?.evaluateur?.matricule || '') === currentUserMatricule),
        directMembers,
        allMembers,
        chaine: chaineRes.status === 'fulfilled' && Array.isArray(chaineRes.value.data) ? chaineRes.value.data : [],
        teamMembers,
        teamAverageScore: average(scoredMembers.map((member) => member.scoreGlobal || 0)),
        completionRate,
        teamTypeAverages: buildByTypeAverages(teamMembers),
        teamTopAxes: buildTopTeamAxes(teamMembers),
        roleBreakdown: buildRoleBreakdown(teamMembers),
        levelBreakdown: buildLevelBreakdown(teamMembers),
        rules,
      };
    },
  });
}
