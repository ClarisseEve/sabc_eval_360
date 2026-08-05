# SABC Eval360

Application d'évaluation 360° composée d'un frontend React, d'une API NestJS,
d'une base MySQL pour le référentiel, d'une base PostgreSQL pour le métier et
de Redis pour le cache.

## Démarrage le plus simple avec Docker

Prérequis : Docker avec Compose v2.

```bash
cp .env.example .env
openssl rand -base64 48
```

Reporter la valeur générée dans `JWT_SECRET`, choisir un `SEED_PASSWORD`,
puis lancer :

```bash
docker compose up --build
```

`DATABASE_URL` et `REDIS_URL` servent aux commandes lancées depuis l'hôte ;
Compose utilise leurs variantes `DATABASE_URL_DOCKER` et
`REDIS_URL_DOCKER`, qui ciblent les noms de services internes. Si un mot de
passe de base contient des caractères réservés dans une URL, l'encoder dans le
DSN Docker.

La première exécution applique les migrations des deux bases et crée les
données de démonstration si la base est vide. Les exécutions suivantes les
conservent grâce à `SEED_MODE=if-empty`.

- application : http://localhost:5173
- API : http://localhost:3000/api
- santé : http://localhost:3000/api/health
- compte administrateur local : `admin@sabc.local`
- mot de passe : la valeur choisie pour `SEED_PASSWORD`

Arrêt sans supprimer les données :

```bash
docker compose down
```

## Développement local

Prérequis : Node.js 20 ou 22, pnpm 10.14, MySQL 8, PostgreSQL 16 et, de
préférence, Redis 7.

Le dépôt possède trois lockfiles indépendants. La commande racine installe les
trois ensembles de dépendances :

```bash
pnpm install:all
cp .env.example apps/api/.env
docker compose up -d mysql postgres redis
pnpm --dir apps/api db:migrate:all
SEED_MODE=if-empty pnpm --dir apps/api db:seed
pnpm dev
```

Le proxy Vite transmet `/api` à l'API locale sur le port 3000. Pour ne lancer
qu'un composant :

```bash
pnpm dev:web
pnpm dev:api
```

## Vérifications

```bash
pnpm verify:static
pnpm verify:compose
```

Commandes ciblées :

```bash
pnpm typecheck
pnpm build
pnpm test:api
pnpm --dir apps/api test:e2e
pnpm lint
```

`pnpm lint` est un contrôle non destructif. La CI vérifie séparément le
frontend, l'API, les migrations sur des bases neuves et les tests E2E API.

## Migrations et données

La commande canonique est :

```bash
pnpm --dir apps/api db:migrate:all
```

Elle applique d'abord les migrations Prisma/MySQL, puis les migrations SQL
PostgreSQL. Une migration déjà publiée ne doit jamais être réécrite : ajouter
une nouvelle migration corrective. Avant toute mise à niveau de production,
faire une sauvegarde et tester la migration sur une copie représentative.

Un schéma PostgreSQL existant sans historique de migrations est refusé par
défaut. Après sauvegarde et uniquement si sa structure correspond exactement à
la structure canonique, autoriser une fois son baselining avec
`PG_BASELINE_EXISTING=true`, puis retirer immédiatement cette variable. Un
écart de colonnes, contraintes ou index impose une migration manuelle : le
script ne devine ni ne transforme les données historiques.

Le seed exige explicitement `SEED_PASSWORD`. Il est prévu pour les
environnements locaux ou de recette ; en production, conserver :

```dotenv
RUN_SEED=false
ALLOW_DEMO_SEED=false
```

## Production

Au minimum :

- définir `NODE_ENV=production` ;
- générer un `JWT_SECRET` aléatoire d'au moins 32 caractères ;
- remplacer tous les identifiants de base de données d'exemple ;
- définir précisément `FRONTEND_URL` ;
- utiliser `CACHE_DRIVER=redis` et un `REDIS_URL` privé ;
- laisser `RUN_SEED=false`.

L'API refuse de démarrer en production si les variables critiques sont
absentes ou si les secrets JWT/MySQL/PostgreSQL correspondent aux valeurs
d'exemple.

La variante à deux instances API est disponible avec :

```bash
docker compose -f docker-compose.scale.yml up --build -d
```

Cette stack exécute les migrations une seule fois dans le service `migrate`,
puis démarre les deux réplicas derrière Nginx.

## Documentation d'exploitation

- [Checklist de bascule](docs/operations/nestjs-cutover-checklist.md)
- [Déploiement multi-réplicas](docs/operations/scaled-deployment.md)
- [Plan de performance](docs/operations/performance-rollout.md)
