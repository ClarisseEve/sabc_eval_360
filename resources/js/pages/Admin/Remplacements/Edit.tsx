import React, { useState, FormEvent } from 'react';
import { Head } from '@/lib/inertia-shim';
import { useForm } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardHeader, CardContent, CardFooter } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Label } from '@/Components/UI/Label/Label';
import { Input } from '@/Components/UI/Input/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select/Select';
import { Textarea } from '@/Components/UI/Textarea/Textarea';

/**
 * Page d'édition d'un remplacement temporaire existant
 */
interface Utilisateur {
  id: number;
  matricule: string;
  nom: string;
  prenom?: string;
  role: string;
}

interface Role {
  id: number;
  nom: string;
  description: string;
}

interface EditProps {
  remplacement?: {
    id: number;
    remplacant_id: number;
    remplace_id: number;
    role_id: number;
    date_debut: string;
    date_fin: string;
    motif: string;
    statut: string;
  };
  utilisateurs: Utilisateur[];
  roles: Role[];
  auth: {
    user: {
      name: string;
      email: string;
      role: string;
      avatar?: string;
    }
  };
}

export default function Edit({ remplacement, utilisateurs = [], roles = [], auth }: EditProps) {
  // Données de démonstration pour le remplacement
  const replacementData = remplacement || {
    id: 1,
    remplacant_id: 1,
    remplace_id: 2,
    role_id: 4,
    date_debut: '2025-06-01',
    date_fin: '2025-06-30',
    motif: 'Congé maladie',
    statut: 'actif'
  };
  
  // Données de démonstration pour les utilisateurs et les rôles
  const usersData = utilisateurs.length > 0 ? utilisateurs : [
    { id: 1, nom: 'Jean Dupont', matricule: 'EMP001', role: 'CDV' },
    { id: 2, nom: 'Marie Martin', matricule: 'EMP002', role: 'CDS' },
    { id: 3, nom: 'Paul Dubois', matricule: 'EMP003', role: 'TMO' },
    { id: 4, nom: 'Sophie Leroy', matricule: 'EMP004', role: 'CDS' },
    { id: 5, nom: 'Thomas Bernard', matricule: 'EMP005', role: 'CDV' },
  ];
  
  const rolesData = roles.length > 0 ? roles : [
    { id: 1, nom: 'DR', description: 'Directeur Régional' },
    { id: 2, nom: 'CDTT', description: 'Chef Département Trade' },
    { id: 3, nom: 'CSC', description: 'Chef Service Commercial' },
    { id: 4, nom: 'CDV', description: 'Chef District Vente' },
    { id: 5, nom: 'CDS', description: 'Chef de Secteur' },
    { id: 6, nom: 'RTM', description: 'Regional Trade Marketing' },
    { id: 7, nom: 'TMO', description: 'Trade Marketing Operator' },
    { id: 8, nom: 'SRMO', description: 'Superviseur Régional Marketing Opérationnel' },
    { id: 9, nom: 'SS', description: 'Superviseur Sponsoring' },
    { id: 10, nom: 'AS', description: 'Assistant Superviseur Sponsoring' },
  ];

  const { data, setData, put, processing, errors } = useForm<{
    remplacant_id: string;
    remplace_id: string;
    role_id: string;
    date_debut: string;
    date_fin: string;
    motif: string;
  }>({
    remplacant_id: replacementData.remplacant_id.toString(),
    remplace_id: replacementData.remplace_id.toString(),
    role_id: replacementData.role_id.toString(),
    date_debut: replacementData.date_debut,
    date_fin: replacementData.date_fin,
    motif: replacementData.motif,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    put(`/admin/remplacements/${replacementData.id}`);
  };

  return (
    <AppLayout user={auth.user}>
      <Head title="Modifier un Remplacement" />
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Modifier un Remplacement</h1>
          
          <div className="mt-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium">Informations du remplacement</h2>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="remplacant_id">Remplaçant</Label>
                      <Select value={data.remplacant_id} onValueChange={(value) => setData('remplacant_id', value)}>
                        <SelectTrigger id="remplacant_id" className="mt-1 w-full">
                          <SelectValue placeholder="Sélectionner un remplaçant" />
                        </SelectTrigger>
                        <SelectContent>
                          {usersData.map((user) => (
                            <SelectItem key={user.id} value={String(user.id)}>
                              {user.nom} ({user.matricule}) - {user.role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.remplacant_id && <p className="mt-2 text-sm text-sabc-error">{errors.remplacant_id}</p>}
                    </div>
                    
                    <div>
                      <Label htmlFor="remplace_id">Remplacé</Label>
                      <Select value={data.remplace_id} onValueChange={(value) => setData('remplace_id', value)}>
                        <SelectTrigger id="remplace_id" className="mt-1 w-full">
                          <SelectValue placeholder="Sélectionner un remplacé" />
                        </SelectTrigger>
                        <SelectContent>
                          {usersData.map((user) => (
                            <SelectItem key={user.id} value={String(user.id)}>
                              {user.nom} ({user.matricule}) - {user.role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.remplace_id && <p className="mt-2 text-sm text-sabc-error">{errors.remplace_id}</p>}
                    </div>
                    
                    <div>
                      <Label htmlFor="role_id">Rôle temporaire</Label>
                      <Select value={data.role_id} onValueChange={(value) => setData('role_id', value)}>
                        <SelectTrigger id="role_id" className="mt-1 w-full">
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          {rolesData.map((role) => (
                            <SelectItem key={role.id} value={String(role.id)}>
                              {role.nom} - {role.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.role_id && <p className="mt-2 text-sm text-sabc-error">{errors.role_id}</p>}
                    </div>
                    
                    <div>
                      <Label htmlFor="date_debut">Date de début</Label>
                      <Input
                        id="date_debut"
                        type="date"
                        name="date_debut"
                        value={data.date_debut}
                        onChange={(e) => setData('date_debut', e.target.value)}
                        className="mt-1 w-full"
                        required
                        error={errors.date_debut}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="date_fin">Date de fin</Label>
                      <Input
                        id="date_fin"
                        type="date"
                        name="date_fin"
                        value={data.date_fin}
                        onChange={(e) => setData('date_fin', e.target.value)}
                        className="mt-1 w-full"
                        required
                        error={errors.date_fin}
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label htmlFor="motif">Motif du remplacement</Label>
                      <Textarea
                        id="motif"
                        name="motif"
                        value={data.motif}
                        onChange={(e) => setData('motif', e.target.value)}
                        className="mt-1 w-full"
                        rows={3}
                        required
                      />
                      {errors.motif && <p className="mt-2 text-sm text-sabc-error">{errors.motif}</p>}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end space-x-3">
                    <Button
                      onClick={() => window.location.href = '/admin/remplacements'}
                      variant="secondary"
                      disabled={processing}
                      type="button"
                    >
                      Annuler
                    </Button>
                    <Button type="submit" variant="default" disabled={processing}>
                      Mettre à jour
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
