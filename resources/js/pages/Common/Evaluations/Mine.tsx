import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Button } from '@/Components/UI/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/UI/Tabs';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert';
import { ClipboardList, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { useAuth } from '@/hooks/useAuth';

interface EvaluationTemplate {
  id: string;
  title: string;
  description: string;
  status: 'published' | 'draft';
  created_at: string;
  updated_at: string;
}

interface EvaluationTarget {
  matricule: string;
  name: string;
  role: string;
  region: string;
  branch: string;
  isAvailable: boolean;
}

const EvaluationMinePage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);
  const [evaluationTargets, setEvaluationTargets] = useState<{
    self: EvaluationTarget[];
    peers: EvaluationTarget[];
    subordinates: EvaluationTarget[];
  }>({
    self: [],
    peers: [],
    subordinates: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('self');
  
  // Si l'utilisateur n'est pas encore chargé ou n'est pas authentifié, afficher un indicateur de chargement
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sabc-gray-50 dark:bg-sabc-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sabc-red-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sabc-gray-800 dark:text-sabc-gray-100">Chargement...</p>
        </div>
      </div>
    );
  }

  // Simuler le chargement des données depuis l'API
  useEffect(() => {
    // Dans une implémentation réelle, ces données viendraient de l'API
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Simulation de l'appel API pour les templates
        // À remplacer par un vrai appel API
        setTimeout(() => {
          setTemplates([
            {
              id: '1',
              title: 'Évaluation des compétences managériales',
              description: 'Évaluation des compétences de leadership et de gestion d\'équipe',
              status: 'published',
              created_at: '2025-07-01',
              updated_at: '2025-07-15',
            },
            {
              id: '2',
              title: 'Évaluation des compétences commerciales',
              description: 'Évaluation des compétences de vente et de relation client',
              status: 'published',
              created_at: '2025-07-05',
              updated_at: '2025-07-10',
            },
            {
              id: '3',
              title: 'Évaluation des compétences techniques',
              description: 'Évaluation des compétences techniques spécifiques au poste',
              status: 'published',
              created_at: '2025-07-08',
              updated_at: '2025-07-12',
            },
          ]);
          
          // Simulation de l'appel API pour les cibles d'évaluation
          setEvaluationTargets({
            self: [
              {
                matricule: 'US-01',
                name: 'Vous-même',
                role: 'CSC',
                region: 'Littoral',
                branch: 'Commercial',
                isAvailable: true,
              }
            ],
            peers: [
              {
                matricule: 'US-02',
                name: 'Thomas Mbarga',
                role: 'CSC',
                region: 'Littoral',
                branch: 'Commercial',
                isAvailable: true,
              },
              {
                matricule: 'US-03',
                name: 'Marie Fouda',
                role: 'CSC',
                region: 'Littoral',
                branch: 'Commercial',
                isAvailable: false,
              },
            ],
            subordinates: [
              {
                matricule: 'US-04',
                name: 'Jean Ekambi',
                role: 'CDV',
                region: 'Littoral',
                branch: 'Commercial',
                isAvailable: true,
              },
              {
                matricule: 'US-05',
                name: 'Sophie Ndongo',
                role: 'CDV',
                region: 'Littoral',
                branch: 'Commercial',
                isAvailable: true,
              },
            ],
          });
          
          setLoading(false);
        }, 1000);
        
      } catch (err) {
        setError('Erreur lors du chargement des données');
        setLoading(false);
        console.error(err);
      }
    };
    
    fetchData();
  }, []);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleStartEvaluation = (targetMatricule: string) => {
    // Rediriger vers la page de création d'évaluation avec les paramètres
    window.location.href = `/common/evaluations/create?template=${selectedTemplate}&target=${targetMatricule}`;
  };

  const renderTargetList = (targets: EvaluationTarget[]) => {
    if (targets.length === 0) {
      return (
        <Alert className="mb-4 bg-sabc-gray-100">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Aucune personne disponible</AlertTitle>
          <AlertDescription>
            Aucune personne n'est disponible pour ce type d'évaluation.
          </AlertDescription>
        </Alert>
      );
    }

    return targets.map((target) => (
      <Card key={target.matricule} className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex justify-between items-center">
          <div>
            <h3 className="font-medium text-sabc-gray-900">{target.name}</h3>
            <p className="text-sm text-sabc-gray-400">{target.role} - {target.region}</p>
          </div>
          <Button
            onClick={() => handleStartEvaluation(target.matricule)}
            disabled={!target.isAvailable || !selectedTemplate}
            className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
          >
            {target.isAvailable ? 'Évaluer' : 'Indisponible'}
          </Button>
        </CardContent>
      </Card>
    ));
  };

  return (
    <AppLayout
      user={user}
      pageTitle="Mes Évaluations"
      notifications={[]}
    >
      <Head title="Mes Évaluations - SABC Évaluation 360°" />
      
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-sabc-gray-900">Mes Évaluations</h1>
        </div>

        {error && (
          <Alert className="mb-6 bg-sabc-red-light border-sabc-red-primary">
            <AlertCircle className="h-4 w-4 text-sabc-red-primary" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sélection du template */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ClipboardList className="mr-2 h-5 w-5 text-sabc-red-primary" />
                  Templates d'évaluation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-4">Chargement des templates...</p>
                ) : (
                  <>
                    {templates.length === 0 ? (
                      <Alert className="mb-4 bg-sabc-gray-100">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Aucun template</AlertTitle>
                        <AlertDescription>
                          Aucun template d'évaluation n'est disponible.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      templates.map((template) => (
                        <div
                          key={template.id}
                          className={`p-3 mb-2 rounded-md cursor-pointer border ${
                            selectedTemplate === template.id
                              ? 'border-sabc-red-primary bg-sabc-red-light/20'
                              : 'border-sabc-gray-200 hover:border-sabc-red-primary/50'
                          }`}
                          onClick={() => handleTemplateSelect(template.id)}
                        >
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium">{template.title}</h3>
                            {selectedTemplate === template.id && (
                              <CheckCircle2 className="h-4 w-4 text-sabc-red-primary" />
                            )}
                          </div>
                          <p className="text-sm text-sabc-gray-400 mt-1">{template.description}</p>
                        </div>
                      ))
                    )}
                    
                    {selectedTemplate ? (
                      <p className="text-sm text-sabc-gray-400 mt-4">
                        Sélectionnez maintenant une personne à évaluer dans l'onglet correspondant.
                      </p>
                    ) : (
                      <p className="text-sm text-sabc-gray-400 mt-4">
                        Sélectionnez un template pour commencer l'évaluation.
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sélection de la personne à évaluer */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Personnes à évaluer</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-4">Chargement des données...</p>
                ) : (
                  <Tabs defaultValue="self" onValueChange={setSelectedTab}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="self">Auto-évaluation</TabsTrigger>
                      <TabsTrigger value="peers">Pairs</TabsTrigger>
                      <TabsTrigger value="subordinates">Subordonnés</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="self">
                      {renderTargetList(evaluationTargets.self)}
                    </TabsContent>
                    
                    <TabsContent value="peers">
                      {renderTargetList(evaluationTargets.peers)}
                    </TabsContent>
                    
                    <TabsContent value="subordinates">
                      {renderTargetList(evaluationTargets.subordinates)}
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default EvaluationMinePage;
