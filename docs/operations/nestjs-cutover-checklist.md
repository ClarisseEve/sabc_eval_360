# NestJS Cutover Checklist

## Objectif

Basculement complet de l'application active vers:

- frontend React SPA `apps/web`
- backend NestJS `apps/api`
- MySQL `core`
- PostgreSQL `business`
- Redis pour le cache partagé

Le runtime Laravel/PHP ne fait plus partie de la cible.

## Pré-cutover

1. Geler les changements structurels de schéma.
2. Vérifier que les secrets et variables d'environnement sont présents:
   - `DATABASE_URL`
   - `PG_HOST`, `PG_PORT`, `PG_DATABASE`, `PG_USER`, `PG_PASSWORD`
   - `JWT_SECRET`
   - `CACHE_DRIVER=redis`
   - `REDIS_URL`
3. Appliquer les migrations:
   ```bash
   pnpm --dir apps/api db:migrate:all
   ```
4. Exécuter le préflight:
   ```bash
   pnpm --dir apps/api preflight:cutover
   ```
5. Valider les builds:
   ```bash
   pnpm --dir apps/api build
   pnpm --dir apps/api test
   pnpm --dir apps/web typecheck
   pnpm --dir apps/web build
   ```
6. Vérifier la config Docker:
   ```bash
   docker compose -f docker-compose.yml config
   docker compose -f docker-compose.scale.yml config
   ```

## Cutover

1. Déployer les nouvelles images.
2. Démarrer la stack avec Redis:
   ```bash
   docker compose up --build -d
   ```
3. Vérifier la santé:
   ```bash
   curl http://localhost:3000/api/health
   ```
4. Confirmer:
   - `status = healthy`
   - `checks.mysql = ok`
   - `checks.postgres = ok`
   - `checks.cache = ok`
   - `cache_driver = redis`

## Smoke Tests

1. Authentification admin.
2. Dashboard rôle.
3. Dashboard admin.
4. Recherche individuelle admin.
5. Création d'évaluation.
6. Soumission d'évaluation.
7. Validation manager.
8. Page `/axes-amelioration`.
9. Notifications.

## Charge minimale avant ouverture

Exporter au préalable le même `SEED_PASSWORD` que celui utilisé pour préparer
l'environnement de test, puis exécuter :

```bash
LOAD_BASE_URL=http://localhost:3000 \
LOAD_ADMIN_EMAIL=admin@sabc.local \
LOAD_ADMIN_PASSWORD="$SEED_PASSWORD" \
LOAD_USER_EMAIL=cds.littoral@sabc.local \
LOAD_USER_PASSWORD="$SEED_PASSWORD" \
LOAD_TARGET_MATRICULE=C0001 \
LOAD_VALIDATION_CYCLE_ID=4 \
LOAD_ITERATIONS=200 \
LOAD_CONCURRENCY=50 \
LOAD_LOGIN_ITERATIONS=4 \
LOAD_LOGIN_CONCURRENCY=2 \
pnpm --dir apps/api load:test
```

Seuils cibles:

- `error_rate = 0%`
- `p95 admin-dashboard < 500ms`
- `p95 role-dashboard < 300ms`
- `p95 admin-individual-search < 300ms`
- `p95 evaluation-validation-cycle < 800ms`

## Go / No-Go

Go si:

- préflight vert
- health vert avec `cache_driver=redis`
- smoke tests verts
- charge acceptable
- `RUN_SEED=false` et `ALLOW_DEMO_SEED=false` sur la stack de production

No-Go si:

- migrations incomplètes
- fallback mémoire actif en production alors que plusieurs replicas sont prévus
- erreurs de validation ou de dashboard
- taux d'erreur non nul sous charge

## Rollback

1. Rebasculer le trafic vers la version précédente.
2. Conserver MySQL/PostgreSQL intacts.
3. Ne pas rollback les migrations business si le schéma reste backward-compatible.
4. Désactiver uniquement la nouvelle stack applicative.
5. Ouvrir un postmortem avec:
   - logs API
   - métriques de latence
   - point exact d'échec

## Post-cutover

1. Surveiller:
   - CPU et mémoire API
   - connexions MySQL/PostgreSQL
   - Redis `PING`, mémoire, évictions
2. Purger les reliquats Laravel/PHP encore seulement documentaires ou archivés.
3. Refaire une campagne de charge une fois la production stabilisée.
