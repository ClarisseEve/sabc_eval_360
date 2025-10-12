import React from 'react';
import type { AnalyticsFilters } from './types';

const DEFAULT_FILTERS: AnalyticsFilters = {
  periode: 'last_6_months',
  roles: [],
  regions: [],
  branches: [],
  hierarchyLevels: [],
  ageRange: [20, 60],
  anciennete: [0, 20],
  sexes: [],
  evaluationChannels: ['auto', 'pairs', 'descendante'],
  competencies: [],
  trainingStatuses: [],
  structureScope: 'all',
};

export interface AnalyticsFiltersContextValue {
  filters: AnalyticsFilters;
  setFilters: (updater: (prev: AnalyticsFilters) => AnalyticsFilters) => void;
  resetFilters: () => void;
}

const AnalyticsFiltersContext = React.createContext<AnalyticsFiltersContextValue | undefined>(undefined);

export const AnalyticsFiltersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFiltersState] = React.useState<AnalyticsFilters>(DEFAULT_FILTERS);

  const setFilters = React.useCallback((updater: (prev: AnalyticsFilters) => AnalyticsFilters) => {
    setFiltersState(prev => updater(prev));
  }, []);

  const resetFilters = React.useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  return (
    <AnalyticsFiltersContext.Provider value={{ filters, setFilters, resetFilters }}>
      {children}
    </AnalyticsFiltersContext.Provider>
  );
};

export const useAnalyticsFilters = (): AnalyticsFiltersContextValue => {
  const context = React.useContext(AnalyticsFiltersContext);
  if (!context) {
    throw new Error('useAnalyticsFilters must be used within an AnalyticsFiltersProvider');
  }
  return context;
};
