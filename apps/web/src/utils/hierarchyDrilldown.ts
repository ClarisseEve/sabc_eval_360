import { adminApi, analyticsApi } from '@/Services/api';
import { formatPersonName } from '@/utils/helpers';

export type HierarchyAxis = {
  critere: string;
  scoreActuel: number;
  priorite: string;
};

export type HierarchyAnalyticsMember = {
  matricule: string;
  nomComplet: string;
  role: string;
  managerMatricule: string | null;
  niveauHierarchique: number | null;
  scoreGlobal: number | null;
  progression: number;
  topAxes: HierarchyAxis[];
};

export function resolveHierarchyDisplayName(person: any, fallback = 'Utilisateur') {
  return formatPersonName(person, fallback);
}

export function toSafeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getLevelLabel(level: number | null) {
  return level != null ? `Niveau ${level}` : 'Niveau non défini';
}

export function normalizeHierarchyAxes(payload: any): HierarchyAxis[] {
  const axes = Array.isArray(payload?.axes_amelioration)
    ? payload.axes_amelioration
    : Array.isArray(payload?.axes)
      ? payload.axes
      : [];

  return axes.map((axis: any) => ({
    critere: String(axis?.critere || axis?.title || 'Critère'),
    scoreActuel: toSafeNumber(axis?.score_actuel ?? axis?.moyenne) ?? 0,
    priorite: String(axis?.priorite || 'moyenne'),
  }));
}

export function buildLevelOptions(members: Array<{ niveauHierarchique: number | null }>) {
  return Array.from(
    new Set(
      members.map((member) => (member.niveauHierarchique != null ? String(member.niveauHierarchique) : 'unknown')),
    ),
  ).sort((left, right) => {
    if (left === 'unknown') return 1;
    if (right === 'unknown') return -1;
    return Number(left) - Number(right);
  });
}

export function matchesLevel(level: number | null, filter: string) {
  if (filter === 'all') return true;
  if (filter === 'unknown') return level == null;
  return String(level ?? '') === filter;
}

function averageMemberScores(members: Array<{ scoreGlobal: number | null }>) {
  const scored = members
    .map((member) => member.scoreGlobal)
    .filter((value): value is number => value != null);

  if (scored.length === 0) return null;
  return Math.round((scored.reduce((sum, value) => sum + value, 0) / scored.length) * 100) / 100;
}

export function buildAggregatedAxesFromMembers(members: Array<{ topAxes: HierarchyAxis[] }>) {
  const grouped = new Map<string, { count: number; score: number; priorite: string }>();

  members.forEach((member) => {
    member.topAxes.forEach((axis) => {
      const current = grouped.get(axis.critere) ?? { count: 0, score: 0, priorite: axis.priorite };
      current.count += 1;
      current.score += axis.scoreActuel;
      if (String(axis.priorite).toLowerCase() === 'haute') current.priorite = 'haute';
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
    .sort((left, right) => right.count - left.count || left.scoreMoyen - right.scoreMoyen);
}

export function buildRoleRowsFromMembers(members: HierarchyAnalyticsMember[]) {
  const grouped = new Map<string, HierarchyAnalyticsMember[]>();

  members.forEach((member) => {
    const current = grouped.get(member.role) ?? [];
    current.push(member);
    grouped.set(member.role, current);
  });

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([role, scopedMembers]) => {
      const scored = scopedMembers.filter((member) => member.scoreGlobal != null);
      return {
        role,
        members: scopedMembers.length,
        couverture: scopedMembers.length > 0 ? Math.round((scored.length / scopedMembers.length) * 100) : 0,
        scoreMoyen: averageMemberScores(scored),
      };
    });
}

export function buildHierarchyRows(members: HierarchyAnalyticsMember[]) {
  const grouped = new Map<string, HierarchyAnalyticsMember[]>();

  members.forEach((member) => {
    const key = member.niveauHierarchique != null ? String(member.niveauHierarchique) : 'unknown';
    const current = grouped.get(key) ?? [];
    current.push(member);
    grouped.set(key, current);
  });

  return Array.from(grouped.entries())
    .sort(([left], [right]) => {
      if (left === 'unknown') return 1;
      if (right === 'unknown') return -1;
      return Number(left) - Number(right);
    })
    .map(([key, scopedMembers]) => ({
      niveau: key === 'unknown' ? 'Niveau non défini' : `Niveau ${key}`,
      count: scopedMembers.length,
      effectif: scopedMembers.length,
      scoreMoyen: averageMemberScores(scopedMembers),
      axes: buildAggregatedAxesFromMembers(scopedMembers).slice(0, 2),
    }));
}

export function buildHierarchyBranch(members: HierarchyAnalyticsMember[], focus: HierarchyAnalyticsMember | null) {
  if (!focus) {
    return {
      directReports: [] as HierarchyAnalyticsMember[],
      descendants: [] as HierarchyAnalyticsMember[],
      branchMembers: [] as HierarchyAnalyticsMember[],
      branchAverageScore: null as number | null,
      topAxes: [] as Array<{ critere: string; count: number; priorite: string; scoreMoyen: number }>,
    };
  }

  const childrenByManager = new Map<string, HierarchyAnalyticsMember[]>();
  members.forEach((member) => {
    if (!member.managerMatricule) return;
    const current = childrenByManager.get(member.managerMatricule) ?? [];
    current.push(member);
    childrenByManager.set(member.managerMatricule, current);
  });

  const directReports = [...(childrenByManager.get(focus.matricule) ?? [])].sort((left, right) =>
    left.nomComplet.localeCompare(right.nomComplet),
  );
  const descendants: HierarchyAnalyticsMember[] = [];
  const queue = [...directReports];
  const seen = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current.matricule)) continue;
    seen.add(current.matricule);
    descendants.push(current);
    queue.push(...(childrenByManager.get(current.matricule) ?? []));
  }

  const branchMembers = [focus, ...descendants];

  return {
    directReports,
    descendants,
    branchMembers,
    branchAverageScore: averageMemberScores(branchMembers),
    topAxes: buildAggregatedAxesFromMembers(branchMembers).slice(0, 4),
  };
}

