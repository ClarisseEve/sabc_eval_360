# Development Guide — Analytics Service

## Prerequisites

- Go 1.23+
- ClickHouse
- Docker (optional)

## Setup

```bash
cd services/analytics
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

