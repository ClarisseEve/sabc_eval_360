import React, { useState } from 'react';
import { Head, Link } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { TruncatedTableBody } from '@/Components/UI/TruncatedList/TruncatedList';
import { SearchFilter } from '@/Components/UI/SearchFilter';

/**
 * Page de gestion des évaluations pour l'administrateur
 * 
 * Spécifications selon les règles métier SABC :
 * - Workflow des évaluations (Brouillon, Soumis, Validé, Rejeté)
 * - Types d'évaluation autorisés (Auto, Pairs, Descendante)
 * - Règles de validation métier
 */
const EvaluationsAdminPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  
  // Gestion des changements de filtres
  const handleFilterChange = (filterId: string, values: string[]) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterId]: values
    }));
  };
  
  // Filtres pour les évaluations selon les règles métier SABC
  const evaluationFilters = [
    {
      id: 'type',
      label: 'Type',
      options: [
        { value: 'auto', label: 'Auto-évaluation' },
        { value: 'peer', label: 'Évaluation par les pairs' },
        { value: 'manager', label: 'Évaluation descendante' },
      ],
      isMulti: true,
    },
    {
      id: 'status',
      label: 'Statut',
      options: [
        { value: 'draft', label: 'Brouillon' },
        { value: 'submitted', label: 'Soumis' },
        { value: 'validated', label: 'Validé' },
        { value: 'rejected', label: 'Rejeté' },
      ],
      isMulti: true,
    },
    {
      id: 'region',
      label: 'Région',
      options: [
        { value: 'littoral', label: 'Littoral (Tanière)' },
        { value: 'centre', label: 'Centre (Tanière)' },
        { value: 'ouest', label: 'Ouest (Non-Tanière)' },
        { value: 'nord', label: 'Nord (Non-Tanière)' },
      ],
      isMulti: true,
    },
    {
      id: 'branch',
      label: 'Branche',
      options: [
        { value: 'commercial', label: 'Commercial' },
        { value: 'marketing', label: 'Marketing' },
      ],
      isMulti: true,
    },
    {
      id: 'period',
      label: 'Période',
      options: [
        { value: 'current', label: 'Période actuelle' },
        { value: 'previous', label: 'Période précédente' },
        { value: 'all', label: 'Toutes les périodes' },
      ],
      isMulti: false,
    },
  ];
  // État pour le modal de détail
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Simuler un utilisateur administrateur pour la démo
  const mockUser = {
    name: 'Admin SABC',
    email: 'admin@sabc.cm',
    role: 'ADMIN',
    avatar: undefined
  };
  
  // Données de démonstration pour les évaluations
  const evaluations = [
    { 
      id: '1', 
      evaluateur: 'Thomas Mbarga', 
      role_evaluateur: 'CDS',
      evalue: 'Jean Ekambi', 
      role_evalue: 'CSC',
      type: 'descendante', 
      region: 'Littoral',
      categorie: 'Commercial',
      date_creation: '2023-06-01',
      date_soumission: '2023-06-05',
      date_validation: '2023-06-07',
      statut: 'validé',
      score_moyen: 4.2,
      competences_evaluees: 5,
      commentaires: true
    },
    { 
      id: '2', 
      evaluateur: 'Marie Fouda', 
      role_evaluateur: 'TMO',
      evalue: 'Sophie Ndongo', 
      role_evalue: 'RTM',
      type: 'descendante', 
      region: 'Centre',
      categorie: 'Marketing',
      date_creation: '2023-06-02',
      date_soumission: '2023-06-06',
      date_validation: null,
      statut: 'soumis',
      score_moyen: 3.8,
      competences_evaluees: 5,
      commentaires: true
    },
    { 
      id: '3', 
      evaluateur: 'Jean Ekambi', 
      role_evaluateur: 'CSC',
      evalue: 'Jean Ekambi', 
      role_evalue: 'CSC',
      type: 'auto', 
      region: 'Ouest',
      categorie: 'Commercial',
      date_creation: '2023-06-03',
      date_soumission: null,
      date_validation: null,
      statut: 'brouillon',
      score_moyen: 4.5,
      competences_evaluees: 3,
      commentaires: false
    },
    { 
      id: '4', 
      evaluateur: 'Sophie Ndongo', 
      role_evaluateur: 'RTM',
      evalue: 'Marie Fouda', 
      role_evalue: 'TMO',
      type: 'descendante', 
      region: 'Nord',
      categorie: 'Marketing',
      date_creation: '2023-05-28',
      date_soumission: '2023-06-01',
      date_validation: '2023-06-02',
      statut: 'rejeté',
      score_moyen: 2.5,
      competences_evaluees: 5,
      commentaires: true
    },
    { 
      id: '5', 
      evaluateur: 'Pierre Kamto', 
      role_evaluateur: 'DR',
      evalue: 'Thomas Mbarga', 
      role_evalue: 'CDS',
      type: 'descendante', 
      region: 'Littoral',
      categorie: 'Commercial',
      date_creation: '2023-06-04',
      date_soumission: '2023-06-08',
      date_validation: '2023-06-10',
      statut: 'validé',
      score_moyen: 3.9,
      competences_evaluees: 5,
      commentaires: true
    },
    { 
      id: '6', 
      evaluateur: 'Alice Ndom', 
      role_evaluateur: 'CDTT',
      evalue: 'Sophie Ndongo', 
      role_evalue: 'RTM',
      type: 'descendante', 
      region: 'Centre',
      categorie: 'Marketing',
      date_creation: '2023-06-05',
      date_soumission: '2023-06-09',
      date_validation: '2023-06-11',
      statut: 'validé',
      score_moyen: 4.1,
      competences_evaluees: 5,
      commentaires: true
    },
    { 
      id: '7', 
      evaluateur: 'Thomas Mbarga', 
      role_evaluateur: 'CDS',
      evalue: 'Thomas Mbarga', 
      role_evalue: 'CDS',
      type: 'auto', 
      region: 'Littoral',
      categorie: 'Commercial',
      date_creation: '2023-06-06',
      date_soumission: '2023-06-10',
      date_validation: null,
      statut: 'soumis',
      score_moyen: 4.0,
      competences_evaluees: 5,
      commentaires: true
    },
    { 
      id: '8', 
      evaluateur: 'Marie Fouda', 
      role_evaluateur: 'TMO',
      evalue: 'Jean Ekambi', 
      role_evalue: 'CSC',
      type: 'pairs', 
      region: 'Centre',
      categorie: 'Commercial',
      date_creation: '2023-06-07',
      date_soumission: null,
      date_validation: null,
      statut: 'brouillon',
      score_moyen: 3.5,
      competences_evaluees: 2,
      commentaires: false
    },
  ];
  
  // Filtrer les évaluations en fonction des critères
  const filteredEvaluations = evaluations.filter(evaluation => {
    // Filtre par terme de recherche
    const matchesSearchTerm = searchTerm === '' || 
      evaluation.evaluateur.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.evalue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.categorie.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtre par statut
    const matchesStatus = filterStatus === 'all' || evaluation.statut === filterStatus;
    
    // Filtre par type (maintenant géré par activeFilters)
    const typeFilters = activeFilters['type'] || [];
    const matchesType = typeFilters.length === 0 || typeFilters.includes(evaluation.type);
    
    return matchesSearchTerm && matchesStatus && matchesType;
  });
  
  // Ouvrir le modal pour voir les détails d'une évaluation
  const handleViewDetails = (evaluation: any) => {
    setCurrentEvaluation(evaluation);
    setIsModalOpen(true);
  };
  
  // Obtenir la couleur de badge pour le statut
  const getStatusBadgeColor = (statut: string) => {
    switch (statut) {
      case 'validé': return 'bg-sabc-success';
      case 'soumis': return 'bg-sabc-info';
      case 'brouillon': return 'bg-sabc-gray-400';
      case 'rejeté': return 'bg-sabc-error';
      default: return 'bg-sabc-gray-400';
    }
  };
  
  // Obtenir la couleur de badge pour le type d'évaluation
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'auto': return 'bg-sabc-red-primary';
      case 'pairs': return 'bg-sabc-accent';
      case 'descendante': return 'bg-sabc-info';
      default: return 'bg-sabc-gray-400';
    }
  };
  
  // Obtenir le libellé du type d'évaluation
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'auto': return 'Auto-évaluation';
      case 'pairs': return 'Évaluation par les pairs';
      case 'descendante': return 'Évaluation descendante';
      default: return type;
    }
  };
  
  return (
    <AppLayout
      user={mockUser}
      notifications={[]}
    >
      <Head title="Gestion des Évaluations - SABC Évaluation 360°" />
      
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-sabc-gray-900">Gestion des Évaluations</h1>
          <div className="flex space-x-2">
            <Link href="/admin/evaluation/templates" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sabc-red-primary hover:bg-sabc-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sabc-red-light">
              Gérer les Templates
            </Link>
            <Link href="/admin/evaluation/templates/create" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm bg-white text-sabc-red-primary border-sabc-red-primary hover:bg-sabc-red-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sabc-red-light">
              Créer un Template
            </Link>
          </div>
        </div>
        
        {/* Statistiques des évaluations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-sabc-success">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-sabc-gray-400">Évaluations validées</p>
                  <p className="text-2xl font-bold">
                    {evaluations.filter(e => e.statut === 'validé').length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-sabc-success/10 flex items-center justify-center">
                  <span className="text-sabc-success">✓</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-sabc-info">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-sabc-gray-400">Évaluations soumises</p>
                  <p className="text-2xl font-bold">
                    {evaluations.filter(e => e.statut === 'soumis').length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-sabc-info/10 flex items-center justify-center">
                  <span className="text-sabc-info">⟳</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-sabc-gray-400">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-sabc-gray-400">Brouillons</p>
                  <p className="text-2xl font-bold">
                    {evaluations.filter(e => e.statut === 'brouillon').length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-sabc-gray-200 flex items-center justify-center">
                  <span className="text-sabc-gray-800">✎</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-sabc-error">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-sabc-gray-400">Évaluations rejetées</p>
                  <p className="text-2xl font-bold">
                    {evaluations.filter(e => e.statut === 'rejeté').length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-sabc-error/10 flex items-center justify-center">
                  <span className="text-sabc-error">✗</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filtres et recherche */}
        <div className="mb-6">
          <SearchFilter
            placeholder="Rechercher une évaluation..."
            filters={evaluationFilters}
            onSearch={setSearchTerm}
            onFilterChange={handleFilterChange}
            className="mb-4"
          />
        </div>
        
        {/* Tableau des évaluations */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des évaluations</CardTitle>
            <CardDescription>
              {filteredEvaluations.length} évaluation{filteredEvaluations.length > 1 ? 's' : ''} trouvée{filteredEvaluations.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Évaluateur</TableHead>
                  <TableHead>Évalué</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Région</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TruncatedTableBody
                  items={filteredEvaluations}
                  previewCount={10}
                  colSpan={8}
                  keyExtractor={(evaluation) => evaluation.id}
                  renderRow={(evaluation) => (
                    <TableRow key={evaluation.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{evaluation.evaluateur}</p>
                          <p className="text-xs text-sabc-gray-400">{evaluation.role_evaluateur}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{evaluation.evalue}</p>
                          <p className="text-xs text-sabc-gray-400">{evaluation.role_evalue}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeBadgeColor(evaluation.type)}>
                          {getTypeLabel(evaluation.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{evaluation.region}</TableCell>
                      <TableCell>{evaluation.date_creation}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(evaluation.statut)}>
                          {evaluation.statut.charAt(0).toUpperCase() + evaluation.statut.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className={`font-medium ${
                            evaluation.score_moyen >= 4 ? 'text-sabc-success' :
                            evaluation.score_moyen >= 3 ? 'text-sabc-accent' :
                            'text-sabc-error'
                          }`}>
                            {evaluation.score_moyen.toFixed(1)}
                          </span>
                          <span className="text-xs text-sabc-gray-400 ml-1">/5</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(evaluation)}
                          >
                            Détails
                          </Button>
                          {evaluation.statut === 'soumis' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-sabc-success hover:bg-sabc-success/10"
                              >
                                Valider
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-sabc-error hover:bg-sabc-error/10"
                              >
                                Rejeter
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                />
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Règles de validation des évaluations */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Règles de validation des évaluations</CardTitle>
            <CardDescription>
              Selon les règles métier SABC
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-md p-4">
                  <h3 className="font-semibold mb-2">Types d'évaluation autorisés</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Auto-évaluation : Tous sauf DR et CDTT</li>
                    <li>Évaluation pairs : Même niveau + même région/service</li>
                    <li>Évaluation descendante : Supérieur → Subordonnés directs</li>
                  </ul>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-semibold mb-2">Règles de validation métier</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Toutes compétences notées (minimum 5)</li>
                    <li>Notes entre 1 et 5 obligatoirement</li>
                    <li>Date évaluation cohérente (pas future)</li>
                    <li>Délai maximum 30 jours</li>
                    <li>Commentaires requis si note &lt; 3</li>
                  </ul>
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-semibold mb-2">Workflow des évaluations</h3>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-col items-center">
                    <div className="h-10 w-10 rounded-full bg-sabc-gray-400 flex items-center justify-center text-white">
                      1
                    </div>
                    <p className="text-sm mt-1">Brouillon</p>
                  </div>
                  
                  <div className="h-0.5 flex-1 bg-sabc-gray-200"></div>
                  
                  <div className="flex flex-col items-center">
                    <div className="h-10 w-10 rounded-full bg-sabc-info flex items-center justify-center text-white">
                      2
                    </div>
                    <p className="text-sm mt-1">Soumis</p>
                  </div>
                  
                  <div className="h-0.5 flex-1 bg-sabc-gray-200"></div>
                  
                  <div className="flex flex-col items-center">
                    <div className="h-10 w-10 rounded-full bg-sabc-success flex items-center justify-center text-white">
                      3
                    </div>
                    <p className="text-sm mt-1">Validé</p>
                  </div>
                  
                  <div className="h-0.5 flex-1 bg-sabc-gray-200"></div>
                  
                  <div className="flex flex-col items-center">
                    <div className="h-10 w-10 rounded-full bg-sabc-error flex items-center justify-center text-white">
                      4
                    </div>
                    <p className="text-sm mt-1">Rejeté</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Modal de détail d'évaluation serait ici */}
      </div>
    </AppLayout>
  );
};

export default EvaluationsAdminPage;
