# API SABC Eval360

API NestJS de l'application Eval360. Elle utilise MySQL via Prisma pour le
référentiel, PostgreSQL pour les données métier et Redis pour le cache partagé.

La documentation de démarrage complète se trouve dans le
[`README` racine](../../README.md).

## Prérequis

- Node.js 20 ou 22 ;
- pnpm 10.14 ;
- MySQL 8 ;
- PostgreSQL 16 ;
- Redis 7 recommandé.

Copier puis adapter l'environnement d'exemple :

```bash
cp ../../.env.example .env
pnpm install --frozen-lockfile
pnpm db:generate
```

## Base de données

Appliquer les migrations MySQL et PostgreSQL :

```bash
pnpm db:migrate:all
```

Par sécurité, un schéma PostgreSQL existant sans table de suivi est refusé.
`PG_BASELINE_EXISTING=true` autorise ponctuellement son baselining seulement
après une comparaison exacte des colonnes, contraintes et index. Sauvegarder
la base avant cette opération et retirer le drapeau aussitôt après.

Créer les données de démonstration uniquement sur un environnement local ou de
recette :

```bash
SEED_PASSWORD='un-mot-de-passe-local' SEED_MODE=if-empty pnpm db:seed
```

Le seed refuse de fonctionner sans `SEED_PASSWORD` et reste désactivé en
production sauf autorisation explicite avec `ALLOW_DEMO_SEED=true`.

## Exécution

```bash
pnpm start:dev
```

Par défaut, l'API répond sur `http://localhost:3000/api` et son endpoint de
santé sur `http://localhost:3000/api/health`.

## Vérifications

```bash
pnpm typecheck
pnpm lint:check
pnpm audit:prod
pnpm test:ci
pnpm build
pnpm test:e2e:prepare
pnpm test:e2e
```

`lint:check` est non destructif. Les tests E2E réinitialisent leurs données :
ne jamais les pointer vers une base contenant des données à conserver.

Les remplacements temporaires sont stockés uniquement dans MySQL via Prisma ;
PostgreSQL ne constitue pas une seconde source pour ce sous-système.

## Production

- définir un `JWT_SECRET` aléatoire d'au moins 32 caractères ;
- remplacer tous les identifiants de base fournis en exemple ;
- définir `CACHE_DRIVER=redis` et une URL Redis privée ;
- conserver `RUN_SEED=false` et `ALLOW_DEMO_SEED=false` ;
- sauvegarder les bases et tester les migrations sur une copie avant chaque
  mise à niveau.

L'image Docker exécute les migrations au démarrage si `RUN_MIGRATIONS=true`.
Dans la stack multi-réplicas, seul le service ponctuel `migrate` les exécute.
