import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '@/Services/api';

export function useReportsList(page = 1) {
  return useQuery({
    queryKey: ['reports', page],
    queryFn: () => reportsApi.list({ page, limit: 20 }),
    select: (res) => res.data,
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: ['report', id],
    queryFn: () => reportsApi.get(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (titre: string) => reportsApi.create(titre),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useUpdateReport(rapportId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates: { titre?: string; sous_titre?: string; statut?: string }) => reportsApi.update(rapportId, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report', rapportId] }),
  });
}

export function useAddSection(rapportId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (section: { type: string; titre: string; contenu?: Record<string, unknown> }) =>
      reportsApi.addSection(rapportId, section),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report', rapportId] }),
  });
}

export function useUpdateSection(rapportId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, updates }: { sectionId: string; updates: { titre?: string; contenu?: Record<string, unknown> } }) =>
      reportsApi.updateSection(rapportId, sectionId, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report', rapportId] }),
  });
}

export function useRemoveSection(rapportId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sectionId: string) => reportsApi.removeSection(rapportId, sectionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report', rapportId] }),
  });
}

export function useReorderSections(rapportId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => reportsApi.reorderSections(rapportId, orderedIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report', rapportId] }),
  });
}
