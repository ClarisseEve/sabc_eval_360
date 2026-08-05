# Epic 3: Regles & Modeles d'Evaluation + Periodes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Epic 3 entirely — evaluation rules CRUD, eligibility engine, DR/CDTT exceptions, templates, template-role-period assignments, period management, and automated period lifecycle.

**Architecture:** NestJS 11 API (apps/api) with dual-database (MySQL via Prisma for users/roles, PostgreSQL via raw pg for evaluations/rules/templates/periods). React 19 SPA frontend (apps/web) with React Query. Stories organized in dependency waves for maximum parallelism.

**Tech Stack:** NestJS 11, Prisma 6, PostgreSQL (pg driver), React 19, React Query, Vite, Jest, class-validator

---

## Existing Code Inventory

### Backend (apps/api/src/)
| Module | Files | LOC | State |
|--------|-------|-----|-------|
| regles/ | controller, service, rule-schema, spec, dto | 691 | Read-only — no Create/Update/Delete |
| templates/ | controller, service, module, 2 dtos | 485 | Full CRUD + assignations |
| periodes/ | controller, service, spec, module, 2 dtos | 401 | Full CRUD + validations |

### Frontend (apps/web/src/pages/Admin/Evaluations/)
| Page | State |
|------|-------|
| Regles/Index.tsx | Real API (adminApi.roles.regles) |
| Regles/Create.tsx, Edit.tsx, RuleForm.tsx | Exist — need verification |
| Templates/Index.tsx | Mock data (5 hardcoded templates) |
| Templates/Create.tsx, Edit.tsx, Show.tsx | Exist — need verification |
| Periodes.tsx | Real API (periodesApi) — functional |
| Templates.tsx | Alternate mock view — may be redundant |

### Prisma Schema (MySQL)
- Role model has: `peut_auto_evaluer`, `peut_evaluer_pairs`, `peut_evaluer_subordonnes`, `peut_cross_branch`, `portee_geographique` fields
- These exist in schema but need verification they're populated and used

---

## Wave 1: Foundations (Parallel — no inter-dependencies)

### Task 1.1: Story 3.1 — Complete Rules CRUD Backend + Tests

**Files:**
- Modify: `apps/api/src/regles/regles.service.ts`
- Modify: `apps/api/src/regles/regles.controller.ts`
- Create: `apps/api/src/regles/dto/create-regle.dto.ts`
- Create: `apps/api/src/regles/dto/update-regle.dto.ts`
- Modify: `apps/api/src/regles/regles.service.spec.ts`

**Context:** The regles module currently only supports reading rules (listActives, findById) and validating criteria. Story 3.1 requires full CRUD: create rules with criteria, update, enable/disable toggle. The `rule-schema.ts` (379 lines) already handles normalization/validation — use `serializeRuleEnvelope` and `validateRuleEnvelope` from it.

- [ ] **Step 1: Create CreateRegleDto**

```typescript
// apps/api/src/regles/dto/create-regle.dto.ts
import { IsString, IsOptional, IsBoolean, IsArray, ArrayMinSize, MaxLength } from 'class-validator';

export class CreateRegleDto {
  @IsString()
  @MaxLength(150)
  nom_regle!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  role_evaluateur?: string;

  @IsOptional()
  @IsString()
  role_evalue?: string;

  @IsOptional()
  @IsString()
  type_evaluation?: string;

  @IsArray()
  @ArrayMinSize(5)
  criteres!: Array<{
    nom: string;
    description: string;
    ponderation: number;
    echelle: { min: number; max: number };
    categorie: string;
  }>;

  @IsOptional()
  @IsBoolean()
  est_active?: boolean;
}
```

- [ ] **Step 2: Create UpdateRegleDto**

```typescript
// apps/api/src/regles/dto/update-regle.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateRegleDto } from './create-regle.dto';

export class UpdateRegleDto extends PartialType(CreateRegleDto) {}
```

- [ ] **Step 3: Add create/update/toggle/delete methods to ReglesService**

Add to `regles.service.ts`:
- `create(dto: CreateRegleDto)` — validate criteres via `validateRuleEnvelope`, serialize via `serializeRuleEnvelope`, INSERT into `regles_evaluation`
- `update(id: string, dto: UpdateRegleDto)` — validate, serialize, UPDATE
- `toggleActive(id: string)` — flip `est_active` flag
- `delete(id: string)` — soft-delete by setting `est_active = false` (or hard-delete if no evaluations reference it)

