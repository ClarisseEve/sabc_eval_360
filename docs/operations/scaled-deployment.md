# Scaled API Deployment

## Objectif

Préparer une variante simple du déploiement avec:

- `2` instances NestJS API
- `1` gateway Nginx en round-robin
- les mêmes bases MySQL et PostgreSQL
- `1` Redis partagé pour le cache applicatif

Ce fichier n'impose pas la mise en production. Il prépare seulement la capacité de test et de montée en charge.

## Fichiers

- stack: [`docker-compose.scale.yml`](/Users/macbook/Documents/SABC/sabc_eval360/docker-compose.scale.yml)
- gateway: [`default.conf`](/Users/macbook/Documents/SABC/sabc_eval360/docker/nginx-api-gateway/default.conf)

## Démarrage

Avant le lancement:

1. appliquer les migrations:

```bash
pnpm --dir apps/api db:migrate:all
```

2. arrêter une éventuelle stack locale qui occupe déjà `3000`, `3306`, `5432`, `5173`

Puis:

```bash
docker compose -f docker-compose.scale.yml up --build -d
```

Ou via make:

```bash
make up-scale
```

## Vérifications

```bash
curl http://localhost:3000/health/live
curl http://localhost:3000/api/health
curl http://localhost:5173
```

## Topologie

- `frontend` expose `5173`
- `api` est un gateway Nginx exposé sur `3000`
- `nestjs-api-1` et `nestjs-api-2` restent internes au réseau Docker
- `redis` fournit le cache partagé entre replicas
- round-robin Nginx avec `least_conn`

## Décision d'usage

Utiliser cette stack seulement après:

1. test de charge sur `1` instance
2. mesure de latence et d'erreurs
3. constat que le bottleneck n'est pas d'abord SQL ou cache

## Notes

- les JWT restent stateless, donc compatibles avec `2` replicas
- Redis devient la couche de cache partagée pour les dashboards et analytics
- cette variante reste adaptée à une montée en charge modérée sans microservices
- choix d'images:
  - API: `node:20-bookworm-slim` pour éviter les soucis musl/Prisma/bcrypt tout en restant légère
  - Frontend et gateway: `nginx:1.27-alpine`
  - PostgreSQL: `postgres:16-alpine`
  - Redis: `redis:7-alpine`
  - MySQL: `mysql:8.0` reste l'image officielle la plus sûre ici
