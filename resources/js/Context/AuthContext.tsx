import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { router } from '@inertiajs/react';

// Types pour l'authentification
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  region: string;
  department: string;
  avatar: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, password: string, token: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

// Création du contexte avec une valeur par défaut undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props pour le provider
interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

/**
 * Provider pour l'authentification de l'application SABC
 * Gère l'authentification, l'autorisation et les opérations liées au profil utilisateur
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children, initialUser = null }) => {
  // États pour l'authentification
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Si l'utilisateur n'est pas défini, vérifier l'état d'authentification
        if (!user) {
          setIsLoading(true);
          // Utiliser Inertia pour récupérer l'utilisateur actuel
          const response = await fetch('/api/user');
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [user]);

  // Fonction de connexion
  const login = useCallback(async (email: string, password: string, remember: boolean = false) => {
    setIsLoading(true);
    try {
      // Utiliser Inertia pour la connexion
      await router.post('/login', {
        email,
        password,
        remember
      });
      
      // Récupérer les informations de l'utilisateur après connexion
      const response = await fetch('/api/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction de déconnexion
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Utiliser Inertia pour la déconnexion
      await router.post('/logout');
      setUser(null);
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour mot de passe oublié
  const forgotPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      // Utiliser Inertia pour la réinitialisation de mot de passe
      await router.post('/forgot-password', { email });
    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour réinitialiser le mot de passe
  const resetPassword = useCallback(async (email: string, password: string, token: string) => {
    setIsLoading(true);
    try {
      // Utiliser Inertia pour la réinitialisation de mot de passe
      await router.post('/reset-password', {
        email,
        password,
        password_confirmation: password,
        token
      });
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour mettre à jour le profil
  const updateProfile = useCallback(async (data: Partial<User>) => {
    setIsLoading(true);
    try {
      // Utiliser Inertia pour la mise à jour du profil
      await router.put('/user/profile-information', data);
      
      // Mettre à jour l'utilisateur local
      if (user) {
        setUser({ ...user, ...data });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Valeur du contexte
  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook personnalisé pour utiliser le contexte d'authentification
 * @returns Contexte d'authentification avec user, isAuthenticated, et les fonctions associées
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;