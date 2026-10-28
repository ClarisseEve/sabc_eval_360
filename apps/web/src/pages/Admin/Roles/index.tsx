import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Checkbox } from '@/Components/UI/Checkbox';
import { Input } from '@/Components/UI/Input';
import { Label } from '@/Components/UI/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { Textarea } from '@/Components/UI/Textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/Components/UI/Dialog/Dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/Components/UI/Pagination';
import { adminApi } from '@/Services/api';
import { useAdminRoles } from '@/Hooks/queries';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { useToast } from '@/Contexts/ToastContext';
import { paginateList } from '@/utils/adminUi';
import { AdminRolesLayout } from './shared';
import { Trash2 } from 'lucide-react';
import { PageHeader } from '@/Components/UI/Page/PageHeader';
import { KpiCard, KpiGrid } from '@/Components/UI/KpiCard';

/**
 * Niveau hiérarchique lisible. Un rôle porte un niveau pour les régions « tanière »
 * et un pour les autres régions ; s'ils sont identiques, un seul niveau est affiché.
 */
function formatRoleLevel(role: { niveau_taniere?: number | null; niveau_non_taniere?: number | null }): string {
  const t = role?.niveau_taniere;
  const nt = role?.niveau_non_taniere;
  if (t == null && nt == null) return 'n.d.';
  if (t != null && nt != null && Number(t) === Number(nt)) return `Niveau ${t}`;
  const parts: string[] = [];
  if (t != null) parts.push(`Tanière : ${t}`);
  if (nt != null) parts.push(`Hors tanière : ${nt}`);
  return parts.join(' · ');
}

const ROLE_PERMISSION_LABELS: Array<{ key: string; label: string }> = [
  { key: 'peut_auto_evaluer', label: 'Auto-évaluation' },
  { key: 'peut_evaluer_pairs', label: 'Pairs' },
  { key: 'peut_evaluer_subordonnes', label: 'Subordonnés' },
  { key: 'peut_cross_branch', label: 'Inter-branches' },
];

const initialForm = {
  id_role: '',
  nom_role: '',
  id_branche: '',
  description: '',
  niveau_mode: 'taniere',
  niveau: '1',
  peut_auto_evaluer: true,
  peut_evaluer_pairs: true,
  peut_evaluer_subordonnes: false,
  peut_cross_branch: false,
};

