import React, { useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';

/**
 * Page d'index du tableau de bord qui redirige vers le tableau de bord spécifique au rôle
 * Conforme aux règles métier SABC pour la hiérarchie organisationnelle
 */
const DashboardIndex: React.FC = () => {
  const { user } = useAuth();
  
  // Redirection automatique vers le tableau de bord spécifique au rôle
  useEffect(() => {
    if (user) {
      // Dans un cas réel, cette logique serait basée sur le rôle de l'utilisateur
      // Pour l'instant, nous proposons simplement les différents tableaux de bord
      // La redirection automatique sera implémentée une fois que l'authentification sera en place
    }
  }, [user]);

  // Fonction pour naviguer vers le tableau de bord spécifique au rôle
  const navigateToDashboard = (role: string) => {
    router.visit(`/dashboard/${role}`);
  };

  // Mock user pour le layout
  const mockUser = {
    name: 'Utilisateur SABC',
    email: 'user@sabc.cm',
    role: 'Utilisateur',
    avatar: undefined
  };

  return (
    <AppLayout
      user={mockUser}
      notifications={[]}
    >
      <Head title="Tableau de bord - SABC Évaluation 360°" />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-sabc-gray-900">Bienvenue sur SABC Évaluation 360°</h1>
        
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Sélectionnez votre tableau de bord</CardTitle>
              <CardDescription>
                Choisissez le tableau de bord correspondant à votre rôle dans l'organisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sabc-gray-600">
                Dans une version complète de l'application, vous seriez automatiquement redirigé vers le tableau de bord correspondant à votre rôle.
                Pour les besoins de test, veuillez sélectionner un rôle ci-dessous :
              </p>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Carte pour l'Administrateur */}
                <Card className="border-l-4 border-l-sabc-red-primary bg-sabc-red-light/10">
                  <CardHeader>
                    <CardTitle>Administrateur (ADMIN)</CardTitle>
                    <CardDescription>Gestion complète du système</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-sabc-gray-600">
                      Accédez à la gestion des utilisateurs, des rôles, des régions et des configurations du système.
                    </p>
                    <Button onClick={() => navigateToDashboard('admin')}>
                      Accéder au tableau de bord Admin
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Carte pour le Directeur Régional */}
                <Card className="border-l-4 border-l-sabc-red-primary">
                  <CardHeader>
                    <CardTitle>Directeur Régional (DR)</CardTitle>
                    <CardDescription>Vue stratégique de la région</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-sabc-gray-600">
                      Accédez aux métriques de performance régionales, comparaisons entre services, et gestion des talents.
                    </p>
                    <Button onClick={() => navigateToDashboard('dr')}>
                      Accéder au tableau de bord DR
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Carte pour le Chef Département Trade */}
                <Card className="border-l-4 border-l-sabc-accent">
                  <CardHeader>
                    <CardTitle>Chef Département Trade (CDTT)</CardTitle>
                    <CardDescription>Performance départementale</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-sabc-gray-600">
                      Visualisez les performances de votre département, comparaisons commercial vs marketing.
                    </p>
                    <Button onClick={() => navigateToDashboard('cdtt')}>
                      Accéder au tableau de bord CDTT
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Carte pour le Chef Service Commercial */}
                <Card className="border-l-4 border-l-sabc-info">
                  <CardHeader>
                    <CardTitle>Chef Service Commercial (CSC)</CardTitle>
                    <CardDescription>Gestion d'équipe commerciale</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-sabc-gray-600">
                      Suivez les métriques de votre équipe commerciale et le développement des talents.
                    </p>
                    <Button onClick={() => navigateToDashboard('csc')}>
                      Accéder au tableau de bord CSC
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Carte pour le Chef District Vente */}
                <Card className="border-l-4 border-l-sabc-success">
                  <CardHeader>
                    <CardTitle>Chef District Vente (CDV)</CardTitle>
                    <CardDescription>Supervision district de vente</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-sabc-gray-600">
                      Gérez les performances de votre district et supervisez vos chefs de secteur.
                    </p>
                    <Button onClick={() => navigateToDashboard('cdv')}>
                      Accéder au tableau de bord CDV
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Carte pour le Chef de Secteur */}
                <Card className="border-l-4 border-l-sabc-warning">
                  <CardHeader>
                    <CardTitle>Chef de Secteur (CDS)</CardTitle>
                    <CardDescription>Gestion opérationnelle</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-sabc-gray-600">
                      Suivez votre performance individuelle et votre progression professionnelle.
                    </p>
                    <Button onClick={() => navigateToDashboard('cds')}>
                      Accéder au tableau de bord CDS
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardIndex;