- [ ] **Step 4: Add CRUD endpoints to ReglesController**

Add to `regles.controller.ts`:
- `@Post() create(@Body() dto: CreateRegleDto)`
- `@Put(':id') update(@Param('id') id, @Body() dto: UpdateRegleDto)`
- `@Post(':id/toggle') toggleActive(@Param('id') id)`
- `@Delete(':id') delete(@Param('id') id)`

Add `@UseGuards(RolesGuard)` and `@Roles('ADMIN')` decorator on mutation endpoints.

- [ ] **Step 5: Write comprehensive tests**

Expand `regles.service.spec.ts`:
- Test create with valid 5+ criteres summing to 100%
- Test create rejects < 5 criteres
- Test create rejects ponderation != 100
- Test update partial fields
- Test toggleActive flips est_active
- Test delete prevents deletion if evaluations reference the rule

- [ ] **Step 6: Run tests**

```bash
cd apps/api && pnpm test -- --testPathPattern=regles
```

- [ ] **Step 7: Verify frontend Rules pages connect to real API**

Check `apps/web/src/pages/Admin/Evaluations/Regles/Create.tsx` and `RuleForm.tsx`:
- Ensure they call `reglesApi.create()` (not mock data)
- Ensure form fields match the DTO (nom_regle, description, criteres array with ponderation/echelle/categorie)
- Fix any mock data usage to use real API calls

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/regles/ apps/web/src/pages/Admin/Evaluations/Regles/
git commit -m "feat(regles): complete CRUD for evaluation rules with criteria validation"
```

---

### Task 1.2: Story 3.6 — Polish Periods (Reminder Dates + Integration Tests)

**Files:**
- Modify: `apps/api/src/periodes/periodes.service.ts`
- Modify: `apps/api/src/periodes/periodes.service.spec.ts`
- Modify: `apps/api/src/periodes/dto/create-periode.dto.ts`

**Context:** Periods backend is ~90% done. Missing: reminder date generation (J-7, J-3, J-1), and `dates_rappels` field in create/update flow. The frontend `Periodes.tsx` already uses real API. Tests exist but need expansion.

- [ ] **Step 1: Add reminder date generation to PeriodesService**

Add method `generateDatesRappels(dateFin: Date): Date[]` that computes J-7, J-3, J-1 dates from `date_fin`. Store in `dates_rappels_json` column.

- [ ] **Step 2: Update create() to auto-generate reminder dates**

After INSERT, calculate and store `dates_rappels_json` for the new period.

- [ ] **Step 3: Add dates_rappels_json to DTO responses**

Ensure findAll/findById return reminder dates in their response.

- [ ] **Step 4: Expand tests**

Add tests for:
- Reminder date generation (J-7, J-3, J-1)
- Create stores reminder dates
- Overlap detection with exclusion
- Statistics calculation after fermer

- [ ] **Step 5: Run tests**

```bash
cd apps/api && pnpm test -- --testPathPattern=periodes
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/periodes/
git commit -m "feat(periodes): add automatic reminder date generation (J-7/J-3/J-1)"
```

---

### Task 1.3: Story 3.3 — DR/CDTT Role Exceptions Engine

**Files:**
- Modify: `apps/api/prisma/schema.prisma` (verify Role fields)
- Create: `apps/api/src/evaluations/eligibility.service.ts`
- Create: `apps/api/src/evaluations/eligibility.service.spec.ts`
- Modify: `apps/api/src/evaluations/evaluations.module.ts`

**Context:** DR and CDTT roles have special permissions: `peut_cross_branch = true`, `peut_auto_evaluer = false`, cannot evaluate peers, can evaluate all subordinates across branches in their region. The Prisma Role model already has `peut_cross_branch` and `portee_geographique` fields. This task creates the eligibility engine that will be used by Stories 3.2 and 3.3.

- [ ] **Step 1: Verify Prisma Role model has required fields**

Check `schema.prisma` for: `peut_auto_evaluer`, `peut_evaluer_pairs`, `peut_evaluer_subordonnes`, `peut_cross_branch`, `portee_geographique`. If missing, add them and run `pnpm prisma db push`.

- [ ] **Step 2: Create EligibilityService**

```typescript
// apps/api/src/evaluations/eligibility.service.ts
@Injectable()
export class EligibilityService {
  constructor(private prisma: PrismaService) {}

