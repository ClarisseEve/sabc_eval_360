## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update tasks/lessons.md with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes -- don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests -- then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management
1. **Plan First**: Write plan to tasks/todo.md with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to tasks/todo.md
6. **Capture Lessons**: Update tasks/lessons.md after corrections

## Core Principles
- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Only touch what's necessary. No side effects with new bugs.

# SABC Eval360 – Contexte Projet & Migration NestJS

## Vue d'ensemble
Système d'évaluation 360° pour la SABC (Société Anonyme des Brasseries du Cameroun).
Migration en cours d'un monolithe Laravel + React/Inertia vers une architecture microservices NestJS avec des performances de vitesses stables et pour tous les roles et surtout l'admin. C'est une application professionnelle mais assez visuel et ergonomique respectant les valeurs ux et ui. Consulter les briefs bmad pour etre fixer sur les taches et les choses à implementer( dans _bmad-output)et .windsurf .

## Stack technique

### Monolithe actuel (Laravel)
- **Backend**: Laravel 11 (PHP 8.2) + Inertia.js
- **Frontend**: React 19 + TypeScript + Tailwind CSS + shadcn/ui
- **Auth**: Sanctum (session-based)
- **BDD Core**: MySQL (utilisateurs, branches, régions, rôles, structure org.)
- **BDD Business**: PostgreSQL (évaluations, périodes, règles, templates)
- **BDD Analytics**: ClickHouse (scores, anomalies, recommandations)
- **Cache**: Redis
- **Tests**: Pest (PHP) + Vitest (JS)

### Nouvelle architecture vers NestJS ( microservices) (`apps/api/`)
- **Runtime**: Node.js 20 + NestJS 11
- **ORM**: Prisma 6 (MySQL core) — à étendre pour PostgreSQL
- **Auth**: Passport (JWT + Local strategy) + bcrypt
- **Validation**: class-validator + class-transformer
- **Tests**: Jest + Supertest
- **Build**: TypeScript 5.9, target ES2023

### Services Go existants
- `services/evaluation/` — microservice évaluation (Go 1.23)
- `services/analytics/` — microservice analytics + ClickHouse (Go 1.23)

### Observabilité
- Prometheus + Grafana + Jaeger (tracing) + redis_exporter + ClickHouse exporter

## Architecture BDD (3 bases)

| Base       | Usage           | Tables clés                                        |
|------------|----------------|----------------------------------------------------|
| MySQL      | Core/Identité  | utilisateurs, branches, regions, roles, districts, secteurs, service_commercial, replacement_temporaire |
| PostgreSQL | Business       | evaluations, periodes_evaluation, regles_evaluation, templates, template_role_periode |
| ClickHouse | Analytics      | scores_utilisateurs, logs_anomalies, recommandations |

**Relations cross-DB**: Evaluation (PG) → Utilisateur (MySQL) via matricule — jointure côté application.

## État de la migration NestJS

### Modules NestJS existants (`apps/api/src/`)
- `auth/` — Login (JWT), guards (local + JWT), strategies — **FAIT**
- `users/` — findByEmail, findByMatricule — **FAIT**
- `prisma/` — Client Prisma global (MySQL) — **FAIT**

### Prisma schema existant (MySQL)
Modèles: `Branche`, `Region`, `Role`, `Utilisateur` (avec hiérarchie self-ref via manager_matricule)

### Modules à créer pour migration complète

| Module NestJS          | Source Laravel                                    | Priorité |
|------------------------|--------------------------------------------------|----------|
| `evaluations/`         | EvaluationService + EvaluationController + Policy | P0       |
| `periodes/`            | PeriodeEvaluationService + Controller             | P0       |
| `hierarchy/`           | HierarchyService + HierarchyController            | P1       |
| `remplacements/`       | ReplacementService + Controller                   | P1       |
| `analytics/`           | AnalyticsServiceProxy (→ Go service)              | P2       |
| `templates/`           | TemplateAssignationService + Controllers          | P2       |
| `regles/`              | RegleEvaluationValidationService + Controller     | P2       |
| `admin/`               | Admin Controllers (structure, rôles, etc.)        | P3       |
| `dashboard/`           | DashboardController (40 méthodes par rôle)        | P3       |
| `notifications/`       | Service placeholder                               | P3       |

