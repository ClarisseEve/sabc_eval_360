import { router } from '@inertiajs/react';

// Définition du type RouteParam compatible avec celui de @inertiajs/core
type RouteParam = string | number | boolean | null;

// Type pour les routes de l'application
export type AppRoutes = {
  'home': undefined;
  'login': undefined;
  'register': undefined;
  'password.request': undefined;
  'password.reset': { token: string };
  'password.email': undefined;
  'password.store': undefined;
  'verification.notice': undefined;
  'verification.verify': { id: string; hash: string };
  'verification.send': undefined;
  'password.confirm': undefined;
  'logout': undefined;
  'dashboard': undefined;
  'dashboard.dr': undefined;
  'dashboard.cdtt': undefined;
  'dashboard.csc': undefined;
  'dashboard.cdv': undefined;
  'dashboard.cds': undefined;
  'evaluation.create': undefined;
  'evaluation.edit': { id: string };
  'evaluation.show': { id: string };
  'evaluation.index': undefined;
  'settings.profile': undefined;
  'settings.profile.update': undefined;
  'settings.password': undefined;
  'settings.password.update': undefined;
  'settings.notifications': undefined;
  'admin.remplacements.index': undefined;
  'admin.remplacements.create': undefined;
  'admin.remplacements.store': undefined;
  'admin.remplacements.show': { id: string };
  'admin.remplacements.edit': { id: string };
  'admin.remplacements.update': { id: string };
  'admin.remplacements.destroy': { id: string };
  // User routes
  'admin.users.index': undefined;
  'admin.users.create': undefined;
  'admin.users.store': undefined;
  'admin.users.show': { id: string };
  'admin.users.edit': { id: string };
  'admin.users.update': { id: string };
  'admin.users.destroy': { id: string };
  // Evaluations admin routes
  'admin.evaluations.index': { user?: string };
  'admin.evaluations.show': { id: string };
  // Role routes
  'admin.roles.index': undefined;
  'admin.roles.create': undefined;
  'admin.roles.store': undefined;
  'admin.roles.show': { id: string };
  'admin.roles.edit': { id: string };
  'admin.roles.update': { id: string };
  'admin.roles.destroy': { id: string };
  // Region routes
  'admin.regions.index': undefined;
  'admin.regions.create': undefined;
  'admin.regions.store': undefined;
  'admin.regions.show': { id: string };
  'admin.regions.edit': { id: string };
  'admin.regions.update': { id: string };
  'admin.regions.destroy': { id: string };
};

// Fonction pour générer les routes typées
function route<T extends keyof AppRoutes>(
  name: T,
  params?: AppRoutes[T] & Record<string, RouteParam>,
  absolute?: boolean
): string {
  // Utiliser la fonction route de Ziggy (window.route)
  // Cette fonction est injectée par Laravel via le package ziggy
  if (typeof window !== 'undefined' && window.route) {
    return window.route(name as string, params, absolute);
  }
  
  // Fallback pour SSR ou tests
  console.warn('Route function called without window.route being available');
  return `/${name.toString().replace(/\./g, '/')}`;
}

export { route };
