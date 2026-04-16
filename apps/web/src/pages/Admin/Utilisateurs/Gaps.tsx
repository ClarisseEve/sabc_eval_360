import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Input } from '@/Components/UI/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table';
import { useAdminUsers } from '@/Hooks/queries';
import { AdminUsersLayout } from './shared';

function detectGaps(user: any) {
  const gaps: string[] = [];
  if (!user.manager_matricule && user.role !== 'DR' && user.role !== 'ADMIN') gaps.push('Manager absent');
  if (!user.telephone) gaps.push('Téléphone manquant');
  if (!user.email) gaps.push('Email manquant');
  if (!user.id_region) gaps.push('Région absente');
  if (!user.id_branche) gaps.push('Branche absente');
  if (!user.est_actif) gaps.push('Compte inactif');
  return gaps;
}

export default function UserGaps() {
  const { data } = useAdminUsers({ limit: 1000 });
  const [search, setSearch] = useState('');
  const users = data?.data ?? (Array.isArray(data) ? data : []);

  const rows = useMemo(() => {
    return users
      .map((user: any) => ({ user, gaps: detectGaps(user) }))
      .filter(({ user, gaps }: { user: any; gaps: string[] }) => {
        if (gaps.length === 0) return false;
        const term = search.trim().toLowerCase();
        if (!term) return true;
        return [user.matricule, user.nom, user.prenom, user.role, ...gaps]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      });
  }, [users, search]);

  return (
    <AdminUsersLayout title="Analyse des gaps utilisateurs">
      <div>
        <h1 className="text-2xl font-bold text-sabc-gray-900">Analyse des gaps utilisateurs</h1>
        <p className="text-sm text-sabc-gray-600">Détection simple des incohérences de données exploitées par l’application.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Utilisateurs audités</div><div className="text-2xl font-bold">{users.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Avec gaps</div><div className="text-2xl font-bold">{rows.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Total gaps</div><div className="text-2xl font-bold">{rows.reduce((sum: number, row: { user: any; gaps: string[] }) => sum + row.gaps.length, 0)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Résultats</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un utilisateur ou un gap" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matricule</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Gaps</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ user, gaps }: { user: any; gaps: string[] }) => (
                <TableRow key={user.matricule}>
                  <TableCell>{user.matricule}</TableCell>
                  <TableCell>{[user.prenom, user.nom].filter(Boolean).join(' ')}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{gaps.join(', ')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminUsersLayout>
  );
}
