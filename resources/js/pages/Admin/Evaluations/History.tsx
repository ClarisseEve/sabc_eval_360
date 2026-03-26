import React, { useState, useEffect, useMemo } from 'react';
import { Head, usePage } from '@/lib/inertia-shim';
import { useAuth } from '@/Hooks/useAuth';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { RoleGuard } from '@/Components/Auth/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Input } from '@/Components/UI/Input/Input';
import { Button } from '@/Components/UI/Button/Button';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert/Alert';
import DataTable from '@/Components/UI/DataTable/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { 
  ClipboardList, 
  AlertCircle, 
  Search, 
  Filter, 
  Download,
  Calendar,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Respecter la charte graphique SABC
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/UI/Select';

interface HistoryEvaluation {
  id: string;
  template_title: string;
  evaluator_name: string;
  evaluator_role: string;
  evaluator_region: string;
  target_name: string;
  target_role: string;
  target_region: string;
  target_matricule: string; // Ajout du matricule de la cible
  status: 'brouillon' | 'soumis' | 'validé' | 'rejeté';
  score: number;
  completion_date: string;
}

const EvaluationHistoryPage = () => {
  const { user, isLoading } = useAuth();
  const page = usePage<{ auth?: { user?: any } }>();
  const inertiaUser = page.props.auth?.user;
  const effectiveUser = useMemo(() => user ?? inertiaUser ?? null, [user, inertiaUser]);
  const [evaluations, setEvaluations] = useState<HistoryEvaluation[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<HistoryEvaluation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  // Pagination gérée par le DataTable (TanStack)

  // Simuler le chargement des données depuis l'API
  useEffect(() => {
    // Dans une implémentation réelle, ces données viendraient de l'API
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Simulation de l'appel API
        // À remplacer par un vrai appel API
        setTimeout(() => {
          // Création des données simulées avec typage strict pour le statut
          const statuses: Array<'brouillon' | 'soumis' | 'validé' | 'rejeté'> = ['brouillon', 'soumis', 'validé', 'rejeté'];
          
          const mockData: HistoryEvaluation[] = Array(30).fill(null).map((_, index) => ({
            id: `${index + 1}`,
            template_title: ['Évaluation des compétences managériales', 'Évaluation des compétences commerciales', 'Évaluation des compétences techniques'][index % 3],
            evaluator_name: ['Thomas Mbarga', 'Marie Fouda', 'Jean Ekambi', 'Sophie Ndongo', 'Paul Biya'][index % 5],
            evaluator_role: ['CSC', 'TMO', 'CDV', 'RTM', 'CDS'][index % 5],
            evaluator_region: ['Littoral', 'Centre', 'Ouest', 'Nord'][index % 4],
            target_name: ['Pierre Kamto', 'Jeanne Mendo', 'Marc Enoh', 'Claire Foning', 'Luc Mbala'][index % 5],
            target_role: ['CSC', 'TMO', 'CDV', 'RTM', 'CDS'][(index + 2) % 5],
            target_region: ['Littoral', 'Centre', 'Ouest', 'Nord'][(index + 1) % 4],
            target_matricule: [`US-${10 + index}`, `US-${20 + index}`, `US-${30 + index}`, `US-${40 + index}`, `US-${50 + index}`][index % 5],
            status: statuses[index % 4],
            score: Math.floor(Math.random() * 100),
            completion_date: new Date(2025, 0, 1 + index).toISOString(),
          }));
          
          setEvaluations(mockData);
          setFilteredEvaluations(mockData);
          setLoading(false);
        }, 1000);
        
      } catch (err) {
        setError('Erreur lors du chargement de l\'historique des évaluations');
        setLoading(false);
        console.error(err);
      }
    };
    
    fetchData();
  }, []);

  // Filtrer les évaluations en fonction des critères
  useEffect(() => {
    let results = [...evaluations];
    
    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        evaluation => 
          evaluation.template_title.toLowerCase().includes(term) ||
          evaluation.evaluator_name.toLowerCase().includes(term) ||
          evaluation.target_name.toLowerCase().includes(term)
      );
    }
    
    // Filtre par statut
    if (statusFilter !== 'all') {
      results = results.filter(evaluation => evaluation.status === statusFilter);
    }
    
    // Filtre par région
    if (regionFilter !== 'all') {
      results = results.filter(
        evaluation => 
          evaluation.evaluator_region === regionFilter ||
          evaluation.target_region === regionFilter
      );
    }
    
    // Filtre par rôle
    if (roleFilter !== 'all') {
      results = results.filter(
        evaluation => 
          evaluation.evaluator_role === roleFilter ||
          evaluation.target_role === roleFilter
      );
    }
    
    setFilteredEvaluations(results);
  }, [searchTerm, statusFilter, regionFilter, roleFilter, evaluations]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'brouillon':
        return <Badge variant="outline" className="bg-sabc-gray-100 text-sabc-gray-800">Brouillon</Badge>;
      case 'soumis':
        return <Badge variant="outline" className="bg-sabc-accent-light text-sabc-accent">Soumis</Badge>;
      case 'validé':
        return <Badge variant="outline" className="bg-sabc-success/20 text-sabc-success">Validé</Badge>;
      case 'rejeté':
        return <Badge variant="outline" className="bg-sabc-red-light text-sabc-red-primary">Rejeté</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMM yyyy', { locale: fr });
    } catch (e) {
      return dateString;
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 50) return 'text-sabc-red-primary';
    if (score < 75) return 'text-sabc-accent';
    return 'text-sabc-success';
  };

  const loadingFallback = (
    <div className="flex w-full justify-center py-10">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-sabc-red-primary border-t-transparent" aria-label="Chargement" />
    </div>
  );

  const handleViewEvaluation = (id: string) => {
    // Rediriger vers la page de visualisation de l'évaluation
    window.location.href = `/admin/evaluations/${id}`;
  };

  const handleExportData = () => {
    alert('Export des données en CSV (fonctionnalité à implémenter)');
  };

  // Définition des colonnes pour TanStack Table
  const columns: ColumnDef<HistoryEvaluation>[] = [
    {
      accessorKey: 'template_title',
      header: 'Template',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.template_title}</span>
      ),
    },
    {
      id: 'evaluator',
      header: 'Évaluateur',
      cell: ({ row }) => (
        <div>
          <p>{row.original.evaluator_name}</p>
          <p className="text-xs text-sabc-gray-400">{row.original.evaluator_role} - {row.original.evaluator_region}</p>
        </div>
      ),
      enableSorting: false,
    },
    {
      id: 'target',
      header: 'Personne évaluée',
      cell: ({ row }) => (
        <div>
          <p>{row.original.target_name}</p>
          <p className="text-xs text-sabc-gray-400">{row.original.target_role} - {row.original.target_region}</p>
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => (
        getStatusBadge(row.original.status)
      ),
      enableSorting: true,
    },
    {
      accessorKey: 'score',
      header: 'Score',
      cell: ({ row }) => (
        <span className={`font-medium ${getScoreColor(row.original.score)}`}>
          {row.original.score}/100
        </span>
      ),
    },
    {
      id: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <div className="flex items-center">
          <Calendar className="h-3 w-3 mr-1 text-sabc-gray-400" />
          <span>{formatDate(row.original.completion_date)}</span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button 
            onClick={() => handleViewEvaluation(row.original.id)}
            variant="outline"
            size="sm"
          >
            Consulter
          </Button>
          <Button 
            onClick={() => {
              const params = new URLSearchParams({
                template: '1',
                target: row.original.target_matricule || 'US-02'
              });
              window.location.href = `/common/evaluations/create?${params.toString()}`;
            }}
            className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
            size="sm"
          >
            Commencer l'évaluation
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ];

  // Pagination désormais gérée par DataTable (client-side)

  // Afficher un indicateur de chargement pendant que l'authentification est en cours
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sabc-red-primary"></div>
      </div>
    );
  }

  // Adapter l'utilisateur au format attendu par AppLayout
  const adaptedUser = effectiveUser ? {
    name: `${effectiveUser.prenom ?? ''} ${effectiveUser.nom ?? ''}`.trim() || effectiveUser.name || 'Administrateur',
    email: effectiveUser.email,
    role: effectiveUser.role_nom ?? effectiveUser.role,
    avatar: effectiveUser.avatar
  } : {
    name: 'Utilisateur',
    email: 'utilisateur@sabc.cm',
    role: 'Invité'
  };

  return (
    <AppLayout user={adaptedUser}>
      <Head title="Historique des Évaluations" />
      <RoleGuard
        allowed={["ADMIN"]}
        userRoleName={effectiveUser?.role_nom ?? effectiveUser?.role}
        fallback={isLoading ? loadingFallback : undefined}
      >
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-sabc-gray-900">Historique des Évaluations</h1>
          <div className="flex space-x-2">
            <Button 
              onClick={() => window.location.href = '/admin/evaluations/templates'}
              className="flex items-center gap-2 bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
            >
              <Plus className="h-4 w-4" />
              Gérer les templates
            </Button>
            <Button 
              onClick={handleExportData}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 bg-sabc-red-light border-sabc-red-primary">
            <AlertCircle className="h-4 w-4 text-sabc-red-primary" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filtres */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5 text-sabc-red-primary" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-sabc-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                  <SelectItem value="soumis">Soumis</SelectItem>
                  <SelectItem value="validé">Validé</SelectItem>
                  <SelectItem value="rejeté">Rejeté</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Région" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les régions</SelectItem>
                  <SelectItem value="Littoral">Littoral</SelectItem>
                  <SelectItem value="Centre">Centre</SelectItem>
                  <SelectItem value="Ouest">Ouest</SelectItem>
                  <SelectItem value="Nord">Nord</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="CSC">CSC</SelectItem>
                  <SelectItem value="CDV">CDV</SelectItem>
                  <SelectItem value="CDS">CDS</SelectItem>
                  <SelectItem value="RTM">RTM</SelectItem>
                  <SelectItem value="TMO">TMO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardList className="mr-2 h-5 w-5 text-sabc-red-primary" />
              Historique des évaluations
              <span className="ml-2 text-sm text-sabc-gray-400">
                ({filteredEvaluations.length} résultats)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-4">Chargement de l'historique...</p>
            ) : (
              <>
                {filteredEvaluations.length === 0 ? (
                  <Alert className="mb-4 bg-sabc-gray-100">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Aucune évaluation</AlertTitle>
                    <AlertDescription>
                      Aucune évaluation ne correspond aux critères de recherche.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <DataTable
                      key={`${searchTerm}-${statusFilter}-${regionFilter}-${roleFilter}`}
                      columns={columns}
                      data={filteredEvaluations}
                      isLoading={loading}
                    />
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      </RoleGuard>
    </AppLayout>
  );
};

export default EvaluationHistoryPage;
