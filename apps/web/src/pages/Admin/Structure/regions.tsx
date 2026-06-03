import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/Components/UI/Dialog/Dialog';
import { adminApi } from '@/Services/api';
import { useAdminStructure } from '@/Hooks/queries';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { useToast } from '@/Contexts/ToastContext';
import { EmptyState } from '@/Components/UI/EmptyState';
import { AdminStructureLayout } from './shared';

const initialForm = { id_region: '', nom_region: '', est_taniere: 'false' };

export default function RegionsIndex() {
  const { data } = useAdminStructure();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const confirm = useConfirm();
  const { success, error } = useToast();

  const regions = Array.isArray(data?.regions) ? data.regions : [];

  const handleDelete = async (id: string, nom: string) => {
    const ok = await confirm({
      title: `Supprimer la région ${nom} ?`,
      description: 'Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync(id);
      success('Région supprimée.');
    } catch (e: any) {
      error(e?.response?.data?.message || e?.message || 'La suppression a échoué.');
    }
  };

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'structure'] });
  };

  const closeModal = () => {
    setOpen(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setOpen(true);
  };

  const openEdit = (region: any) => {
    setEditingId(region.id_region);
    setForm({
      id_region: region.id_region,
      nom_region: region.nom_region,
      est_taniere: String(!!region.est_taniere),
    });
    setOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async () =>
      adminApi.structure.createRegion({
        id_region: form.id_region,
        nom_region: form.nom_region,
        est_taniere: form.est_taniere === 'true',
      }),
    onSuccess: async () => {
      closeModal();
      await refresh();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () =>
      adminApi.structure.updateRegion(editingId!, {
        nom_region: form.nom_region,
        est_taniere: form.est_taniere === 'true',
      }),
    onSuccess: async () => {
      closeModal();
      await refresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => adminApi.structure.deleteRegion(id),
    onSuccess: refresh,
  });

  const activeMutation = editingId ? updateMutation : createMutation;
  const errorMessage =
    (activeMutation.error as any)?.response?.data?.message ||
    (activeMutation.error ? 'Une erreur est survenue.' : null);

  return (
    <AdminStructureLayout title="Gestion des régions">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Régions existantes</CardTitle>
          <Button
            className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
            onClick={openCreate}
          >
            Nouvelle région
          </Button>
        </CardHeader>
        <CardContent>
          {regions.length === 0 ? (
            <EmptyState
              title="Aucune région"
              description="Créez votre première région pour structurer l'organisation."
              action={
                <Button className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark" onClick={openCreate}>
                  Nouvelle région
                </Button>
              }
            />
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Utilisateurs</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.map((region: any) => (
                <TableRow key={region.id_region}>
                  <TableCell>{region.id_region}</TableCell>
                  <TableCell>{region.nom_region}</TableCell>
                  <TableCell>{region.est_taniere ? 'Tanière' : 'Non tanière'}</TableCell>
                  <TableCell>{region._count?.utilisateurs ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(region)}>
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={(region._count?.utilisateurs ?? 0) > 0}
                        onClick={() => handleDelete(region.id_region, region.nom_region)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(value) => (value ? setOpen(true) : closeModal())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier une région' : 'Créer une région'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Mettre à jour les informations de la région.' : 'Renseigner les informations de la nouvelle région.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!editingId && (
              <div>
                <Label htmlFor="id_region">Code région</Label>
                <Input
                  id="id_region"
                  value={form.id_region}
                  onChange={(e) => setForm((prev) => ({ ...prev, id_region: e.target.value }))}
                  placeholder="LTL"
                />
              </div>
            )}
            <div>
              <Label htmlFor="nom_region">Nom</Label>
              <Input
                id="nom_region"
                value={form.nom_region}
                onChange={(e) => setForm((prev) => ({ ...prev, nom_region: e.target.value }))}
                placeholder="Littoral"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.est_taniere} onValueChange={(value) => setForm((prev) => ({ ...prev, est_taniere: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Non tanière</SelectItem>
                  <SelectItem value="true">Tanière</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errorMessage && <p className="text-sm text-sabc-red-primary">{errorMessage}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Annuler
            </Button>
            <Button
              className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
              onClick={() => (editingId ? updateMutation.mutate() : createMutation.mutate())}
              disabled={!form.nom_region || (!editingId && !form.id_region) || activeMutation.isPending}
            >
              {activeMutation.isPending
                ? 'Enregistrement...'
                : editingId
                  ? 'Mettre à jour'
                  : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminStructureLayout>
  );
}
