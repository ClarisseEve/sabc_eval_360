import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/Components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Input } from '@/Components/UI/Input';
import { Label } from '@/Components/UI/Label';
import { adminApi } from '@/Services/api';
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
  const [form, setForm] = useState(initialForm);

  const createMutation = useMutation({
    mutationFn: async () => adminApi.users.create(form),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      navigate(`/admin/utilisateurs/${response.data.matricule}`);
    },
  });

  return (
    <AdminUsersLayout title="Créer un utilisateur">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Créer un utilisateur</h1>
          <p className="text-sm text-sabc-gray-600">Création réelle via `POST /admin/utilisateurs`.</p>
        </div>
        <Link to="/admin/utilisateurs"><Button variant="outline">Retour</Button></Link>
      </div>

      <Card>
        <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {Object.entries(initialForm).map(([key]) => (
            <div key={key} className={key === 'manager_matricule' ? 'md:col-span-2' : ''}>
              <Label htmlFor={key}>{key}</Label>
              <Input
                id={key}
                type={key === 'password' ? 'password' : 'text'}
                value={(form as any)[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="md:col-span-2 flex justify-end gap-2">
            <Link to="/admin/utilisateurs"><Button variant="outline">Annuler</Button></Link>
            <Button
              className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark"
              disabled={!form.matricule || !form.nom || !form.prenom || !form.email || !form.password || !form.role || !form.role_nom || !form.id_region || !form.id_branche || createMutation.isPending}
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
