# Session Prompt — Epic 8 : Reporting & Exports

> Copier-coller entier au démarrage d'une nouvelle session Claude Code dans `/Users/macbook/Documents/SABC/sabc_eval360`

---

## Mission

Implémenter l'**Epic 8** complet (4 stories) du projet SABC Eval360 en mode Subagent-Driven Development.

| Story | Titre | Vague |
|-------|-------|-------|
| 8.1-backend | Module NestJS `reports/` — DB + CRUD + section management | Vague 1 |
| 8.2+8.3 | Export PPTX + Export XLSX (même `ExportService`) | Vague 2 |
| 8.1-frontend | Report Builder UI — drag & drop, preview | Vague 2 |
| 8.4 | Export Graphes Individuels (PNG / SVG / PDF) | Vague 2 |

**Critères de succès :**
- `cd apps/api && npx tsc --noEmit` → 0 erreur TypeScript
- `cd apps/api && node_modules/.bin/jest` → tous les tests passent
- `cd apps/web && npx tsc --noEmit` → 0 erreur TypeScript
- 4 commits distincts (un par story)
- Backend story 8.1 + story 8.2/8.3 ont chacun ≥5 tests Jest

---

## Contexte projet

**Stack active :** NestJS 11 + Prisma 6 (MySQL) + PostgreSQL (raw pg) + React 19 + TypeScript strict  
**Répertoire API :** `apps/api/src/`  
**Répertoire Web :** `apps/web/src/`  
**Tests :** Jest, fichiers `*.spec.ts` colocalisés  
**React Query :** TanStack Query v5 (`@tanstack/react-query`)  
**Charts :** Recharts déjà installé  
**Package manager :** pnpm (obligatoire, jamais npm)

**Pattern service NestJS (à imiter depuis `analytics.service.ts`) :**
```typescript
@Injectable()
export class ReportsService implements OnModuleInit {
  constructor(
    private pg: DatabasePgService,    // PostgreSQL — toujours pour données business
    private prisma: PrismaService,    // MySQL — toujours pour utilisateurs
  ) {}

  async onModuleInit() { await this.initTables(); }

  private async initTables(): Promise<void> {
    await this.pg.query(`CREATE TABLE IF NOT EXISTS rapports (...)`);
    await this.pg.query(`CREATE INDEX IF NOT EXISTS idx_rapports_createur ON rapports(createur_matricule)`);
  }
}
```

**Pattern controller (à imiter depuis `analytics.controller.ts`) :**
```typescript
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class ReportsController {
  constructor(private reportsService: ReportsService) {}
}
```

**Pattern spec (sans NestJS DI) :**
```typescript
describe('ReportsService', () => {
  let service: ReportsService;
  let mockPg: { query: jest.Mock; queryOne: jest.Mock };

  beforeEach(() => {
    mockPg = { query: jest.fn(), queryOne: jest.fn() };
    service = new ReportsService(mockPg as any, {} as any);
  });

  it('should create rapport', async () => {
    mockPg.query.mockResolvedValue([]);
    mockPg.queryOne.mockResolvedValue({ id_rapport: 'uuid-1', titre: 'Test', sections_json: [] });
    const result = await service.createRapport('Test', 'MAT001');
    expect(result.titre).toBe('Test');
  });
});
```

---

## État actuel (NE PAS réimplémenter)

### Backend déjà commité

| Fichier | Ce qui existe |
|---------|---------------|
| `analytics/analytics.service.ts` | KPIs, anomalies, recommandations, tendances — COMPLET |
| `analytics/analytics.controller.ts` | Tous les endpoints analytics — **NE PAS modifier** |
| `common/services/audit-log.service.ts` | `log(entry)` MySQL — disponible via `CommonModule` |
| `notifications/notifications.service.ts` | `create()`, `getForUser()` — **NE PAS modifier** |
| `database/database-pg.service.ts` | `query<T>()`, `queryOne<T>()` pour PostgreSQL |

### Frontend déjà commité

| Fichier | Ce qui existe |
|---------|---------------|
| `pages/Admin/Dashboard/index.tsx` | Dashboard admin 6 tabs analytics — **NE PAS modifier** |
| `Components/Dashboard/Admin/Tabs/TendancesTab.tsx` | `<ResponsiveContainer>` + `<ComposedChart>` + filtres |
| `Hooks/queries/useAdminDashboardTabs.ts` | Hooks React Query analytics |
| `Services/api.ts` | Client axios centralisé — ajouter `reportsApi` à la fin |

### Schéma PostgreSQL existant

```sql
evaluations (id_evaluation UUID, evaluateur_matricule, evalue_matricule, statut,
             note_globale DECIMAL, type_evaluation, notations_json JSONB, created_at)
periodes_evaluation (id_periode UUID, nom_periode, date_debut, date_fin, statut, code_periode)
logs_anomalies (id UUID, type, description, severite, matricule, details JSONB, resolue, created_at)
recommandations_admin (id UUID, type, priorite, matricule, titre, description, statut, created_at)
```

---

## Story 8.1 Backend — Module Reports (Vague 1, 1 agent)

### Objectif

Créer le module NestJS `reports/` avec tables PostgreSQL, service CRUD, gestion des sections et endpoints REST sécurisés. C'est le socle que toutes les autres stories de la Vague 2 attendent.

### Acceptance Criteria

- AC1 : Tables `rapports` + `historique_exports` créées via `onModuleInit` dans PostgreSQL
- AC2 : CRUD complet : create, findAll (paginé), findOne, update, soft-delete
- AC3 : Gestion des sections dans `sections_json` : add, updateSection, removeSection, reorder
- AC4 : Tous les endpoints protégés : `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMIN')`
- AC5 : `ReportsModule` enregistré dans `AppModule`

### Structure des tables

