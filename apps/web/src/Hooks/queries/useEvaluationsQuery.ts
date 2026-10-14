import { useSuspenseQuery, useQuery } from '@tanstack/react-query';
import { adminApi, evaluationsApi, periodesApi } from '@/Services/api';

export function useEvaluations() {
  return useSuspenseQuery({
    queryKey: ['evaluations'],
    queryFn: () => evaluationsApi.list().then(r => r.data),
  });
}

export function useEvaluation(id: string) {
  return useSuspenseQuery({
    queryKey: ['evaluations', id],
    queryFn: () => evaluationsApi.get(id).then(r => r.data),
  });
}

export function usePeriodesActives() {
  return useSuspenseQuery({
    queryKey: ['periodes', 'actives'],
    queryFn: () => evaluationsApi.periodesActives().then(r => r.data),
  });
}

export function useEligibles() {
  return useSuspenseQuery({
    queryKey: ['evaluations', 'eligibles'],
    queryFn: () => evaluationsApi.eligibles().then(r => r.data),
  });
}

export function useEvaluationTargets(isAdmin: boolean) {
  return useSuspenseQuery({
    queryKey: ['evaluations', 'targets', isAdmin ? 'admin' : 'hierarchy'],
    queryFn: async () => {
      if (!isAdmin) return evaluationsApi.eligibles().then((response) => response.data);

      const params = { statut: 'Actif', limit: 100 };
      const firstPage = await adminApi.users.list({ ...params, page: 1 });
      const firstData = firstPage.data;
      const users = Array.isArray(firstData?.data) ? firstData.data : [];
      const totalPages = Math.max(1, Number(firstData?.meta?.totalPages) || 1);
      const otherPages = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
          adminApi.users.list({ ...params, page: index + 2 }).then((response) =>
            Array.isArray(response.data?.data) ? response.data.data : [],
          ),
        ),
      );

      return [...users, ...otherPages.flat()].filter((user: any) =>
        user.est_actif &&
        user.statut === 'Actif' &&
        !user.est_indisponible &&
        !user.est_admin &&
        String(user.role ?? user.role_nom ?? '').toUpperCase() !== 'ADMIN',
      );
    },
  });
}

export function useHistorique() {
  return useSuspenseQuery({
    queryKey: ['evaluations', 'historique'],
    queryFn: () => evaluationsApi.historique().then(r => r.data),
  });
}

export function usePeriodes() {
  return useSuspenseQuery({
    queryKey: ['periodes'],
    queryFn: () => periodesApi.list().then(r => r.data),
  });
}

/** Non-suspense version for optional/lazy loading (badge counts, etc.) */
export function useEvaluationCount() {
  return useQuery({
    queryKey: ['evaluations', 'count'],
    queryFn: () => evaluationsApi.list().then(r => r.data?.length ?? 0),
    staleTime: 60_000,
  });
}
