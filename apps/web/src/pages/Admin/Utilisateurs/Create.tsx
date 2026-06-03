import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/Components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Input } from '@/Components/UI/Input';
import { FormField } from '@/Components/UI/Form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select';
import { adminApi } from '@/Services/api';
import { useToast } from '@/Contexts/ToastContext';
import { AdminUsersLayout } from './shared';

const initialForm = {
  matricule: '',
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  password: '',
  role: '',
  role_nom: '',
  id_region: '',
  id_branche: '',
  region_nom: '',
  type_region: '',
  manager_matricule: '',
};

export default function CreateUser() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [form, setForm] = useState(initialForm);

  const { data: regions = [] } = useQuery({
    queryKey: ['admin', 'structure', 'regions'],
    queryFn: () => adminApi.structure.regions().then((r) => r.data),
  });
  const { data: branches = [] } = useQuery({
    queryKey: ['admin', 'structure', 'branches'],
    queryFn: () => adminApi.structure.branches().then((r) => r.data),
  });

  const setField = (key: keyof typeof initialForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // La sélection d'une région renseigne les 3 champs dénormalisés attendus par l'API
  const onSelectRegion = (id: string) => {
    const region = (regions as any[]).find((r) => r.id_region === id);
    setForm((prev) => ({
      ...prev,
      id_region: id,
      region_nom: region?.nom_region ?? '',
      type_region: region?.est_taniere ? 'taniere' : 'non-taniere',
    }));
  };

  const createMutation = useMutation({
    mutationFn: async () => adminApi.users.create(form),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      success('Utilisateur créé.');
      navigate(`/admin/utilisateurs/${response.data.matricule}`);
    },
    onError: (e: any) => {
      error(e?.response?.data?.message || e?.message || "La création de l'utilisateur a échoué.");
    },
  });

  const isValid =
    form.matricule &&
    form.nom &&
    form.prenom &&
    form.email &&
    form.password &&
    form.role &&
    form.role_nom &&
    form.id_region &&
    form.id_branche;

  return (
    <AdminUsersLayout title="Créer un utilisateur">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-sabc-gray-900">Créer un utilisateur</h1>
        <Link to="/admin/utilisateurs"><Button variant="outline">Retour</Button></Link>
      </div>

      <Card>
        <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Matricule" htmlFor="matricule" required>
            <Input id="matricule" value={form.matricule} onChange={(e) => setField('matricule', e.target.value)} placeholder="Ex. A0001" />
          </FormField>
          <FormField label="Adresse e-mail" htmlFor="email" required>
            <Input id="email" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="prenom.nom@sabc.local" />
          </FormField>
          <FormField label="Nom" htmlFor="nom" required>
            <Input id="nom" value={form.nom} onChange={(e) => setField('nom', e.target.value)} />
          </FormField>
          <FormField label="Prénom" htmlFor="prenom" required>
            <Input id="prenom" value={form.prenom} onChange={(e) => setField('prenom', e.target.value)} />
          </FormField>
          <FormField label="Téléphone" htmlFor="telephone">
            <Input id="telephone" type="tel" value={form.telephone} onChange={(e) => setField('telephone', e.target.value)} />
          </FormField>
          <FormField label="Mot de passe" htmlFor="password" required>
            <Input id="password" type="password" value={form.password} onChange={(e) => setField('password', e.target.value)} />
          </FormField>

          <FormField label="Rôle (code)" htmlFor="role" required hint="Code du rôle, ex. DR, CDS, TMO, ADMIN.">
            <Input id="role" value={form.role} onChange={(e) => setField('role', e.target.value)} placeholder="DR" />
          </FormField>
          <FormField label="Libellé du rôle" htmlFor="role_nom" required>
            <Input id="role_nom" value={form.role_nom} onChange={(e) => setField('role_nom', e.target.value)} placeholder="Directeur Régional" />
          </FormField>

          <FormField label="Région" required hint="Renseigne automatiquement le type (tanière / non-tanière).">
            <Select value={form.id_region} onValueChange={onSelectRegion}>
              <SelectTrigger><SelectValue placeholder="Sélectionner une région" /></SelectTrigger>
              <SelectContent>
                {(regions as any[]).map((r) => (
                  <SelectItem key={r.id_region} value={r.id_region}>{r.nom_region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Branche" required>
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
            <Link to="/admin/utilisateurs"><Button variant="outline">Annuler</Button></Link>
            <Button
              className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
              disabled={!isValid || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AdminUsersLayout>
  );
}
