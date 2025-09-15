import * as React from 'react';
import { Head } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Clock, Filter, Search, Plus } from 'lucide-react';

// Layouts
import AppLayout from '@/Components/Layout/app/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { route } from '@/routes';

// Composants
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { StatusBadge } from '@/Components/UI/Status/StatusBadge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/UI/Tabs/Tabs';
import { EvaluationList } from '@/Components/Dashboard/EvaluationList';
import { EvaluationForm } from '@/Components/Forms/EvaluationForm';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  region: string;
  department: string;
  avatar?: string;
}

interface Evaluation {
  id: string;
  evaluatedId: string;
  evaluatedName: string;
  evaluatedRole: string;
  evaluatedDepartment: string;
  evaluatedAvatar?: string;
  status: 'draft' | 'submitted' | 'validated' | 'rejected' | 'overdue';
  dueDate: string;
  progress: number;
  createdAt: string;
  updatedAt?: string;
}

interface EvaluationPageProps {
  user: User;
  pendingEvaluations: Evaluation[];
  draftEvaluations: Evaluation[];
  completedEvaluations: Evaluation[];
  validatedEvaluations: Evaluation[];
  rejectedEvaluations: Evaluation[];
}

export default function EvaluationIndex({
  pendingEvaluations = [],
  draftEvaluations = [],
  completedEvaluations = [],
  validatedEvaluations = [],
  rejectedEvaluations = [],
  auth,
}: Omit<EvaluationPageProps, 'user'> & { auth: { user: User } }) {
  // Utiliser l'utilisateur authentifié fourni par les props
  const user = auth.user;
  // État pour suivre l'évaluation sélectionnée pour édition
  const [selectedEvaluation, setSelectedEvaluation] = React.useState<Evaluation | null>(null);
  
  // État pour la recherche
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Fonction pour gérer la déconnexion
  const handleLogout = () => {
    // Logique de déconnexion à implémenter
    console.log('Déconnexion');
  };
  
  // Fonction pour filtrer les évaluations en fonction de la recherche
  const filterEvaluations = (evaluations: Evaluation[]) => {
    if (!searchQuery.trim()) return evaluations;
    
    return evaluations.filter(evaluation => 
      evaluation.evaluatedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evaluation.evaluatedRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evaluation.evaluatedDepartment.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  // Fonction pour afficher le formulaire d'évaluation
  const handleViewEvaluation = (evaluationId: string) => {
    const evaluation = [...pendingEvaluations, ...draftEvaluations, ...completedEvaluations, ...validatedEvaluations, ...rejectedEvaluations]
      .find(e => e.id === evaluationId);
    
    if (evaluation) {
      setSelectedEvaluation(evaluation);
    }
  };
  
  // Fonction pour éditer une évaluation
  const handleEditEvaluation = (evaluationId: string) => {
    const evaluation = [...draftEvaluations]
      .find(e => e.id === evaluationId);
    
    if (evaluation) {
      setSelectedEvaluation(evaluation);
    }
  };
  
  // Fonction pour fermer le formulaire d'évaluation
  const handleCloseEvaluation = () => {
    setSelectedEvaluation(null);
  };
  
  return (
    <AppLayout 
      user={user}
      pageTitle="Évaluations"
      onLogout={handleLogout}
    >
      <Head title="Évaluations" />
      
      {selectedEvaluation ? (
        // Affichage du formulaire d'évaluation
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-sabc-gray-900 dark:text-white">
                Évaluation de {selectedEvaluation.evaluatedName}
              </h1>
              <p className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                {selectedEvaluation.evaluatedRole} • {selectedEvaluation.evaluatedDepartment}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleCloseEvaluation}
            >
              Retour aux évaluations
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <EvaluationForm 
                skills={[
                  { id: 'skill1', name: 'Leadership', description: 'Capacité à guider et influencer une équipe', category: 'Management' },
                  { id: 'skill2', name: 'Communication', description: 'Capacité à communiquer efficacement', category: 'Management' },
                  { id: 'skill3', name: 'Analyse', description: 'Capacité à analyser des situations complexes', category: 'Technique' },
                  { id: 'skill4', name: 'Innovation', description: 'Capacité à proposer des solutions innovantes', category: 'Technique' },
                  { id: 'skill5', name: 'Travail d\'\'équipe', description: 'Capacité à travailler en équipe', category: 'Relationnel' },
                ]}
                evaluation={{
                  id: selectedEvaluation.id,
                  evaluatorId: user.id,
                  evaluatedId: selectedEvaluation.evaluatedId,
                  status: selectedEvaluation.status as 'draft' | 'submitted' | 'validated' | 'rejected',
                  ratings: [],
                  createdAt: selectedEvaluation.createdAt,
                  updatedAt: selectedEvaluation.updatedAt
                }}
                readOnly={selectedEvaluation.status !== 'draft'}
                onSaveDraft={async (data) => {
                  // Logique de sauvegarde du brouillon à implémenter
                  console.log('Brouillon sauvegardé:', data);
                  return Promise.resolve();
                }}
                onSubmit={async (data) => {
                  // Logique de soumission à implémenter
                  console.log('Données soumises:', data);
                  handleCloseEvaluation();
                  return Promise.resolve();
                }}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        // Liste des évaluations
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-sabc-gray-900 dark:text-white">
              Évaluations
            </h1>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sabc-gray-500 dark:text-sabc-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="h-10 rounded-md border border-sabc-gray-200 pl-10 pr-4 text-sm focus:border-sabc-red-primary focus:outline-none focus:ring-1 focus:ring-sabc-red-primary dark:border-sabc-gray-800 dark:bg-sabc-gray-950 dark:text-white dark:focus:border-sabc-red-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle évaluation
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                À compléter
                {pendingEvaluations.length > 0 && (
                  <span className="ml-2 rounded-full bg-sabc-red-primary px-2 py-0.5 text-xs text-white">
                    {pendingEvaluations.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="drafts">
                Brouillons
                {draftEvaluations.length > 0 && (
                  <span className="ml-2 rounded-full bg-sabc-gray-500 px-2 py-0.5 text-xs text-white">
                    {draftEvaluations.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed">Soumises</TabsTrigger>
              <TabsTrigger value="validated">Validées</TabsTrigger>
              <TabsTrigger value="rejected">Rejetées</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending">
              <EvaluationList 
                evaluations={filterEvaluations(pendingEvaluations)}
                emptyMessage="Aucune évaluation en attente"
                emptyIcon={<CheckCircle className="h-8 w-8 text-sabc-success" />}
                onViewEvaluation={handleViewEvaluation}
                onEditEvaluation={handleEditEvaluation}
              />
            </TabsContent>
            
            <TabsContent value="drafts">
              <EvaluationList 
                evaluations={filterEvaluations(draftEvaluations)}
                emptyMessage="Aucun brouillon d'évaluation"
                emptyIcon={<AlertCircle className="h-8 w-8 text-sabc-gray-400" />}
                onViewEvaluation={handleViewEvaluation}
                onEditEvaluation={handleEditEvaluation}
              />
            </TabsContent>
            
            <TabsContent value="completed">
              <EvaluationList 
                evaluations={filterEvaluations(completedEvaluations)}
                emptyMessage="Aucune évaluation soumise"
                emptyIcon={<AlertCircle className="h-8 w-8 text-sabc-gray-400" />}
                onViewEvaluation={handleViewEvaluation}
                showProgress={false}
              />
            </TabsContent>
            
            <TabsContent value="validated">
              <EvaluationList 
                evaluations={filterEvaluations(validatedEvaluations)}
                emptyMessage="Aucune évaluation validée"
                emptyIcon={<AlertCircle className="h-8 w-8 text-sabc-gray-400" />}
                onViewEvaluation={handleViewEvaluation}
                showProgress={false}
              />
            </TabsContent>
            
            <TabsContent value="rejected">
              <EvaluationList 
                evaluations={filterEvaluations(rejectedEvaluations)}
                emptyMessage="Aucune évaluation rejetée"
                emptyIcon={<AlertCircle className="h-8 w-8 text-sabc-gray-400" />}
                onViewEvaluation={handleViewEvaluation}
                onEditEvaluation={handleEditEvaluation}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </AppLayout>
  );
}