  async canEvaluate(evaluateurMatricule: string, evalueMatricule: string, typeEvaluation: string): Promise<{ autorise: boolean; raison?: string }>
  async getEligibleTargets(evaluateurMatricule: string): Promise<{ auto: User[]; subordonnes: User[]; pairs: User[] }>
  private async validateAutoEvaluation(evaluateur: User): Promise<boolean>
  private async validatePeerEvaluation(evaluateur: User, evalue: User): Promise<boolean>
  private async validateDownwardEvaluation(evaluateur: User, evalue: User): Promise<boolean>
  private isDrOrCdtt(role: Role): boolean
  private isUniqueRole(role: Role): boolean
}
```

Business rules:
- **Self-eval**: Only if `role.peut_auto_evaluer === true`. DR/CDTT always false.
- **Peer eval**: Same level + same region + same branch. Unique roles (DR/CDTT/RTM/SRMO) cannot evaluate peers.
- **Downward eval**: Direct `manager_matricule` link. DR/CDTT can cross branches within their region.
- **DR scope**: `portee_geographique = 'global'` — all subordinates in region across all branches
- **CDTT scope**: `portee_geographique = 'region'` — subordinates in assigned region

- [ ] **Step 3: Write comprehensive tests**

Test cases:
- DR cannot self-evaluate
- CDTT cannot self-evaluate
- DR can evaluate subordinate in different branch (same region)
- CDTT can evaluate subordinate in different branch (same region)
- Regular manager cannot evaluate cross-branch
- RTM/SRMO cannot evaluate peers (unique roles)
- Regular user CAN evaluate peers (same level/region/branch)
- Downward eval requires direct manager link (non-DR/CDTT)

- [ ] **Step 4: Register in EvaluationsModule**

Add `EligibilityService` to providers and exports in `evaluations.module.ts`.

- [ ] **Step 5: Run tests**

```bash
cd apps/api && pnpm test -- --testPathPattern=eligibility
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/evaluations/eligibility* apps/api/prisma/
git commit -m "feat(eligibility): evaluation eligibility engine with DR/CDTT cross-branch exceptions"
```

---

## Wave 2: Business Engines (Parallel — depends on Wave 1)

### Task 2.1: Story 3.2 — Eligibility Configuration Endpoints

**Files:**
- Modify: `apps/api/src/evaluations/eligibility.service.ts` (from Task 1.3)
- Create: `apps/api/src/evaluations/eligibility.controller.ts`
- Create: `apps/api/src/evaluations/dto/check-eligibility.dto.ts`
- Modify: `apps/api/src/evaluations/evaluations.module.ts`

**Context:** Story 3.2 adds API endpoints to CHECK eligibility and GET eligible targets for an evaluator. The EligibilityService from Task 1.3 provides the engine; this task exposes it via HTTP.

- [ ] **Step 1: Create CheckEligibilityDto**

```typescript
export class CheckEligibilityDto {
  @IsString() evaluateur_matricule!: string;
  @IsString() evalue_matricule!: string;
  @IsString() type_evaluation!: string; // 'auto' | 'pairs' | 'subordonnes'
}
```

- [ ] **Step 2: Create EligibilityController**

Endpoints:
- `POST /api/evaluations/check-eligibility` — check if evaluator can evaluate target
- `GET /api/evaluations/eligibles` — get all eligible targets for current user (from JWT)
- `GET /api/evaluations/eligibles/:matricule` — admin: get eligible targets for specific user

- [ ] **Step 3: Write controller tests**

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/evaluations/eligibility* apps/api/src/evaluations/dto/
git commit -m "feat(eligibility): HTTP endpoints for eligibility checking and target listing"
```

---

### Task 2.2: Story 3.4 — Complete Templates (Tests + Frontend Integration)

