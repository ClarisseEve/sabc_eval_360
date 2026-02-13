# Data Models — Analytics Service

## Storage

- ClickHouse (analytics store)
- Laravel app initializes via SQL scripts: `database/clickhouse/create_analytics_tables.sql`

## Known Tables (from project docs)

- `evaluations_analytics`
- `performance_region`
- `performance_branche`
- `scores_analytics`

> The analytics service reads ClickHouse via repository layer (`internal/repository/clickhouse`).

