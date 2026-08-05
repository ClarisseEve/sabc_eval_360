# Performance Rollout Plan

## Cible

- `200` utilisateurs simultanés
- `1000+` utilisateurs hors simultanéité

## Décision d'architecture

- Garder le backend en **monolithe modulaire NestJS**
- Ne pas activer de microservice analytics tant qu'une mesure de charge ne le justifie pas
- Mesurer d'abord, extraire ensuite seulement si nécessaire

## Préparation déploiement

1. Appliquer les migrations MySQL + PostgreSQL:

```bash
pnpm --dir apps/api db:migrate:all
```

2. Vérifier la santé applicative:

```bash
curl http://localhost:3000/api/health
```

3. Pour un runtime Redis local sans Docker, lancer l'API avec Redis éphémère:

```bash
PORT=3200 pnpm --dir apps/api start:prod:redis
```

Puis exécuter le préflight Redis dans un second terminal:

```bash
CACHE_DRIVER=redis \
REDIS_URL=redis://127.0.0.1:<redis-port-affiché-au-boot> \
PREFLIGHT_BASE_URL=http://localhost:3200 \
pnpm --dir apps/api preflight:cutover
```

## Scénarios de charge à exécuter

Mesurer séparément:

1. `POST /api/auth/login`
2. `GET /api/dashboard/admin`
3. `GET /api/dashboard`
4. `GET /api/admin/utilisateurs/:matricule/historique` et `GET /api/admin/evaluations/:id`
5. `POST /api/evaluations/:id/validate`

## Outil embarqué

Le repo contient un script Node sans dépendance externe. Exporter au préalable
le `SEED_PASSWORD` de l'environnement de test :

```bash
LOAD_BASE_URL=http://localhost:3000 \
LOAD_ADMIN_EMAIL=admin@sabc.local \
LOAD_ADMIN_PASSWORD="$SEED_PASSWORD" \
LOAD_USER_EMAIL=user@sabc.local \
LOAD_USER_PASSWORD="$SEED_PASSWORD" \
LOAD_TARGET_MATRICULE=U1234 \
LOAD_VALIDATION_EVALUATION_IDS=<evaluation-id-1>,<evaluation-id-2>,<evaluation-id-3> \
LOAD_ITERATIONS=100 \
LOAD_CONCURRENCY=20 \
pnpm --dir apps/api load:test
```

Variables optionnelles:

- `LOAD_USER_EMAIL`, `LOAD_USER_PASSWORD` pour mesurer un vrai dashboard rôle
- `LOAD_TARGET_MATRICULE` pour la recherche individuelle admin
- `LOAD_VALIDATION_EVALUATION_IDS` pour le scénario de validation, idéalement une liste d'évaluations déjà soumises

## Seuils décisionnels

Avant toute complexification d'architecture:

- `p95` login < `500 ms`
- `p95` dashboard rôle < `800 ms`
- `p95` dashboard admin < `1500 ms`
- `p95` recherche individuelle admin < `1500 ms`
- `p95` validation d'évaluation < `600 ms`
- taux d'erreur < `1%`

## Ordre de montée en charge

1. Optimiser requêtes / cache si nécessaire
2. Ajouter `2` replicas API si le CPU ou la latence le justifient
3. Redis est désormais la couche de cache partagée retenue pour les dashboards et analytics
4. Évaluer Fastify seulement si le goulot est l'overhead HTTP Node/Nest
5. Évaluer un service analytics séparé seulement si les traitements analytics deviennent le goulot dominant

## Notes

- Le cache applicatif utilise Redis quand `CACHE_DRIVER=redis`
- En local sans Redis, le service retombe en mémoire si `CACHE_DRIVER=auto`
- Les microservices ne sont pas le point de départ; ils deviennent une option après mesures
