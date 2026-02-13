# API Contracts — Analytics Service

## Overview

Analytics microservice exposing read-only KPIs, trends, anomalies, and user insights. Uses Gin with optional internal service key auth on `/api/v2`.

## Base Paths

- Public health: `/health`
- Metrics: `/metrics`
- API v2: `/api/v2/analytics`

## Auth

- Optional internal auth middleware for `/api/v2` if `serviceKey` is configured.

## Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | None | Service health check |
| GET | `/metrics` | None | Prometheus metrics |
| GET | `/api/v2/analytics` | Internal | Full analytics dataset (filters: `period`, `start_date`, `end_date`) |
| GET | `/api/v2/analytics/kpis` | Internal | KPI summary |
| GET | `/api/v2/analytics/channels` | Internal | Channel distribution + bias indicators |
| GET | `/api/v2/analytics/trends` | Internal | Trend analysis |
| GET | `/api/v2/analytics/anomalies` | Internal | Detected anomalies |
| GET | `/api/v2/analytics/regional` | Internal | Regional performance breakdown |
| GET | `/api/v2/analytics/scores/:matricule` | Internal | User score details |
| GET | `/api/v2/analytics/recommendations/:matricule` | Internal | Recommendations for a user |

## Query Parameters (common)

- `period`: `last_6_months` (default) or custom
- `start_date`: `YYYY-MM-DD`
- `end_date`: `YYYY-MM-DD`

