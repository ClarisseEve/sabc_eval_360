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

## Pièges connus (à lire avant toute modification)

- **`git add` avec chemins explicites, jamais `-A` ni `.`** — des sessions travaillent en parallèle sur ce dépôt; `-A` absorbe leur travail en cours et casse la CI. Vérifier `git diff --cached --stat` avant chaque commit.
- **Ordre des contrôleurs NestJS** — dans un `@Module`, déclarer les contrôleurs à chemins littéraux AVANT celui qui porte `@Get(':id')` sur le même préfixe, sinon `:id` capture les chemins littéraux (a mis `/evaluations/recues` et `/donnees` en 404).
- **Tout nouveau SQL doit être exécuté contre un vrai PostgreSQL** avant commit — les tests unitaires mockent `pg` et ne valident pas la syntaxe. Méthode: schéma jetable + fixtures, puis `DROP SCHEMA`.
- **`pnpm --dir apps/web ...` se lance depuis la racine** — le chemin est relatif au cwd.
- **Ne jamais lancer `SEED_MODE=reset`** sur la base locale de l'utilisateur sans accord explicite.
- **Utilisateurs**: les routes vivent sous `/api/admin/utilisateurs` (réservé ADMIN) — il n'existe aucun `@Controller('utilisateurs')` racine.

## Conventions de code

- **Analytique: agréger en SQL**, jamais en mémoire. Exploser les notes via `jsonb_array_elements(notations_json)` + `GROUP BY`; une équipe entière = une seule requête.
- **Une absence de mesure vaut `null`, jamais `0`** — sur l'échelle 1-5, un zéro se lit comme une contre-performance.
- **Anti-IDOR**: tout endpoint prenant un matricule appelle `assertCanViewMatricule(s)`.
- **Visibilité**: filtrer avec `ruleVisibilitySql(audience)` / `EVALUATED_VISIBILITY_SQL`.
- **Frontend**: extraire la logique pure dans `*-data.ts` testé avec vitest (pas de testing-library ici); le composant ne fait que le rendu.

## Commandes

- `cp .env.example .env` puis `docker compose up --build` — lancement complet (migrations + seed automatiques).
- `pnpm install:all` — 3 lockfiles indépendants, pas de workspace pnpm.
- `pnpm verify:static` (typecheck + prisma validate + build + tests) et `pnpm verify:compose`.
- Ports hôte paramétrables pour éviter les conflits: `MYSQL_PORT`, `PG_PORT_HOST`, `REDIS_PORT`, `WEB_PORT`, `API_PORT`.
- `JWT_SECRET`, `SEED_PASSWORD`, `PG_PASSWORD`, `MYSQL_*` n'ont pas de valeur par défaut: compose refuse de démarrer sans `.env`.

# SABC Eval360 – Contexte Projet & Migration NestJS

## Vue d'ensemble
Système d'évaluation 360° pour la SABC (Société Anonyme des Brasseries du Cameroun).
L’architecture active est désormais un couple React SPA + NestJS API. Les anciens artefacts Laravel/Inertia et services Go ne sont plus la source de vérité et ne doivent plus orienter les décisions d’implémentation.

## Architecture BDD (3 bases)

| Base       | Usage           | Tables clés                                        |
|------------|----------------|----------------------------------------------------|
| MySQL      | Core/Identité  | utilisateurs, branches, regions, roles, districts, secteurs, service_commercial, replacement_temporaire |
| PostgreSQL | Business + Analytics | evaluations, periodes_evaluation, regles_evaluation, templates, template_role_periode, scores_utilisateurs, logs_anomalies, recommandations_admin, rapports |

ClickHouse est vestigial: aucun code, aucun service dans les composes. Toute l'analytique est en PostgreSQL.

**Relations cross-DB**: Evaluation (PG) → Utilisateur (MySQL) via matricule — jointure côté application.

## État du projet

### Modules NestJS (tous implémentés)
`auth`, `users`, `prisma`, `evaluations` (+ `eligibility`, `contre-evaluation`,
`consultation`), `periodes`, `hierarchy`, `remplacements`, `analytics`,
`templates`, `regles`, `admin`, `dashboard`, `notifications`, `reports`,
`health`, `common` (cache, guards, filtres).

