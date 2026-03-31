import React, { useState } from 'react';

// Following SABC design system color palette
const COLORS = {
  primary: '#E53E3E',    // Rouge SABC principal
  primaryLight: '#FED7D7', // Rouge clair backgrounds
  primaryDark: '#C53030',  // Rouge foncé hover/active
  accent: '#FF9800',     // Orange accent
  accentLight: '#FFE0B2', // Orange clair
  gray50: '#F5F5F5',     // Background app
  gray100: '#F5F5F5',    // Background cards
  gray200: '#E0E0E0',    // Bordures, séparateurs
  gray400: '#9E9E9E',    // Texte secondaire
  gray800: '#424242',    // Texte principal
  gray900: '#1A202C',    // Titres importants
};

export interface FilterOption {
  id: string;
  label: string;
  value: string | number | boolean;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'radio' | 'checkbox' | 'range' | 'date';
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
  dateRange?: boolean;
}

export interface AdvancedFilterProps {
  filters: FilterGroup[];
  onFilterChange: (filterId: string, values: any) => void;
  onClearFilters?: () => void;
  className?: string;
  title?: string;
  compact?: boolean;
  initialValues?: Record<string, any>;
}

export function AdvancedFilter({
  filters,
  onFilterChange,
  onClearFilters,
  className = '',
  title = 'Filtres',
  compact = false,
  initialValues = {},
}: AdvancedFilterProps) {
  const [selectedValues, setSelectedValues] = useState<Record<string, any>>(initialValues);
  const [expanded, setExpanded] = useState(!compact);

  const handleFilterChange = (filterId: string, value: any) => {
    const newValues = { ...selectedValues, [filterId]: value };
    setSelectedValues(newValues);
    onFilterChange(filterId, value);
  };

  const handleClearAll = () => {
    setSelectedValues({});
    if (onClearFilters) {
      onClearFilters();
    }
  };

  const renderFilterControl = (filter: FilterGroup) => {
    const value = selectedValues[filter.id] !== undefined ? selectedValues[filter.id] : '';

    switch (filter.type) {
      case 'select':
        return (
          <select
            id={`filter-${filter.id}`}
            className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
            value={value as string}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
          >
            <option value="">Tous</option>
            {filter.options?.map((option) => (
              <option key={option.id} value={option.value.toString()}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {filter.options?.map((option) => {
              const isSelected = Array.isArray(value) && value.includes(option.value);
              return (
                <label key={option.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    checked={isSelected}
                    onChange={() => {
                      const newValue = Array.isArray(value) ? [...value] : [];
                      if (isSelected) {
                        const index = newValue.indexOf(option.value);
                        if (index !== -1) {
                          newValue.splice(index, 1);
                        }
                      } else {
                        newValue.push(option.value);
                      }
                      handleFilterChange(filter.id, newValue);
                    }}
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              );
            })}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {filter.options?.map((option) => (
              <label key={option.id} className="flex items-center space-x-2">
                <input
                  type="radio"
                  className="border-gray-300 text-red-600 focus:ring-red-500"
                  name={`filter-${filter.id}`}
                  value={option.value.toString()}
                  checked={value === option.value}
                  onChange={() => handleFilterChange(filter.id, option.value)}
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {filter.options?.map((option) => (
              <label key={option.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  checked={value === option.value}
                  onChange={(e) => handleFilterChange(filter.id, e.target.checked ? option.value : null)}
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'range':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{filter.min}</span>
              <span className="text-xs text-gray-500">{filter.max}</span>
            </div>
            <input
              type="range"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
              min={filter.min}
              max={filter.max}
              step={filter.step || 1}
              value={value || filter.min}
              onChange={(e) => handleFilterChange(filter.id, Number(e.target.value))}
            />
            <div className="text-center text-sm font-medium text-gray-700">
              {value || filter.min}
            </div>
          </div>
        );

      case 'date':
        if (filter.dateRange) {
          return (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Début</label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-200 py-1.5 px-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    value={Array.isArray(value) ? value[0] : ''}
                    onChange={(e) => {
                      const newValue = Array.isArray(value) ? [...value] : ['', ''];
                      newValue[0] = e.target.value;
                      handleFilterChange(filter.id, newValue);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fin</label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-200 py-1.5 px-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    value={Array.isArray(value) ? value[1] : ''}
                    onChange={(e) => {
                      const newValue = Array.isArray(value) ? [...value] : ['', ''];
                      newValue[1] = e.target.value;
                      handleFilterChange(filter.id, newValue);
                    }}
                  />
                </div>
              </div>
            </div>
          );
        }
        return (
          <input
            type="date"
            className="w-full rounded-md border border-gray-200 py-2 px-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
            value={value as string}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      <div 
        className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="font-medium text-gray-800 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          {title}
        </h3>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {expanded && (
        <div className="p-4">
          <div className="space-y-4">
            {filters.map((filter) => (
              <div key={filter.id} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {filter.label}
                </label>
                {renderFilterControl(filter)}
              </div>
            ))}
          </div>

          {Object.keys(selectedValues).length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <button
                type="button"
                className="w-full py-2 px-4 bg-red-50 text-red-600 text-sm font-medium rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                onClick={handleClearAll}
              >
                Effacer tous les filtres
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
