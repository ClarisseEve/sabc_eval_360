# Architecture — Analytics Service (Go)

## Overview

Go microservice serving analytics datasets, KPIs, trends, anomalies, and user recommendations. Reads from ClickHouse.

## Components

- **Entry point**: `cmd/server/main.go`
- **Handlers**: `internal/handler/http_handler.go`
- **Service layer**: `internal/service/*`
- **Repository**: `internal/repository/clickhouse/*`
- **Middleware**: `internal/middleware` (tracing, internal auth)
- **Config**: `config/config.go`

## API Surface

REST endpoints under `/api/v2/analytics` (see `docs/api-contracts-analytics.md`). Health and metrics are public.

## Storage

- ClickHouse for analytics aggregates.
- Tables initialized via SQL scripts in the main app (see `database/clickhouse`).

## Observability

- Prometheus metrics at `/metrics`.
- Jaeger tracing via OpenTracing.

## Security

- Optional internal service key middleware for `/api/v2`.

