import type { EvaluationHistoryParams } from '@/Services/api';

export const ADMIN_HISTORY_PAGE_SIZE = 30;

export function buildAdminHistoryParams(
  page: number,
  statut: string,
): EvaluationHistoryParams {
  return {
    page,
    limit: ADMIN_HISTORY_PAGE_SIZE,
    statut:
      statut === 'all'
        ? undefined
        : (statut as EvaluationHistoryParams['statut']),
  };
}
