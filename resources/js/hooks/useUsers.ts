import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { userService } from '../Services/{api}';
import { User, UserFormData, PaginatedResponse } from '../types';

/**
 * Hook personnalisé pour la gestion des utilisateurs
 * Conforme aux règles SABC pour les hooks et les utilisateurs
 * Utilise le nouveau service utilisateur
 */
export const useUsers = () => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [paginationData, setPaginationData] = useState<{
    currentPage: number;
    lastPage: number;
    total: number;
  }>({
    currentPage: 1,
    lastPage: 1,
    total: 0
  });

  /**
   * Récupère tous les utilisateurs avec pagination
   */
  const getUsers = useCallback(async (filters?: { 
    page?: number, 
    id_region?: number, 
    id_role?: number,
    actif?: boolean,
    search?: string
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await userService.getAll(filters);
      
      if ('data' in response) {
        setUsers(response.data);
        setPaginationData({
          currentPage: response.current_page,
          lastPage: response.last_page,
          total: response.total
        });
      } else {
        setUsers(response);
      }
      
      return response;
    } catch (err: any) {
      setError(err.message || 'Impossible de récupérer les utilisateurs');
      console.error(err);
      return { data: [], current_page: 1, last_page: 1, total: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Récupère un utilisateur spécifique
   */
  const getUserById = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await userService.getById(id);
      setCurrentUser(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de récupérer l\'utilisateur');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crée un nouvel utilisateur
   */
  const createUser = useCallback(async (userData: UserFormData) => {
    if (!hasPermission('create_users')) {
      setError('Vous n\'avez pas les permissions nécessaires pour créer des utilisateurs');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await userService.create(userData);
      setUsers(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de créer l\'utilisateur');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [hasPermission]);

  /**
   * Met à jour un utilisateur existant
   */
  const updateUser = useCallback(async (id: number, userData: Partial<UserFormData>) => {
    if (!hasPermission('update_users')) {
      setError('Vous n\'avez pas les permissions nécessaires pour modifier des utilisateurs');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await userService.update(id, userData);
      setUsers(prev => prev.map(user => user.id === id ? data : user));
      if (currentUser?.id === id) {
        setCurrentUser(data);
      }
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de mettre à jour l\'utilisateur');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [hasPermission, currentUser]);

  /**
   * Change le rôle d'un utilisateur
   */
  const changeUserRole = useCallback(async (id: number, idRole: number) => {
    if (!hasPermission('update_users')) {
      setError('Vous n\'avez pas les permissions nécessaires pour modifier le rôle des utilisateurs');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await userService.changeRole(id, idRole);
      setUsers(prev => prev.map(user => user.id === id ? data : user));
      if (currentUser?.id === id) {
        setCurrentUser(data);
      }
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de changer le rôle de l\'utilisateur');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [hasPermission, currentUser]);

  /**
   * Active ou désactive un utilisateur
   */
  const toggleUserStatus = useCallback(async (id: number, actif: boolean) => {
    if (!hasPermission('update_users')) {
      setError('Vous n\'avez pas les permissions nécessaires pour modifier le statut des utilisateurs');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await userService.toggleStatus(id, actif);
      setUsers(prev => prev.map(user => user.id === id ? data : user));
      if (currentUser?.id === id) {
        setCurrentUser(data);
      }
      return data;
    } catch (err: any) {
      setError(err.message || 'Impossible de modifier le statut de l\'utilisateur');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [hasPermission, currentUser]);

  /**
   * Réinitialise le mot de passe d'un utilisateur
   */
  const resetPassword = useCallback(async (id: number) => {
    if (!hasPermission('reset_passwords')) {
      setError('Vous n\'avez pas les permissions nécessaires pour réinitialiser les mots de passe');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await userService.resetPassword(id);
      return result;
    } catch (err: any) {
      setError(err.message || 'Impossible de réinitialiser le mot de passe');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [hasPermission]);

  /**
   * Importe des utilisateurs depuis un fichier CSV
   */
  const importUsers = useCallback(async (file: File) => {
    if (!hasPermission('import_users')) {
      setError('Vous n\'avez pas les permissions nécessaires pour importer des utilisateurs');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await userService.importUsers(file);
      return result;
    } catch (err: any) {
      setError(err.message || 'Impossible d\'importer les utilisateurs');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [hasPermission]);

  return {
    loading,
    error,
    users,
    currentUser,
    paginationData,
    getUsers,
    getUserById,
    createUser,
    updateUser,
    changeUserRole,
    toggleUserStatus,
    resetPassword,
    importUsers
  };
};

export default useUsers;
