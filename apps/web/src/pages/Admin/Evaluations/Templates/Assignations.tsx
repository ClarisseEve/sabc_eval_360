import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templatesApi, periodesApi } from '@/Services/api';
import { AdminEvaluationsLayout } from '../shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';

interface Periode {
  id_periode: string;
  nom_periode: string;
  est_ouverte: boolean;
}

interface Template {
  id_template: string;
  nom: string;
  statut: string;
}

interface AssignationCell {
  id_role: string;
  nom_role: string;
  template_assigne: { id_template: string; nom: string; statut: string } | null;
  est_assigne: boolean;
}

export default function AssignationsPage() {
  const [selectedPeriode, setSelectedPeriode] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: periodes = [] } = useQuery({
    queryKey: ['periodes'],
    queryFn: () => periodesApi.list().then((r) => r.data as Periode[]),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.list().then((r) => r.data as Template[]),
  });

  const { data: matrice = [], isLoading: loadingMatrice } = useQuery({
    queryKey: ['matrice', selectedPeriode],
    queryFn: () => templatesApi.getMatrice(selectedPeriode).then((r) => r.data as AssignationCell[]),
    enabled: !!selectedPeriode,
  });

  const assignMutation = useMutation({
    mutationFn: (data: { id_role: string; id_template: string }) =>
      templatesApi.assignTemplate({ ...data, id_periode: selectedPeriode }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matrice'] }),
  });

  const removeMutation = useMutation({
    mutationFn: ({ id_role }: { id_role: string }) =>
      templatesApi.removeAssignation(id_role, selectedPeriode),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matrice'] }),
  });

  const selectedPeriodeData = periodes.find((p) => p.id_periode === selectedPeriode);
  const isReadOnly = selectedPeriodeData?.est_ouverte ?? false;
  const publishedTemplates = templates.filter((t) => t.statut === 'published');

  return (
    <AdminEvaluationsLayout title="Assignation des templates">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Assignation des templates</h1>
          <p className="mt-1 text-sm text-sabc-gray-400">
            Associez un template publié à chaque rôle pour une période donnée.
          </p>
        </div>
        <select
          className="rounded-md border border-sabc-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sabc-red-primary"
          value={selectedPeriode}
          onChange={(e) => setSelectedPeriode(e.target.value)}
        >
          <option value="">Sélectionner une période</option>
          {periodes.map((p) => (
            <option key={p.id_periode} value={p.id_periode}>
              {p.nom_periode} {p.est_ouverte ? '(ouverte)' : ''}
            </option>
          ))}
        </select>
      </div>

      {isReadOnly && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Période ouverte — les modifications sont désactivées.
        </div>
      )}

      {selectedPeriode && (
        <Card>
          <CardHeader>
            <CardTitle>Matrice d'assignation</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMatrice ? (
              <div className="py-8 text-center text-sabc-gray-400">Chargement…</div>
            ) : matrice.length === 0 ? (
              <div className="py-8 text-center text-sabc-gray-400">Aucun rôle trouvé pour cette période.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-sabc-gray-50">
                    <tr>
                      <th className="border border-sabc-gray-200 px-4 py-3 text-left text-xs font-medium uppercase text-sabc-gray-800">
                        Rôle
                      </th>
                      <th className="border border-sabc-gray-200 px-4 py-3 text-left text-xs font-medium uppercase text-sabc-gray-800">
                        Template assigné
                      </th>
                      <th className="border border-sabc-gray-200 px-4 py-3 text-left text-xs font-medium uppercase text-sabc-gray-800">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sabc-gray-200">
                    {matrice.map((row) => (
                      <tr key={row.id_role} className="hover:bg-sabc-gray-50">
                        <td className="border border-sabc-gray-200 px-4 py-3 font-medium text-sabc-gray-900">
                          {row.nom_role}
                        </td>
                        <td className="border border-sabc-gray-200 px-4 py-3">
                          {isReadOnly ? (
                            <span className={row.est_assigne ? 'text-sabc-success' : 'text-sabc-gray-400'}>
                              {row.template_assigne?.nom ?? 'Non assigné'}
                            </span>
                          ) : (
                            <select
                              className="w-full rounded border border-sabc-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sabc-red-primary"
                              value={row.template_assigne?.id_template ?? ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                  assignMutation.mutate({ id_role: row.id_role, id_template: e.target.value });
                                } else {
                                  removeMutation.mutate({ id_role: row.id_role });
                                }
                              }}
                            >
                              <option value="">— Non assigné —</option>
                              {publishedTemplates.map((t) => (
                                <option key={t.id_template} value={t.id_template}>
                                  {t.nom}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="border border-sabc-gray-200 px-4 py-3">
                          <span
                            className={`inline-flex rounded px-2 py-1 text-xs font-medium ${
                              row.est_assigne
                                ? 'bg-green-100 text-green-700'
                                : 'bg-sabc-gray-100 text-sabc-gray-500'
                            }`}
                          >
                            {row.est_assigne ? 'Assigné' : 'Non assigné'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </AdminEvaluationsLayout>
  );
}
