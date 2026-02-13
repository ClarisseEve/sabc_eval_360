# sabc_eval360 - Source Tree Analysis

**Date:** 2026-01-08

## Overview

Monorepo with four parts: Laravel/Inertia app, analytics service (Go), evaluation service (Go), and data pipelines (Python). This tree omits large/generated folders (`node_modules`, `vendor`, `storage`) and legacy archives (`sample`, `archives`).

## Multi-Part Structure

- **Application (app)** (`.`): Laravel + Inertia/React UI and business logic
- **Analytics service** (`services/analytics`): Go service for KPIs and insights
- **Evaluation service** (`services/evaluation`): Go service for evaluation lifecycle
- **Data pipelines** (`data_pipelines`): ETL and analytics feeders

## Complete Directory Structure

```
project-root/
├── app/
│   ├── Console/
│   ├── Events/
│   ├── Exceptions/
│   ├── Helpers/
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   ├── Requests/
│   │   └── Resources/
│   ├── Jobs/
│   ├── Listeners/
│   ├── Models/
│   │   ├── Analytics/
│   │   ├── Business/
│   │   ├── Core/
│   │   └── (domain models)
│   ├── Policies/
│   ├── Providers/
│   ├── Services/
│   └── Traits/
├── config/
├── data_pipelines/
│   ├── config/
│   ├── extract/
│   ├── load/
│   ├── models/
│   ├── transform/
│   ├── utils/
│   └── main_pipeline.py
├── database/
│   ├── clickhouse/
│   ├── factories/
│   ├── migrations/
│   └── seeders/
├── docker/
│   ├── clickhouse/
│   ├── mysql/
│   ├── postgres/
│   ├── redis/
│   ├── nginx/
│   ├── php/
│   └── prometheus/
├── docs/
├── public/
├── resources/
│   ├── css/
│   ├── js/
│   │   ├── Components/
│   │   ├── Contexts/
│   │   ├── Hooks/
│   │   ├── Layouts/
│   │   ├── Services/
│   │   └── pages/
│   └── views/
├── routes/
│   ├── api.php
│   ├── auth.php
│   ├── settings.php
│   └── web.php
├── services/
│   ├── analytics/
│   │   ├── cmd/server
│   │   ├── config/
│   │   └── internal/{handler,middleware,repository,service,domain}
│   └── evaluation/
│       ├── api/{openapi,proto}
│       ├── cmd/server
│       ├── config/
│       ├── internal/{handler,middleware,repository,service,domain}
│       └── migrations/
├── tests/
└── docker-compose.yml
```

## Critical Directories

### `app/Http`
**Purpose:** HTTP layer for the Laravel app (controllers, middleware, requests, API resources).
**Contains:** Role-based dashboards, evaluation flows, admin CRUD endpoints.

### `app/Models`
**Purpose:** Domain models for Core (MySQL), Business (PostgreSQL), Analytics (ClickHouse).
**Contains:** `Utilisateur`, `Evaluation`, `RegleEvaluation`, `ScoreUtilisateur`, etc.

### `resources/js`
**Purpose:** Inertia/React frontend.
**Contains:** UI component system, dashboards by role, evaluation screens, analytics hub.

### `services/analytics`
**Purpose:** Analytics microservice (Gin).
**Contains:** HTTP handlers, ClickHouse repository, service layer.

### `services/evaluation`
**Purpose:** Evaluation microservice (Gin).
**Contains:** REST API, OpenAPI/Proto specs, PostgreSQL repository.

### `data_pipelines`
**Purpose:** ETL workflows feeding analytics.
**Contains:** extract/transform/load modules and main pipeline script.

### `database/migrations`
**Purpose:** Core app schema definitions (multi-DB).
**Contains:** business tables, rules, periods, scores, notifications, logs.

### `docker/` + `docker-compose.yml`
**Purpose:** Local infra and deployment scaffolding.
**Contains:** MySQL, Postgres, ClickHouse, Redis, Nginx, PHP, monitoring stack.

## Entry Points

- App backend: `public/index.php`, `bootstrap/app.php`
- Frontend: `resources/js/app.tsx`
- Analytics service: `services/analytics/cmd/server/main.go`
- Evaluation service: `services/evaluation/cmd/server/main.go`
- Pipelines: `data_pipelines/main_pipeline.py`

## File Organization Patterns

- **Laravel MVC** in `app/` with policies and services.
- **Inertia SPA** in `resources/js` using component catalog in `Components/` and page routes in `pages/`.
- **Go services** follow `cmd/` + `internal/` layering.
- **Multi-DB** defined in `config/database.php` with per-domain models.

## Notes for Development

- Legacy/archives exist in `sample/` and `archives/` but are excluded from active documentation.
- Analytics UI contracts are described in `docs/analytics/README.md`.

