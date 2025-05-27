import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/helpers';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-sabc-gray-900 text-sabc-gray-50 hover:bg-sabc-gray-800 dark:bg-sabc-gray-50 dark:text-sabc-gray-900 dark:hover:bg-sabc-gray-100',
        primary:
          'border-transparent bg-sabc-red-primary text-white hover:bg-sabc-red-dark',
        secondary:
          'border-transparent bg-sabc-gray-100 text-sabc-gray-900 hover:bg-sabc-gray-200 dark:bg-sabc-gray-800 dark:text-sabc-gray-50 dark:hover:bg-sabc-gray-700',
        destructive:
          'border-transparent bg-sabc-error text-white hover:bg-sabc-error/80',
        outline: 'text-sabc-gray-900 dark:text-sabc-gray-50',
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