### Prisma schema existant (MySQL)
Modèles: `Branche`, `Region`, `Role`, `Utilisateur` (avec hiérarchie self-ref via manager_matricule)

### Endpoints API principaux

**Auth** (déjà porté):
- `POST /api/auth/login` → `POST /api/auth/login`
- `GET /api/auth/me` → `GET /api/auth/me`

**Evaluations**:
- `GET|POST /api/evaluations`
- `GET|PUT /api/evaluations/{id}`
- `POST /api/evaluations/{id}/submit`
- `POST /api/evaluations/{id}/validate`
- `GET /api/evaluations/periodes-actives`
- `GET /api/evaluations/eligibles`
- `GET /api/evaluations/historique`
- `GET /api/evaluations/rapport/{idPeriode}`
- `POST /api/evaluations/rappels/{idPeriode}`

**Hierarchy**:
- `GET /api/hierarchy/region/{idRegion}`
- `GET /api/hierarchy/region/{idRegion}/stats`
- `GET /api/hierarchy/subordonnes`
- `GET /api/hierarchy/tous-subordonnes`
- `GET /api/hierarchy/chaine`
- `GET /api/hierarchy/managers-eligibles/{idUtilisateur}`
- `POST /api/hierarchy/verifier-supervision`
- `POST /api/hierarchy/valider-assignation`
- `POST /api/hierarchy/assigner-manager`

**Remplacements**:
- `GET /api/remplacements/actifs|a-venir|historique|par-utilisateur`
- `POST /api/remplacements`
- `POST /api/remplacements/{id}/terminer`

**Analytics**:
- `GET /api/analytics/dashboard|evaluations|performances`
- `GET /api/analytics/region/{idRegion}`
- `GET /api/analytics/benchmarks/{matricule}` — sujet vs région vs top performers
- `GET /api/analytics/evolution/{matricule}` — progression par critère et période
- `POST /api/analytics/team-heatmap` — matrice équipe × critères (1 requête)

**Utilisateurs** — sous `/api/admin/utilisateurs` (réservé ADMIN). Il n'existe
aucun `@Controller('utilisateurs')` racine.

## Conventions du projet

### Nommage
- Entités/tables en français (utilisateur, evaluation, periode_evaluation, etc.)
- Code NestJS en anglais (noms de classes, méthodes) avec entités françaises
- Frontend: code SPA dans `apps/web/src/`

### Patterns
- **Cross-DB joins**: côté application, jamais en SQL
- **UUID**: clés primaires pour évaluations et périodes (PostgreSQL)
- **Matricule**: clé primaire string pour utilisateurs (MySQL)

### Docker
- `docker-compose.yml` à la racine — services: `frontend`, `api`, `mysql`, `postgres`, `redis`
- L'entrypoint de l'API applique les migrations puis seed au premier démarrage
- Dockerfile API: `apps/api/Dockerfile`
- Dockerfile frontend: `apps/web/Dockerfile`

## État de la CI

7 jobs: `Frontend checks`, `Backend checks`, `API integration tests` (MySQL +
PostgreSQL + Redis réels, migrations puis seed), `Browser end-to-end tests`
(Playwright), `Docker build (api)`, `Docker build (web)`, `Secret scan`.
Migrations, seed et builds d'images sont donc couverts par la CI.

## Chantiers restants

1. **Audit fonctionnel rôle par rôle** — vérifier que chaque rôle dispose de
   toutes ses actions métier. À mener par lots de 3-4 rôles: les agents lancés
   sur les 11 rôles d'un coup ont échoué sur timeout.
2. **Tableaux de bord par rôle** — les 10 dashboards partagent trois variantes
   (director / manager / individual). La différenciation métier promise reste
   partielle.
3. **Code mort** — `Components/Analytics/*` (orphelin, avec `MOCK_ANALYTICS_DATA`),
   `pages/_legacy/`, plusieurs composants jamais montés.
4. **`data_pipelines/`** — 12 fichiers Python vides, non câblés. À supprimer ou
   documenter comme non implémenté.