**Files:**
- Create: `apps/api/src/templates/templates.service.spec.ts`
- Modify: `apps/web/src/pages/Admin/Evaluations/Templates/Index.tsx`
- Verify: `apps/web/src/pages/Admin/Evaluations/Templates/Create.tsx`
- Verify: `apps/web/src/pages/Admin/Evaluations/Templates/Edit.tsx`
- Verify: `apps/web/src/pages/Admin/Evaluations/Templates/Show.tsx`

**Context:** Backend templates CRUD is complete (270 lines). Missing: unit tests and frontend-to-API integration (Index.tsx uses mock data with 5 hardcoded templates).

- [ ] **Step 1: Write templates.service.spec.ts**

Test cases:
- listTemplates returns normalized templates
- getTemplateById throws NotFoundException for missing ID
- createTemplate generates UUID and stores correctly
- updateTemplate partial updates (title only, sections only)
- publishTemplate changes status to 'published'
- unpublishTemplate changes status to 'draft'
- deleteTemplate rejects if active assignations exist
- deleteTemplate archives when no assignations

- [ ] **Step 2: Run tests**

```bash
cd apps/api && pnpm test -- --testPathPattern=templates
```

- [ ] **Step 3: Replace mock data in Templates/Index.tsx with real API**

Replace the hardcoded `mockTemplates` array with `useSuspenseQuery` calling `templatesApi.list()` (or equivalent from `api.ts`). Verify the API response shape matches the component's expectations.

- [ ] **Step 4: Verify Create/Edit/Show pages use real API**

Check each page:
- `Create.tsx` should call `templatesApi.create()` on form submit
- `Edit.tsx` should fetch template by ID then call `templatesApi.update()`
- `Show.tsx` should fetch template by ID and display sections/competences

