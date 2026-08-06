/**
 * Le limiteur global reste unique. Les routes sensibles resserrent ce plafond
 * avec @Throttle({ default: ... }) afin qu'une définition spécialisée ne soit
 * pas appliquée par erreur à toutes les routes.
 */
export const APP_THROTTLER_OPTIONS = [
  {
    name: 'default',
    ttl: 60_000,
    limit: 300,
  },
];
