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

const initialForm = { id_region: '', nom_region: '', est_taniere: 'false' };

export default function RegionsIndex() {
  const { data } = useAdminStructure();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const regions = Array.isArray(data?.regions) ? data.regions : [];

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'structure'] });
  };

  const createMutation = useMutation({
    mutationFn: async () =>
      adminApi.structure.createRegion({
        id_region: form.id_region,
        nom_region: form.nom_region,
        est_taniere: form.est_taniere === 'true',
      }),
    onSuccess: async () => {
      setForm(initialForm);
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
      setEditingId(null);
      setForm(initialForm);
      await refresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => adminApi.structure.deleteRegion(id),
    onSuccess: refresh,
  });

  return (
    <AdminStructureLayout title="Gestion des régions">
      <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Modifier une région' : 'Créer une région'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <div className="flex gap-2">
              <Button
                className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
                onClick={() => (editingId ? updateMutation.mutate() : createMutation.mutate())}
                disabled={!form.nom_region || (!editingId && !form.id_region)}
              >
                {editingId ? 'Mettre à jour' : 'Créer'}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={() => { setEditingId(null); setForm(initialForm); }}>
                  Annuler
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Régions existantes</CardTitle>
          </CardHeader>
          <CardContent>
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingId(region.id_region);
                            setForm({
                              id_region: region.id_region,
                              nom_region: region.nom_region,
                              est_taniere: String(!!region.est_taniere),
                            });
                          }}
                        >
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={(region._count?.utilisateurs ?? 0) > 0}
                          onClick={() => {
                            if (window.confirm(`Supprimer la région ${region.nom_region} ?`)) {
                              deleteMutation.mutate(region.id_region);
                            }
                          }}
                        >
                          Supprimer
                        </Button>
                      </div>
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
