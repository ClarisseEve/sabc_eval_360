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
import { PageHeader } from '@/Components/UI/Page/PageHeader';
import { Link } from 'react-router-dom';

export default function SecteursIndex() {
  const { data } = useAdminStructure();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { success, error } = useToast();
  const [nomSecteur, setNomSecteur] = useState('');
  const [idService, setIdService] = useState('');
  const [idDistrict, setIdDistrict] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const services = Array.isArray(data?.services) ? data.services : [];
  const districts = Array.isArray(data?.districts) ? data.districts : [];
  const secteurs = Array.isArray(data?.secteurs) ? data.secteurs : [];
  const canCreateSecteur = services.length > 0;

  const availableDistricts = useMemo(
    () => districts.filter((district: any) => district.id_service === idService),
    [districts, idService],
  );

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'structure'] });
  };

  const closeModal = () => {
    setOpen(false);
    setNomSecteur('');
    setIdService('');
    setIdDistrict('');
    setEditingId(null);
  };

  const openEdit = (secteur: any) => {
    setEditingId(secteur.id_secteur);
    setNomSecteur(secteur.nom_secteur ?? '');
    setIdService(secteur.id_service ?? '');
    setIdDistrict(secteur.id_district ?? '');
    setOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async () =>
      adminApi.structure.createSecteur({
        nom_secteur: nomSecteur,
        id_service: idService,
        id_district: idDistrict || undefined,
      }),
    onSuccess: async () => {
      closeModal();
      await refresh();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () =>
      adminApi.structure.updateSecteur(editingId!, {
        nom_secteur: nomSecteur,
        id_service: idService,
        id_district: idDistrict || undefined,
      }),
    onSuccess: async () => {
      closeModal();
      await refresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => adminApi.structure.deleteSecteur(id),
    onSuccess: refresh,
  });

  const handleDelete = async (id: string, nom: string) => {
    const ok = await confirm({
      title: `Supprimer le secteur ${nom} ?`,
      description: 'Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync(id);
      success('Secteur supprimé.');
    } catch (e: any) {
      error(e?.response?.data?.message || e?.message || 'La suppression a échoué.');
    }
  };

  const activeMutation = editingId ? updateMutation : createMutation;
  const errorMessage =
    (activeMutation.error as any)?.response?.data?.message ||
    (activeMutation.error ? 'Une erreur est survenue.' : null);

  return (
    <AdminStructureLayout title="Secteurs">
      <PageHeader
        title="Secteurs"
        description="Secteurs rattachés à un district ou directement à un service commercial."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Structure' }, { label: 'Secteurs' }]}
        actions={secteurs.length > 0 && canCreateSecteur ? (
          <Button onClick={() => setOpen(true)}>Nouveau secteur</Button>
        ) : undefined}
      />
      <Card>
        <CardHeader>
          <CardTitle>Secteurs existants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {secteurs.length === 0 ? (
            <EmptyState
              title={canCreateSecteur ? 'Aucun secteur' : 'Créez d’abord un service'}
              description={canCreateSecteur
                ? "Créez votre premier secteur pour structurer l'organisation."
                : 'Chaque secteur doit être rattaché à un service commercial. Configurez ce prérequis avant de créer un secteur.'}
              action={
                canCreateSecteur ? (
                  <Button onClick={() => setOpen(true)}>
                    Nouveau secteur
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
            {!canCreateSecteur ? (
              <div role="status" className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-900">Création de secteur indisponible</p>
                  <p className="text-sm text-amber-800">Ajoutez un service commercial avant de créer un nouveau secteur.</p>
                </div>
                <Link to="/admin/structure/services" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  Configurer les services
                </Link>
              </div>
            ) : null}
            <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Nom du secteur</TableHead>
                <TableHead>Service de rattachement</TableHead>
                <TableHead>District de rattachement</TableHead>
                <TableHead>Région de rattachement</TableHead>
                <TableHead>Utilisateurs</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {secteurs.map((secteur: any) => (
                <TableRow key={secteur.id_secteur}>
                  <TableCell>
                    {secteur.id_secteur}
                  </TableCell>
                  <TableCell className="font-medium">{secteur.nom_secteur}</TableCell>
                  <TableCell>{secteur.nom_service}</TableCell>
                  <TableCell>{secteur.nom_district || 'Aucun (rattaché au service)'}</TableCell>
                  <TableCell>{secteur.nom_region}</TableCell>
                  <TableCell>{secteur.nb_utilisateurs ?? secteur.utilisateurs_count ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={() => openEdit(secteur)}>
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-red-700 hover:bg-red-50 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
                        size="sm"
                        disabled={Number(secteur.nb_utilisateurs ?? 0) > 0}
                        onClick={() => handleDelete(secteur.id_secteur, secteur.nom_secteur)}
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
            <DialogTitle>{editingId ? 'Modifier un secteur' : 'Créer un secteur'}</DialogTitle>
            <DialogDescription>Renseigner les informations du secteur.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nom_secteur">Nom du secteur</Label>
              <Input id="nom_secteur" value={nomSecteur} onChange={(e) => setNomSecteur(e.target.value)} placeholder="Secteur Bonanjo" />
            </div>
            <div>
              <Label>Service commercial</Label>
              <Select value={idService} onValueChange={(value) => { setIdService(value); setIdDistrict(''); }}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un service" /></SelectTrigger>
                <SelectContent>
                  {services.map((service: any, index: number) => (
                    <SelectItem key={`${service.id_service}-${index}`} value={service.id_service}>
                      {service.nom_service} - {service.nom_region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>District</Label>
              <Select value={idDistrict || '__none__'} onValueChange={(value) => setIdDistrict(value === '__none__' ? '' : value)} disabled={!idService}>
                <SelectTrigger><SelectValue placeholder="Optionnel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Aucun district</SelectItem>
                  {availableDistricts.map((district: any) => (
                    <SelectItem key={district.id_district} value={district.id_district}>
                      {district.nom_district}
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
              disabled={!nomSecteur || !idService || createMutation.isPending}
              onClick={() => (editingId ? updateMutation : createMutation).mutate()}
            >
              {activeMutation.isPending ? (editingId ? 'Mise à jour…' : 'Création…') : editingId ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminStructureLayout>
  );
}