```sql
-- À créer dans ReportsService.initTables() via DatabasePgService
CREATE TABLE IF NOT EXISTS rapports (
  id_rapport     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  titre          VARCHAR(200) NOT NULL,
  createur_matricule VARCHAR(20) NOT NULL,
  sections_json  JSONB        NOT NULL DEFAULT '[]',
  statut         VARCHAR(20)  NOT NULL DEFAULT 'brouillon',  -- 'brouillon' | 'finalise' | 'supprime'
  created_at     TIMESTAMP    DEFAULT NOW(),
  updated_at     TIMESTAMP    DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rapports_createur ON rapports(createur_matricule);
CREATE INDEX IF NOT EXISTS idx_rapports_statut   ON rapports(statut);

CREATE TABLE IF NOT EXISTS historique_exports (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  rapport_id         UUID        REFERENCES rapports(id_rapport) ON DELETE SET NULL,
  format             VARCHAR(20) NOT NULL,   -- 'pptx' | 'xlsx' | 'png' | 'svg' | 'pdf'
  createur_matricule VARCHAR(20) NOT NULL,
  fichier_nom        VARCHAR(255),
  created_at         TIMESTAMP   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_historique_exports_rapport ON historique_exports(rapport_id);
```

### Type partagé — Section

```typescript
// apps/api/src/reports/dto/section.dto.ts
export type SectionType =
  | 'executive_summary'
  | 'kpis'
  | 'tendances'
  | 'recommandations'
  | 'texte_libre';

export interface RapportSection {
  id: string;
  type: SectionType;
  titre: string;
  contenu: {
    texte?: string;
    graphes?: Array<{
      id: string;
      type: string;          // 'line_chart' | 'bar_chart' | 'pie_chart'
      titre: string;
      donnees_source: string; // 'analytics/overview' | 'analytics/tendances' | ...
      config?: Record<string, unknown>;
    }>;
  };
  ordre: number;
}

export interface RapportRow {
  id_rapport: string;
  titre: string;
  createur_matricule: string;
  sections_json: RapportSection[];
  statut: string;
  created_at: Date;
  updated_at: Date;
}
```

### DTOs à créer

```typescript
// apps/api/src/reports/dto/create-rapport.dto.ts
import { IsString, Length } from 'class-validator';
export class CreateRapportDto {
  @IsString() @Length(1, 200)
  titre: string;
}

// apps/api/src/reports/dto/update-rapport.dto.ts
import { IsOptional, IsString, IsIn } from 'class-validator';
export class UpdateRapportDto {
  @IsOptional() @IsString() @Length(1, 200)
  titre?: string;

  @IsOptional() @IsIn(['brouillon', 'finalise'])
  statut?: string;
}

// apps/api/src/reports/dto/section.dto.ts (en plus des types ci-dessus)
export class AddSectionDto {
  @IsIn(['executive_summary', 'kpis', 'tendances', 'recommandations', 'texte_libre'])
  type: SectionType;

  @IsString() @Length(1, 100)
  titre: string;

  @IsOptional()
  contenu?: { texte?: string; graphes?: any[] };
}

export class ReorderDto {
  orderedIds: string[];
}
```

### ReportsService — implémentation

```typescript
// apps/api/src/reports/reports.service.ts
import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabasePgService } from '../database/database-pg.service';
import { PrismaService } from '../prisma/prisma.service';
import { RapportRow, RapportSection, SectionType } from './dto/section.dto';

@Injectable()
export class ReportsService implements OnModuleInit {
  constructor(
    private readonly pg: DatabasePgService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.initTables();
  }

  private async initTables(): Promise<void> {
    await this.pg.query(`
      CREATE TABLE IF NOT EXISTS rapports (
        id_rapport         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        titre              VARCHAR(200) NOT NULL,
        createur_matricule VARCHAR(20)  NOT NULL,
        sections_json      JSONB        NOT NULL DEFAULT '[]',
        statut             VARCHAR(20)  NOT NULL DEFAULT 'brouillon',
        created_at         TIMESTAMP    DEFAULT NOW(),
        updated_at         TIMESTAMP    DEFAULT NOW()
      )
    `);
    await this.pg.query(`CREATE INDEX IF NOT EXISTS idx_rapports_createur ON rapports(createur_matricule)`);
    await this.pg.query(`CREATE INDEX IF NOT EXISTS idx_rapports_statut   ON rapports(statut)`);

    await this.pg.query(`
      CREATE TABLE IF NOT EXISTS historique_exports (
        id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        rapport_id         UUID        REFERENCES rapports(id_rapport) ON DELETE SET NULL,
        format             VARCHAR(20) NOT NULL,
        createur_matricule VARCHAR(20) NOT NULL,
        fichier_nom        VARCHAR(255),
        created_at         TIMESTAMP   DEFAULT NOW()
      )
    `);
    await this.pg.query(`CREATE INDEX IF NOT EXISTS idx_historique_exports_rapport ON historique_exports(rapport_id)`);
  }

  async createRapport(titre: string, createurMatricule: string): Promise<RapportRow> {
    const row = await this.pg.queryOne<RapportRow>(
      `INSERT INTO rapports (titre, createur_matricule)
       VALUES ($1, $2)
       RETURNING *`,
      [titre, createurMatricule],
    );
    if (!row) throw new Error('Insert failed');
    return { ...row, sections_json: row.sections_json ?? [] };
  }

  async findAll(page = 1, limit = 20): Promise<{ data: RapportRow[]; total: number; page: number }> {
    const offset = (page - 1) * limit;
    const [rows, countRow] = await Promise.all([
      this.pg.query<RapportRow>(
        `SELECT * FROM rapports WHERE statut != 'supprime'
         ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      this.pg.queryOne<{ count: string }>(
        `SELECT COUNT(*)::text as count FROM rapports WHERE statut != 'supprime'`,
      ),
    ]);
    return { data: rows ?? [], total: Number(countRow?.count ?? 0), page };
  }

  async findOne(idRapport: string): Promise<RapportRow> {
    const row = await this.pg.queryOne<RapportRow>(
      `SELECT * FROM rapports WHERE id_rapport = $1 AND statut != 'supprime'`,
      [idRapport],
    );
    if (!row) throw new NotFoundException(`Rapport ${idRapport} introuvable`);
    return { ...row, sections_json: row.sections_json ?? [] };
  }

  async updateRapport(idRapport: string, updates: { titre?: string; statut?: string }): Promise<RapportRow> {
    const fields: string[] = ['updated_at = NOW()'];
    const params: unknown[] = [];
    let idx = 1;
    if (updates.titre !== undefined)  { fields.push(`titre = $${idx++}`);  params.push(updates.titre); }
    if (updates.statut !== undefined) { fields.push(`statut = $${idx++}`); params.push(updates.statut); }
    params.push(idRapport);
    const row = await this.pg.queryOne<RapportRow>(
      `UPDATE rapports SET ${fields.join(', ')} WHERE id_rapport = $${idx} AND statut != 'supprime' RETURNING *`,
      params,
    );
    if (!row) throw new NotFoundException(`Rapport ${idRapport} introuvable`);
    return row;
  }

  async softDelete(idRapport: string): Promise<void> {
    await this.pg.query(
      `UPDATE rapports SET statut = 'supprime', updated_at = NOW() WHERE id_rapport = $1`,
      [idRapport],
    );
  }

  async addSection(idRapport: string, type: SectionType, titre: string, contenu?: RapportSection['contenu']): Promise<RapportRow> {
    const rapport = await this.findOne(idRapport);
    const sections = rapport.sections_json;
    const newSection: RapportSection = {
      id: uuidv4(),
      type,
      titre,
      contenu: contenu ?? {},
      ordre: sections.length + 1,
    };
    sections.push(newSection);
    return this.saveSections(idRapport, sections);
  }

  async updateSection(idRapport: string, sectionId: string, updates: { titre?: string; contenu?: RapportSection['contenu'] }): Promise<RapportRow> {
    const rapport = await this.findOne(idRapport);
    const sections = rapport.sections_json.map((s) =>
      s.id === sectionId ? { ...s, ...updates } : s,
    );
    return this.saveSections(idRapport, sections);
  }

  async removeSection(idRapport: string, sectionId: string): Promise<RapportRow> {
    const rapport = await this.findOne(idRapport);
    const sections = rapport.sections_json
      .filter((s) => s.id !== sectionId)
      .map((s, i) => ({ ...s, ordre: i + 1 }));
    return this.saveSections(idRapport, sections);
  }

  async reorderSections(idRapport: string, orderedIds: string[]): Promise<RapportRow> {
    const rapport = await this.findOne(idRapport);
    const sectionMap = new Map(rapport.sections_json.map((s) => [s.id, s]));
    const reordered = orderedIds
      .filter((id) => sectionMap.has(id))
      .map((id, i) => ({ ...sectionMap.get(id)!, ordre: i + 1 }));
    return this.saveSections(idRapport, reordered);
  }

  private async saveSections(idRapport: string, sections: RapportSection[]): Promise<RapportRow> {
    const row = await this.pg.queryOne<RapportRow>(
      `UPDATE rapports SET sections_json = $1::jsonb, updated_at = NOW()
       WHERE id_rapport = $2 RETURNING *`,
      [JSON.stringify(sections), idRapport],
    );
    if (!row) throw new NotFoundException(`Rapport ${idRapport} introuvable`);
    return row;
  }
}
```

### ReportsController — endpoints

```typescript
// apps/api/src/reports/reports.controller.ts
import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
  Request, UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { ReportsService } from './reports.service';
