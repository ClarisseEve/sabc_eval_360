import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabasePgService } from '../database/database-pg.service';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    private pg: DatabasePgService,
    private prisma: PrismaService,
  ) {}

  private normalizeTemplate(row: any) {
    const payload = row?.meta_json
      ? typeof row.meta_json === 'string'
        ? JSON.parse(row.meta_json)
        : row.meta_json
      : {};
    const sections = Array.isArray(payload?.sections) ? payload.sections : [];
    const totalCompetences = sections.reduce((sum: number, section: any) => {
      return sum + (Array.isArray(section?.competences) ? section.competences.length : 0);
    }, 0);

    return {
      id: row.id_template,
      id_template: row.id_template,
      titre: row.nom,
      nom: row.nom,
      description: row.description,
      categorie: payload?.categorie ?? row.evaluated_role,
      evaluated_role: row.evaluated_role,
      version: String(row.version ?? 1),
      statut: row.statut,
      est_actif: row.statut === 'published',
      nb_sections: sections.length,
      nb_competences: totalCompetences,
      sections,
      meta_json: payload,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async listTemplates() {
    const rows = await this.pg.query(
      `SELECT id_template, nom, description, evaluated_role, version, statut, meta_json, created_at, updated_at
       FROM templates
       ORDER BY updated_at DESC, created_at DESC`,
    );
    return rows.map((row) => this.normalizeTemplate(row));
  }

  async getTemplateById(id: string) {
    const row = await this.pg.queryOne(
      `SELECT id_template, nom, description, evaluated_role, version, statut, meta_json, created_at, updated_at
       FROM templates WHERE id_template = $1`,
      [id],
    );
    if (!row) throw new NotFoundException('Template introuvable');
    return this.normalizeTemplate(row);
  }

  async createTemplate(dto: CreateTemplateDto) {
    const id = randomUUID();
    const metaJson = JSON.stringify({
      categorie: dto.categorie,
      sections: dto.sections,
    });
    const statut = dto.est_actif ? 'published' : 'draft';
    const version = Number(dto.version ?? '1');

    await this.pg.execute(
      `INSERT INTO templates
       (id_template, nom, description, evaluated_role, version, statut, meta_json, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::json, NOW(), NOW())`,
      [id, dto.titre, dto.description ?? null, dto.categorie, Number.isNaN(version) ? 1 : version, statut, metaJson],
    );

    return this.getTemplateById(id);
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto) {
    await this.getTemplateById(id);

    const sets: string[] = [];
    const params: any[] = [];
    let index = 1;

    if (dto.titre !== undefined) {
      sets.push(`nom = $${index++}`);
      params.push(dto.titre);
    }
    if (dto.description !== undefined) {
      sets.push(`description = $${index++}`);
      params.push(dto.description);
    }
    if (dto.categorie !== undefined) {
      sets.push(`evaluated_role = $${index++}`);
      params.push(dto.categorie);
    }
    if (dto.version !== undefined) {
      sets.push(`version = $${index++}`);
      params.push(Number(dto.version) || 1);
    }
    if (dto.sections !== undefined) {
      const current = await this.getTemplateById(id);
      sets.push(`meta_json = $${index++}::json`);
      params.push(
        JSON.stringify({
          ...(current.meta_json ?? {}),
          sections: dto.sections,
        }),
      );
    }
    if (dto.est_actif !== undefined) {
      sets.push(`statut = $${index++}`);
      params.push(dto.est_actif ? 'published' : 'draft');
    }

    if (!sets.length) {
      return this.getTemplateById(id);
    }

    params.push(id);
    await this.pg.execute(
      `UPDATE templates SET ${sets.join(', ')}, updated_at = NOW() WHERE id_template = $${index}`,
      params,
    );

    return this.getTemplateById(id);
  }

  async publishTemplate(id: string) {
    await this.getTemplateById(id);
    await this.pg.execute(
      `UPDATE templates SET statut = 'published', updated_at = NOW() WHERE id_template = $1`,
      [id],
    );
    return this.getTemplateById(id);
  }

  async unpublishTemplate(id: string) {
    await this.getTemplateById(id);
    await this.pg.execute(
      `UPDATE templates SET statut = 'draft', updated_at = NOW() WHERE id_template = $1`,
      [id],
    );
    return this.getTemplateById(id);
  }

  async deleteTemplate(id: string) {
    const assignations = await this.pg.queryOne<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM templates_roles_periodes WHERE id_template = $1 AND est_actif = true`,
      [id],
    );
    if (Number(assignations?.count ?? 0) > 0) {
      throw new BadRequestException('Impossible d’archiver un template encore assigné');
    }

    await this.pg.execute(
      `UPDATE templates SET statut = 'archived', updated_at = NOW() WHERE id_template = $1`,
      [id],
    );
    return { success: true };
  }

  async getTemplateForRolePeriode(idRole: string, idPeriode: string) {
    const assignation = await this.pg.queryOne(
      `SELECT trp.*, t.nom, t.statut as template_statut, t.meta_json, t.evaluated_role, t.version, t.description, t.created_at, t.updated_at
       FROM templates_roles_periodes trp
       JOIN templates t ON trp.id_template = t.id_template
       WHERE trp.id_role = $1 AND trp.id_periode = $2 AND trp.est_actif = true`,
      [idRole, idPeriode],
    );

    if (!assignation) {
      throw new NotFoundException(`Aucun template assigné au rôle ${idRole} pour cette période`);
    }
    if (assignation.template_statut !== 'published') {
      throw new BadRequestException("Le template assigné n'est pas publié");
    }
    return {
      ...assignation,
      ...this.normalizeTemplate(assignation),
    };
  }

  async assignTemplate(idTemplate: string, idRole: string, idPeriode: string) {
    const periode = await this.pg.queryOne(
      'SELECT est_ouverte, est_cloturee FROM periodes_evaluation WHERE id_periode = $1',
      [idPeriode],
    );
    if (periode?.est_ouverte || periode?.est_cloturee) {
      throw new BadRequestException('Impossible de modifier les assignations: période ouverte ou fermée');
    }

    const template = await this.pg.queryOne(
      'SELECT statut FROM templates WHERE id_template = $1', [idTemplate],
    );
    if (!template) throw new NotFoundException('Template introuvable');
    if (template.statut !== 'published') throw new BadRequestException('Seuls les templates publiés peuvent être assignés');

    await this.pg.execute(
      `INSERT INTO templates_roles_periodes (id_role, id_periode, id_template, est_actif, created_at, updated_at)
       VALUES ($1, $2, $3, true, NOW(), NOW())
       ON CONFLICT (id_role, id_periode)
       DO UPDATE SET id_template = $3, est_actif = true, updated_at = NOW()`,
      [idRole, idPeriode, idTemplate],
    );

    return { success: true, message: 'Template assigné' };
  }

  async deleteAssignation(idRole: string, idPeriode: string) {
    const periode = await this.pg.queryOne(
      'SELECT est_ouverte, est_cloturee FROM periodes_evaluation WHERE id_periode = $1',
      [idPeriode],
    );
    if (periode?.est_ouverte || periode?.est_cloturee) {
      throw new BadRequestException('Impossible de supprimer: période ouverte ou fermée');
    }
    await this.pg.execute(
      'DELETE FROM templates_roles_periodes WHERE id_role = $1 AND id_periode = $2',
      [idRole, idPeriode],
    );
    return { success: true };
  }

  async getAssignationsByPeriode(idPeriode: string) {
    return this.pg.query(
      `SELECT trp.*, t.nom as template_nom, t.statut as template_statut
       FROM templates_roles_periodes trp
       JOIN templates t ON trp.id_template = t.id_template
       WHERE trp.id_periode = $1 AND trp.est_actif = true`,
      [idPeriode],
    );
  }

  async getMatriceAssignations(idPeriode: string) {
    const assignations = await this.getAssignationsByPeriode(idPeriode);
    const roles = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id_role, nom_role FROM roles WHERE nom_role != 'ADMIN' ORDER BY niveau_taniere`,
    );

    return roles.map((role: any) => {
      const assign = assignations.find((a: any) => a.id_role === role.id_role);
      return {
        id_role: role.id_role,
        nom_role: role.nom_role,
        template_assigne: assign ? { id_template: assign.id_template, nom: assign.template_nom, statut: assign.template_statut } : null,
        est_assigne: !!assign,
      };
    });
  }

  async assignBulk(idPeriode: string, assignations: Array<{ id_role: string; id_template: string }>) {
    let count = 0;
    for (const a of assignations) {
      try {
        await this.assignTemplate(a.id_template, a.id_role, idPeriode);
        count++;
      } catch (e: any) {
        // Log but continue
      }
    }
    return { assigned: count, total: assignations.length };
  }
}
