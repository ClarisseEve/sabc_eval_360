# Development Guide — App (Laravel + Inertia)

## Prerequisites

- PHP 8.2+
- Composer 2
- Node 22+ (pnpm)
- MySQL, PostgreSQL, ClickHouse, Redis
- Docker / Docker Compose (recommended)

## Setup

```bash
cp .env.example .env
composer install
pnpm install
php artisan key:generate
```

## Database

```bash
php artisan migrate --database=mysql
php artisan migrate --database=pgsql
# ClickHouse setup
./database/clickhouse/run_clickhouse_script.sh database/clickhouse/create_analytics_tables.sql
```

## Run Locally

```bash
composer dev
```

## Tests

```bash
composer test
```

## Notes

- Multi-DB details in `MULTI_DATABASE_SETUP.md`.
- Analytics UI data may come from `AnalyticsServiceProxy` (feature flag).