import { CreateRapportDto, UpdateRapportDto, AddSectionDto, ReorderDto } from './dto';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(@Body() dto: CreateRapportDto, @Request() req: any) {
    return this.reportsService.createRapport(dto.titre, req.user.matricule);
  }

  @Get()
  findAll(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.reportsService.findAll(Number(page), Number(limit));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRapportDto) {
    return this.reportsService.updateRapport(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reportsService.softDelete(id);
  }

  @Post(':id/sections')
  addSection(@Param('id') id: string, @Body() dto: AddSectionDto) {
    return this.reportsService.addSection(id, dto.type, dto.titre, dto.contenu);
  }

  @Patch(':id/sections/:sectionId')
  updateSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Body() updates: { titre?: string; contenu?: any },
  ) {
    return this.reportsService.updateSection(id, sectionId, updates);
  }

  @Delete(':id/sections/:sectionId')
  removeSection(@Param('id') id: string, @Param('sectionId') sectionId: string) {
    return this.reportsService.removeSection(id, sectionId);
  }

  @Patch(':id/reorder')
  reorder(@Param('id') id: string, @Body() dto: ReorderDto) {
    return this.reportsService.reorderSections(id, dto.orderedIds);
  }
}
```

### ReportsModule + enregistrement dans AppModule

```typescript
// apps/api/src/reports/reports.module.ts
import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { DatabasePgModule } from '../database/database-pg.module';

