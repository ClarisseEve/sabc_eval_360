import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { Input } from '@/Components/UI/Input/Input';
import { SearchFilter } from '@/Components/UI/SearchFilter';
import { Link } from '@inertiajs/react';

import { useAuth } from '@/Hooks/useAuth';
import { RoleGuard } from '@/Components/Auth/RoleGuard';
/**
 * Page de gestion des templates d'évaluation pour l'administrateur
 * 
 * Spécifications selon les règles métier SABC :
 * - Templates d'évaluation par catégorie (Commercial/Marketing)
 * - Sections et compétences configurables
 * - Minimum 5 compétences par template
 */
const TemplatesAdminPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  
  // Gestion des changements de filtres
  const handleFilterChange = (filterId: string, values: string[]) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterId]: values
    }));
  };
  
  // Filtres pour les templates
  const templateFilters = [
    {
      id: 'categorie',
      label: 'Catégorie',
      options: [
        { value: 'commercial', label: 'Commercial' },
        { value: 'marketing', label: 'Marketing' },
      ],
      isMulti: true,
    },
    {
      id: 'statut',
      label: 'Statut',
      options: [
        { value: 'actif', label: 'Actif' },
        { value: 'inactif', label: 'Inactif' },
      ],
      isMulti: false,
    },
  ];
  
  // Données de démonstration pour les templates
  const templates = [
    { 
      id: '1', 
      titre: 'Évaluation Commerciale Standard', 
      categorie: 'Commercial',
      version: '2.1',
      date_creation: '2023-01-15',
      date_modification: '2023-05-20',
      nb_sections: 4,
      nb_competences: 12,
      est_actif: true
    },
    { 
      id: '2', 
      titre: 'Évaluation Marketing Opérationnel', 
      categorie: 'Marketing',
      version: '1.3',
      date_creation: '2023-02-10',
      date_modification: '2023-04-05',
      nb_sections: 3,
      nb_competences: 9,
      est_actif: true
    },
    { 
      id: '3', 
      titre: 'Évaluation Management Commercial', 
      categorie: 'Commercial',
      version: '1.0',
      date_creation: '2023-03-22',
      date_modification: '2023-03-22',
      nb_sections: 5,
      nb_competences: 15,
      est_actif: false
    },
  ];
  
  // Authentification
  const { user, isLoading } = useAuth();

  // Indicateur de chargement pendant la récupération de l'utilisateur
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sabc-red-primary"></div>
      </div>
    );
  }

  // Adapter l'utilisateur au format attendu par AppLayout
  const adaptedUser = user ? {
    name: `${user.prenom} ${user.nom}`,
    email: user.email,
    role: user.role_nom,
    avatar: user.avatar
  } : {
    name: 'Utilisateur',
    email: 'utilisateur@sabc.cm',
    role: 'Invité'
  };
  
  return (
    <RoleGuard allowed={["ADMIN"]} userRoleName={user?.role_nom}>
      <AppLayout user={adaptedUser}>
      <Head title="Gestion des Templates d'Évaluation | SABC Eval360" />
      
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-sabc-gray-900">Templates d'Évaluation</h1>
          <Link href="/admin/evaluation/templates/create">
            <Button className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white">
              Créer un template
            </Button>
          </Link>
        </div>
        
        {/* Filtres et recherche */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Rechercher un template..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {templateFilters.map((filter) => (
              <SearchFilter
                key={filter.id}
                id={filter.id}
                label={filter.label}
                options={filter.options}
                isMulti={filter.isMulti}
                onChange={(values) => handleFilterChange(filter.id, values)}
              />
            ))}
          </div>
        </div>
        
        {/* Liste des templates */}
        <Card>
          <CardHeader>
            <CardTitle>Templates d'évaluation</CardTitle>
            <CardDescription>
              Gérez les templates utilisés pour les différents types d'évaluation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Sections</TableHead>
                  <TableHead>Compétences</TableHead>
                  <TableHead>Dernière modification</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.titre}</TableCell>
                    <TableCell>
                      <Badge
                        className={template.categorie === 'Commercial' ? 'bg-sabc-red-primary' : 'bg-sabc-info'}
                      >
                        {template.categorie}
                      </Badge>
                    </TableCell>
                    <TableCell>{template.version}</TableCell>
                    <TableCell>{template.nb_sections}</TableCell>
                    <TableCell>{template.nb_competences}</TableCell>
                    <TableCell>{template.date_modification}</TableCell>
                    <TableCell>
                      <Badge
                        className={template.est_actif ? 'bg-sabc-success' : 'bg-sabc-gray-400'}
                      >
                        {template.est_actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Link href={`/admin/evaluation/templates/${template.id}/edit`}>
                          <Button variant="outline" size="sm">
                            Modifier
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={template.est_actif ? 'text-sabc-error border-sabc-error' : 'text-sabc-success border-sabc-success'}
                        >
                          {template.est_actif ? 'Désactiver' : 'Activer'}
                        </Button>
                        <Button variant="outline" size="sm">
                          Dupliquer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Règles de conception des templates */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Règles de conception des templates</CardTitle>
            <CardDescription>
              Selon les règles métier SABC
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md p-4">
                <h3 className="font-semibold mb-2">Structure des templates</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Minimum 5 compétences par template</li>
                  <li>Regroupement par sections thématiques</li>
                  <li>Possibilité d'activer/désactiver des compétences</li>
                  <li>Notation de 1 à 5 obligatoire</li>
                </ul>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-semibold mb-2">Types de templates</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Templates spécifiques par catégorie (Commercial/Marketing)</li>
                  <li>Templates adaptés aux niveaux hiérarchiques</li>
                  <li>Versions différentes pour suivre l'évolution</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </AppLayout>
    </RoleGuard>
  );
};

export default TemplatesAdminPage;
