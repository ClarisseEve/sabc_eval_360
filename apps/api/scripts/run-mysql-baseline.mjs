import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiRoot = path.resolve(__dirname, '..');
const envPath = path.join(apiRoot, '.env');

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

function getInitialMigrationName() {
  const migrationsDir = path.join(apiRoot, 'prisma', 'migrations');
  return readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()[0];
}

async function main() {
  loadEnvFile(envPath);

  const initialMigrationName = getInitialMigrationName();
  if (!initialMigrationName) {
    console.log('[mysql-baseline] no Prisma migrations found, skipping');
    return;
  }

  const prisma = new PrismaClient();

  try {
    const tables = await prisma.$queryRawUnsafe('SHOW TABLES');
    const tableNames = tables.map((row) => String(Object.values(row)[0] ?? ''));
    const hasPrismaMigrations = tableNames.includes('_prisma_migrations');
    const appTables = tableNames.filter((name) => name !== '_prisma_migrations');

    if (hasPrismaMigrations) {
      console.log('[mysql-baseline] _prisma_migrations already present, skipping baseline');
      return;
    }

    if (appTables.length === 0) {
      console.log('[mysql-baseline] database is empty, baseline not required');
      return;
    }

    console.log(`[mysql-baseline] existing schema detected (${appTables.length} tables), marking ${initialMigrationName} as applied`);
    execSync(`pnpm prisma migrate resolve --applied ${initialMigrationName}`, {
      cwd: apiRoot,
      stdio: 'inherit',
      env: process.env,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[mysql-baseline] failed', error);
  process.exit(1);
});
