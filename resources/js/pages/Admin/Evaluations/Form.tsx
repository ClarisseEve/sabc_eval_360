import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { RoleGuard } from '@/Components/Auth/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Input } from '@/Components/UI/Input/Input';
import { Textarea } from '@/Components/UI/Textarea/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/UI/Select/Select';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert/Alert';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/UI/Tabs/Tabs';
import { Progress } from '@/Components/UI/Progress/Progress';
import { AlertCircle, Check, ChevronLeft, ChevronRight, Save } from 'lucide-react';

interface CriteriaGroup {
  id: string;
  title: string;
  description: string;
  criteria: Criteria[];
}

interface Criteria {
  id: string;
  description: string;
  weight: number;
  score?: number;
  comment?: string;
}

interface EvaluationTarget {
  matricule: string;
  name: string;
  role: string;
  region: string;
}

const EvaluationFormPage = () => {
  const { user, isLoading } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [criteriaGroups, setCriteriaGroups] = useState<CriteriaGroup[]>([]);
  const [targets, setTargets] = useState<EvaluationTarget[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('general');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'brouillon',
  });

  // Simuler le chargement des données depuis l'API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simuler un délai de chargement
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Données simulées pour les cibles d'évaluation
        const mockTargets = [
          { matricule: 'US-02', name: 'Jean Dupont', role: 'Chef Service Commercial', region: 'Littoral' },
          { matricule: 'US-03', name: 'Marie Mbarga', role: 'Trade Marketing Operator', region: 'Centre' },
          { matricule: 'US-04', name: 'Paul Biya', role: 'Chef de Secteur', region: 'Ouest' },
        ];

        // Données simulées pour les critères d'évaluation
        const mockCriteriaGroups = [
          {
            id: 'cg-1',
            title: 'Compétences Techniques',
            description: 'Évaluation des compétences techniques et professionnelles',
            criteria: [
              { id: 'c-1', description: 'Maîtrise des outils et processus', weight: 20, score: 0 },
              { id: 'c-2', description: 'Résolution de problèmes techniques', weight: 15, score: 0 },
              { id: 'c-3', description: 'Application des connaissances métier', weight: 15, score: 0 },
            ]
          },
          {
            id: 'cg-2',
            title: 'Compétences Managériales',
            description: 'Évaluation des capacités de gestion et leadership',
            criteria: [
              { id: 'c-4', description: 'Communication efficace', weight: 10, score: 0 },
              { id: 'c-5', description: 'Gestion d\'équipe', weight: 15, score: 0 },
              { id: 'c-6', description: 'Prise de décision', weight: 10, score: 0 },
            ]
          },
          {
            id: 'cg-3',
            title: 'Valeurs et Comportement',
            description: 'Évaluation de l\'adhésion aux valeurs de l\'entreprise',
            criteria: [
              { id: 'c-7', description: 'Intégrité et éthique professionnelle', weight: 5, score: 0 },
              { id: 'c-8', description: 'Esprit d\'équipe et collaboration', weight: 5, score: 0 },
              { id: 'c-9', description: 'Orientation résultats', weight: 5, score: 0 },
            ]
          }
        ];

        setTargets(mockTargets);
        setCriteriaGroups(mockCriteriaGroups);
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement des données');
        setLoading(false);
        console.error(err);
      }
    };
    
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTargetChange = (value: string) => {
    setSelectedTarget(value);
  };

  const handleScoreChange = (groupId: string, criteriaId: string, value: string) => {
    const score = parseInt(value, 10);
    if (isNaN(score) || score < 1 || score > 5) return;

    setCriteriaGroups(prev => 
      prev.map(group => 
        group.id === groupId 
          ? {
              ...group,
              criteria: group.criteria.map(criteria => 
                criteria.id === criteriaId 
                  ? { ...criteria, score }
                  : criteria
              )
            }
          : group
      )
    );
  };

  const handleCommentChange = (groupId: string, criteriaId: string, comment: string) => {
    setCriteriaGroups(prev => 
      prev.map(group => 
        group.id === groupId 
          ? {
              ...group,
              criteria: group.criteria.map(criteria => 
                criteria.id === criteriaId 
                  ? { ...criteria, comment }
                  : criteria
              )
            }
          : group
      )
    );
  };

  const calculateTotalScore = () => {
    let totalScore = 0;
    let totalWeight = 0;
    
    criteriaGroups.forEach(group => {
      group.criteria.forEach(criteria => {
        if (criteria.score) {
          totalScore += criteria.score * criteria.weight;
          totalWeight += criteria.weight;
        }
      });
    });
    
    return totalWeight > 0 ? Math.round((totalScore / (totalWeight * 5)) * 100) : 0;
  };

  const getCompletionRate = () => {
    let total = 0;
    let completed = 0;
    
    criteriaGroups.forEach(group => {
      group.criteria.forEach(criteria => {
        total++;
        if (criteria.score) completed++;
      });
    });
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const handleSaveDraft = () => {
    setSaving(true);
    
    // Simuler un délai de sauvegarde
    setTimeout(() => {
      setSuccess('Brouillon sauvegardé avec succès');
      setSaving(false);
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(null), 3000);
    }, 1000);
  };

  const handleSubmit = () => {
    // Vérifier que tous les champs obligatoires sont remplis
    if (!selectedTarget) {
      setError('Veuillez sélectionner une personne à évaluer');
      return;
    }
    
    const completionRate = getCompletionRate();
    if (completionRate < 100) {
      setError('Veuillez remplir tous les critères avant de soumettre l\'évaluation');
      return;
    }
    
    setSaving(true);
    
    // Simuler un délai de soumission
    setTimeout(() => {
      setSuccess('Évaluation soumise avec succès');
      setSaving(false);
      setFormData(prev => ({ ...prev, status: 'soumis' }));
      
      // Rediriger vers la page d'historique après 2 secondes
      setTimeout(() => {
        window.location.href = '/admin/evaluations/history';
      }, 2000);
    }, 1500);
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
    <RoleGuard allowed={['ADMIN']} userRoleName={user?.role_nom}>
      <AppLayout user={adaptedUser}>
      <Head title="Formulaire d'Évaluation" />
      
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-sabc-gray-900">Formulaire d'Évaluation</h1>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Retour
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

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-600">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle>Succès</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sabc-red-primary"></div>
          </div>
        ) : (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Informations Générales</CardTitle>
                <CardDescription>Complétez les informations de base pour cette évaluation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Personne à évaluer</label>
                  <Select value={selectedTarget} onValueChange={handleTargetChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner une personne" />
                    </SelectTrigger>
                    <SelectContent>
                      {targets.map(target => (
                        <SelectItem key={target.matricule} value={target.matricule}>
                          {target.name} - {target.role} ({target.region})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="title">Titre de l'évaluation</label>
                  <Input 
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Ex: Évaluation semestrielle S1 2025"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="description">Description / Commentaire général</label>
                  <Textarea 
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Ajoutez un commentaire général sur cette évaluation"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="mb-4">
                <TabsTrigger value="general">Informations Générales</TabsTrigger>
                {criteriaGroups.map(group => (
                  <TabsTrigger key={group.id} value={group.id}>
                    {group.title}
                  </TabsTrigger>
                ))}
                <TabsTrigger value="summary">Résumé</TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations Générales</CardTitle>
                    <CardDescription>Complétez les informations de base pour cette évaluation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Personne à évaluer</label>
                      <Select value={selectedTarget} onValueChange={handleTargetChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner une personne" />
                        </SelectTrigger>
                        <SelectContent>
                          {targets.map(target => (
                            <SelectItem key={target.matricule} value={target.matricule}>
                              {target.name} - {target.role} ({target.region})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="title">Titre de l'évaluation</label>
                      <Input 
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Ex: Évaluation semestrielle S1 2025"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="description">Description / Commentaire général</label>
                      <Textarea 
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Ajoutez un commentaire général sur cette évaluation"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => window.history.back()}>Annuler</Button>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={handleSaveDraft}
                        disabled={saving}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Enregistrer le brouillon
                      </Button>
                      <Button 
                        onClick={() => setActiveTab(criteriaGroups[0]?.id || 'summary')}
                        className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
                      >
                        Continuer
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>

              {criteriaGroups.map((group, groupIndex) => (
                <TabsContent key={group.id} value={group.id}>
                  <Card>
                    <CardHeader>
                      <CardTitle>{group.title}</CardTitle>
                      <CardDescription>{group.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {group.criteria.map((criteria, criteriaIndex) => (
                          <div key={criteria.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium">{criteriaIndex + 1}. {criteria.description}</h4>
                                <p className="text-sm text-sabc-gray-400">Poids: {criteria.weight}%</p>
                              </div>
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map(score => (
                                  <button
                                    key={score}
                                    type="button"
                                    onClick={() => handleScoreChange(group.id, criteria.id, score.toString())}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      criteria.score === score 
                                        ? 'bg-sabc-red-primary text-white' 
                                        : 'bg-sabc-gray-100 text-sabc-gray-800 hover:bg-sabc-gray-200'
                                    }`}
                                  >
                                    {score}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Commentaire {criteria.score && criteria.score < 3 ? '(obligatoire)' : '(optionnel)'}
                              </label>
                              <Textarea 
                                value={criteria.comment || ''}
                                onChange={(e) => handleCommentChange(group.id, criteria.id, e.target.value)}
                                placeholder="Ajoutez un commentaire pour justifier votre notation"
                                rows={2}
                                className={criteria.score && criteria.score < 3 && !criteria.comment ? 'border-sabc-red-primary' : ''}
                              />
                              {criteria.score && criteria.score < 3 && !criteria.comment && (
                                <p className="text-xs text-sabc-red-primary mt-1">
                                  Un commentaire est obligatoire pour les notes inférieures à 3
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab(groupIndex === 0 ? 'general' : criteriaGroups[groupIndex - 1].id)}
                        className="flex items-center gap-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Précédent
                      </Button>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={handleSaveDraft}
                          disabled={saving}
                          className="flex items-center gap-2"
                        >
                          <Save className="h-4 w-4" />
                          Enregistrer le brouillon
                        </Button>
                        <Button 
                          onClick={() => setActiveTab(groupIndex < criteriaGroups.length - 1 ? criteriaGroups[groupIndex + 1].id : 'summary')}
                          className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white flex items-center gap-2"
                        >
                          {groupIndex < criteriaGroups.length - 1 ? 'Continuer' : 'Voir le résumé'}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </TabsContent>
              ))}

              <TabsContent value="summary">
                <Card>
                  <CardHeader>
                    <CardTitle>Résumé de l'Évaluation</CardTitle>
                    <CardDescription>Vérifiez les informations avant de soumettre l'évaluation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-2">Informations Générales</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-sabc-gray-50 p-4 rounded-md">
                          <div>
                            <p className="text-sm text-sabc-gray-400">Personne évaluée</p>
                            <p className="font-medium">
                              {selectedTarget ? targets.find(t => t.matricule === selectedTarget)?.name || 'Non sélectionné' : 'Non sélectionné'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-sabc-gray-400">Rôle / Région</p>
                            <p className="font-medium">
                              {selectedTarget ? 
                                `${targets.find(t => t.matricule === selectedTarget)?.role || ''} / ${targets.find(t => t.matricule === selectedTarget)?.region || ''}` : 
                                'Non sélectionné'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-sabc-gray-400">Titre</p>
                            <p className="font-medium">{formData.title || 'Non défini'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-sabc-gray-400">Statut</p>
                            <Badge variant="outline" className={
                              formData.status === 'brouillon' ? 'bg-sabc-gray-100 text-sabc-gray-800' : 
                              formData.status === 'soumis' ? 'bg-sabc-accent-light text-sabc-accent' : 
                              'bg-sabc-success text-white'
                            }>
                              {formData.status === 'brouillon' ? 'Brouillon' : 
                               formData.status === 'soumis' ? 'Soumis' : 'Validé'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium mb-2">Progression de l'évaluation</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Taux de complétion</span>
                            <span className="text-sm font-medium">{getCompletionRate()}%</span>
                          </div>
                          <Progress 
                            value={getCompletionRate()} 
                            className={getCompletionRate() < 100 ? 'bg-sabc-gray-200' : 'bg-sabc-success'}
                          />
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium mb-2">Score global</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Score calculé</span>
                            <span className="text-sm font-medium">{calculateTotalScore()}/100</span>
                          </div>
                          <Progress 
                            value={calculateTotalScore()} 
                            className={
                              calculateTotalScore() < 50 ? 'bg-sabc-red-primary' : 
                              calculateTotalScore() < 75 ? 'bg-sabc-accent' : 
                              'bg-sabc-success'
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium mb-4">Résumé des critères</h3>
                        <div className="space-y-4">
                          {criteriaGroups.map(group => (
                            <div key={group.id} className="border-b pb-4 last:border-b-0">
                              <h4 className="font-medium mb-2">{group.title}</h4>
                              <div className="space-y-2">
                                {group.criteria.map(criteria => (
                                  <div key={criteria.id} className="flex justify-between items-center">
                                    <span className="text-sm">{criteria.description}</span>
                                    <span className={`text-sm font-medium ${
                                      !criteria.score ? 'text-sabc-gray-400' :
                                      criteria.score < 3 ? 'text-sabc-red-primary' :
                                      criteria.score < 4 ? 'text-sabc-accent' :
                                      'text-sabc-success'
                                    }`}>
                                      {criteria.score || 'Non évalué'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {formData.description && (
                        <div>
                          <h3 className="font-medium mb-2">Commentaire général</h3>
                          <div className="bg-sabc-gray-50 p-4 rounded-md">
                            <p className="text-sm">{formData.description}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab(criteriaGroups[criteriaGroups.length - 1]?.id || 'general')}
                      className="flex items-center gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Précédent
                    </Button>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={handleSaveDraft}
                        disabled={saving}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Enregistrer le brouillon
                      </Button>
                      <Button 
                        onClick={handleSubmit}
                        disabled={saving || getCompletionRate() < 100 || !selectedTarget}
                        className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
                      >
                        Soumettre l'évaluation
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between">
                <Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Retour
                </Button>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Enregistrer le brouillon
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
                    disabled={saving || getCompletionRate() < 100}
                  >
                    Soumettre l'évaluation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
    </RoleGuard>
  );
};

export default EvaluationFormPage;
