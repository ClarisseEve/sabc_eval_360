# SABC Eval360

Architecture active:

- Frontend principal: `apps/web`
- Backend principal: `apps/api`
- Base core: MySQL
- Base business: PostgreSQL

Les anciens artefacts Laravel/Inertia et les microservices Go ne font plus partie de la chaîne active.

## Commandes utiles

Depuis la racine:

```bash
pnpm dev
pnpm build
pnpm dev:api
pnpm build:api
pnpm seed:api
```

## Docker

Le `docker-compose.yml` racine lance désormais uniquement:

- `frontend`
- `nestjs-api`
- `mysql`
- `postgres`
- `redis`

## Cutover NestJS

- Checklist d'exploitation: [docs/operations/nestjs-cutover-checklist.md](./docs/operations/nestjs-cutover-checklist.md)
- Préflight automatisé:

```bash
pnpm --dir apps/api preflight:cutover
```
