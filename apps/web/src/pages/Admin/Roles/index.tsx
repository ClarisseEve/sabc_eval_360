import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table';
import { TruncatedTableBody } from '@/Components/UI/TruncatedList/TruncatedList';
import { adminApi } from '@/Services/api';
import { useAdminRoles } from '@/Hooks/queries';
import { AdminRolesLayout } from './shared';

export default function RolesIndex() {
  const { data } = useAdminRoles();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const roles = Array.isArray(data) ? data : [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => adminApi.roles.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
    },
  });

  const filteredRoles = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return roles;
    return roles.filter((role: any) =>
      [role.id_role, role.nom_role, role.description, role.id_branche]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [roles, search]);

  return (
    <AdminRolesLayout title="Gestion des rôles">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Gestion des rôles</h1>
          <p className="text-sm text-sabc-gray-600">CRUD réel sur les rôles SABC.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/roles/permissions">
            <Button variant="outline">Permissions</Button>
          </Link>
          <Link to="/admin/roles/create">
            <Button className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark">Nouveau rôle</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Total</div><div className="text-2xl font-bold">{roles.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Tanière</div><div className="text-2xl font-bold">{roles.filter((r: any) => r.niveau_taniere != null).length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Non tanière</div><div className="text-2xl font-bold">{roles.filter((r: any) => r.niveau_non_taniere != null).length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Inter-branches</div><div className="text-2xl font-bold">{roles.filter((r: any) => r.peut_cross_branch).length}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des rôles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par code, nom, description ou branche"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Branche</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TruncatedTableBody
                items={filteredRoles}
                previewCount={10}
                colSpan={6}
                keyExtractor={(role: any) => role.id_role}
                renderRow={(role: any) => (
                  <TableRow key={role.id_role}>
                    <TableCell className="font-medium">{role.id_role}</TableCell>
                    <TableCell>
                      <div className="font-medium">{role.nom_role}</div>
                      <div className="text-xs text-sabc-gray-500">{role.description || 'Aucune description'}</div>
                    </TableCell>
                    <TableCell>{role.id_branche}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {role.niveau_taniere != null ? `T ${role.niveau_taniere}` : role.niveau_non_taniere != null ? `NT ${role.niveau_non_taniere}` : 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {role.peut_auto_evaluer && <Badge variant="secondary">Auto</Badge>}
                        {role.peut_evaluer_pairs && <Badge variant="secondary">Pairs</Badge>}
                        {role.peut_evaluer_subordonnes && <Badge variant="secondary">Subs</Badge>}
                        {role.peut_cross_branch && <Badge variant="secondary">Cross</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/admin/roles/${role.id_role}`}>
                          <Button variant="outline" size="sm">Voir</Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Supprimer le rôle ${role.nom_role} ?`)) {
                              deleteMutation.mutate(role.id_role);
                            }
                          }}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              />
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminRolesLayout>
  );
}
