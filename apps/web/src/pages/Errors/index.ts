/**
 * Index des pages d'erreur personnalisées SABC
 * Export centralisé pour faciliter les imports
 */

export { default as Error404 } from './404';
export { default as Error403 } from './403';
export { default as Error500 } from './500';
export { default as ErrorPage } from './Error';

// Types pour les erreurs
export interface ErrorPageProps {
  status?: number;
  title?: string;
  message?: string;
}

// Fonction utilitaire pour rendre la bonne page d'erreur selon le code
export const renderErrorPage = (status: number, title?: string, message?: string) => {
  switch (status) {
    case 404:
      return import('./404');
    case 403:
      return import('./403');
    case 500:
      return import('./500');
    default:
      return import('./Error').then(module => ({
        default: (props: any) => module.default({ status, title, message, ...props })
      }));
  }
};
