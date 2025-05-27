import { useCallback, useState } from 'react';
import { useNotificationContext, Notification } from '@/Context/NotificationContext';

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
  
  // Marquer une notification comme lue
  const markAsRead = useCallback((id: string) => {
    notificationContext.markAsRead(id);
  }, [notificationContext]);
  
  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(() => {
    notificationContext.markAllAsRead();
  }, [notificationContext]);
  
  // Supprimer une notification
  const removeNotification = useCallback((id: string) => {
    notificationContext.removeNotification(id);
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
