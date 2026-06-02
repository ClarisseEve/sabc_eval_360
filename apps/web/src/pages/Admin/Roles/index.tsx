import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Checkbox } from '@/Components/UI/Checkbox';
import { Input } from '@/Components/UI/Input';
import { Label } from '@/Components/UI/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { Textarea } from '@/Components/UI/Textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table';
import { TruncatedTableBody } from '@/Components/UI/TruncatedList/TruncatedList';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/Components/UI/Dialog/Dialog';
import { adminApi } from '@/Services/api';
import { useAdminRoles } from '@/Hooks/queries';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { AdminRolesLayout } from './shared';

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
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const roles = Array.isArray(data) ? data : [];

  const closeModal = () => {
    setOpen(false);
    setForm(initialForm);
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

  const errorMessage =
    (createMutation.error as any)?.response?.data?.message ||
    (createMutation.error ? 'Une erreur est survenue.' : null);

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
          <Button
            className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
            onClick={() => setOpen(true)}
          >
            Nouveau rôle
          </Button>
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
              <Input id="id_branche" value={form.id_branche} onChange={(e) => setForm((p) => ({ ...p, id_branche: e.target.value.toUpperCase() }))} placeholder="COMM / MKT / ..." />
            </div>
            <div>
              <Label>Niveau</Label>
              <div className="flex gap-2">
                <Select value={form.niveau_mode} onValueChange={(value) => setForm((p) => ({ ...p, niveau_mode: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="taniere">Tanière</SelectItem>
                    <SelectItem value="non_taniere">Non tanière</SelectItem>
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
              className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
              disabled={!form.id_role || !form.nom_role || !form.id_branche || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Création...' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminRolesLayout>
  );
}
