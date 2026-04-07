import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/Components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Input } from '@/Components/UI/Input';
import { Label } from '@/Components/UI/Label';
import { adminApi } from '@/Services/api';
import { useAdminUser } from '@/Hooks/queries';
import { AdminUsersLayout } from './shared';

export default function EditUser() {
  const { matricule = '' } = useParams();
  const { data } = useAdminUser(matricule);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState<any>({
    nom: data?.nom || '',
    prenom: data?.prenom || '',
    email: data?.email || '',
    telephone: data?.telephone || '',
    role: data?.role || '',
    id_region: data?.id_region || '',
    id_branche: data?.id_branche || '',
    manager_matricule: data?.manager_matricule || '',
    statut: data?.statut || '',
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

  const updateMutation = useMutation({
    mutationFn: async () => adminApi.users.update(matricule, form),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users', matricule] });
      navigate(`/admin/utilisateurs/${matricule}`);
    },
  });

  return (
    <AdminUsersLayout title={`Modifier ${matricule}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Modifier {matricule}</h1>
          <p className="text-sm text-sabc-gray-600">Mise à jour réelle via `PUT /admin/utilisateurs/:matricule`.</p>
        </div>
        <Link to={`/admin/utilisateurs/${matricule}`}><Button variant="outline">Retour</Button></Link>
      </div>

      <Card>
        <CardHeader><CardTitle>Informations éditables</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {Object.entries(form).map(([key, value]) => (
            <div key={key}>
              <Label htmlFor={key}>{key}</Label>
              <Input id={key} value={String(value ?? '')} onChange={(e) => setForm((prev: any) => ({ ...prev, [key]: e.target.value }))} />
            </div>
          ))}
          <div className="md:col-span-2 flex justify-end gap-2">
            <Link to={`/admin/utilisateurs/${matricule}`}><Button variant="outline">Annuler</Button></Link>
            <Button className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark" onClick={() => updateMutation.mutate()}>
              {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AdminUsersLayout>
  );
}
