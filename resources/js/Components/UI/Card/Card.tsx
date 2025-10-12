import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/helpers';

const cardVariants = cva(
  'rounded-lg border shadow-sm transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-sabc-gray-200 bg-white text-sabc-gray-800 dark:border-sabc-gray-700 dark:bg-sabc-gray-900 dark:text-sabc-gray-200',
        primary:
          'border-sabc-red-primary bg-white text-sabc-gray-800 dark:border-sabc-red-primary/80 dark:bg-sabc-gray-900 dark:text-sabc-gray-200',
        success:
          'border-sabc-success bg-white text-sabc-gray-800 dark:border-sabc-success/80 dark:bg-sabc-gray-900 dark:text-sabc-gray-200',
        warning:
          'border-sabc-warning bg-white text-sabc-gray-800 dark:border-sabc-warning/80 dark:bg-sabc-gray-900 dark:text-sabc-gray-200',
        error:
          'border-sabc-error bg-white text-sabc-gray-800 dark:border-sabc-error/80 dark:bg-sabc-gray-900 dark:text-sabc-gray-200',
        info:
          'border-sabc-info bg-white text-sabc-gray-800 dark:border-sabc-info/80 dark:bg-sabc-gray-900 dark:text-sabc-gray-200',
        plain: 'border-transparent bg-transparent text-inherit shadow-none dark:border-transparent dark:bg-transparent dark:text-inherit',
      },
      hover: {
        true: 'transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-sabc-gray-900/30',
      },
    },
    defaultVariants: {
      variant: 'default',
      hover: false,
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, hover, className }))}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-sabc-gray-500 dark:text-sabc-gray-400', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
