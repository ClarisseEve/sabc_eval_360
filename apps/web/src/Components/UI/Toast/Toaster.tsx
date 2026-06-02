import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useToast, type Toast, type ToastVariant } from '@/Contexts/ToastContext';

const VARIANT_STYLES: Record<ToastVariant, { container: string; icon: React.ReactNode; role: 'status' | 'alert' }> = {
  success: {
    container: 'border-sabc-success/30 bg-sabc-success/10 text-sabc-gray-900',
    icon: <CheckCircle2 className="h-5 w-5 text-sabc-success" aria-hidden="true" />,
    role: 'status',
  },
  error: {
    container: 'border-sabc-error/30 bg-sabc-error/10 text-sabc-gray-900',
    icon: <XCircle className="h-5 w-5 text-sabc-error" aria-hidden="true" />,
    role: 'alert',
  },
  warning: {
    container: 'border-sabc-warning/30 bg-sabc-warning/10 text-sabc-gray-900',
    icon: <AlertTriangle className="h-5 w-5 text-sabc-warning" aria-hidden="true" />,
    role: 'status',
  },
  info: {
    container: 'border-sabc-info/30 bg-sabc-info/10 text-sabc-gray-900',
    icon: <Info className="h-5 w-5 text-sabc-info" aria-hidden="true" />,
    role: 'status',
  },
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const style = VARIANT_STYLES[toast.variant];
  return (
    <div
      role={style.role}
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-200 dark:text-sabc-gray-100 ${style.container}`}
    >
      <span className="mt-0.5 flex-shrink-0">{style.icon}</span>
      <div className="min-w-0 flex-1">
        {toast.title ? <p className="text-sm font-semibold">{toast.title}</p> : null}
        <p className="text-sm leading-snug">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Fermer la notification"
        className="flex-shrink-0 rounded-md p-1 text-sabc-gray-500 transition-colors hover:bg-sabc-gray-200/60 hover:text-sabc-gray-800"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const Toaster: React.FC = () => {
  const { toasts, dismiss } = useToast();
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="pointer-events-none fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>,
    document.body,
  );
};

export default Toaster;
