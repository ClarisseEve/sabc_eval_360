import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabasePgService } from '../database/database-pg.service';
import {
  normalizeRuleRow,
  parseRuleEnvelope,
  serializeRuleEnvelope,
  validateRuleEnvelope,
  type RuleCriterion,
} from './rule-schema';
import type { CreateRegleDto } from './dto/create-regle.dto';
import type { UpdateRegleDto } from './dto/update-regle.dto';

const CATEGORIES_VALIDES = [
  'Compétences techniques',
  'Soft skills',
  'Leadership',
  'Performance',
  'Innovation',
  "Travail d'équipe",
  'Autonomie',
  'Résolution de problèmes',
];

const MIN_CRITERES = 1;
const TOTAL_PONDERATION = 100;
const ECHELLE_MIN = 1;
const ECHELLE_MAX = 5;
const RULE_DEFINITION_FIELDS: ReadonlyArray<keyof UpdateRegleDto> = [
  'nom_regle',
  'description',
  'criteres',
  'role_evaluateur',
  'role_evalue',
  'type_evaluation',
];
const REFERENCED_RULE_IMMUTABLE_MESSAGE =
  'Cette règle est déjà référencée par une évaluation et ne peut plus être modifiée. ' +
  'Seule sa désactivation est autorisée. Créez une nouvelle règle pour faire évoluer sa définition.';
const ACTIVE_RULE_IMMUTABLE_MESSAGE =
  'Une règle active/publiée ne peut pas être modifiée en place. Désactivez-la d’abord, ' +
  'puis modifiez-la uniquement si elle n’est référencée par aucune évaluation. ' +
  'Sinon, créez une nouvelle règle.';

export interface Critere {
  nom: string;
  description: string;
  ponderation: number;
  echelle: { min: number; max: number };
  categorie: string;
}

@Injectable()
export class ReglesService {
  constructor(private pg: DatabasePgService) {}

  private hasDefinitionChanges(dto: UpdateRegleDto): boolean {
    return RULE_DEFINITION_FIELDS.some((field) => dto[field] !== undefined);
  }

  private async countEvaluationReferences(id: string): Promise<number> {
    const ref = await this.pg.queryOne<{ count: string | number }>(
      `SELECT COUNT(*)::text AS count FROM evaluations WHERE id_regle = $1`,
      [id],
    );
    return Number(ref?.count ?? 0);
  }

  private async assertUpdateAllowed(
    id: string,
    existing: { est_active?: boolean },
    dto: UpdateRegleDto,
  ): Promise<void> {
    const changesDefinition = this.hasDefinitionChanges(dto);
    const reactivatesRule = existing.est_active === false && dto.est_active === true;

    if (!changesDefinition && !reactivatesRule) return;

    if ((await this.countEvaluationReferences(id)) > 0) {
      throw new BadRequestException(REFERENCED_RULE_IMMUTABLE_MESSAGE);
    }

    if (changesDefinition && existing.est_active === true) {
      throw new BadRequestException(ACTIVE_RULE_IMMUTABLE_MESSAGE);
    }
  }

