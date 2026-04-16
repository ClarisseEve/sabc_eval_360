# Development Guide — App (React SPA)

## Stack active

- Frontend: `apps/web` avec React 19, TypeScript, Vite et React Query
- Backend: `apps/api` avec NestJS 11
- Core DB: MySQL via Prisma
- Business DB: PostgreSQL via `pg`

## Prérequis

- Node.js 20+
- pnpm 9+
- MySQL 8+
- PostgreSQL 16+
- Docker / Docker Compose en option

## Installation

```bash
cp .env.example .env
pnpm install
```

## Développement local

```bash
pnpm --dir apps/api start:dev
pnpm --dir apps/web dev
```

## Build

```bash
pnpm --dir apps/api build
pnpm --dir apps/web build
```

## Base de données

```bash
pnpm --dir apps/api db:migrate:all
pnpm --dir apps/api db:seed
```

`db:migrate:all` applique:
- les migrations Prisma pour MySQL core
- les migrations SQL versionnées pour PostgreSQL business

## Tests

```bash
pnpm --dir apps/api test
pnpm --dir apps/api test:e2e
```

## Notes

- `apps/web` est l’unique frontend actif.
- Les artefacts Laravel/Inertia et Go ne font plus partie de la chaîne runtime.
