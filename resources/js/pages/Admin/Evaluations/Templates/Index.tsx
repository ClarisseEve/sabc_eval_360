import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { useAuth } from '@/Hooks/useAuth';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert/Alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/UI/Table/Table';
import { 
  ClipboardList, 
  AlertCircle, 
  Search, 
  Plus, 
  Edit2,
  Eye,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Respecter la charte graphique SABC
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Components/UI/DropdownMenu/DropdownMenu';

interface EvaluationTemplate {
  id: string;
  title: string;
  description: string;
  criteria_count: number;
  status: 'published' | 'draft';
  created_at: string;
  updated_at: string;
}

const TemplatesIndexPage = () => {
  const { user, isLoading } = useAuth();
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Simuler le chargement des données depuis l'API
  useEffect(() => {
    // Dans une implémentation réelle, ces données viendraient de l'API
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Simulation de l'appel API
        // À remplacer par un vrai appel API
        setTimeout(() => {
          setTemplates([
            {
              id: '1',
              title: 'Évaluation des compétences managériales',
              description: 'Évaluation des compétences de leadership et de gestion d\'équipe',
              criteria_count: 12,
              status: 'published',
              created_at: '2025-07-01T10:30:00',
              updated_at: '2025-07-15T14:20:00',
            },
            {
              id: '2',
              title: 'Évaluation des compétences commerciales',
              description: 'Évaluation des compétences de vente et de relation client',
              criteria_count: 10,
              status: 'published',
              created_at: '2025-07-05T09:15:00',
              updated_at: '2025-07-10T11:45:00',
            },
            {
              id: '3',
              title: 'Évaluation des compétences techniques',
              description: 'Évaluation des compétences techniques spécifiques au poste',
              criteria_count: 15,
              status: 'draft',
              created_at: '2025-07-08T14:20:00',
              updated_at: '2025-07-12T16:30:00',
            },
            {
              id: '4',
              title: 'Évaluation de la performance commerciale',
              description: 'Évaluation des résultats commerciaux et des objectifs atteints',
              criteria_count: 8,
              status: 'published',
              created_at: '2025-07-10T08:45:00',
              updated_at: '2025-07-14T10:15:00',
            },
            {
              id: '5',
              title: 'Évaluation des compétences marketing',
              description: 'Évaluation des compétences en marketing opérationnel',
              criteria_count: 11,
              status: 'draft',
              created_at: '2025-07-12T11:30:00',
              updated_at: '2025-07-16T09:20:00',
            },
          ]);
          
          setLoading(false);
        }, 1000);
        
      } catch (err) {
        setError('Erreur lors du chargement des templates');
        setLoading(false);
        console.error(err);
      }
    };
    
    fetchData();
  }, []);

  // Filtrer les templates en fonction de la recherche
  const filteredTemplates = templates.filter(template => 
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-sabc-success/20 text-sabc-success">Publié</Badge>;
      case 'draft':
        return <Badge className="bg-sabc-gray-100 text-sabc-gray-800">Brouillon</Badge>;
      default:
        return <Badge>Inconnu</Badge>;
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

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
      // Dans une implémentation réelle, appel API pour supprimer le template
      setTemplates(templates.filter(template => template.id !== id));
    }
  };

  // Afficher un indicateur de chargement pendant que l'authentification est en cours
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
    <AppLayout user={adaptedUser}>
      <Head title="Gestion des Templates" />
      
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-sabc-gray-900">Gestion des Templates</h1>
          <Link href="/admin/evaluations/templates/create">
            <Button className="flex items-center gap-2 bg-sabc-red-primary hover:bg-sabc-red-dark text-white">
              <Plus className="h-4 w-4" />
              Créer un template
            </Button>
          </Link>
        </div>

        {error && (
          <Alert className="mb-6 bg-sabc-red-light border-sabc-red-primary">
            <AlertCircle className="h-4 w-4 text-sabc-red-primary" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <ClipboardList className="mr-2 h-5 w-5 text-sabc-red-primary" />
              Templates d'évaluation
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-sabc-gray-400" />
              <input
                placeholder="Rechercher..."
                className="pl-8 h-10 w-full rounded-md border border-sabc-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-sabc-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sabc-red-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-4">Chargement des templates...</p>
            ) : (
              <>
                {filteredTemplates.length === 0 ? (
                  <Alert className="mb-4 bg-sabc-gray-100">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Aucun template</AlertTitle>
                    <AlertDescription>
                      Aucun template d'évaluation ne correspond à votre recherche.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titre</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Critères</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Dernière modification</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTemplates.map((template) => (
                          <TableRow key={template.id}>
                            <TableCell className="font-medium">{template.title}</TableCell>
                            <TableCell className="max-w-xs truncate">{template.description}</TableCell>
                            <TableCell>{template.criteria_count}</TableCell>
                            <TableCell>{getStatusBadge(template.status)}</TableCell>
                            <TableCell>{formatDate(template.updated_at)}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Ouvrir menu</span>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/evaluations/templates/${template.id}`} className="flex items-center">
                                      <Eye className="mr-2 h-4 w-4" />
                                      <span>Voir</span>
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/evaluations/templates/${template.id}/edit`} className="flex items-center">
                                      <Edit2 className="mr-2 h-4 w-4" />
                                      <span>Modifier</span>
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-sabc-red-primary focus:text-sabc-red-primary"
                                    onClick={() => handleDeleteTemplate(template.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Supprimer</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default TemplatesIndexPage;
