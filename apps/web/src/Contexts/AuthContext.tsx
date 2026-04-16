import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api, { authApi, getToken, setToken, clearToken } from '@/Services/api';

// Types pour l'authentification
export interface User {
  // Identifiants principaux
  matricule: string;
  email: string;

  // Informations personnelles
  nom: string;
  prenom: string;
  name?: string;
  telephone?: string;
  avatar?: string;

  // Informations organisationnelles
  role: string;
  role_nom: string;
  id_region?: string;
  region_nom?: string;
  type_region?: string;
  id_branche?: string;
  branche_nom?: string;

  // Hiérarchie
  niveau_hierarchique: number;
  manager_matricule?: string;

  // Statuts
  est_actif: boolean;
  est_admin: boolean;
  est_indisponible?: boolean;

  // Compatibilité
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

/**
 * Provider pour l'authentification SABC — JWT via NestJS API.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children, initialUser = null }) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState<boolean>(!initialUser && !!getToken());

  // On mount: if we have a stored JWT, fetch user profile
  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
      setIsLoading(false);
      return;
    }

    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    authApi
      .me()
      .then((res) => setUser(res.data))
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, [initialUser]);

  // Login: POST /api/auth/login → store JWT, set user
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      const { access_token, user: userData } = res.data;
      setToken(access_token);

      // Fetch full profile
      const profile = await authApi.me();
      setUser(profile.data);
    } catch (error) {
      clearToken();
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout: clear token + redirect handled by caller
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout().catch(() => {});
    } finally {
      clearToken();
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await api.post('/auth/forgot-password', { email });
  }, []);

  const resetPassword = useCallback(async (email: string, password: string, token: string) => {
    await api.post('/auth/reset-password', { email, password, password_confirmation: password, token });
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    const res = await api.put('/auth/profile', data);
    if (user) {
      setUser({ ...user, ...data, ...res.data });
    }
  }, [user]);

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
