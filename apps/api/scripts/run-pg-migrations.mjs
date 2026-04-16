import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../sql/postgres/migrations');
const envPath = path.resolve(__dirname, '../.env');

async function loadEnvFile() {
  try {
    const raw = await readFile(envPath, 'utf8');
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
  } catch {
    // optional local env file
  }
}

function getConnectionConfig() {
  return {
    host: process.env.PG_HOST || 'localhost',
    port: Number(process.env.PG_PORT || 5432),
    database: process.env.PG_DATABASE || 'sabc_business',
    user: process.env.PG_USER || 'sabc',
    password: process.env.PG_PASSWORD || '***REMOVED***',
    max: 1,
  };
}

function checksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations_pg (
      version VARCHAR(255) PRIMARY KEY,
      checksum VARCHAR(64) NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(client) {
  const result = await client.query(
    'SELECT version, checksum FROM schema_migrations_pg ORDER BY version ASC',
  );
  return new Map(result.rows.map((row) => [row.version, row.checksum]));
}

async function loadMigrationFiles() {
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort();
}

async function run() {
  await loadEnvFile();
  const pool = new pg.Pool(getConnectionConfig());
  const client = await pool.connect();

  try {
    await client.query("SELECT pg_advisory_lock(hashtext('sabc_business_schema_migrations'))");
    await ensureMigrationTable(client);

    const applied = await getAppliedMigrations(client);
    const files = await loadMigrationFiles();

    for (const file of files) {
      const fullPath = path.join(migrationsDir, file);
      const sql = await readFile(fullPath, 'utf8');
      const digest = checksum(sql);
      const current = applied.get(file);

      if (current && current === digest) {
        console.log(`skip ${file}`);
        continue;
      }

      if (current && current !== digest) {
        throw new Error(
          `Migration ${file} already applied with a different checksum. Create a new migration instead of editing it.`,
        );
      }

      console.log(`apply ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations_pg (version, checksum) VALUES ($1, $2)',
          [file, digest],
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock(hashtext('sabc_business_schema_migrations'))");
    } catch {
      // best effort unlock
    }
    client.release();
    await pool.end();
  }
}

run()
  .then(() => {
    console.log('PostgreSQL business migrations applied successfully');
  })
  .catch((error) => {
    console.error('Failed to apply PostgreSQL business migrations');
    console.error(error);
    process.exit(1);
  });
