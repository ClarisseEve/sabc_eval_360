import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/Components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Input } from '@/Components/UI/Input';
import { FormField } from '@/Components/UI/Form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { adminApi } from '@/Services/api';
import { useAdminUser } from '@/Hooks/queries';
import { useToast } from '@/Contexts/ToastContext';
import { AdminUsersLayout } from './shared';

type EditForm = {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: string;
  id_region: string;
  id_branche: string;
  manager_matricule: string;
  statut: string;
};

const EMPTY: EditForm = {
  nom: '', prenom: '', email: '', telephone: '', role: '',
  id_region: '', id_branche: '', manager_matricule: '', statut: '',
};

export default function EditUser() {
  const { matricule = '' } = useParams();
  const { data } = useAdminUser(matricule);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [form, setForm] = useState<EditForm>(EMPTY);

  const { data: regions = [] } = useQuery({
    queryKey: ['admin', 'structure', 'regions'],
    queryFn: () => adminApi.structure.regions().then((r) => r.data),
  });
  const { data: branches = [] } = useQuery({
    queryKey: ['admin', 'structure', 'branches'],
    queryFn: () => adminApi.structure.branches().then((r) => r.data),
  });

  React.useEffect(() => {
    if (!data) return;
    setForm({
      nom: data.nom || '',
      prenom: data.prenom || '',
      email: data.email || '',
      telephone: data.telephone || '',
      role: data.role || '',
      id_region: data.id_region || '',
      id_branche: data.id_branche || '',
      manager_matricule: data.manager_matricule || '',
      statut: data.statut || '',
    });
  }, [data]);

  const setField = (key: keyof EditForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateMutation = useMutation({
    mutationFn: async () => adminApi.users.update(matricule, form),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users', matricule] });
      success('Utilisateur mis à jour.');
      navigate(`/admin/utilisateurs/${matricule}`);
    },
    onError: (e: any) => {
      error(e?.response?.data?.message || e?.message || 'La mise à jour a échoué.');
    },
  });

  return (
    <AdminUsersLayout title={`Modifier ${matricule}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-sabc-gray-900">Modifier {matricule}</h1>
        <Link to={`/admin/utilisateurs/${matricule}`}><Button variant="outline">Retour</Button></Link>
      </div>

      <Card>
        <CardHeader><CardTitle>Informations éditables</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Nom" htmlFor="nom" required>
            <Input id="nom" value={form.nom} onChange={(e) => setField('nom', e.target.value)} />
          </FormField>
          <FormField label="Prénom" htmlFor="prenom" required>
            <Input id="prenom" value={form.prenom} onChange={(e) => setField('prenom', e.target.value)} />
          </FormField>
          <FormField label="Adresse e-mail" htmlFor="email" required>
            <Input id="email" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
          </FormField>
          <FormField label="Téléphone" htmlFor="telephone">
            <Input id="telephone" type="tel" value={form.telephone} onChange={(e) => setField('telephone', e.target.value)} />
          </FormField>
          <FormField label="Rôle (code)" htmlFor="role" required hint="Code du rôle, ex. DR, CDS, TMO, ADMIN.">
            <Input id="role" value={form.role} onChange={(e) => setField('role', e.target.value)} />
          </FormField>
          <FormField label="Statut">
            <Select value={form.statut} onValueChange={(v) => setField('statut', v)}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Actif">Actif</SelectItem>
                <SelectItem value="Inactif">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Région">
            <Select value={form.id_region} onValueChange={(v) => setField('id_region', v)}>
              <SelectTrigger><SelectValue placeholder="Sélectionner une région" /></SelectTrigger>
              <SelectContent>
                {(regions as any[]).map((r) => (
                  <SelectItem key={r.id_region} value={r.id_region}>{r.nom_region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Branche">
            <Select value={form.id_branche} onValueChange={(v) => setField('id_branche', v)}>
              <SelectTrigger><SelectValue placeholder="Sélectionner une branche" /></SelectTrigger>
              <SelectContent>
                {(branches as any[]).map((b) => (
                  <SelectItem key={b.id_branche} value={b.id_branche}>{b.nom_branche}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Manager (matricule)" htmlFor="manager_matricule" className="md:col-span-2" hint="Matricule du responsable hiérarchique (facultatif).">
            <Input id="manager_matricule" value={form.manager_matricule} onChange={(e) => setField('manager_matricule', e.target.value)} placeholder="Ex. D1010" />
          </FormField>

          <div className="md:col-span-2 flex justify-end gap-2">
            <Link to={`/admin/utilisateurs/${matricule}`}><Button variant="outline">Annuler</Button></Link>
            <Button
              className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
              disabled={updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AdminUsersLayout>
  );
}
