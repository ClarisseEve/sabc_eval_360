import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/helpers';

const badgeVariants = cva(
  'inline-flex items-center whitespace-nowrap rounded border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-sabc-gray-200 bg-sabc-gray-100 text-sabc-gray-700 dark:border-sabc-gray-700 dark:bg-sabc-gray-800 dark:text-sabc-gray-300',
        primary:
          'border-transparent bg-sabc-red-primary/10 text-sabc-red-primary dark:bg-sabc-red-primary/20 dark:text-sabc-red-light',
        success:
          'border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        warning:
          'border-transparent bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        // Information neutre: gris acier de la marque plutôt qu'un bleu étranger à la charte.
        info:
          'border-sabc-gray-300 bg-white text-sabc-gray-700 dark:border-sabc-gray-600 dark:bg-transparent dark:text-sabc-gray-300',
        error:
          'border-transparent bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        secondary:
          'border-transparent bg-sabc-gray-100 text-sabc-gray-600 dark:bg-sabc-gray-800 dark:text-sabc-gray-400',
        destructive:
          'border-transparent bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        outline: 'border-sabc-gray-200 text-sabc-gray-700 dark:border-sabc-gray-700 dark:text-sabc-gray-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
