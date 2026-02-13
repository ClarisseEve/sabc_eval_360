---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/planning-artifacts/prd.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/planning-artifacts/ux-design-specification.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/index.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/analytics/README.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/api-contracts-analytics.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/api-contracts-app.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/api-contracts-evaluation.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/architecture-analytics.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/architecture-app.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/architecture-evaluation.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/architecture-pipelines.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/component-inventory-analytics.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/component-inventory-app.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/component-inventory-evaluation.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/component-inventory-pipelines.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/data-models-analytics.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/data-models-app.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/data-models-evaluation.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/data-models-pipelines.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/deployment-guide.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/development-guide-analytics.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/development-guide-app.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/development-guide-evaluation.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/development-guide-pipelines.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/integration-architecture.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/project-overview.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/source-tree-analysis.md
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-01-15T08:28:55Z'
project_name: 'sabc_eval360'
user_name: 'Macbook'
date: 'Tue Jan 13 15:45:42 WAT 2026'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
Le PRD couvre 53 exigences fonctionnelles réparties en domaines :
- Gestion utilisateurs & accès (RBAC, profils, dashboards par rôle)
- Structure org & hiérarchie (régions/branches, cohérence manager‑subordonné)
- Règles d’évaluation (auto/pairs/descendante, exceptions)
- Workflow d’évaluation (brouillon → soumis → validé/rejeté)
- Templates & périodes (création, affectation, calendrier)
- Notifications & escalades (ouverture, rappels, validations)
- Dashboards manager/collaborateur/admin
- Analytics & décision (KPIs, anomalies, segmentation, tendances)
- Reporting & exports (PPT/Excel, graphes)
- Support & audit (corrections + traçabilité)

**Non-Functional Requirements:**
- Performance mobile (3G/4G), bundle < 300KB, API < 1s, DB < 200ms
- Sécurité & privacy : RBAC strict, chiffrement, filtrage régional
- Disponibilité ≥ 99.5%, sauvegardes régulières
- Scalabilité x3 utilisateurs
- Accessibilité WCAG AA
- Observabilité (logs admin + métriques + alerting)

**Scale & Complexity:**
- Primary domain: web app + backend services + data pipelines
- Complexity level: high (brownfield, multi‑DB, services + analytics)
- Estimated architectural components: 4 domaines principaux (app, evaluation service, analytics service, pipelines) + data stores partagés

### Technical Constraints & Dependencies

- Monorepo existant (Laravel 12 + Inertia/React 19 + Vite 6)
- Services Go (analytics & evaluation) et pipelines Python
- Multi‑DB : MySQL, PostgreSQL, ClickHouse, Redis
- Proxies d’intégration (strangler pattern) vers les services
- Infra Docker Compose et monitoring (Prometheus/Grafana/Jaeger)

### Cross-Cutting Concerns Identified

- RBAC + segmentation région/branche
- Cohérence des données multi‑DB + pipelines ETL
- Performance mobile/réseau (3G/4G)
- Observabilité transverse (logs, métriques, traces)
- Accessibilité et UX multi‑rôle cohérente

## Starter Template Evaluation

### Primary Technology Domain

Web app brownfield + services backend + data pipelines (monorepo existant)

### Starter Options Considered

1. **Conserver le monorepo existant (Laravel + Inertia/React + Go services)**
   - Déjà aligné avec multi‑DB, RBAC, proxies, pipelines
   - Permet des interactions rapides sans migration front
   - Réduit les risques d’intégration et de duplication d’auth/routing

2. **Ajouter un front Next.js séparé**
   - Commande d’init à jour : `npx create-next-app@latest`
   - Avantage : interactions très riches côté client
   - Coûts : double routing, auth séparée, orchestration API plus lourde

3. **Microservice léger en Go (pattern existant)**
   - Réutiliser la structure d’un service actuel (Gin + repo/service/handler)
   - Moins de surface de décision, cohérent avec l’existant

### Selected Starter: Monorepo existant (Laravel + Inertia/React + Go services)

**Rationale for Selection:**
- Stack déjà en place et compatible avec les exigences NFR (perf, RBAC, multi‑DB)
- Inertia/React peut fournir une UX rapide sans migration risquée
- Microservices légers possibles en répliquant les patterns Go existants

**Initialization Command:**

