import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Input } from '@/Components/UI/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table';
import { Textarea } from '@/Components/UI/Textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/Components/UI/Dialog/Dialog';
import { adminApi } from '@/Services/api';
import { useAdminRoleRules, useAdminRoles } from '@/Hooks/queries';
import { AdminRolesLayout } from './shared';

export default function RolesPermissions() {
  const { data: rolesData } = useAdminRoles();
  const { data: rulesData } = useAdminRoleRules();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nom: '',
    description: '',
    criteres: '[{"nom":"Impact","poids":50},{"nom":"Execution","poids":50}]',
  });

  const roles = Array.isArray(rolesData) ? rolesData : [];
  const rules = Array.isArray(rulesData) ? rulesData : [];

  const closeModal = () => {
    setOpen(false);
    setForm({ nom: '', description: '', criteres: '[{"nom":"Impact","poids":50},{"nom":"Execution","poids":50}]' });
  };

  const createMutation = useMutation({
    mutationFn: async () =>
      adminApi.roles.createRegle({
        nom: form.nom,
        description: form.description || undefined,
        criteres: JSON.parse(form.criteres),
        est_active: true,
      }),
    onSuccess: async () => {
      closeModal();
      await queryClient.invalidateQueries({ queryKey: ['admin', 'roles', 'regles'] });
    },
  });

  const errorMessage =
    (createMutation.error as any)?.response?.data?.message ||
    (createMutation.error ? 'Une erreur est survenue (vérifiez le JSON des critères).' : null);

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => adminApi.roles.toggleRegle(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'roles', 'regles'] });
    },
  });

  const filteredRules = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rules;
    return rules.filter((rule: any) =>
      [rule.nom, rule.description, rule.id_regle].filter(Boolean).some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [rules, search]);

  return (
    <AdminRolesLayout title="Permissions et règles">
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Rôles</div><div className="text-2xl font-bold">{roles.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Règles</div><div className="text-2xl font-bold">{rules.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Actives</div><div className="text-2xl font-bold">{rules.filter((r: any) => r.est_active).length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-sabc-gray-600">Cross-branch</div><div className="text-2xl font-bold">{roles.filter((r: any) => r.peut_cross_branch).length}</div></CardContent></Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Règles d'évaluation</CardTitle>
            <Button
              className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
              onClick={() => setOpen(true)}
            >
              Nouvelle règle
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une règle" />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Règle</TableHead>
                  <TableHead>Critères</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.map((rule: any) => {
                  const criteres = Array.isArray(rule.criteres) ? rule.criteres : [];
                  return (
                    <TableRow key={rule.id_regle}>
                      <TableCell>
                        <div className="font-medium">{rule.nom}</div>
                        <div className="text-xs text-sabc-gray-500">{rule.description || 'Aucune description'}</div>
                      </TableCell>
                      <TableCell>{criteres.length}</TableCell>
                      <TableCell>
                        <Badge variant={rule.est_active ? 'default' : 'outline'}>
                          {rule.est_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => toggleMutation.mutate(rule.id_regle)}>
                          Basculer
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={(value) => (value ? setOpen(true) : closeModal())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une règle</DialogTitle>
            <DialogDescription>Définir une nouvelle règle d'évaluation et ses critères.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input placeholder="Nom de la règle" value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} />
            <Textarea placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            <Textarea
              rows={6}
              value={form.criteres}
              onChange={(e) => setForm((p) => ({ ...p, criteres: e.target.value }))}
            />
            <p className="text-xs text-sabc-gray-500">Le champ critères attend un JSON valide.</p>
            {errorMessage && <p className="text-sm text-sabc-red-primary">{errorMessage}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Annuler
            </Button>
            <Button
              className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
              disabled={!form.nom || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Création...' : 'Créer la règle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminRolesLayout>
  );
}
