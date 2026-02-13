# Component Inventory — Analytics Service

## Modules

- **cmd/server**: service entry point and HTTP server setup
- **internal/handler**: REST endpoints for analytics
- **internal/service**: KPI/trend/anomaly use-cases
- **internal/repository/clickhouse**: queries and data access
- **internal/middleware**: tracing + internal auth
- **config**: configuration loader

