import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/Components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Input } from '@/Components/UI/Input';
import { Label } from '@/Components/UI/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { Textarea } from '@/Components/UI/Textarea';
import { useAdminUsers } from '@/Hooks/queries';
import { remplacementsApi } from '@/Services/api';
import { AdminRemplacementsLayout } from './shared';

export default function CreateRemplacement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useAdminUsers({ limit: 1000 });
  const users = data?.data ?? (Array.isArray(data) ? data : []);
  const [form, setForm] = useState({
    titulaire_matricule: '',
    remplacant_matricule: '',
    date_debut: '',
    date_fin: '',
    motif: '',
    service_remplacement: '',
  });

  const titulaire = users.find((u: any) => u.matricule === form.titulaire_matricule);
  const duree = useMemo(() => {
    if (!form.date_debut || !form.date_fin) return 30;
    const start = new Date(form.date_debut).getTime();
    const end = new Date(form.date_fin).getTime();
    return Math.max(30, Math.ceil((end - start) / 86400000) + 1);
  }, [form.date_debut, form.date_fin]);

  const createMutation = useMutation({
    mutationFn: async () =>
      remplacementsApi.create({
        titulaire_matricule: form.titulaire_matricule,
        remplacant_matricule: form.remplacant_matricule,
        role_remplace: titulaire?.role,
        region_remplacement: titulaire?.id_region,
        service_remplacement: form.service_remplacement || undefined,
        motif: form.motif,
        date_debut: form.date_debut,
        date_fin: form.date_fin || undefined,
        duree_prevue_jours: duree,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'remplacements'] });
      navigate('/admin/remplacements');
    },
  });

  return (
    <AdminRemplacementsLayout title="Créer un remplacement">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Créer un remplacement</h1>
          <p className="text-sm text-sabc-gray-600">Le rôle et la région sont déduits du titulaire choisi.</p>
        </div>
        <Link to="/admin/remplacements"><Button variant="outline">Retour</Button></Link>
      </div>

      <Card>
        <CardHeader><CardTitle>Formulaire</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Titulaire</Label>
            <Select value={form.titulaire_matricule} onValueChange={(value) => setForm((p) => ({ ...p, titulaire_matricule: value }))}>
              <SelectTrigger><SelectValue placeholder="Sélectionner le titulaire" /></SelectTrigger>
              <SelectContent>
                {users.map((user: any) => (
                  <SelectItem key={user.matricule} value={user.matricule}>
                    {[user.prenom, user.nom].filter(Boolean).join(' ')} ({user.matricule}) - {user.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Remplaçant</Label>
            <Select value={form.remplacant_matricule} onValueChange={(value) => setForm((p) => ({ ...p, remplacant_matricule: value }))}>
              <SelectTrigger><SelectValue placeholder="Sélectionner le remplaçant" /></SelectTrigger>
              <SelectContent>
                {users.filter((user: any) => user.matricule !== form.titulaire_matricule).map((user: any) => (
                  <SelectItem key={user.matricule} value={user.matricule}>
                    {[user.prenom, user.nom].filter(Boolean).join(' ')} ({user.matricule}) - {user.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date début</Label>
            <Input type="date" value={form.date_debut} onChange={(e) => setForm((p) => ({ ...p, date_debut: e.target.value }))} />
          </div>
          <div>
            <Label>Date fin</Label>
            <Input type="date" value={form.date_fin} onChange={(e) => setForm((p) => ({ ...p, date_fin: e.target.value }))} />
          </div>
          <div>
            <Label>Service de remplacement</Label>
            <Input value={form.service_remplacement} onChange={(e) => setForm((p) => ({ ...p, service_remplacement: e.target.value }))} />
          </div>
          <div>
            <Label>Durée prévue</Label>
            <Input value={`${duree} jour(s)`} readOnly />
          </div>
          <div className="md:col-span-2">
            <Label>Motif</Label>
            <Textarea rows={4} value={form.motif} onChange={(e) => setForm((p) => ({ ...p, motif: e.target.value }))} />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Link to="/admin/remplacements"><Button variant="outline">Annuler</Button></Link>
            <Button
              className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
              disabled={!form.titulaire_matricule || !form.remplacant_matricule || !form.date_debut || !form.motif || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AdminRemplacementsLayout>
  );
}
