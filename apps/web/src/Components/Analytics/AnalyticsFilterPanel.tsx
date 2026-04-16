import React from 'react';
import { useAnalyticsFilters } from './AnalyticsFiltersContext';
import type { AnalyticsFilters } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Button } from '@/Components/UI/Button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/Components/UI/Select';
import { Badge } from '@/Components/UI/Badge';
import { RangeSlider } from '@/Components/UI/RangeSlider';
import {
  Filter,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { COMPETENCY_FAMILIES } from '@/constants/competencyMatrix';
import { cn } from '@/utils/helpers';

const DEFAULT_ROLE_OPTIONS = ['ADMIN', 'DR', 'CDTT', 'CSC', 'RTM', 'SRMO', 'CDV', 'TMO', 'CDS', 'AS', 'SS'];
const DEFAULT_REGION_OPTIONS = ['Littoral', 'Centre', 'Nord', 'Ouest'];
const DEFAULT_BRANCHE_OPTIONS = ['Boissons', 'Bouteillerie', 'Distribution'];
const SEXE_OPTIONS = ['F', 'M'];
const DEFAULT_HIERARCHY_OPTIONS = [
  { value: 'region', label: 'Région' },
  { value: 'service', label: 'Service' },
  { value: 'district', label: 'District' },
  { value: 'secteur', label: 'Secteur' },
];
const DEFAULT_TRAINING_STATUS_OPTIONS = [
  { value: 'a_jour', label: 'À jour' },
  { value: 'en_retard', label: 'En retard' },
  { value: 'non_demarre', label: 'Non démarré' },
];
const STRUCTURE_SCOPE_OPTIONS: Array<{ value: AnalyticsFilters['structureScope']; label: string }> = [
  { value: 'all', label: 'Toutes' },
  { value: 'taniere', label: 'Tanière' },
  { value: 'non_taniere', label: 'Non-Tanière' },
];
const DEFAULT_COMPETENCY_OPTIONS = COMPETENCY_FAMILIES;
const AGE_MARKS = [
  { value: 20, label: '20' },
  { value: 30, label: '30' },
  { value: 40, label: '40' },
  { value: 50, label: '50' },
  { value: 60, label: '60' },
];
const SENIORITY_MARKS = [
  { value: 0, label: '0' },
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 15, label: '15' },
  { value: 20, label: '20+' },
];
const PERIODE_OPTIONS = [
  { value: 'last_3_months', label: 'Derniers 3 mois' },
  { value: 'last_6_months', label: 'Derniers 6 mois' },
  { value: 'last_12_months', label: 'Derniers 12 mois' },
  { value: 'year_to_date', label: 'Depuis début année' },
];

