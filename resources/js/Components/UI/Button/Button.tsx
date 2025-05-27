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
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sabc-red-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white dark:ring-offset-sabc-gray-900',
  {
    variants: {
      variant: {
        default: 'bg-sabc-red-primary text-white hover:bg-sabc-red-dark',
        destructive: 'bg-sabc-error text-white hover:bg-sabc-error/90',
        outline: 'border border-sabc-gray-200 bg-transparent hover:bg-sabc-gray-100 dark:border-sabc-gray-800 dark:hover:bg-sabc-gray-800',
        secondary: 'bg-sabc-gray-100 text-sabc-gray-900 hover:bg-sabc-gray-200 dark:bg-sabc-gray-800 dark:text-sabc-gray-50 dark:hover:bg-sabc-gray-700',
        ghost: 'hover:bg-sabc-gray-100 hover:text-sabc-gray-900 dark:hover:bg-sabc-gray-800 dark:hover:text-sabc-gray-50',
        link: 'text-sabc-red-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
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
