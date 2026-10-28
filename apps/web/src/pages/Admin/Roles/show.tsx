import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/Components/UI/Pagination';
import { PageHeader } from '@/Components/UI/Page';
import { EmptyState } from '@/Components/UI/EmptyState';
import { adminApi } from '@/Services/api';
import { useAdminRole } from '@/Hooks/queries';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { useToast } from '@/Contexts/ToastContext';
import { AdminRolesLayout } from './shared';
import { paginateList } from '@/utils/adminUi';

const PERMISSIONS: Array<{ key: string; label: string }> = [
  { key: 'peut_auto_evaluer', label: 'Auto-évaluation' },
  { key: 'peut_evaluer_pairs', label: 'Évaluation des pairs' },
  { key: 'peut_evaluer_subordonnes', label: 'Évaluation des subordonnés' },
  { key: 'peut_cross_branch', label: 'Évaluation hors de sa branche' },
];

function capitalize(value: unknown): string | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase().replace(/_/g, ' ');
}

function statusVariant(label: string | null): 'success' | 'warning' | 'error' | 'secondary' {
  const key = String(label ?? '').toLowerCase();
  if (key === 'actif') return 'success';
  if (key === 'indisponible') return 'warning';
  if (key === 'suspendu') return 'error';
  return 'secondary';
}

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
      title: data?.peut_auto_evaluer ? 'Désactiver l’auto-évaluation pour ce rôle ?' : 'Activer l’auto-évaluation pour ce rôle ?',
      description: data?.peut_auto_evaluer
        ? 'L’auto-évaluation sera désactivée pour ce rôle.'
        : 'L’auto-évaluation sera activée pour ce rôle.',
      confirmLabel: data?.peut_auto_evaluer ? 'Désactiver' : 'Activer',
    });
    if (ok) updateMutation.mutate();
  };

  const role = data;
  const users = Array.isArray(role?.utilisateurs) ? role.utilisateurs : [];
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const paginatedUsers = useMemo(() => paginateList(users, { page, pageSize }), [users, page]);
  const activePage = Math.min(page, paginatedUsers.pageCount);

  useEffect(() => {
    setPage(1);
  }, [id]);

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
              {role?.peut_auto_evaluer ? 'Désactiver l’auto-évaluation' : 'Activer l’auto-évaluation'}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader><CardTitle>Détails</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="font-medium">Code :</span> {role?.id_role || 'n.d.'}</div>
            <div><span className="font-medium">Branche :</span> {role?.branche?.nom_branche || role?.id_branche || 'Toutes les branches'}</div>
            <div><span className="font-medium">Portée :</span> {capitalize(role?.portee_geographique) ?? 'n.d.'}</div>
            <div><span className="font-medium">Niveau en région tanière :</span> {role?.niveau_taniere ?? 'n.d.'}</div>
            <div><span className="font-medium">Niveau hors tanière :</span> {role?.niveau_non_taniere ?? 'n.d.'}</div>
            <div className="border-t border-sabc-gray-200 pt-3">
              <div className="mb-2 font-medium">Droits d’évaluation</div>
              <ul className="space-y-1.5">
                {PERMISSIONS.map(({ key, label }) => (
                  <li key={key} className="flex items-center justify-between gap-3">
                    <span className="text-sabc-gray-700">{label}</span>
                    <Badge variant={role?.[key] ? 'success' : 'secondary'}>{role?.[key] ? 'Autorisé' : 'Non autorisé'}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Utilisateurs affectés</CardTitle></CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <EmptyState title="Aucun utilisateur" description="Aucun utilisateur n’est affecté à ce rôle." />
            ) : (
              <Table className="min-w-[420px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.items.map((user: any) => (
                    <TableRow key={user.matricule}>
                      <TableCell>{user.matricule}</TableCell>
                      <TableCell>{[user.prenom, user.nom].filter(Boolean).join(' ')}</TableCell>
                      <TableCell>
                        {(() => {
                          const label = capitalize(user.statut) ?? (user.est_actif === false ? 'Inactif' : user.est_actif ? 'Actif' : null);
                          return label ? <Badge variant={statusVariant(label)}>{label}</Badge> : 'n.d.';
                        })()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {users.length > pageSize && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-sabc-gray-500">
                  Affichage de {(activePage - 1) * pageSize + 1} à {Math.min(activePage * pageSize, users.length)} sur {users.length} utilisateurs
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        aria-disabled={activePage === 1}
                        className={activePage === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    {Array.from({ length: paginatedUsers.pageCount }, (_, index) => index + 1).map((pageNumber) => (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink isActive={activePage === pageNumber} onClick={() => setPage(pageNumber)}>
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage((current) => Math.min(paginatedUsers.pageCount, current + 1))}
                        aria-disabled={activePage === paginatedUsers.pageCount}
                        className={activePage === paginatedUsers.pageCount ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminRolesLayout>
  );
}
