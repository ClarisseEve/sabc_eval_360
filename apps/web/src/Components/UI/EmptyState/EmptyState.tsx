import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Icône lucide (par défaut : Inbox). */
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Zone d'action : CTA principal (bouton, lien…). */
  action?: React.ReactNode;
  /** 'default' (premier usage / vide) ou 'error' (échec de chargement). */
  variant?: 'default' | 'error';
  className?: string;
}

/**
 * État vide normalisé (style ClickUp/Linear) : icône cerclée + titre + texte
 * explicatif + CTA optionnel. À utiliser pour les listes/tables vides,
 * l'absence de résultat de recherche et les erreurs de chargement.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  variant = 'default',
  className,
}) => {
  const isError = variant === 'error';
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-sabc-gray-200 bg-sabc-gray-50/50 px-6 py-12 text-center dark:border-sabc-gray-700 dark:bg-sabc-gray-900/40',
        className,
      )}
    >
      <span
        className={cn(
          'mb-4 flex h-12 w-12 items-center justify-center rounded-full',
          isError ? 'bg-sabc-error/10 text-sabc-error' : 'bg-sabc-gray-100 text-sabc-gray-400 dark:bg-sabc-gray-800',
        )}
      >
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="text-sm font-semibold text-sabc-gray-900">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm leading-6 text-sabc-gray-600">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
};

export default EmptyState;
