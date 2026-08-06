import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Badge } from '@/Components/UI/Badge';
import { Button, buttonVariants } from '@/Components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Input } from '@/Components/UI/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table';
import { TruncatedTableBody } from '@/Components/UI/TruncatedList/TruncatedList';
import { PageHeader } from '@/Components/UI/Page';
import { EmptyState } from '@/Components/UI/EmptyState';
import { remplacementsApi } from '@/Services/api';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { useToast } from '@/Contexts/ToastContext';
import { AdminRemplacementsLayout } from './shared';
import { useAdminUsers } from '@/Hooks/queries';

type Statut = 'actif' | 'avenir' | 'termine';

const STATUT_META: Record<Statut, { label: string; variant: 'success' | 'info' | 'secondary' }> = {
  actif: { label: 'Actif', variant: 'success' },
  avenir: { label: 'À venir', variant: 'info' },
  termine: { label: 'Terminé', variant: 'secondary' },
};

export default function RemplacementsIndex() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { success, error } = useToast();
  const [search, setSearch] = useState('');
  const { data: usersResponse } = useAdminUsers({ page: 1, limit: 2 });

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

  const handleTerminer = async (id: string) => {
    const ok = await confirm({
      title: 'Terminer ce remplacement ?',
      description: 'Le remplacement sera clôturé immédiatement.',
      confirmLabel: 'Terminer',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await terminerMutation.mutateAsync(id);
      success('Remplacement terminé.');
    } catch (e: any) {
      error(e?.response?.data?.message || e?.message || 'La clôture du remplacement a échoué.');
    }
  };

  // Statut dérivé du bucket d'origine (et non d'un booléen) — corrige l'affichage
  // erroné d'un remplacement « à venir » comme « Terminé ».
  const rows = useMemo(() => {
    const tag = (arr: any[] | undefined, statut: Statut) => (arr || []).map((r) => ({ ...r, _statut: statut }));
    const all = [
      ...tag(data?.actifs, 'actif'),
      ...tag(data?.aVenir, 'avenir'),
      ...tag(data?.historique, 'termine'),
    ];
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

  const hasRemplacements =
    (data?.actifs?.length ?? 0) +
      (data?.aVenir?.length ?? 0) +
      (data?.historique?.length ?? 0) >
    0;
  const loadedUsers = usersResponse?.data ?? (Array.isArray(usersResponse) ? usersResponse : []);
  const usersCount = Number(usersResponse?.meta?.total ?? loadedUsers.length);
  const canCreateReplacement = usersCount >= 2;

  return (
    <AdminRemplacementsLayout title="Gestion des remplacements">
      <PageHeader
        title="Gestion des remplacements"
        description="Remplacements actifs, à venir et historiques, sur les données réelles."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Remplacements' }]}
        actions={hasRemplacements && canCreateReplacement ? (
          <Link to="/admin/remplacements/create" className={buttonVariants()}>
            Nouveau remplacement
          </Link>
        ) : undefined}
      />

      {hasRemplacements && !canCreateReplacement ? (
        <div role="status" className="flex flex-col gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-900">Création de remplacement indisponible</p>
            <p className="text-sm text-amber-800">Au moins deux utilisateurs sont nécessaires pour choisir un titulaire et un remplaçant.</p>
          </div>
          <Link to="/admin/utilisateurs" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Gérer les utilisateurs
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Actifs</div><div className="text-2xl font-bold">{data.actifs.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">À venir</div><div className="text-2xl font-bold">{data.aVenir.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Historique</div><div className="text-2xl font-bold">{data.historique.length}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Remplacements</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un titulaire, remplaçant ou rôle" />
          {rows.length === 0 ? (
            search.trim() ? (
              <EmptyState title="Aucun résultat" description="Aucun remplacement ne correspond à votre recherche." />
            ) : (
              <EmptyState
                title={canCreateReplacement ? 'Aucun remplacement' : 'Ajoutez un second utilisateur'}
                description={canCreateReplacement
                  ? 'Créez un remplacement temporaire pour couvrir une absence.'
                  : 'Au moins deux utilisateurs sont nécessaires pour choisir un titulaire et un remplaçant.'}
                action={
                  canCreateReplacement ? (
                    <Link to="/admin/remplacements/create" className={buttonVariants()}>
                      Nouveau remplacement
                    </Link>
                  ) : (
                    <Link to="/admin/utilisateurs" className={buttonVariants({ variant: 'outline' })}>
                      Gérer les utilisateurs
                    </Link>
                  )
                }
              />
            )
          ) : (
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
                    const meta = STATUT_META[row._statut as Statut] ?? STATUT_META.termine;
                    return (
                      <TableRow key={row.id_remplacement}>
                        <TableCell>{[row.titulaire_prenom, row.titulaire_nom].filter(Boolean).join(' ')} ({row.titulaire_matricule})</TableCell>
                        <TableCell>{[row.remplacant_prenom, row.remplacant_nom].filter(Boolean).join(' ')} ({row.remplacant_matricule})</TableCell>
                        <TableCell>{row.role_remplace}</TableCell>
                        <TableCell>{row.date_debut} {row.date_fin ? `→ ${row.date_fin}` : ''}</TableCell>
                        <TableCell><Badge variant={meta.variant}>{meta.label}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link to={`/admin/remplacements/${row.id_remplacement}`}><Button variant="outline" size="sm">Voir</Button></Link>
                            <Link to={`/admin/remplacements/${row.id_remplacement}/edit`}><Button variant="outline" size="sm">Modifier</Button></Link>
                            {row._statut === 'actif' ? (
                              <Button variant="outline" size="sm" onClick={() => handleTerminer(String(row.id_remplacement))}>Terminer</Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }}
                />
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminRemplacementsLayout>
  );
}
