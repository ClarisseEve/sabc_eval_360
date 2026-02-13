---
project_name: 'sabc_eval360'
user_name: 'Macbook'
date: 'Thu Jan 15 09:30:48 WAT 2026'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 38
optimized_for_llm: true
existing_patterns_found: 8
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- PHP ^8.2, Laravel ^12.0
- Inertia Laravel ^2.0, React ^19.0, @inertiajs/react ^2.0, Vite ^6.0
- Tailwind ^4.0, TypeScript ^5.7, pnpm 10.14
- Go 1.23.12 (services), Gin 1.9.1, ClickHouse go v2.16.0, pgx v5.5.2, redis v9.4.0
- Python pipelines: pandas >=2.2, numpy >=2.0, sqlalchemy >=2.0, clickhouse-connect >=0.7
- Auth cible: Passport (tokens) — ajouter la dépendance si absente
- Infra cible: PostgreSQL 18, ClickHouse 25.12.x, Redis 8.4.x

## Critical Implementation Rules

### Language-Specific Rules

- TypeScript strict active (`strict: true`) → pas de `any` implicite, typer les retours
- Aliases TS: `@/*` → `resources/js/*`, `ziggy-js` → `vendor/tightenco/ziggy`
- ES modules cote front (`type: module`) + Vite
- PHP : respecter PSR-4 (namespaces `App\\`, `Database\\`)
- Go : structure `internal/{handler,service,repository}` + tests co-localises `*_test.go`
- Python pipelines : scripts dans `data_pipelines/` avec SQLAlchemy, pas d’acces DB direct hors config

### Framework-Specific Rules

- Inertia : pages uniquement dans `resources/js/Pages` (pas de nouveau `pages/`)
- React : components en `PascalCase`, hooks `useX`, pas de state global hors Zustand
- TanStack Query : uniquement pour analytics/KPIs et listes lourdes, cles stables
- Tailwind : utiliser les tokens SABC (`sabc-*`) et fonts Poppins/Inter
- Laravel : routes web/api dans `routes/`, auth via Passport (cible)
- Go services : REST/JSON, OpenAPI, JWT inter‑services

### Testing Rules

- Laravel : tests dans `tests/` (Pest/Laravel), utiliser `composer test`
- Go : tests co-localises (`*_test.go`), executer `go test ./...`
- Front : tests au niveau `Features/*/__tests__` si ajoutes
- Pas de nouveaux frameworks de test sans validation

### Code Quality & Style Rules

- ESLint + Prettier obligatoires (`npm run lint`, `npm run format`)
- React Hooks rules actives (ne pas les desactiver)
- TypeScript strict : pas de `any` implicite, typer les retours
- Tailwind : utiliser les tokens SABC (`sabc-*`), pas de couleurs hardcodees
- Pages Inertia uniquement dans `resources/js/Pages`

### Development Workflow Rules

- Utiliser pnpm (pas npm/yarn) et `composer dev` pour le local
- Infra locale via `make up` ou `docker compose up -d`
- Toute nouvelle variable doit etre ajoutee a `.env.example`
- Ne jamais committer `.env` ou secrets

### Critical Don't-Miss Rules

- API JSON en `snake_case` ; UI en `camelCase` via adapters
- Appliquer RBAC + filtres region/branche sur chaque requete
- JWT obligatoire entre services (pas d'appels internes non signes)
- Analytics = donnees horaires (afficher "last updated", pas de temps reel implicite)
- Eviter `resources/js/pages` (doublon) ; utiliser `Pages/`
- Ne pas bypasser les services Go pour evaluation/analytics (utiliser les proxies)

---

## Usage Guidelines

**For AI Agents:**
- Lire ce fichier avant toute implementation
- Suivre TOUTES les regles sans exception
- Preferer l'option la plus stricte en cas de doute
- Mettre a jour ce fichier si de nouveaux patterns emergent

**For Humans:**
- Garder ce fichier concis et oriente agents
- Mettre a jour lors des changements de stack/patterns
- Revoir regulierement pour enlever les regles evidentes

Last Updated: Thu Jan 15 09:30:48 WAT 2026
