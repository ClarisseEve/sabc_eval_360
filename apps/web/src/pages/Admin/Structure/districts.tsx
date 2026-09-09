import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button, buttonVariants } from '@/Components/UI/Button/Button';
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
import { Link } from 'react-router-dom';

export default function DistrictsIndex() {
  const { data } = useAdminStructure();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { success, error } = useToast();
  const [nomDistrict, setNomDistrict] = useState('');
  const [idService, setIdService] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const services = Array.isArray(data?.services) ? data.services : [];
  const districts = Array.isArray(data?.districts) ? data.districts : [];
  const canCreateDistrict = services.length > 0;

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'structure'] });
  };

  const closeModal = () => {
    setOpen(false);
    setNomDistrict('');
    setIdService('');
    setEditingId(null);
  };

  const openEdit = (district: any) => {
    setEditingId(district.id_district);
    setNomDistrict(district.nom_district ?? '');
    setIdService(district.id_service ?? '');
    setOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async () => adminApi.structure.createDistrict({ nom_district: nomDistrict, id_service: idService }),
    onSuccess: async () => {
      closeModal();
      await refresh();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => adminApi.structure.updateDistrict(editingId!, { nom_district: nomDistrict, id_service: idService }),
    onSuccess: async () => {
      closeModal();
      await refresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => adminApi.structure.deleteDistrict(id),
    onSuccess: refresh,
  });

  const handleDelete = async (id: string, nom: string) => {
    const ok = await confirm({
      title: `Supprimer le district ${nom} ?`,
      description: 'Cette action est irréversible. Les secteurs liés seront détachés du district.',
      confirmLabel: 'Supprimer',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync(id);
      success('District supprimé.');
    } catch (e: any) {
      error(e?.response?.data?.message || e?.message || 'La suppression a échoué.');
    }
  };

  const sortedServices = useMemo(() => services, [services]);

  const activeMutation = editingId ? updateMutation : createMutation;
  const errorMessage =
    (activeMutation.error as any)?.response?.data?.message ||
    (activeMutation.error ? 'Une erreur est survenue.' : null);

  return (
    <AdminStructureLayout title="Districts">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Districts existants</CardTitle>
          {districts.length > 0 && canCreateDistrict ? (
            <Button
              className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
              onClick={() => setOpen(true)}
            >
              Nouveau district
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {districts.length === 0 ? (
            <EmptyState
              title={canCreateDistrict ? 'Aucun district' : 'Créez d’abord un service'}
              description={canCreateDistrict
                ? "Créez votre premier district pour structurer l'organisation."
                : 'Chaque district doit être rattaché à un service commercial. Configurez ce prérequis avant de créer un district.'}
              action={
                canCreateDistrict ? (
                  <Button className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark" onClick={() => setOpen(true)}>
                    Nouveau district
                  </Button>
                ) : (
                  <Link to="/admin/structure/services" className={buttonVariants({ variant: 'outline' })}>
                    Configurer les services
                  </Link>
                )
              }
            />
          ) : (
          <>
            {!canCreateDistrict ? (
              <div role="status" className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-900">Création de district indisponible</p>
                  <p className="text-sm text-amber-800">Ajoutez un service commercial avant de créer un nouveau district.</p>
                </div>
                <Link to="/admin/structure/services" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  Configurer les services
                </Link>
              </div>
            ) : null}
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Nom du district</TableHead>
                <TableHead>Service de rattachement</TableHead>
                <TableHead>Région de rattachement</TableHead>
                <TableHead>Utilisateurs</TableHead>
                <TableHead>Secteurs</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {districts.map((district: any) => (
                <TableRow key={district.id_district}>
                  <TableCell>
                    {district.id_district}
                  </TableCell>
                  <TableCell className="font-medium">{district.nom_district}</TableCell>
                  <TableCell>{district.nom_service}</TableCell>
                  <TableCell>{district.nom_region}</TableCell>
                  <TableCell>{district.nb_utilisateurs ?? district.utilisateurs_count ?? 0}</TableCell>
                  <TableCell>{district.nb_secteurs ?? district.secteurs_count ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(district)}>
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={Number(district.nb_utilisateurs ?? 0) > 0}
                        onClick={() => handleDelete(district.id_district, district.nom_district)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(value) => (value ? setOpen(true) : closeModal())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier un district' : 'Créer un district'}</DialogTitle>
            <DialogDescription>Renseigner les informations du district.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nom_district">Nom du district</Label>
              <Input id="nom_district" value={nomDistrict} onChange={(e) => setNomDistrict(e.target.value)} placeholder="District Douala Centre" />
            </div>
            <div>
              <Label>Service commercial</Label>
              <Select value={idService} onValueChange={setIdService}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un service" /></SelectTrigger>
                <SelectContent>
                  {sortedServices.map((service: any, index: number) => (
                    <SelectItem key={`${service.id_service}-${index}`} value={service.id_service}>
                      {service.nom_service} - {service.nom_region}
                    </SelectItem>
                  ))}
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
              disabled={!nomDistrict || !idService || createMutation.isPending}
              onClick={() => (editingId ? updateMutation : createMutation).mutate()}
            >
              {activeMutation.isPending ? (editingId ? 'Mise à jour...' : 'Création...') : editingId ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminStructureLayout>
  );
}
