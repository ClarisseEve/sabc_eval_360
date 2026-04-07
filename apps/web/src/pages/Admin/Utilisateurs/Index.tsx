import React, { Suspense, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table';
import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';
import { useAdminUsers } from '@/Hooks/queries';
import { AdminUsersLayout } from './shared';

function UsersContent() {
  const { data } = useAdminUsers();
  const [search, setSearch] = useState('');
  const users = Array.isArray(data) ? data : [];

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user: any) =>
      [user.matricule, user.nom, user.prenom, user.email, user.role, user.region?.nom_region, user.branche?.nom_branche]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [users, search]);

  return (
    <AdminUsersLayout title="Gestion des utilisateurs">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Gestion des utilisateurs</h1>
          <p className="text-sm text-sabc-gray-600">Liste réelle des utilisateurs administrables.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/utilisateurs/gaps">
            <Button variant="outline">Analyse des gaps</Button>
          </Link>
          <Link to="/admin/utilisateurs/create">
            <Button className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark">Nouvel utilisateur</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Total</div><div className="text-2xl font-bold">{users.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Actifs</div><div className="text-2xl font-bold">{users.filter((u: any) => u.est_actif).length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Admins</div><div className="text-2xl font-bold">{users.filter((u: any) => u.est_admin).length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Avec manager</div><div className="text-2xl font-bold">{users.filter((u: any) => !!u.manager_matricule).length}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Utilisateurs</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par matricule, nom, email, rôle..." />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matricule</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Région</TableHead>
                <TableHead>Branche</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user: any) => (
                <TableRow key={user.matricule}>
                  <TableCell className="font-medium">{user.matricule}</TableCell>
                  <TableCell>
                    <div className="font-medium">{[user.prenom, user.nom].filter(Boolean).join(' ')}</div>
                    <div className="text-xs text-sabc-gray-500">{user.email}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                  <TableCell>{user.region?.nom_region || user.id_region}</TableCell>
                  <TableCell>{user.branche?.nom_branche || user.id_branche}</TableCell>
                  <TableCell>
                    <Badge variant={user.est_actif ? 'default' : 'outline'}>{user.statut || (user.est_actif ? 'Actif' : 'Inactif')}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/admin/utilisateurs/${user.matricule}`}><Button variant="outline" size="sm">Voir</Button></Link>
                      <Link to={`/admin/utilisateurs/${user.matricule}/edit`}><Button variant="outline" size="sm">Modifier</Button></Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminUsersLayout>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <UsersContent />
    </Suspense>
  );
}