function toggleItem(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function resolveOption<T>(value: T[] | undefined, fallback: T[]): T[] {
  return value?.length ? value : fallback;
}

const CHANNEL_LABELS: Record<string, string> = { auto: 'Auto', pairs: 'Pairs', descendante: 'Descendante' };

interface AnalyticsFilterPanelProps {
  options?: {
    roles?: string[];
    regions?: string[];
    branches?: string[];
    competencies?: string[];
    hierarchyLevels?: Array<{ value: string; label: string }>;
    trainingStatuses?: Array<{ value: string; label: string }>;
  };
  mode?: 'card' | 'sheet';
  className?: string;
}

export const AnalyticsFilterPanel: React.FC<AnalyticsFilterPanelProps> = ({
  options,
  mode = 'card',
  className,
}) => {
  const { filters, setFilters, resetFilters } = useAnalyticsFilters();
  const [isOpen, setIsOpen] = React.useState(mode === 'sheet');

  const roleOptions = resolveOption(options?.roles, DEFAULT_ROLE_OPTIONS);
  const regionOptions = resolveOption(options?.regions, DEFAULT_REGION_OPTIONS);
  const brancheOptions = resolveOption(options?.branches, DEFAULT_BRANCHE_OPTIONS);
  const hierarchyOptions = resolveOption(options?.hierarchyLevels, DEFAULT_HIERARCHY_OPTIONS);
  const trainingStatusOptions = resolveOption(options?.trainingStatuses, DEFAULT_TRAINING_STATUS_OPTIONS);
  const competencyOptions = resolveOption(options?.competencies, DEFAULT_COMPETENCY_OPTIONS);

  const updateFilters = (update: Partial<AnalyticsFilters>) => {
    setFilters((prev) => ({ ...prev, ...update }));
  };

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.roles.length) count += filters.roles.length;
    if (filters.regions.length) count += filters.regions.length;
    if (filters.branches.length) count += filters.branches.length;
    if (filters.hierarchyLevels.length) count += filters.hierarchyLevels.length;
    if (filters.competencies.length) count += filters.competencies.length;
    if (filters.trainingStatuses.length) count += filters.trainingStatuses.length;
    if (filters.sexes.length) count += filters.sexes.length;
    if (filters.evaluationChannels.length && filters.evaluationChannels.length < 3) count += filters.evaluationChannels.length;
    if (filters.structureScope !== 'all') count += 1;
    if (filters.ageRange[0] !== 20 || filters.ageRange[1] !== 60) count += 1;
    if (filters.anciennete[0] !== 0 || filters.anciennete[1] !== 20) count += 1;
    if (filters.periode !== 'last_6_months') count += 1;
    return count;
  }, [filters]);

  const filtersGrid = (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      <div className="space-y-3">
        <label htmlFor="filter-periode" className="text-sm font-medium text-sabc-gray-700">Période</label>
        <Select value={filters.periode} onValueChange={(value) => updateFilters({ periode: value })}>
          <SelectTrigger id="filter-periode">
            <SelectValue placeholder="Sélectionner" />
          </SelectTrigger>
          <SelectContent>
            {PERIODE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <span className="text-sm font-medium text-sabc-gray-700">Rôles ciblés</span>
        <div className="flex flex-wrap gap-2">
          {roleOptions.map((role) => {
            const active = filters.roles.includes(role);
            return (
              <Badge
                key={role}
                role="button"
                className={cn(
                  'cursor-pointer transition-colors',
                  active
                    ? 'bg-sabc-red-primary text-white hover:bg-sabc-red-dark'
                    : 'bg-sabc-gray-100 text-sabc-gray-700 hover:bg-sabc-gray-200'
                )}
                onClick={() => updateFilters({ roles: toggleItem(filters.roles, role) })}
              >
                {role}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-sm font-medium text-sabc-gray-700">Régions</span>
        <div className="flex flex-wrap gap-2">
          {regionOptions.map((region) => {
            const active = filters.regions.includes(region);
            return (
              <Badge
                key={region}
                role="button"
                className={cn(
                  'cursor-pointer transition-colors',
                  active
                    ? 'bg-sabc-info text-white hover:bg-sabc-info/80'
                    : 'bg-sabc-gray-100 text-sabc-gray-700 hover:bg-sabc-gray-200'
                )}
                onClick={() => updateFilters({ regions: toggleItem(filters.regions, region) })}
              >
                {region}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-sm font-medium text-sabc-gray-700">Branches</span>
        <div className="flex flex-wrap gap-2">
          {brancheOptions.map((branche) => {
            const active = filters.branches.includes(branche);
            return (
              <Badge
                key={branche}
                role="button"
                className={cn(
                  'cursor-pointer transition-colors',
                  active
                    ? 'bg-sabc-accent text-white hover:bg-sabc-accent/90'
                    : 'bg-sabc-gray-100 text-sabc-gray-700 hover:bg-sabc-gray-200'
                )}
                onClick={() => updateFilters({ branches: toggleItem(filters.branches, branche) })}
              >
                {branche}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-sm font-medium text-sabc-gray-700">Niveaux hiérarchiques</span>
        <div className="flex flex-wrap gap-2">
          {hierarchyOptions.map((level) => {
            const active = filters.hierarchyLevels.includes(level.value);
            return (
              <Badge
                key={level.value}
                role="button"
                className={cn(
                  'cursor-pointer transition-colors',
                  active
                    ? 'bg-sabc-gray-900 text-white hover:bg-sabc-gray-800'
                    : 'bg-sabc-gray-100 text-sabc-gray-700 hover:bg-sabc-gray-200'
                )}
                onClick={() => updateFilters({ hierarchyLevels: toggleItem(filters.hierarchyLevels, level.value) })}
              >
                {level.label}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-sm font-medium text-sabc-gray-700">Statut de formation</span>
        <div className="flex flex-wrap gap-2">
          {trainingStatusOptions.map((status) => {
            const active = filters.trainingStatuses.includes(status.value);
            return (
              <Badge
                key={status.value}
                role="button"
                className={cn(
                  'cursor-pointer transition-colors',
                  active
                    ? 'bg-sabc-warning text-sabc-gray-900 hover:bg-sabc-warning/80'
                    : 'bg-sabc-gray-100 text-sabc-gray-700 hover:bg-sabc-gray-200'
                )}
                onClick={() => updateFilters({ trainingStatuses: toggleItem(filters.trainingStatuses, status.value) })}
              >
                {status.label}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-sm font-medium text-sabc-gray-700">Canaux d'évaluation</span>
        <div className="flex flex-wrap gap-2">
          {['auto', 'pairs', 'descendante'].map((channel) => {
            const active = filters.evaluationChannels.includes(channel as AnalyticsFilters['evaluationChannels'][number]);
            return (
              <Badge
                key={channel}
                role="button"
                className={cn(
                  'cursor-pointer transition-colors',
                  active
                    ? 'bg-sabc-gray-900 text-white hover:bg-sabc-gray-800'
                    : 'bg-sabc-gray-100 text-sabc-gray-700 hover:bg-sabc-gray-200'
                )}
                onClick={() => {
                  const current = filters.evaluationChannels;
                  const next = toggleItem(current, channel);
                  updateFilters({
                    evaluationChannels:
                      next.length === 0
                        ? (['auto', 'pairs', 'descendante'] as AnalyticsFilters['evaluationChannels'])
                        : (next as AnalyticsFilters['evaluationChannels']),
                  });
                }}
              >
                {CHANNEL_LABELS[channel] ?? channel}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-sm font-medium text-sabc-gray-700">Sexe</span>
        <div className="flex flex-wrap gap-2">
          {SEXE_OPTIONS.map((sexe) => {
            const active = filters.sexes.includes(sexe);
            return (
              <Badge
                key={sexe}
                role="button"
                className={cn(
                  'cursor-pointer transition-colors',
                  active
                    ? 'bg-sabc-gray-900 text-white hover:bg-sabc-gray-800'
                    : 'bg-sabc-gray-100 text-sabc-gray-700 hover:bg-sabc-gray-200'
                )}
                onClick={() => updateFilters({ sexes: toggleItem(filters.sexes, sexe) })}
              >
                {sexe === 'F' ? 'Femmes' : 'Hommes'}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <label htmlFor="filter-structure" className="text-sm font-medium text-sabc-gray-700">Structure</label>
        <Select
          value={filters.structureScope}
          onValueChange={(value) => updateFilters({ structureScope: value as AnalyticsFilters['structureScope'] })}
        >
          <SelectTrigger id="filter-structure">
            <SelectValue placeholder="Toutes" />
          </SelectTrigger>
          <SelectContent>
            {STRUCTURE_SCOPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <span className="text-sm font-medium text-sabc-gray-700">Familles de compétences</span>
        <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto pr-1">
          {competencyOptions.map((competency) => {
            const active = filters.competencies.includes(competency);
            return (
              <Badge
                key={competency}
                role="button"
                className={cn(
                  'cursor-pointer transition-colors',
                  active
                    ? 'bg-sabc-success text-white hover:bg-sabc-success/80'
                    : 'bg-sabc-gray-100 text-sabc-gray-700 hover:bg-sabc-gray-200'
                )}
                onClick={() => updateFilters({ competencies: toggleItem(filters.competencies, competency) })}
              >
                {competency}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-sm font-medium text-sabc-gray-700">Tranche d'âge (ans)</span>
        <div className="rounded-lg border border-sabc-gray-200 p-4">
          <RangeSlider
            min={20}
            max={60}
            step={1}
            value={filters.ageRange}
            marks={AGE_MARKS}
            onChange={(next) => updateFilters({ ageRange: next })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-sm font-medium text-sabc-gray-700">Ancienneté (années)</span>
        <div className="rounded-lg border border-sabc-gray-200 p-4">
          <RangeSlider
            min={0}
            max={20}
            step={1}
            value={filters.anciennete}
            marks={SENIORITY_MARKS}
            onChange={(next) => updateFilters({ anciennete: next })}
          />
        </div>
      </div>
    </div>
  );

  if (mode === 'sheet') {
    return (
      <div className={cn('space-y-5', className)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-base font-semibold text-sabc-gray-900">
              <Filter className="h-4 w-4" />
              Filtres avancés
            </span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount} actif{activeFilterCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-sabc-gray-500 hover:text-sabc-red-primary"
          >
            <RotateCcw className="mr-2 h-4 w-4" />Réinitialiser
          </Button>
        </div>
        {filtersGrid}
      </div>
    );
  }

  const showContent = isOpen;

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="flex items-center gap-2 text-sabc-gray-900">
            <Filter className="h-4 w-4" />
            Filtres avancés
          </CardTitle>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount} actif{activeFilterCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center gap-2 text-sabc-gray-600 hover:text-sabc-red-primary"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {showContent ? 'Masquer' : 'Afficher'}
            {showContent ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-sabc-gray-500 hover:text-sabc-red-primary"
          >
            <RotateCcw className="mr-2 h-4 w-4" />Réinitialiser
          </Button>
        </div>
      </CardHeader>
      {showContent && <CardContent className="pt-4">{filtersGrid}</CardContent>}
    </Card>
  );
};

export default AnalyticsFilterPanel;
