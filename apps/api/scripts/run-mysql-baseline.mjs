import {
  readdirSync,
  readFileSync,
  existsSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiRoot = path.resolve(__dirname, '..');
const envPath = path.join(apiRoot, '.env');
const schemaPath = path.join(apiRoot, 'prisma', 'schema.prisma');
const migrationsDir = path.join(apiRoot, 'prisma', 'migrations');

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

function getMigrations() {
  return readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(
        path.join(migrationsDir, name, 'migration.sql'),
        'utf8',
      ),
    }));
}

function runPrisma(args, { allowDiff = false, stdio = 'pipe' } = {}) {
  const result = spawnSync('pnpm', ['exec', 'prisma', ...args], {
    cwd: apiRoot,
    env: process.env,
    encoding: 'utf8',
    stdio,
  });

  if (result.error) throw result.error;
  if (result.status === 0 || (allowDiff && result.status === 2)) return result;

  const detail = [result.stdout, result.stderr]
    .filter(Boolean)
    .join('\n')
    .trim();
  const safeArgs = args.map((arg, index) =>
    args[index - 1] === '--from-url' ? '<redacted-database-url>' : arg,
  );
  throw new Error(
    `Prisma command failed (exit ${result.status ?? 'unknown'}): prisma ${safeArgs.join(' ')}${detail ? `\n${detail}` : ''}`,
  );
}

function schemaMatches(targetSchemaPath) {
  const result = runPrisma(
    [
      'migrate',
      'diff',
      '--from-url',
      process.env.DATABASE_URL,
      '--to-schema-datamodel',
      targetSchemaPath,
      '--exit-code',
    ],
    { allowDiff: true },
  );
  return result.status === 0;
}

function markApplied(migrations) {
  for (const migration of migrations) {
    console.log(`[mysql-baseline] marking ${migration.name} as applied`);
    runPrisma(
      [
        'migrate',
        'resolve',
        '--schema',
        schemaPath,
        '--applied',
        migration.name,
      ],
      { stdio: 'inherit' },
    );
  }
}

function createSchemaWithoutPreferences() {
  const schema = readFileSync(schemaPath, 'utf8');
  const preferenceFieldPattern =
    /^\s*preferences_json\s+Json\?[^\r\n]*(?:\r?\n|$)/m;
  if (!preferenceFieldPattern.test(schema)) {
    throw new Error(
      'Could not locate Utilisateur.preferences_json in prisma/schema.prisma',
    );
  }

  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'sabc-mysql-baseline-'));
  const temporarySchemaPath = path.join(tempDir, 'schema.prisma');
  writeFileSync(
    temporarySchemaPath,
    schema.replace(preferenceFieldPattern, ''),
    'utf8',
  );
  return { tempDir, temporarySchemaPath };
}

function classifyExistingSchema() {
  if (schemaMatches(schemaPath)) return 'current';

  const { tempDir, temporarySchemaPath } = createSchemaWithoutPreferences();
  try {
    return schemaMatches(temporarySchemaPath) ? 'without-preferences' : 'other';
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function getPreferenceMigration(migrations) {
  const preferenceMigrations = migrations.filter((migration) =>
    /\bpreferences_json\b/.test(migration.sql),
  );
  if (preferenceMigrations.length !== 1) {
    throw new Error(
      `Expected exactly one preferences_json migration, found ${preferenceMigrations.length}`,
    );
  }
  return preferenceMigrations[0];
}

async function reconcileTrackedBaseline(prisma, migrations) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT migration_name, finished_at, rolled_back_at
       FROM _prisma_migrations
      ORDER BY started_at ASC`,
  );

  const failed = rows
    .filter((row) => row.finished_at === null && row.rolled_back_at === null)
    .map((row) => String(row.migration_name));
  if (failed.length > 0) {
    throw new Error(
      `Failed MySQL migration records require an explicit recovery before baselining: ${failed.join(', ')}`,
    );
  }

  const knownNames = new Set(migrations.map((migration) => migration.name));
  const appliedNames = new Set(
    rows
      .filter((row) => row.finished_at !== null && row.rolled_back_at === null)
      .map((row) => String(row.migration_name)),
  );
  const unknownApplied = [...appliedNames]
    .filter((name) => !knownNames.has(name))
    .sort();
  if (unknownApplied.length > 0) {
    throw new Error(
      `Database contains applied migrations absent from this checkout: ${unknownApplied.join(', ')}`,
    );
  }

  const pending = migrations.filter(
    (migration) => !appliedNames.has(migration.name),
  );
  if (pending.length === 0) {
    console.log('[mysql-baseline] all Prisma migrations are already tracked');
    return;
  }

  console.log(
    `[mysql-baseline] migration tracking exists with ${pending.length} pending migration(s), checking whether their schema effects already exist`,
  );
  const schemaKind = classifyExistingSchema();

  if (schemaKind === 'current') {
    console.log(
      '[mysql-baseline] schema already matches the current Prisma model',
    );
    markApplied(pending);
    return;
  }

  if (schemaKind === 'without-preferences') {
    const preferenceMigration = getPreferenceMigration(migrations);
    if (appliedNames.has(preferenceMigration.name)) {
      throw new Error(
        `${preferenceMigration.name} is recorded as applied but preferences_json is missing`,
      );
    }

    markApplied(
      pending.filter(
        (migration) => migration.name !== preferenceMigration.name,
      ),
    );
    console.log(
      `[mysql-baseline] leaving ${preferenceMigration.name} pending for migrate deploy`,
    );
    return;
  }

  console.log(
    `[mysql-baseline] pending migrations will be applied normally: ${pending.map((migration) => migration.name).join(', ')}`,
  );
}

async function main() {
  loadEnvFile(envPath);

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for MySQL baselining');
  }

  const migrations = getMigrations();
  if (migrations.length === 0) {
    console.log('[mysql-baseline] no Prisma migrations found, skipping');
    return;
  }

  const prisma = new PrismaClient();

  try {
    const tables = await prisma.$queryRawUnsafe('SHOW TABLES');
    const tableNames = tables.map((row) => String(Object.values(row)[0] ?? ''));
    const hasPrismaMigrations = tableNames.includes('_prisma_migrations');
    const appTables = tableNames.filter(
      (name) => name !== '_prisma_migrations',
    );

    if (hasPrismaMigrations) {
      await reconcileTrackedBaseline(prisma, migrations);
      return;
    }

    if (appTables.length === 0) {
      console.log('[mysql-baseline] database is empty, baseline not required');
      return;
    }

    console.log(
      `[mysql-baseline] existing schema detected (${appTables.length} tables), validating before baseline`,
    );

    const schemaKind = classifyExistingSchema();
    if (schemaKind === 'current') {
      console.log('[mysql-baseline] schema matches the current Prisma model');
      markApplied(migrations);
      return;
    }

    if (schemaKind === 'without-preferences') {
      console.log(
        '[mysql-baseline] schema matches the current Prisma model except preferences_json',
      );
      const preferenceMigration = getPreferenceMigration(migrations);
      markApplied(
        migrations.filter(
          (migration) => migration.name !== preferenceMigration.name,
        ),
      );
      console.log(
        `[mysql-baseline] leaving ${preferenceMigration.name} pending for migrate deploy`,
      );
      return;
    }

    throw new Error(
      'Existing MySQL schema matches neither the current Prisma model nor the supported pre-preferences model. Automatic baseline refused; review the schema diff before resolving migrations.',
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[mysql-baseline] failed', error);
  process.exit(1);
});
