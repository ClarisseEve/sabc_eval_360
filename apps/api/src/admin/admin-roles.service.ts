import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DatabasePgService } from '../database/database-pg.service';
import { AuditLogService } from '../common/services/audit-log.service';
import {
  normalizeRuleRow,
  serializeRuleEnvelope,
  validateRuleEnvelope,
  type RuleAnalyticsMetadata,
  type RuleSection,
  type RuleVisibilityPolicy,
  type RuleCriterion,
} from '../regles/rule-schema';

/** Role names that require global cross-branch permissions */
const GLOBAL_ROLES = ['DR', 'CDTT'];

/** Role names that map to the ADMIN system role */
const ADMIN_ROLES = ['ADMIN'];

const RULE_DEFINITION_FIELDS = [
  'nom_regle',
  'description',
  'role_evaluateur',
  'role_evalue',
  'type_evaluation',
  'criteres',
  'sections',
  'visibility_policy',
  'analytics_metadata',
  'meme_region_obligatoire',
  'meme_branche_obligatoire',
] as const;
const REFERENCED_RULE_IMMUTABLE_MESSAGE =
  'Cette règle est déjà référencée par une évaluation et ne peut plus être modifiée. ' +
  'Seule sa désactivation est autorisée. Créez une nouvelle règle pour faire évoluer sa définition.';
const ACTIVE_RULE_IMMUTABLE_MESSAGE =
  'Une règle active/publiée ne peut pas être modifiée en place. Désactivez-la d’abord, ' +
  'puis modifiez-la uniquement si elle n’est référencée par aucune évaluation. ' +
  'Sinon, créez une nouvelle règle.';

interface RegleEvaluationUpdate {
  nom_regle?: string;
  description?: string;
  role_evaluateur?: string;
  role_evalue?: string;
  type_evaluation?: string;
  criteres?: RuleCriterion[];
  sections?: RuleSection[];
  visibility_policy?: Partial<RuleVisibilityPolicy>;
  analytics_metadata?: Partial<RuleAnalyticsMetadata>;
  est_active?: boolean;
  meme_region_obligatoire?: boolean;
  meme_branche_obligatoire?: boolean;
}

/** Scalar fields for Role create/update — mirrors Prisma.RoleUncheckedCreateInput scalars */
interface RoleScalarFields {
  id_role?: string;
  nom_role?: string;
  description?: string | null;
  id_branche?: string | null;
  niveau_taniere?: number | null;
  niveau_non_taniere?: number | null;
  peut_auto_evaluer?: boolean;
  peut_evaluer_pairs?: boolean;
  peut_evaluer_subordonnes?: boolean;
  peut_cross_branch?: boolean;
  portee_geographique?: string;
  role_principal_equivalent?: string | null;
  peut_remplacer_roles?: string | null;
  [key: string]: unknown;
}

function applyBusinessRules(data: Record<string, unknown>): RoleScalarFields {
  const result: RoleScalarFields = { ...data };
  const nomRole = result['nom_role'] as string | undefined;

  if (nomRole && GLOBAL_ROLES.includes(nomRole)) {
    result.peut_cross_branch = true;
    result.portee_geographique = 'global';
    result.id_branche = null;
  }

  if (nomRole && ADMIN_ROLES.includes(nomRole)) {
    result.id_branche = null;
    result.niveau_taniere = 0;
    result.niveau_non_taniere = 0;
  }

  return result;
}

@Injectable()
export class AdminRolesService {
  constructor(
    private prisma: PrismaService,
    private pg: DatabasePgService,
    private auditLog: AuditLogService,
  ) {}

  private hasRegleDefinitionChanges(data: RegleEvaluationUpdate): boolean {
    return RULE_DEFINITION_FIELDS.some((field) => data[field] !== undefined);
  }

  private async countEvaluationReferences(id: string): Promise<number> {
    const ref = await this.pg.queryOne<{ count: string | number }>(
      'SELECT COUNT(*)::text AS count FROM evaluations WHERE id_regle = $1',
      [id],
    );
    return Number(ref?.count ?? 0);
  }

  private async assertRegleUpdateAllowed(
    id: string,
    existing: { est_active?: boolean },
    data: RegleEvaluationUpdate,
  ): Promise<void> {
    const changesDefinition = this.hasRegleDefinitionChanges(data);
    const reactivatesRule = existing.est_active === false && data.est_active === true;

    if (!changesDefinition && !reactivatesRule) return;

    if ((await this.countEvaluationReferences(id)) > 0) {
      throw new BadRequestException(REFERENCED_RULE_IMMUTABLE_MESSAGE);
    }

    if (changesDefinition && existing.est_active === true) {
      throw new BadRequestException(ACTIVE_RULE_IMMUTABLE_MESSAGE);
    }
  }

  async getRoles() {
    return this.prisma.role.findMany({
      orderBy: { nom_role: 'asc' },
    });
  }

