# Trace des sessions – SABC Eval360 Migration NestJS

> Ce fichier garde l'historique des modifications session par session.
> Mis à jour à chaque fin de session ou changement significatif.

---

## Session 2026-03-23 – Initialisation contexte migration NestJS

### Objectif
Reprise de la migration Laravel → NestJS. Mise en place du suivi (CLAUDE.md + trace.md).

### État constaté

#### Monolithe Laravel (existant, fonctionnel)
- 15+ controllers (Auth, API, Admin, Dashboard, Evaluation, Settings)
- 20+ modèles (3 bases: MySQL core, PostgreSQL business, ClickHouse analytics)
- 6 services actifs: Evaluation, Hierarchy, Replacement, PeriodeEvaluation, Analytics (proxy), Template
- ~50 routes API + ~30 routes web Inertia
- Tests Pest (PHP) + Vitest (JS) en place

#### NestJS (`apps/api/`) – déjà bootstrappé
- **Auth module**: login JWT + guards (local, JWT) + strategies ✅
- **Users module**: findByEmail, findByMatricule ✅
- **Prisma module**: client global MySQL ✅
- **Prisma schema**: Branche, Region, Role, Utilisateur (hiérarchie self-ref) ✅
- **Docker**: Dockerfile multi-stage (node:20-alpine) ✅
- **Tests**: E2E basique (GET /) ✅
- **Non intégré** dans docker-compose.yml ❌

#### Services Go (existants)
- `services/evaluation/` — microservice évaluation (Go 1.23)
- `services/analytics/` — microservice analytics + ClickHouse (Go 1.23)

### Actions réalisées
- [x] Exploration complète du codebase (Laravel + NestJS + Go + Docker)
- [x] Création du `CLAUDE.md` restructuré avec contexte complet migration
- [x] Création du `trace.md` (ce fichier)

### Prochaines étapes identifiées
1. Prisma multi-datasource (ajouter PostgreSQL)
2. Module Evaluations NestJS (CRUD + submit + validate)
3. Module Périodes NestJS
4. Module Hierarchy NestJS
5. Module Remplacements NestJS
6. Intégration docker-compose
7. Tests E2E complets
8. Gateway/BFF pour strangler progressif

### Fichiers modifiés
- `CLAUDE.md` — restructuré (contexte migration NestJS complet)
- `trace.md` — créé (ce fichier)

---

## Session 2026-03-23 (suite) – Implémentation P0 + P1 + P2

### Objectif
Implémenter tous les modules NestJS de P0 à P2 avec tests unitaires.

### Modules créés

#### P0 – Core Business
- **DatabasePgModule** (`src/database/`) — Service PostgreSQL via `pg` (node-postgres) ✅
  - Pool de connexions, query/queryOne/execute
- **EvaluationsModule** (`src/evaluations/`) — 40+ routes portées ✅
  - CRUD, submit, validate, getEnAttente, getAValider, getHistorique
  - Calcul de scores (auto/pairs/manager), détermination type évaluation
  - DTOs: CreateEvaluationDto, UpdateEvaluationDto, ValidateEvaluationDto
  - **9 tests** unitaires (findById, updateNotes, submit, getEnAttente, getAValider)
- **PeriodesModule** (`src/periodes/`) ✅
  - CRUD, ouvrir/fermer, statistiques, validation dates/chevauchement
  - DTOs: CreatePeriodeDto, UpdatePeriodeDto
  - **9 tests** unitaires (findById, create validations, ouvrir/fermer, delete)

#### P1 – Structure & Remplacements
- **HierarchyModule** (`src/hierarchy/`) ✅
  - Hiérarchie région (5 niveaux tanière / 3 niveaux non-tanière)
  - Subordonnés directs/indirects, chaîne hiérarchique
  - Supervision validation, cycle detection, manager assignment
  - **10 tests** unitaires (région, subordonnés, peutSuperviser, stats)
- **RemplacementsModule** (`src/remplacements/`) ✅
  - CRUD, terminer, actifs/à-venir/historique/par-utilisateur
  - Min 30 jours, vérification doublon, statut titulaire/remplaçant
  - DTO: CreateRemplacementDto

#### P2 – Analytics, Templates, Règles
- **AnalyticsModule** (`src/analytics/`) ✅
  - Dashboard, evaluations stats, performances, region analytics
  - Strangler pattern: proxy Go microservice + fallback PostgreSQL
  - **4 tests** unitaires (dashboard fallback, stats, performances, region)
- **TemplatesModule** (`src/templates/`) ✅
  - Assignation template/rôle/période, matrice, bulk assign
  - Validation: période modifiable, template publié
  - DTOs: AssignTemplateDto, BulkAssignDto
- **ReglesModule** (`src/regles/`) ✅
  - Validation critères (min 5, pondérations 100%, échelle 1-5, 8 catégories)
  - **8 tests** unitaires (validateCriteres, getConstraints, getCategories)

