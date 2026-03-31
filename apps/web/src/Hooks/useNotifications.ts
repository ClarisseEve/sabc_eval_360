import { useCallback, useState, useEffect } from 'react';
import { useNotificationContext, Notification } from '@/Contexts/NotificationContext';
import { notificationService } from '../Services/{api}';

// Type pour les métadonnées des notifications
export interface NotificationMetadata {
  evaluationId?: string;
  userId?: string;
  analyticsId?: string;
  relatedType?: 'evaluation' | 'user' | 'analytics' | 'system';
}

/**
 * Hook personnalisé pour gérer les notifications
 * Conforme aux règles SABC pour les hooks et les notifications
 */
export const useNotifications = () => {
  const notificationContext = useNotificationContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Charger les notifications depuis l'API
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await notificationService.getAll();
      // Synchroniser avec le contexte local
      data.forEach((notification: Notification) => {
        if (!notificationExists(notification.message, notification.type)) {
          notificationContext.addNotification(notification);
        }
      });
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [notificationContext]);
  
  // Charger les notifications au montage du composant
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);
  
  // Marquer une notification comme lue
  const markAsRead = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await notificationService.markAsRead(id);
      notificationContext.markAsRead(id);
    } catch (err: any) {
      setError(err.message || 'Impossible de marquer la notification comme lue');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [notificationContext]);
  
  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await notificationService.markAllAsRead();
      notificationContext.markAllAsRead();
    } catch (err: any) {
      setError(err.message || 'Impossible de marquer toutes les notifications comme lues');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [notificationContext]);
  
  // Supprimer une notification
  const removeNotification = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await notificationService.delete(id);
      notificationContext.removeNotification(id);
    } catch (err: any) {
      setError(err.message || 'Impossible de supprimer la notification');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [notificationContext]);
  
  // Supprimer toutes les notifications
  const clearAllNotifications = useCallback(() => {
    notificationContext.clearAll();
  }, [notificationContext]);
  
  // Ajouter une notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    notificationContext.addNotification(notification);
  }, [notificationContext]);
  
  // Filtrer les notifications par type
  const filterByType = useCallback((type: Notification['type']) => {
    return notificationContext.notifications.filter(notification => notification.type === type);
  }, [notificationContext.notifications]);
  
  // Obtenir les notifications non lues
  const getUnreadNotifications = useCallback(() => {
    return notificationContext.notifications.filter(notification => !notification.read);
  }, [notificationContext.notifications]);
  
  // Obtenir les notifications liées à un certain type via le lien
  const getRelatedNotifications = useCallback((relatedType: string, relatedId?: string) => {
    return notificationContext.notifications.filter(notification => 
      notification.link?.includes(relatedType) && 
      (relatedId ? notification.link?.includes(relatedId) : true)
    );
  }, [notificationContext.notifications]);
  
  // Vérifier si une notification existe déjà (pour éviter les doublons)
  const notificationExists = useCallback((message: string, type: Notification['type']) => {
    return notificationContext.notifications.some(
      notification => notification.message === message && notification.type === type
    );
  }, [notificationContext.notifications]);
  
  // Créer une notification d'évaluation
  const createEvaluationNotification = useCallback((
    title: string, 
    message: string, 
    type: Notification['type'] = 'info',
    evaluationId: string
  ) => {
    if (notificationExists(message, type)) return;
    
    addNotification({
      type,
      title,
      message,
      link: `/evaluations/${evaluationId}`,
      read: false
    });
  }, [addNotification, notificationExists]);
  
  // Créer une notification d'alerte (workflow)
  const createAlertNotification = useCallback((
    title: string, 
    message: string, 
    type: Notification['type'] = 'warning'
  ) => {
    if (notificationExists(message, type)) return;
    
    addNotification({
      type,
      title,
      message,
      read: false
    });
  }, [addNotification, notificationExists]);
  
  return {
    notifications: notificationContext.notifications,
    unreadCount: notificationContext.unreadCount,
    loading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    addNotification,
    filterByType,
    getUnreadNotifications,
    getRelatedNotifications,
    notificationExists,
    createEvaluationNotification,
    createAlertNotification
  };
};

export default useNotifications;
