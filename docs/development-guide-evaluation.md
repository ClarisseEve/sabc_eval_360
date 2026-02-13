# Development Guide — Evaluation Service

## Prerequisites

- Go 1.23+
- PostgreSQL 16+
- Redis 7+
- Docker / Docker Compose

## Setup

```bash
cd services/evaluation
go mod download
```

## Run Locally

```bash
go run ./cmd/server
```

## Tests

```bash
go test ./...
```

## Notes

- Strangler pattern with feature flags (see `services/evaluation/README.md`).

