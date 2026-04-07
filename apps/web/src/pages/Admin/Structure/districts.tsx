import React, { useMemo, useState } from 'react';
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

export default function DistrictsIndex() {
  const { data } = useAdminStructure();
  const queryClient = useQueryClient();
  const [nomDistrict, setNomDistrict] = useState('');
  const [idService, setIdService] = useState('');

  const services = Array.isArray(data?.services) ? data.services : [];
  const districts = Array.isArray(data?.districts) ? data.districts : [];

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'structure'] });
  };

  const createMutation = useMutation({
    mutationFn: async () => adminApi.structure.createDistrict({ nom_district: nomDistrict, id_service: idService }),
    onSuccess: async () => {
      setNomDistrict('');
      setIdService('');
      await refresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => adminApi.structure.deleteDistrict(id),
    onSuccess: refresh,
  });

  const sortedServices = useMemo(() => services, [services]);

  return (
    <AdminStructureLayout title="Districts">
      <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Créer un district</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button
              className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
              disabled={!nomDistrict || !idService}
              onClick={() => createMutation.mutate()}
            >
              Créer
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Districts existants</CardTitle>
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
                        onClick={() => {
                          if (window.confirm(`Supprimer le district ${district.nom_district} ?`)) {
                            deleteMutation.mutate(district.id_district);
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
