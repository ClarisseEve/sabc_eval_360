import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { createClient as createRedisClient } from 'redis';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(apiRoot, '..', '..');

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const raw = readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function ok(name, detail) {
  console.log(`PASS  ${name}${detail ? ` - ${detail}` : ''}`);
}

function warn(name, detail) {
  console.warn(`WARN  ${name}${detail ? ` - ${detail}` : ''}`);
}

function fail(name, detail) {
  console.error(`FAIL  ${name}${detail ? ` - ${detail}` : ''}`);
}

function latestPrismaMigration() {
  const dir = path.join(apiRoot, 'prisma', 'migrations');
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .at(-1);
}

function latestPgMigration() {
  const dir = path.join(apiRoot, 'sql', 'postgres', 'migrations');
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort()
    .at(-1);
}

async function checkHttpHealth(baseUrl) {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/health`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function main() {
  loadEnvFile(path.join(repoRoot, '.env'));
  loadEnvFile(path.join(apiRoot, '.env'));

  const failures = [];
  const warnings = [];
  const requiredEnv = ['DATABASE_URL', 'PG_HOST', 'PG_PORT', 'PG_DATABASE', 'PG_USER', 'PG_PASSWORD', 'JWT_SECRET'];
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length === 0) {
    ok('environment', 'required variables present');
  } else {
    failures.push(`Missing env vars: ${missing.join(', ')}`);
    fail('environment', `missing ${missing.join(', ')}`);
  }

  const prisma = new PrismaClient();
  const pgPool = new Pool({
    host: process.env.PG_HOST,
    port: Number(process.env.PG_PORT || 5432),
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    max: 2,
  });

  let redisClient = null;

  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    ok('mysql', 'Prisma connection ok');

    const tables = await prisma.$queryRawUnsafe('SHOW TABLES');
    const tableNames = tables.map((row) => String(Object.values(row)[0] ?? ''));
    if (tableNames.includes('_prisma_migrations')) {
      ok('mysql migrations table', '_prisma_migrations present');
    } else {
      failures.push('_prisma_migrations missing');
      fail('mysql migrations table', '_prisma_migrations missing');
    }

    const latestMySqlMigration = latestPrismaMigration();
    if (latestMySqlMigration) {
      const rows = await prisma.$queryRawUnsafe(
        'SELECT migration_name, finished_at FROM _prisma_migrations WHERE migration_name = ? LIMIT 1',
        latestMySqlMigration,
      );
      const row = rows?.[0];
      if (row?.migration_name && row?.finished_at) {
        ok('mysql latest migration', latestMySqlMigration);
      } else {
        failures.push(`Latest MySQL migration not applied: ${latestMySqlMigration}`);
        fail('mysql latest migration', latestMySqlMigration);
      }
    }

    const pgClient = await pgPool.connect();
    try {
      await pgClient.query('SELECT 1');
      ok('postgres', 'connection ok');

      const latestBusinessMigration = latestPgMigration();
      const migrationTable = await pgClient.query("SELECT to_regclass('public.schema_migrations_pg') as regclass");
      if (migrationTable.rows[0]?.regclass) {
        ok('postgres migrations table', 'schema_migrations_pg present');
      } else {
        failures.push('schema_migrations_pg missing');
        fail('postgres migrations table', 'schema_migrations_pg missing');
      }

      if (latestBusinessMigration) {
        const migrationRow = await pgClient.query(
          'SELECT version FROM schema_migrations_pg WHERE version = $1 LIMIT 1',
          [latestBusinessMigration],
        );
        if (migrationRow.rowCount === 1) {
          ok('postgres latest migration', latestBusinessMigration);
        } else {
          failures.push(`Latest PostgreSQL migration not applied: ${latestBusinessMigration}`);
          fail('postgres latest migration', latestBusinessMigration);
        }
      }

      const validationCols = await pgClient.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'evaluations'
          AND column_name IN ('validateur_matricule', 'date_validation', 'commentaire_validation')
      `);
      const colSet = new Set(validationCols.rows.map((row) => row.column_name));
      const missingCols = ['validateur_matricule', 'date_validation', 'commentaire_validation'].filter((col) => !colSet.has(col));
      if (missingCols.length === 0) {
        ok('evaluation validation columns', 'all present');
      } else {
        failures.push(`Missing evaluation columns: ${missingCols.join(', ')}`);
        fail('evaluation validation columns', missingCols.join(', '));
      }
    } finally {
      pgClient.release();
    }

    const cacheDriver = (process.env.CACHE_DRIVER || 'auto').toLowerCase();
    const redisUrl = process.env.REDIS_URL;
    if (cacheDriver === 'redis') {
      if (!redisUrl) {
        failures.push('CACHE_DRIVER=redis but REDIS_URL is missing');
        fail('redis', 'CACHE_DRIVER=redis but REDIS_URL is missing');
      } else {
        try {
          redisClient = createRedisClient({ url: redisUrl });
          await redisClient.connect();
          const pong = await redisClient.ping();
          if (pong === 'PONG') {
            ok('redis', redisUrl);
          } else {
            failures.push(`Redis ping returned ${pong}`);
            fail('redis', `unexpected ping response: ${pong}`);
          }
        } catch (error) {
          failures.push(`Redis unavailable: ${error.message}`);
          fail('redis', error.message);
        }
      }
    } else if (cacheDriver === 'auto') {
      warn('redis', 'CACHE_DRIVER=auto, deployment may fall back to memory if Redis is unavailable');
      warnings.push('CACHE_DRIVER=auto');
    } else {
      warn('redis', 'CACHE_DRIVER=memory, no shared cache between replicas');
      warnings.push('CACHE_DRIVER=memory');
    }

    const healthBaseUrl = process.env.PREFLIGHT_BASE_URL || 'http://localhost:3000';
    try {
      const health = await checkHttpHealth(healthBaseUrl);
      if (health.status === 'healthy') {
        ok('api health', `${healthBaseUrl}/api/health (${health.cache_driver ?? 'unknown-cache'})`);
      } else {
        warnings.push(`API health returned ${health.status}`);
        warn('api health', `${healthBaseUrl}/api/health returned ${health.status}`);
      }
    } catch (error) {
      warnings.push(`API health check skipped: ${error.message}`);
      warn('api health', `unreachable (${error.message})`);
    }
  } finally {
    if (redisClient?.isOpen) await redisClient.quit();
    await prisma.$disconnect();
    await pgPool.end();
  }

  if (warnings.length > 0) {
    console.log(`WARNINGS: ${warnings.length}`);
  }

  if (failures.length > 0) {
    console.error(`PREFLIGHT FAILED (${failures.length})`);
    process.exit(1);
  }

  console.log('PREFLIGHT OK');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
