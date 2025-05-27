import * as React from 'react';
import { cn } from '@/utils/helpers';

export interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  tooltipContent: React.ReactNode;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

const Tooltip: React.FC<TooltipProps> = ({
  tooltipContent,
  children,
  position = 'top',
  delay = 300,
  className,
  ...props
}) => {
  const [visible, setVisible] = React.useState(false);
  let timeoutId: NodeJS.Timeout;

  const showTooltip = () => {
    timeoutId = setTimeout(() => setVisible(true), delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutId);
    setVisible(false);
  };

  const tooltipPositionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block" {...props}>
      {React.cloneElement(children, {
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
        onFocus: showTooltip,
        onBlur: hideTooltip,
      })}
      {visible && (
        <div
          className={cn(
            'absolute z-10 px-3 py-2 text-sm font-medium text-white bg-sabc-gray-900 rounded-md shadow-sm',
            tooltipPositionClasses[position],
            className
          )}
        >
          {tooltipContent}
          <div
            className={cn(
              'absolute w-2 h-2 bg-sabc-gray-900 transform rotate-45',
              {
                'bottom-[-4px] left-1/2 -translate-x-1/2': position === 'top',
                'top-[-4px] left-1/2 -translate-x-1/2': position === 'bottom',
                'right-[-4px] top-1/2 -translate-y-1/2': position === 'left',
                'left-[-4px] top-1/2 -translate-y-1/2': position === 'right',
              }
            )}
          />
        </div>
      )}
    </div>
  );
};

Tooltip.displayName = 'Tooltip';

export { Tooltip };
export default Tooltip;
