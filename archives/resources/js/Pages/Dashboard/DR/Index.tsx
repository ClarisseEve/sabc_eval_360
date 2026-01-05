import React from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Progress } from '@/Components/UI/Progress/Progress';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { BarChart2, TrendingUp, Users, AlertCircle } from 'lucide-react';

/**
 * Tableau de bord du Directeur Régional (DR)
 * 
 * Spécifications selon les règles métier SABC :
 * - Couleur dominante : Rouge SABC #E53E3E
 * - Layout : Grid 3 colonnes desktop
 * - KPIs : 4 métriques principales en header
 * - Graphiques : Bar charts performance par service
 * - Section "Actions Requises" avec alertes colorées
 */
const DRDashboard: React.FC = () => {
  // Récupérer les données de l'utilisateur depuis Inertia
  const { auth } = usePage().props as any;
  
  // Extraire les informations de l'utilisateur
  const userName = auth?.user?.name || 'Username';
  const userEmail = auth?.user?.email || 'user@sabc.cm';
  const userRole = auth?.user?.role?.nom_role || 'userRole';
  const userRegion = auth?.user?.region?.nom_region || 'userRegion';
  const estTaniere = auth?.user?.region?.est_taniere || true;

  // Fonction de déconnexion qui crée et soumet un formulaire avec jeton CSRF
  const handleLogout = () => {
    // Créer un formulaire temporaire
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/logout';
    form.style.display = 'none';
    
    // Ajouter le jeton CSRF
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = '_token';
    csrfInput.value = csrfToken || '';
    
    // Ajouter l'input au formulaire
    form.appendChild(csrfInput);
    
    // Ajouter le formulaire au document, le soumettre, puis le supprimer
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  // Construction de l'objet user pour AppLayout
  const user = {
    name: userName,
    email: userEmail,
    role: userRole,
    avatar: undefined
  };

  // Construction des notifications (exemple)
  const notifications = [
    {
      id: '1',
      title: 'Évaluations en attente',
      message: '5 évaluations requièrent votre attention',
      status: 'warning' as 'warning' | 'info' | 'error' | 'success',
      read: false,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Nouvelle performance',
      message: 'Les rapports mensuels sont disponibles',
      status: 'info' as 'warning' | 'info' | 'error' | 'success',
      read: true,
      createdAt: new Date().toISOString()
    }
  ];

  return (
    <AppLayout 
      user={user} 
      notifications={notifications}
      onLogout={handleLogout}
    >
      <Head title="Tableau de bord Directeur Régional - SABC Évaluation 360°" />
      
      <div className="space-y-6">
        {/* En-tête avec informations de région */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border border-sabc-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-sabc-gray-900">Tableau de bord Directeur Régional</h1>
            <div className="flex items-center mt-1">
              <Badge variant={estTaniere ? "destructive" : "outline"} className="mr-2">
                {estTaniere ? 'Tanière' : 'Non-Tanière'}
              </Badge>
              <span className="text-sabc-gray-600">Région: <span className="font-medium text-sabc-red-primary">{userRegion}</span></span>
            </div>
          </div>
          <Button variant="destructive">
            Nouvelle évaluation
          </Button>
        </div>

        {/* KPIs - 4 métriques principales */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* KPI 1 - Performance Globale */}
          <Card className="border-l-4 border-l-sabc-red-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sabc-gray-500">Performance Globale</p>
                  <h3 className="mt-1 text-2xl font-bold text-sabc-gray-900">87%</h3>
                </div>
                <div className="rounded-full bg-sabc-red-light p-2 text-sabc-red-primary">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-2 flex items-center">
                <span className="text-xs font-medium text-sabc-success">↑ 2.5%</span>
                <span className="ml-1 text-xs text-sabc-gray-500">vs période précédente</span>
              </div>
            </CardContent>
          </Card>
          
          {/* KPI 2 - Évaluations Complétées */}
          <Card className="border-l-4 border-l-sabc-success">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sabc-gray-500">Évaluations Complétées</p>
                  <h3 className="mt-1 text-2xl font-bold text-sabc-gray-900">24/30</h3>
                </div>
                <div className="rounded-full bg-green-100 p-2 text-sabc-success">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-2">
                <Progress value={80} className="h-2" />
                <span className="mt-1 text-xs text-sabc-gray-500">80% complété</span>
              </div>
            </CardContent>
          </Card>
          
          {/* KPI 3 - Performance Commerciale */}
          <Card className="border-l-4 border-l-sabc-accent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sabc-gray-500">Performance Commerciale</p>
                  <h3 className="mt-1 text-2xl font-bold text-sabc-gray-900">92%</h3>
                </div>
                <div className="rounded-full bg-orange-100 p-2 text-sabc-accent">
                  <BarChart2 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-2 flex items-center">
                <span className="text-xs font-medium text-sabc-success">↑ 4.3%</span>
                <span className="ml-1 text-xs text-sabc-gray-500">vs période précédente</span>
              </div>
            </CardContent>
          </Card>
          
          {/* KPI 4 - Actions Requises */}
          <Card className="border-l-4 border-l-sabc-warning">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-sabc-gray-500">Actions Requises</p>
                  <h3 className="mt-1 text-2xl font-bold text-sabc-gray-900">5</h3>
                </div>
                <div className="rounded-full bg-yellow-100 p-2 text-sabc-warning">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-2 flex items-center">
                <Badge variant="outline" className="text-xs">3 Urgentes</Badge>
                <Badge variant="outline" className="ml-2 text-xs">2 Normales</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Contenu principal en 3 colonnes */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Colonne 1 - Performance par Service */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Performance par Service</CardTitle>
              <CardDescription>Comparaison des services commerciaux et marketing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Service Commercial */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">Service Commercial</span>
                    <span className="text-sm font-medium">92%</span>
                  </div>
                  <Progress value={92} className="h-2 bg-sabc-gray-200" />
                </div>
                
                {/* Service Marketing */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">Service Marketing</span>
                    <span className="text-sm font-medium">78%</span>
                  </div>
                  <Progress value={78} className="h-2 bg-sabc-gray-200" />
                </div>
                
                {/* Département Ventes */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">Département Ventes</span>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                  <Progress value={85} className="h-2 bg-sabc-gray-200" />
                </div>
                
                {/* Département Distribution */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">Département Distribution</span>
                    <span className="text-sm font-medium">70%</span>
                  </div>
                  <Progress value={70} className="h-2 bg-sabc-gray-200" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Colonne 2 - Actions Requises */}
          <Card>
            <CardHeader>
              <CardTitle>Actions Requises</CardTitle>
              <CardDescription>Tâches nécessitant votre attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border border-sabc-red-light bg-sabc-red-light/20 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sabc-red-primary">Évaluations en retard</span>
                    <Badge variant="destructive">Urgent</Badge>
                  </div>
                  <p className="mt-1 text-sm text-sabc-gray-600">3 évaluations dépassent le délai de 7 jours</p>
                  <Button variant="destructive" size="sm" className="mt-2">Voir détails</Button>
                </div>
                
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sabc-warning">Validation requise</span>
                    <Badge variant="outline" className="text-sabc-warning border-sabc-warning">En attente</Badge>
                  </div>
                  <p className="mt-1 text-sm text-sabc-gray-600">2 évaluations nécessitent votre validation</p>
                  <Button variant="outline" size="sm" className="mt-2">Examiner</Button>
                </div>
                
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sabc-info">Rapport mensuel</span>
                    <Badge variant="outline" className="text-sabc-info border-sabc-info">Nouveau</Badge>
                  </div>
                  <p className="mt-1 text-sm text-sabc-gray-600">Le rapport de performance est disponible</p>
                  <Button variant="outline" size="sm" className="mt-2">Consulter</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default DRDashboard;
