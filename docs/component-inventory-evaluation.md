# Component Inventory — Evaluation Service

## Modules

- **cmd/server**: entry point + HTTP server
- **internal/handler**: evaluation, periodes, scores endpoints
- **internal/service**: evaluation lifecycle logic
- **internal/repository/postgres**: persistence
- **internal/domain**: domain entities
- **internal/middleware**: auth + tracing
- **api/openapi**: REST spec
- **api/proto**: gRPC spec

