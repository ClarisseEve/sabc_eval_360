import React from 'react';
import { cn } from '@/lib/utils';

type Width = 'narrow' | 'default' | 'wide' | 'full';

const WIDTHS: Record<Width, string> = {
  narrow: 'max-w-3xl',
  default: 'max-w-5xl',
  wide: 'max-w-7xl',
  full: 'max-w-none',
};

interface PageContainerProps {
  children: React.ReactNode;
  /** Largeur maximale du contenu. Défaut : wide. */
  width?: Width;
  className?: string;
}

/**
 * Conteneur de page normalisé : largeur, padding et rythme vertical (grille 8px)
 * cohérents sur toutes les pages. À utiliser avec <PageHeader/>.
 */
export const PageContainer: React.FC<PageContainerProps> = ({ children, width = 'wide', className }) => {
  return (
    <div className={cn('mx-auto w-full px-4 py-6 sm:px-6 lg:px-8', WIDTHS[width], className)}>
      <div className="space-y-6">{children}</div>
    </div>
  );
};

export default PageContainer;
