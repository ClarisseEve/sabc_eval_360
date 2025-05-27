import React, { useState, useEffect, ChangeEvent } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/app-layout';
import { Breadcrumb } from '@/Components/UI/Breadcrumb/Breadcrumb';
import { Tooltip } from '@/Components/UI/Tooltip/Tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/Components/UI/Card/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/UI/Tabs/Tabs';
import { Button } from '@/Components/UI/Button/Button';
import { BarChart } from '@/Components/UI/Charts/BarChart';
import { PieChart } from '@/Components/UI/Charts/PieChart';
import { LineChart } from '@/Components/UI/Charts/LineChart';
import { RadarChart } from '@/Components/UI/Charts/RadarChart';
import { ProgressBar } from '@/Components/UI/ProgressBar/ProgressBar';
import { AdvancedFilter, FilterGroup } from '@/Components/UI/AdvancedFilter';
import { DataExport } from '@/Components/UI/DataExport';
import { AnalyticsData as AnalyticsDataType } from '@/Types/AnalyticsData';
import { User as UserType } from '@/Types/User';
import { Record } from '@/Types/Record';
import { Progress } from '@/Components/UI/Progress/Progress';
import { Input } from '@/Components/UI/Input/Input';
import { 
  Search, 
  Filter, 
  Download, 
  BarChart2 as BarChartIcon, 
  PieChart as PieChartIcon,
  TrendingUp,
  CheckCircle,
  Calendar,
  Users,
  AlertCircle,
  Award
} from 'lucide-react';
import { EvaluationStats } from '@/Components/Dashboard/EvaluationStats';
import { 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip as RechartsTooltip,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  ZAxis,
  Scatter,
  Treemap
} from 'recharts';
import { formatPercentage, formatDate, cn } from '@/utils/helpers';

// Types
interface Props {
  user: UserType;
  analyticsData: AnalyticsDataType;
  performanceBySkill: Array<{
    skill: string;
    value: number;
    fullMark?: number;
  }>;
  evaluationCompletionByRegion: Array<{
    name: string;
    completed: number;
    total: number;
  }>;
}

interface AnalyticsPageProps {
  auth: {
    user: UserType;
  };
  analyticsData: AnalyticsDataType;
}

interface FilterGroup {
  id: string;
  label: string;
  options: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  multiSelect: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    dataKey: string;
    color: string;
  }>;
  label?: string;
}

// Composant de tooltip personnalisé pour les graphiques
const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  
  return (
    <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
      <p className="font-medium text-gray-900">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} style={{ color: entry.color }} className="text-sm">
          {`${entry.name}: ${entry.value}%`}
        </p>
      ))}
    </div>
  );
};

// Fonction pour générer un fichier d'export (simulation)
const generateExportFile = (data: any, format: string, filename?: string): void => {
  console.log(`Exporting data in ${format} format as ${filename || 'analytics-export'}`, data);
  // Implémentation réelle à faire
};

