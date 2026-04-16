import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils/helpers';
import { Input } from '@/Components/UI/Input/Input';
import { Button } from '@/Components/UI/Button/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/Components/UI/DropdownMenu/DropdownMenu';
import { Badge } from '@/Components/UI/Badge/Badge';

export interface FilterOption {
  id: string;
  label: string;
  options?: { value: string; label: string }[];
  isMulti?: boolean;
}

interface SearchFilterProps {
  id?: string;
  label?: string;
  options?: { value: string; label: string }[];
  isMulti?: boolean;
  placeholder?: string;
  filters?: FilterOption[];
  onSearch?: (value: string) => void;
  onFilterChange?: (filterId: string, values: string[]) => void;
  onChange?: (values: string[]) => void;
  className?: string;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  id,
  label,
  options,
  isMulti,
  placeholder = 'Rechercher...',
  filters = [],
  onSearch,
  onFilterChange,
  onChange,
  className,
}) => {
  const resolvedFilters = React.useMemo<FilterOption[]>(() => {
    if (filters.length > 0) {
      return filters;
    }

    if (id && label) {
      return [{ id, label, options, isMulti }];
    }

    return [];
  }, [filters, id, isMulti, label, options]);

  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Compte le nombre total de filtres actifs
  const activeFiltersCount = Object.values(activeFilters).reduce(
    (count, values) => count + values.length, 
    0
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch?.(value);
  };

  const handleFilterToggle = (filterId: string, value: string) => {
    const currentValues = activeFilters[filterId] || [];
    const filter = resolvedFilters.find(f => f.id === filterId);
    
    let newValues: string[];
    
    if (filter?.isMulti) {
      // Pour les filtres multi-sélection
      if (currentValues.includes(value)) {
        newValues = currentValues.filter(v => v !== value);
      } else {
        newValues = [...currentValues, value];
      }
    } else {
      // Pour les filtres à sélection unique
      newValues = currentValues.includes(value) ? [] : [value];
    }
    
    const updatedFilters = {
      ...activeFilters,
      [filterId]: newValues
    };
    
    setActiveFilters(updatedFilters);
    onFilterChange?.(filterId, newValues);
    if (id === filterId) {
      onChange?.(newValues);
    }
  };

  const clearFilter = (filterId: string) => {
    const updatedFilters = { ...activeFilters };
    delete updatedFilters[filterId];
    setActiveFilters(updatedFilters);
    onFilterChange?.(filterId, []);
    if (id === filterId) {
      onChange?.([]);
    }
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    resolvedFilters.forEach(filter => {
      onFilterChange?.(filter.id, []);
    });
    onChange?.([]);
  };

  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {/* Barre de recherche */}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sabc-gray-400" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchValue}
            onChange={handleSearch}
            className="pl-10 pr-4 h-10 w-full"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full p-0"
              onClick={() => {
                setSearchValue('');
                onSearch?.('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Bouton de filtres */}
        {resolvedFilters.length > 0 && (
          <DropdownMenu open={showFilters} onOpenChange={setShowFilters}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="flex items-center gap-1 cursor-pointer"
              >
                <Filter className="h-4 w-4" />
                <span>Filtres</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="primary" className="ml-1 h-5 min-w-5 px-1 flex items-center justify-center">
                    {activeFiltersCount}
                  </Badge>
                )}
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-sabc-gray-300 dark:scrollbar-thumb-sabc-gray-700">
              {resolvedFilters.map((filter) => (
                <div key={filter.id} className="px-2 py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{filter.label}</span>
                    {activeFilters[filter.id]?.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => clearFilter(filter.id)}
                      >
                        Effacer
                      </Button>
                    )}
                  </div>
                  <div className="mt-1 space-y-0.5 max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-sabc-gray-300 dark:scrollbar-thumb-sabc-gray-700">
                    {filter.options?.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        className="flex items-center gap-2 rounded-md px-2 py-0.5 text-xs cursor-pointer hover:bg-sabc-gray-100 dark:hover:bg-sabc-gray-800"
                        onSelect={(e) => {
                          e.preventDefault();
                          handleFilterToggle(filter.id, option.value);
                        }}
                      >
                        <div className={cn(
                          "flex h-4 w-4 items-center justify-center rounded border border-sabc-gray-300",
                          activeFilters[filter.id]?.includes(option.value)
                            ? "bg-sabc-red-primary border-sabc-red-primary"
                            : "bg-transparent"
                        )}>
                          {activeFilters[filter.id]?.includes(option.value) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <span>{option.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </div>
              ))}
              {activeFiltersCount > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={clearAllFilters}
                    >
                      Effacer tous les filtres
                    </Button>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Affichage des filtres actifs */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(activeFilters).map(([filterId, values]) => {
            if (values.length === 0) return null;
            
            const filter = resolvedFilters.find(f => f.id === filterId);
            
            return values.map(value => {
              const option = filter?.options?.find(o => o.value === value);
              if (!option) return null;
              
              return (
                <Badge 
                  key={`${filterId}-${value}`} 
                  variant="outline"
                  className="flex items-center gap-1 px-2 py-1 bg-sabc-gray-100 dark:bg-sabc-gray-800"
                >
                  <span className="text-xs font-medium">{filter?.label}: {option.label}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 ml-1 hover:bg-sabc-gray-200 dark:hover:bg-sabc-gray-700 rounded-full"
                    onClick={() => handleFilterToggle(filterId, value)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            });
          })}
          
          {activeFiltersCount > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={clearAllFilters}
            >
              Effacer tout
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchFilter;
