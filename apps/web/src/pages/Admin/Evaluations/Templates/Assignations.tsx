import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templatesApi, periodesApi } from '@/Services/api';
import { AdminEvaluationsLayout } from '../shared';
import { PageHeader } from '@/Components/UI/Page';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Skeleton } from '@/Components/UI/Skeleton';
import { EmptyState } from '@/Components/UI/EmptyState';
import { useToast } from '@/Contexts/ToastContext';
import { ClipboardList } from 'lucide-react';

interface Periode {
  id_periode: string;
  nom_periode: string;
  est_ouverte: boolean;
}

interface Template {
  id_template?: string;
  id?: string;
  nom?: string;
  titre?: string;
  statut: string;
}

interface AssignationCell {
  id_role: string;
  nom_role: string;
  template_assigne: { id_template?: string; id?: string; nom?: string; titre?: string; statut: string } | null;
  est_assigne: boolean;
}

// Normalisation tolérante aux deux formes de l'API (titre/nom, id/id_template).
const tplId = (t: { id_template?: string; id?: string } | null | undefined) => t?.id_template ?? t?.id ?? '';
const tplLabel = (t: { titre?: string; nom?: string } | null | undefined) => t?.titre ?? t?.nom ?? 'Sans titre';

export default function AssignationsPage() {
  const [selectedPeriode, setSelectedPeriode] = useState<string>('');
  const queryClient = useQueryClient();
  const { success, error } = useToast();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrice', selectedPeriode] });
      success('Template assigné.');
    },
    onError: (e: any) => error(e?.response?.data?.message || e?.message || "L'assignation a échoué."),
  });

  const removeMutation = useMutation({
    mutationFn: ({ id_role }: { id_role: string }) =>
      templatesApi.removeAssignation(id_role, selectedPeriode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrice', selectedPeriode] });
      success('Assignation retirée.');
    },
    onError: (e: any) => error(e?.response?.data?.message || e?.message || 'Le retrait a échoué.'),
  });

  const selectedPeriodeData = periodes.find((p) => p.id_periode === selectedPeriode);
  const isReadOnly = selectedPeriodeData?.est_ouverte ?? false;
  const publishedTemplates = templates.filter((t) => t.statut === 'published');

  return (
    <AdminEvaluationsLayout title="Assignation des templates">
      <PageHeader
        title="Assignation des templates"
        description="Associez un template publié à chaque rôle pour une période donnée."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Templates', to: '/admin/evaluations/templates' }, { label: 'Assignations' }]}
        actions={
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
        }
      />

      {isReadOnly && (
        <div className="rounded-md border border-sabc-warning/30 bg-sabc-warning/10 p-3 text-sm text-sabc-gray-800">
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
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} height={44} className="w-full rounded-md" />
                ))}
              </div>
            ) : matrice.length === 0 ? (
              <EmptyState icon={ClipboardList} title="Aucun rôle" description="Aucun rôle trouvé pour cette période." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Template assigné</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matrice.map((row) => (
                      <TableRow key={row.id_role}>
                        <TableCell className="font-medium text-sabc-gray-900">{row.nom_role}</TableCell>
                        <TableCell>
                          {isReadOnly ? (
                            <span className={row.est_assigne ? 'text-sabc-success' : 'text-sabc-gray-400'}>
                              {row.template_assigne ? tplLabel(row.template_assigne) : 'Non assigné'}
                            </span>
                          ) : (
                            <select
                              className="w-full rounded border border-sabc-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sabc-red-primary"
                              value={tplId(row.template_assigne)}
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
                                <option key={tplId(t)} value={tplId(t)}>
                                  {tplLabel(t)}
                                </option>
                              ))}
                            </select>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.est_assigne ? 'success' : 'secondary'}>
                            {row.est_assigne ? 'Assigné' : 'Non assigné'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </AdminEvaluationsLayout>
  );
}
