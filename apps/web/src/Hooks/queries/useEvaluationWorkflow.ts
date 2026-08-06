import { useSuspenseQuery } from '@tanstack/react-query';
import { useAuthContext } from '@/Contexts/AuthContext';
import { evaluationsApi, reglesApi } from '@/Services/api';
import { normalizePublishedRule } from '@/utils/rules';

const TARGET_LABELS: Record<string, string> = {
  auto: 'Auto-évaluation',
  pairs: 'Pairs',
  subordonnes: 'Subordonnés',
  ascendante: 'Ascendante',
};

function asArray<T = any>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && 'data' in value && Array.isArray((value as any).data)) return (value as any).data;
  return [];
}

async function loadAllRejectedEvaluations() {
  const rejected: any[] = [];
  const limit = 100;

  for (let page = 1; page <= 100; page += 1) {
    const response = await evaluationsApi.historique({ statut: 'rejete', page, limit });
    const batch = asArray(response.data);
    rejected.push(...batch);
    if (batch.length < limit) break;
  }

  return rejected;
}

function normalizeEligibleGroups(payload: any) {
  if (!payload || typeof payload !== 'object') return [];

  return Object.entries(payload)
    .map(([key, value]) => {
      const targets = Array.isArray(value) ? value : value ? [value] : [];
      return {
        key,
        label: TARGET_LABELS[key] ?? key,
        targets: targets.map((target: any) => ({
          ...target,
          workflowType: key === 'subordonnes' ? 'descendante' : key,
        })),
      };
    })
    .filter((group) => group.targets.length > 0);
}

export function findWorkflowTarget(
  groups: Array<{ targets: Array<Record<string, any>> }>,
  matricule: string | null | undefined,
) {
  if (!matricule) return null;

  for (const group of groups) {
    const target = group.targets.find((entry) => String(entry?.matricule || '') === String(matricule));
    if (target) return target;
  }

  return null;
}

export function useEvaluationWorkflowData() {
  const { user } = useAuthContext();

  return useSuspenseQuery({
    queryKey: ['evaluations', 'workflow', user?.matricule ?? 'current'],
    queryFn: async () => {
      const [evaluationsResponse, eligiblesResponse, historiqueResponse, rejectedEvaluations, periodesResponse, reglesResponse] = await Promise.all([
        evaluationsApi.list(),
        evaluationsApi.eligibles(),
        evaluationsApi.historique(),
        loadAllRejectedEvaluations(),
        evaluationsApi.periodesActives(),
        reglesApi.list(),
      ]);

      const pendingEvaluations = asArray(evaluationsResponse.data?.en_attente);
      const validations = asArray(evaluationsResponse.data?.a_valider);
      const historyList = asArray(historiqueResponse.data);
      const activePeriods = asArray(periodesResponse.data);
      const rules = asArray(reglesResponse.data)
        .map((rule) => normalizePublishedRule(rule))
        .filter((rule) => rule.est_active);
      const eligibleGroups = normalizeEligibleGroups(eligiblesResponse.data);
      const eligibleTargetsCount = eligibleGroups.reduce((sum, group) => sum + group.targets.length, 0);

      return {
        activePeriods,
        activePeriod: activePeriods[0] ?? null,
        eligibleGroups,
        eligibleTargetsCount,
        rules,
        historyList,
        rejectedEvaluations,
        pendingEvaluations,
        validations,
        summary: {
          activePeriods: activePeriods.length,
          activeRules: rules.length,
          eligibleTargets: eligibleTargetsCount,
          historyEntries: historyList.length,
          pendingTotal: pendingEvaluations.length,
          drafts: pendingEvaluations.filter((evaluation) => evaluation.statut === 'brouillon').length,
          submitted: pendingEvaluations.filter((evaluation) => evaluation.statut === 'soumis').length,
          validations: validations.length,
        },
      };
    },
  });
}