  async getRoleById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id_role: id },
    });
    if (!role) throw new NotFoundException('Rôle introuvable');

    // Get users with this role (cross-field: utilisateur.role matches role.nom_role)
    const users = await this.prisma.utilisateur.findMany({
      where: { role: role.nom_role },
      select: { matricule: true, nom: true, prenom: true, statut: true },
    });

    return { ...role, utilisateurs: users };
  }

  async createRole(
    data: {
      id_role: string;
      nom_role: string;
      id_branche?: string | null;
      description?: string;
      niveau_taniere?: number;
      niveau_non_taniere?: number;
      peut_auto_evaluer?: boolean;
      peut_evaluer_pairs?: boolean;
      peut_evaluer_subordonnes?: boolean;
      peut_cross_branch?: boolean;
      portee_geographique?: string;
    },
    adminMatricule: string,
    ip: string,
  ) {
    const finalData = applyBusinessRules(data as Record<string, unknown>);
    const role = await this.prisma.role.create({ data: finalData as Prisma.RoleUncheckedCreateInput });
    await this.auditLog.log({
      matricule_utilisateur: adminMatricule,
      action: 'ROLE_CREATE',
      entite: 'role',
      adresse_ip: ip,
      id_entite: role.id_role,
      details_json: { nom_role: data.nom_role },
    });
    return role;
  }

  async updateRole(
    id: string,
    data: {
      nom_role?: string;
      description?: string;
      id_branche?: string | null;
      niveau_taniere?: number;
      niveau_non_taniere?: number;
      peut_auto_evaluer?: boolean;
      peut_evaluer_pairs?: boolean;
      peut_evaluer_subordonnes?: boolean;
      peut_cross_branch?: boolean;
      portee_geographique?: string;
    },
    adminMatricule: string,
    ip: string,
  ) {
    const role = await this.prisma.role.findUnique({ where: { id_role: id } });
    if (!role) throw new NotFoundException('Rôle introuvable');

    const finalData = applyBusinessRules(data as Record<string, unknown>);
    const updated = await this.prisma.role.update({ where: { id_role: id }, data: finalData as Prisma.RoleUncheckedUpdateInput });
    await this.auditLog.log({
      matricule_utilisateur: adminMatricule,
      action: 'ROLE_UPDATE',
      entite: 'role',
      adresse_ip: ip,
      id_entite: id,
      details_json: { nom_role: data.nom_role ?? role.nom_role },
    });
    return updated;
  }

  async deleteRole(id: string, adminMatricule: string, ip: string) {
    const role = await this.prisma.role.findUnique({ where: { id_role: id } });
    if (!role) throw new NotFoundException('Rôle introuvable');

    const count = await this.prisma.utilisateur.count({ where: { role: role.nom_role } });
    if (count > 0) {
      throw new BadRequestException(`Impossible de supprimer: ${count} utilisateur(s) avec ce rôle`);
    }

    await this.auditLog.log({
      matricule_utilisateur: adminMatricule,
      action: 'ROLE_DELETE',
      entite: 'role',
      adresse_ip: ip,
      id_entite: id,
      details_json: { nom_role: role.nom_role },
    });
    return this.prisma.role.delete({ where: { id_role: id } });
  }

  // ── Evaluation Rules (PostgreSQL) ──

  async getReglesEvaluation() {
    const rows = await this.pg.query(
      `SELECT
         id_regle,
         nom_regle,
         description,
         criteres_evaluation_json,
         est_active,
         role_evaluateur,
         role_evalue,
         type_evaluation,
         created_at,
         updated_at
       FROM regles_evaluation
       ORDER BY created_at DESC`,
    );
    return rows.map((row) => normalizeRuleRow(row as any));
  }

  async getRegleEvaluationById(id: string) {
    const row = await this.pg.queryOne(
      `SELECT
         id_regle,
         nom_regle,
         description,
         criteres_evaluation_json,
         est_active,
         role_evaluateur,
         role_evalue,
         type_evaluation,
         created_at,
         updated_at
       FROM regles_evaluation
       WHERE id_regle = $1`,
      [id],
    );
    if (!row) throw new NotFoundException('Règle introuvable');
    return normalizeRuleRow(row as any);
  }

  async createRegleEvaluation(data: {
    nom_regle: string;
    description?: string;
    role_evaluateur: string;
    role_evalue: string;
    type_evaluation: string;
    criteres: RuleCriterion[];
    sections?: RuleSection[];
    visibility_policy?: Partial<RuleVisibilityPolicy>;
    analytics_metadata?: Partial<RuleAnalyticsMetadata>;
    est_active?: boolean;
    meme_region_obligatoire?: boolean;
    meme_branche_obligatoire?: boolean;
  }) {
    const envelope = serializeRuleEnvelope({
      sections: data.sections,
      criteres: data.criteres,
      visibility_policy: {
        ...data.visibility_policy,
      },
      analytics_metadata: data.analytics_metadata,
    });
    const validationErrors = validateRuleEnvelope(envelope);
    if (validationErrors.length > 0) {
      throw new BadRequestException(validationErrors);
    }

    const payload = {
      ...envelope,
      constraints: {
        meme_region_obligatoire: data.meme_region_obligatoire ?? true,
        meme_branche_obligatoire: data.meme_branche_obligatoire ?? true,
      },
    };

    const row = await this.pg.queryOne(
      `INSERT INTO regles_evaluation (
         nom_regle,
         description,
         criteres_evaluation_json,
         est_active,
         role_evaluateur,
         role_evalue,
         type_evaluation,
         created_at,
         updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING
         id_regle,
         nom_regle,
         description,
         criteres_evaluation_json,
         est_active,
         role_evaluateur,
         role_evalue,
         type_evaluation,
         created_at,
         updated_at`,
      [
        data.nom_regle,
        data.description ?? null,
        JSON.stringify(payload),
        data.est_active ?? true,
        data.role_evaluateur,
        data.role_evalue,
        data.type_evaluation,
      ],
    );
    return normalizeRuleRow(row as any);
  }

  async updateRegleEvaluation(id: string, data: RegleEvaluationUpdate) {
    const existing = await this.getRegleEvaluationById(id);
    if (!existing) throw new NotFoundException('Règle introuvable');

    await this.assertRegleUpdateAllowed(id, existing, data);

    if (!this.hasRegleDefinitionChanges(data)) {
      if (data.est_active === undefined || data.est_active === existing.est_active) {
        return existing;
      }

      const row = await this.pg.queryOne(
        `UPDATE regles_evaluation
         SET est_active = $1, updated_at = NOW()
         WHERE id_regle = $2
         RETURNING
           id_regle,
           nom_regle,
           description,
           criteres_evaluation_json,
           est_active,
           role_evaluateur,
           role_evalue,
           type_evaluation,
           created_at,
           updated_at`,
        [data.est_active, id],
      );
      return normalizeRuleRow(row as any);
    }

    const envelope = serializeRuleEnvelope({
      sections: data.sections ?? (existing as any).sections,
      criteres: data.criteres ?? (existing as any).criteres,
      visibility_policy: {
        ...((existing as any).visibility_policy ?? {}),
        ...(data.visibility_policy ?? {}),
      },
      analytics_metadata: {
        ...((existing as any).analytics_metadata ?? {}),
        ...(data.analytics_metadata ?? {}),
      },
    });
    const validationErrors = validateRuleEnvelope(envelope);
    if (validationErrors.length > 0) {
      throw new BadRequestException(validationErrors);
    }

    const existingConstraints = ((existing as any).criteres_evaluation_json?.constraints ?? {}) as Record<string, any>;
    const payload = {
      ...envelope,
      constraints: {
        meme_region_obligatoire: data.meme_region_obligatoire ?? existingConstraints.meme_region_obligatoire ?? true,
        meme_branche_obligatoire: data.meme_branche_obligatoire ?? existingConstraints.meme_branche_obligatoire ?? true,
      },
    };

    const row = await this.pg.queryOne(
      `UPDATE regles_evaluation
       SET
         nom_regle = $1,
         description = $2,
         criteres_evaluation_json = $3,
         est_active = $4,
         role_evaluateur = $5,
         role_evalue = $6,
         type_evaluation = $7,
         updated_at = NOW()
       WHERE id_regle = $8
       RETURNING
         id_regle,
         nom_regle,
         description,
         criteres_evaluation_json,
         est_active,
         role_evaluateur,
         role_evalue,
         type_evaluation,
         created_at,
         updated_at`,
      [
        data.nom_regle ?? (existing as any).nom_regle,
        data.description ?? (existing as any).description ?? null,
        JSON.stringify(payload),
        data.est_active ?? (existing as any).est_active ?? true,
        data.role_evaluateur ?? (existing as any).role_evaluateur,
        data.role_evalue ?? (existing as any).role_evalue,
        data.type_evaluation ?? (existing as any).type_evaluation,
        id,
      ],
    );
    return normalizeRuleRow(row as any);
  }

  async toggleRegleActive(id: string) {
    const existing = await this.pg.queryOne<{ est_active: boolean }>('SELECT est_active FROM regles_evaluation WHERE id_regle = $1', [id]);
    if (!existing) throw new NotFoundException('Règle introuvable');

    if (!existing.est_active && (await this.countEvaluationReferences(id)) > 0) {
      throw new BadRequestException(REFERENCED_RULE_IMMUTABLE_MESSAGE);
    }

    await this.pg.execute(
      'UPDATE regles_evaluation SET est_active = $1, updated_at = NOW() WHERE id_regle = $2',
      [!existing.est_active, id],
    );
    return { est_active: !existing.est_active };
  }
}
