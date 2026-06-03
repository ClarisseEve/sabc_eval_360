import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table';
import { adminApi } from '@/Services/api';
import { useAdminUser } from '@/Hooks/queries';
import { AdminUsersLayout } from './shared';

export default function ShowUser() {
  const { matricule = '' } = useParams();
  const { data } = useAdminUser(matricule);
  const queryClient = useQueryClient();
  const { data: subordinates } = useSuspenseQuery({
    queryKey: ['admin', 'users', matricule, 'subordonnes'],
    queryFn: () => adminApi.users.subordonnes(matricule).then((r) => r.data),
  });

  const deactivateMutation = useMutation({
    mutationFn: async () => adminApi.users.delete(matricule),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users', matricule] });
    },
  });

  const user = data;
  const stats = user?.stats || {};
  const subs = Array.isArray(subordinates) ? subordinates : [];

  return (
    <AdminUsersLayout title={`Utilisateur ${matricule}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">{[user?.prenom, user?.nom].filter(Boolean).join(' ')}</h1>
          <p className="text-sm text-sabc-gray-600">{user?.email}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/utilisateurs"><Button variant="outline">Retour</Button></Link>
          <Link to={`/admin/utilisateurs/${matricule}/edit`}><Button variant="outline">Modifier</Button></Link>
          <Button variant="outline" onClick={() => deactivateMutation.mutate()}>Désactiver</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Rôle</div><div className="text-xl font-bold">{user?.role}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Statut</div><div className="text-xl font-bold">{user?.statut}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Score moyen</div><div className="text-xl font-bold">{stats.score_moyen ?? 'N/A'}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Subordonnés</div><div className="text-xl font-bold">{stats.subordonnes ?? 0}</div></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
        <Card>
          <CardHeader><CardTitle>Détails</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="font-medium">Matricule:</span> {user?.matricule}</div>
            <div><span className="font-medium">Téléphone:</span> {user?.telephone || 'N/A'}</div>
            <div><span className="font-medium">Région:</span> {user?.region?.nom_region || user?.id_region}</div>
            <div><span className="font-medium">Branche:</span> {user?.branche?.nom_branche || user?.id_branche}</div>
            <div><span className="font-medium">Manager:</span> {user?.manager_matricule || 'N/A'}</div>
            <div className="flex gap-2 pt-2">
              <Badge variant={user?.est_actif ? 'success' : 'secondary'}>{user?.est_actif ? 'Actif' : 'Inactif'}</Badge>
              <Badge variant={user?.est_admin ? 'primary' : 'secondary'}>{user?.est_admin ? 'Admin' : 'Standard'}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Subordonnés directs</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Rôle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.map((sub: any) => (
                  <TableRow key={sub.matricule}>
                    <TableCell>{sub.matricule}</TableCell>
                    <TableCell>{[sub.prenom, sub.nom].filter(Boolean).join(' ')}</TableCell>
                    <TableCell>{sub.role}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminUsersLayout>
  );
}
