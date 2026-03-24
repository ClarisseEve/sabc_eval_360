import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabasePgService } from '../database/database-pg.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplatesService {
  constructor(
    private pg: DatabasePgService,
    private prisma: PrismaService,
  ) {}

  async getTemplateForRolePeriode(idRole: string, idPeriode: string) {
    const assignation = await this.pg.queryOne(
      `SELECT trp.*, t.nom, t.statut as template_statut, t.contenu_json
       FROM template_role_periode trp
       JOIN templates t ON trp.id_template = t.id_template
       WHERE trp.id_role = $1 AND trp.id_periode = $2 AND trp.est_actif = true`,
      [idRole, idPeriode],
    );

    if (!assignation) {
      throw new NotFoundException(`Aucun template assigné au rôle ${idRole} pour cette période`);
    }
    if (assignation.template_statut !== 'publie') {
      throw new BadRequestException("Le template assigné n'est pas publié");
    }
    return assignation;
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
    if (template.statut !== 'publie') throw new BadRequestException('Seuls les templates publiés peuvent être assignés');

    await this.pg.execute(
      `INSERT INTO template_role_periode (id_role, id_periode, id_template, est_actif, created_at, updated_at)
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
      'DELETE FROM template_role_periode WHERE id_role = $1 AND id_periode = $2',
      [idRole, idPeriode],
    );
    return { success: true };
  }

  async getAssignationsByPeriode(idPeriode: string) {
    return this.pg.query(
      `SELECT trp.*, t.nom as template_nom, t.statut as template_statut
       FROM template_role_periode trp
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
