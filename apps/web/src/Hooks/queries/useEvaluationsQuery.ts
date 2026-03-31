import { useSuspenseQuery, useQuery } from '@tanstack/react-query';
import { evaluationsApi, periodesApi } from '@/Services/api';

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