@Module({
  imports: [DatabasePgModule],
  providers: [ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
```

```typescript
// apps/api/src/app.module.ts — ajouter dans imports[]
import { ReportsModule } from './reports/reports.module';
// ...
ReportsModule,
```

### Fichiers à créer

- `apps/api/src/reports/dto/section.dto.ts` — types + interfaces (ci-dessus)
- `apps/api/src/reports/dto/create-rapport.dto.ts`
- `apps/api/src/reports/dto/update-rapport.dto.ts`
- `apps/api/src/reports/dto/index.ts` — re-exports
- `apps/api/src/reports/reports.service.ts`
- `apps/api/src/reports/reports.controller.ts`
- `apps/api/src/reports/reports.module.ts`
- `apps/api/src/reports/reports.service.spec.ts` — ≥8 tests
- Modify `apps/api/src/app.module.ts`

### Tests à écrire (reports.service.spec.ts)

```typescript
describe('ReportsService', () => {
  // 1. createRapport — insère et retourne le rapport avec sections vides
  // 2. findAll — retourne liste paginée (mock rows + count)
  // 3. findOne — retourne rapport existant / lève NotFoundException si absent
  // 4. updateRapport — met à jour titre et/ou statut
  // 5. softDelete — update statut = 'supprime'
  // 6. addSection — ajoute section avec uuid + ordre auto-incrémenté
  // 7. reorderSections — réordonne selon orderedIds
  // 8. removeSection — retire la section + recalcule les ordres
});
```

---

## Story 8.2 + 8.3 — Export PPTX + XLSX (Vague 2)

### Objectif

Service d'export en PowerPoint (.pptx) et Excel (.xlsx) avec branding SABC. Historique des exports dans `historique_exports`.

### Acceptance Criteria

- AC1 : `GET /api/reports/:id/export/pptx` → téléchargement direct `.pptx` (Content-Disposition: attachment)
- AC2 : `GET /api/reports/:id/export/xlsx` → téléchargement direct `.xlsx`
- AC3 : PPTX : slide titre rouge SABC + 1 slide par section (titre + texte)
- AC4 : XLSX : 1 onglet par section (titre en A1, texte en A3)
- AC5 : Chaque export est loggé dans `historique_exports`
- AC6 : `GET /api/reports/:id/exports/history` → liste les exports passés

### Installation

```bash
cd apps/api && pnpm add pptxgenjs
cd apps/api && pnpm add -D @types/pptxgenjs 2>/dev/null || true
```

> Note : `xlsx@0.18.5` est déjà installé dans `apps/api`.

### ExportService — implémentation complète

```typescript
// apps/api/src/reports/export.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import PptxGenJS from 'pptxgenjs';
import * as XLSX from 'xlsx';
import { DatabasePgService } from '../database/database-pg.service';
import { RapportRow, RapportSection } from './dto/section.dto';

@Injectable()
export class ExportService {
  constructor(private readonly pg: DatabasePgService) {}

  private async findRapport(idRapport: string): Promise<RapportRow> {
    const row = await this.pg.queryOne<RapportRow>(
      `SELECT * FROM rapports WHERE id_rapport = $1 AND statut != 'supprime'`,
      [idRapport],
    );
    if (!row) throw new NotFoundException(`Rapport ${idRapport} introuvable`);
    return { ...row, sections_json: row.sections_json ?? [] };
  }

  async exportPPTX(idRapport: string): Promise<Buffer> {
    const rapport = await this.findRapport(idRapport);
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';

    // Slide titre
    const titleSlide = pptx.addSlide();
    titleSlide.addShape('rect', { x: 0, y: 0, w: '100%', h: '100%', fill: { color: 'FFFFFF' } });
    titleSlide.addText(rapport.titre, {
      x: 1, y: 2, w: 8.5, h: 1.5,
      fontSize: 28, bold: true, color: 'E53E3E', align: 'center',
    });
    titleSlide.addText('SABC — Évaluation 360°', {
      x: 1, y: 3.8, w: 8.5, h: 0.5,
      fontSize: 14, color: '888888', align: 'center',
    });
    titleSlide.addText(new Date().toLocaleDateString('fr-FR'), {
      x: 1, y: 4.5, w: 8.5, h: 0.4,
      fontSize: 12, color: 'AAAAAA', align: 'center',
    });

    const sections = rapport.sections_json as RapportSection[];
    for (const section of sections) {
      const slide = pptx.addSlide();
      // Barre titre rouge SABC
      slide.addShape('rect', { x: 0, y: 0, w: '100%', h: 0.9, fill: { color: 'E53E3E' } });
      slide.addText(section.titre, {
        x: 0.3, y: 0.1, w: 9.4, h: 0.7,
        fontSize: 18, bold: true, color: 'FFFFFF',
      });
      if (section.contenu?.texte) {
        slide.addText(section.contenu.texte, {
          x: 0.5, y: 1.2, w: 9, h: 5.5,
          fontSize: 12, color: '333333', align: 'left', valign: 'top',
          wrap: true,
        });
      }
    }

    const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
    return buffer;
  }

  async exportXLSX(idRapport: string): Promise<Buffer> {
    const rapport = await this.findRapport(idRapport);
    const wb = XLSX.utils.book_new();
    const sections = rapport.sections_json as RapportSection[];

    if (sections.length === 0) {
      const ws = XLSX.utils.aoa_to_sheet([[rapport.titre], [''], ['Aucune section']]);
      XLSX.utils.book_append_sheet(wb, ws, 'Rapport');
    } else {
      for (const section of sections) {
        const rows: (string | number)[][] = [
          [section.titre],
          [''],
          [section.contenu?.texte ?? ''],
        ];
        if (section.contenu?.graphes?.length) {
          rows.push(['']);
          rows.push(['Graphes liés :']);
          for (const g of section.contenu.graphes) {
            rows.push([`- ${g.titre} (${g.type})`]);
          }
        }
        const sheetName = String(section.titre ?? 'Section').slice(0, 31);
        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }
    }

    return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer;
  }

  async logExport(data: {
    rapport_id: string;
    format: string;
    createur_matricule: string;
    fichier_nom: string;
  }): Promise<void> {
    await this.pg.query(
      `INSERT INTO historique_exports (rapport_id, format, createur_matricule, fichier_nom)
       VALUES ($1, $2, $3, $4)`,
      [data.rapport_id, data.format, data.createur_matricule, data.fichier_nom],
    );
  }

  async getExportHistory(rapportId: string): Promise<unknown[]> {
    return this.pg.query(
      `SELECT * FROM historique_exports WHERE rapport_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [rapportId],
    );
  }
}
```

### Endpoints à ajouter dans ReportsController

```typescript
// Ajouter ces imports
import { Res, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';

// Ajouter ExportService dans le constructor
constructor(
  private readonly reportsService: ReportsService,
  private readonly exportService: ExportService,
) {}

// Endpoint PPTX
@Get(':id/export/pptx')
async exportPPTX(
  @Param('id') id: string,
  @Request() req: any,
  @Res({ passthrough: true }) res: Response,
): Promise<StreamableFile> {
  const buffer = await this.exportService.exportPPTX(id);
  await this.exportService.logExport({
    rapport_id: id,
    format: 'pptx',
    createur_matricule: req.user.matricule,
    fichier_nom: `rapport-${id}.pptx`,
  });
  res.setHeader('Content-Disposition', `attachment; filename="rapport-${id}.pptx"`);
  return new StreamableFile(buffer, {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
}

// Endpoint XLSX
@Get(':id/export/xlsx')
async exportXLSX(
  @Param('id') id: string,
  @Request() req: any,
  @Res({ passthrough: true }) res: Response,
): Promise<StreamableFile> {
  const buffer = await this.exportService.exportXLSX(id);
  await this.exportService.logExport({
    rapport_id: id,
    format: 'xlsx',
    createur_matricule: req.user.matricule,
    fichier_nom: `rapport-${id}.xlsx`,
  });
  res.setHeader('Content-Disposition', `attachment; filename="rapport-${id}.xlsx"`);
  return new StreamableFile(buffer, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// Historique exports
@Get(':id/exports/history')
getExportHistory(@Param('id') id: string) {
  return this.exportService.getExportHistory(id);
}
```

### Modifier ReportsModule

```typescript
// Ajouter ExportService dans providers[]
providers: [ReportsService, ExportService],
```

### Fichiers à créer / modifier

- Create: `apps/api/src/reports/export.service.ts`
- Create: `apps/api/src/reports/export.service.spec.ts` (≥5 tests)
- Modify: `apps/api/src/reports/reports.controller.ts` (ajouter imports + 3 endpoints + ExportService dans constructor)
- Modify: `apps/api/src/reports/reports.module.ts` (ajouter ExportService)

### Tests export.service.spec.ts

```typescript
describe('ExportService', () => {
  let service: ExportService;
  let mockPg: { query: jest.Mock; queryOne: jest.Mock };

  beforeEach(() => {
    mockPg = { query: jest.fn(), queryOne: jest.fn() };
    service = new ExportService(mockPg as any);
  });

  // 1. exportPPTX — retourne un Buffer non-vide pour un rapport avec sections
  // 2. exportPPTX — lève NotFoundException si rapport absent
  // 3. exportXLSX — retourne un Buffer non-vide avec autant d'onglets que de sections
  // 4. exportXLSX — crée un onglet "Rapport" si sections_json est vide
  // 5. logExport — appelle pg.query avec les bons paramètres
  // 6. getExportHistory — retourne les exports pour un rapport_id donné
});
```

---

## Story 8.1 Frontend — Report Builder UI (Vague 2)

### Objectif

Interface admin de liste et création de rapports, avec builder drag & drop pour gérer les sections.

### Acceptance Criteria

- AC1 : Page `/admin/reports` — liste des rapports + bouton "Nouveau rapport"
- AC2 : Page `/admin/reports/:id/edit` — builder avec sections drag & drop
- AC3 : 5 types de sections disponibles + texte libre éditable par section
- AC4 : Réordonnancement des sections par drag & drop (`@dnd-kit`)
- AC5 : Boutons "Exporter PPTX" + "Exporter XLSX" qui déclenchent un download
- AC6 : Routes lazy-load enregistrées dans `App.tsx`

### Installation

```bash
cd apps/web && pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### `reportsApi` — ajouter dans `apps/web/src/Services/api.ts`

```typescript
// Ajouter à la fin du fichier, après analyticsApi
export const reportsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get('/reports', { params }),
  create: (titre: string) =>
    api.post('/reports', { titre }),
  get: (id: string) =>
    api.get(`/reports/${id}`),
  update: (id: string, data: { titre?: string; statut?: string }) =>
    api.patch(`/reports/${id}`, data),
  delete: (id: string) =>
    api.delete(`/reports/${id}`),
  addSection: (id: string, section: { type: string; titre: string; contenu?: any }) =>
    api.post(`/reports/${id}/sections`, section),
  updateSection: (id: string, sectionId: string, updates: { titre?: string; contenu?: any }) =>
    api.patch(`/reports/${id}/sections/${sectionId}`, updates),
  removeSection: (id: string, sectionId: string) =>
    api.delete(`/reports/${id}/sections/${sectionId}`),
  reorderSections: (id: string, orderedIds: string[]) =>
    api.patch(`/reports/${id}/reorder`, { orderedIds }),
  exportPPTX: (id: string) =>
    api.get(`/reports/${id}/export/pptx`, { responseType: 'blob' }),
  exportXLSX: (id: string) =>
    api.get(`/reports/${id}/export/xlsx`, { responseType: 'blob' }),
  exportHistory: (id: string) =>
    api.get(`/reports/${id}/exports/history`),
};
```

### `useReports.ts` — hooks React Query

```typescript
// apps/web/src/Hooks/queries/useReports.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '@/Services/api';

export function useReportsList(page = 1) {
  return useQuery({
    queryKey: ['reports', page],
    queryFn: () => reportsApi.list({ page, limit: 20 }),
    select: (res) => res.data,
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: ['report', id],
    queryFn: () => reportsApi.get(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (titre: string) => reportsApi.create(titre),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useAddSection(rapportId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (section: { type: string; titre: string; contenu?: any }) =>
      reportsApi.addSection(rapportId, section),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report', rapportId] }),
  });
}

export function useUpdateSection(rapportId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, updates }: { sectionId: string; updates: any }) =>
      reportsApi.updateSection(rapportId, sectionId, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report', rapportId] }),
  });
}

export function useRemoveSection(rapportId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sectionId: string) => reportsApi.removeSection(rapportId, sectionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report', rapportId] }),
  });
}

export function useReorderSections(rapportId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => reportsApi.reorderSections(rapportId, orderedIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report', rapportId] }),
  });
}
```

### `SectionCard.tsx` — carte de section draggable

```typescript
// apps/web/src/Components/Admin/Reports/SectionCard.tsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';

const SECTION_LABELS: Record<string, string> = {
  executive_summary: 'Executive Summary',
  kpis: 'KPIs Globaux',
  tendances: 'Tendances Performance',
  recommandations: 'Recommandations',
  texte_libre: 'Texte Libre',
};

interface Section {
  id: string;
  type: string;
  titre: string;
  contenu?: { texte?: string };
  ordre: number;
}

interface Props {
  section: Section;
  onUpdate: (sectionId: string, updates: { titre?: string; contenu?: any }) => void;
  onDelete: (sectionId: string) => void;
}

export function SectionCard({ section, onUpdate, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div
          {...attributes}
          {...listeners}
          className="flex items-center gap-2 cursor-grab active:cursor-grabbing flex-1"
        >
          <GripVertical size={16} className="text-gray-400 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {SECTION_LABELS[section.type] ?? section.type}
          </span>
        </div>
        <button
          onClick={() => onDelete(section.id)}
          className="text-red-400 hover:text-red-600 transition-colors"
          title="Supprimer la section"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <input
        type="text"
        value={section.titre}
        onChange={(e) => onUpdate(section.id, { titre: e.target.value })}
        className="w-full border-b border-gray-200 pb-1 mb-3 font-medium text-gray-800 focus:outline-none focus:border-sabc-red-primary"
        placeholder="Titre de la section"
      />

      <textarea
        value={section.contenu?.texte ?? ''}
        onChange={(e) =>
          onUpdate(section.id, { contenu: { ...(section.contenu ?? {}), texte: e.target.value } })
        }
        className="w-full border border-gray-200 rounded p-2 text-sm text-gray-700 resize-none focus:outline-none focus:border-sabc-red-primary"
        rows={4}
        placeholder="Contenu de la section..."
      />
    </div>
  );
}
```

### `Builder.tsx` — page principale

```typescript
// apps/web/src/pages/Admin/Reports/Builder.tsx
import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useReport, useAddSection, useUpdateSection, useRemoveSection, useReorderSections } from '@/Hooks/queries/useReports';
import { SectionCard } from '@/Components/Admin/Reports/SectionCard';
import { reportsApi } from '@/Services/api';
import { ArrowLeft, Plus, FilePresentation, FileSpreadsheet } from 'lucide-react';

