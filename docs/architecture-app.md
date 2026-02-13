# Architecture — Application (Laravel + Inertia)

## Overview

Primary web application providing UI, business workflows, and orchestration for analytics/evaluation services. Built as a Laravel monolith with an Inertia/React SPA frontend.

## Core Layers

- **Web/UI**: Inertia pages under `resources/js/pages/*`
- **Controllers**: `app/Http/Controllers/*` for web routes
- **Policies/Middleware**: role enforcement + auth
- **Services**: orchestration and external service proxies
- **Models**: multi-DB domain models (Core/Business/Analytics)

## Key Modules

- **Authentication**: session-based (web), Sanctum for API.
- **Role-based dashboards**: DR/CDTT/CSC/CDV/CDS/RTM/TMO/SRMO/SS/AS.
- **Evaluation workflow**: creation, submission, validation, and history.
- **Analytics hub**: Admin-only analytics UI (filters, KPIs, insights).
- **Admin**: structure management (regions/services/districts/secteurs), roles, permissions.

## Data Architecture

Multi-database setup (see `MULTI_DATABASE_SETUP.md`):

- **MySQL (core)**: users, roles, regions, branches, audit logs.
- **PostgreSQL (business)**: evaluations, rules, periods, notifications.
- **ClickHouse (analytics)**: aggregated analytics tables.

## Integration Points

- **AnalyticsServiceProxy**: Strangler proxy to Go analytics service with fallbacks and cache TTLs.
- **EvaluationServiceProxy**: Strangler proxy to Go evaluation service with feature flags.

## Observability

- Prometheus metrics via `/metrics` in Go services.
- Jaeger tracing (per Go service config) and OpenTracing headers in proxies.

## Security

- Role-based access enforced with middleware `role:*` and policies.
- Geo constraints and cross-branch rules enforced in business logic.

## Frontend Architecture

- **Component library** in `resources/js/Components`.
- **Contexts/Hooks** for auth, permissions, analytics, notifications.
- **Design system** based on `resources/css/sabc-colors.css` and graphic rules.

