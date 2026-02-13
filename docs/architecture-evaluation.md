# Architecture — Evaluation Service (Go)

## Overview

Go microservice responsible for the evaluation lifecycle (create, update notes, submit, validate) and read-only scoring. Implements a Strangler migration path from the Laravel monolith.

## Components

- **Entry point**: `cmd/server/main.go`
- **Handlers**: `internal/handler/http_handler.go`
- **Service layer**: `internal/service/*`
- **Repository**: `internal/repository/postgres/*`
- **Domain models**: `internal/domain/*`
- **Config**: `config/config.go`
- **API specs**: `api/openapi` and `api/proto`

## API Surface

REST endpoints under `/api/v2` (see `docs/api-contracts-evaluation.md`).

## Storage

- PostgreSQL (service-local schema) with `evaluations` table and JSONB notes.

## Observability

- Prometheus metrics and Jaeger tracing.

## Security

- Auth middleware (JWT/headers) configured by environment.

## Migration Strategy

Strangler pattern controlled by feature flags in `EvaluationServiceProxy` (Laravel). The proxy falls back to legacy endpoints if a feature is not migrated or the service is disabled.

