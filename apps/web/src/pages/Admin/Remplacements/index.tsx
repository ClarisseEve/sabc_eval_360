import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Input } from '@/Components/UI/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table';
import { TruncatedTableBody } from '@/Components/UI/TruncatedList/TruncatedList';
import { remplacementsApi } from '@/Services/api';
import { AdminRemplacementsLayout } from './shared';

export default function RemplacementsIndex() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const { data } = useSuspenseQuery({
    queryKey: ['admin', 'remplacements', 'all'],
    queryFn: async () => {
      const [actifs, aVenir, historique] = await Promise.all([
        remplacementsApi.actifs(),
        remplacementsApi.aVenir(),
        remplacementsApi.historique(),
      ]);
      return {
        actifs: actifs.data,
        aVenir: aVenir.data,
        historique: historique.data,
      };
    },
  });

  const terminerMutation = useMutation({
    mutationFn: async (id: string) => remplacementsApi.terminer(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'remplacements'] });
    },
  });

  const rows = useMemo(() => {
    const all = [...(data?.actifs || []), ...(data?.aVenir || []), ...(data?.historique || [])];
    const seen = new Set();
    return all.filter((row: any) => {
      if (seen.has(row.id_remplacement)) return false;
      seen.add(row.id_remplacement);
      const text = [
        row.titulaire_matricule,
        row.remplacant_matricule,
        row.titulaire_prenom,
        row.titulaire_nom,
        row.remplacant_prenom,
        row.remplacant_nom,
        row.role_remplace,
      ].filter(Boolean).join(' ').toLowerCase();
      return !search.trim() || text.includes(search.trim().toLowerCase());
    });
  }, [data, search]);

  return (
    <AdminRemplacementsLayout title="Gestion des remplacements">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Gestion des remplacements</h1>
          <p className="text-sm text-sabc-gray-600">Actifs, à venir et historiques sur les données réelles.</p>
        </div>
        <Link to="/admin/remplacements/create">
          <Button className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark">Nouveau remplacement</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Actifs</div><div className="text-2xl font-bold">{data.actifs.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">À venir</div><div className="text-2xl font-bold">{data.aVenir.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Historique</div><div className="text-2xl font-bold">{data.historique.length}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Remplacements</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un titulaire, remplaçant ou rôle" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titulaire</TableHead>
                <TableHead>Remplaçant</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TruncatedTableBody
                items={rows}
                previewCount={10}
                colSpan={6}
                keyExtractor={(row: any) => row.id_remplacement}
                renderRow={(row: any) => {
                  const statut = row.est_actif ? 'Actif' : 'Terminé';
                  return (
                    <TableRow key={row.id_remplacement}>
                      <TableCell>{[row.titulaire_prenom, row.titulaire_nom].filter(Boolean).join(' ')} ({row.titulaire_matricule})</TableCell>
                      <TableCell>{[row.remplacant_prenom, row.remplacant_nom].filter(Boolean).join(' ')} ({row.remplacant_matricule})</TableCell>
                      <TableCell>{row.role_remplace}</TableCell>
                      <TableCell>{row.date_debut} {row.date_fin ? `→ ${row.date_fin}` : ''}</TableCell>
                      <TableCell><Badge variant={row.est_actif ? 'default' : 'outline'}>{statut}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/admin/remplacements/${row.id_remplacement}`}><Button variant="outline" size="sm">Voir</Button></Link>
                          <Link to={`/admin/remplacements/${row.id_remplacement}/edit`}><Button variant="outline" size="sm">Modifier</Button></Link>
                          {row.est_actif ? (
                            <Button variant="outline" size="sm" onClick={() => terminerMutation.mutate(String(row.id_remplacement))}>Terminer</Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }}
              />
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminRemplacementsLayout>
  );
}
