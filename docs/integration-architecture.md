# Integration Architecture

## High-Level Flow

1. `apps/web` consomme l’API `apps/api` via HTTP.
2. `apps/api` orchestre les domaines métier.
3. MySQL porte le référentiel core.
4. PostgreSQL porte les données métier.

## Intégrations actives

- `apps/web` -> `apps/api`
  - JWT bearer
  - React Query
  - préfixe `/api`

- `apps/api` -> MySQL
  - Prisma
  - utilisateurs, rôles, régions, branches

- `apps/api` -> PostgreSQL
  - driver `pg`
  - évaluations, périodes, règles, templates et analytics métier

## Observabilité

- intercepteur de logs HTTP dans NestJS
- healthcheck via `/api/health`
- Prometheus reste optionnel et hors chaîne critique du runtime local
