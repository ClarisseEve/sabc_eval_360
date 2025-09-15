import * as React from 'react';
import { cn } from '@/utils/helpers';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({ 
  children, 
  className, 
  ...props 
}) => {
  return (
    <label 
      className={cn(
        "text-sm font-medium text-sabc-gray-800 dark:text-sabc-gray-200",
        className
      )} 
      {...props}
    >
      {children}
    </label>
  );
};

export default Label;
