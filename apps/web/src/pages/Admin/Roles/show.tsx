import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table';
import { PageHeader } from '@/Components/UI/Page';
import { EmptyState } from '@/Components/UI/EmptyState';
import { adminApi } from '@/Services/api';
import { useAdminRole } from '@/Hooks/queries';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { useToast } from '@/Contexts/ToastContext';
import { AdminRolesLayout } from './shared';

export default function ShowRole() {
  const { id = '' } = useParams();
  const { data } = useAdminRole(id);
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { success, error } = useToast();

  const updateMutation = useMutation({
    mutationFn: async () =>
      adminApi.roles.update(id, {
        peut_auto_evaluer: !data.peut_auto_evaluer,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'roles', id] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
      success('Auto-évaluation mise à jour.');
    },
    onError: (e: any) => error(e?.response?.data?.message || e?.message || 'La mise à jour a échoué.'),
  });

  const handleToggle = async () => {
    const ok = await confirm({
      title: 'Basculer l’auto-évaluation pour ce rôle ?',
      description: data?.peut_auto_evaluer
        ? 'L’auto-évaluation sera désactivée pour ce rôle.'
        : 'L’auto-évaluation sera activée pour ce rôle.',
      confirmLabel: 'Basculer',
    });
    if (ok) updateMutation.mutate();
  };

  const role = data;
  const users = Array.isArray(role?.utilisateurs) ? role.utilisateurs : [];

  return (
    <AdminRolesLayout title={`Rôle ${role?.nom_role || id}`}>
      <PageHeader
        title={role?.nom_role || id}
        description={role?.description || 'Aucune description'}
        breadcrumbs={[{ label: 'Administration' }, { label: 'Rôles', to: '/admin/roles' }, { label: role?.nom_role || id }]}
        actions={
          <>
            <Link to="/admin/roles"><Button variant="outline">Retour</Button></Link>
            <Button variant="outline" onClick={handleToggle} disabled={updateMutation.isPending}>
              Basculer auto-évaluation
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
        <Card>
          <CardHeader><CardTitle>Détails</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="font-medium">Code:</span> {role?.id_role}</div>
            <div><span className="font-medium">Branche:</span> {role?.id_branche}</div>
            <div><span className="font-medium">Portée:</span> {role?.portee_geographique}</div>
            <div><span className="font-medium">Niveau tanière:</span> {role?.niveau_taniere ?? 'N/A'}</div>
            <div><span className="font-medium">Niveau non tanière:</span> {role?.niveau_non_taniere ?? 'N/A'}</div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant={role?.peut_auto_evaluer ? 'success' : 'secondary'}>Auto</Badge>
              <Badge variant={role?.peut_evaluer_pairs ? 'success' : 'secondary'}>Pairs</Badge>
              <Badge variant={role?.peut_evaluer_subordonnes ? 'success' : 'secondary'}>Subordonnés</Badge>
              <Badge variant={role?.peut_cross_branch ? 'success' : 'secondary'}>Inter-branches</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Utilisateurs affectés</CardTitle></CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <EmptyState title="Aucun utilisateur" description="Aucun utilisateur n’est affecté à ce rôle." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                    <TableRow key={user.matricule}>
                      <TableCell>{user.matricule}</TableCell>
                      <TableCell>{[user.prenom, user.nom].filter(Boolean).join(' ')}</TableCell>
                      <TableCell>{user.statut}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminRolesLayout>
  );
}
