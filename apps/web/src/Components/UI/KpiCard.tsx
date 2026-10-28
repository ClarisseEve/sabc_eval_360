import React from 'react';
import { cn } from '@/utils/helpers';

interface KpiCardProps {
  label: string;
  /** null ou undefined: mesure absente, affichée « n.d. » (jamais 0). */
  value: React.ReactNode | null | undefined;
  caption?: React.ReactNode;
  className?: string;
}

/** Indicateur clé: libellé, valeur en typographie d'affichage, légende. Sans icône ni couleur. */
export function KpiCard({ label, value, caption, className }: KpiCardProps) {
  const empty = value === null || value === undefined || value === '';
  return (
    <div className={cn('rounded-lg border border-sabc-gray-200 bg-white px-4 py-3 dark:border-sabc-gray-700 dark:bg-sabc-gray-900', className)}>
      <div className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">{label}</div>
      <div className="sabc-display mt-1 text-2xl tabular-nums text-sabc-gray-900 dark:text-white">{empty ? 'n.d.' : value}</div>
      {caption ? <div className="mt-0.5 text-xs text-sabc-gray-500 dark:text-sabc-gray-400">{caption}</div> : null}
    </div>
  );
}

/** Grille d'indicateurs: deux colonnes dès le mobile, quatre sur grand écran. */
export function KpiGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', className)}>{children}</div>;
}

export default KpiCard;
