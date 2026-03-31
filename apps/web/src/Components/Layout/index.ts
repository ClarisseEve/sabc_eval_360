// Fichier d'index pour exporter les composants de mise en page de manière cohérente
// Importer les composants depuis leurs dossiers respectifs
import AppLayout from './app/AppLayout';
import { Header } from './app/Header';
import { Sidebar } from './app/Sidebar';
import AuthCardLayout from './auth/auth-card-layout';
import AuthSimpleLayout from './auth/auth-simple-layout';
import AuthSplitLayout from './auth/auth-split-layout';

// Exporter les composants principaux
export { 
  AppLayout, 
  Header, 
  Sidebar, 
  AuthCardLayout,
  AuthSimpleLayout,
  AuthSplitLayout
};

// Exporter AppLayout comme composant par défaut pour faciliter les imports
export default AppLayout;
