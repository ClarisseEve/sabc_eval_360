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

async function migrationTableExists(client) {
  const result = await client.query(
    "SELECT to_regclass('public.schema_migrations_pg') IS NOT NULL AS exists",
  );
  return result.rows[0]?.exists === true;
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

async function loadMigrations(files) {
  return Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(migrationsDir, file);
      const sql = await readFile(fullPath, 'utf8');
      return { file, sql, digest: checksum(sql) };
    }),
  );
}

function extractManagedTables(migrations) {
  const tables = new Set();
  const createTablePattern =
    /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:"[^"]+"\.)?"?([a-zA-Z_][a-zA-Z0-9_]*)"?/gi;

  for (const migration of migrations) {
    for (const match of migration.sql.matchAll(createTablePattern)) {
      if (match[1] !== 'schema_migrations_pg') tables.add(match[1]);
    }
  }

  return [...tables].sort();
}

async function getExistingManagedTables(client, managedTables) {
  if (managedTables.length === 0) return [];
  const result = await client.query(
    `SELECT tablename
       FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename = ANY($1::text[])
      ORDER BY tablename`,
    [managedTables],
  );
  return result.rows.map((row) => row.tablename);
}

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeDefinition(value, schema) {
  if (value === null || value === undefined) return null;
  const schemaPattern = new RegExp(`"?${escapeRegExp(schema)}"?\\.`, 'g');
  return String(value)
    .replace(schemaPattern, '')
    .replace(/"?public"?\./g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function prepareMigrationForReference(sql, schema) {
  return sql
    .replace(/CREATE\s+EXTENSION\s+IF\s+NOT\s+EXISTS\s+"?pgcrypto"?\s*;/gi, '')
    .replace(/'public\.([a-zA-Z_][a-zA-Z0-9_]*)'/g, `'${schema}.$1'`)
    .replace(
      /WHERE(\s+)conname\s*=\s*('[^']+')/g,
      `WHERE$1conname = $2 AND connamespace = '${schema}'::regnamespace`,
    );
}

async function readColumns(client, schema) {
  const result = await client.query(
    `SELECT cls.relname AS table_name,
            attr.attname AS column_name,
            format_type(attr.atttypid, attr.atttypmod) AS formatted_type,
            attr.attnotnull AS not_null,
            pg_get_expr(def.adbin, def.adrelid) AS default_expression
       FROM pg_class cls
       JOIN pg_namespace ns ON ns.oid = cls.relnamespace
       JOIN pg_attribute attr ON attr.attrelid = cls.oid
  LEFT JOIN pg_attrdef def ON def.adrelid = cls.oid AND def.adnum = attr.attnum
      WHERE ns.nspname = $1
        AND cls.relkind IN ('r', 'p')
        AND attr.attnum > 0
        AND NOT attr.attisdropped
      ORDER BY cls.relname, attr.attnum`,
    [schema],
  );
  return result.rows;
}

async function readConstraints(client, schema) {
  const result = await client.query(
    `SELECT cls.relname AS table_name,
            con.conname AS constraint_name,
            con.contype AS constraint_type,
            pg_get_constraintdef(con.oid, true) AS definition
       FROM pg_constraint con
       JOIN pg_class cls ON cls.oid = con.conrelid
       JOIN pg_namespace ns ON ns.oid = cls.relnamespace
      WHERE ns.nspname = $1
      ORDER BY cls.relname, con.conname`,
    [schema],
  );
  return result.rows;
}

async function readIndexes(client, schema) {
  const result = await client.query(
    `SELECT tablename AS table_name, indexname AS index_name, indexdef AS definition
       FROM pg_indexes
      WHERE schemaname = $1
      ORDER BY tablename, indexname`,
    [schema],
  );
  return result.rows;
}

async function compareSchemaToReference(
  client,
  referenceSchema,
  managedTables,
) {
  const managed = new Set(managedTables);
  // A single pg client must execute one query at a time. Keeping these reads
  // sequential also makes this compatible with pg@9, which rejects concurrent
  // client.query() calls.
  const expectedColumns = await readColumns(client, referenceSchema);
  const actualColumns = await readColumns(client, 'public');
  const expectedConstraints = await readConstraints(client, referenceSchema);
  const actualConstraints = await readConstraints(client, 'public');
  const expectedIndexes = await readIndexes(client, referenceSchema);
  const actualIndexes = await readIndexes(client, 'public');

  const mismatches = [];
  const actualColumnMap = new Map(
    actualColumns
      .filter((row) => managed.has(row.table_name))
      .map((row) => [`${row.table_name}.${row.column_name}`, row]),
  );

  for (const expected of expectedColumns.filter((row) =>
    managed.has(row.table_name),
  )) {
    const key = `${expected.table_name}.${expected.column_name}`;
    const actual = actualColumnMap.get(key);
    if (!actual) {
      mismatches.push(`missing column ${key}`);
      continue;
    }
    if (actual.formatted_type !== expected.formatted_type) {
      mismatches.push(
        `column ${key} type is ${actual.formatted_type}, expected ${expected.formatted_type}`,
      );
    }
    if (actual.not_null !== expected.not_null) {
      mismatches.push(
        `column ${key} nullability is ${actual.not_null ? 'NOT NULL' : 'NULL'}, expected ${expected.not_null ? 'NOT NULL' : 'NULL'}`,
      );
    }
    const actualDefault = normalizeDefinition(
      actual.default_expression,
      'public',
    );
    const expectedDefault = normalizeDefinition(
      expected.default_expression,
      referenceSchema,
    );
    if (actualDefault !== expectedDefault) {
      mismatches.push(
        `column ${key} default is ${actualDefault ?? 'none'}, expected ${expectedDefault ?? 'none'}`,
      );
    }
  }

  const actualConstraintMap = new Map(
    actualConstraints
      .filter((row) => managed.has(row.table_name))
      .map((row) => [`${row.table_name}.${row.constraint_name}`, row]),
  );
  for (const expected of expectedConstraints.filter((row) =>
    managed.has(row.table_name),
  )) {
    const key = `${expected.table_name}.${expected.constraint_name}`;
    const actual = actualConstraintMap.get(key);
    if (!actual) {
      mismatches.push(`missing constraint ${key}`);
      continue;
    }
    const actualDefinition = normalizeDefinition(actual.definition, 'public');
    const expectedDefinition = normalizeDefinition(
      expected.definition,
      referenceSchema,
    );
    if (
      actual.constraint_type !== expected.constraint_type ||
      actualDefinition !== expectedDefinition
    ) {
      mismatches.push(
        `constraint ${key} is ${actualDefinition}, expected ${expectedDefinition}`,
      );
    }
  }

  const actualIndexMap = new Map(
    actualIndexes
      .filter((row) => managed.has(row.table_name))
      .map((row) => [`${row.table_name}.${row.index_name}`, row]),
  );
  for (const expected of expectedIndexes.filter((row) =>
    managed.has(row.table_name),
  )) {
    const key = `${expected.table_name}.${expected.index_name}`;
    const actual = actualIndexMap.get(key);
    if (!actual) {
      mismatches.push(`missing index ${key}`);
      continue;
    }
    const actualDefinition = normalizeDefinition(actual.definition, 'public');
    const expectedDefinition = normalizeDefinition(
      expected.definition,
      referenceSchema,
    );
    if (actualDefinition !== expectedDefinition) {
      mismatches.push(
        `index ${key} is ${actualDefinition}, expected ${expectedDefinition}`,
      );
    }
  }

  return mismatches;
}

async function baselineExistingSchema(
  client,
  migrations,
  managedTables,
  applied,
) {
  for (const migration of migrations) {
    const current = applied.get(migration.file);
    if (current && current !== migration.digest) {
      throw new Error(
        `Cannot baseline: ${migration.file} is recorded with a different checksum.`,
      );
    }
  }

  const referenceSchema = `__sabc_baseline_${process.pid}_${crypto.randomBytes(6).toString('hex')}`;
  await client.query('BEGIN');
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await client.query(`CREATE SCHEMA ${quoteIdentifier(referenceSchema)}`);
    await client.query(
      `SET LOCAL search_path TO ${quoteIdentifier(referenceSchema)}, public`,
    );

    for (const migration of migrations) {
      await client.query(
        prepareMigrationForReference(migration.sql, referenceSchema),
      );
    }

    await client.query('SET LOCAL search_path TO public');
    const mismatches = await compareSchemaToReference(
      client,
      referenceSchema,
      managedTables,
    );
    if (mismatches.length > 0) {
      const shown = mismatches
        .slice(0, 40)
        .map((item) => `  - ${item}`)
        .join('\n');
      const remaining =
        mismatches.length > 40
          ? `\n  - ... and ${mismatches.length - 40} more`
          : '';
      throw new Error(
        `Existing PostgreSQL schema does not match the canonical migrations; baseline refused.\n${shown}${remaining}`,
      );
    }

    await client.query(
      `DROP SCHEMA ${quoteIdentifier(referenceSchema)} CASCADE`,
    );
    await ensureMigrationTable(client);
    for (const migration of migrations) {
      await client.query(
        `INSERT INTO schema_migrations_pg (version, checksum)
         VALUES ($1, $2)
         ON CONFLICT (version) DO NOTHING`,
        [migration.file, migration.digest],
      );
      console.log(`baseline ${migration.file}`);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function run() {
  await loadEnvFile();
  const pool = new pg.Pool(getConnectionConfig());
  const client = await pool.connect();

  try {
    await client.query(
      "SELECT pg_advisory_lock(hashtext('sabc_business_schema_migrations'))",
    );
    const files = await loadMigrationFiles();
    const migrations = await loadMigrations(files);
    const managedTables = extractManagedTables(migrations);
    const existingManagedTables = await getExistingManagedTables(
      client,
      managedTables,
    );
    const hasMigrationTable = await migrationTableExists(client);
    let applied = hasMigrationTable
      ? await getAppliedMigrations(client)
      : new Map();
    const firstMigrationMissing =
      migrations.length > 0 && !applied.has(migrations[0].file);

    if (existingManagedTables.length > 0 && firstMigrationMissing) {
      if (process.env.PG_BASELINE_EXISTING !== 'true') {
        throw new Error(
          `Existing PostgreSQL business schema detected without its initial migration record (${existingManagedTables.join(', ')}). ` +
            'Refusing to guess. Re-run once with PG_BASELINE_EXISTING=true to validate the full schema and baseline checksums.',
        );
      }
      await baselineExistingSchema(client, migrations, managedTables, applied);
      applied = await getAppliedMigrations(client);
    } else if (!hasMigrationTable) {
      await ensureMigrationTable(client);
      applied = await getAppliedMigrations(client);
    }

    for (const migration of migrations) {
      const current = applied.get(migration.file);

      if (current && current === migration.digest) {
        console.log(`skip ${migration.file}`);
        continue;
      }

      if (current && current !== migration.digest) {
        throw new Error(
          `Migration ${migration.file} already applied with a different checksum. Create a new migration instead of editing it.`,
        );
      }

      console.log(`apply ${migration.file}`);
      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO schema_migrations_pg (version, checksum) VALUES ($1, $2)',
          [migration.file, migration.digest],
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    try {
      await client.query(
        "SELECT pg_advisory_unlock(hashtext('sabc_business_schema_migrations'))",
      );
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