const SECTION_TYPES = [
  { value: 'executive_summary', label: 'Executive Summary' },
  { value: 'kpis',              label: 'KPIs Globaux' },
  { value: 'tendances',         label: 'Tendances Performance' },
  { value: 'recommandations',   label: 'Recommandations' },
  { value: 'texte_libre',       label: 'Texte Libre' },
];

export default function Builder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: rapport, isLoading } = useReport(id!);
  const addSection = useAddSection(id!);
  const updateSection = useUpdateSection(id!);
  const removeSection = useRemoveSection(id!);
  const reorderSections = useReorderSections(id!);
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sections = (rapport?.sections_json ?? []).sort((a: any, b: any) => a.ordre - b.ordre);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = sections.findIndex((s: any) => s.id === active.id);
      const newIndex = sections.findIndex((s: any) => s.id === over.id);
      const newOrder = arrayMove(sections, oldIndex, newIndex);
      reorderSections.mutate(newOrder.map((s: any) => s.id));
    },
    [sections, reorderSections],
  );

  const handleAddSection = (type: string) => {
    const label = SECTION_TYPES.find((t) => t.value === type)?.label ?? type;
    addSection.mutate({ type, titre: label });
    setShowTypeSelector(false);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPPTX = async () => {
    const res = await reportsApi.exportPPTX(id!);
    downloadBlob(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }), `rapport-${id}.pptx`);
  };

  const handleExportXLSX = async () => {
    const res = await reportsApi.exportXLSX(id!);
    downloadBlob(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `rapport-${id}.xlsx`);
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Chargement…</div>;
  if (!rapport)  return <div className="p-8 text-center text-red-500">Rapport introuvable</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/admin/reports')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={18} />
          <span className="text-sm">Retour aux rapports</span>
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleExportPPTX}
            className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
          >
            <FilePresentation size={16} />
            PowerPoint
          </button>
          <button
            onClick={handleExportXLSX}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
          >
            <FileSpreadsheet size={16} />
            Excel
          </button>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{rapport.titre}</h1>

      {/* Sections drag & drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
          {sections.map((section: any) => (
            <SectionCard
              key={section.id}
              section={section}
              onUpdate={(sectionId, updates) => updateSection.mutate({ sectionId, updates })}
              onDelete={(sectionId) => removeSection.mutate(sectionId)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Ajouter section */}
      {showTypeSelector ? (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mt-3">
          <p className="text-sm font-medium text-gray-700 mb-3">Choisir un type de section :</p>
          <div className="grid grid-cols-2 gap-2">
            {SECTION_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => handleAddSection(t.value)}
                className="text-left px-3 py-2 border border-gray-200 rounded hover:bg-sabc-red-primary hover:text-white hover:border-sabc-red-primary text-sm transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowTypeSelector(false)} className="mt-3 text-xs text-gray-500 hover:text-gray-700">
            Annuler
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowTypeSelector(true)}
          className="w-full mt-3 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-sabc-red-primary hover:text-sabc-red-primary flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={18} />
          Ajouter une section
        </button>
      )}
    </div>
  );
}
```

### `Index.tsx` — liste des rapports

```typescript
// apps/web/src/pages/Admin/Reports/Index.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReportsList, useCreateReport } from '@/Hooks/queries/useReports';
import { FileText, Plus, Edit2, Trash2 } from 'lucide-react';
import { reportsApi } from '@/Services/api';
import { useQueryClient } from '@tanstack/react-query';

