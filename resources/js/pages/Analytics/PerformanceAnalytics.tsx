import * as React from 'react';
import { Head } from '@inertiajs/react';
import { ChevronDown, Download, Filter } from 'lucide-react';

// Layouts
import { AppLayout } from '@/layouts';

// Composants UI
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/Components/UI/Card/Card';
import { Button } from '@/Components/UI/Button/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/UI/Tabs/Tabs';
import { Badge } from '@/Components/UI/Badge/Badge';

// Composants de graphiques
import { BarChart } from '@/Components/UI/Charts/BarChart';
import { PieChart } from '@/Components/UI/Charts/PieChart';
import { RadarChart } from '@/Components/UI/Charts/RadarChart';
import { LineChart } from '@/Components/UI/Charts/LineChart';
import { HeatMap } from '@/Components/UI/Charts/HeatMap';

// Types
import { User } from '@/Types/User';
import { AnalyticsData } from '@/Types/AnalyticsData';

interface PerformanceAnalyticsProps {
  user: User;
  analyticsData: AnalyticsData;
}

export default function PerformanceAnalytics({ user, analyticsData }: PerformanceAnalyticsProps) {
  // État pour la période sélectionnée
  const [selectedPeriod, setSelectedPeriod] = React.useState('6months');
  
  // Fonction pour gérer la déconnexion
  const handleLogout = () => {
    // Logique de déconnexion à implémenter
    console.log('Déconnexion');
  };
  
  // Fonction pour gérer le changement de période
  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPeriod(e.target.value);
  };
  
  // Données pour le RadarChart (compétences)
  // Transformation des données de skillGaps pour le RadarChart
  const skillsData = [
    {
      skill: 'Leadership',
      self: 4.2,
      peers: 3.8,
      manager: 4.0,
    },
    {
      skill: 'Communication',
      self: 4.5,
      peers: 4.3,
      manager: 4.7,
    },
    {
      skill: 'Innovation',
      self: 3.2,
      peers: 3.5,
      manager: 3.0,
    },
    {
      skill: 'Teamwork',
      self: 4.0,
      peers: 4.2,
      manager: 3.8,
    },
    {
      skill: 'Technical',
      self: 3.7,
      peers: 3.9,
      manager: 4.1,
    },
  ];
  
  // Utilisation des données de skillGaps pour l'affichage
  const skillGapsData = analyticsData.skillGaps || [];
  
  // Données pour le LineChart (tendances de performance)
  const performanceTrendsData = analyticsData.performanceTrends || [
    { month: 'Jan', score: 3.2 },
    { month: 'Fév', score: 3.5 },
    { month: 'Mar', score: 3.8 },
    { month: 'Avr', score: 3.6 },
    { month: 'Mai', score: 4.0 },
    { month: 'Juin', score: 4.2 },
  ];
  
  // Données pour le HeatMap (matrice d'équipe)
  const teamMatrix = [
    { x: 'Leadership', y: 'Alice', value: 4.5 },
    { x: 'Leadership', y: 'Bob', value: 3.8 },
    { x: 'Leadership', y: 'Charlie', value: 2.5 },
    { x: 'Communication', y: 'Alice', value: 4.2 },
    { x: 'Communication', y: 'Bob', value: 4.0 },
    { x: 'Communication', y: 'Charlie', value: 3.5 },
    { x: 'Innovation', y: 'Alice', value: 3.8 },
    { x: 'Innovation', y: 'Bob', value: 4.5 },
    { x: 'Innovation', y: 'Charlie', value: 3.0 },
    { x: 'Teamwork', y: 'Alice', value: 4.0 },
    { x: 'Teamwork', y: 'Bob', value: 3.5 },
    { x: 'Teamwork', y: 'Charlie', value: 4.2 },
    { x: 'Technical', y: 'Alice', value: 3.5 },
    { x: 'Technical', y: 'Bob', value: 4.8 },
    { x: 'Technical', y: 'Charlie', value: 3.8 },
  ];
  
  // Étiquettes pour le HeatMap
  const skillLabels = ['Leadership', 'Communication', 'Innovation', 'Teamwork', 'Technical'];
  const teamMembers = ['Alice', 'Bob', 'Charlie'];
  
  return (
    <AppLayout 
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }}
      onLogout={handleLogout}
    >
      <Head title="Analyse de Performance" />
      
      <div className="space-y-6">
        {/* En-tête de la page */}
        <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-sabc-gray-900 dark:text-white">
              Analyse de Performance
            </h1>
            <p className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
              Visualisez et analysez les données d'évaluation 360° pour améliorer la performance.
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                className="h-10 rounded-md border border-sabc-gray-200 bg-white pl-4 pr-10 text-sm focus:border-sabc-red-primary focus:outline-none focus:ring-1 focus:ring-sabc-red-primary dark:border-sabc-gray-800 dark:bg-sabc-gray-950 dark:text-white"
                value={selectedPeriod}
                onChange={handlePeriodChange}
              >
                <option value="3months">3 derniers mois</option>
                <option value="6months">6 derniers mois</option>
                <option value="12months">12 derniers mois</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-sabc-gray-500" />
            </div>
            
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtrer
            </Button>
            
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Exporter
            </Button>
          </div>
        </div>
        
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-2 text-center">
                <p className="text-sm font-medium text-sabc-gray-500 dark:text-sabc-gray-400">Score Global</p>
                <h2 className="text-4xl font-bold text-sabc-red-primary">4.2</h2>
                <Badge variant="primary" className="mt-1">
                  +0.3 pts
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-2 text-center">
                <p className="text-sm font-medium text-sabc-gray-500 dark:text-sabc-gray-400">Évaluations Complétées</p>
                <h2 className="text-4xl font-bold text-sabc-accent">
                  85%
                </h2>
                <Badge variant="secondary" className="mt-1">
                  17 sur 20
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-2 text-center">
                <p className="text-sm font-medium text-sabc-gray-500 dark:text-sabc-gray-400">Compétence Forte</p>
                <h2 className="text-4xl font-bold text-sabc-success">Communication</h2>
                <Badge variant="outline" className="mt-1">
                  4.5/5
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-2 text-center">
                <p className="text-sm font-medium text-sabc-gray-500 dark:text-sabc-gray-400">À Améliorer</p>
                <h2 className="text-4xl font-bold text-sabc-warning">Innovation</h2>
                <Badge variant="outline" className="mt-1">
                  3.2/5
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Graphiques */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Profil de compétences */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Profil de Compétences</CardTitle>
              <CardDescription>
                Comparaison entre auto-évaluation, pairs et manager
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadarChart
                data={skillsData}
                angleKey="skill"
                dataKeys={[
                  { key: 'self', name: 'Auto-évaluation', color: 'var(--sabc-red-primary)' },
                  { key: 'peers', name: 'Pairs', color: 'var(--sabc-accent)' },
                  { key: 'manager', name: 'Manager', color: 'var(--sabc-success)' }
                ]}
                height={350}
              />
            </CardContent>
          </Card>
          
          {/* Évolution de la performance */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Évolution de la Performance</CardTitle>
              <CardDescription>
                Tendance sur les 6 derniers mois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart
                data={performanceTrendsData}
                xAxisDataKey="month"
                lines={[
                  { dataKey: 'score', name: 'Score de performance', color: 'var(--sabc-red-primary)', strokeWidth: 3 }
                ]}
                height={350}
              />
            </CardContent>
          </Card>
          
          {/* Répartition par région */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Performance par Région</CardTitle>
              <CardDescription>
                Comparaison entre départements Commercial et Marketing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                data={analyticsData.performanceByRegion || []}
                xAxisDataKey="name"
                bars={[
                  { dataKey: 'commercial', name: 'Commercial', color: 'var(--sabc-red-primary)' },
                  { dataKey: 'marketing', name: 'Marketing', color: 'var(--sabc-accent)' }
                ]}
                height={350}
              />
            </CardContent>
          </Card>
          
          {/* Complétion des évaluations */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Complétion des Évaluations</CardTitle>
              <CardDescription>
                Pourcentage d'évaluations complétées par région
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PieChart
                data={
                  // Transformer les données pour qu'elles correspondent au format attendu par PieChart
                  (analyticsData.evaluationCompletionByRegion || []).map(item => ({
                    name: item.region,
                    value: item.percentage,
                    color: undefined
                  }))
                }
                dataKey="value"
                nameKey="name"
                height={350}
              />
            </CardContent>
          </Card>
          
          {/* Matrice d'équipe */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Matrice d'Équipe</CardTitle>
              <CardDescription>
                Performance par compétence et par membre d'équipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HeatMap
                data={teamMatrix}
                xLabels={skillLabels}
                yLabels={teamMembers}
                height={350}
                cellSize={60}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Recommandations */}
        <Card>
          <CardHeader>
            <CardTitle>Recommandations Personnalisées</CardTitle>
            <CardDescription>
              Basées sur l'analyse de vos évaluations 360°
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border border-sabc-red-light bg-white p-4 dark:border-sabc-red-dark dark:bg-sabc-gray-800">
                <h3 className="mb-2 font-semibold text-sabc-red-primary dark:text-sabc-red-light">
                  Amélioration en Innovation
                </h3>
                <p className="text-sm text-sabc-gray-700 dark:text-sabc-gray-300">
                  Vos scores en innovation sont inférieurs à la moyenne de votre équipe. 
                  Nous recommandons de participer à l'atelier "Techniques d'Innovation" prévu le mois prochain.
                </p>
              </div>
              
              <div className="rounded-lg border border-sabc-accent-light bg-white p-4 dark:border-sabc-accent dark:bg-sabc-gray-800">
                <h3 className="mb-2 font-semibold text-sabc-accent dark:text-sabc-accent-light">
                  Renforcement en Leadership
                </h3>
                <p className="text-sm text-sabc-gray-700 dark:text-sabc-gray-300">
                  Votre auto-évaluation en leadership est significativement plus basse que l'évaluation de votre manager.
                  Cela pourrait indiquer un manque de confiance dans vos capacités de leadership.
                </p>
              </div>
              
              <div className="rounded-lg border border-sabc-success bg-white p-4 dark:border-sabc-success dark:bg-sabc-gray-800">
                <h3 className="mb-2 font-semibold text-sabc-success">
                  Point Fort: Communication
                </h3>
                <p className="text-sm text-sabc-gray-700 dark:text-sabc-gray-300">
                  Vos compétences en communication sont excellentes et reconnues par vos pairs et votre manager.
                  Continuez à partager vos connaissances avec l'équipe.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
