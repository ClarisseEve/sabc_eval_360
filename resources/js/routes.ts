// Définition du type RouteParam compatible avec celui de @inertiajs/core
type RouteParam = string | number | boolean | null;

// Type pour les routes de l'application
export type AppRoutes = {
  'home': undefined;
  'login': undefined;
  'register': undefined;
  'logout': undefined;
  'logout.get': undefined;
  'password.request': undefined;
  'password.reset': { token: string };
  'password.store': undefined;
  'password.confirm': undefined;
  'password.edit': undefined;
  'password.update': undefined;
  'profile.edit': undefined;
  'profile.update': undefined;
  'profile.destroy': undefined;
  'appearance': undefined;
  'dashboard': undefined;
  'dashboard.admin': undefined;
  'dashboard.dr': undefined;
  'dashboard.cdtt': undefined;
  'dashboard.csc': undefined;
  'dashboard.cdv': undefined;
  'dashboard.cds': undefined;
  'dashboard.rtm': undefined;
  'dashboard.tmo': undefined;
  'dashboard.srmo': undefined;
  'dashboard.ss': undefined;
  'dashboard.as': undefined;
  'common.settings': undefined;
  'common.profile': undefined;
  'evaluations.templates.applicables': undefined;
  'evaluations.index': undefined;
  'evaluations.mine': undefined;
  'evaluations.pending': undefined;
  'evaluations.create': undefined;
  'evaluations.details': undefined;
  'evaluations.show': { id: string };
  'evaluations.edit': { id: string };
  'evaluations.update': { id: string };
  'evaluations.store': undefined;
  'admin.analytics': { section?: string };
  'admin.remplacements.index': undefined;
  'admin.remplacements.create': undefined;
  'admin.remplacements.store': undefined;
  'admin.remplacements.show': { id: string };
  'admin.remplacements.edit': { id: string };
  'admin.remplacements.update': { id: string };
  'admin.remplacements.destroy': { id: string };
  'admin.roles.index': undefined;
  'admin.roles.permissions': undefined;
  'admin.roles.permissions.update': undefined;
  'admin.roles.create': undefined;
  'admin.roles.store': undefined;
  'admin.roles.show': { id: string };
  'admin.roles.edit': { id: string };
  'admin.roles.update': { id: string };
  'admin.roles.destroy': { id: string };
  'admin.roles.rules.create': undefined;
  'admin.roles.rules.store': undefined;
  'admin.roles.rules.update': undefined;
  'admin.structure.overview': undefined;
  'admin.structure.regions': undefined;
  'admin.structure.regions.store': undefined;
  'admin.structure.regions.update': { id: string };
  'admin.structure.regions.destroy': { id: string };
  'admin.structure.services': undefined;
  'admin.structure.services.store': undefined;
  'admin.structure.services.update': { id: string };
  'admin.structure.services.destroy': { id: string };
  'admin.structure.districts': undefined;
  'admin.structure.districts.store': undefined;
  'admin.structure.districts.update': { id: string };
  'admin.structure.districts.destroy': { id: string };
  'admin.structure.secteurs': undefined;
  'admin.structure.secteurs.store': undefined;
  'admin.structure.secteurs.update': { id: string };
  'admin.structure.secteurs.destroy': { id: string };
  'admin.evaluations.history': undefined;
  'admin.evaluations.management': undefined;
  'admin.evaluations.templates.index': undefined;
  'admin.evaluations.templates.create': undefined;
  'admin.evaluations.templates.edit': { id: string };
  'admin.evaluations.periodes.index': undefined;
  'admin.evaluations.periodes.create': undefined;
  'admin.evaluations.periodes.store': undefined;
  'admin.evaluations.periodes.show': { id: string };
  'admin.evaluations.periodes.edit': { id: string };
  'admin.evaluations.periodes.update': { id: string };
  'admin.evaluations.periodes.toggle': { id: string };
  'admin.evaluations.periodes.destroy': { id: string };
  'admin.utilisateurs.index': undefined;
  'admin.utilisateurs.gaps': undefined;
  'admin.utilisateurs.create': undefined;
  'admin.utilisateurs.store': undefined;
  'admin.utilisateurs.show': { matricule: string };
  'admin.utilisateurs.edit': { matricule: string };
  'admin.utilisateurs.update': { matricule: string };
  'admin.evaluation.index': undefined;
  'admin.evaluation.templates': undefined;
  'admin.evaluation.templates.create': undefined;
  'admin.evaluation.templates.store': undefined;
  'admin.evaluation.templates.edit': { id: string };
  'admin.evaluation.templates.update': { id: string };
  'admin.evaluation.templates.duplicate': { id: string };
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