export default function ReportsIndex() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useReportsList();
  const createReport = useCreateReport();
  const [newTitre, setNewTitre] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const rapports = data?.data ?? [];

  const handleCreate = async () => {
    if (!newTitre.trim()) return;
    const res = await createReport.mutateAsync(newTitre.trim());
    navigate(`/admin/reports/${res.data.id_rapport}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce rapport ?')) return;
    await reportsApi.delete(id);
    qc.invalidateQueries({ queryKey: ['reports'] });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sabc-red-primary text-white rounded-lg hover:bg-sabc-red-dark"
        >
          <Plus size={18} />
          Nouveau rapport
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex gap-3">
          <input
            type="text"
            value={newTitre}
            onChange={(e) => setNewTitre(e.target.value)}
            placeholder="Titre du rapport..."
            className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-sabc-red-primary"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <button onClick={handleCreate} className="px-4 py-2 bg-sabc-red-primary text-white rounded text-sm hover:bg-sabc-red-dark">
            Créer
          </button>
          <button onClick={() => setShowCreate(false)} className="px-3 py-2 border border-gray-200 rounded text-sm hover:bg-gray-50">
            Annuler
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-10 text-gray-500">Chargement…</div>
      ) : rapports.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <FileText size={48} className="mx-auto mb-3 opacity-30" />
          <p>Aucun rapport. Créez votre premier rapport.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rapports.map((r: any) => (
            <div key={r.id_rapport} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{r.titre}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {r.sections_json?.length ?? 0} section(s) · Statut : {r.statut}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/admin/reports/${r.id_rapport}/edit`)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded text-sm hover:bg-gray-50"
                >
                  <Edit2 size={14} />
                  Éditer
                </button>
                <button
                  onClick={() => handleDelete(r.id_rapport)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-500 rounded text-sm hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Routes à ajouter dans `App.tsx`

```typescript
// Ajouter avec les autres imports lazy (section Admin):
const AdminReports        = lazy(() => import('./pages/Admin/Reports/Index'));
const AdminReportsBuilder = lazy(() => import('./pages/Admin/Reports/Builder'));

// Ajouter dans <Routes> (après les routes Admin existantes):
<Route path="/admin/reports"           element={<AdminReports />} />
<Route path="/admin/reports/:id/edit"  element={<AdminReportsBuilder />} />
```

### Fichiers à créer / modifier

- Create: `apps/web/src/pages/Admin/Reports/Index.tsx`
- Create: `apps/web/src/pages/Admin/Reports/Builder.tsx`
- Create: `apps/web/src/Components/Admin/Reports/SectionCard.tsx`
- Modify: `apps/web/src/Services/api.ts` — ajouter `reportsApi`
- Modify: `apps/web/src/Hooks/queries/useReports.ts` (nouveau fichier)
- Modify: `apps/web/src/App.tsx` — ajouter 2 routes + 2 imports lazy

---

## Story 8.4 — Export Graphes Individuels (Vague 2)

### Objectif

Ajouter un bouton d'export (PNG / SVG / PDF) sur chaque graphe Recharts dans les tabs du dashboard admin analytics.

### Acceptance Criteria

- AC1 : Composant `<ChartExportButton>` réutilisable avec dropdown PNG/SVG/PDF
- AC2 : PNG via `html2canvas` — capture le conteneur du chart
- AC3 : SVG — extrait le SVG natif de Recharts et le télécharge
- AC4 : PDF via `jspdf` + `html2canvas` — orientation paysage
- AC5 : Nom de fichier automatique : `sabc-{nom}-{YYYY-MM-DD}.{ext}`
- AC6 : Bouton ajouté sur `TendancesTab.tsx` (au minimum)

### Installation

```bash
cd apps/web && pnpm add html2canvas jspdf
cd apps/web && pnpm add -D @types/html2canvas 2>/dev/null || true
```

### `ChartExportButton.tsx` — implémentation complète

```typescript
// apps/web/src/Components/Charts/ChartExportButton.tsx
import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, ChevronDown } from 'lucide-react';

interface Props {
  chartRef: React.RefObject<HTMLDivElement | null>;
  filename?: string;   // sans extension, ex: "sabc-tendances"
}

export function ChartExportButton({ chartRef, filename = 'sabc-chart' }: Props) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const today = new Date().toISOString().split('T')[0];
  const baseName = `${filename}-${today}`;

  // Fermer en cliquant ailleurs
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const exportPNG = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, { backgroundColor: '#ffffff', scale: 2 });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${baseName}.png`;
      link.click();
    } finally {
      setOpen(false);
    }
  };

  const exportSVG = () => {
    if (!chartRef.current) return;
    const svgEl = chartRef.current.querySelector('svg');
    if (!svgEl) { alert('Aucun SVG trouvé dans ce graphe'); return; }
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(clone);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseName}.svg`;
    link.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const exportPDF = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, { backgroundColor: '#ffffff', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW - 20;
      const imgH = (canvas.height / canvas.width) * imgW;
      const y = imgH < pageH - 20 ? (pageH - imgH) / 2 : 10;
      pdf.addImage(imgData, 'PNG', 10, y, imgW, Math.min(imgH, pageH - 20));
      pdf.save(`${baseName}.pdf`);
    } finally {
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs px-2 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors"
        title="Exporter ce graphe"
      >
        <Download size={12} />
        <span>Exporter</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-[100px]">
          <button onClick={exportPNG} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            PNG
          </button>
          <button onClick={exportSVG} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            SVG
          </button>
          <button onClick={exportPDF} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            PDF
          </button>
        </div>
      )}
    </div>
  );
}
```