export default function RolesIndex() {
  const { data } = useAdminRoles();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { success, error } = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const roles = Array.isArray(data) ? data : [];
  const { data: branches = [], isPending: branchesPending } = useQuery({
    queryKey: ['admin', 'structure', 'branches'],
    queryFn: () => adminApi.structure.branches().then((response) => response.data),
  });

  const closeModal = () => {
    setOpen(false);
    setForm(initialForm);
    // Sans reset, l'erreur de la tentative précédente s'affiche encore à la
    // réouverture de la modale alors que rien n'a été soumis.
    createMutation.reset();
  };

  const createMutation = useMutation({
    mutationFn: async () =>
      adminApi.roles.create({
        id_role: form.id_role,
        nom_role: form.nom_role,
        id_branche: form.id_branche,
        description: form.description || undefined,
        niveau_taniere: form.niveau_mode === 'taniere' ? Number(form.niveau) : undefined,
        niveau_non_taniere: form.niveau_mode === 'non_taniere' ? Number(form.niveau) : undefined,
        peut_auto_evaluer: form.peut_auto_evaluer,
        peut_evaluer_pairs: form.peut_evaluer_pairs,
        peut_evaluer_subordonnes: form.peut_evaluer_subordonnes,
        peut_cross_branch: form.peut_cross_branch,
      }),
    onSuccess: async () => {
      closeModal();
      await queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => adminApi.roles.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
      success('Rôle supprimé.');
    },
    // Un rôle rattaché à des utilisateurs est refusé par l'API: sans ce retour,
    // la ligne restait affichée et l'échec passait inaperçu.
    onError: (e: any) =>
      error(
        typeof e?.response?.data?.message === 'string'
          ? e.response.data.message
          : "Ce rôle n'a pas pu être supprimé.",
      ),
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

  const branchNames = useMemo(
    () => new Map<string, string>((Array.isArray(branches) ? branches : []).map((branch: any) => [String(branch.id_branche), branch.nom_branche])),
    [branches],
  );
  const branchLabel = (role: any) =>
    role.id_branche ? branchNames.get(String(role.id_branche)) || role.id_branche : 'Toutes les branches';

  const stats = useMemo(() => ({
    total: roles.length,
    subordonnes: roles.filter((role: any) => Boolean(role.peut_evaluer_subordonnes)).length,
    pairs: roles.filter((role: any) => Boolean(role.peut_evaluer_pairs)).length,
    crossBranch: roles.filter((role: any) => Boolean(role.peut_cross_branch)).length,
  }), [roles]);

  const pageSize = 8;
  const paginatedRoles = useMemo(() => paginateList(filteredRoles, { page, pageSize }), [filteredRoles, page]);
  const activePageCount = paginatedRoles.pageCount;

  React.useEffect(() => {
    setPage(1);
  }, [search]);

  const errorMessage =
    (createMutation.error as any)?.response?.data?.message ||
    (createMutation.error ? 'Une erreur est survenue.' : null);

  return (
    <AdminRolesLayout title="Gestion des rôles">
      <PageHeader
        title="Gestion des rôles"
        description="Postes de l’organisation, niveau hiérarchique et droits d’évaluation associés."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Rôles' }]}
        actions={<Button onClick={() => setOpen(true)}>Nouveau rôle</Button>}
      />

      <KpiGrid>
        <KpiCard label="Rôles" value={stats.total} />
        <KpiCard label="Évaluent leurs subordonnés" value={stats.subordonnes} />
        <KpiCard label="Évaluent leurs pairs" value={stats.pairs} />
        <KpiCard label="Évaluent hors de leur branche" value={stats.crossBranch} />
      </KpiGrid>

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
          <Table className="min-w-[820px]">
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
              {paginatedRoles.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sabc-gray-500">Aucun rôle trouvé.</TableCell>
                </TableRow>
              ) : (
                paginatedRoles.items.map((role: any) => (
                  <TableRow key={role.id_role}>
                    <TableCell className="font-medium">{role.id_role}</TableCell>
                    <TableCell>
                      <div className="font-medium">{role.nom_role}</div>
                      <div className="text-xs text-sabc-gray-500">{role.description || 'Aucune description'}</div>
                    </TableCell>
                    <TableCell>{branchLabel(role)}</TableCell>
                    <TableCell>
                      <span className="whitespace-nowrap text-sm text-sabc-gray-700">{formatRoleLevel(role)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {ROLE_PERMISSION_LABELS.filter(({ key }) => role[key]).map(({ key, label }) => (
                          <Badge key={key} variant="outline">{label}</Badge>
                        ))}
                        {ROLE_PERMISSION_LABELS.every(({ key }) => !role[key]) ? (
                          <span className="text-xs text-sabc-gray-500">Aucun droit d’évaluation</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link to={`/admin/roles/${role.id_role}`}>
                          <Button variant="outline" size="sm">Voir</Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-700 hover:bg-red-50 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
                          aria-label={`Supprimer le rôle ${role.nom_role}`}
                          title="Supprimer"
                          onClick={async () => {
                            const ok = await confirm({
                              title: `Supprimer le rôle ${role.nom_role} ?`,
                              description: 'Cette action est irréversible.',
                              confirmLabel: 'Supprimer',
                              variant: 'destructive',
                            });
                            if (ok) deleteMutation.mutate(role.id_role);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {filteredRoles.length > pageSize && (
            <Pagination className="pt-2">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={() => setPage((current) => Math.max(1, current - 1))} aria-disabled={page === 1} className={page === 1 ? 'pointer-events-none opacity-50' : ''} />
                </PaginationItem>
                {Array.from({ length: activePageCount }, (_, index) => index + 1).map((pageNumber) => (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink isActive={page === pageNumber} onClick={() => setPage(pageNumber)}>{pageNumber}</PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext onClick={() => setPage((current) => Math.min(activePageCount, current + 1))} aria-disabled={page === activePageCount} className={page === activePageCount ? 'pointer-events-none opacity-50' : ''} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(value) => (value ? setOpen(true) : closeModal())}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un rôle</DialogTitle>
            <DialogDescription>Renseigner les informations du nouveau rôle.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="id_role">Code rôle</Label>
              <Input id="id_role" value={form.id_role} onChange={(e) => setForm((p) => ({ ...p, id_role: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <Label htmlFor="nom_role">Nom rôle</Label>
              <Input id="nom_role" value={form.nom_role} onChange={(e) => setForm((p) => ({ ...p, nom_role: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="id_branche">Branche</Label>
              <Select value={form.id_branche} onValueChange={(id_branche) => setForm((current) => ({ ...current, id_branche }))}>
                <SelectTrigger id="id_branche" aria-label="Branche">
                  <SelectValue placeholder={branchesPending ? 'Chargement des branches…' : 'Sélectionner une branche'} />
                </SelectTrigger>
                <SelectContent>
                  {(branches as Array<{ id_branche: string; nom_branche: string }>).map((branch) => (
                    <SelectItem key={branch.id_branche} value={branch.id_branche}>
                      {branch.nom_branche}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!branchesPending && branches.length === 0 ? (
                <p role="status" className="mt-1 text-xs text-amber-700">Aucune branche disponible ; créez d’abord une branche.</p>
              ) : null}
            </div>
            <div>
              <Label>Niveau</Label>
              <div className="flex gap-2">
                <Select value={form.niveau_mode} onValueChange={(value) => setForm((p) => ({ ...p, niveau_mode: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="taniere">Tanière</SelectItem>
                    <SelectItem value="non_taniere">Hors tanière</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={form.niveau} onValueChange={(value) => setForm((p) => ({ ...p, niveau: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-2"><Checkbox checked={form.peut_auto_evaluer} onCheckedChange={(v) => setForm((p) => ({ ...p, peut_auto_evaluer: !!v }))} />Peut s'auto-évaluer</label>
              <label className="flex items-center gap-2"><Checkbox checked={form.peut_evaluer_pairs} onCheckedChange={(v) => setForm((p) => ({ ...p, peut_evaluer_pairs: !!v }))} />Peut évaluer ses pairs</label>
              <label className="flex items-center gap-2"><Checkbox checked={form.peut_evaluer_subordonnes} onCheckedChange={(v) => setForm((p) => ({ ...p, peut_evaluer_subordonnes: !!v }))} />Peut évaluer ses subordonnés</label>
              <label className="flex items-center gap-2"><Checkbox checked={form.peut_cross_branch} onCheckedChange={(v) => setForm((p) => ({ ...p, peut_cross_branch: !!v }))} />Peut évaluer inter-branches</label>
            </div>
            {errorMessage && <p className="md:col-span-2 text-sm text-sabc-red-primary">{errorMessage}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Annuler</Button>
            <Button
              disabled={!form.id_role || !form.nom_role || !form.id_branche || branchesPending || branches.length === 0 || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Création…' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminRolesLayout>
  );
}
