import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
    statut?: string;
    role?: string;
    id_region?: string;
    search?: string;
    page?: number;
    limit?: number;
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
      data: data.map(
        ({ password, remember_token, ...rest }: Utilisateur) => rest,
      ),
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

    const evalStats = await this.pg.queryOne<{
      total: string;
      validees: string;
      score_moyen: string;
    }>(
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

    const { password: _pw, remember_token: _rt, ...safeUser } = user;
    return {
      ...safeUser,
      stats: {
        evaluations_total: parseInt(evalStats?.total ?? '0'),
        evaluations_validees: parseInt(evalStats?.validees ?? '0'),
        score_moyen: evalStats?.score_moyen
          ? Math.round(parseFloat(evalStats.score_moyen) * 10) / 10
          : null,
        subordonnes: subordinates,
      },
    };
  }

  async createUser(data: CreateUserDto, adminMatricule: string, ip: string) {
    const existing = await this.prisma.utilisateur.findUnique({
      where: { matricule: data.matricule },
    });
    if (existing) throw new BadRequestException('Ce matricule existe déjà');

    const [emailExists, role, region] = await Promise.all([
      this.prisma.utilisateur.findFirst({ where: { email: data.email } }),
      this.prisma.role.findUnique({ where: { id_role: data.id_role } }),
      this.prisma.region.findUnique({ where: { id_region: data.id_region } }),
    ]);
    if (emailExists)
      throw new BadRequestException('Cet email est déjà utilisé');
    if (!role) throw new BadRequestException('Rôle introuvable');
    if (!region) throw new BadRequestException('Région introuvable');

    const niveauHierarchique = region.est_taniere
      ? role.niveau_taniere
      : role.niveau_non_taniere;
    if (niveauHierarchique === null) {
      throw new BadRequestException(
        `Le rôle ${role.nom_role} n'est pas configuré pour ce type de région`,
      );
    }

    const managerMatricule = this.normalizeOptionalString(
      data.manager_matricule,
    );

    if (managerMatricule) {
      await this.validateManagerForCandidate({
        matricule: data.matricule,
        managerMatricule,
        idRegion: region.id_region,
        idBranche: role.id_branche,
        niveauHierarchique,
        checkCycle: false,
      });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const createData: Prisma.UtilisateurUncheckedCreateInput = {
      matricule: data.matricule,
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      password: hashedPassword,
      role: role.nom_role,
      role_nom: role.nom_role,
      id_region: region.id_region,
      region_nom: region.nom_region,
      type_region: region.est_taniere ? 'taniere' : 'non-taniere',
      id_branche: role.id_branche,
      niveau_hierarchique: niveauHierarchique,
      manager_matricule: managerMatricule,
      telephone: this.normalizeOptionalString(data.telephone),
      id_service: this.normalizeOptionalString(data.id_service),
      id_district: this.normalizeOptionalString(data.id_district),
      id_secteur: this.normalizeOptionalString(data.id_secteur),
      sexe: this.normalizeOptionalString(data.sexe),
      est_admin: role.nom_role.toUpperCase() === 'ADMIN',
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
      details_json: {
        matricule: created.matricule,
        nom: created.nom,
        prenom: created.prenom,
        role: created.role,
      },
    });

    const { password: _pw, remember_token: _rt, ...safe } = created;
    return safe;
  }

  private normalizeOptionalString(
    value: string | null | undefined,
  ): string | null {
    if (value === null || value === undefined) return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private async validateManagerForCandidate(candidate: {
    matricule: string;
    managerMatricule: string;
    idRegion: string;
    idBranche: string | null;
    niveauHierarchique: number;
    checkCycle: boolean;
  }): Promise<void> {
    if (candidate.matricule === candidate.managerMatricule) {
      throw new BadRequestException(
        'Assignation manager invalide: un utilisateur ne peut pas être son propre manager',
      );
    }

    const manager = await this.prisma.utilisateur.findUnique({
      where: { matricule: candidate.managerMatricule },
    });
    if (!manager) {
      throw new BadRequestException(
        'Assignation manager invalide: manager introuvable',
      );
    }

    const erreurs: string[] = [];
    if (!manager.est_actif || manager.statut !== 'Actif') {
      erreurs.push('Le manager doit être actif');
    }
    if (manager.id_region !== candidate.idRegion) {
      erreurs.push('Le manager doit être dans la même région');
    }
    if (manager.niveau_hierarchique >= candidate.niveauHierarchique) {
      erreurs.push('Le manager doit être à un niveau supérieur');
    }

    if (manager.id_branche !== candidate.idBranche) {
      const managerRole = await this.prisma.role.findUnique({
        where: { nom_role: manager.role },
      });
      if (!managerRole?.peut_cross_branch) {
        erreurs.push(
          "Seuls les rôles autorisés (peut_cross_branch) peuvent superviser des utilisateurs d'autres branches",
        );
      }
    }

    if (candidate.checkCycle) {
      const chaine = await this.hierarchyService.getChaineHierarchique(
        candidate.managerMatricule,
      );
      if (chaine.some((entry) => entry.matricule === candidate.matricule)) {
        erreurs.push('Cette assignation créerait un cycle dans la hiérarchie');
      }
    }

    if (erreurs.length > 0) {
      throw new BadRequestException(
        `Assignation manager invalide: ${erreurs.join('; ')}`,
      );
    }
  }

  async updateUser(
    matricule: string,
    data: UpdateUserDto,
    adminMatricule: string,
    ip: string,
  ) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { matricule },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const idRegion = data.id_region ?? user.id_region;
    if (!idRegion) {
      throw new BadRequestException('Région introuvable');
    }

    const [role, region] = await Promise.all([
      data.id_role
        ? this.prisma.role.findUnique({ where: { id_role: data.id_role } })
        : this.prisma.role.findUnique({ where: { nom_role: user.role } }),
      this.prisma.region.findUnique({ where: { id_region: idRegion } }),
    ]);
    if (!role) throw new BadRequestException('Rôle introuvable');
    if (!region) throw new BadRequestException('Région introuvable');

    const niveauHierarchique = region.est_taniere
      ? role.niveau_taniere
      : role.niveau_non_taniere;
    if (niveauHierarchique === null) {
      throw new BadRequestException(
        `Le rôle ${role.nom_role} n'est pas configuré pour ce type de région`,
      );
    }

    const managerMatricule =
      data.manager_matricule === undefined
        ? user.manager_matricule
        : this.normalizeOptionalString(data.manager_matricule);
    const managerChanged = managerMatricule !== user.manager_matricule;
    const hierarchyChanged =
      managerChanged ||
      region.id_region !== user.id_region ||
      role.nom_role !== user.role ||
      role.id_branche !== user.id_branche ||
      niveauHierarchique !== user.niveau_hierarchique;

    if (managerMatricule && hierarchyChanged) {
      await this.validateManagerForCandidate({
        matricule,
        managerMatricule,
        idRegion: region.id_region,
        idBranche: role.id_branche,
        niveauHierarchique,
        checkCycle: true,
      });
    }

    const statut = data.statut ?? user.statut;
    const updateData: Prisma.UtilisateurUncheckedUpdateInput = {
      role: role.nom_role,
      role_nom: role.nom_role,
      id_region: region.id_region,
      region_nom: region.nom_region,
      type_region: region.est_taniere ? 'taniere' : 'non-taniere',
      id_branche: role.id_branche,
      niveau_hierarchique: niveauHierarchique,
      est_admin: role.nom_role.toUpperCase() === 'ADMIN',
      manager_matricule: managerMatricule,
      statut,
      est_actif: !['Inactif', 'Suspendu'].includes(statut),
    };
    if (data.nom !== undefined) updateData.nom = data.nom;
    if (data.prenom !== undefined) updateData.prenom = data.prenom;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.telephone !== undefined) {
      updateData.telephone = this.normalizeOptionalString(data.telephone);
    }
    if (data.id_service !== undefined) {
      updateData.id_service = this.normalizeOptionalString(data.id_service);
    }
    if (data.id_district !== undefined) {
      updateData.id_district = this.normalizeOptionalString(data.id_district);
    }
    if (data.id_secteur !== undefined) {
      updateData.id_secteur = this.normalizeOptionalString(data.id_secteur);
    }

    const updated = await this.prisma.utilisateur.update({
      where: { matricule },
      data: updateData,
    });

    // AC5: detect and log active evaluations impacted by manager change
    if (managerChanged) {
      await this.handleManagerChangeEvaluations(
        matricule,
        user.manager_matricule,
        managerMatricule,
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
    newManagerMatricule: string | null,
    adminMatricule: string,
    ip: string,
  ): Promise<void> {
    const activeEvals = await this.pg.query<{
      id_evaluation: string;
      statut: string;
    }>(
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
          evaluations_ids: activeEvals.map((e) => e.id_evaluation),
        },
      });
    }
  }

  async deactivateUser(matricule: string, adminMatricule: string, ip: string) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { matricule },
    });
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
    return rows.map(
      ({ password, remember_token, ...rest }: Utilisateur) => rest,
    );
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
    const user = await this.prisma.utilisateur.findUnique({
      where: { matricule },
    });
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
    return rows.map(
      ({ password, remember_token, ...rest }: Utilisateur) => rest,
    );
  }

  private async ensureUserExists(matricule: string) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { matricule },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }
}
