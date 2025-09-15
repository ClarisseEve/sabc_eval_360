import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { Input } from '@/Components/UI/Input/Input';
import { Label } from '@/Components/UI/Label/Label';

/**
 * Composant pour l'onglet de gestion des régions
 * 
 * Spécifications selon les règles métier SABC :
 * - CRUD complet pour les régions
 * - Distinction entre régions tanières et non-tanières
 * - Configuration des niveaux hiérarchiques par région
 */
const RegionsTab: React.FC = () => {
  // État pour le modal de création/édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<any>(null);
  
  // Données de démonstration pour les régions
  const regions = [
    { 
      id: '1', 
      nom: 'Littoral', 
      est_taniere: true, 
      niveaux_hierarchiques: 5,
      description: 'Région tanière incluant Douala',
      nb_utilisateurs: 24,
      nb_evaluations: 87
    },
    { 
      id: '2', 
      nom: 'Centre', 
      est_taniere: true, 
      niveaux_hierarchiques: 5,
      description: 'Région tanière incluant Yaoundé',
      nb_utilisateurs: 18,
      nb_evaluations: 65
    },
    { 
      id: '3', 
      nom: 'Ouest', 
      est_taniere: false, 
      niveaux_hierarchiques: 3,
      description: 'Région non-tanière incluant Bafoussam',
      nb_utilisateurs: 12,
      nb_evaluations: 43
    },
    { 
      id: '4', 
      nom: 'Nord', 
      est_taniere: false, 
      niveaux_hierarchiques: 3,
      description: 'Région non-tanière incluant Garoua',
      nb_utilisateurs: 10,
      nb_evaluations: 38
    }
  ];
  
  // Ouvrir le modal pour créer une nouvelle région
  const handleCreate = () => {
    setCurrentRegion(null);
    setIsModalOpen(true);
  };
  
  // Ouvrir le modal pour éditer une région existante
  const handleEdit = (region: any) => {
    setCurrentRegion(region);
    setIsModalOpen(true);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-sabc-gray-700 dark:text-sabc-gray-300">Gestion des Régions</h2>
        <Button 
          className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
          onClick={handleCreate}
        >
          Ajouter une région
        </Button>
      </div>
      
      {/* Statistiques des régions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {regions.map((region) => (
          <Card key={region.id} className={`border-l-4 ${region.est_taniere ? 'border-l-sabc-red-primary' : 'border-l-sabc-accent'}`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-sabc-gray-800 dark:text-white">{region.nom}</h3>
                <Badge className={region.est_taniere ? 'bg-sabc-red-primary text-white' : 'bg-sabc-accent text-white'}>
                  {region.est_taniere ? 'Tanière' : 'Non-tanière'}
                </Badge>
              </div>
              <p className="text-sm text-sabc-gray-600 dark:text-sabc-gray-400 mb-2">{region.description}</p>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div>
                  <p className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">Utilisateurs</p>
                  <p className="font-medium">{region.nb_utilisateurs}</p>
                </div>
                <div>
                  <p className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">Évaluations</p>
                  <p className="font-medium">{region.nb_evaluations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Tableau des régions */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des régions</CardTitle>
          <CardDescription>
            Configuration des régions et de leurs hiérarchies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Niveaux hiérarchiques</TableHead>
                <TableHead>Utilisateurs</TableHead>
                <TableHead>Évaluations</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.map((region) => (
                <TableRow key={region.id}>
                  <TableCell className="font-medium">{region.nom}</TableCell>
                  <TableCell>
                    <Badge className={region.est_taniere ? 'bg-sabc-red-primary text-white' : 'bg-sabc-accent text-white'}>
                      {region.est_taniere ? 'Tanière' : 'Non-tanière'}
                    </Badge>
                  </TableCell>
                  <TableCell>{region.niveaux_hierarchiques}</TableCell>
                  <TableCell>{region.nb_utilisateurs}</TableCell>
                  <TableCell>{region.nb_evaluations}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(region)}
                      >
                        Configurer
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-sabc-gray-500 hover:bg-sabc-gray-100"
                      >
                        Voir détails
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Modal de création/édition de région serait ici */}
    </div>
  );
};

export default RegionsTab;