export function buildFocusHierarchyMember(user: any, scoresPayload: any, axesPayload: any): HierarchyAnalyticsMember | null {
  if (!user) return null;

  return {
    matricule: String(user.matricule),
    nomComplet: resolveHierarchyDisplayName(user),
    role: String(user.role_nom || user.role || 'Rôle non renseigné'),
    managerMatricule: user.manager_matricule ? String(user.manager_matricule) : null,
    niveauHierarchique: toSafeNumber(user.niveau_hierarchique),
    scoreGlobal: toSafeNumber(scoresPayload?.score_global),
    progression: Number(scoresPayload?.progression ?? 0),
    topAxes: normalizeHierarchyAxes(axesPayload).slice(0, 2),
  };
}

export async function loadAdminHierarchyBranch(matricule: string) {
  if (!matricule) return [];

  const seen = new Set<string>();

  const loadDescendants = async (managerMatricule: string): Promise<any[]> => {
    const response = await adminApi.users.subordonnes(managerMatricule);
    const directReports = Array.isArray(response.data) ? response.data : [];
    const nested = await Promise.all(
      directReports.map(async (report: any) => {
        const currentMatricule = String(report?.matricule || '');
        if (!currentMatricule || seen.has(currentMatricule)) return [];
        seen.add(currentMatricule);
        const descendants = await loadDescendants(currentMatricule);
        return [report, ...descendants];
      }),
    );
    return nested.flat();
  };

  const descendants = await loadDescendants(matricule);
  const uniqueDescendants = descendants.filter((member: any, index: number, collection: any[]) =>
    collection.findIndex((entry) => String(entry?.matricule || '') === String(member?.matricule || '')) === index,
  );

  const members = await Promise.all(
    uniqueDescendants.map(async (member: any) => {
      const currentMatricule = String(member?.matricule || '');
      const [scoresResult, axesResult] = await Promise.allSettled([
        analyticsApi.scores(currentMatricule),
        analyticsApi.axesAmelioration(currentMatricule),
      ]);

      return {
        matricule: currentMatricule,
        nomComplet: resolveHierarchyDisplayName(member),
        role: String(member?.role_nom || member?.role || 'Rôle non renseigné'),
        managerMatricule: member?.manager_matricule ? String(member.manager_matricule) : null,
        niveauHierarchique: toSafeNumber(member?.niveau_hierarchique),
        scoreGlobal: scoresResult.status === 'fulfilled' ? toSafeNumber(scoresResult.value.data?.score_global) : null,
        progression: scoresResult.status === 'fulfilled' ? Number(scoresResult.value.data?.progression ?? 0) : 0,
        topAxes: axesResult.status === 'fulfilled' ? normalizeHierarchyAxes(axesResult.value.data).slice(0, 2) : [],
      } satisfies HierarchyAnalyticsMember;
    }),
  );

  return members.sort((left, right) => {
    const levelDelta = (left.niveauHierarchique ?? 999) - (right.niveauHierarchique ?? 999);
    if (levelDelta !== 0) return levelDelta;
    return left.nomComplet.localeCompare(right.nomComplet);
  });
}
