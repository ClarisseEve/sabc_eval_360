import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { adminApi } from '@/Services/api';
import { useAdminStructure } from '@/Hooks/queries';
import { AdminStructureLayout } from './shared';

export default function ServicesIndex() {
  const { data } = useAdminStructure();
  const queryClient = useQueryClient();
  const [nomService, setNomService] = useState('');
  const [idRegion, setIdRegion] = useState('');

  const regions = Array.isArray(data?.regions) ? data.regions : [];
  const services = Array.isArray(data?.services) ? data.services : [];

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'structure'] });
  };

  const createMutation = useMutation({
    mutationFn: async () => adminApi.structure.createService({ nom_service: nomService, id_region: idRegion }),
    onSuccess: async () => {
      setNomService('');
      setIdRegion('');
      await refresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => adminApi.structure.deleteService(id),
    onSuccess: refresh,
  });

  return (
    <AdminStructureLayout title="Services commerciaux">
      <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Créer un service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button
              className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
              disabled={!nomService || !idRegion}
              onClick={() => createMutation.mutate()}
            >
              Créer
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Services existants</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Région</TableHead>
                  <TableHead>Utilisateurs</TableHead>
                  <TableHead>Districts</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service: any, index: number) => (
                  <TableRow key={`${service.id_service}-${index}`}>
                    <TableCell>
                      <div className="font-medium">{service.nom_service}</div>
                      <div className="text-xs text-sabc-gray-500">{service.id_service}</div>
                    </TableCell>
                    <TableCell>{service.nom_region}</TableCell>
                    <TableCell>{service.nb_utilisateurs ?? service.utilisateurs_count ?? 0}</TableCell>
                    <TableCell>{service.nb_districts ?? service.districts_count ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={Number(service.nb_utilisateurs ?? 0) > 0 || Number(service.nb_districts ?? 0) > 0}
                        onClick={() => {
                          if (window.confirm(`Supprimer le service ${service.nom_service} ?`)) {
                            deleteMutation.mutate(service.id_service);
                          }
                        }}
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
      </div>
    </AdminStructureLayout>
  );
}