// Composant principal de la page Analytics
export default function AnalyticsPage({ auth, analyticsData }: AnalyticsPageProps): React.ReactElement {
  // États pour les filtres et la recherche
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('performance');
  
  // Référence à l'utilisateur à partir des props
  const user = auth.user;
  
  // Filtres disponibles pour les analytics
  const analyticsFilterGroups: FilterGroup[] = [
    {
      id: 'region',
      label: 'Région',
      options: [
        { id: 'littoral', label: 'Littoral', value: 'Littoral' },
        { id: 'centre', label: 'Centre', value: 'Centre' },
        { id: 'ouest', label: 'Ouest', value: 'Ouest' },
        { id: 'nord', label: 'Nord', value: 'Nord' }
      ],
      multiSelect: true
    },
    {
      id: 'department',
      label: 'Département',
      options: [
        { id: 'commercial', label: 'Commercial', value: 'Commercial' },
        { id: 'marketing', label: 'Marketing', value: 'Marketing' }
      ],
      multiSelect: true
    },
    {
      id: 'role',
      label: 'Rôle',
      options: [
        { id: 'dr', label: 'DR', value: 'DR' },
        { id: 'cdtt', label: 'CDTT', value: 'CDTT' },
        { id: 'csc', label: 'CSC', value: 'CSC' },
        { id: 'cdv', label: 'CDV', value: 'CDV' },
        { id: 'cds', label: 'CDS', value: 'CDS' },
        { id: 'rtm', label: 'RTM', value: 'RTM' },
        { id: 'tmo', label: 'TMO', value: 'TMO' },
        { id: 'as', label: 'AS', value: 'AS' }
      ],
      multiSelect: true
    }
  ];

  // Options d'export disponibles
  const exportOptions = [
    { id: 'csv', label: 'CSV', value: 'csv' },
    { id: 'excel', label: 'Excel', value: 'excel' },
    { id: 'pdf', label: 'PDF', value: 'pdf' }
  ];

  // Gestionnaire d'export
  const handleExport = (format: 'csv' | 'excel' | 'pdf'): void => {
    setIsExporting(true);
    setTimeout(() => {
      generateExportFile(analyticsData, format);
      setIsExporting(false);
    }, 1000);
  };

  // Gestionnaire de filtre
  const handleFilterChange = (filterId: string, values: string[]): void => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterId]: values
    }));
  };

  // Gestionnaire de recherche
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  // Gestionnaire de période
  const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const newPeriod = event.target.value as 'month' | 'quarter' | 'year';
    setPeriod(newPeriod);
  };

  // Rendu du tableau de bord pour les directeurs (DR)
  const renderDirectorAnalytics = (): JSX.Element => {
    return (
      <div className="space-y-6">
        {/* KPIs principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Taux de complétion</CardTitle>
              <CardDescription>Évaluations 360°</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-sabc-red-primary">78%</div>
              <Progress value={78} className="h-2 mt-2" />
              <p className="text-xs text-gray-500 mt-1">+12% depuis le dernier trimestre</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Performance moyenne</CardTitle>
              <CardDescription>Tous services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-sabc-red-primary">72%</div>
              <Progress value={72} className="h-2 mt-2" />
              <p className="text-xs text-gray-500 mt-1">+5% depuis le dernier trimestre</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Talents identifiés</CardTitle>
              <CardDescription>Haut potentiel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-sabc-red-primary">12</div>
              <div className="flex items-center mt-2">
                <Users className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-xs text-gray-500">Sur 45 collaborateurs</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Écarts compétences</CardTitle>
              <CardDescription>À combler</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-sabc-red-primary">8</div>
              <div className="flex items-center mt-2">
                <AlertCircle className="h-4 w-4 text-sabc-warning mr-1" />
                <span className="text-xs text-gray-500">Principalement en leadership</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onglets d'analyse */}
        <Tabs defaultValue="performance" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="competences">Compétences</TabsTrigger>
            <TabsTrigger value="evaluations">Évaluations</TabsTrigger>
            <TabsTrigger value="talents">Talents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Graphique performance par région */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance par région</CardTitle>
                  <CardDescription>Comparaison Commercial vs Marketing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.performanceByRegion}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="commercial" name="Commercial" fill="#E53E3E" />
                        <Bar dataKey="marketing" name="Marketing" fill="#3182CE" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Graphique tendances performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Tendances de performance</CardTitle>
                  <CardDescription>Évolution sur 6 mois</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.performanceTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line type="monotone" dataKey="commercial" name="Commercial" stroke="#E53E3E" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="marketing" name="Marketing" stroke="#3182CE" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="competences" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Graphique radar des compétences */}
              <Card>
                <CardHeader>
                  <CardTitle>Profil de compétences</CardTitle>
                  <CardDescription>Moyenne par domaine</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={analyticsData.skillRadar}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="skill" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar name="Moyenne" dataKey="value" stroke="#E53E3E" fill="#E53E3E" fillOpacity={0.6} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Graphique écarts de compétences */}
              <Card>
                <CardHeader>
                  <CardTitle>Écarts de compétences</CardTitle>
                  <CardDescription>Actuel vs Cible</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={analyticsData.skillGaps}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="skill" type="category" />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="current" name="Niveau actuel" fill="#3182CE" />
                        <Bar dataKey="target" name="Niveau cible" fill="#48BB78" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="evaluations" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Statut des évaluations */}
              <Card>
                <CardHeader>
                  <CardTitle>Statut des évaluations</CardTitle>
                  <CardDescription>Répartition par état</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.evaluationCompletion}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="status"
                        >
                          {analyticsData.evaluationCompletion.map((entry, index) => {
                            const colors = ['#E53E3E', '#48BB78', '#FF9800', '#9E9E9E'];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Complétion par région */}
              <Card>
                <CardHeader>
                  <CardTitle>Complétion par région</CardTitle>
                  <CardDescription>Progression des évaluations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.evaluationCompletionByRegion}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="completed" name="Complétées" fill="#48BB78" />
                        <Bar dataKey="total" name="Total" fill="#E0E0E0" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="talents" className="space-y-4">
            {/* Top performers */}
            <Card>
              <CardHeader>
                <CardTitle>Top performers</CardTitle>
                <CardDescription>Collaborateurs à haut potentiel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Nom</th>
                        <th className="text-left py-3 px-4">Rôle</th>
                        <th className="text-left py-3 px-4">Département</th>
                        <th className="text-left py-3 px-4">Performance</th>
                        <th className="text-left py-3 px-4">Progression</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.topPerformers.map((performer, index) => (
  };

  return (
    <AppLayout
      title="Analytics"
      breadcrumbs={[
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Analytics', href: '/analytics' }
      ]}
    >
      <Head title="Analytics" />
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              {/* Barre d'outils */}
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <AdvancedFilter
                  filterGroups={analyticsFilterGroups}
                  selectedFilters={selectedFilters}
                  onFilterChange={handleFilterChange}
                />
                <div className="flex items-center gap-2">
                  <select
                    value={period}
                    onChange={handlePeriodChange}
                    className="px-4 py-2 border rounded-lg"
                  >
                    <option value="last30days">Derniers 30 jours</option>
                    <option value="last90days">Derniers 90 jours</option>
                    <option value="last180days">Derniers 180 jours</option>
                  </select>
                  <DataExport
                    onExport={handleExport}
                    isLoading={isExporting}
                  />
                </div>
              </div>
            </div>
            {/* Contenu principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Cards de statistiques */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Performance par Région</h3>
                {analyticsData && (
                  <BarChart
                    data={analyticsData.performanceByRegion}
                    categories={['Commercial', 'Marketing']}
                  />
                )}
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Évaluations Complétées</h3>
                {analyticsData && (
                  <PieChart
                    data={analyticsData.evaluationCompletionByRegion}
                    categories={['Complétées', 'Total']}
                  />
                )}
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
                {analyticsData && (
                  <div className="space-y-4">
                    {analyticsData.topPerformers.map((performer, index) => (
                      <div key={performer.id} className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{performer.name}</h4>
                          <p className="text-sm text-gray-600">
                            {performer.role} - {performer.department}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24">
                            <ProgressBar
                              value={performer.progress}
                              color={performer.performanceIndex > 3 ? 'green' : 'red'}
                            />
                          </div>
                          <span className={`text-sm ${
                            performer.performanceIndex > 3 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {performer.performanceIndex.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}



// Référence à l'utilisateur à partir des props (déjà défini dans la fonction principale)
  // États pour les filtres et la recherche
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('performance');
  
  // Filtres disponibles pour les analytics
  const analyticsFilterGroups: FilterGroup[] = [
    {
      id: 'region',
      label: 'Région',
      options: [
        { id: 'littoral', label: 'Littoral', value: 'Littoral' },
        { id: 'centre', label: 'Centre', value: 'Centre' },
        { id: 'ouest', label: 'Ouest', value: 'Ouest' },
        { id: 'nord', label: 'Nord', value: 'Nord' }
      ],
      multiSelect: true
    },
    {
      id: 'department',
      label: 'Département',
      options: [
        { id: 'commercial', label: 'Commercial', value: 'commercial' },
        { id: 'marketing', label: 'Marketing', value: 'marketing' }
      ],
      multiSelect: true
    },
    {
      id: 'timeframe',
      label: 'Période',
      options: [
        { id: '1month', label: 'Dernier mois', value: '1month' },
        { id: '3months', label: 'Derniers 3 mois', value: '3months' },
        { id: '6months', label: 'Derniers 6 mois', value: '6months' },
        { id: '1year', label: 'Dernière année', value: '1year' }
      ],
      multiSelect: false
    }
  ];
  
  // Gérer le changement de filtre
  const handleFilterChange = (filterId: string, values: string[]): void => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterId]: values
    }));
  };
  
  // Effacer tous les filtres
  const handleClearFilters = (): void => {
    setSelectedFilters({});
    setSearchQuery('');
  };
  
  // Gérer l'exportation des données
  const handleExport = (format: string): void => {
    setIsExporting(true);
    
    // Simuler un délai pour l'exportation
    setTimeout(() => {
      // Préparer les données à exporter selon le format
      const exportData = {
        performanceByRegion: analyticsData.performanceByRegion,
        performanceTrends: analyticsData.performanceTrends,
        evaluationCompletion: analyticsData.evaluationCompletion,
        // Ajouter d'autres données selon le besoin
      };
      
      // Générer le fichier d'exportation
      generateExportFile(Object.values(exportData).flat(), format as 'csv' | 'excel' | 'pdf', `sabc-analytics-${period}-${new Date().toISOString().split('T')[0]}`);
      
      setIsExporting(false);
    }, 1000);
  };
  
  // Rendu du tableau de bord pour les directeurs (DR)
  const renderDirectorAnalytics = (): React.ReactElement => {
    return (
      <div className="space-y-6">
        {/* KPIs principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Taux de complétion</CardTitle>
              <CardDescription>Évaluations 360°</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-sabc-red-primary">78%</div>
              <Progress value={78} className="h-2 mt-2" />
              <p className="text-xs text-gray-500 mt-1">+12% depuis le dernier trimestre</p>
            </CardContent>
          </Card>
          
          {/* Other cards... */}
        </div>
      </div>
    );
  };

  // Rendu du tableau de bord pour les chefs de département (CDTT)
  const renderDepartmentHeadAnalytics = (): React.ReactElement => {
    return (
      <div className="space-y-6">
        <h2>Tableau de bord Chef de Département</h2>
        {/* Content for department head dashboard */}
      </div>
    );
  };

  // Rendu du tableau de bord pour les chefs de service (CSC/RTM)
  const renderServiceHeadAnalytics = (): React.ReactElement => {
    return (
      <div className="space-y-6">
        <h2>Tableau de bord Chef de Service</h2>
        {/* Content for service head dashboard */}
      </div>
    );
  };

  // Rendu du tableau de bord par défaut pour les autres rôles
  const renderDefaultAnalytics = (): React.ReactElement => {
    return (
      <div className="space-y-6">
        <h2>Tableau de bord Collaborateur</h2>
        {/* Content for default dashboard */}
      </div>
    );
  };

  // Fonction pour déterminer les analytics à afficher en fonction du rôle
  const renderAnalyticsByRole = (): React.ReactElement => {
    // Selon les règles métier SABC, nous avons différents niveaux hiérarchiques
    switch (user.role) {
      case 'ADMIN': // Administrateur
        return renderAdminAnalytics();
        
      case 'DR': // Directeur Régional
        return renderDirectorAnalytics();
        
      case 'CDTT': // Chef de Département Tanière
        return renderDepartmentHeadAnalytics();
        
      case 'CSC': // Chef de Service Commercial
      case 'RTM': // Responsable Trade Marketing
        return renderServiceHeadAnalytics();
        
      default: // Autres rôles
        return renderDefaultAnalytics();
    }
  };
  
  // Analytics pour l'Administrateur
  const renderAdminAnalytics = (): React.ReactElement => {
    // Données pour le treemap des compétences par département
    const skillsByDepartmentData = [
      { name: 'Leadership - Commercial', size: 75, department: 'Commercial', skill: 'Leadership' },
      { name: 'Communication - Commercial', size: 82, department: 'Commercial', skill: 'Communication' },
      { name: 'Analyse - Commercial', size: 70, department: 'Commercial', skill: 'Analyse' },
      { name: 'Innovation - Commercial', size: 65, department: 'Commercial', skill: 'Innovation' },
      { name: 'Travail d\'équipe - Commercial', size: 85, department: 'Commercial', skill: 'Travail d\'équipe' },
      { name: 'Leadership - Marketing', size: 80, department: 'Marketing', skill: 'Leadership' },
      { name: 'Communication - Marketing', size: 85, department: 'Marketing', skill: 'Communication' },
      { name: 'Analyse - Marketing', size: 65, department: 'Marketing', skill: 'Analyse' },
      { name: 'Innovation - Marketing', size: 75, department: 'Marketing', skill: 'Innovation' },
      { name: 'Travail d\'équipe - Marketing', size: 80, department: 'Marketing', skill: 'Travail d\'équipe' }
    ];
    
    // Données pour le scatter plot des performances vs évaluations
    const performanceVsEvaluationsData = [
      { name: 'Littoral - Commercial', x: 85, y: 92, z: 120, region: 'Littoral', department: 'Commercial' },
      { name: 'Littoral - Marketing', x: 80, y: 88, z: 100, region: 'Littoral', department: 'Marketing' },
      { name: 'Centre - Commercial', x: 75, y: 82, z: 90, region: 'Centre', department: 'Commercial' },
      { name: 'Centre - Marketing', x: 78, y: 85, z: 95, region: 'Centre', department: 'Marketing' },
      { name: 'Ouest - Commercial', x: 70, y: 75, z: 80, region: 'Ouest', department: 'Commercial' },
      { name: 'Ouest - Marketing', x: 72, y: 78, z: 85, region: 'Ouest', department: 'Marketing' },
      { name: 'Nord - Commercial', x: 68, y: 72, z: 70, region: 'Nord', department: 'Commercial' },
      { name: 'Nord - Marketing', x: 65, y: 70, z: 65, region: 'Nord', department: 'Marketing' }
    ];
    
    // Données pour les anomalies détectées
    const anomaliesData = [
      { id: '1', type: 'Écart auto-évaluation', description: 'Écart significatif entre auto-évaluation et évaluation par pairs', count: 12, severity: 'high' },
      { id: '2', type: 'Baisse performance', description: 'Baisse de performance > 1 point en 3 mois', count: 8, severity: 'medium' },
      { id: '3', type: 'Évaluations uniformes', description: 'Évaluations trop uniformes (variance < 0.5)', count: 15, severity: 'low' },
      { id: '4', type: 'Biais évaluateur', description: 'Évaluateur systématiquement sévère/indulgent', count: 7, severity: 'medium' }
    ];
    
    return (
      <div className="space-y-6">
        {/* Vue d'ensemble des performances par région et département */}
        <Card>
          <CardHeader>
            <CardTitle>Performance globale par région et département</CardTitle>
            <CardDescription>
              Comparaison des performances entre régions et départements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Performance" 
                    unit="%" 
                    domain={[60, 100]}
                    label={{ value: 'Performance (%)', position: 'bottom', offset: 0 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Taux complétion" 
                    unit="%" 
                    domain={[60, 100]}
                    label={{ value: 'Taux complétion (%)', angle: -90, position: 'left' }}
                  />
                  <ZAxis 
                    type="number" 
                    dataKey="z" 
                    range={[60, 400]} 
                    name="Effectif" 
                    unit="" 
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value, name) => [`${value}${name === 'Effectif' ? '' : '%'}`, name]}
                  />
                  <Legend />
                  <Scatter 
                    name="Commercial" 
                    data={performanceVsEvaluationsData.filter(d => d.department === 'Commercial')} 
                    fill="#E53E3E"
                  />
                  <Scatter 
                    name="Marketing" 
                    data={performanceVsEvaluationsData.filter(d => d.department === 'Marketing')} 
                    fill="#3182CE"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Distribution des compétences par département */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution des compétences par département</CardTitle>
            <CardDescription>
              Analyse des forces et faiblesses par compétence et département
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={skillsByDepartmentData}
                  dataKey="size"
                  aspectRatio={4/3}
                  stroke="#fff"
                  fill="#E53E3E"
                  nameKey="name"
                >
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Score']}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-md border border-sabc-gray-200 bg-white p-2 shadow-md dark:border-sabc-gray-800 dark:bg-sabc-gray-900">
                            <p className="font-medium">{data.skill}</p>
                            <p className="text-sm text-sabc-gray-600 dark:text-sabc-gray-400">
                              {data.department}
                            </p>
                            <p className="text-sm font-semibold">
                              Score: {data.size}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </Treemap>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Anomalies détectées */}
        <Card>
          <CardHeader>
            <CardTitle>Anomalies détectées</CardTitle>
            <CardDescription>
              Détection automatique d'anomalies dans les évaluations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anomaliesData.map(anomaly => (
                <div 
                  key={anomaly.id}
                  className={`flex items-start justify-between rounded-md border p-4 ${
                    anomaly.severity === 'high' ? 'border-l-4 border-l-sabc-error' :
                    anomaly.severity === 'medium' ? 'border-l-4 border-l-sabc-warning' :
                    'border-l-4 border-l-sabc-info'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="rounded-full bg-sabc-gray-100 p-2 dark:bg-sabc-gray-800">
                      <AlertCircle className={`h-5 w-5 ${
                        anomaly.severity === 'high' ? 'text-sabc-error' :
                        anomaly.severity === 'medium' ? 'text-sabc-warning' :
                        'text-sabc-info'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-sabc-gray-900 dark:text-white">
                        {anomaly.type}
                      </p>
                      <p className="text-sm text-sabc-gray-600 dark:text-sabc-gray-400">
                        {anomaly.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sabc-gray-100 text-sm font-medium text-sabc-gray-900 dark:bg-sabc-gray-800 dark:text-white">
                    {anomaly.count}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Voir toutes les anomalies
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  
  // Analytics pour le Directeur Régional
  const renderDirectorAnalytics = () => {
    return (
      <div className="space-y-6">
        {/* Performance par région */}
        <Card>
          <CardHeader>
            <CardTitle>Performance par région</CardTitle>
            <CardDescription>
              Comparaison des performances entre régions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.performanceByRegion}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis domain={[50, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                  <Legend />
                  <Bar dataKey="commercial" name="Commercial" fill="#E53E3E" />
                  <Bar dataKey="marketing" name="Marketing" fill="#3182CE" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Évolution de la performance */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution de la performance</CardTitle>
            <CardDescription>
              Tendances de performance sur les 6 derniers mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[50, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                  <Legend />
                  <Line type="monotone" dataKey="commercial" name="Commercial" stroke="#E53E3E" strokeWidth={2} />
                  <Line type="monotone" dataKey="marketing" name="Marketing" stroke="#3182CE" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Taux de complétion des évaluations */}
        <Card>
          <CardHeader>
            <CardTitle>Complétion des évaluations</CardTitle>
            <CardDescription>
              État d'avancement des évaluations par région
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {analyticsData.evaluationCompletionByRegion.map((region) => (
                <div key={region.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sabc-gray-900 dark:text-white">
                      {region.name}
                    </span>
                    <span className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                      {region.completed} / {region.total} ({Math.round((region.completed / region.total) * 100)}%)
                    </span>
                  </div>
                  <div className="relative h-2 w-full rounded-full bg-sabc-gray-200 dark:bg-sabc-gray-800">
                    <div 
                      className="absolute h-full rounded-full bg-sabc-red-primary" 
                      style={{ width: `${(region.completed / region.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.performanceByRegion}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                  <Legend />
                  <Bar dataKey="commercial" name="Commercial" fill="#E53E3E" />
                  <Bar dataKey="marketing" name="Marketing" fill="#3182CE" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Tendances de performance */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des performances</CardTitle>
            <CardDescription>
              Tendances des performances commerciales et marketing sur les 6 derniers mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[50, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                  <Legend />
                  <Line type="monotone" dataKey="commercial" name="Commercial" stroke="#E53E3E" strokeWidth={2} />
                  <Line type="monotone" dataKey="marketing" name="Marketing" stroke="#3182CE" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Top performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top performers</CardTitle>
            <CardDescription>
              Collaborateurs avec les meilleures performances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.topPerformers.map((performer, index) => (
                <div key={performer.id} className="flex items-center justify-between rounded-md border border-sabc-gray-200 p-4 dark:border-sabc-gray-800">
                  <div className="flex items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sabc-red-primary text-white">
                      {index + 1}
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-sabc-gray-900 dark:text-white">{performer.name}</p>
                      <p className="text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                        {performer.role} • {performer.department}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Award className="mr-2 h-5 w-5 text-sabc-accent" />
                    <span className="font-bold text-sabc-gray-900 dark:text-white">
                      {performer.performanceIndex}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Analytics pour le Chef de Département
  const renderDepartmentHeadAnalytics = () => {
    return (
      <div className="space-y-6">
        {/* Performance par compétence */}
        <Card>
          <CardHeader>
            <CardTitle>Performance par compétence</CardTitle>
            <CardDescription>
              Analyse des compétences de l'équipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={90} data={analyticsData.performanceBySkill}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar name="Compétences" dataKey="value" stroke="#E53E3E" fill="#E53E3E" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Écarts de compétences */}
        <Card>
          <CardHeader>
            <CardTitle>Écarts de compétences</CardTitle>
            <CardDescription>
              Analyse des écarts entre niveau actuel et cible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {analyticsData.skillGaps.map((skill) => (
                <div key={skill.skill} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sabc-gray-900 dark:text-white">
                      {skill.skill}
                    </span>
                    <span className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                      {skill.current}% / {skill.target}%
                    </span>
                  </div>
                  <div className="relative h-2 w-full rounded-full bg-sabc-gray-200 dark:bg-sabc-gray-800">
                    <div 
                      className="absolute h-full rounded-full bg-sabc-red-primary" 
                      style={{ width: `${skill.current}%` }}
                    />
                    <div 
                      className="absolute h-full rounded-full border-r-2 border-dashed border-sabc-success dark:border-sabc-success" 
                      style={{ width: `${skill.target}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Taux de complétion des évaluations */}
        <Card>
          <CardHeader>
            <CardTitle>Complétion des évaluations</CardTitle>
            <CardDescription>
              État d'avancement des évaluations de l'équipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.evaluationCompletion}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {analyticsData.evaluationCompletion.map((entry, index) => {
                      const colors = ['#48BB78', '#FF9800', '#E53E3E'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
    return (
      <div className="space-y-6">
        {/* Performance par compétence */}
        <Card>
          <CardHeader>
            <CardTitle>Performance par compétence</CardTitle>
            <CardDescription>
              Analyse des compétences de l'équipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={90} data={analyticsData.performanceBySkill}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar name="Compétences" dataKey="value" stroke="#E53E3E" fill="#E53E3E" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Écarts de compétences */}
        <Card>
          <CardHeader>
            <CardTitle>Écarts de compétences</CardTitle>
            <CardDescription>
              Analyse des écarts entre niveau actuel et cible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {analyticsData.skillGaps.map((skill) => (
                <div key={skill.skill} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sabc-gray-900 dark:text-white">
                      {skill.skill}
                    </span>
                    <span className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                      {skill.current}% / {skill.target}%
                    </span>
                  </div>
                  <div className="relative h-2 w-full rounded-full bg-sabc-gray-200 dark:bg-sabc-gray-800">
                    <div 
                      className="absolute h-full rounded-full bg-sabc-red-primary" 
                      style={{ width: `${skill.current}%` }}
                    />
                    <div 
                      className="absolute h-full rounded-full border-r-2 border-dashed border-sabc-success dark:border-sabc-success" 
                      style={{ width: `${skill.target}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Taux de complétion des évaluations */}
        <Card>
          <CardHeader>
            <CardTitle>Complétion des évaluations</CardTitle>
            <CardDescription>
              État d'avancement des évaluations de l'équipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.evaluationCompletion}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {analyticsData.evaluationCompletion.map((entry, index) => {
                      const colors = ['#48BB78', '#FF9800', '#E53E3E'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Analytics pour les Managers
  const renderManagerAnalytics = () => {
    return (
      <div className="space-y-6">
        {/* Performance de l'équipe */}
        <Card>
          <CardHeader>
            <CardTitle>Performance de l'équipe</CardTitle>
            <CardDescription>
              Évolution de la performance de l'équipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[50, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey={user.department === 'Marketing' ? 'marketing' : 'commercial'} 
                    name="Performance" 
                    stroke="#E53E3E" 
                    fill="#E53E3E" 
                    fillOpacity={0.2} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Écarts de compétences */}
        <Card>
          <CardHeader>
            <CardTitle>Écarts de compétences</CardTitle>
            <CardDescription>
              Analyse des écarts entre niveau actuel et cible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {analyticsData.skillGaps.map((skill) => (
                <div key={skill.skill} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sabc-gray-900 dark:text-white">
                      {skill.skill}
                    </span>
                    <span className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                      {skill.current}% / {skill.target}%
                    </span>
                  </div>
                  <div className="relative h-2 w-full rounded-full bg-sabc-gray-200 dark:bg-sabc-gray-800">
                    <div 
                      className="absolute h-full rounded-full bg-sabc-red-primary" 
                      style={{ width: `${skill.current}%` }}
                    />
                    <div 
                      className="absolute h-full rounded-full border-r-2 border-dashed border-sabc-success dark:border-sabc-success" 
                      style={{ width: `${skill.target}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Taux de complétion des évaluations */}
        <Card>
          <CardHeader>
            <CardTitle>Complétion des évaluations</CardTitle>
            <CardDescription>
              État d'avancement des évaluations de l'équipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.evaluationCompletion}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {analyticsData.evaluationCompletion.map((entry, index) => {
                      const colors = ['#48BB78', '#FF9800', '#E53E3E'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
    return (
      <div className="space-y-6">
        {/* Performance de l'équipe */}
        <Card>
          <CardHeader>
            <CardTitle>Performance de l'équipe</CardTitle>
            <CardDescription>
              Évolution de la performance de l'équipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[50, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey={user.department === 'Marketing' ? 'marketing' : 'commercial'} 
                    name="Performance" 
                    stroke="#E53E3E" 
                    fill="#E53E3E" 
                    fillOpacity={0.2} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Écarts de compétences */}
        <Card>
          <CardHeader>
            <CardTitle>Écarts de compétences</CardTitle>
            <CardDescription>
              Analyse des écarts entre niveau actuel et cible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {analyticsData.skillGaps.map((skill) => (
                <div key={skill.skill} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sabc-gray-900 dark:text-white">
                      {skill.skill}
                    </span>
                    <span className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                      {skill.current}% / {skill.target}%
                    </span>
                  </div>
                  <div className="relative h-2 w-full rounded-full bg-sabc-gray-200 dark:bg-sabc-gray-800">
                    <div 
                      className="absolute h-full rounded-full bg-sabc-red-primary" 
                      style={{ width: `${skill.current}%` }}
                    />
                    <div 
                      className="absolute h-full rounded-full border-r-2 border-dashed border-sabc-success dark:border-sabc-success" 
                      style={{ width: `${skill.target}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Taux de complétion des évaluations */}
        <Card>
          <CardHeader>
            <CardTitle>Complétion des évaluations</CardTitle>
            <CardDescription>
              État d'avancement des évaluations de l'équipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.evaluationCompletion}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {analyticsData.evaluationCompletion.map((entry, index) => {
                      const colors = ['#48BB78', '#FF9800', '#E53E3E'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Analytics pour les Opérationnels
  const renderOperationalAnalytics = () => {
    return (
      <div className="space-y-6">
        {/* Performance individuelle */}
        <Card>
          <CardHeader>
            <CardTitle>Performance individuelle</CardTitle>
            <CardDescription>
              Analyse de vos compétences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={90} data={analyticsData.performanceBySkill}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar name="Compétences" dataKey="value" stroke="#E53E3E" fill="#E53E3E" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Évolution de la performance */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution de la performance</CardTitle>
            <CardDescription>
              Progression de votre performance sur les 6 derniers mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[50, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey={user.department === 'Marketing' ? 'marketing' : 'commercial'} 
                    name="Performance" 
                    stroke="#E53E3E" 
                    strokeWidth={2} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Écarts de compétences */}
        <Card>
          <CardHeader>
            <CardTitle>Écarts de compétences</CardTitle>
            <CardDescription>
              Analyse des écarts entre niveau actuel et cible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {analyticsData.skillGaps.map((skill) => (
                <div key={skill.skill} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sabc-gray-900 dark:text-white">
                      {skill.skill}
                    </span>
                    <span className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                      {skill.current}% / {skill.target}%
                    </span>
                  </div>
                  <div className="relative h-2 w-full rounded-full bg-sabc-gray-200 dark:bg-sabc-gray-800">
                    <div 
                      className="absolute h-full rounded-full bg-sabc-red-primary" 
                      style={{ width: `${skill.current}%` }}
                    />
                    <div 
                      className="absolute h-full rounded-full border-r-2 border-dashed border-sabc-success dark:border-sabc-success" 
                      style={{ width: `${skill.target}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
    return (
      <div className="space-y-6">
        {/* Performance individuelle */}
        <Card>
          <CardHeader>
            <CardTitle>Performance individuelle</CardTitle>
            <CardDescription>
              Analyse de vos compétences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={90} data={analyticsData.performanceBySkill}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar name="Compétences" dataKey="value" stroke="#E53E3E" fill="#E53E3E" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Évolution de la performance */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution de la performance</CardTitle>
            <CardDescription>
              Progression de votre performance sur les 6 derniers mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[50, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey={user.department === 'Marketing' ? 'marketing' : 'commercial'} 
                    name="Performance" 
                    stroke="#E53E3E" 
                    strokeWidth={2} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Écarts de compétences */}
        <Card>
          <CardHeader>
            <CardTitle>Écarts de compétences</CardTitle>
            <CardDescription>
              Analyse des écarts entre niveau actuel et cible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {analyticsData.skillGaps.map((skill) => (
                <div key={skill.skill} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sabc-gray-900 dark:text-white">
                      {skill.skill}
                    </span>
                    <span className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                      {skill.current}% / {skill.target}%
                    </span>
                  </div>
                  <div className="relative h-2 w-full rounded-full bg-sabc-gray-200 dark:bg-sabc-gray-800">
                    <div 
                      className="absolute h-full rounded-full bg-sabc-red-primary" 
                      style={{ width: `${skill.current}%` }}
                    />
                    <div 
                      className="absolute h-full rounded-full border-r-2 border-dashed border-sabc-success dark:border-sabc-success" 
                      style={{ width: `${skill.target}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Statistiques communes pour tous les tableaux de bord
  const commonStats = [
    {
      label: 'Performance globale',
      value: 78,
      icon: <TrendingUp className="h-5 w-5" />,
      variant: 'primary' as const,
      format: 'percentage' as const,
      change: 5,
      changeType: 'positive' as const
    },
    {
      label: 'Évaluations complétées',
      value: 65,
      icon: <CheckCircle className="h-5 w-5" />,
      variant: 'success' as const,
      format: 'percentage' as const
    },
    {
      label: 'Période',
      value: period === 'month' ? 1 : period === 'quarter' ? 3 : 12, // Valeur numérique représentant le nombre de mois
      icon: <Calendar className="h-5 w-5" />,
      variant: 'info' as const,
      format: 'number' as const
    },
    {
      label: 'Collaborateurs',
      value: 42,
      icon: <Users className="h-5 w-5" />,
      variant: 'default' as const,
      format: 'number' as const
    }
  ];
  
  return (
    <AppLayout 
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }}
      onLogout={() => console.log('Déconnexion')}
    >
      <Head title="Analytics" />
      
      <div className="space-y-6">
        {/* En-tête avec filtres */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <h1 className="text-2xl font-bold text-sabc-gray-900 dark:text-white">
            Analytics
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border border-sabc-gray-200 dark:border-sabc-gray-800">
              <Button 
                variant={period === 'month' ? 'default' : 'ghost'} 
                className="rounded-r-none"
                onClick={() => setPeriod('month')}
              >
                Mois
              </Button>
              <Button 
                variant={period === 'quarter' ? 'default' : 'ghost'} 
                className="rounded-none border-x border-sabc-gray-200 dark:border-sabc-gray-800"
                onClick={() => setPeriod('quarter')}
              >
                Trimestre
              </Button>
              <Button 
                variant={period === 'year' ? 'default' : 'ghost'} 
                className="rounded-l-none"
                onClick={() => setPeriod('year')}
              >
                Année
              </Button>
            </div>
            <div className="relative w-full max-w-xs md:w-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sabc-gray-500" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <AdvancedFilter
              groups={analyticsFilterGroups}
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
            <DataExport 
              onExport={handleExport} 
              isLoading={isExporting}
            />
          </div>
        </div>
        
        {/* Statistiques communes */}
        <EvaluationStats 
          stats={commonStats}
          layout="grid"
          columns={4}
        />
        
        {/* Contenu spécifique au rôle */}
        {renderAnalyticsByRole()}
      </div>
    </AppLayout>
  );
}
