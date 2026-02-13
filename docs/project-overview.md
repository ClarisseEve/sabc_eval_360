# sabc_eval360 - Project Overview

**Date:** 2026-01-08
**Type:** Monorepo (multi-part)
**Architecture:** Laravel monolith + Go microservices + Python pipelines

## Executive Summary

SABC Eval360 is a 360-degree performance evaluation platform. It combines a Laravel/Inertia web app with Go microservices for evaluations and analytics, backed by a multi-database architecture (MySQL, PostgreSQL, ClickHouse). Data pipelines feed analytics dashboards and anomaly detection.

## Project Classification

- **Repository Type:** monorepo
- **Project Types:** web app, backend services, data pipelines
- **Primary Languages:** PHP, TypeScript/React, Go, Python
- **Architecture Pattern:** monolith + microservices (Strangler)

## Multi-Part Structure

### Application principale (Laravel + Vite)
- **Type:** web
- **Location:** `.`
- **Purpose:** UI + orchestration of evaluations, dashboards, admin
- **Tech Stack:** Laravel 12, Inertia, React 19, Vite 6

### Service Analytics (Go)
- **Type:** backend
- **Location:** `services/analytics`
- **Purpose:** KPIs, trends, anomalies, recommendations
- **Tech Stack:** Go 1.23, Gin, ClickHouse

### Service Evaluation (Go)
- **Type:** backend
- **Location:** `services/evaluation`
- **Purpose:** evaluation lifecycle APIs
- **Tech Stack:** Go 1.23, Gin, PostgreSQL, Redis

### Data Pipelines (Python)
- **Type:** data
- **Location:** `data_pipelines`
- **Purpose:** ETL for analytics
- **Tech Stack:** Python, pandas, sqlalchemy

## Technology Stack Summary

- **Backend:** PHP 8.2, Laravel 12
- **Frontend:** React 19, Inertia, Tailwind
- **Microservices:** Go 1.23 (Gin)
- **Pipelines:** Python (pandas/numpy/sqlalchemy)
- **Datastores:** MySQL, PostgreSQL, ClickHouse, Redis

## Key Features

- Role-based dashboards (DR, CDTT, CSC, CDV, CDS, RTM, TMO, SRMO, SS, AS)
- Evaluation creation, submission, validation workflows
- Analytics hub with KPIs, trends, anomalies, recommendations
- Multi-database sync and analytics ETL

## Architecture Highlights

- Strangler proxies for evaluation and analytics services
- Multi-DB separation for core, business, analytics data
- Observability via Prometheus and Jaeger

## Development Overview

### Prerequisites

PHP 8.2, Composer, Node 22 (pnpm), Go 1.23, Python 3.x, Docker

### Key Commands

- App dev: `composer dev`
- App tests: `composer test`
- Analytics service: `go run ./cmd/server`
- Evaluation service: `go run ./cmd/server`
- Pipelines: `python main_pipeline.py`

## Repository Structure

See `source-tree-analysis.md` and `integration-architecture.md`.

## Documentation Map

- `index.md`
- `architecture-*.md`
- `api-contracts-*.md`
- `data-models-*.md`
- `development-guide-*.md`