```bash
# Repo existant — pas d'initialisation
# (si nouveau microservice Go) copiez un service existant comme base
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- PHP 8.2 + Laravel 12 (app)
- Go 1.25.5 + Gin (services)
- Python (pipelines)

**Styling Solution:**
- Tailwind CSS (config déjà présente)
- Design system SABC (Poppins/Inter + palette rouge/orange)

**Build Tooling:**
- Vite 6 (front)
- Composer + pnpm
- Docker Compose pour infra locale

**Testing Framework:**
- PHP: `composer test` (PHPUnit)
- Go: `go test ./...`

**Code Organization:**
- Monorepo : app Laravel + services Go + pipelines Python
- Proxies d’intégration (strangler pattern)

**Development Experience:**
- Dev server Laravel + Vite
- Services Go autonomes
- Pipelines Python séparés

**Note:** L’initialisation est déjà en place ; toute nouveauté doit s’aligner sur cette base.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Separation des SoT: MySQL (core/identite), PostgreSQL (business/evaluations), ClickHouse (analytics)
- SoT des evaluations: PostgreSQL porte par le service Go Evaluation
- Sync horaire: MySQL -> PostgreSQL, PostgreSQL -> ClickHouse
- Auth tokens via Passport + RBAC via service d’autorisation dedie
- API REST/JSON + OpenAPI standardise + enveloppe d’erreur custom
- Frontend Inertia/React avec caching client (TanStack Query) et state (Zustand)
- Deploy Docker Compose (baseline)

**Important Decisions (Shape Architecture):**
- JWT signes pour communications inter-services
- Cache Redis avec TTL par heures pour KPIs/analytics
- Architecture front en feature folders pour la navigabilite
- Pagination server-side + code-splitting/lazy, virtualisation conditionnelle
- Observabilite Prometheus + Grafana + Jaeger

**Deferred Decisions (Post-MVP):**
- Migration Kubernetes (preparee, pas activee)
- gRPC si la communication REST devient limitante
- Front Next.js si Inertia ne couvre plus les besoins d’interactions

### Data Architecture

- SoT separes: MySQL (core identite), PostgreSQL (business/evaluations), ClickHouse (analytics)
- Autorite des evaluations: PostgreSQL gere par le service Go Evaluation
- Sync horaire: MySQL -> PostgreSQL, PostgreSQL -> ClickHouse
- Cache analytics: Redis, TTL par heures pour KPIs
- Dimensions analytics supportees: region, branche, role, periode, sexe, tranche d’age, anciennete (agregats anonymises si requis)
- Anonymisation: suppression des segments n < 5, arrondi scores a 1 decimale
- Versions cibles: PostgreSQL 18, ClickHouse 25.12.3.21-stable, Redis 8.4.0

### Authentication & Security

- Auth tokens via Laravel Passport (v13.4.3)
- RBAC via service d’autorisation dedie (Go/Laravel)
- Inter-services: JWT signes (cle asymetrique + rotation)
- TLS en transit + encryption at rest (pas de chiffrement applicatif de champs pour l’instant)

### API & Communication Patterns

- REST/JSON pour API publiques et internes
- OpenAPI standardise pour documentation et contrats
- Enveloppe d’erreur custom:

```json
{
  "error": {
    "code": "EVALUATION_INVALID",
    "message": "Validation echouee",
    "details": { "field": "score" },
    "request_id": "uuid"
  }
}
```

### Frontend Architecture

- Inertia/React conserve (routing Laravel)
- State management: Zustand (v5.0.10)
- Data fetching/caching: TanStack Query (v5.90.17) + Inertia
- Architecture: feature folders pour regroupement par domaine
- Perf: pagination server-side + code-splitting/lazy, virtualisation conditionnelle
- Offline/resilience: file de soumission locale (IndexedDB) pour évaluations, resubmit auto avec backoff + statut UI

### Infrastructure & Deployment

- Environnements: dev + prod
- CI/CD: GitHub Actions
- Observabilite: Prometheus + Grafana + Jaeger
- Secrets: .env + secrets CI
- Deploiement: Docker Compose (actuel), preparation pour migration K8s

### Decision Impact Analysis

**Implementation Sequence:**
1. Verrouiller auth + service RBAC + JWT inter-services
2. Stabiliser sync horaire et caches analytics
3. Standardiser les contrats REST/OpenAPI et erreurs
4. Consolider l’architecture front (folders, state, caching)
5. Durcir l’observabilite et le deploy Compose

**Cross-Component Dependencies:**
- RBAC central impacte Laravel + services Go + analytics
- Sync horaire conditionne la fraicheur des dashboards
- Caches analytics dependent des KPI ClickHouse
- Standard REST/OpenAPI conditionne clients front et services

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 6 zones ou les agents peuvent diverger (naming, structure, formats API, casing JSON, loading/error UI, pagination/caching)

### Naming Patterns

**Database Naming Conventions:**
- Tables : `plural_snake_case` (ex: `evaluations`, `periodes_evaluation`)
- Colonnes : `snake_case` (ex: `note_globale`)
- FK : `{table}_id` (ex: `user_id`, `id_periode`)
- Index : `idx_{table}_{column}`

**API Naming Conventions:**
- Endpoints REST : pluriel (`/evaluations`, `/users`)
- Params route : `{id}` (Laravel)
- Query params : `snake_case`
- Headers : `X-Request-Id`, `Authorization: Bearer <token>`

**Code Naming Conventions:**
- PHP/Laravel classes : `PascalCase`, fichiers `PascalCase.php`
- React components : `PascalCase` (`EvaluationForm.tsx`)
- Hooks : `camelCase` prefixe `use` (`useEvaluations`)
- Utils : `camelCase` (`formatters.ts`)
- Go : fichiers `snake_case.go`, fonctions exportees `PascalCase`

### Structure Patterns

**Project Organization:**
- Inertia pages : `resources/js/Pages` (eviter `resources/js/pages` en doublon)
- Features : `resources/js/Features/{Domain}/` avec sous-dossiers `components/`, `hooks/`, `api/`, `types/`
- UI partage : `resources/js/Components/*`
- Hooks globaux : `resources/js/Hooks/*`
- Services API : `resources/js/Services/{api}/*`
- Utils partagees : `resources/js/utils/*`

**Tests:**
- Laravel : `tests/`
- Go : tests co-localises (`*_test.go`)
- React : `resources/js/Features/{Domain}/__tests__/*`

### Format Patterns

**API Response Formats:**
- Success : `{ "data": ..., "meta": ... }`
- Pagination (meta) : `{ "page": 1, "per_page": 20, "total": 120 }`
- Error : enveloppe custom validee

**Data Exchange Formats:**
- JSON API : `snake_case`
- UI : `camelCase` avec adaptateurs (`userAdapter.ts`)
- Dates : ISO 8601 UTC (`2026-01-13T14:43:26Z`)

### Communication Patterns

**Inter-services:**
- REST/JSON + JWT signes
- Headers standardises : `Authorization`, `X-Request-Id`
- Logs correles via `request_id`

**State Management:**
- Zustand : un store par domaine (ex: `useEvaluationsStore`)
- TanStack Query keys : `['evaluations', 'list', params]`

### Process Patterns

**Error Handling Patterns:**
- Toast global pour erreurs systeme
- Inline errors pour formulaires/validation

**Loading State Patterns:**
- Loader global pour la page
- Loaders locaux par section (table, widget KPI)

**Retry Policy:**
- 1 retry sur erreurs reseau/5xx
- Aucun retry automatique sur 4xx

### Enforcement Guidelines

**All AI Agents MUST:**
- Respecter `snake_case` cote API et `camelCase` cote UI
- Garder les Pages Inertia dans `resources/js/Pages`
- Utiliser la pagination server-side pour les listes
- Conserver le format d’erreur valide

**Pattern Enforcement:**
- Revue rapide des diff (naming + structure)
- Rejet des chemins `resources/js/pages/*` au profit de `Pages/`

### Pattern Examples

**Good Examples:**
- Endpoint : `GET /evaluations?page=1&per_page=20`
- API JSON : `{ "data": [{ "id_evaluation": "..." }], "meta": { "page": 1 } }`
- UI : `evaluationId` en TS, issu d’un adapter
- Component : `Features/Evaluations/components/EvaluationCard.tsx`

**Anti-Patterns:**
- `/evaluation` (singulier)
- JSON API en `camelCase`
- Doublon `resources/js/pages/*`

## Project Structure & Boundaries

### Complete Project Directory Structure

```
project-root/
├── app/                         # Laravel (controllers, services, policies, models)
├── bootstrap/
├── config/
├── database/
│   ├── migrations/
│   ├── clickhouse/
│   └── seeders/
├── resources/
│   ├── css/
│   ├── js/
│   │   ├── Pages/               # Inertia pages (source de verite)
│   │   ├── Components/          # UI partagee
│   │   ├── Features/            # Feature folders (nouveau standard)
│   │   │   ├── Evaluations/
│   │   │   ├── Analytics/
│   │   │   ├── Reporting/
│   │   │   ├── Admin/
│   │   │   ├── Notifications/
│   │   │   └── Structure/
│   │   ├── Hooks/
│   │   ├── Services/{api}/       # API clients
│   │   └── utils/
│   └── views/
├── routes/
│   ├── web.php
│   ├── api.php
│   └── auth.php
├── services/
│   ├── analytics/               # Go service
│   ├── evaluation/              # Go service
│   └── authorization/           # Service RBAC (a creer)
├── data_pipelines/              # ETL analytics
│   ├── extract/
│   ├── transform/
│   ├── load/
│   └── main_pipeline.py
├── docs/
├── docker/
├── public/
├── tests/
├── docker-compose.yml
├── composer.json
├── package.json
└── README.md
```

### Architectural Boundaries

**API Boundaries:**
- Laravel app = UI + orchestration + endpoints internes
- Evaluation service = cycle d’evaluation (REST `/api/v2/evaluations`)
- Analytics service = KPIs/insights (REST)
- Authorization service = RBAC centralise + policies

**Component Boundaries:**
- Front Inertia = Pages par role + Features par domaine
- State/domaines isoles via stores Zustand + query keys TanStack

**Service Boundaries:**
- Services Go independants, REST/JSON, JWT signes
- Proxies Laravel pour integrer evaluation/analytics

**Data Boundaries:**
- MySQL core (identite/roles)
- PostgreSQL business (evaluations/regles/periodes)
- ClickHouse analytics (agregats + KPIs)
- Redis cache (TTL horaire)

### Requirements to Structure Mapping

**Feature/FR Mapping:**
- Users & Access (FR1-5) → `app/Http/Controllers/Admin/*`, `app/Models/Core/*`, `services/authorization/`, `resources/js/Features/Admin/*`
- Org Structure (FR6-10) → `app/Models/Core/*`, `resources/js/Features/Structure/*`
- Evaluation Rules/Workflow (FR11-25) → `services/evaluation/*`, `app/Services/EvaluationServiceProxy.php`, `resources/js/Features/Evaluations/*`
- Templates & Periods (FR26-30) → `app/Models/Business/*`, `resources/js/Features/Admin/Evaluations/*`
- Notifications (FR31-34) → `app/Notifications/*`, `app/Jobs/*`, `resources/js/Features/Notifications/*`
- Dashboards (FR35-39) → `resources/js/Pages/*` + `services/analytics/*`
- Analytics (FR40-45) → `services/analytics/*`, `data_pipelines/*`, `resources/js/Features/Analytics/*`
- Reporting (FR46-50) → `resources/js/Features/Reporting/*`, `services/analytics/*`, exports Laravel
- Support & Audit (FR51-53) → `app/Models/Core/*`, `app/Http/Controllers/Admin/*`

**Cross-Cutting Concerns:**
- Auth/RBAC : `services/authorization/*` + policies Laravel
- Region/branche filters : middleware Laravel + services
- Observabilite : `services/*/internal/middleware`, logs correles

### Integration Points

**Internal Communication:**
- Laravel ↔ services Go via REST + JWT
- Pipelines → ClickHouse (batch horaire)

**External Integrations:**
- A definir (actuellement none)

**Data Flow:**
- UI → Laravel → Evaluation Service → PostgreSQL
- PostgreSQL → Pipelines → ClickHouse → Analytics Service → UI

### File Organization Patterns

**Configuration Files:**
- `.env`, `config/*`, `docker/*`, `.github/workflows/*`

**Source Organization:**
- Laravel MVC + Services/Policies
- Front Inertia Pages + Features

**Test Organization:**
- Laravel `tests/`
- Go `*_test.go`
- React `Features/*/__tests__`

### Development Workflow Integration

**Development Server Structure:**
- Laravel + Vite front
- Services Go en process separes

**Build Process Structure:**
- Vite build pour assets
- Docker Compose pour infra locale

**Deployment Structure:**
- Compose en prod (actuel)
- Structure prete pour migration K8s

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
- Stack coherent (Laravel 12 + Inertia/React + Go services + Python pipelines)
- Data architecture (multi‑DB) alignee avec l’existant
- REST/JSON + OpenAPI coherent avec services Go/Laravel

**Pattern Consistency:**
- Naming/format/structure homogenes (snake_case API, camelCase UI)
- Patterns front alignes avec Inertia + TanStack Query
- RBAC centralise compatible avec JWT inter‑services

**Structure Alignment:**
- Structure monorepo supporte toutes les decisions
- Feature folders ajoutes sans casser `Pages/`

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**
- Tous les domaines FR sont mappes (users, org, eval, periods, notifications, dashboards, analytics, reporting, support)

**Non-Functional Requirements Coverage:**
- Performance (cache, pagination, multi‑DB) couverte
- Securite (RBAC, JWT, TLS) couverte
- Observabilite (Prometheus/Grafana/Jaeger) couverte
- Accessibilite (UX spec + patterns front) couverte

### Implementation Readiness Validation ✅

**Decision Completeness:**
- Decisions critiques documentees avec versions
- Patterns definis et exemples fournis

**Structure Completeness:**
- Arborescence complete + frontieres claires

**Pattern Completeness:**
- Conventions naming/format/process explicites

### Gap Analysis Results

- **Critical Gaps:** none
- **Important Gaps:** none
- **Nice-to-Have:** project-context.md pour guider les agents (optionnel)

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Contexte projet analyse
- [x] Contraintes techniques identifiees
- [x] NFRs couverts

**✅ Architectural Decisions**
- [x] Stack et versions specifiees
- [x] Data, auth, API, front, infra verrouilles

**✅ Implementation Patterns**
- [x] Naming/structure/format/process definis

**✅ Project Structure**
- [x] Structure complete definie
- [x] Mapping FRs → composants etabli

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION
**Confidence Level:** high

**Key Strengths:**
- Architecture coherente avec l’existant
- Separation claire des responsabilites (services, data, UI)
- Patterns de coherence explicites

**Areas for Future Enhancement:**
- Creer un `project-context.md` pour les agents
- Preparer gRPC si la charge inter‑services augmente

### Implementation Handoff

**AI Agent Guidelines:**
- Suivre decisions, patterns et structure du document
- Respecter conventions naming/format
- Ne pas creer de nouvelles routes/pages hors `Pages/`

**First Implementation Priority:**
- Mettre en place RBAC centralise + JWT inter‑services

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2026-01-15T08:28:55Z
**Document Location:** /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/planning-artifacts/architecture.md

### Final Architecture Deliverables

**📋 Complete Architecture Document**

- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping
- Validation confirming coherence and completeness

**🏗️ Implementation Ready Foundation**

- 5 architectural decision categories made
- 6 pattern categories defined
- 4 architectural components specified (app, services, pipelines, data)
- 53 functional requirements fully supported

**📚 AI Agent Implementation Guide**

- Technology stack with verified versions
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries
- Integration patterns and communication standards

### Implementation Handoff

**For AI Agents:**
This architecture document is your complete guide for implementing sabc_eval360. Follow all decisions, patterns, and structures exactly as documented.

**First Implementation Priority:**
Mettre en place RBAC centralise + JWT inter‑services

**Development Sequence:**

1. Initialize project using documented starter template
2. Set up development environment per architecture
3. Implement core architectural foundations
4. Build features following established patterns
5. Maintain consistency with documented rules

### Quality Assurance Checklist

**✅ Architecture Coherence**

- [x] All decisions work together without conflicts
- [x] Technology choices are compatible
- [x] Patterns support the architectural decisions
- [x] Structure aligns with all choices

**✅ Requirements Coverage**

- [x] All functional requirements are supported
- [x] All non-functional requirements are addressed
- [x] Cross-cutting concerns are handled
- [x] Integration points are defined

**✅ Implementation Readiness**

- [x] Decisions are specific and actionable
- [x] Patterns prevent agent conflicts
- [x] Structure is complete and unambiguous
- [x] Examples are provided for clarity

### Project Success Factors

**🎯 Clear Decision Framework**
Every technology choice was made collaboratively with clear rationale, ensuring all stakeholders understand the architectural direction.

**🔧 Consistency Guarantee**
Implementation patterns and rules ensure that multiple AI agents will produce compatible, consistent code that works together seamlessly.

**📋 Complete Coverage**
All project requirements are architecturally supported, with clear mapping from business needs to technical implementation.

**🏗️ Solid Foundation**
The chosen starter template and architectural patterns provide a production-ready foundation following current best practices.

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

**Next Phase:** Begin implementation using the architectural decisions and patterns documented herein.

**Document Maintenance:** Update this architecture when major technical decisions are made during implementation.
