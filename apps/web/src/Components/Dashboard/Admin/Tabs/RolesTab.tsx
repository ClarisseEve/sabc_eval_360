import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { TruncatedList, TruncatedTableBody } from '@/Components/UI/TruncatedList/TruncatedList';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';

/**
 * Composant pour l'onglet de gestion des rôles
 * 
 * Spécifications selon les règles métier SABC :
 * - Gestion des rôles hiérarchiques
 * - Configuration des permissions d'évaluation 360°
 * - Distinction entre rôles commerciaux et marketing
 */
const RolesTab: React.FC = () => {
  // État pour le modal de création/édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<any>(null);
  
  // Données de démonstration pour les rôles
  const roles = [
    { id: '1', nom: 'DR', description: 'Directeur Régional', niveau: 1, categorie: null },
    { id: '2', nom: 'CDTT', description: 'Chef Département Trade', niveau: 2, categorie: null },
    { id: '3', nom: 'CSC', description: 'Chef Service Commercial', niveau: 3, categorie: 'Commercial' },
    { id: '4', nom: 'CDV', description: 'Chef District Vente', niveau: 4, categorie: 'Commercial' },
    { id: '5', nom: 'CDS', description: 'Chef de Secteur', niveau: 5, categorie: 'Commercial' },
    { id: '6', nom: 'RTM', description: 'Regional Trade Marketing', niveau: 3, categorie: 'Marketing' },
    { id: '7', nom: 'SRMO', description: 'Superviseur Regional Marketing Operation', niveau: 3, categorie: 'Marketing' },
    { id: '8', nom: 'TMO', description: 'Trade Marketing Operator', niveau: 4, categorie: 'Marketing' },
    { id: '9', nom: 'SS', description: 'Superviseur Sponsoring', niveau: 4, categorie: 'Marketing' },
    { id: '10', nom: 'AS', description: 'Assistant Superviseur Sponsoring', niveau: 5, categorie: 'Marketing' },
  ];
  
  // Ouvrir le modal pour créer un nouveau rôle
  const handleCreate = () => {
    setCurrentRole(null);
    setIsModalOpen(true);
  };
  
  // Ouvrir le modal pour éditer un rôle existant
  const handleEdit = (role: any) => {
    setCurrentRole(role);
    setIsModalOpen(true);
  };
  
  // Filtrer les rôles par catégorie
  const commercialRoles = roles.filter(role => role.categorie === 'Commercial' || role.categorie === null);
  const marketingRoles = roles.filter(role => role.categorie === 'Marketing' || role.categorie === null);
  
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-sabc-gray-700 dark:text-sabc-gray-300">Gestion des Rôles</h2>
        <Button 
          className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
          onClick={handleCreate}
        >
          Ajouter un rôle
        </Button>
      </div>
      
      {/* Hiérarchie des rôles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Rôles commerciaux */}
        <Card>
          <CardHeader>
            <CardTitle>Hiérarchie Commerciale</CardTitle>
            <CardDescription>
              Structure hiérarchique des rôles commerciaux
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TruncatedList
              items={commercialRoles.sort((a, b) => a.niveau - b.niveau)}
              previewCount={6}
              keyExtractor={(role) => role.id}
              modalTitle="Hiérarchie Commerciale"
              modalDescription={`${commercialRoles.length} rôle(s)`}
              className="space-y-4"
              modalClassName="space-y-4"
              renderItem={(role) => (
                <div className="flex items-center p-2 border-l-4 border-sabc-red-primary pl-4">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="font-medium">{role.nom}</h3>
                      <Badge className="ml-2 bg-sabc-red-primary text-white">Niveau {role.niveau}</Badge>
                    </div>
                    <p className="text-sm text-sabc-gray-600 dark:text-sabc-gray-400">{role.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(role)}
                  >
                    Configurer
                  </Button>
                </div>
              )}
            />
          </CardContent>
        </Card>
        
        {/* Rôles marketing */}
        <Card>
          <CardHeader>
            <CardTitle>Hiérarchie Marketing</CardTitle>
            <CardDescription>
              Structure hiérarchique des rôles marketing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TruncatedList
              items={marketingRoles.sort((a, b) => a.niveau - b.niveau)}
              previewCount={6}
              keyExtractor={(role) => role.id}
              modalTitle="Hiérarchie Marketing"
              modalDescription={`${marketingRoles.length} rôle(s)`}
              className="space-y-4"
              modalClassName="space-y-4"
              renderItem={(role) => (
                <div className="flex items-center p-2 border-l-4 border-sabc-accent pl-4">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="font-medium">{role.nom}</h3>
                      <Badge className="ml-2 bg-sabc-accent text-white">Niveau {role.niveau}</Badge>
                    </div>
                    <p className="text-sm text-sabc-gray-600 dark:text-sabc-gray-400">{role.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(role)}
                  >
                    Configurer
                  </Button>
                </div>
              )}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Matrice des permissions d'évaluation */}
      <Card>
        <CardHeader>
          <CardTitle>Matrice des Permissions d'Évaluation</CardTitle>
          <CardDescription>
            Configuration des types d'évaluation autorisés par rôle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rôle</TableHead>
                <TableHead>Auto-évaluation</TableHead>
                <TableHead>Évaluation des pairs</TableHead>
                <TableHead>Évaluation descendante</TableHead>
                <TableHead>Cross-Branch</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TruncatedTableBody
                items={roles}
                previewCount={10}
                colSpan={6}
                keyExtractor={(role) => role.id}
                renderRow={(role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.nom}</TableCell>
                    <TableCell>
                      <Badge className={role.nom === 'DR' || role.nom === 'CDTT' ? 'bg-sabc-error text-white' : 'bg-sabc-success text-white'}>
                        {role.nom === 'DR' || role.nom === 'CDTT' ? '❌' : '✅'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={role.nom === 'DR' || role.nom === 'CDTT' ? 'bg-sabc-error text-white' : 'bg-sabc-success text-white'}>
                        {role.nom === 'DR' || role.nom === 'CDTT' ? '❌' : '✅'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-sabc-success text-white">✅</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={role.nom === 'DR' || role.nom === 'CDTT' ? 'bg-sabc-success text-white' : 'bg-sabc-error text-white'}>
                        {role.nom === 'DR' || role.nom === 'CDTT' ? '✅' : '❌'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(role)}
                      >
                        Modifier
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              />
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Modal de création/édition de rôle serait ici */}
    </div>
  );
};

export default RolesTab;
