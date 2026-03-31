import * as React from 'react';
import { cn } from '@/utils/helpers';

export interface SliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  showLabels?: boolean;
  marks?: { value: number; label: string }[];
  tooltip?: boolean;
  disabled?: boolean;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ 
    className, 
    min = 0, 
    max = 100, 
    step = 1, 
    defaultValue = 0, 
    value: controlledValue, 
    onChange, 
    showLabels = false, 
    marks = [], 
    tooltip = false, 
    disabled = false,
    ...props 
  }, ref) => {
    // Utiliser un état local pour les composants non contrôlés
    const [localValue, setLocalValue] = React.useState(defaultValue);
    const [showTooltip, setShowTooltip] = React.useState(false);
    
    // Déterminer si le composant est contrôlé ou non
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : localValue;
    
    // Calculer le pourcentage pour le positionnement du thumb
    const percentage = ((value - min) / (max - min)) * 100;
    
    // Gérer le changement de valeur
    const handleChange = (newValue: number) => {
      if (disabled) return;
      
      // Limiter la valeur entre min et max, et arrondir selon le step
      const clampedValue = Math.min(max, Math.max(min, newValue));
      const steppedValue = Math.round((clampedValue - min) / step) * step + min;
      
      if (!isControlled) {
        setLocalValue(steppedValue);
      }
      
      if (onChange) {
        onChange(steppedValue);
      }
    };
    
    // Gérer le clic sur la track
    const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      
      const trackRect = e.currentTarget.getBoundingClientRect();
      const clickPosition = e.clientX - trackRect.left;
      const trackWidth = trackRect.width;
      
      const newValue = min + (clickPosition / trackWidth) * (max - min);
      handleChange(newValue);
    };
    
    // Gérer le drag du thumb
    const handleThumbDrag = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      
      const trackRect = e.currentTarget.parentElement?.getBoundingClientRect();
      if (!trackRect) return;
      
      const startPosition = e.clientX;
      const startValue = value;
      
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startPosition;
        const deltaValue = (deltaX / trackRect.width) * (max - min);
        const newValue = startValue + deltaValue;
        
        handleChange(newValue);
      };
      
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        setShowTooltip(false);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      setShowTooltip(true);
    };
    
    // Trouver le mark correspondant à la valeur actuelle
    const currentMark = marks.find(mark => mark.value === value);
    
    return (
      <div 
        className={cn(
          'relative w-full touch-none select-none',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )} 
        ref={ref}
        {...props}
      >
        {/* Track */}
        <div 
          className="relative h-2 w-full rounded-full bg-sabc-gray-200 dark:bg-sabc-gray-800"
          onClick={handleTrackClick}
        >
          {/* Fill */}
          <div 
            className="absolute h-full rounded-full bg-sabc-red-primary dark:bg-sabc-red-400"
            style={{ width: `${percentage}%` }}
          />
          
          {/* Thumb */}
          <div 
            className={cn(
              'absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sabc-red-primary bg-white transition-all',
              !disabled && 'cursor-grab active:cursor-grabbing',
              disabled && 'cursor-not-allowed'
            )}
            style={{ left: `${percentage}%` }}
            onMouseDown={handleThumbDrag}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          />
          
          {/* Marks */}
          {marks.map((mark) => {
            const markPercentage = ((mark.value - min) / (max - min)) * 100;
            return (
              <div 
                key={mark.value}
                className="absolute top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sabc-gray-400 dark:bg-sabc-gray-600"
                style={{ left: `${markPercentage}%` }}
              />
            );
          })}
          
          {/* Tooltip */}
          {tooltip && showTooltip && (
            <div 
              className="absolute -top-8 rounded-md bg-sabc-gray-900 px-2 py-1 text-xs font-medium text-white"
              style={{ 
                left: `${percentage}%`, 
                transform: 'translateX(-50%)' 
              }}
            >
              {currentMark?.label || value}
            </div>
          )}
        </div>
        
        {/* Labels */}
        {showLabels && (
          <div className="mt-2 flex justify-between text-xs text-sabc-gray-500 dark:text-sabc-gray-400">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        )}
        
        {/* Marks labels */}
        {marks.length > 0 && (
          <div className="relative mt-1 h-6">
            {marks.map((mark) => {
              const markPercentage = ((mark.value - min) / (max - min)) * 100;
              return (
                <div 
                  key={mark.value}
                  className="absolute text-xs text-sabc-gray-500 dark:text-sabc-gray-400"
                  style={{ 
                    left: `${markPercentage}%`, 
                    transform: 'translateX(-50%)' 
                  }}
                >
                  {mark.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export { Slider };
export default Slider;
