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
import { AdminStructureLayout } from './shared';

export default function DistrictsIndex() {
  const { data } = useAdminStructure();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { success, error } = useToast();
  const [nomDistrict, setNomDistrict] = useState('');
  const [idService, setIdService] = useState('');
  const [open, setOpen] = useState(false);

  const services = Array.isArray(data?.services) ? data.services : [];
  const districts = Array.isArray(data?.districts) ? data.districts : [];

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'structure'] });
  };

  const closeModal = () => {
    setOpen(false);
    setNomDistrict('');
    setIdService('');
  };

  const createMutation = useMutation({
    mutationFn: async () => adminApi.structure.createDistrict({ nom_district: nomDistrict, id_service: idService }),
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
      description: 'Cette action est irréversible.',
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

  const errorMessage =
    (createMutation.error as any)?.response?.data?.message ||
    (createMutation.error ? 'Une erreur est survenue.' : null);

  return (
    <AdminStructureLayout title="Districts">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Districts existants</CardTitle>
          <Button
            className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
            onClick={() => setOpen(true)}
          >
            Nouveau district
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>District</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Région</TableHead>
                <TableHead>Utilisateurs</TableHead>
                <TableHead>Secteurs</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {districts.map((district: any) => (
                <TableRow key={district.id_district}>
                  <TableCell>
                    <div className="font-medium">{district.nom_district}</div>
                    <div className="text-xs text-sabc-gray-500">{district.id_district}</div>
                  </TableCell>
                  <TableCell>{district.nom_service}</TableCell>
                  <TableCell>{district.nom_region}</TableCell>
                  <TableCell>{district.nb_utilisateurs ?? district.utilisateurs_count ?? 0}</TableCell>
                  <TableCell>{district.nb_secteurs ?? district.secteurs_count ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={Number(district.nb_utilisateurs ?? 0) > 0 || Number(district.nb_secteurs ?? 0) > 0}
                      onClick={() => handleDelete(district.id_district, district.nom_district)}
                    >
                      Supprimer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(value) => (value ? setOpen(true) : closeModal())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un district</DialogTitle>
            <DialogDescription>Renseigner les informations du nouveau district.</DialogDescription>
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
