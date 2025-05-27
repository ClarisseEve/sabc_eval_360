import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/helpers';

const progressVariants = cva(
  'relative h-2 w-full overflow-hidden rounded-full bg-sabc-gray-200 dark:bg-sabc-gray-800',
  {
    variants: {
      variant: {
        default: '',
        success: '',
        warning: '',
        error: '',
        info: '',
      },
      size: {
        sm: 'h-1',
        default: 'h-2',
        lg: 'h-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const progressIndicatorVariants = cva(
  'h-full w-full flex-1 rounded-full transition-all',
  {
    variants: {
      variant: {
        default: 'bg-sabc-red-primary dark:bg-sabc-red-400',
        success: 'bg-sabc-success dark:bg-sabc-success/80',
        warning: 'bg-sabc-warning dark:bg-sabc-warning/80',
        error: 'bg-sabc-error dark:bg-sabc-error/80',
        info: 'bg-sabc-info dark:bg-sabc-info/80',
      },
      animated: {
        true: 'transition-all duration-300 ease-in-out',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      animated: true,
    },
  }
);

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value?: number;
  max?: number;
  animated?: boolean;
  showValue?: boolean;
  valuePosition?: 'top' | 'right' | 'inside';
  indicatorVariant?: VariantProps<typeof progressIndicatorVariants>['variant'];
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    className, 
    value = 0, 
    max = 100, 
    variant, 
    size, 
    animated = true,
    showValue = false,
    valuePosition = 'right',
    indicatorVariant,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max(0, (value / max) * 100), 100);
    const actualIndicatorVariant = indicatorVariant || variant;
    
    return (
      <div className="relative">
        {showValue && valuePosition === 'top' && (
          <div className="mb-1 flex justify-end text-xs font-medium text-sabc-gray-500 dark:text-sabc-gray-400">
            {Math.round(percentage)}%
          </div>
        )}
        
        <div
          ref={ref}
          className={cn(progressVariants({ variant, size, className }))}
          {...props}
        >
          <div
            className={cn(
              progressIndicatorVariants({ variant: actualIndicatorVariant, animated })
            )}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
          >
            {showValue && valuePosition === 'inside' && percentage > 20 && (
              <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        </div>
        
        {showValue && valuePosition === 'right' && (
          <div className="ml-2 inline-block text-xs font-medium text-sabc-gray-500 dark:text-sabc-gray-400">
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress };
