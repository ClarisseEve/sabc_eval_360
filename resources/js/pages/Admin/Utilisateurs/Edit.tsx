import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select/Select';
import { Checkbox } from '@/Components/UI/Checkbox/Checkbox';
import { route } from '@/routes';

/**
 * Page d'édition d'un utilisateur pour l'administrateur
 * 
 * Spécifications selon les règles métier SABC :
 * - Formulaire d'édition d'utilisateur avec validation
 * - Modification du rôle et de la région
 * - Modification du manager selon la hiérarchie
 */
interface UserEditPageProps {
  auth: {
    user: {
      name: string;
      email: string;
      role: string;
      avatar?: string;
    }
  };
  user?: {
    id: string;
    nom: string;
    prenom: string;
    matricule: string;
    username: string;
    email: string;
    telephone: string;
    role: string;
    region: string;
    branche: string;
    manager_matricule: string;
    date_embauche: string;
    is_active: boolean;
  };
}

const UserEditPage: React.FC<UserEditPageProps> = ({ auth, user: initialUser }) => {
  // Données de démonstration pour l'utilisateur à éditer si non fourni par les props
  const initialUserData = initialUser || {
    id: '2',
    nom: 'Fouda',
    prenom: 'Marie',
    matricule: 'M23456',
    username: 'mfouda',
    email: 'marie.fouda@sabc.cm',
    telephone: '+237 699 123 456',
    role: 'TMO',
    region: '2', // Centre
    branche: '2', // Marketing
    manager_matricule: 'M45678',
    date_embauche: '2020-03-15',
    is_active: true
  };
  
  // État du formulaire
  const [formData, setFormData] = useState(initialUserData);
  
  // Données de démonstration pour les listes déroulantes
  const roles = [
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
  
  const regions = [
    { id: '1', name: 'Littoral', type: 'taniere' },
    { id: '2', name: 'Centre', type: 'taniere' },
    { id: '3', name: 'Ouest', type: 'non-taniere' },
    { id: '4', name: 'Nord', type: 'non-taniere' },
    { id: '5', name: 'Sud', type: 'non-taniere' },
    { id: '6', name: 'Est', type: 'non-taniere' },
    { id: '7', name: 'Nord-Ouest', type: 'non-taniere' },
    { id: '8', name: 'Sud-Ouest', type: 'non-taniere' }
  ];
  
  const branches = [
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
    // Redirection vers la liste des utilisateurs après modification
  };
  
  return (
    <AppLayout
      user={auth.user}
      notifications={[]}
    >
      <Head title={`Modifier l'utilisateur: ${formData.prenom} ${formData.nom} - SABC Évaluation 360°`} />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Link href={`/admin/users/${formData.id}`}>
            <Button variant="ghost" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Modifier l'utilisateur</h1>
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
                      disabled
                    />
                    <p className="text-xs text-sabc-gray-400">Le matricule ne peut pas être modifié</p>
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
                        {roles.map(role => (
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
                        {regions.map(region => (
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
                        {branches.map(branch => (
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
                    <Label htmlFor="password">Nouveau mot de passe (optionnel)</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      onChange={handleChange}
                      placeholder="Laisser vide pour ne pas modifier"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Confirmer le mot de passe</Label>
                    <Input
                      id="password_confirmation"
                      name="password_confirmation"
                      type="password"
                      onChange={handleChange}
                      placeholder="Laisser vide pour ne pas modifier"
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
              <Link href={route('admin.users.show', { id: formData.id })}>
                <Button variant="outline">Annuler</Button>
              </Link>
              <Button type="submit" className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white">
                <Save className="h-4 w-4 mr-2" />
                Enregistrer les modifications
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default UserEditPage;
