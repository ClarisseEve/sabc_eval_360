const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * FRONTEND_URL: origines séparées par des virgules. Un « * » couvre un seul
 * segment de nom d'hôte (lettres, chiffres, tirets, sans point), pour les URL
 * de preview Vercel par exemple: https://sabc-eval-360-*-clarisseeve.vercel.app
 */
export function parseAllowedOrigins(value: string): Array<string | RegExp> {
  return value
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean)
    .map((origin) => {
      if (!origin.includes('*')) return origin;
      const pattern = origin.split('*').map(escapeRegExp).join('[a-z0-9-]+');
      return new RegExp(`^${pattern}$`, 'i');
    });
}
