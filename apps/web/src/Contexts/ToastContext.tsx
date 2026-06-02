import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  title?: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastOptions {
  title?: string;
  /** Durée en ms avant disparition automatique (0 = persistant jusqu'à fermeture manuelle). */
  duration?: number;
}

interface ToastApi {
  toasts: Toast[];
  show: (variant: ToastVariant, message: string, options?: ToastOptions) => string;
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastApi | undefined>(undefined);

const DEFAULT_DURATION = 5000;

let counter = 0;
const genId = () => `toast-${Date.now()}-${counter++}`;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (variant: ToastVariant, message: string, options?: ToastOptions) => {
      const id = genId();
      const duration = options?.duration ?? DEFAULT_DURATION;
      setToasts((prev) => [...prev, { id, message, title: options?.title, variant, duration }]);
      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }
      return id;
    },
    [dismiss],
  );

  const success = useCallback((m: string, o?: ToastOptions) => show('success', m, o), [show]);
  const error = useCallback((m: string, o?: ToastOptions) => show('error', m, o), [show]);
  const warning = useCallback((m: string, o?: ToastOptions) => show('warning', m, o), [show]);
  const info = useCallback((m: string, o?: ToastOptions) => show('info', m, o), [show]);

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((timer) => clearTimeout(timer));
      map.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, show, success, error, warning, info, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastApi => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast doit être utilisé à l’intérieur d’un <ToastProvider>');
  }
  return ctx;
};

export default ToastContext;
