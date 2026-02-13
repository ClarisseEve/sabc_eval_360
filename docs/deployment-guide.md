# Deployment Guide

## Overview

Deployment uses Docker Compose for local/preview. Service-specific Dockerfiles are under `docker/` and `services/*/Dockerfile`.

## Components

- **App (Laravel + Vite)**: PHP + Nginx containers
- **Datastores**: MySQL, PostgreSQL, Redis, ClickHouse
- **Analytics Service**: Go container
- **Evaluation Service**: Go container
- **Monitoring**: Prometheus, Grafana, Alertmanager

## Local/Preview

```bash
# From project root
make up
# Or
Docker Compose up -d
```

## Environment

Populate `.env` and service env vars (see `MULTI_DATABASE_SETUP.md`).

## Notes

- CI pipelines defined in `.github/workflows`.
- Traefik config is present under `docker/traefik`.

