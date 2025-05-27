import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Types pour les notifications
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

// Création du contexte avec une valeur par défaut undefined
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Props pour le provider
interface NotificationProviderProps {
  children: ReactNode;
}

/**
 * Provider pour les notifications de l'application SABC
 * Gère les notifications système, les alertes et les messages
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  // État pour les notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Calculer le nombre de notifications non lues
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Charger les notifications au montage
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  // Configurer les notifications en temps réel avec Laravel Echo
  useEffect(() => {
    // Vérifier si Echo est disponible
    if (window.Echo) {
      // S'abonner au canal privé de l'utilisateur
      const channel = window.Echo.private('App.Models.User.' + (window.userId || ''));
      
      // Écouter les nouvelles notifications
      channel.notification((notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
      });

      return () => {
        channel.stopListening('notification');
      };
    }
  }, []);

  // Ajouter une nouvelle notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (id: string) => {
    try {
      // Appel API pour marquer comme lu
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        }
      });
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      );
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
    }
  }, []);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    try {
      // Appel API pour marquer toutes comme lues
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        }
      });
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
    }
  }, []);

  // Supprimer une notification
  const removeNotification = useCallback(async (id: string) => {
    try {
      // Appel API pour supprimer
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        }
      });
      
      // Mettre à jour l'état local
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
    }
  }, []);

  // Supprimer toutes les notifications
  const clearAll = useCallback(async () => {
    try {
      // Appel API pour tout supprimer
      await fetch('/api/notifications/clear-all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        }
      });
      
      // Mettre à jour l'état local
      setNotifications([]);
    } catch (error) {
      console.error('Erreur lors de la suppression de toutes les notifications:', error);
    }
  }, []);

  // Valeur du contexte
  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Hook personnalisé pour utiliser le contexte de notification
 * @returns Contexte de notification avec notifications, unreadCount et les fonctions associées
 */
export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

// Ajouter la déclaration pour window.Echo et window.userId
declare global {
  interface Window {
    Echo: any;
    userId?: string;
  }
}

export default NotificationContext;