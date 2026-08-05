type Environment = Record<string, unknown>;

function requireValue(config: Environment, key: string): string {
  const value = String(config[key] ?? '').trim();
  if (!value) throw new Error(`Variable d'environnement requise: ${key}`);
  return value;
}

export function validateEnvironment(config: Environment): Environment {
  const port = Number(config.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT doit être un entier compris entre 1 et 65535');
  }
  config.PORT = port;

  if (String(config.NODE_ENV ?? 'development') !== 'production') {
    return config;
  }

  const jwtSecret = requireValue(config, 'JWT_SECRET');
  if (jwtSecret.length < 32 || jwtSecret.toUpperCase().includes('CHANGE_ME')) {
    throw new Error('JWT_SECRET doit contenir au moins 32 caractères et ne pas être une valeur exemple');
  }

  const databaseUrl = requireValue(config, 'DATABASE_URL');
  requireValue(config, 'PG_HOST');
  requireValue(config, 'PG_DATABASE');
  requireValue(config, 'PG_USER');
  const pgPassword = requireValue(config, 'PG_PASSWORD');
  requireValue(config, 'FRONTEND_URL');

  // Les placeholders des .env.example commencent tous par CHANGE_ME: les
  // rejeter évite qu'un déploiement parte avec une valeur d'exemple.
  const knownExamplePasswords = new Set([
    'secret',
    '***REMOVED***',
    'password',
    '***REMOVED***',
    'change_me',
  ]);
  const isExamplePassword = (value: string) => {
    const normalized = value.toLowerCase();
    return knownExamplePasswords.has(normalized) || normalized.startsWith('change_me');
  };
  let mysqlPassword = '';
  try {
    const parsedDatabaseUrl = new URL(databaseUrl);
    if (parsedDatabaseUrl.protocol !== 'mysql:') throw new Error('invalid protocol');
    mysqlPassword = decodeURIComponent(parsedDatabaseUrl.password).toLowerCase();
  } catch {
    throw new Error('DATABASE_URL doit être une URL MySQL valide');
  }
  if (isExamplePassword(mysqlPassword)) {
    throw new Error("DATABASE_URL utilise un mot de passe d'exemple interdit en production");
  }
  if (isExamplePassword(pgPassword)) {
    throw new Error("PG_PASSWORD utilise un mot de passe d'exemple interdit en production");
  }

  if (String(config.CACHE_DRIVER ?? 'redis') === 'redis') {
    requireValue(config, 'REDIS_URL');
  }

  return config;
}
