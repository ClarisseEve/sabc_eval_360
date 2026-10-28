import * as React from 'react';
import { cn } from '@/utils/helpers';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, id, 'aria-describedby': ariaDescribedBy, 'aria-errormessage': ariaErrorMessage, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const describedBy = [ariaDescribedBy, error ? errorId : null].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full">
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-sabc-gray-300 bg-white px-3.5 py-2 text-sm placeholder:text-sabc-gray-500 transition-colors duration-200 focus:border-sabc-red-dark focus:outline-none focus:ring-2 focus:ring-sabc-red-primary/25 disabled:cursor-not-allowed disabled:opacity-50 dark:border-sabc-gray-600 dark:bg-sabc-gray-900 dark:text-white dark:placeholder:text-sabc-gray-500 dark:focus:border-sabc-red-light dark:focus:ring-sabc-red-primary/30",
            error && "border-sabc-error focus:border-sabc-error focus:ring-sabc-error/25",
            className
          )}
          {...props}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={describedBy}
          aria-errormessage={error ? errorId : ariaErrorMessage}
          ref={ref}
        />
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-sabc-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
