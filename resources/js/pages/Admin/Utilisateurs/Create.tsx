import React, { useMemo, useState } from 'react';
import { Head } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from '@/lib/inertia-shim';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select/Select';
import { Checkbox } from '@/Components/UI/Checkbox/Checkbox';
import { route } from '@/routes';

/**
 * Page de création d'un utilisateur pour l'administrateur
 * 
 * Spécifications selon les règles métier SABC :
 * - Formulaire de création d'utilisateur avec validation
 * - Attribution du rôle et de la région
 * - Définition du manager selon la hiérarchie
 */
interface Props {
  user: any;
  pageTitle?: string;
  isAdmin?: boolean;
  permissions?: string[];
  regions?: Array<{ id_region: string; nom_region: string; est_taniere?: boolean | null }>;
  roles?: Array<{ nom_role: string; description?: string | null }>;
  branches?: Array<{ id_branche: string; nom_branche: string }>;
}

const UserCreatePage: React.FC<Props> = ({ user, pageTitle, regions, roles, branches }) => {
  
  // État du formulaire
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    matricule: '',
    username: '',
    email: '',
    telephone: '',
    role: '',
    region: '',
    branche: '',
    manager_matricule: '',
    date_embauche: '',
    password: '',
    password_confirmation: '',
    is_active: true
  });
  
  // Données de démonstration pour les listes déroulantes
  const fallbackRoles = [
    { id: 'ADMIN', name: 'Administrateur' },
    { id: 'DR', name: 'Directeur Régional' },
    { id: 'CDTT', name: 'Chef Département Trade' },
    { id: 'CSC', name: 'Chef Service Commercial' },
    { id: 'CDV', name: 'Chef District Vente' },
    { id: 'CDS', name: 'Chef de Secteur' },
    { id: 'RTM', name: 'Regional Trade Marketing' },
    { id: 'TMO', name: 'Trade Marketing Operator' },
    { id: 'SRMO', name: 'Superviseur Régional Marketing Opérationnel' },
    { id: 'SS', name: 'Superviseur Sponsoring' },
    { id: 'AS', name: 'Assistant Superviseur Sponsoring' }
  ];
  
  const fallbackRegions = [
    { id: '1', name: 'Littoral', type: 'taniere' },
    { id: '2', name: 'Centre', type: 'taniere' },
    { id: '3', name: 'Ouest', type: 'non-taniere' },
    { id: '4', name: 'Nord', type: 'non-taniere' },
    { id: '5', name: 'Sud', type: 'non-taniere' },
    { id: '6', name: 'Est', type: 'non-taniere' },
    { id: '7', name: 'Nord-Ouest', type: 'non-taniere' },
    { id: '8', name: 'Sud-Ouest', type: 'non-taniere' }
  ];
  
  const fallbackBranches = [
    { id: '1', name: 'Commercial' },
    { id: '2', name: 'Marketing' }
  ];
  
  const managers = [
    { matricule: 'M12345', name: 'Thomas Mbarga', role: 'CDS' },
    { matricule: 'M23456', name: 'Marie Fouda', role: 'TMO' },
    { matricule: 'M34567', name: 'Jean Ekambi', role: 'CSC' },
    { matricule: 'M45678', name: 'Sophie Ndongo', role: 'RTM' },
    { matricule: 'M56789', name: 'Pierre Kamto', role: 'DR' },
    { matricule: 'M67890', name: 'Alice Ndom', role: 'CDTT' }
  ];

  const roleOptions = useMemo(() => {
    if (!roles || roles.length === 0) {
      return fallbackRoles;
    }

    return roles.map((role) => ({
      id: role.nom_role,
      name: role.description || role.nom_role,
    }));
  }, [roles]);

  const regionOptions = useMemo(() => {
    if (!regions || regions.length === 0) {
      return fallbackRegions;
    }

    return regions.map((region) => ({
      id: region.id_region,
      name: region.nom_region,
      type: region.est_taniere ? 'taniere' : 'non-taniere',
    }));
  }, [regions]);

  const branchOptions = useMemo(() => {
    if (!branches || branches.length === 0) {
      return fallbackBranches;
    }

    return branches.map((branche) => ({
      id: branche.id_branche,
      name: branche.nom_branche,
    }));
  }, [branches]);
  
  // Gérer les changements dans le formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Gérer les changements dans les sélecteurs
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Gérer la soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ici, on simulerait l'envoi des données au backend
    console.log('Données du formulaire soumises:', formData);
    // Redirection vers la liste des utilisateurs après création
  };
  
  return (
    <AppLayout
      user={user}
      pageTitle={pageTitle || 'Créer un utilisateur'}
      notifications={[]}
    >
      <Head title="Créer un utilisateur - SABC Évaluation 360°" />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Link href="/admin/utilisateurs">
            <Button variant="ghost" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Créer un nouvel utilisateur</h1>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6">
            {/* Informations personnelles */}
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>Informations de base de l'utilisateur</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input
                      id="nom"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input
                      id="prenom"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="matricule">Matricule</Label>
                    <Input
                      id="matricule"
                      name="matricule"
                      value={formData.matricule}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_embauche">Date d'embauche</Label>
                    <Input
                      id="date_embauche"
                      name="date_embauche"
                      type="date"
                      value={formData.date_embauche}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Informations de contact */}
            <Card>
              <CardHeader>
                <CardTitle>Informations de contact</CardTitle>
                <CardDescription>Coordonnées de l'utilisateur</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input
                      id="telephone"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      placeholder="+237 6XX XXX XXX"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Informations professionnelles */}
            <Card>
              <CardHeader>
                <CardTitle>Informations professionnelles</CardTitle>
                <CardDescription>Rôle et position dans l'organisation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Rôle</Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange('role', value)}
                      value={formData.role}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map(role => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Région</Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange('region', value)}
                      value={formData.region}
                    >
                      <SelectTrigger id="region">
                        <SelectValue placeholder="Sélectionner une région" />
                      </SelectTrigger>
                      <SelectContent>
                        {regionOptions.map(region => (
                          <SelectItem key={region.id} value={region.id}>
                            {region.name} ({region.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branche">Branche</Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange('branche', value)}
                      value={formData.branche}
                    >
                      <SelectTrigger id="branche">
                        <SelectValue placeholder="Sélectionner une branche" />
                      </SelectTrigger>
                      <SelectContent>
                        {branchOptions.map(branch => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manager">Manager</Label>
                    <Select 
                      onValueChange={(value) => handleSelectChange('manager_matricule', value)}
                      value={formData.manager_matricule}
                    >
                      <SelectTrigger id="manager">
                        <SelectValue placeholder="Sélectionner un manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {managers.map(manager => (
                          <SelectItem key={manager.matricule} value={manager.matricule}>
                            {manager.name} ({manager.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Informations de connexion */}
            <Card>
              <CardHeader>
                <CardTitle>Informations de connexion</CardTitle>
                <CardDescription>Identifiants de connexion</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Nom d'utilisateur</Label>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Confirmer le mot de passe</Label>
                    <Input
                      id="password_confirmation"
                      name="password_confirmation"
                      type="password"
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox 
                      id="is_active" 
                      checked={formData.is_active}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, is_active: checked === true }))
                      }
                    />
                    <Label htmlFor="is_active">Compte actif</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Boutons d'action */}
            <div className="flex justify-end space-x-2">
              <Link href="/admin/utilisateurs">
                <Button variant="outline">Annuler</Button>
              </Link>
              <Button type="submit" className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white">
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default UserCreatePage;
