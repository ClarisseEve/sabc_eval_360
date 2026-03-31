import React, { useState } from 'react';
import { Head } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';
import { route } from '@/routes';

/**
 * Page de gestion des rôles pour l'administrateur
 * 
 * Spécifications selon les règles métier SABC :
 * - Structure hiérarchique respectant les règles métier SABC
 * - Distinction entre rôles commerciaux et marketing
 * - Rôles DR et CDTT supervisant les deux branches
 */
interface Role {
  id: string;
  nom: string;
  description: string;
  niveau_hierarchique: number;
  categorie: string | null;
  nb_utilisateurs: number;
}

interface RolesAdminPageProps {
  auth: {
    user: {
      name: string;
      email: string;
      role: string;
      avatar?: string;
    }
  };
  roles?: Role[];
}

const RolesAdminPage: React.FC<RolesAdminPageProps> = ({ auth, roles: initialRoles }) => {
  // État pour le modal de création/édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Données de démonstration pour les rôles si non fournies par les props
  const roles = initialRoles || [
    { id: '1', nom: 'ADMIN', description: 'Administrateur système', niveau_hierarchique: 0, categorie: 'Administration', nb_utilisateurs: 2 },
    { id: '2', nom: 'DR', description: 'Directeur Régional', niveau_hierarchique: 1, categorie: null, nb_utilisateurs: 4 },
    { id: '3', nom: 'CDTT', description: 'Chef Département Trade', niveau_hierarchique: 2, categorie: null, nb_utilisateurs: 4 },
    { id: '4', nom: 'CSC', description: 'Chef Service Commercial', niveau_hierarchique: 3, categorie: 'Commercial', nb_utilisateurs: 8 },
    { id: '5', nom: 'CDV', description: 'Chef District Vente', niveau_hierarchique: 4, categorie: 'Commercial', nb_utilisateurs: 12 },
    { id: '6', nom: 'CDS', description: 'Chef de Secteur', niveau_hierarchique: 5, categorie: 'Commercial', nb_utilisateurs: 18 },
    { id: '7', nom: 'RTM', description: 'Regional Trade Marketing', niveau_hierarchique: 3, categorie: 'Marketing', nb_utilisateurs: 4 },
    { id: '8', nom: 'SRMO', description: 'Superviseur Regional Marketing Operation', niveau_hierarchique: 3, categorie: 'Marketing', nb_utilisateurs: 4 },
    { id: '9', nom: 'TMO', description: 'Trade Marketing Operator', niveau_hierarchique: 4, categorie: 'Marketing', nb_utilisateurs: 8 },
    { id: '10', nom: 'SS', description: 'Superviseur Sponsoring', niveau_hierarchique: 4, categorie: 'Marketing', nb_utilisateurs: 4 },
    { id: '11', nom: 'AS', description: 'Assistant Superviseur Sponsoring', niveau_hierarchique: 5, categorie: 'Marketing', nb_utilisateurs: 6 },
  ];
  
  // Filtrer les rôles en fonction du terme de recherche
  const filteredRoles = roles.filter(role => 
    role.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.categorie && role.categorie.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Ouvrir le modal pour créer un nouveau rôle
  const handleCreate = () => {
    setCurrentRole(null);
    setIsModalOpen(true);
  };
  
  // Ouvrir le modal pour éditer un rôle existant
  const handleEdit = (role: Role) => {
    setCurrentRole(role);
    setIsModalOpen(true);
  };
  
  // Obtenir la couleur de badge pour la catégorie
  const getCategoryBadgeColor = (categorie: string | null) => {
    if (categorie === 'Commercial') return 'bg-sabc-red-primary';
    if (categorie === 'Marketing') return 'bg-sabc-accent';
    if (categorie === 'Administration') return 'bg-sabc-info';
    return 'bg-sabc-gray-400'; // Pour les rôles sans catégorie (DR, CDTT)
  };
  
  return (
    <AppLayout
      user={auth.user}
      notifications={[]}
    >
      <Head title="Gestion des Rôles - SABC Évaluation 360°" />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-sabc-gray-900">Gestion des Rôles</h1>
          <Button 
            className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
            onClick={handleCreate}
          >
            Ajouter un rôle
          </Button>
        </div>
        
        {/* Visualisation de la hiérarchie */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Hiérarchie Organisationnelle SABC</CardTitle>
            <CardDescription>
              Structure hiérarchique selon les règles métier SABC
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              {/* Niveau 1 - DR */}
              <div className="flex justify-center">
                <div className="bg-sabc-gray-100 border border-sabc-gray-200 rounded-md p-3 text-center w-48">
                  <div className="font-bold">DR</div>
                  <div className="text-xs text-sabc-gray-400">Niveau 1</div>
                  <Badge className="mt-1 bg-sabc-gray-400">Supervision Duale</Badge>
                </div>
              </div>
              
              {/* Flèche */}
              <div className="flex justify-center">
                <div className="h-6 w-0.5 bg-sabc-gray-400"></div>
              </div>
              
              {/* Niveau 2 - CDTT */}
              <div className="flex justify-center">
                <div className="bg-sabc-gray-100 border border-sabc-gray-200 rounded-md p-3 text-center w-48">
                  <div className="font-bold">CDTT</div>
                  <div className="text-xs text-sabc-gray-400">Niveau 2</div>
                  <Badge className="mt-1 bg-sabc-gray-400">Supervision Duale</Badge>
                </div>
              </div>
              
              {/* Flèche avec bifurcation */}
              <div className="flex justify-center">
                <div className="relative h-6 w-64">
                  <div className="absolute left-1/2 h-3 w-0.5 bg-sabc-gray-400 -translate-x-1/2"></div>
                  <div className="absolute top-3 w-full h-0.5 bg-sabc-gray-400"></div>
                  <div className="absolute left-0 top-3 h-3 w-0.5 bg-sabc-gray-400"></div>
                  <div className="absolute right-0 top-3 h-3 w-0.5 bg-sabc-gray-400"></div>
                </div>
              </div>
              
              {/* Niveau 3 - CSC et RTM/SRMO */}
              <div className="flex justify-center gap-16">
                <div className="bg-sabc-red-light border border-sabc-red-primary rounded-md p-3 text-center w-48">
                  <div className="font-bold">CSC</div>
                  <div className="text-xs text-sabc-gray-400">Niveau 3</div>
                  <Badge className="mt-1 bg-sabc-red-primary">Commercial</Badge>
                </div>
                <div className="bg-sabc-accent-light border border-sabc-accent rounded-md p-3 text-center w-48">
                  <div className="font-bold">RTM / SRMO</div>
                  <div className="text-xs text-sabc-gray-400">Niveau 3</div>
                  <Badge className="mt-1 bg-sabc-accent">Marketing</Badge>
                </div>
              </div>
              
              {/* Flèches */}
              <div className="flex justify-center gap-16">
                <div className="h-6 w-0.5 bg-sabc-red-primary"></div>
                <div className="h-6 w-0.5 bg-sabc-accent"></div>
              </div>
              
              {/* Niveau 4 - CDV et TMO/SS */}
              <div className="flex justify-center gap-16">
                <div className="bg-sabc-red-light border border-sabc-red-primary rounded-md p-3 text-center w-48">
                  <div className="font-bold">CDV</div>
                  <div className="text-xs text-sabc-gray-400">Niveau 4</div>
                  <Badge className="mt-1 bg-sabc-red-primary">Commercial</Badge>
                </div>
                <div className="bg-sabc-accent-light border border-sabc-accent rounded-md p-3 text-center w-48">
                  <div className="font-bold">TMO / SS</div>
                  <div className="text-xs text-sabc-gray-400">Niveau 4</div>
                  <Badge className="mt-1 bg-sabc-accent">Marketing</Badge>
                </div>
              </div>
              
              {/* Flèches */}
              <div className="flex justify-center gap-16">
                <div className="h-6 w-0.5 bg-sabc-red-primary"></div>
                <div className="h-6 w-0.5 bg-sabc-accent"></div>
              </div>
              
              {/* Niveau 5 - CDS et AS */}
              <div className="flex justify-center gap-16">
                <div className="bg-sabc-red-light border border-sabc-red-primary rounded-md p-3 text-center w-48">
                  <div className="font-bold">CDS</div>
                  <div className="text-xs text-sabc-gray-400">Niveau 5</div>
                  <Badge className="mt-1 bg-sabc-red-primary">Commercial</Badge>
                </div>
                <div className="bg-sabc-accent-light border border-sabc-accent rounded-md p-3 text-center w-48">
                  <div className="font-bold">AS</div>
                  <div className="text-xs text-sabc-gray-400">Niveau 5</div>
                  <Badge className="mt-1 bg-sabc-accent">Marketing</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Barre de recherche */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Rechercher</Label>
                <Input
                  id="search"
                  placeholder="Rechercher par nom, description, catégorie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline">Filtrer</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tableau des rôles */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des rôles</CardTitle>
            <CardDescription>
              {filteredRoles.length} rôle{filteredRoles.length > 1 ? 's' : ''} trouvé{filteredRoles.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Niveau hiérarchique</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Utilisateurs</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.nom}</TableCell>
                    <TableCell>{role.description}</TableCell>
                    <TableCell>{role.niveau_hierarchique}</TableCell>
                    <TableCell>
                      {role.categorie ? (
                        <Badge className={getCategoryBadgeColor(role.categorie)}>
                          {role.categorie}
                        </Badge>
                      ) : (
                        <Badge className="bg-sabc-gray-400">Supervision Duale</Badge>
                      )}
                    </TableCell>
                    <TableCell>{role.nb_utilisateurs}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(role)}
                        >
                          Éditer
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-sabc-error hover:bg-sabc-error/10"
                          disabled={role.nb_utilisateurs > 0}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Modal de création/édition de rôle serait ici */}
      </div>
    </AppLayout>
  );
};

export default RolesAdminPage;
