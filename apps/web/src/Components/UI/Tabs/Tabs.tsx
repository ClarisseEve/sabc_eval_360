import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/helpers';

const tabsRootVariants = cva('', {
  variants: {
    variant: {
      default: '',
      primary: '',
      card: '',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const tabsListVariants = cva(
  'inline-flex items-center justify-center rounded-xl bg-sabc-gray-100 p-0.5 dark:bg-sabc-gray-800',
  {
    variants: {
      variant: {
        default: '',
        primary: 'border-b border-sabc-gray-200 bg-transparent p-0 dark:border-sabc-gray-800',
        card: 'bg-transparent p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const tabsTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sabc-red-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-sabc-gray-900',
  {
    variants: {
      variant: {
        default:
          'text-sabc-gray-500 data-[state=active]:bg-white data-[state=active]:text-sabc-gray-900 data-[state=active]:shadow-sm data-[state=active]:font-semibold dark:data-[state=active]:bg-sabc-gray-900 dark:data-[state=active]:text-sabc-gray-50',
        primary:
          'relative h-9 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-sabc-gray-500 shadow-none transition-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:scale-x-0 after:bg-sabc-red-primary after:transition-transform hover:text-sabc-gray-900 data-[state=active]:border-b-0 data-[state=active]:text-sabc-red-primary data-[state=active]:shadow-none data-[state=active]:after:scale-x-100 dark:text-sabc-gray-400 dark:hover:text-sabc-gray-50 dark:data-[state=active]:text-sabc-red-400',
        card:
          'rounded-xl border border-sabc-gray-200 bg-white px-4 py-2 font-medium text-sabc-gray-400 shadow-none transition-all duration-200 hover:bg-sabc-gray-50 hover:text-sabc-gray-700 data-[state=active]:border-sabc-red-primary data-[state=active]:bg-sabc-red-primary data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-sabc-red-primary/25 data-[state=active]:font-semibold dark:border-sabc-gray-700 dark:bg-sabc-gray-900 dark:text-sabc-gray-500 dark:hover:bg-sabc-gray-800 dark:hover:text-sabc-gray-200 dark:data-[state=active]:border-sabc-red-400 dark:data-[state=active]:bg-sabc-red-500 dark:data-[state=active]:text-white dark:data-[state=active]:shadow-sabc-red-500/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const tabsContentVariants = cva(
  'mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sabc-red-primary focus-visible:ring-offset-2 dark:ring-offset-sabc-gray-900',
  {
    variants: {
      variant: {
        default: '',
        primary: 'mt-3',
        card: 'mt-3',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface TabsProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tabsRootVariants> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
  variant: VariantProps<typeof tabsRootVariants>['variant'];
  baseId: string;
} | null>(null);

const tabDomId = (baseId: string, kind: 'tab' | 'panel', value: string) =>
  `${baseId}-${kind}-${value.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, variant, defaultValue, value, onValueChange, ...props }, ref) => {
    const [tabValue, setTabValue] = React.useState(value || defaultValue || '');
    const baseId = React.useId();
    
    const handleValueChange = React.useCallback((newValue: string) => {
      setTabValue(newValue);
      onValueChange?.(newValue);
    }, [onValueChange]);
    
    // Update internal state when controlled value changes
    React.useEffect(() => {
      if (value !== undefined && value !== tabValue) {
        setTabValue(value);
      }
    }, [value, tabValue]);
    
    return (
      <TabsContext.Provider value={{ value: tabValue, onValueChange: handleValueChange, variant, baseId }}>
        <div
          ref={ref}
          className={cn(tabsRootVariants({ variant, className }))}
          {...props}
        />
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = 'Tabs';

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof tabsListVariants>
>(({ className, variant, ...props }, ref) => {
  const context = React.useContext(TabsContext);
  const tabsVariant = variant || context?.variant;
  
  return (
    <div
      ref={ref}
      className={cn(tabsListVariants({ variant: tabsVariant, className }))}
      role="tablist"
      {...props}
    />
  );
});
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof tabsTriggerVariants> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, variant, value, onClick, onKeyDown, id, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) {
      throw new Error('TabsTrigger must be used within a Tabs component');
    }
    
    const { value: selectedValue, onValueChange, baseId } = context;
    const tabsVariant = variant || context.variant;
    const isSelected = selectedValue === value;
    
    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        id={id ?? tabDomId(baseId, 'tab', value)}
        className={cn(tabsTriggerVariants({ variant: tabsVariant, className }))}
        style={
          isSelected && tabsVariant === 'card'
            ? { backgroundColor: 'var(--sabc-red-primary)', color: 'white', borderColor: 'var(--sabc-red-primary)' }
            : undefined
        }
        aria-selected={isSelected}
        aria-controls={tabDomId(baseId, 'panel', value)}
        tabIndex={isSelected ? 0 : -1}
        data-state={isSelected ? 'active' : 'inactive'}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) onValueChange(value);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;

          const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
          if (!keys.includes(event.key)) return;
          const tabList = event.currentTarget.closest('[role="tablist"]');
          const tabs = Array.from(
            tabList?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)') ?? [],
          );
          if (tabs.length === 0) return;

          event.preventDefault();
          const currentIndex = tabs.indexOf(event.currentTarget);
          const nextIndex = event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? tabs.length - 1
              : event.key === 'ArrowRight'
                ? (currentIndex + 1) % tabs.length
                : (currentIndex - 1 + tabs.length) % tabs.length;
          tabs[nextIndex]?.focus();
          tabs[nextIndex]?.click();
        }}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tabsContentVariants> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, variant, value, id, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) {
      throw new Error('TabsContent must be used within a Tabs component');
    }
    
    const { value: selectedValue, baseId } = context;
    const tabsVariant = variant || context.variant;
    const isSelected = selectedValue === value;
    
    if (!isSelected) return null;
    
    return (
      <div
        ref={ref}
        role="tabpanel"
        id={id ?? tabDomId(baseId, 'panel', value)}
        aria-labelledby={tabDomId(baseId, 'tab', value)}
        tabIndex={0}
        className={cn(tabsContentVariants({ variant: tabsVariant, className }))}
        data-state={isSelected ? 'active' : 'inactive'}
        {...props}
      />
    );
  }
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
