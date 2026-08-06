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
  const tooltipId = React.useId();
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState({ top: 0, left: 0 });
  // Des `let` au corps du composant seraient réinitialisés à chaque rendu:
  // les clearTimeout ne retrouveraient plus les minuteurs à annuler.
  const timeoutId = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  const showTooltip = () => {
    clearTimeout(timeoutId.current);
    timeoutId.current = setTimeout(() => {
      setVisible(true);
      setTimeout(updatePosition, 0);
    }, delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutId.current);
    setVisible(false);
  };

  // Éviter qu'un minuteur en cours ne déclenche un setState après démontage.
  React.useEffect(() => {
    return () => {
      clearTimeout(timeoutId.current);
    };
  }, []);

  React.useEffect(() => {
    if (!visible) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hideTooltip();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [visible]);

  // Fonction pour calculer et mettre à jour la position du tooltip
  const updatePosition = () => {
    if (!tooltipRef.current || !containerRef.current) return;

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const triggerRect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    let top = 0;
    let left = 0;
    
    // Calculer la position en fonction du placement demandé
    switch (position) {
      case 'top':
        // Positionner le tooltip au-dessus avec un décalage plus important (15px au lieu de 8px)
        top = triggerRect.top - tooltipRect.height - 15;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        // Positionner le tooltip en dessous avec un décalage plus important
        top = triggerRect.bottom + 15;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        // Positionner le tooltip à gauche avec un décalage plus important
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.left - tooltipRect.width - 15;
        break;
      case 'right':
        // Positionner le tooltip à droite avec un décalage plus important
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.right + 15;
        break;
    }
    
    // Éviter que le tooltip soit coupé par les bords de l'écran
    // Marge de sécurité de 10px par rapport aux bords
    if (top < 10) {
      top = 10;
    } else if (top + tooltipRect.height > viewportHeight - 10) {
      top = viewportHeight - tooltipRect.height - 10;
    }
    
    if (left < 10) {
      left = 10;
    } else if (left + tooltipRect.width > viewportWidth - 10) {
      left = viewportWidth - tooltipRect.width - 10;
    }
    
    setTooltipPosition({ top, left });
  };

  // Mettre à jour la position lors du scroll ou du redimensionnement
  React.useEffect(() => {
    if (visible) {
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [visible]);

  // Utiliser React.useLayoutEffect pour obtenir la position du trigger après le rendu
  React.useLayoutEffect(() => {
    if (visible && containerRef.current) {
      updatePosition();
    }
  }, [visible]);

  return (
    <div className="relative inline-block" ref={containerRef} {...props}>
      {React.cloneElement(children, {
        'aria-describedby': visible
          ? tooltipId
          : (children.props as React.HTMLAttributes<HTMLElement>)['aria-describedby'],
        onMouseEnter: (event: React.MouseEvent<HTMLElement>) => {
          children.props.onMouseEnter?.(event);
          showTooltip();
        },
        onMouseLeave: (event: React.MouseEvent<HTMLElement>) => {
          children.props.onMouseLeave?.(event);
          hideTooltip();
        },
        onFocus: (event: React.FocusEvent<HTMLElement>) => {
          children.props.onFocus?.(event);
          showTooltip();
        },
        onBlur: (event: React.FocusEvent<HTMLElement>) => {
          children.props.onBlur?.(event);
          hideTooltip();
        },
      })}
      {visible && (
        <div
          id={tooltipId}
          role="tooltip"
          ref={tooltipRef}
          className={cn(
            'fixed z-50 px-3 py-2 text-sm font-medium rounded-md shadow-md',
            'text-white dark:text-white',
            'bg-sabc-gray-900 dark:bg-sabc-gray-800',
            'border border-sabc-gray-700 dark:border-sabc-gray-600',
            className
          )}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
};

Tooltip.displayName = 'Tooltip';

export { Tooltip };
export default Tooltip;
