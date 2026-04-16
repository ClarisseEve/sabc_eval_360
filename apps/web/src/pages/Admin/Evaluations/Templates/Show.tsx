import React, { useState, useEffect } from 'react';
import { Head, Link } from '@/lib/inertia-shim';
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
  ArrowLeft,
  Edit2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EvaluationCriteria {
  id: string;
  title: string;
  description: string;
  weight: number;
}

interface EvaluationTemplate {
  id: string;
  title: string;
  description: string;
  criteria: EvaluationCriteria[];
  status: 'published' | 'draft';
  created_at: string;
  updated_at: string;
}

interface TemplateShowPageProps {
  id: string;
}

const TemplateShowPage: React.FC<TemplateShowPageProps> = ({ id }) => {
  const { user, isLoading } = useAuth();
  const [template, setTemplate] = useState<EvaluationTemplate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Simuler le chargement des données depuis l'API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Simulation d'un appel API
        setTimeout(() => {
          // Données fictives pour le template
          setTemplate({
            id,
            title: 'Évaluation 360° Standard',
            description: 'Template standard pour les évaluations 360° des collaborateurs SABC',
            status: 'published',
            created_at: '2025-07-15T10:30:00',
            updated_at: '2025-07-20T14:45:00',
            criteria: [
              {
                id: 'crit-1',
                title: 'Leadership',
                description: 'Capacité à guider et motiver une équipe',
                weight: 25
              },
              {
                id: 'crit-2',
                title: 'Communication',
                description: 'Clarté et efficacité dans la transmission des informations',
                weight: 20
              },
              {
                id: 'crit-3',
                title: 'Résolution de problèmes',
                description: 'Capacité à analyser et résoudre des situations complexes',
                weight: 20
              },
              {
                id: 'crit-4',
                title: 'Travail d\'équipe',
                description: 'Collaboration et contribution au sein d\'un groupe',
                weight: 20
              },
              {
                id: 'crit-5',
                title: 'Innovation',
                description: 'Proposition et mise en œuvre d\'idées nouvelles',
                weight: 15
              }
            ]
          });
          setLoading(false);
        }, 800);
      } catch (err) {
        setError('Erreur lors du chargement du template');
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Formater la date selon la locale française
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr });
  };

  // Obtenir le badge de statut avec la couleur appropriée
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-sabc-success">Publié</Badge>;
      case 'draft':
        return <Badge className="bg-sabc-warning">Brouillon</Badge>;
      default:
        return <Badge>Inconnu</Badge>;
    }
  };

  // Calculer le total des poids
  const getTotalWeight = () => {
    if (!template?.criteria) return 0;
    return template.criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sabc-red-primary"></div>
      </div>
    );
  }

  return (
    <AppLayout user={user || undefined}>
      <Head title={`Template: ${template?.title || 'Chargement...'}`} />
      
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/admin/evaluations/templates" className="mr-4">
              <Button variant="outline" size="sm" className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-sabc-gray-900">
              {loading ? 'Chargement...' : template?.title}
            </h1>
          </div>
          
          {template && (
            <Link href={`/admin/evaluations/templates/${template.id}/edit`}>
              <Button className="flex items-center">
                <Edit2 className="mr-2 h-4 w-4" />
                Modifier
              </Button>
            </Link>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sabc-red-primary"></div>
              </div>
            </CardContent>
          </Card>
        ) : template && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ClipboardList className="mr-2 h-5 w-5" />
                  Détails du template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-sabc-gray-400">Description</h3>
                    <p className="mt-1 text-sabc-gray-800">{template.description}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-sabc-gray-400">Statut</h3>
                    <div className="mt-1">{getStatusBadge(template.status)}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-sabc-gray-400">Date de création</h3>
                    <p className="mt-1 text-sabc-gray-800">{formatDate(template.created_at)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-sabc-gray-400">Dernière modification</h3>
                    <p className="mt-1 text-sabc-gray-800">{formatDate(template.updated_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ClipboardList className="mr-2 h-5 w-5" />
                    Critères d'évaluation
                  </div>
                  <Badge className="ml-2">Total: {getTotalWeight()}%</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Critère</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Pondération</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {template.criteria.map((criterion) => (
                      <TableRow key={criterion.id}>
                        <TableCell className="font-medium">{criterion.title}</TableCell>
                        <TableCell>{criterion.description}</TableCell>
                        <TableCell className="text-right">{criterion.weight}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default TemplateShowPage;
