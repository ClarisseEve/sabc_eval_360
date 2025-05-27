import * as React from 'react';
import { cn } from '@/utils/helpers';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'avatar' | 'text' | 'card' | 'table';
  width?: string | number;
  height?: string | number;
  rows?: number;
  circle?: boolean;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', width, height, rows = 1, circle = false, ...props }, ref) => {
    const baseClasses = 'animate-pulse rounded bg-sabc-gray-200 dark:bg-sabc-gray-800';
    
    // Styles pour différentes variantes
    const variantClasses = {
      default: '',
      avatar: 'h-10 w-10 rounded-full',
      text: 'h-4 w-full',
      card: 'h-[180px] w-full rounded-lg',
      table: 'h-8 w-full',
    };
    
    // Gestion des dimensions personnalisées
    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;
    if (circle) style.borderRadius = '50%';
    
    // Rendu pour les variantes avec plusieurs lignes
    if (variant === 'text' && rows > 1) {
      return (
        <div ref={ref} className={cn('space-y-2', className)} {...props}>
          {Array.from({ length: rows }).map((_, index) => (
            <div 
              key={index} 
              className={cn(
                baseClasses, 
                variantClasses[variant],
                // Dernière ligne plus courte pour un effet plus naturel
                index === rows - 1 ? 'w-4/5' : ''
              )}
              style={style}
            />
          ))}
        </div>
      );
    }
    
    // Rendu pour la variante table
    if (variant === 'table') {
      return (
        <div ref={ref} className={cn('space-y-3', className)} {...props}>
          <div className={cn(baseClasses, 'h-8 w-full')} />
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className={cn(baseClasses, 'h-12 w-full')} />
          ))}
        </div>
      );
    }
    
    // Rendu standard pour les autres variantes
    return (
      <div
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], className)}
        style={style}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

export { Skeleton };
