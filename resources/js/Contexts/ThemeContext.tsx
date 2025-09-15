import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Type pour le thème (conforme aux règles SABC)
type Theme = 'light' | 'dark';

// Interface pour le contexte de thème
export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

// Création du contexte avec une valeur par défaut undefined
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Props pour le provider
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Provider pour le thème de l'application SABC
 * Gère le thème clair/sombre avec persistance localStorage
 * et respect des préférences système
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // État pour le thème
  const [theme, setThemeState] = useState<Theme>('light');
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Initialisation du thème au montage
  useEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Utiliser le thème sauvegardé ou la préférence système
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setThemeState(initialTheme);
    
    // Appliquer la classe au document
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Écouter les changements de préférence système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      // Ne mettre à jour que si l'utilisateur n'a pas de préférence enregistrée
      if (!localStorage.getItem('theme')) {
        setThemeState(newTheme);
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Fonction pour changer le thème
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Fonction pour basculer entre les thèmes
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  // Valeur du contexte
  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark'
  };

  // Ne rendre le thème que côté client pour éviter les erreurs d'hydratation
  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook personnalisé pour utiliser le contexte de thème
 * @returns Contexte de thème avec theme, setTheme, toggleTheme et isDark
 */
export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;