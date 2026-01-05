import React, { useState, useEffect, useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useAuth } from '@/Hooks/useAuth';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Badge } from '@/Components/UI/Badge/Badge';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/UI/Tabs/Tabs';
import { Progress } from '@/Components/UI/Progress/Progress';
import { EvaluationStats, type StatItem } from '@/Components/Dashboard/EvaluationStats';
import { 
  BarChart2, 
  AlertCircle, 
  Calendar,
  Users,
  ClipboardList,
  Settings,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { RoleGuard } from '@/Components/Auth/RoleGuard';



interface Period {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  completion_rate: number;
}

interface RegionStats {
  region_name: string;
  total_evaluations: number;
  completion_rate: number;
  average_score: number;
}

const EvaluationManagementPage = () => {
  const { user, isLoading } = useAuth();
  const page = usePage<{ auth?: { user?: any } }>();
  const inertiaUser = page.props.auth?.user;
  const effectiveUser = useMemo(() => user ?? inertiaUser ?? null, [user, inertiaUser]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [regionStats, setRegionStats] = useState<RegionStats[]>([]);
  const [globalStats, setGlobalStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');


  // Simuler le chargement des données depuis l'API
  useEffect(() => {
    // Dans une implémentation réelle, ces données viendraient de l'API
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Simulation de l'appel API
        setTimeout(() => {
          // Périodes d'évaluation
          setPeriods([
            {
              id: '1',
              name: 'S1 2025',
              start_date: '2025-01-01',
              end_date: '2025-06-30',
              is_active: false,
              completion_rate: 95,
            },
            {
              id: '2',
              name: 'S2 2025',
              start_date: '2025-07-01',
              end_date: '2025-12-31',
              is_active: true,
              completion_rate: 45,
            },
            {
              id: '3',
              name: 'S1 2026',
              start_date: '2026-01-01',
              end_date: '2026-06-30',
              is_active: false,
              completion_rate: 0,
            },
          ]);
          
          // Statistiques par région
          setRegionStats([
            {
              region_name: 'Littoral',
              total_evaluations: 245,
              completion_rate: 78,
              average_score: 82,
            },
            {
              region_name: 'Centre',
              total_evaluations: 198,
              completion_rate: 65,
              average_score: 76,
            },
            {
              region_name: 'Ouest',
              total_evaluations: 120,
              completion_rate: 52,
              average_score: 71,
            },
            {
              region_name: 'Nord',
              total_evaluations: 85,
              completion_rate: 48,
              average_score: 68,
            },
          ]);
          
          // Statistiques globales
          setGlobalStats([
            {
              label: 'Total évaluations',
              value: 648,
              previousValue: 578,
              change: 12,
              changeType: 'positive',
              format: 'number',
              icon: EvaluationStats.icons.Completion,
              variant: 'primary'
            },
            {
              label: 'Utilisateurs actifs',
              value: 45,
              previousValue: 42,
              change: 7,
              changeType: 'positive',
              format: 'number',
              icon: EvaluationStats.icons.Team,
              variant: 'info'
            },
            {
              label: 'Score moyen',
              value: 76,
              previousValue: 78,
              change: -3,
              changeType: 'negative',
              format: 'percentage',
              icon: EvaluationStats.icons.Performance,
              variant: 'success'
            },
            {
              label: 'Templates actifs',
              value: 5,
              previousValue: 5,
              change: 0,
              changeType: 'neutral',
              format: 'number',
              icon: <Settings className="h-5 w-5" />,
              variant: 'default'
            }
          ]);
          
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

  const getActivePeriod = () => {
    return periods.find(period => period.is_active) || null;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  const getProgressColor = (value: number) => {
    if (value < 30) return 'bg-sabc-red-primary';
    if (value < 70) return 'bg-sabc-accent';
    return 'bg-sabc-success';
  };

  const handleCreatePeriod = () => {
    // Rediriger vers la page de création de période
    window.location.href = '/admin/evaluations/periods/create';
  };

  const handleManagePeriod = (id: string) => {
    // Rediriger vers la page de gestion de la période
    window.location.href = `/admin/evaluations/periods/${id}`;
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
    <RoleGuard
      allowed={["ADMIN"]}
      userRoleName={effectiveUser?.role_nom ?? effectiveUser?.role}
      fallback={isLoading ? <div className="py-10 text-center text-sm text-sabc-gray-500">Chargement…</div> : undefined}
    >
    <AppLayout user={adaptedUser}>
      <Head title="Gestion Globale des Évaluations" />
      
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-sabc-gray-900">Gestion Globale des Évaluations</h1>
          <Button 
            onClick={() => window.location.href = '/admin/evaluations/templates'}
            className="flex items-center gap-2 bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
          >
            <Plus className="h-4 w-4" />
            Gérer les templates
          </Button>
        </div>

        {error && (
          <Alert className="mb-6 bg-sabc-red-light border-sabc-red-primary">
            <AlertCircle className="h-4 w-4 text-sabc-red-primary" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="periods">Périodes d'évaluation</TabsTrigger>
            <TabsTrigger value="regions">Performance par région</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            {loading ? (
              <p className="text-center py-4">Chargement des données...</p>
            ) : (
              <>
                {/* Période active */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="mr-2 h-5 w-5 text-sabc-red-primary" />
                      Période d'évaluation active
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getActivePeriod() ? (
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{getActivePeriod()?.name}</h3>
                          <p className="text-sm text-sabc-gray-400">
                            Du {formatDate(getActivePeriod()?.start_date || '')} au {formatDate(getActivePeriod()?.end_date || '')}
                          </p>
                        </div>
                        <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end">
                          <div className="flex items-center mb-2">
                            <span className="text-sm font-medium mr-2">Taux de complétion:</span>
                            <span className="font-bold">{getActivePeriod()?.completion_rate}%</span>
                          </div>
                          <div className="w-full md:w-64">
                            <Progress 
                              value={getActivePeriod()?.completion_rate} 
                              className={getProgressColor(getActivePeriod()?.completion_rate || 0)}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Alert className="bg-sabc-gray-100">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Aucune période active</AlertTitle>
                        <AlertDescription>
                          Aucune période d'évaluation n'est actuellement active.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
                
                {/* Statistiques globales */}
                <EvaluationStats
                  title="Statistiques globales"
                  description="Vue d'ensemble des évaluations"
                  stats={globalStats}
                  loading={loading}
                  layout="grid"
                  columns={4}
                  className="mb-6"
                />
                
                {/* Actions rapides */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actions rapides</CardTitle>
                    <CardDescription>Accès rapide aux fonctionnalités principales</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      className="flex justify-between items-center bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
                      onClick={() => window.location.href = '/admin/evaluations/templates'}
                    >
                      <span>Gérer les templates</span>
                      <ArrowUpRight className="h-4 w-4 ml-2" />
                    </Button>
                    <Button 
                      className="flex justify-between items-center bg-sabc-accent hover:bg-sabc-accent-dark text-white"
                      onClick={() => window.location.href = '/admin/evaluations/history'}
                    >
                      <span>Voir l'historique</span>
                      <ArrowUpRight className="h-4 w-4 ml-2" />
                    </Button>
                    <Button 
                      className="flex justify-between items-center bg-sabc-info hover:bg-sabc-info-dark text-white"
                      onClick={() => window.location.href = '/admin/analytics'}
                    >
                      <span>Consulter les analytics</span>
                      <ArrowUpRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="periods" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button 
                className="bg-sabc-red-primary hover:bg-sabc-red-dark text-white"
                onClick={handleCreatePeriod}
              >
                Créer une période
              </Button>
            </div>
            
            {loading ? (
              <p className="text-center py-4">Chargement des périodes...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {periods.map((period) => (
                  <Card key={period.id} className={period.is_active ? 'border-sabc-red-primary' : ''}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle>{period.name}</CardTitle>
                        {period.is_active && (
                          <Badge className="bg-sabc-red-primary text-white">Active</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-sabc-gray-400 mb-4">
                        Du {formatDate(period.start_date)} au {formatDate(period.end_date)}
                      </p>
                      
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm">Taux de complétion</span>
                          <span className="text-sm font-medium">{period.completion_rate}%</span>
                        </div>
                        <Progress 
                          value={period.completion_rate} 
                          className={getProgressColor(period.completion_rate)}
                        />
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleManagePeriod(period.id)}
                      >
                        Gérer cette période
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="regions" className="mt-6 space-y-6">
            {loading ? (
              <p className="text-center py-4">Chargement des données régionales...</p>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {regionStats.map((region) => (
                    <Card key={region.region_name} className="border-sabc-gray-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{region.region_name}</CardTitle>
                        <CardDescription>{region.total_evaluations} évaluations suivies</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Complétion</span>
                          <span className="font-semibold">{region.completion_rate}%</span>
                        </div>
                        <Progress value={region.completion_rate} className={getProgressColor(region.completion_rate)} />
                        <div className="flex justify-between">
                          <span>Score moyen</span>
                          <span className="font-semibold">{region.average_score}/100</span>
                        </div>
                        <Progress value={region.average_score} className={getProgressColor(region.average_score)} />
                        <Button
                          variant="outline"
                          className="w-full text-xs"
                          onClick={() => window.location.href = `/admin/regions/${region.region_name.toLowerCase()}/evaluations`}
                        >
                          Explorer les détails
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
    </RoleGuard>
  );
};

export default EvaluationManagementPage;