Fix any mock data usage.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/templates/ apps/web/src/pages/Admin/Evaluations/Templates/
git commit -m "feat(templates): add tests + connect frontend to real API"
```

---

### Task 2.3: Story 3.7 — Automated Period Open/Close (Scheduled Jobs)

**Files:**
- Create: `apps/api/src/periodes/periodes-scheduler.service.ts`
- Create: `apps/api/src/periodes/periodes-scheduler.service.spec.ts`
- Modify: `apps/api/src/periodes/periodes.module.ts`
- Modify: `apps/api/src/app.module.ts` (add ScheduleModule)
- Modify: `apps/api/package.json` (add @nestjs/schedule)

**Context:** Story 3.7 requires 3 scheduled jobs: open periods (00:01), send reminders (09:00), close periods (23:59) — timezone Africa/Douala. NestJS has `@nestjs/schedule` with `@Cron()` decorator. The PeriodesService already has `ouvrir()`, `fermer()`, and `calculateStatistiques()` methods.

- [ ] **Step 1: Install @nestjs/schedule**

```bash
cd apps/api && pnpm add @nestjs/schedule
```

- [ ] **Step 2: Add ScheduleModule to AppModule**

```typescript
import { ScheduleModule } from '@nestjs/schedule';
// In imports array:
ScheduleModule.forRoot(),
```

- [ ] **Step 3: Create PeriodesSchedulerService**

```typescript
@Injectable()
export class PeriodesSchedulerService {
  constructor(
    private periodesService: PeriodesService,
    private pg: DatabasePgService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron('1 0 * * *', { timeZone: 'Africa/Douala' })
  async ouvrirPeriodes() {
    // Find periods where date_debut = today AND statut = 'planifiee'
    // Call periodesService.ouvrir() for each
    // Create notification for all active users
    // Log action
  }

  @Cron('0 9 * * *', { timeZone: 'Africa/Douala' })
  async envoyerRappels() {
    // Find open periods
    // Check dates_rappels_json for today's date
    // Find users with incomplete evaluations
    // Send reminder notifications
  }

  @Cron('59 23 * * *', { timeZone: 'Africa/Douala' })
  async fermerPeriodes() {
    // Find periods where date_fin = today AND est_ouverte = true
    // Calculate final statistics
    // Call periodesService.fermer() for each
    // Generate closure report
    // Create notification with stats
  }
}
```

- [ ] **Step 4: Write tests**

Test with mocked dependencies:
- ouvrirPeriodes opens only today's planned periods
- ouvrirPeriodes skips future periods
- envoyerRappels sends only on matching reminder dates
- fermerPeriodes closes only expired open periods
- fermerPeriodes calculates statistics before closing

- [ ] **Step 5: Run tests**

```bash
cd apps/api && pnpm test -- --testPathPattern=periodes-scheduler
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/periodes/ apps/api/src/app.module.ts apps/api/package.json apps/api/pnpm-lock.yaml
git commit -m "feat(periodes): automated period open/close/reminder scheduled jobs"
```

---

## Wave 3: Template Assignments (Depends on Wave 2)

### Task 3.1: Story 3.5 — Template-Role-Period Assignment Matrix UI

**Files:**
- Verify: `apps/api/src/templates/templates.service.ts` (assignation methods)
- Create: `apps/web/src/pages/Admin/Evaluations/Templates/Assignations.tsx`
- Create: `apps/web/src/Components/MatriceAssignations.tsx`
- Modify: `apps/web/src/Services/api.ts` (verify templatesApi has assign endpoints)

**Context:** Backend assignment logic already exists in TemplatesService (assignTemplate, getMatriceAssignations, assignBulk, deleteAssignation). Frontend needs a matrix view component showing roles x periods with template dropdowns.

- [ ] **Step 1: Verify API endpoints in api.ts**

Check that `templatesApi` in `apps/web/src/Services/api.ts` has:
- `getMatrice(idPeriode)` — calls `GET /templates/matrice/:idPeriode`
- `assign(dto)` — calls `POST /templates/assign`
- `assignBulk(dto)` — calls `POST /templates/assign-bulk`
- `deleteAssignation(idRole, idPeriode)` — calls `DELETE /templates/:idRole/:idPeriode`

Add missing methods.

- [ ] **Step 2: Create MatriceAssignations component**

```tsx
// apps/web/src/Components/MatriceAssignations.tsx
// Matrix grid: rows = roles, columns show template dropdown per role
// Props: idPeriode, templates[], roles[], assignations[]
// Each cell: dropdown to select template (or "Non assigné")
// Visual indicators: assigned (green), unassigned (yellow), period open (grey/disabled)
// Save button triggers assignBulk
```

- [ ] **Step 3: Create Assignations page**

```tsx
// apps/web/src/pages/Admin/Evaluations/Templates/Assignations.tsx
// Period selector at top
// Loads matrice data for selected period
// Renders MatriceAssignations component
// Handles save/error states
```

- [ ] **Step 4: Add route for assignations page**

Add route in the router config for `/admin/evaluations/templates/assignations`.

- [ ] **Step 5: Write backend tests for assignation logic**

Add to `templates.service.spec.ts`:
- assignTemplate creates new assignment
- assignTemplate rejects if period is open
- assignTemplate rejects if template not published
- getMatriceAssignations returns all roles with assignment status
- assignBulk processes multiple assignments
- deleteAssignation rejects if period is open

- [ ] **Step 6: Run tests**

```bash
cd apps/api && pnpm test -- --testPathPattern=templates
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/pages/Admin/Evaluations/Templates/Assignations.tsx apps/web/src/Components/MatriceAssignations.tsx apps/api/src/templates/
git commit -m "feat(templates): assignment matrix UI and backend tests for role-period assignments"
```

---

## Wave 4: Code Reviews (After all waves complete)

### Task 4.1: BMAD Code Review — All Epic 3 Stories

Run the BMAD adversarial code review workflow on all changes:
- Review each story's implementation against its spec
- Check test coverage completeness
- Verify security (guards, validation, SQL injection prevention)
- Check cross-DB join patterns (no direct SQL joins between MySQL and PG)
- Verify DTO validation covers all edge cases
- Check error handling and HTTP status codes
- Verify frontend-backend contract alignment

---

## Dependency Graph

```
Wave 1 (parallel):
  Task 1.1 (Rules CRUD) ──┐
  Task 1.2 (Periods polish)┼── Wave 2 (parallel):
  Task 1.3 (DR/CDTT engine)┘     Task 2.1 (Eligibility endpoints) ← depends on 1.3
                                  Task 2.2 (Templates tests+UI) ← independent
                                  Task 2.3 (Scheduled jobs) ← depends on 1.2
                                       │
                                       ↓
                              Wave 3: Task 3.1 (Assignment Matrix) ← depends on 2.2 + 1.2
                                       │
                                       ↓
                              Wave 4: BMAD Code Reviews
```
