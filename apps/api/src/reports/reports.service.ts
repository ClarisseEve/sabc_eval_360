import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
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
      id: randomUUID(),
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
