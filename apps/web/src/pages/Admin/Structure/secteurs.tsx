import React, { useMemo, useState } from 'react';
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

export default function SecteursIndex() {
  const { data } = useAdminStructure();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { success, error } = useToast();
  const [nomSecteur, setNomSecteur] = useState('');
  const [idService, setIdService] = useState('');
  const [idDistrict, setIdDistrict] = useState('');
  const [open, setOpen] = useState(false);

  const services = Array.isArray(data?.services) ? data.services : [];
  const districts = Array.isArray(data?.districts) ? data.districts : [];
  const secteurs = Array.isArray(data?.secteurs) ? data.secteurs : [];

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

  const errorMessage =
    (createMutation.error as any)?.response?.data?.message ||
    (createMutation.error ? 'Une erreur est survenue.' : null);

  return (
    <AdminStructureLayout title="Secteurs">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Secteurs existants</CardTitle>
          {secteurs.length > 0 ? (
            <Button
              className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
              onClick={() => setOpen(true)}
            >
              Nouveau secteur
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {secteurs.length === 0 ? (
            <EmptyState
              title="Aucun secteur"
              description="Créez votre premier secteur pour structurer l'organisation."
              action={
                <Button className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark" onClick={() => setOpen(true)}>
                  Nouveau secteur
                </Button>
              }
            />
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Secteur</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Région</TableHead>
                <TableHead>Utilisateurs</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {secteurs.map((secteur: any) => (
                <TableRow key={secteur.id_secteur}>
                  <TableCell>
                    <div className="font-medium">{secteur.nom_secteur}</div>
                    <div className="text-xs text-sabc-gray-500">{secteur.id_secteur}</div>
                  </TableCell>
                  <TableCell>{secteur.nom_service}</TableCell>
                  <TableCell>{secteur.nom_district || 'Direct service'}</TableCell>
                  <TableCell>{secteur.nom_region}</TableCell>
                  <TableCell>{secteur.nb_utilisateurs ?? secteur.utilisateurs_count ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={Number(secteur.nb_utilisateurs ?? 0) > 0}
                      onClick={() => handleDelete(secteur.id_secteur, secteur.nom_secteur)}
                    >
                      Supprimer
                    </Button>
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
            <DialogTitle>Créer un secteur</DialogTitle>
            <DialogDescription>Renseigner les informations du nouveau secteur.</DialogDescription>
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
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Création...' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminStructureLayout>
  );
}
