import React from 'react';
import { Head } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Progress } from '@/Components/UI/Progress/Progress';
import { ArrowLeft, Award, Calendar, Building, Phone, Mail, Users, TrendingUp, Target } from 'lucide-react';
import { Link } from '@/lib/inertia-shim';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

/**
 * Page de détail d'un utilisateur pour l'administrateur
 * 
 * Spécifications selon les règles métier SABC :
 * - Affichage détaillé des informations utilisateur avec matrice de compétences
 * - Visualisation des évaluations reçues et données
 * - Plan de développement personnalisé
 * - Pairs à évaluer selon hiérarchie SABC
 */
interface UserData {
  id: string;
  name: string;
  username: string;
  matricule: string;
  email: string;
  phone: string;
  role: string;
  region: string;
  branche: string;
  manager: string;
  manager_matricule: string;
  date_embauche: string;
  niveau_hierarchique: number;
  status: string;
  derniere_connexion: string;
  evaluations_recues: number;
  evaluations_donnees: number;
  score_moyen: number;
}

interface Subordonne {
  id: string;
  name: string;
  matricule: string;
  role: string;
}

interface UserShowPageProps {
  auth: {
    user: {
      name: string;
      email: string;
      role: string;
      avatar?: string;
    }
  };
  user?: UserData;
  subordonnes?: Subordonne[];
}

