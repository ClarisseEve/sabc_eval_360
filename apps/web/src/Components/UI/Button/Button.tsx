import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/helpers';

// Composant Spinner pour l'état de chargement
const Spinner = ({ className }: { className?: string }) => (
  <svg
    className={cn('h-4 w-4 animate-spin', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sabc-red-primary/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white dark:ring-offset-sabc-gray-950 cursor-pointer active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: 'bg-sabc-red-primary text-white shadow-sm hover:bg-sabc-red-dark hover:shadow-md dark:bg-sabc-red-primary dark:text-white dark:hover:bg-sabc-red-dark',
        primary: 'bg-sabc-red-primary text-white shadow-sm hover:bg-sabc-red-dark hover:shadow-md dark:bg-sabc-red-primary dark:text-white dark:hover:bg-sabc-red-dark',
        success: 'bg-sabc-success text-white shadow-sm hover:bg-sabc-success/90 hover:shadow-md',
        warning: 'bg-sabc-warning text-white shadow-sm hover:bg-sabc-warning/90 hover:shadow-md',
        info: 'bg-sabc-info text-white shadow-sm hover:bg-sabc-info/90 hover:shadow-md',
        error: 'bg-sabc-error text-white shadow-sm hover:bg-sabc-error/90 hover:shadow-md',
        destructive: 'bg-red-500 text-white shadow-sm hover:bg-red-600 hover:shadow-md dark:bg-red-500 dark:text-white dark:hover:bg-red-600',
        outline: 'border border-sabc-gray-200 bg-white hover:bg-sabc-gray-50 hover:border-sabc-gray-300 dark:border-sabc-gray-700 dark:bg-transparent dark:text-sabc-gray-200 dark:hover:bg-sabc-gray-800/50 dark:hover:border-sabc-gray-600',
        secondary: 'bg-sabc-gray-100 text-sabc-gray-700 hover:bg-sabc-gray-200 dark:bg-sabc-gray-800 dark:text-sabc-gray-200 dark:hover:bg-sabc-gray-700',
        ghost: 'text-sabc-gray-700 hover:bg-sabc-gray-100 dark:text-sabc-gray-200 dark:hover:bg-sabc-gray-800/50',
        link: 'text-sabc-red-primary underline-offset-4 hover:underline hover:text-sabc-red-dark dark:text-sabc-red-light dark:hover:text-sabc-red-primary',
      },
      size: {
        default: 'h-9 px-4',
        sm: 'h-8 px-3 rounded-lg text-[0.8125rem]',
        lg: 'h-10 px-6 rounded-xl text-sm',
        icon: 'h-9 w-9 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }: ButtonProps, ref: React.ForwardedRef<HTMLButtonElement>) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner className="mr-2" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button;
