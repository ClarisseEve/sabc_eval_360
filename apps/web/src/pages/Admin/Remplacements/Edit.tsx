import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Button } from '@/Components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Input } from '@/Components/UI/Input';
import { Label } from '@/Components/UI/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { Textarea } from '@/Components/UI/Textarea';
import { useAdminUsers } from '@/Hooks/queries';
import { remplacementsApi } from '@/Services/api';
import { AdminRemplacementsLayout } from './shared';

export default function EditRemplacement() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: usersData } = useAdminUsers();
  const users = Array.isArray(usersData) ? usersData : [];
  const { data } = useSuspenseQuery({
    queryKey: ['admin', 'remplacements', id],
    queryFn: () => remplacementsApi.get(id).then((r) => r.data),
  });

  const [form, setForm] = useState({
    remplacant_matricule: '',
    date_debut: '',
    date_fin: '',
    motif: '',
    service_remplacement: '',
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      remplacant_matricule: data.remplacant_matricule || '',
      date_debut: data.date_debut ? String(data.date_debut).slice(0, 10) : '',
      date_fin: data.date_fin ? String(data.date_fin).slice(0, 10) : '',
      motif: data.motif || '',
      service_remplacement: data.service_remplacement || '',
    });
  }, [data]);

  const duree = useMemo(() => {
    if (!form.date_debut || !form.date_fin) return data?.duree_prevue_jours || 30;
    const start = new Date(form.date_debut).getTime();
    const end = new Date(form.date_fin).getTime();
    return Math.max(30, Math.ceil((end - start) / 86400000) + 1);
  }, [form.date_debut, form.date_fin, data?.duree_prevue_jours]);

  const updateMutation = useMutation({
    mutationFn: async () =>
      remplacementsApi.update(id, {
        remplacant_matricule: form.remplacant_matricule,
        date_debut: form.date_debut,
        date_fin: form.date_fin || null,
        motif: form.motif,
        service_remplacement: form.service_remplacement || null,
        duree_prevue_jours: duree,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'remplacements'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'remplacements', id] });
      navigate(`/admin/remplacements/${id}`);
    },
  });

  return (
    <AdminRemplacementsLayout title={`Modifier remplacement #${id}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Modifier remplacement #{id}</h1>
          <p className="text-sm text-sabc-gray-600">Le titulaire et le rôle restent ceux du remplacement initial.</p>
        </div>
        <Link to={`/admin/remplacements/${id}`}><Button variant="outline">Retour</Button></Link>
      </div>

      <Card>
        <CardHeader><CardTitle>Edition</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Remplaçant</Label>
            <Select value={form.remplacant_matricule} onValueChange={(value) => setForm((p) => ({ ...p, remplacant_matricule: value }))}>
              <SelectTrigger><SelectValue placeholder="Sélectionner le remplaçant" /></SelectTrigger>
              <SelectContent>
                {users.filter((user: any) => user.matricule !== data?.titulaire_matricule).map((user: any) => (
                  <SelectItem key={user.matricule} value={user.matricule}>
                    {[user.prenom, user.nom].filter(Boolean).join(' ')} ({user.matricule}) - {user.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Durée prévue</Label>
            <Input value={`${duree} jour(s)`} readOnly />
          </div>
          <div>
            <Label>Date début</Label>
            <Input type="date" value={form.date_debut} onChange={(e) => setForm((p) => ({ ...p, date_debut: e.target.value }))} />
          </div>
          <div>
            <Label>Date fin</Label>
            <Input type="date" value={form.date_fin} onChange={(e) => setForm((p) => ({ ...p, date_fin: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Label>Service de remplacement</Label>
            <Input value={form.service_remplacement} onChange={(e) => setForm((p) => ({ ...p, service_remplacement: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Label>Motif</Label>
            <Textarea rows={4} value={form.motif} onChange={(e) => setForm((p) => ({ ...p, motif: e.target.value }))} />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Link to={`/admin/remplacements/${id}`}><Button variant="outline">Annuler</Button></Link>
            <Button className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark" onClick={() => updateMutation.mutate()}>
              {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AdminRemplacementsLayout>
  );
}
