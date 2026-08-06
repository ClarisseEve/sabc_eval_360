# Source Tree Analysis

## Vue d’ensemble

Le dépôt est centré sur deux applications actives et un dossier de pipelines:

- `apps/web`
- `apps/api`

## Structure principale

```text
project-root/
├── apps/
│   ├── api/
│   └── web/
├── docker/
├── docs/
├── docker-compose.yml
└── README.md
```

## Répertoires critiques

### `apps/web`
Frontend SPA React.

### `apps/api`
API NestJS, auth JWT, services métier, Prisma MySQL, accès PostgreSQL.

### `docker`
Infra active pour MySQL/PostgreSQL et composants annexes encore conservés.
