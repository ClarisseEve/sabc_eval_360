import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table';
import { adminApi } from '@/Services/api';
import { useAdminRole } from '@/Hooks/queries';
import { AdminRolesLayout } from './shared';

export default function ShowRole() {
  const { id = '' } = useParams();
  const { data } = useAdminRole(id);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async () =>
      adminApi.roles.update(id, {
        peut_auto_evaluer: !data.peut_auto_evaluer,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'roles', id] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
    },
  });

  const role = data;
  const users = Array.isArray(role?.utilisateurs) ? role.utilisateurs : [];

  return (
    <AdminRolesLayout title={`Rôle ${role?.nom_role || id}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">{role?.nom_role}</h1>
          <p className="text-sm text-sabc-gray-600">{role?.description || 'Aucune description'}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/roles"><Button variant="outline">Retour</Button></Link>
          <Button variant="outline" onClick={() => updateMutation.mutate()}>
            Basculer auto-évaluation
          </Button>
        </div>
      </div>

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
              <Badge variant={role?.peut_auto_evaluer ? 'default' : 'outline'}>Auto</Badge>
              <Badge variant={role?.peut_evaluer_pairs ? 'default' : 'outline'}>Pairs</Badge>
              <Badge variant={role?.peut_evaluer_subordonnes ? 'default' : 'outline'}>Subordonnés</Badge>
              <Badge variant={role?.peut_cross_branch ? 'default' : 'outline'}>Inter-branches</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Utilisateurs affectés</CardTitle></CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </AdminRolesLayout>
  );
}