### Pattern d'intégration dans `TendancesTab.tsx`

```typescript
// Ajouter en haut:
import { useRef } from 'react';
import { ChartExportButton } from '@/Components/Charts/ChartExportButton';

// Dans le composant, avant le return:
const chartRef = useRef<HTMLDivElement>(null);

// Wrapper le ResponsiveContainer existant:
<div className="relative">
  <div className="absolute top-0 right-0 z-10">
    <ChartExportButton
      chartRef={chartRef}
      filename="sabc-tendances"
    />
  </div>
  <div ref={chartRef}>
    <ResponsiveContainer width="100%" height={300}>
      {/* le ComposedChart existant — NE PAS MODIFIER */}
    </ResponsiveContainer>
  </div>
</div>
```

> **Note :** Appliquer le même pattern à tous les autres tabs du dashboard admin qui contiennent un `<ResponsiveContainer>`.

### Fichiers à créer / modifier

- Create: `apps/web/src/Components/Charts/ChartExportButton.tsx`
- Modify: `apps/web/src/Components/Dashboard/Admin/Tabs/TendancesTab.tsx` (ajouter export)
- Modify: autres tabs analytics avec `<ResponsiveContainer>`

---

## Processus d'exécution

### Vague 1 — Story 8.1 Backend (1 agent)

**Agent A — Story 8.1 Backend**
```
Implémente Story 8.1 Backend (module NestJS reports/) du projet SABC Eval360.

Crée les fichiers:
- apps/api/src/reports/dto/section.dto.ts (types RapportSection, SectionType, RapportRow)
- apps/api/src/reports/dto/create-rapport.dto.ts
- apps/api/src/reports/dto/update-rapport.dto.ts
- apps/api/src/reports/dto/index.ts
- apps/api/src/reports/reports.service.ts (onModuleInit + initTables + CRUD + section management)
- apps/api/src/reports/reports.controller.ts (CRUD + sections, JwtAuthGuard + RolesGuard + Roles('ADMIN'))
- apps/api/src/reports/reports.module.ts
- apps/api/src/reports/reports.service.spec.ts (≥8 tests)

Modifie:
- apps/api/src/app.module.ts (ajouter ReportsModule dans imports)

Critères:
- cd apps/api && npx tsc --noEmit → 0 erreur
- node_modules/.bin/jest → tous les tests verts

Voir docs/superpowers/epic8-session-prompt.md pour l'implémentation complète.
```

