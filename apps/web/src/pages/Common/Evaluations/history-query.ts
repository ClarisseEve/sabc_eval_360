import type { EvaluationHistoryParams } from '@/Services/api';

export const COMMON_HISTORY_PAGE_SIZE = 20;

export type CommonHistoryFilters = {
  page: number;
  statut: string;
  periode: string;
  type: string;
};

export function buildCommonHistoryParams({
  page,
  statut,
  periode,
  type,
}: CommonHistoryFilters): EvaluationHistoryParams {
  return {
    page,
    limit: COMMON_HISTORY_PAGE_SIZE,
    statut:
      statut === 'tous'
        ? undefined
        : (statut as EvaluationHistoryParams['statut']),
    id_periode: periode === 'tous' ? undefined : periode,
    type_evaluation:
      type === 'tous'
        ? undefined
        : (type as EvaluationHistoryParams['type_evaluation']),
  };
}
