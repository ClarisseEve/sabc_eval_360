import * as React from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/utils/helpers';
import { Button } from '@/Components/UI/Button/Button';

export type NotificationType = 'success' | 'warning' | 'error' | 'info';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
  onAction?: (id: string, url: string) => void;
  className?: string;
}

const DOT_COLORS: Record<NotificationType, string> = {
  success: 'bg-sabc-success',
  warning: 'bg-sabc-warning',
  error: 'bg-sabc-error',
  info: 'bg-sabc-info',
};

function relativeTime(dateString: string) {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD}j`;
  return format(date, 'dd MMM', { locale: fr });
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onAction,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleClick = (n: Notification) => {
    if (!n.read) onMarkAsRead(n.id);
    if (n.actionUrl && onAction) onAction(n.id, n.actionUrl);
  };

  return (
    <div ref={ref} className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-sabc-red-primary text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-sabc-gray-200 bg-white shadow-xl dark:border-sabc-gray-700 dark:bg-sabc-gray-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-sabc-gray-100 px-4 py-2.5 dark:border-sabc-gray-800">
            <span className="text-sm font-semibold text-sabc-gray-900 dark:text-white">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-sabc-red-primary text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-[11px] font-medium text-sabc-gray-400 transition hover:text-sabc-red-primary"
              >
                Tout lire
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Bell className="mb-2 h-6 w-6 text-sabc-gray-300" />
                <p className="text-xs text-sabc-gray-400">Aucune notification</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={cn(
                    'group flex gap-2.5 px-4 py-2.5 transition-colors',
                    !n.read && 'bg-sabc-red-primary/[0.03] dark:bg-sabc-red-primary/[0.06]',
                    n.actionUrl && 'cursor-pointer',
                    'hover:bg-sabc-gray-50 dark:hover:bg-sabc-gray-800/60',
                  )}
                  onClick={() => handleClick(n)}
                >
                  {/* Dot */}
                  <div className="mt-1.5 flex shrink-0">
                    <span className={cn('h-2 w-2 rounded-full', DOT_COLORS[n.type])} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={cn(
                        'truncate text-xs leading-snug text-sabc-gray-800 dark:text-sabc-gray-200',
                        !n.read && 'font-semibold',
                      )}>
                        {n.title}
                      </p>
                      <span className="shrink-0 text-[10px] text-sabc-gray-400">
                        {relativeTime(n.timestamp)}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-sabc-gray-500 dark:text-sabc-gray-400">
                      {n.message}
                    </p>
                    {n.actionUrl && n.actionLabel && (
                      <button
                        className="mt-1 text-[11px] font-medium text-sabc-red-primary hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onAction) onAction(n.id, n.actionUrl!);
                        }}
                      >
                        {n.actionLabel} →
                      </button>
                    )}
                  </div>

                  {/* Dismiss */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
                    className="mt-0.5 shrink-0 rounded p-0.5 text-sabc-gray-300 opacity-0 transition group-hover:opacity-100 hover:text-sabc-gray-600 dark:text-sabc-gray-600 dark:hover:text-sabc-gray-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-sabc-gray-100 px-4 py-2 text-center dark:border-sabc-gray-800">
              <button className="text-[11px] font-medium text-sabc-gray-400 transition hover:text-sabc-red-primary">
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Toast notification component
export interface NotificationToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  onAction?: (id: string, url: string) => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const TOAST_ICONS: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-sabc-success" />,
  warning: <AlertCircle className="h-4 w-4 text-sabc-warning" />,
  error: <AlertCircle className="h-4 w-4 text-sabc-error" />,
  info: <Info className="h-4 w-4 text-sabc-info" />,
};

const TOAST_BORDERS: Record<NotificationType, string> = {
  success: 'border-l-sabc-success',
  warning: 'border-l-sabc-warning',
  error: 'border-l-sabc-error',
  info: 'border-l-sabc-info',
};

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  onAction,
  autoClose = true,
  autoCloseDelay = 5000,
}) => {
  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => onDismiss(notification.id), autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, notification.id, onDismiss]);

  return (
    <div
      className={cn(
        'relative mb-2 flex w-full max-w-xs items-start gap-2.5 rounded-lg border border-l-4 border-sabc-gray-200 bg-white px-3 py-2.5 shadow-lg dark:border-sabc-gray-800 dark:bg-sabc-gray-900',
        TOAST_BORDERS[notification.type],
      )}
    >
      <div className="mt-0.5 shrink-0">{TOAST_ICONS[notification.type]}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-sabc-gray-900 dark:text-white">{notification.title}</p>
        <p className="mt-0.5 line-clamp-2 text-[11px] text-sabc-gray-500 dark:text-sabc-gray-400">{notification.message}</p>
        {notification.actionUrl && notification.actionLabel && (
          <button
            className="mt-1 text-[11px] font-medium text-sabc-red-primary hover:underline"
            onClick={() => { if (onAction) onAction(notification.id, notification.actionUrl!); }}
          >
            {notification.actionLabel} →
          </button>
        )}
      </div>
      <button
        onClick={() => onDismiss(notification.id)}
        className="shrink-0 rounded p-0.5 text-sabc-gray-400 hover:text-sabc-gray-700 dark:text-sabc-gray-500 dark:hover:text-sabc-gray-300"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};

// Global notification context
export interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 50,
}) => {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [toasts, setToasts] = React.useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const n: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [n, ...prev].slice(0, maxNotifications));
    setToasts(prev => [n, ...prev]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setToasts(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
    setToasts([]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, markAsRead, markAllAsRead, clearAll }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
        {toasts.slice(0, 3).map(toast => (
          <NotificationToast
            key={toast.id}
            notification={toast}
            onDismiss={removeNotification}
            onAction={(id, url) => { markAsRead(id); window.location.href = url; }}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationCenter;
