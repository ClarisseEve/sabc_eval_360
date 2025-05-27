import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

// Types pour les données d'analyse
export interface AnalyticsData {
  performanceByRegion: Array<{
    name: string;
    commercial: number;
    marketing: number;
  }>;
  performanceTrends: Array<{
    month: string;
    commercial: number;
    marketing: number;
  }>;
  skillRadar: Array<{
    skill: string;
    value: number;
    fullMark: number;
  }>;
  evaluationCompletion: Array<{
    status: string;
    value: number;
  }>;
  topPerformers: Array<{
    id: string;
    name: string;
    role: string;
    department: string;
    performance: number;
    progress: number;
  }>;
  skillGaps: Array<{
    skill: string;
    current: number;
    target: number;
  }>;
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

export interface FilterGroup {
  id: string;
  label: string;
  options: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  multiSelect: boolean;
}

/**
 * Hook personnalisé pour gérer les données d'analyse
 * Conforme aux règles SABC pour les hooks et les analytics
 */
export const useAnalytics = () => {
  const { user, hasPermission } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

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

  // Charger les données d'analyse
  const loadAnalyticsData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    // Construire les paramètres de requête
    const queryParams = new URLSearchParams();
    queryParams.append('period', period);
    
    // Ajouter les filtres sélectionnés
    Object.entries(selectedFilters).forEach(([key, values]) => {
      values.forEach(value => queryParams.append(key, value));
    });
    
    // Ajouter la recherche
    if (searchQuery) {
      queryParams.append('search', searchQuery);
    }
    
    try {
      const response = await fetch(`/api/analytics?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Erreur lors du chargement des données d\'analyse');
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      setError('Impossible de charger les données d\'analyse');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, period, selectedFilters, searchQuery]);

  // Charger les données au montage et lorsque les filtres changent
  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  // Gérer le changement de période
  const handlePeriodChange = useCallback((newPeriod: 'month' | 'quarter' | 'year') => {
    setPeriod(newPeriod);
  }, []);

  // Gérer le changement de filtre
  const handleFilterChange = useCallback((filterId: string, values: string[]) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterId]: values
    }));
  }, []);

  // Effacer tous les filtres
  const handleClearFilters = useCallback(() => {
    setSelectedFilters({});
    setSearchQuery('');
  }, []);

  // Gérer la recherche
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Exporter les données
  const exportData = useCallback(async (format: 'csv' | 'excel' | 'pdf') => {
    if (!analyticsData) return;
    
    setIsExporting(true);
    
    try {
      // Construire les paramètres de requête
      const queryParams = new URLSearchParams();
      queryParams.append('period', period);
      queryParams.append('format', format);
      
      // Ajouter les filtres sélectionnés
      Object.entries(selectedFilters).forEach(([key, values]) => {
        values.forEach(value => queryParams.append(key, value));
      });
      
      // Ajouter la recherche
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      // Faire la requête d'exportation
      const response = await fetch(`/api/analytics/export?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Erreur lors de l\'exportation des données');
      
      // Télécharger le fichier
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `sabc-analytics-${period}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Impossible d\'exporter les données');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  }, [analyticsData, period, selectedFilters, searchQuery]);

  // Déterminer les analytics à afficher en fonction du rôle
  const getRoleSpecificAnalytics = useCallback(() => {
    if (!analyticsData) return null;
    
    // Adapter les analytics en fonction du rôle de l'utilisateur
    switch (user?.role) {
      case 'DR':
        // Directeur Régional - Vue globale de toute la région
        return {
          ...analyticsData,
          viewType: 'director',
          hasRegionalAccess: true,
          hasCrossBranchAccess: true
        };
      
      case 'CDTT':
        // Chef de Département - Vue du département avec comparaison Commercial/Marketing
        return {
          ...analyticsData,
          viewType: 'department_head',
          hasRegionalAccess: true,
          hasCrossBranchAccess: true
        };
      
      case 'CSC':
      case 'RTM':
        // Chefs de Service - Vue de leur service uniquement
        return {
          ...analyticsData,
          viewType: 'service_head',
          hasRegionalAccess: false,
          hasCrossBranchAccess: false
        };
      
      default:
        // Autres rôles
        return {
          ...analyticsData,
          viewType: 'operational',
          hasRegionalAccess: false,
          hasCrossBranchAccess: false
        };
    }
  }, [analyticsData, user?.role]);

  return {
    analyticsData,
    roleSpecificAnalytics: getRoleSpecificAnalytics(),
    loading,
    error,
    period,
    selectedFilters,
    searchQuery,
    isExporting,
    analyticsFilterGroups,
    handlePeriodChange,
    handleFilterChange,
    handleClearFilters,
    handleSearch,
    exportData,
    refresh: loadAnalyticsData,
    hasRegionalAccess: hasPermission('view_all_regions') || hasPermission('view_region'),
    hasCrossBranchAccess: hasPermission('cross_branch')
  };
};

export default useAnalytics;