import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/helpers';

const statusBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        draft: 'bg-sabc-gray-100 text-sabc-gray-500 border border-sabc-gray-200 dark:bg-sabc-gray-800 dark:text-sabc-gray-400 dark:border-sabc-gray-700',
        pending: 'bg-sabc-accent-light text-sabc-accent border border-sabc-accent/20 dark:bg-sabc-accent/20 dark:text-sabc-accent-light dark:border-sabc-accent/30',
        validated: 'bg-sabc-success/20 text-sabc-success border border-sabc-success/20 dark:bg-sabc-success/20 dark:text-sabc-success dark:border-sabc-success/30',
        rejected: 'bg-sabc-error/20 text-sabc-error border border-sabc-error/20 dark:bg-sabc-error/20 dark:text-sabc-error dark:border-sabc-error/30',
        overdue: 'bg-sabc-error/20 text-sabc-error border border-sabc-error/20 dark:bg-sabc-error/20 dark:text-sabc-error dark:border-sabc-error/30',
        info: 'bg-sabc-info/20 text-sabc-info border border-sabc-info/20 dark:bg-sabc-info/20 dark:text-sabc-info dark:border-sabc-info/30',
        warning: 'bg-sabc-warning/20 text-sabc-warning border border-sabc-warning/20 dark:bg-sabc-warning/20 dark:text-sabc-warning dark:border-sabc-warning/30',
        success: 'bg-sabc-success/20 text-sabc-success border border-sabc-success/20 dark:bg-sabc-success/20 dark:text-sabc-success dark:border-sabc-success/30',
        error: 'bg-sabc-error/20 text-sabc-error border border-sabc-error/20 dark:bg-sabc-error/20 dark:text-sabc-error dark:border-sabc-error/30',
      },
      size: {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-xs px-2.5 py-0.5',
        lg: 'text-sm px-3 py-1',
      },
      withDot: {
        true: 'pl-2',
      },
    },
    defaultVariants: {
      variant: 'draft',
      size: 'md',
      withDot: false,
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  label?: string;
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, variant, size, withDot, label, ...props }, ref) => {
    const statusLabels = {
      draft: 'Brouillon',
      pending: 'En attente',
      validated: 'Validé',
      rejected: 'Rejeté',
      overdue: 'En retard',
      info: 'Information',
      warning: 'Attention',
      success: 'Succès',
      error: 'Erreur',
    };

    const displayLabel = label || (variant && statusLabels[variant as keyof typeof statusLabels]) || 'État';

    return (
      <div
        ref={ref}
        className={cn(statusBadgeVariants({ variant, size, withDot, className }))}
        {...props}
      >
        {withDot && (
          <div className={cn('mr-1 h-2 w-2 rounded-full', {
            'bg-sabc-gray-400': variant === 'draft',
            'bg-sabc-accent': variant === 'pending',
            'bg-sabc-success': variant === 'validated' || variant === 'success',
            'bg-sabc-error': variant === 'rejected' || variant === 'overdue' || variant === 'error',
            'bg-sabc-warning': variant === 'warning',
            'bg-sabc-info': variant === 'info',
          })} />
        )}
        {displayLabel}
      </div>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

export { StatusBadge, statusBadgeVariants };
