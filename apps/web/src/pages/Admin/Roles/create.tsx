import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Button } from '@/Components/UI/Button';
import { Checkbox } from '@/Components/UI/Checkbox';
import { Input } from '@/Components/UI/Input';
import { Label } from '@/Components/UI/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { Textarea } from '@/Components/UI/Textarea';
import { adminApi } from '@/Services/api';
import { AdminRolesLayout } from './shared';

const initialForm = {
  id_role: '',
  nom_role: '',
  id_branche: '',
  description: '',
  niveau_mode: 'taniere',
  niveau: '1',
  peut_auto_evaluer: true,
  peut_evaluer_pairs: true,
  peut_evaluer_subordonnes: false,
  peut_cross_branch: false,
};

export default function CreateRole() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);

  const createMutation = useMutation({
    mutationFn: async () =>
      adminApi.roles.create({
        id_role: form.id_role,
        nom_role: form.nom_role,
        id_branche: form.id_branche,
        description: form.description || undefined,
        niveau_taniere: form.niveau_mode === 'taniere' ? Number(form.niveau) : undefined,
        niveau_non_taniere: form.niveau_mode === 'non_taniere' ? Number(form.niveau) : undefined,
        peut_auto_evaluer: form.peut_auto_evaluer,
        peut_evaluer_pairs: form.peut_evaluer_pairs,
        peut_evaluer_subordonnes: form.peut_evaluer_subordonnes,
        peut_cross_branch: form.peut_cross_branch,
      }),
    onSuccess: (response) => {
      navigate(`/admin/roles/${response.data.id_role}`);
    },
  });

  return (
    <AdminRolesLayout title="Créer un rôle">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Créer un rôle</h1>
          <p className="text-sm text-sabc-gray-600">Création réelle via `POST /admin/roles`.</p>
        </div>
        <Link to="/admin/roles">
          <Button variant="outline">Retour</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du rôle</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="id_role">Code rôle</Label>
            <Input id="id_role" value={form.id_role} onChange={(e) => setForm((p) => ({ ...p, id_role: e.target.value.toUpperCase() }))} />
          </div>
          <div>
            <Label htmlFor="nom_role">Nom rôle</Label>
            <Input id="nom_role" value={form.nom_role} onChange={(e) => setForm((p) => ({ ...p, nom_role: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="id_branche">Branche</Label>
            <Input id="id_branche" value={form.id_branche} onChange={(e) => setForm((p) => ({ ...p, id_branche: e.target.value.toUpperCase() }))} placeholder="COMM / MKT / ..." />
          </div>
          <div>
            <Label>Niveau</Label>
            <div className="flex gap-2">
              <Select value={form.niveau_mode} onValueChange={(value) => setForm((p) => ({ ...p, niveau_mode: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="taniere">Tanière</SelectItem>
                  <SelectItem value="non_taniere">Non tanière</SelectItem>
                </SelectContent>
              </Select>
              <Select value={form.niveau} onValueChange={(value) => setForm((p) => ({ ...p, niveau: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
          </div>
          <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2"><Checkbox checked={form.peut_auto_evaluer} onCheckedChange={(v) => setForm((p) => ({ ...p, peut_auto_evaluer: !!v }))} />Peut s'auto-évaluer</label>
            <label className="flex items-center gap-2"><Checkbox checked={form.peut_evaluer_pairs} onCheckedChange={(v) => setForm((p) => ({ ...p, peut_evaluer_pairs: !!v }))} />Peut évaluer ses pairs</label>
            <label className="flex items-center gap-2"><Checkbox checked={form.peut_evaluer_subordonnes} onCheckedChange={(v) => setForm((p) => ({ ...p, peut_evaluer_subordonnes: !!v }))} />Peut évaluer ses subordonnés</label>
            <label className="flex items-center gap-2"><Checkbox checked={form.peut_cross_branch} onCheckedChange={(v) => setForm((p) => ({ ...p, peut_cross_branch: !!v }))} />Peut évaluer inter-branches</label>
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Link to="/admin/roles"><Button variant="outline">Annuler</Button></Link>
            <Button
              className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
              disabled={!form.id_role || !form.nom_role || !form.id_branche || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AdminRolesLayout>
  );
}
