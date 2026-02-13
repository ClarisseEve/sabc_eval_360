# Integration Architecture

## High-Level Flow

1. **Laravel App** serves UI and orchestrates workflows.
2. **Evaluation Service** handles evaluation lifecycle via REST (`/api/v2/evaluations`).
3. **Analytics Service** serves KPIs, trends, anomalies from ClickHouse.
4. **Pipelines** feed analytics stores from business/core databases.

## Integration Points

- **App -> Evaluation Service**
  - Proxy: `app/Services/EvaluationServiceProxy.php`
  - Feature flags control migration (Strangler pattern)
  - Routes map to `/api/v2/evaluations`, `/api/v2/periodes`, `/api/v2/scores`

- **App -> Analytics Service**
  - Proxy: `app/Services/AnalyticsServiceProxy.php`
  - Optional internal service key auth
  - Caching TTLs aligned with perf rules

- **Pipelines -> ClickHouse**
  - Batch ingestion (ETL) populates analytics tables
  - Aggregates support dashboards and anomaly detection

## Data Sync (per docs)

- MySQL -> PostgreSQL sync (scheduled)
- PostgreSQL -> ClickHouse sync (daily/weekly)

## Observability

- Prometheus metrics exposed by Go services
- Jaeger tracing across services

## Security and Governance

- Role-based access enforced in Laravel
- Region/branch constraints enforced in business logic
- Sensitive data stays in core/business DBs; analytics is aggregated