const UserShowPage: React.FC<UserShowPageProps> = ({ auth, user, subordonnes }) => {
  // Couleurs SABC pour les graphiques
  const SABC_COLORS = {
    primary: '#E53E3E',
    accent: '#FF9800',
    success: '#48BB78',
    warning: '#D69E2E',
    error: '#E53E3E',
    info: '#3182CE',
    gray: '#9E9E9E'
  };

  // Données de démonstration si non fourni par les props
  const userData = user || {
    id: '1',
    name: 'Jean-Paul Mbarga',
    username: 'jpmb001',
    matricule: 'JPM001',
    email: 'jean-paul.mbarga@sabc.cm',
    phone: '+237 6 77 88 99 00',
    role: 'Chef de Secteur (CDS)',
    region: 'Littoral',
    branche: 'Commerciale',
    manager: 'Pierre Kouakam',
    manager_matricule: 'PKM002',
    date_embauche: '15/03/2020',
    niveau_hierarchique: 5,
    status: 'actif',
    derniere_connexion: '12/08/2023 14:30',
    evaluations_recues: 3,
    evaluations_donnees: 8,
    score_moyen: 3.7
  };

  // Matrice de compétences utilisateur (exemple basé sur évaluations reçues)
  const userCompetencies = [
    { competence: 'Communication', score: 4.2, max: 5 },
    { competence: 'Service Client', score: 4.5, max: 5 },
    { competence: 'Négociation', score: 2.7, max: 5 },
    { competence: 'Organisation', score: 3.8, max: 5 },
    { competence: 'Outils Digitaux', score: 2.5, max: 5 },
    { competence: 'Leadership', score: 3.2, max: 5 },
    { competence: 'Innovation', score: 3.0, max: 5 },
    { competence: 'Planification', score: 4.1, max: 5 }
  ];

  // Évolution des scores (6 derniers mois)
  const scoreEvolution = [
    { mois: 'Août', score: 3.2 },
    { mois: 'Sept', score: 3.4 },
    { mois: 'Oct', score: 3.6 },
    { mois: 'Nov', score: 3.5 },
    { mois: 'Déc', score: 3.8 },
    { mois: 'Jan', score: 3.7 }
  ];

  // Évaluations reçues par type
  const evaluationsByType = [
    { type: 'Auto-évaluation', count: 1, score: 3.5 },
    { type: 'Manager', count: 1, score: 4.2 },
    { type: 'Pairs', count: 2, score: 3.6 },
    { type: 'Subordonnés', count: 0, score: 0 }
  ];

  // Plan de développement suggéré
  const developmentPlan = [
    {
      competence: 'Négociation Commerciale',
      priorite: 'Haute',
      action: 'Formation Négociation Avancée',
      echeance: '25/07/2023',
      statut: 'Priorité'
    },
    {
      competence: 'Outils Digitaux',
      priorite: 'Haute',
      action: 'Atelier Outils Digitaux',
      echeance: '15/08/2023',
      statut: 'En cours'
    },
    {
      competence: 'Leadership',
      priorite: 'Moyenne',
      action: 'Mentorat avec P. Kouakam',
      echeance: '1 session/mois sur 3 mois',
      statut: 'En cours'
    }
  ];

  // Pairs à évaluer
  const peersToEvaluate = [
    {
      id: 'RM',
      nom: 'Robert Manga',
      role: 'Chef de Secteur (CDS)',
      statut: 'Évaluer',
      echeance: 'Contacté le 12/08/2023'
    },
    {
      id: 'SD',
      nom: 'Sophie Djoumessi',
      role: 'Chef de Secteur (CDS)',
      statut: 'Évaluer',
      echeance: ''
    },
    {
      id: 'LT',
      nom: 'Luc Tchuente',
      role: 'Chef de Secteur (CDS)',
      statut: 'Contacté le 12/08/2023',
      echeance: ''
    }
  ];

  return (
    <AppLayout
      user={auth.user}
      notifications={[]}
    >
      <Head title={`Profil: ${userData.name} - SABC Évaluation 360°`} />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Profil Utilisateur Détaillé</h1>
        </div>
        
        <div className="space-y-8">
          {/* Section Informations Personnelles */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Carte profil principal */}
            <Card className="lg:col-span-1">
              <CardHeader className="text-center">
                <div className="w-24 h-24 bg-sabc-red-primary text-white rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-4">
                  {userData.matricule.slice(0, 3)}
                </div>
                <CardTitle className="text-xl">{userData.name}</CardTitle>
                <CardDescription className="text-base font-medium">{userData.role}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-sabc-red-primary mb-1">{Math.round(userData.score_moyen * 20)}%</div>
                  <div className="text-sm text-sabc-gray-600">Performance Globale</div>
                  <Progress value={userData.score_moyen * 20} className="mt-2" />
                </div>
                
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="w-4 h-4 text-sabc-gray-500" />
                    <span>{userData.region} • {userData.branche}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-sabc-gray-500" />
                    <span>{userData.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-sabc-gray-500" />
                    <span>{userData.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-sabc-gray-500" />
                    <span>Embauché le {userData.date_embauche}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-sabc-gray-500" />
                    <span>Manager: {userData.manager}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center p-3 bg-sabc-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-sabc-gray-900">{userData.evaluations_recues}</div>
                    <div className="text-xs text-sabc-gray-600">Évaluations reçues</div>
                  </div>
                  <div className="text-center p-3 bg-sabc-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-sabc-gray-900">{userData.evaluations_donnees}</div>
                    <div className="text-xs text-sabc-gray-600">Évaluations données</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Matrice de compétences */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-sabc-red-primary" />
                  Profil de Compétences
                </CardTitle>
                <CardDescription>Matrice basée sur les évaluations reçues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={userCompetencies}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="competence" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10 }} />
                        <Radar name="Évaluation" dataKey="score" stroke={SABC_COLORS.primary} fill={SABC_COLORS.primary + '30'} strokeWidth={2} />
                        <Tooltip />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sabc-gray-900 mb-3 text-green-600">Points Forts</h4>
                      {userCompetencies
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 3)
                        .map((comp) => (
                          <div key={comp.competence} className="flex items-center justify-between mb-2">
                            <span className="text-sm text-sabc-gray-600">{comp.competence}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-sabc-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-sabc-success h-2 rounded-full" 
                                  style={{ width: `${(comp.score / 5) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-sabc-gray-900">{comp.score}/5</span>
                            </div>
                          </div>
                        ))}
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sabc-gray-900 mb-3 text-orange-600">Axes d'Amélioration</h4>
                      {userCompetencies
                        .sort((a, b) => a.score - b.score)
                        .slice(0, 3)
                        .map((comp) => (
                          <div key={comp.competence} className="flex items-center justify-between mb-2">
                            <span className="text-sm text-sabc-gray-600">{comp.competence}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-sabc-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-sabc-warning h-2 rounded-full" 
                                  style={{ width: `${(comp.score / 5) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-sabc-gray-900">{comp.score}/5</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section Évolution et Évaluations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Évolution des scores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-sabc-red-primary" />
                  Évolution de Performance
                </CardTitle>
                <CardDescription>Progression des 6 derniers mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scoreEvolution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                      <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="score" stroke={SABC_COLORS.primary} strokeWidth={3} name="Score moyen" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Évaluations par type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-sabc-red-primary" />
                  Évaluations Reçues
                </CardTitle>
                <CardDescription>Répartition par type d'évaluateur</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {evaluationsByType.map((evaluation) => (
                    <div key={evaluation.type} className="flex items-center justify-between p-3 bg-sabc-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sabc-gray-900">{evaluation.type}</div>
                        <div className="text-sm text-sabc-gray-600">{evaluation.count} évaluation(s)</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-sabc-red-primary">
                          {evaluation.count > 0 ? `${evaluation.score}/5` : 'N/A'}
                        </div>
                        {evaluation.count > 0 && (
                          <div className="w-16 bg-sabc-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-sabc-red-primary h-2 rounded-full" 
                              style={{ width: `${(evaluation.score / 5) * 100}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section Plan de Développement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-sabc-red-primary" />
                Plan de Développement
              </CardTitle>
              <CardDescription>Recommandations suite aux évaluations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {developmentPlan.map((plan, index) => (
                  <div key={index} className="border border-sabc-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-sabc-gray-900">{plan.action}</h4>
                          <Badge className={
                            plan.priorite === 'Haute' ? 'bg-sabc-error text-white' :
                            plan.priorite === 'Moyenne' ? 'bg-sabc-warning text-white' :
                            'bg-sabc-success text-white'
                          }>
                            {plan.priorite}
                          </Badge>
                        </div>
                        <p className="text-sm text-sabc-gray-600 mb-1">
                          Compétence ciblée: {plan.competence}
                        </p>
                        <p className="text-sm text-sabc-gray-500">
                          Échéance: {plan.echeance}
                        </p>
                      </div>
                      <Badge className={
                        plan.statut === 'Priorité' ? 'bg-sabc-error text-white' :
                        plan.statut === 'En cours' ? 'bg-sabc-warning text-white' :
                        'bg-sabc-success text-white'
                      }>
                        {plan.statut}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section Pairs à Évaluer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-sabc-red-primary" />
                Pairs à Évaluer
              </CardTitle>
              <CardDescription>Collègues en attente d'évaluation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-4 bg-sabc-accent-light rounded-lg">
                  <div className="text-2xl font-bold text-sabc-accent mb-1">1/3</div>
                  <div className="text-sm text-sabc-gray-600">Progression d'Évaluation</div>
                  <Progress value={33} className="mt-2" />
                </div>
                
                {peersToEvaluate.map((peer) => (
                  <div key={peer.id} className="flex items-center justify-between p-4 border border-sabc-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-sabc-red-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {peer.id}
                      </div>
                      <div>
                        <div className="font-medium text-sabc-gray-900">{peer.nom}</div>
                        <div className="text-sm text-sabc-gray-600">{peer.role}</div>
                        {peer.echeance && (
                          <div className="text-xs text-sabc-gray-500">{peer.echeance}</div>
                        )}
                      </div>
                    </div>
                    <Badge className={
                      peer.statut === 'Évaluer' ? 'bg-sabc-error text-white' : 'bg-sabc-warning text-white'
                    }>
                      {peer.statut}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default UserShowPage;
