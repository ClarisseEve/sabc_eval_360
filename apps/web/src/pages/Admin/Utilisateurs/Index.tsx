import React, { Suspense, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table';
import { DashboardSkeleton } from '@/Components/Dashboard/DashboardSkeleton';
import { useAdminUsers } from '@/Hooks/queries';
import { AdminUsersLayout } from './shared';

function Pagination({ meta, onPageChange }: { meta: { total: number; page: number; limit: number; totalPages: number }; onPageChange: (p: number) => void }) {
  if (meta.totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, meta.page - 2);
  const end = Math.min(meta.totalPages, meta.page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-between border-t border-sabc-gray-200 pt-4">
      <p className="text-sm text-sabc-gray-600">
        {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} sur {meta.total} utilisateurs
      </p>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>
          Précédent
        </Button>
        {pages.map((p) => (
          <Button key={p} variant={p === meta.page ? 'default' : 'outline'} size="sm" onClick={() => onPageChange(p)}
            className={p === meta.page ? 'bg-sabc-red-primary text-white' : ''}>
            {p}
          </Button>
        ))}
        <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => onPageChange(meta.page + 1)}>
          Suivant
        </Button>
      </div>
    </div>
  );
}

function UsersContent() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      setSearchDebounced(value);
      setPage(1);
    }, 350);
    setDebounceTimer(timer);
  }, [debounceTimer]);

  const params = { page, limit: 50, ...(searchDebounced ? { search: searchDebounced } : {}) };
  const { data: response } = useAdminUsers(params);

  const users = response?.data ?? (Array.isArray(response) ? response : []);
  const meta = response?.meta ?? { total: users.length, page: 1, limit: 50, totalPages: 1 };

  return (
    <AdminUsersLayout title="Gestion des utilisateurs">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Gestion des utilisateurs</h1>
          <p className="text-sm text-sabc-gray-600">{meta.total} utilisateur{meta.total > 1 ? 's' : ''} au total</p>
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

      <Card>
        <CardHeader><CardTitle>Utilisateurs</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Rechercher par matricule, nom, email, rôle..."
          />

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
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-sabc-gray-500">
                    {searchDebounced ? 'Aucun résultat pour cette recherche' : 'Aucun utilisateur'}
                  </TableCell>
                </TableRow>
              )}
              {users.map((user: any) => (
                <TableRow key={user.matricule}>
                  <TableCell className="font-medium">{user.matricule}</TableCell>
                  <TableCell>
                    <div className="font-medium">{[user.prenom, user.nom].filter(Boolean).join(' ')}</div>
                    <div className="text-xs text-sabc-gray-500">{user.email}</div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
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

          <Pagination meta={meta} onPageChange={setPage} />
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
