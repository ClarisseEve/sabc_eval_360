import * as React from 'react';
import { Bell, X, CheckCircle, AlertCircle, Clock, Info } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/utils/helpers';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { StatusBadge } from '@/Components/UI/Status/StatusBadge';

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

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onAction,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Nombre de notifications non lues
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  // Formater la date
  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd MMM yyyy, HH:mm', { locale: fr });
  };
  
  // Icône selon le type de notification
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-sabc-success" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-sabc-warning" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-sabc-error" />;
      case 'info': return <Info className="h-5 w-5 text-sabc-info" />;
    }
  };
  
  // Couleur de bordure selon le type de notification
  const getNotificationBorderColor = (type: NotificationType) => {
    switch (type) {
      case 'success': return 'border-l-sabc-success';
      case 'warning': return 'border-l-sabc-warning';
      case 'error': return 'border-l-sabc-error';
      case 'info': return 'border-l-sabc-info';
    }
  };
  
  // Gérer le clic sur une notification
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    
    if (notification.actionUrl && onAction) {
      onAction(notification.id, notification.actionUrl);
    }
  };
  
  return (
    <div className={cn("relative", className)}>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-sabc-red-primary text-xs text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
      
      {isOpen && (
        <Card className="absolute right-0 top-full z-50 mt-2 w-80 shadow-lg md:w-96">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Notifications</CardTitle>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onMarkAllAsRead}
                className="text-xs text-sabc-gray-500 hover:text-sabc-gray-700 dark:text-sabc-gray-400 dark:hover:text-sabc-gray-300"
              >
                Tout marquer comme lu
              </Button>
            )}
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto p-0">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="mb-2 h-8 w-8 text-sabc-gray-400" />
                <p className="text-sm text-sabc-gray-500 dark:text-sabc-gray-400">
                  Aucune notification
                </p>
              </div>
            ) : (
              <div className="divide-y divide-sabc-gray-200 dark:divide-sabc-gray-800">
                {notifications.map(notification => (
                  <div 
                    key={notification.id}
                    className={cn(
                      "relative border-l-4 px-4 py-3 transition-colors",
                      getNotificationBorderColor(notification.type),
                      !notification.read && "bg-sabc-gray-50 dark:bg-sabc-gray-800/50",
                      notification.actionUrl && "cursor-pointer hover:bg-sabc-gray-100 dark:hover:bg-sabc-gray-800"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div>
                          <p className="font-medium text-sabc-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          <p className="text-sm text-sabc-gray-600 dark:text-sabc-gray-400">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-sabc-gray-500 dark:text-sabc-gray-500">
                            {formatNotificationDate(notification.timestamp)}
                          </p>
                          
                          {notification.actionUrl && notification.actionLabel && (
                            <Button 
                              variant="link" 
                              size="sm"
                              className="mt-1 h-auto p-0 text-xs text-sabc-red-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onAction) onAction(notification.id, notification.actionUrl!);
                              }}
                            >
                              {notification.actionLabel}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDismiss(notification.id);
                        }}
                        className="rounded-full p-1 text-sabc-gray-400 hover:bg-sabc-gray-200 hover:text-sabc-gray-700 dark:text-sabc-gray-500 dark:hover:bg-sabc-gray-700 dark:hover:text-sabc-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {!notification.read && (
                      <div className="absolute right-2 top-2">
                        <StatusBadge variant="info" withDot size="sm">
                          Nouveau
                        </StatusBadge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Composant pour afficher une notification toast
export interface NotificationToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  onAction?: (id: string, url: string) => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  onAction,
  autoClose = true,
  autoCloseDelay = 5000,
}) => {
  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onDismiss(notification.id);
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, notification.id, onDismiss]);
  
  // Icône selon le type de notification
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-sabc-success" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-sabc-warning" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-sabc-error" />;
      case 'info': return <Info className="h-5 w-5 text-sabc-info" />;
    }
  };
  
  // Couleur de bordure selon le type de notification
  const getNotificationBorderColor = (type: NotificationType) => {
    switch (type) {
      case 'success': return 'border-l-sabc-success';
      case 'warning': return 'border-l-sabc-warning';
      case 'error': return 'border-l-sabc-error';
      case 'info': return 'border-l-sabc-info';
    }
  };
  
  return (
    <div 
      className={cn(
        "relative mb-3 flex w-full max-w-md animate-slide-in-right items-start rounded-md border border-sabc-gray-200 bg-white p-4 shadow-md dark:border-sabc-gray-800 dark:bg-sabc-gray-900",
        "border-l-4",
        getNotificationBorderColor(notification.type)
      )}
    >
      <div className="mr-3 flex-shrink-0">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-sabc-gray-900 dark:text-white">
          {notification.title}
        </h4>
        <p className="text-sm text-sabc-gray-600 dark:text-sabc-gray-400">
          {notification.message}
        </p>
        
        {notification.actionUrl && notification.actionLabel && (
          <Button 
            variant="link" 
            size="sm"
            className="mt-1 h-auto p-0 text-xs text-sabc-red-primary"
            onClick={() => {
              if (onAction) onAction(notification.id, notification.actionUrl!);
            }}
          >
            {notification.actionLabel}
          </Button>
        )}
      </div>
      <button
        onClick={() => onDismiss(notification.id)}
        className="absolute right-2 top-2 rounded-full p-1 text-sabc-gray-400 hover:bg-sabc-gray-200 hover:text-sabc-gray-700 dark:text-sabc-gray-500 dark:hover:bg-sabc-gray-700 dark:hover:text-sabc-gray-300"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Contexte pour gérer les notifications globalement
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
  
  // Ajouter une notification
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Limiter le nombre de notifications
      return updated.slice(0, maxNotifications);
    });
    
    // Ajouter aux toasts pour affichage temporaire
    setToasts(prev => [newNotification, ...prev]);
  };
  
  // Supprimer une notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    setToasts(prev => prev.filter(notification => notification.id !== id));
  };
  
  // Marquer une notification comme lue
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };
  
  // Marquer toutes les notifications comme lues
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };
  
  // Supprimer toutes les notifications
  const clearAll = () => {
    setNotifications([]);
    setToasts([]);
  };
  
  return (
    <NotificationContext.Provider 
      value={{
        notifications,
        addNotification,
        removeNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
      
      {/* Affichage des toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
        {toasts.slice(0, 3).map(toast => (
          <NotificationToast 
            key={toast.id}
            notification={toast}
            onDismiss={removeNotification}
            onAction={(id, url) => {
              markAsRead(id);
              window.location.href = url;
            }}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationCenter;
