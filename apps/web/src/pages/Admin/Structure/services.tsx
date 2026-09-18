import React, { useState } from 'react';
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

export default function ServicesIndex() {
  const { data } = useAdminStructure();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { success, error } = useToast();
  const [nomService, setNomService] = useState('');
  const [idRegion, setIdRegion] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const regions = Array.isArray(data?.regions) ? data.regions : [];
  const services = Array.isArray(data?.services) ? data.services : [];
  const canCreateService = regions.length > 0;

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'structure'] });
  };

  const closeModal = () => {
    setOpen(false);
    setNomService('');
    setIdRegion('');
    setEditingId(null);
  };

  const openEdit = (service: any) => {
    setEditingId(service.id_service);
    setNomService(service.nom_service ?? '');
    setIdRegion(service.id_region ?? '');
    setOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async () => adminApi.structure.createService({ nom_service: nomService, id_region: idRegion }),
    onSuccess: async () => {
      closeModal();
      await refresh();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => adminApi.structure.updateService(editingId!, { nom_service: nomService, id_region: idRegion }),
    onSuccess: async () => {
      closeModal();
      await refresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => adminApi.structure.deleteService(id),
    onSuccess: refresh,
  });

  const handleDelete = async (id: string, nom: string) => {
    const ok = await confirm({
      title: `Supprimer le service ${nom} ?`,
      description: 'Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync(id);
      success('Service supprimé.');
    } catch (e: any) {
      error(e?.response?.data?.message || e?.message || 'La suppression a échoué.');
    }
  };

  const activeMutation = editingId ? updateMutation : createMutation;
  const errorMessage =
    (activeMutation.error as any)?.response?.data?.message ||
    (activeMutation.error ? 'Une erreur est survenue.' : null);

  return (
    <AdminStructureLayout title="Services commerciaux">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Services existants</CardTitle>
          {services.length > 0 && canCreateService ? (
            <Button
              className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
              onClick={() => setOpen(true)}
            >
              Nouveau service
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {services.length === 0 ? (
            <EmptyState
              title={canCreateService ? 'Aucun service' : 'Créez d’abord une région'}
              description={canCreateService
                ? "Créez votre premier service commercial pour structurer l'organisation."
                : 'Chaque service doit être rattaché à une région. Configurez ce prérequis avant de créer un service.'}
              action={
                canCreateService ? (
                  <Button className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark" onClick={() => setOpen(true)}>
                    Nouveau service
                  </Button>
                ) : (
                  <Link to="/admin/structure/regions" className={buttonVariants({ variant: 'outline' })}>
                    Configurer les régions
                  </Link>
                )
              }
            />
          ) : (
          <>
            {!canCreateService ? (
              <div role="status" className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-900">Création de service indisponible</p>
                  <p className="text-sm text-amber-800">Ajoutez une région avant de créer un nouveau service.</p>
                </div>
                <Link to="/admin/structure/regions" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  Configurer les régions
                </Link>
              </div>
            ) : null}
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Nom du service</TableHead>
                <TableHead>Région de rattachement</TableHead>
                <TableHead>Utilisateurs</TableHead>
                <TableHead>Districts</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service: any, index: number) => (
                <TableRow key={`${service.id_service}-${index}`}>
                  <TableCell>
                    {service.id_service}
                  </TableCell>
                  <TableCell className="font-medium">{service.nom_service}</TableCell>
                  <TableCell>{service.nom_region}</TableCell>
                  <TableCell>{service.nb_utilisateurs ?? service.utilisateurs_count ?? 0}</TableCell>
                  <TableCell>{service.nb_districts ?? service.districts_count ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(service)}>
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={Number(service.nb_utilisateurs ?? 0) > 0}
                        onClick={() => handleDelete(service.id_service, service.nom_service)}
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
            <DialogTitle>{editingId ? 'Modifier un service' : 'Créer un service'}</DialogTitle>
            <DialogDescription>Renseigner les informations du service commercial.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nom_service">Nom du service</Label>
              <Input id="nom_service" value={nomService} onChange={(e) => setNomService(e.target.value)} placeholder="Service Commercial Littoral" />
            </div>
            <div>
              <Label>Région</Label>
              <Select value={idRegion} onValueChange={setIdRegion}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une région" /></SelectTrigger>
                <SelectContent>
                  {regions.map((region: any) => (
                    <SelectItem key={region.id_region} value={region.id_region}>
                      {region.nom_region}
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
              disabled={!nomService || !idRegion || createMutation.isPending}
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