  async listActives() {
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
       WHERE est_active = true
       ORDER BY created_at DESC`,
    );
    return rows.map((row) => normalizeRuleRow(row as any));
  }

  async findById(id: string) {
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
    return row ? normalizeRuleRow(row as any) : null;
  }

  validateCriteres(criteres: Array<Critere | RuleCriterion>): { valide: boolean; erreurs: string[] } {
    const erreurs: string[] = [];
    const normalized = parseRuleEnvelope({ criteres }).criteres;

    if (normalized.length < MIN_CRITERES) {
      erreurs.push(`Minimum ${MIN_CRITERES} critères requis (actuellement: ${normalized.length})`);
    }

    const totalPonderation = normalized.reduce((sum, c) => sum + c.poids, 0);
    // Use a tolerance of 0.01 to guard against floating-point rounding errors
    // (e.g. 33.33 + 33.33 + 33.34 = 100.00 exactly but naive float sums can drift).
    if (Math.abs(totalPonderation - TOTAL_PONDERATION) > 0.01) {
      erreurs.push(`Somme des pondérations doit être ${TOTAL_PONDERATION}% (actuelle: ${totalPonderation}%)`);
    }

    normalized.forEach((c, i) => {
      const rawCritere = criteres[i] as Partial<Critere> | undefined;
      const requiredFields = ['libelle', 'description', 'poids', 'echelle', 'section_label'] as const;
      for (const field of requiredFields) {
        if (c[field] === undefined || c[field] === null) {
          erreurs.push(`Critère #${i}: champ '${field}' manquant`);
        }
      }

      if (c.poids !== undefined && (typeof c.poids !== 'number' || c.poids <= 0)) {
        erreurs.push(`Critère #${i}: pondération doit être un nombre positif`);
      }

      if (c.echelle) {
        if (c.echelle.min !== ECHELLE_MIN || c.echelle.max !== ECHELLE_MAX) {
          erreurs.push(`Critère #${i}: échelle doit être de ${ECHELLE_MIN} à ${ECHELLE_MAX}`);
        }
      }

      if (rawCritere?.categorie && !CATEGORIES_VALIDES.includes(rawCritere.categorie)) {
        erreurs.push(`Critère #${i}: catégorie invalide`);
      }

      // These are two independent validations — an invalid category is always
      // flagged regardless of length, and a label that exceeds 80 chars is
      // always flagged regardless of whether it is in the valid list.
      if (c.section_label) {
        if (!CATEGORIES_VALIDES.includes(c.section_label)) {
          erreurs.push(`Critère #${i}: catégorie de section invalide ('${c.section_label}')`);
        }
        if (c.section_label.length > 80) {
          erreurs.push(`Critère #${i}: libellé de section trop long (max 80 caractères)`);
        }
      }
    });

    return { valide: erreurs.length === 0, erreurs };
  }

  async listAll() {
    const rows = await this.pg.query(
      `SELECT id_regle, nom_regle, description, criteres_evaluation_json, est_active,
              role_evaluateur, role_evalue, type_evaluation, created_at, updated_at
       FROM regles_evaluation ORDER BY created_at DESC`,
    );
    return rows.map((row) => normalizeRuleRow(row as any));
  }

  async create(dto: CreateRegleDto) {
    const envelope = serializeRuleEnvelope({ criteres: dto.criteres.map((c) => ({
      libelle: c.nom,
      description: c.description,
      poids: c.ponderation,
      echelle: c.echelle,
      section_label: c.categorie,
      section_order: 1,
      niveau_requis: 3,
      improvement_axis_code: null,
      recommendation_tags: [],
      recommendation_text: null,
      commentaire_requis_si_note_lt: null,
    } as any)) });

    const errors = validateRuleEnvelope(envelope);
    if (errors.length > 0) {
      throw new BadRequestException(errors.join('; '));
    }

    // id_regle is a bigint auto-increment column — let the sequence assign it
    // and return the generated id rather than supplying a UUID.
    let inserted: { id_regle: string | number } | null;
    try {
      inserted = await this.pg.queryOne<{ id_regle: string | number }>(
        `INSERT INTO regles_evaluation
           (nom_regle, description, criteres_evaluation_json, est_active,
            role_evaluateur, role_evalue, type_evaluation, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING id_regle`,
        [
          dto.nom_regle,
          dto.description ?? null,
          JSON.stringify(envelope),
          dto.est_active ?? true,
          dto.role_evaluateur ?? null,
          dto.role_evalue ?? null,
          dto.type_evaluation ?? null,
        ],
      );
    } catch (e: any) {
      // idx_regle_unique enforces a single rule per (role_evaluateur, role_evalue, type_evaluation)
      if (e?.code === '23505') {
        throw new BadRequestException(
          `Une règle existe déjà pour cette combinaison (évaluateur: ${dto.role_evaluateur ?? '—'}, évalué: ${dto.role_evalue ?? '—'}, type: ${dto.type_evaluation ?? '—'})`,
        );
      }
      throw e;
    }

    return this.findById(String(inserted?.id_regle));
  }

  async update(id: string, dto: UpdateRegleDto) {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException(`Règle introuvable: ${id}`);

    await this.assertUpdateAllowed(id, existing, dto);

    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (dto.nom_regle !== undefined) { sets.push(`nom_regle = $${idx++}`); params.push(dto.nom_regle); }
    if (dto.description !== undefined) { sets.push(`description = $${idx++}`); params.push(dto.description); }
    if (dto.role_evaluateur !== undefined) { sets.push(`role_evaluateur = $${idx++}`); params.push(dto.role_evaluateur); }
    if (dto.role_evalue !== undefined) { sets.push(`role_evalue = $${idx++}`); params.push(dto.role_evalue); }
    if (dto.type_evaluation !== undefined) { sets.push(`type_evaluation = $${idx++}`); params.push(dto.type_evaluation); }
    if (dto.est_active !== undefined) { sets.push(`est_active = $${idx++}`); params.push(dto.est_active); }

    if (dto.criteres !== undefined) {
      const envelope = serializeRuleEnvelope({ criteres: dto.criteres.map((c) => ({
        libelle: c.nom,
        description: c.description,
        poids: c.ponderation,
        echelle: c.echelle,
        section_label: c.categorie,
        section_order: 1,
        niveau_requis: 3,
        improvement_axis_code: null,
        recommendation_tags: [],
        recommendation_text: null,
        commentaire_requis_si_note_lt: null,
      } as any)) });
      const errors = validateRuleEnvelope(envelope);
      if (errors.length > 0) throw new BadRequestException(errors.join('; '));
      sets.push(`criteres_evaluation_json = $${idx++}`);
      params.push(JSON.stringify(envelope));
    }

    if (sets.length > 0) {
      params.push(id);
      try {
        await this.pg.execute(
          `UPDATE regles_evaluation SET ${sets.join(', ')}, updated_at = NOW() WHERE id_regle = $${idx}`,
          params,
        );
      } catch (e: any) {
        if (e?.code === '23505') {
          throw new BadRequestException(
            'Une règle existe déjà pour cette combinaison (évaluateur, évalué, type)',
          );
        }
        throw e;
      }
    }

    return this.findById(id);
  }

  async toggleActive(id: string) {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException(`Règle introuvable: ${id}`);

    if (existing.est_active === false && (await this.countEvaluationReferences(id)) > 0) {
      throw new BadRequestException(REFERENCED_RULE_IMMUTABLE_MESSAGE);
    }

    await this.pg.execute(
      `UPDATE regles_evaluation SET est_active = NOT est_active, updated_at = NOW() WHERE id_regle = $1`,
      [id],
    );
    return this.findById(id);
  }

  async delete(id: string) {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException(`Règle introuvable: ${id}`);

    const ref = await this.pg.queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM evaluations WHERE id_regle = $1`,
      [id],
    );

    if (Number(ref?.count ?? 0) > 0) {
      // Soft delete — rule is referenced by existing evaluations
      await this.pg.execute(
        `UPDATE regles_evaluation SET est_active = false, updated_at = NOW() WHERE id_regle = $1`,
        [id],
      );
      return { deleted: false, deactivated: true };
    }

    await this.pg.execute(`DELETE FROM regles_evaluation WHERE id_regle = $1`, [id]);
    return { deleted: true, deactivated: false };
  }

  getCategoriesValides(): string[] {
    return [...CATEGORIES_VALIDES];
  }

  getConstraints() {
    return {
      min_criteres: MIN_CRITERES,
      total_ponderation: TOTAL_PONDERATION,
      echelle_min: ECHELLE_MIN,
      echelle_max: ECHELLE_MAX,
      categories_valides: CATEGORIES_VALIDES,
      visibility_detail_options: ['aggregated', 'detailed'],
    };
  }
}
