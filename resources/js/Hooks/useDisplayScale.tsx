import * as React from 'react';

const SCALE_STORAGE_KEY = 'app:display-scale';
const DEFAULT_SCALE = 0.9;
const SCALE_OPTIONS = [0.85, 0.9, 0.95, 1, 1.05, 1.1] as const;

export type DisplayScale = (typeof SCALE_OPTIONS)[number];

type DisplayScaleContextType = {
  scale: DisplayScale;
  setScale: (value: DisplayScale) => void;
  resetScale: () => void;
  options: readonly DisplayScale[];
};

const DisplayScaleContext = React.createContext<DisplayScaleContextType | undefined>(undefined);

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

function isDisplayScale(value: number): value is DisplayScale {
  return SCALE_OPTIONS.includes(value as DisplayScale);
}

function applyScale(value: DisplayScale) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.style.setProperty('--app-desktop-font-scale', value.toString());
}

export const DisplayScaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scale, setScaleState] = React.useState<DisplayScale>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_SCALE;
    }

    const stored = window.localStorage.getItem(SCALE_STORAGE_KEY);
    if (stored) {
      const parsed = Number.parseFloat(stored);
      if (isDisplayScale(parsed)) {
        return parsed;
      }
    }

    return DEFAULT_SCALE;
  });

  useIsomorphicLayoutEffect(() => {
    applyScale(scale);

    if (typeof window !== 'undefined') {
      if (scale === DEFAULT_SCALE) {
        window.localStorage.removeItem(SCALE_STORAGE_KEY);
      } else {
        window.localStorage.setItem(SCALE_STORAGE_KEY, scale.toString());
      }
    }
  }, [scale]);

  const setScale = React.useCallback((value: DisplayScale) => {
    setScaleState((current) => (current === value ? current : value));
  }, []);

  const resetScale = React.useCallback(() => {
    setScaleState(DEFAULT_SCALE);
  }, []);

  return (
    <DisplayScaleContext.Provider value={{ scale, setScale, resetScale, options: SCALE_OPTIONS }}>
      {children}
    </DisplayScaleContext.Provider>
  );
};

export function useDisplayScale() {
  const context = React.useContext(DisplayScaleContext);
  if (!context) {
    throw new Error('useDisplayScale must be used within a DisplayScaleProvider');
  }
  return context;
}

export const DISPLAY_SCALE_DEFAULT = DEFAULT_SCALE;
export const DISPLAY_SCALE_OPTIONS = SCALE_OPTIONS;
