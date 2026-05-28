import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DatabasePgService } from '../database/database-pg.service';
import * as bcrypt from 'bcryptjs';
import { Prisma, Utilisateur } from '@prisma/client';
import { EvaluationsService } from '../evaluations/evaluations.service';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { CreateUserDto } from './dto/user.dto';
import { UpdateUserDto } from './dto/user.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    private prisma: PrismaService,
    private pg: DatabasePgService,
    private evaluationsService: EvaluationsService,
    private hierarchyService: HierarchyService,
    private auditLogService: AuditLogService,
  ) {}

  async getUsers(filters?: {
    statut?: string; role?: string; id_region?: string; search?: string;
    page?: number; limit?: number;
  }) {
    const where: any = {};
    if (filters?.statut) where.statut = filters.statut;
    if (filters?.role) where.role = filters.role;
    if (filters?.id_region) where.id_region = filters.id_region;
    if (filters?.search?.trim()) {
      const search = filters.search.trim();
      where.OR = [
        { matricule: { contains: search } },
        { nom: { contains: search } },
        { prenom: { contains: search } },
        { email: { contains: search } },
        { role: { contains: search } },
        { role_nom: { contains: search } },
      ];
    }

    const page = Math.max(1, filters?.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters?.limit ?? 50));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.utilisateur.findMany({
        where,
        orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.utilisateur.count({ where }),
    ]);

    return {
      data: data.map(({ password, remember_token, ...rest }: Utilisateur) => rest),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserByMatricule(matricule: string) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { matricule },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const evalStats = await this.pg.queryOne<{ total: string; validees: string; score_moyen: string }>(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE statut = 'valide') as validees,
         AVG(note_globale) FILTER (WHERE statut = 'valide' AND note_globale IS NOT NULL) as score_moyen
       FROM evaluations WHERE evalue_matricule = $1`,
      [matricule],
    );

    const subordinates = await this.prisma.utilisateur.count({
      where: { manager_matricule: matricule },
    });

    return {
      ...user,
      password: undefined,
      stats: {
        evaluations_total: parseInt(evalStats?.total ?? '0'),
        evaluations_validees: parseInt(evalStats?.validees ?? '0'),
        score_moyen: evalStats?.score_moyen ? Math.round(parseFloat(evalStats.score_moyen) * 10) / 10 : null,
        subordonnes: subordinates,
      },
    };
  }

  async createUser(data: CreateUserDto, adminMatricule: string, ip: string) {
    const existing = await this.prisma.utilisateur.findUnique({ where: { matricule: data.matricule } });
    if (existing) throw new BadRequestException('Ce matricule existe déjà');

    const emailExists = await this.prisma.utilisateur.findFirst({ where: { email: data.email } });
    if (emailExists) throw new BadRequestException('Cet email est déjà utilisé');

    if (data.manager_matricule) {
      const validation = await this.hierarchyService.validerAssignationManager(
        data.matricule,
        data.manager_matricule,
      );
      if (!validation.valide) {
        throw new BadRequestException(
          `Assignation manager invalide: ${validation.erreurs.join('; ')}`,
        );
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const createData: Prisma.UtilisateurUncheckedCreateInput = {
      matricule: data.matricule,
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      role_nom: data.role_nom,
      id_region: data.id_region,
      region_nom: data.region_nom,
      type_region: data.type_region,
      ...(data.id_branche !== undefined && { id_branche: data.id_branche }),
      ...(data.manager_matricule !== undefined && { manager_matricule: data.manager_matricule }),
      ...(data.telephone !== undefined && { telephone: data.telephone }),
      ...(data.id_service !== undefined && { id_service: data.id_service }),
      ...(data.id_district !== undefined && { id_district: data.id_district }),
      ...(data.id_secteur !== undefined && { id_secteur: data.id_secteur }),
      ...(data.sexe !== undefined && { sexe: data.sexe }),
      est_admin: data.est_admin ?? false,
      statut: 'Actif',
      est_actif: true,
    };

    const created = await this.prisma.utilisateur.create({ data: createData });

    await this.auditLogService.log({
      matricule_utilisateur: adminMatricule,
      action: 'USER_CREATE',
      entite: 'utilisateur',
      adresse_ip: ip,
      id_entite: created.matricule,
      details_json: { matricule: created.matricule, nom: created.nom, prenom: created.prenom, role: created.role },
    });

    const { password: _pw, remember_token: _rt, ...safe } = created;
    return safe;
  }

  async updateUser(matricule: string, data: UpdateUserDto, adminMatricule: string, ip: string) {
    const user = await this.prisma.utilisateur.findUnique({ where: { matricule } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const managerChanged =
      data.manager_matricule !== undefined &&
      data.manager_matricule !== user.manager_matricule;

    if (data.manager_matricule && data.manager_matricule !== user.manager_matricule) {
      const validation = await this.hierarchyService.validerAssignationManager(
        matricule,
        data.manager_matricule,
      );
      if (!validation.valide) {
        throw new BadRequestException(
          `Assignation manager invalide: ${validation.erreurs.join('; ')}`,
        );
      }
    }

    const updated = await this.prisma.utilisateur.update({
      where: { matricule },
      data,
    });

    // AC5: detect and log active evaluations impacted by manager change
    if (managerChanged && data.manager_matricule) {
      await this.handleManagerChangeEvaluations(
        matricule,
        user.manager_matricule,
        data.manager_matricule,
        adminMatricule,
        ip,
      );
    }

    await this.auditLogService.log({
      matricule_utilisateur: adminMatricule,
      action: 'USER_UPDATE',
      entite: 'utilisateur',
      adresse_ip: ip,
      id_entite: matricule,
      details_json: { champs_modifies: Object.keys(data) },
    });

    const { password: _pw, remember_token: _rt, ...safe } = updated;
    return safe;
  }

  private async handleManagerChangeEvaluations(
    userMatricule: string,
    oldManagerMatricule: string | null,
    newManagerMatricule: string,
    adminMatricule: string,
    ip: string,
  ): Promise<void> {
    const activeEvals = await this.pg.query<{ id_evaluation: string; statut: string }>(
      `SELECT e.id_evaluation, e.statut
       FROM evaluations e
       JOIN periodes_evaluation p ON p.id_periode = e.id_periode
       WHERE e.evalue_matricule = $1
         AND e.statut IN ('brouillon', 'soumis')
         AND p.statut = 'ouverte'`,
      [userMatricule],
    );

    if (activeEvals.length > 0) {
      await this.auditLogService.log({
        matricule_utilisateur: adminMatricule,
        action: 'USER_MANAGER_CHANGE_EVALS_DETECTED',
        entite: 'evaluation',
        adresse_ip: ip,
        id_entite: userMatricule,
        details_json: {
          ancien_manager: oldManagerMatricule,
          nouveau_manager: newManagerMatricule,
          evaluations_actives: activeEvals.length,
          evaluations_ids: activeEvals.map(e => e.id_evaluation),
        },
      });
    }
  }

  async deactivateUser(matricule: string, adminMatricule: string, ip: string) {
    const user = await this.prisma.utilisateur.findUnique({ where: { matricule } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    await this.prisma.utilisateur.update({
      where: { matricule },
      data: { statut: 'Inactif', est_actif: false },
    });

    await this.auditLogService.log({
      matricule_utilisateur: adminMatricule,
      action: 'USER_DEACTIVATE',
      entite: 'utilisateur',
      adresse_ip: ip,
      id_entite: matricule,
      details_json: { matricule },
    });

    return { success: true, message: 'Utilisateur désactivé' };
  }

  async getSubordonnes(matricule: string) {
    const rows = await this.prisma.utilisateur.findMany({
      where: { manager_matricule: matricule },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    });
    return rows.map(({ password, remember_token, ...rest }: Utilisateur) => rest);
  }

  async getHistorique(matricule: string) {
    await this.ensureUserExists(matricule);
    return this.evaluationsService.getHistorique(matricule);
  }

  async getChaine(matricule: string) {
    await this.ensureUserExists(matricule);
    return this.hierarchyService.getChaineHierarchique(matricule);
  }

  async getRemplacantsDisponibles(matricule: string) {
    const user = await this.prisma.utilisateur.findUnique({ where: { matricule } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const rows = await this.prisma.utilisateur.findMany({
      where: {
        statut: 'Actif',
        matricule: { not: matricule },
        id_region: user.id_region,
        est_indisponible: false,
      },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    });
    return rows.map(({ password, remember_token, ...rest }: Utilisateur) => rest);
  }

  private async ensureUserExists(matricule: string) {
    const user = await this.prisma.utilisateur.findUnique({ where: { matricule } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }
}
