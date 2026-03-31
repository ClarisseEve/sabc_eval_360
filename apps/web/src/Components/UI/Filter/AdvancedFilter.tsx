import * as React from 'react';
import { Filter, X, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/helpers';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent } from '@/Components/UI/Card/Card';

export interface FilterOption {
  id: string;
  label: string;
  value: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  multiSelect?: boolean;
}

export interface AdvancedFilterProps {
  groups: FilterGroup[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (groupId: string, values: string[]) => void;
  onClearFilters: () => void;
  className?: string;
}

export const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  groups,
  selectedFilters,
  onFilterChange,
  onClearFilters,
  className,
}) => {
  const [openGroup, setOpenGroup] = React.useState<string | null>(null);
  
  // Calculer le nombre total de filtres actifs
  const activeFiltersCount = Object.values(selectedFilters).reduce(
    (count, values) => count + values.length, 
    0
  );
  
  // Gérer l'ouverture/fermeture d'un groupe
  const toggleGroup = (groupId: string) => {
    setOpenGroup(openGroup === groupId ? null : groupId);
  };
  
  // Vérifier si une option est sélectionnée
  const isOptionSelected = (groupId: string, value: string) => {
    return selectedFilters[groupId]?.includes(value) || false;
  };
  
  // Gérer la sélection/désélection d'une option
  const handleOptionToggle = (groupId: string, value: string, multiSelect: boolean = false) => {
    const currentValues = selectedFilters[groupId] || [];
    let newValues: string[];
    
    if (multiSelect) {
      // Mode multi-sélection
      if (currentValues.includes(value)) {
        newValues = currentValues.filter(v => v !== value);
      } else {
        newValues = [...currentValues, value];
      }
    } else {
      // Mode sélection unique
      newValues = currentValues.includes(value) ? [] : [value];
    }
    
    onFilterChange(groupId, newValues);
  };
  
  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setOpenGroup(openGroup ? null : groups[0]?.id)}
          className="flex items-center"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filtres
          {activeFiltersCount > 0 && (
            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-sabc-red-primary text-xs text-white">
              {activeFiltersCount}
            </span>
          )}
        </Button>
        
        {activeFiltersCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClearFilters}
            className="text-sabc-gray-500 hover:text-sabc-gray-700 dark:text-sabc-gray-400 dark:hover:text-sabc-gray-300"
          >
            Effacer tous les filtres
          </Button>
        )}
      </div>
      
      {/* Afficher les filtres actifs */}
      {activeFiltersCount > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(selectedFilters).map(([groupId, values]) => {
            const group = groups.find(g => g.id === groupId);
            if (!group || values.length === 0) return null;
            
            return values.map(value => {
              const option = group.options.find(o => o.value === value);
              if (!option) return null;
              
              return (
                <div 
                  key={`${groupId}-${value}`}
                  className="flex items-center rounded-full border border-sabc-gray-200 bg-sabc-gray-50 px-3 py-1 text-sm dark:border-sabc-gray-700 dark:bg-sabc-gray-800"
                >
                  <span className="mr-1 text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
                    {group.label}:
                  </span>
                  <span className="font-medium text-sabc-gray-900 dark:text-white">
                    {option.label}
                  </span>
                  <button
                    onClick={() => handleOptionToggle(groupId, value, group.multiSelect)}
                    className="ml-2 rounded-full p-0.5 text-sabc-gray-500 hover:bg-sabc-gray-200 hover:text-sabc-gray-700 dark:text-sabc-gray-400 dark:hover:bg-sabc-gray-700 dark:hover:text-sabc-gray-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            });
          })}
        </div>
      )}
      
      {/* Dropdown des filtres */}
      {openGroup && (
        <Card className="absolute left-0 top-full z-50 mt-2 w-72 shadow-lg">
          <CardContent className="p-2">
            <div className="space-y-4 p-2">
              {groups.map(group => (
                <div key={group.id} className="space-y-2">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="flex w-full items-center justify-between rounded-md p-2 text-sm font-medium text-sabc-gray-900 hover:bg-sabc-gray-100 dark:text-white dark:hover:bg-sabc-gray-800"
                  >
                    <span>{group.label}</span>
                    <ChevronDown 
                      className={cn(
                        "h-4 w-4 transition-transform", 
                        openGroup === group.id && "rotate-180"
                      )} 
                    />
                  </button>
                  
                  {openGroup === group.id && (
                    <div className="ml-2 space-y-1">
                      {group.options.map(option => (
                        <button
                          key={option.id}
                          onClick={() => handleOptionToggle(group.id, option.value, group.multiSelect)}
                          className="flex w-full items-center justify-between rounded-md p-2 text-sm text-sabc-gray-700 hover:bg-sabc-gray-100 dark:text-sabc-gray-300 dark:hover:bg-sabc-gray-800"
                        >
                          <span>{option.label}</span>
                          {isOptionSelected(group.id, option.value) && (
                            <Check className="h-4 w-4 text-sabc-red-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedFilter;
