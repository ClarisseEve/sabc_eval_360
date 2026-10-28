import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Crumb {
  label: string;
  /** Cible React Router. Absent = élément courant (non cliquable). */
  to?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  /** Zone d'actions alignée à droite (bouton primaire, menu, filtres…). */
  actions?: React.ReactNode;
  /** Ligne d'information discrète sous le titre (période active, périmètre…). */
  meta?: React.ReactNode;
  className?: string;
}

/**
 * En-tête de page contextuel normalisé (style ClickUp/Linear) :
 * fil d'Ariane (React Router, sans rechargement) + titre à échelle unique
 * + description optionnelle + slot d'action primaire à droite.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, breadcrumbs, actions, meta, className }) => {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="min-w-0 space-y-1">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-1 text-sm text-sabc-gray-500">
            {breadcrumbs.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                {index > 0 ? <ChevronRight className="h-4 w-4 flex-shrink-0 text-sabc-gray-300" aria-hidden="true" /> : null}
                {crumb.to ? (
                  <Link to={crumb.to} className="truncate transition-colors hover:text-sabc-gray-800">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="truncate font-medium text-sabc-gray-700" aria-current="page">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className="text-2xl text-sabc-gray-900 dark:text-white">{title}</h1>
        {description ? <p className="max-w-2xl text-sm leading-6 text-sabc-gray-600 dark:text-sabc-gray-400">{description}</p> : null}
        {meta ? <p className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">{meta}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">{actions}</div> : null}
    </header>
  );
};

export default PageHeader;
