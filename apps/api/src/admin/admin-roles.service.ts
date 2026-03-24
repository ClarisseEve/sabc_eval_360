import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DatabasePgService } from '../database/database-pg.service';
import { randomUUID } from 'crypto';

@Injectable()
export class AdminRolesService {
  constructor(
    private prisma: PrismaService,
    private pg: DatabasePgService,
  ) {}

  async getRoles() {
    const roles = await this.prisma.role.findMany({
      include: { _count: { select: { utilisateurs: true } } },
      orderBy: { nom_role: 'asc' },
    });
    return roles;
  }

  async getRoleById(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id_role: id },
      include: { utilisateurs: { select: { matricule: true, nom: true, prenom: true, statut: true } } },
    });
    if (!role) throw new NotFoundException('Rôle introuvable');
    return role;
  }

  async createRole(data: { nom_role: string; niveau_hierarchique?: number; description?: string }) {
    return this.prisma.role.create({ data });
  }

  async updateRole(id: number, data: { nom_role?: string; niveau_hierarchique?: number; description?: string }) {
    const role = await this.prisma.role.findUnique({ where: { id_role: id } });
    if (!role) throw new NotFoundException('Rôle introuvable');
    return this.prisma.role.update({ where: { id_role: id }, data });
  }

  async deleteRole(id: number) {
    const count = await this.prisma.utilisateur.count({ where: { id_role: id } });
    if (count > 0) {
      throw new BadRequestException(`Impossible de supprimer: ${count} utilisateur(s) avec ce rôle`);
    }
    return this.prisma.role.delete({ where: { id_role: id } });
  }

  // ── Evaluation Rules (PostgreSQL) ──

  async getReglesEvaluation() {
    return this.pg.query(
      `SELECT * FROM regles_evaluation ORDER BY created_at DESC`,
    );
  }

  async createRegleEvaluation(data: {
    nom: string;
    description?: string;
    criteres: any[];
    est_active?: boolean;
  }) {
    const id = randomUUID();
    await this.pg.execute(
      `INSERT INTO regles_evaluation (id_regle, nom, description, criteres, est_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [id, data.nom, data.description ?? null, JSON.stringify(data.criteres), data.est_active ?? true],
    );
    return this.pg.queryOne('SELECT * FROM regles_evaluation WHERE id_regle = $1', [id]);
  }

  async updateRegleEvaluation(id: string, data: { nom?: string; description?: string; criteres?: any[]; est_active?: boolean }) {
    const existing = await this.pg.queryOne('SELECT * FROM regles_evaluation WHERE id_regle = $1', [id]);
    if (!existing) throw new NotFoundException('Règle introuvable');

    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (data.nom !== undefined) { sets.push(`nom = $${idx++}`); params.push(data.nom); }
    if (data.description !== undefined) { sets.push(`description = $${idx++}`); params.push(data.description); }
    if (data.criteres !== undefined) { sets.push(`criteres = $${idx++}`); params.push(JSON.stringify(data.criteres)); }
    if (data.est_active !== undefined) { sets.push(`est_active = $${idx++}`); params.push(data.est_active); }

    sets.push(`updated_at = NOW()`);
    params.push(id);

    await this.pg.execute(
      `UPDATE regles_evaluation SET ${sets.join(', ')} WHERE id_regle = $${idx}`,
      params,
    );
    return this.pg.queryOne('SELECT * FROM regles_evaluation WHERE id_regle = $1', [id]);
  }

  async toggleRegleActive(id: string) {
    const existing = await this.pg.queryOne<{ est_active: boolean }>('SELECT est_active FROM regles_evaluation WHERE id_regle = $1', [id]);
    if (!existing) throw new NotFoundException('Règle introuvable');

    await this.pg.execute(
      'UPDATE regles_evaluation SET est_active = $1, updated_at = NOW() WHERE id_regle = $2',
      [!existing.est_active, id],
    );
    return { est_active: !existing.est_active };
  }
}