---

### Vague 2 — 3 agents simultanés (après Vague 1 terminée et commitée)

**Agent B — Story 8.2+8.3 Export PPTX/XLSX**
```
Implémente Story 8.2+8.3 (Export PPTX + XLSX) du projet SABC Eval360.

1. cd apps/api && pnpm add pptxgenjs
2. Crée apps/api/src/reports/export.service.ts (exportPPTX, exportXLSX, logExport, getExportHistory)
3. Crée apps/api/src/reports/export.service.spec.ts (≥5 tests)
4. Modifie apps/api/src/reports/reports.controller.ts:
   - Ajouter ExportService dans constructor
   - Ajouter endpoints: GET :id/export/pptx, GET :id/export/xlsx, GET :id/exports/history
   - Utiliser StreamableFile + @Res({ passthrough: true }) pour les exports binaires
5. Modifie apps/api/src/reports/reports.module.ts (ajouter ExportService dans providers)

Critères: cd apps/api && npx tsc --noEmit → 0 erreur, tests → verts.
Voir docs/superpowers/epic8-session-prompt.md pour l'implémentation complète.
```

**Agent C — Story 8.1 Frontend**
```
Implémente Story 8.1 Frontend (Report Builder UI) du projet SABC Eval360.

1. cd apps/web && pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
2. Crée apps/web/src/Hooks/queries/useReports.ts
3. Ajoute reportsApi dans apps/web/src/Services/api.ts
4. Crée apps/web/src/Components/Admin/Reports/SectionCard.tsx
5. Crée apps/web/src/pages/Admin/Reports/Index.tsx
6. Crée apps/web/src/pages/Admin/Reports/Builder.tsx
7. Modifie apps/web/src/App.tsx: ajouter imports lazy + routes /admin/reports + /admin/reports/:id/edit

Critères: cd apps/web && npx tsc --noEmit → 0 erreur.
Voir docs/superpowers/epic8-session-prompt.md pour l'implémentation complète.
```

**Agent D — Story 8.4 Chart Export**
```
Implémente Story 8.4 (Export Graphes Individuels) du projet SABC Eval360.

1. cd apps/web && pnpm add html2canvas jspdf
2. Crée apps/web/src/Components/Charts/ChartExportButton.tsx
3. Modifie apps/web/src/Components/Dashboard/Admin/Tabs/TendancesTab.tsx:
   - Ajouter useRef<HTMLDivElement> pour le container du chart
   - Wrapper le ResponsiveContainer avec un div ref + ChartExportButton en position absolute
4. Appliquer le même pattern aux autres tabs analytics avec des charts

Critères: cd apps/web && npx tsc --noEmit → 0 erreur.
Voir docs/superpowers/epic8-session-prompt.md pour l'implémentation complète.
```

---

### Étape Review BMAD (après chaque vague)

Pour chaque agent/story complété :

```
BMAD Code Review — Story 8.X:
1. Spec compliance: vérifier que chaque AC est satisfait
2. Code quality: types any, gestion d'erreurs, injection SQL impossible
3. Build: npx tsc --noEmit → 0 erreur, jest → tests verts
Retourne: PASS ou FAIL avec liste des défauts
```

---

### Commits attendus

```bash
feat(reports): [8.1] reports module with CRUD and section management
feat(reports): [8.2-8.3] PPTX and XLSX export service with SABC branding
feat(reports): [8.1-ui] report builder with drag-and-drop sections
feat(reports): [8.4] chart export button (PNG/SVG/PDF) on analytics tabs
```

### Vérification finale

```bash
cd apps/api && npx tsc --noEmit        # 0 erreur TS API
cd apps/api && node_modules/.bin/jest  # tous les tests verts
cd apps/web && npx tsc --noEmit        # 0 erreur TS Web
git log --oneline -6                   # voir les 4 commits
```

---

## Contraintes techniques

- **Jamais** de `findMany` / `findOne` Prisma pour données PostgreSQL — toujours `DatabasePgService.query()` / `.queryOne()`
- **Jamais** d'interpolation de chaîne dans les requêtes SQL — toujours `$1`, `$2`...
- **Toujours** `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMIN')` sur le controller
- `pptxgenjs` : `import PptxGenJS from 'pptxgenjs'` (default ESM export)
- `xlsx` : `import * as XLSX from 'xlsx'` (déjà installé v0.18.5 dans apps/api)
- Pour les endpoints d'export binaire : utiliser `StreamableFile` + `@Res({ passthrough: true })` — **pas** `@Res()` seul (qui bypass tous les interceptors NestJS)
- Pas de `any` implicite côté TypeScript frontend
- Pas de console.log dans le code livré — utiliser `Logger` NestJS côté API

---

## Fichiers de référence à lire avant de commencer

| Fichier | Pourquoi |
|---------|---------|
| `apps/api/src/analytics/analytics.service.ts` | Pattern `onModuleInit` + `pg.query()` + cache |
| `apps/api/src/analytics/analytics.controller.ts` | Pattern `@UseGuards` + `@Throttle` + `@Roles` |
| `apps/api/src/analytics/analytics.module.ts` | Pattern module NestJS avec DatabasePgModule |
| `apps/api/src/common/services/audit-log.service.ts` | Pattern injection PrismaService + try/catch |
| `apps/web/src/Components/Dashboard/Admin/Tabs/TendancesTab.tsx` | Pattern recharts + TanStack Query |
| `apps/web/src/Hooks/queries/useAdminDashboardTabs.ts` | Pattern hooks React Query + sélecteurs |
| `apps/web/src/Services/api.ts` | Structure `analyticsApi` à imiter pour `reportsApi` |
| `apps/web/src/App.tsx` | Pattern routes lazy + structure Routes existante |
