import * as React from 'react';
import { cn } from '@/utils/helpers';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning';
}

export const Alert: React.FC<AlertProps> = ({ 
  children, 
  className, 
  variant = 'default', 
  ...props 
}) => {
  const variantClasses = {
    default: "bg-sabc-gray-100 text-sabc-gray-800 border-sabc-gray-200",
    destructive: "bg-sabc-error/10 text-sabc-error border-sabc-error/20",
    success: "bg-sabc-success/10 text-sabc-success border-sabc-success/20",
    warning: "bg-sabc-warning/10 text-sabc-warning border-sabc-warning/20",
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        variantClasses[variant],
        className
      )}
      role="alert"
      {...props}
    >
      {children}
    </div>
  );
};

export interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const AlertTitle: React.FC<AlertTitleProps> = ({ 
  children, 
  className, 
  ...props 
}) => {
  return (
    <h5
      className={cn(
        "mb-1 font-medium leading-none tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h5>
  );
};

export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const AlertDescription: React.FC<AlertDescriptionProps> = ({ 
  children, 
  className, 
  ...props 
}) => {
  return (
    <div
      className={cn(
        "text-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Alert;
