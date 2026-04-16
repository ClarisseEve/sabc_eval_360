import * as React from 'react';
import { cn } from '@/utils/helpers';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-xl border border-sabc-gray-200 bg-white px-3.5 py-2 text-sm placeholder:text-sabc-gray-400 transition-colors duration-200 focus:outline-none focus:border-sabc-gray-400 focus:ring-1 focus:ring-sabc-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-sabc-gray-700 dark:bg-sabc-gray-900 dark:text-white dark:placeholder:text-sabc-gray-500 dark:focus:border-sabc-gray-500 dark:focus:ring-sabc-gray-600",
            error && "border-sabc-error focus:ring-sabc-error/50",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-sabc-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