### Endpoints API Laravel à porter (~50 routes)

**Auth** (déjà porté):
- `POST /api/auth/login` → `POST /api/auth/login`
- `GET /api/auth/me` → `GET /api/auth/me`

**Evaluations** (P0):
- `GET|POST /api/evaluations`
- `GET|PUT /api/evaluations/{id}`
- `POST /api/evaluations/{id}/submit`
- `POST /api/evaluations/{id}/validate`
- `GET /api/evaluations/periodes-actives`
- `GET /api/evaluations/eligibles`
- `GET /api/evaluations/historique`
- `GET /api/evaluations/rapport/{idPeriode}`
- `POST /api/evaluations/rappels/{idPeriode}`

**Hierarchy** (P1):
- `GET /api/hierarchy/region/{idRegion}`
- `GET /api/hierarchy/region/{idRegion}/stats`
- `GET /api/hierarchy/subordonnes`
- `GET /api/hierarchy/tous-subordonnes`
- `GET /api/hierarchy/chaine`
- `GET /api/hierarchy/managers-eligibles/{idUtilisateur}`
- `POST /api/hierarchy/verifier-supervision`
- `POST /api/hierarchy/valider-assignation`
- `POST /api/hierarchy/assigner-manager`

**Remplacements** (P1):
- `GET /api/remplacements/actifs|a-venir|historique|par-utilisateur`
- `POST /api/remplacements`
- `POST /api/remplacements/{id}/terminer`

**Analytics** (P2):
- `GET /api/analytics/dashboard|evaluations|performances`
- `GET /api/analytics/region/{idRegion}`

**Utilisateurs**:
- `GET /api/utilisateurs`
- `GET /api/utilisateurs/{utilisateur}`
- `GET /api/utilisateurs/{utilisateur}/subordonnes`
- `POST /api/utilisateurs/remplacants-disponibles`

## Conventions du projet

### Nommage
- Entités/tables en français (utilisateur, evaluation, periode_evaluation, etc.)
- Code NestJS en anglais (noms de classes, méthodes) avec entités françaises
- Frontend: pages PascalCase dans `resources/js/pages/`
- Routes Inertia: résolues depuis `resources/js/pages` (racine minuscule, sous-dossiers PascalCase)

### Patterns
- **Strangler pattern**: proxy Laravel → microservice (déjà en place pour Analytics et Evaluation Go)
- **Cross-DB joins**: côté application, jamais en SQL
- **UUID**: clés primaires pour évaluations et périodes (PostgreSQL)
- **Matricule**: clé primaire string pour utilisateurs (MySQL)

### Docker
- `docker-compose.yml` à la racine — services: core-app, mysql, postgres, clickhouse, redis, jaeger, prometheus, grafana
- NestJS app pas encore intégré dans docker-compose
- Dockerfile NestJS: `apps/api/Dockerfile` (multi-stage, node:20-alpine)

## Archives
- `archives/resources/js/` — anciens routes React Router, dashboards, formulaires, services front/back
- `archives/database/migrations/clickhouse/`
- `archives/app/Services/` — services vides

## Prochaines actions (migration NestJS)
1. **Prisma multi-datasource**: ajouter PostgreSQL au schema Prisma pour évaluations/périodes
2. **Module Evaluations**: CRUD complet + soumission + validation + policies (guards NestJS)
3. **Module Périodes**: gestion des périodes d'évaluation avec statuts automatiques
4. **Module Hierarchy**: arbre hiérarchique, subordonnés, chaîne managériale
5. **Module Remplacements**: remplacements temporaires
6. **Intégration Docker Compose**: ajouter service NestJS
7. **Tests E2E**: couvrir tous les endpoints migrés
8. **Gateway/BFF**: router le front vers NestJS au lieu de Laravel (strangler progressif)