### Résultats des tests
```
Test Suites: 5 passed, 5 total
Tests:       40 passed, 40 total
```

### Dépendances ajoutées
- `pg` (8.20.0) — PostgreSQL client
- `uuid` (13.0.0) — installé mais remplacé par `crypto.randomUUID()` natif (uuid v13 ESM-only)

### AppModule mis à jour
Tous les 11 modules intégrés dans `src/app.module.ts`.

### Fichiers créés (27 fichiers)
- `src/database/database-pg.service.ts`, `database-pg.module.ts`
- `src/evaluations/` (module, controller, service, 3 DTOs, spec)
- `src/periodes/` (module, controller, service, 2 DTOs, spec)
- `src/hierarchy/` (module, controller, service, spec)
- `src/remplacements/` (module, controller, service, 1 DTO)
- `src/analytics/` (module, controller, service, spec)
- `src/templates/` (module, controller, service, 1 DTO)
- `src/regles/` (module, controller, service, 1 DTO, spec)

### Prochaines étapes
1. Intégration docker-compose (service NestJS)
2. Tests E2E complets
3. Gateway/BFF pour strangler progressif
4. P3: Admin, Dashboard, Notifications

---

## Session 2026-03-24 – P3 + Docker Compose + Push dev

### Objectif
Compléter P3 (Admin, Dashboard, Notifications), intégrer NestJS dans docker-compose, pousser vers `dev`.

### Actions réalisées

#### Docker Compose – NestJS API intégré
- Service `nestjs-api` ajouté dans `docker-compose.yml`
  - Build depuis `apps/api/Dockerfile`, port 3000
  - Env vars: DATABASE_URL (MySQL/Prisma), PG_* (PostgreSQL), JWT_SECRET, ANALYTICS_*
  - depends_on: mysql + postgres (service_healthy)
  - Traefik labels: route `/api/v3/*` vers NestJS (strangler progressif)
  - Healthcheck: `wget --spider http://localhost:3000/api`
- Architecture ASCII mise à jour pour inclure NestJS API
- Gateway depends_on: ajouté `nestjs-api`

#### P3 – Dashboard Module (`src/dashboard/`)
- `DashboardService`: getStats(), getAdminStats(), getRoleTitle(), getValidRoles()
  - Stats: évaluations en attente/total, score personnel, période active
  - Admin stats étendus: total users, actifs, évaluations, taux completion, remplacements
  - 11 rôles avec titres français
- `DashboardController`: GET /dashboard, GET /dashboard/stats, GET /dashboard/admin
- **6 tests** unitaires (getStats, null score, getAdminStats, getRoleTitle, getValidRoles)

#### P3 – Admin Module (`src/admin/`)
- **AdminStructureService**: CRUD régions, branches, overview org
  - Vérification dépendances avant suppression
- **AdminRolesService**: CRUD rôles (MySQL), CRUD règles évaluation (PostgreSQL)
  - Toggle actif/inactif pour règles
  - Vérification dépendances utilisateurs avant suppression rôle
- **AdminUsersService**: CRUD utilisateurs, stats évaluation cross-DB
  - Création avec hash bcrypt, validation matricule/email unique
  - Subordonnés, remplaçants disponibles
- 3 controllers: AdminStructureController, AdminRolesController, AdminUsersController
- **5 tests** unitaires (getRoles, deleteRole rejection/success, toggleRegle, rule not found)

#### P3 – Notifications Module (`src/notifications/`) — Global
- `NotificationsService`: CRUD notifications (MySQL `notifications_utilisateurs`)
  - create(), getForUser(), countNonLues(), marquerCommeLue(), marquerToutesLues()
  - Helpers: notifierNouvelleEvaluation(), notifierValidationEvaluation(), notifierRappelEvaluation()
- `NotificationsController`: GET /notifications, GET /notifications/count, POST /:id/lire, POST /lire-tout
- **5 tests** unitaires (create, countNonLues, marquerCommeLue, notifierNouvelleEvaluation, rappel)

### Résultats des tests
```
Test Suites: 9 passed, 9 total
Tests:       58 passed, 58 total
```

### AppModule mis à jour
14 modules au total: Prisma, DatabasePg, Auth, Users, Evaluations, Periodes, Hierarchy,
Remplacements, Analytics, Templates, Regles, Dashboard, Admin, Notifications.

### Fichiers créés (15 fichiers)
- `src/dashboard/` (module, controller, service, spec)
- `src/admin/` (module, 3 controllers, 3 services, spec)
- `src/notifications/` (module, controller, service, spec)

### Docker Compose modifié
- `docker-compose.yml` — ajout service nestjs-api + architecture diagram + gateway depends_on

### Prochaines étapes
1. Tests E2E complets pour tous les endpoints
2. Gateway/BFF routing (Traefik strip prefix pour /api/v3 → /api)
3. CI/CD pipeline NestJS
4. Migration progressive du frontend (Inertia → API calls)

---
