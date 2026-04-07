# Architecture — Analytics Domain

## Overview

Le domaine analytics est servi par `apps/api/src/analytics`.

## Surface API active

- `GET /api/analytics/dashboard`
- `GET /api/analytics/evaluations`
- `GET /api/analytics/performances`
- `GET /api/analytics/region/:idRegion`
- `GET /api/analytics/region/:idRegion/classement`
- `GET /api/analytics/anomalies`
- `GET /api/analytics/scores`
- `GET /api/analytics/recommandations`
- `GET /api/analytics/axes-amelioration`

## Sources de données

- PostgreSQL business pour les évaluations, périodes, règles et agrégats
- MySQL core pour les utilisateurs, rôles, régions et structure

## Runtime

- agrégations calculées côté NestJS
- cache applicatif sur les endpoints lourds
- exposition directe à `apps/web` via `analyticsApi`
