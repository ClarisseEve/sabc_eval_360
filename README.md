# SABC Eval360

Application d'évaluation 360° composée d'un frontend React, d'une API NestJS,
d'une base MySQL pour le référentiel, d'une base PostgreSQL pour le métier et
de Redis pour le cache.

## Démarrage avec Docker

Prérequis : Docker avec Compose v2.

```bash
cp .env.example .env
```

Remplacer dans `.env` toutes les valeurs `CHANGE_ME_*`. Pour `JWT_SECRET`,
générer la valeur avec `openssl rand -base64 48`.

> Le mot de passe MySQL apparaît dans `MYSQL_PASSWORD`, `DATABASE_URL` et
> `DATABASE_URL_DOCKER` : les trois doivent porter la même valeur. Les
> variantes `*_DOCKER` visent les services internes à Compose, les autres
> `localhost` pour les commandes lancées depuis votre machine.

```bash
docker compose up --build
```

Le premier démarrage applique les migrations des deux bases et crée les données
de démonstration. Les démarrages suivants les conservent.

- application : http://localhost:5173
- API : http://localhost:3000/api
- santé : http://localhost:3000/api/health

Connexion : `admin@sabc.local` (ou le matricule `A0001`) avec le mot de passe
choisi pour `SEED_PASSWORD`. Les autres comptes sont listés dans
[docs/comptes-de-test.md](docs/comptes-de-test.md).

Arrêt sans supprimer les données :

```bash
docker compose down
```

Pour reprendre le projet, suivre l'ordre de lecture de la section
[Prise en main](#prise-en-main).

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
pnpm audit:prod
pnpm lint
```

`pnpm lint` est un contrôle non destructif. La CI vérifie séparément le
frontend, l'API, leurs dépendances de production, les migrations sur des bases
neuves et les tests E2E API.

L'audit frontend ignore explicitement `GHSA-qwww-vcr4-c8h2` : l'avis ne touche
que le mode React Server Components/Actions, tandis que cette application est
une SPA `BrowserRouter` sans RSC. La dérogation doit être retirée dès qu'une
version corrigée de React Router est publiée et adoptée.

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

Les remplacements temporaires et l'état d'indisponibilité associé ont MySQL
comme source unique. PostgreSQL ne doit pas recevoir de copie synchronisée de
ces lignes.

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

## Prise en main

Ordre de lecture conseillé pour reprendre le projet.

**1. Faire tourner l'application** — la section « Démarrage avec Docker »
ci-dessus, puis se connecter avec chaque rôle via les
[comptes de test](docs/comptes-de-test.md).

**2. Comprendre le domaine** — [vue d'ensemble](docs/project-overview.md),
[architecture applicative](docs/architecture-app.md) et
[arborescence du code](docs/source-tree-analysis.md).

**3. Connaître l'état réel** — [synthèse de l'audit par
rôle](tasks/role-audit/00-SYNTHESE.md) : ce qui fonctionne, ce qui reste à
faire, priorisé. Une fiche détaillée par rôle dans le même dossier. C'est le
document le plus utile avant de toucher au code.

**4. Respecter les conventions** — [claude.md](claude.md) réunit les pièges
connus (ordre des contrôleurs NestJS, validation du SQL, agrégation en base) et
les règles de code. [tasks/lessons.md](tasks/lessons.md) complète avec les
erreurs déjà commises.

### Références

- [Contrats d'API](docs/api-contracts-app.md) — la source de vérité reste les
  contrôleurs sous `apps/api/src/**/*.controller.ts`.
- [Modèles de données](docs/data-models-app.md) et
  [modèles évaluation](docs/data-models-evaluation.md).
- [Guide de développement frontend](docs/development-guide-app.md).

### Mise en production

- La section « Production » ci-dessus liste les variables obligatoires.
- [Checklist de bascule](docs/operations/nestjs-cutover-checklist.md)
- [Déploiement multi-réplicas](docs/operations/scaled-deployment.md)
- [Plan de performance](docs/operations/performance-rollout.md)

> Avant toute mise en production, traiter le point de sécurité P1 identifié dans
> la synthèse d'audit : `GET /analytics/region/:idRegion` et son classement sont
> protégés par le seul JWT, sans contrôle de périmètre.

### Documents historiques

Conservés pour mémoire, ils décrivent des choix abandonnés (Laravel/Inertia,
microservices Go, ClickHouse, pipelines Python) et ne doivent pas guider une
implémentation : `docs/*-pipelines.md`, `docs/clickhouse-datagrip-setup.md`,
`docs/deep-dive-api-backend-bloc-*.md`, `docs/superpowers/`.
