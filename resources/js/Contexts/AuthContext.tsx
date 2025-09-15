import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { router } from '@inertiajs/react';

// Types pour l'authentification
export interface User {
  // Identifiants principaux
  matricule: string;  // Clé primaire, non auto-incrémentée
  email: string;
  
  // Informations personnelles
  nom: string;
  prenom: string;
  name?: string;      // Compatibilité avec l'ancien modèle
  telephone?: string;
  avatar?: string;
  
  // Informations organisationnelles
  role: string;       // ID du rôle (pour compatibilité)
  role_nom: string;   // Nom du rôle (DR, CDTT, CSC, etc.)
  id_region?: string; // ID de la région
  region_nom?: string; // Nom de la région
  type_region?: string; // Tanière ou Non-Tanière
  id_branche?: string; // ID de la branche
  branche_nom?: string; // Nom de la branche
  
  // Hiérarchie
  niveau_hierarchique: number;
  manager_matricule?: string;
  
  // Statuts
  est_actif: boolean;
  est_admin: boolean;
  est_indisponible?: boolean;
  
  // Compatibilité avec l'ancien modèle
  id?: string;
  region?: string;
  department?: string;
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

  // Vérification de l'authentification au chargement
  useEffect(() => {
    // Si nous avons un utilisateur initial (fourni par Inertia), l'utiliser
    if (initialUser) {
      console.log('Utilisateur initial détecté:', initialUser.matricule);
      setUser(initialUser);
      setIsLoading(false);
      return; // Sortir de la fonction si nous avons un utilisateur initial
    } 
    
    // Ne pas vérifier l'authentification sur la page de login
    if (window.location.pathname === '/login') {
      console.log('Sur la page de login, pas de vérification d\'authentification');
      setIsLoading(false);
      return;
    }
    
    // RÉACTIVÉ - Vérification d'authentification pour résoudre les problèmes de session
    console.log('Vérification automatique d\'authentification activée');
    
    setIsLoading(true);
    const authCheckUrl = `${window.location.origin}/api/auth/check`;
    console.log('Vérification de l\'authentification à:', authCheckUrl);
    
    fetch(authCheckUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'include'
    })
    .then(response => {
      console.log('Réponse de vérification d\'auth:', response.status);
      if (response.ok) {
        return response.json();
      } else if (response.status === 401) {
        console.warn('Non authentifié (401), redirection vers login');
        router.visit('/login', { replace: true });
        return null;
      }
      throw new Error('Erreur lors de la vérification d\'authentification');
    })
    .then(data => {
      if (data && data.authenticated) {
        console.log('Authentification confirmée, utilisateur:', data.matricule);
        setUser(data);
      } else if (data === null) {
        console.log('Aucune donnée d\'authentification reçue');
        setUser(null);
      }
      setIsLoading(false);
    })
    .catch(error => {
      console.error('Erreur d\'authentification:', error);
      setUser(null);
      setIsLoading(false);
    });
  }, [initialUser]);

  // Fonction de connexion
  const login = useCallback(async (email: string, password: string, remember: boolean = false): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Récupérer le token CSRF depuis les cookies
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];
      
      // Utiliser Inertia pour la connexion avec le token CSRF
      await router.post('/login', {
        identifier: email, // Peut être un email ou un matricule
        password,
        remember,
        _token: csrfToken
      });
      
      // DÉSACTIVÉ - Pas besoin de vérifier l'auth après login
      // Inertia gère déjà l'état d'authentification
      console.log('Vérification post-login désactivée - Inertia gère l\'auth');
    } catch (error) {
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