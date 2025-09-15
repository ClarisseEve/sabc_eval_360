import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/Components/UI/Button';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert';
import { AlertCircle, Filter, Clock, CheckCircle, User, Users, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Badge } from '@/Components/UI/Badge';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { useAuth } from '@/hooks/useAuth';

interface EvaluationACompleter {
  type: 'auto' | 'pairs' | 'descendante' | 'ascendante';
  cible: {
    matricule: string;
    nom: string;
    prenom: string;
    role: string;
    region_nom: string;
  };
  statut: 'a_faire' | 'a_terminer';
  deadline: string;
  evaluation?: {
    id: string;
    statut: string;
    progress: number;
  };
}

interface EvaluationsParType {
  auto: EvaluationACompleter[];
  pairs: EvaluationACompleter[];
  descendante: EvaluationACompleter[];
  ascendante: EvaluationACompleter[];
}

interface Statistiques {
  total_a_faire: number;
  total_a_terminer: number;
  total_general: number;
}

interface PageProps {
  evaluations: EvaluationsParType;
  statistiques: Statistiques;
  user: any;
  role_permissions: {
    peut_auto_evaluer: boolean;
    peut_evaluer_pairs: boolean;
    peut_evaluer_subordonnes: boolean;
    peut_evaluer_superieurs: boolean;
  };
}

const EvaluationPendingPage = ({ evaluations, statistiques, user, role_permissions }: PageProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'auto':
        return <User className="h-4 w-4" />;
      case 'pairs':
        return <Users className="h-4 w-4" />;
      case 'descendante':
        return <ArrowDown className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'auto':
        return 'Auto-évaluation';
      case 'pairs':
        return 'Évaluation par les pairs';
      case 'descendante':
        return 'Évaluation des subordonnés';
      case 'ascendante':
        return 'Évaluation des supérieurs';
      default:
        return type;
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'a_faire':
        return <Badge variant="destructive">À faire</Badge>;
      case 'a_terminer':
        return <Badge variant="secondary">À terminer</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  const handleStartEvaluation = (evaluation: EvaluationACompleter) => {
    if (evaluation.evaluation?.id) {
      // Continuer une évaluation existante
      window.location.href = `/common/evaluations/${evaluation.evaluation.id}/edit`;
    } else {
      // Créer une nouvelle évaluation
      const params = new URLSearchParams({
        template: '1', // À adapter selon la règle d'évaluation
        target: evaluation.cible.matricule
      });
      window.location.href = `/common/evaluations/create?${params.toString()}`;
    }
  };

  const handleViewEvaluation = (evaluation: EvaluationACompleter) => {
    if (evaluation.evaluation?.id) {
      window.location.href = `/common/evaluations/${evaluation.evaluation.id}`;
    }
  };
  
  return (
    <AppLayout
      user={user}
      pageTitle="Évaluations à compléter"
    >
      <Head title="Évaluations à compléter - SABC Évaluation 360°" />
      
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-sabc-gray-900">Évaluations à compléter</h1>
            <p className="text-sabc-gray-600 mt-1">Selon votre rôle {user?.role} et les règles SABC</p>
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtrer
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sabc-gray-600">À faire</p>
                  <p className="text-2xl font-bold text-sabc-red-primary">{statistiques.total_a_faire}</p>
                </div>
                <Clock className="h-8 w-8 text-sabc-red-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sabc-gray-600">À terminer</p>
                  <p className="text-2xl font-bold text-sabc-accent">{statistiques.total_a_terminer}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-sabc-accent" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sabc-gray-600">Total</p>
                  <p className="text-2xl font-bold text-sabc-gray-900">{statistiques.total_general}</p>
                </div>
                <Users className="h-8 w-8 text-sabc-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Évaluations par type */}
        <div className="space-y-6">
          {Object.entries(evaluations).map(([type, evaluationsList]) => {
            if (evaluationsList.length === 0) return null;
            
            return (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getTypeIcon(type)}
                    {getTypeLabel(type)}
                    <Badge variant="outline">{evaluationsList.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {evaluationsList.map((evaluation: EvaluationACompleter, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-sabc-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <h4 className="font-medium text-sabc-gray-900">
                                {evaluation.cible.prenom} {evaluation.cible.nom}
                              </h4>
                              <p className="text-sm text-sabc-gray-600">
                                {evaluation.cible.role} • {evaluation.cible.region_nom}
                              </p>
                            </div>
                            {getStatutBadge(evaluation.statut)}
                          </div>
                          
                          {evaluation.evaluation && (
                            <div className="mt-2">
                              <div className="flex items-center gap-2">
                                <div className="w-32 bg-sabc-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-sabc-red-primary h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${evaluation.evaluation.progress}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-sabc-gray-600">
                                  {evaluation.evaluation.progress}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-sabc-gray-500">
                            Échéance: {new Date(evaluation.deadline).toLocaleDateString('fr-FR')}
                          </p>
                          
                          {evaluation.statut === 'a_faire' ? (
                            <Button 
                              onClick={() => handleStartEvaluation(evaluation)}
                              size="sm"
                              className="bg-sabc-red-primary hover:bg-sabc-red-dark"
                            >
                              Commencer
                            </Button>
                          ) : (
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleStartEvaluation(evaluation)}
                                variant="outline"
                                size="sm"
                              >
                                Continuer
                              </Button>
                              {evaluation.evaluation && (
                                <Button 
                                  onClick={() => handleViewEvaluation(evaluation)}
                                  variant="ghost"
                                  size="sm"
                                >
                                  Voir
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {statistiques.total_general === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-sabc-green mx-auto mb-4" />
              <h3 className="text-lg font-medium text-sabc-gray-900 mb-2">
                Aucune évaluation en attente
              </h3>
              <p className="text-sabc-gray-600">
                Vous êtes à jour avec toutes vos évaluations selon les règles SABC.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default EvaluationPendingPage;
