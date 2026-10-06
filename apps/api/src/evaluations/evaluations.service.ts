import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DatabasePgService } from '../database/database-pg.service';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeRuleRow, parseRuleEnvelope } from '../regles/rule-schema';
import type { RuleVisibilityPolicy } from '../regles/rule-schema';
import {
  CanonicalEvaluationNote,
  ValidationNotationService,
} from './validation-notation.service';
import { ValidationManagerService } from './validation-manager.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EligibilityService } from './eligibility.service';
import {
  EVALUATED_VISIBILITY_SQL,
  INTERNAL_RULE_ENVELOPE_FIELD,
  isVisibleToEvaluated,
  redactEvaluationForVisibility,
  resolveEvaluationVisibilityPolicy,
  ruleVisibilitySql,
} from './evaluation-visibility';

export interface Evaluation {
  id_evaluation: string | number;
  evaluateur_matricule: string;
  evalue_matricule: string;
  validateur_matricule?: string | null;
  id_periode: string;
  periode_code?: string;
  id_regle: string | null;
  date_creation: string;
  date_soumission: string | null;
  date_validation?: string | null;
  statut: string;
  notations_json: any;
  commentaire_global: string | null;
  commentaire_validation?: string | null;
  note_globale: number | null;
  type_evaluation: string;
  created_at: Date;
  updated_at: Date;
}

type EnrichedEvaluation = Evaluation & {
  evaluateur?: any;
  evalue?: any;
  periode?: any;
  regle?: any;
  validateur?: any;
};

interface EvaluationViewAccess {
  preserveDetails: boolean;
}

export interface EvaluationActor {
  matricule: string;
  role?: string | null;
  role_nom?: string | null;
  is_admin?: boolean;
}

export interface EvaluationHistoryQuery {
  page?: number;
  limit?: number;
  statut?: string;
  type_evaluation?: string;
  id_periode?: string;
}

interface NormalizedEvaluationHistoryQuery {
  page: number;
  limit: number;
  statut?: string;
  type_evaluation?: string;
  id_periode?: string;
}

const EVALUATION_HISTORY_STATUSES = new Set(['brouillon', 'soumis', 'valide', 'rejete']);
const EVALUATION_HISTORY_TYPES = new Set(['auto', 'descendante', 'ascendante', 'pairs', '360']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class EvaluationsService {
  constructor(
    private pg: DatabasePgService,
    private prisma: PrismaService,
    private validationNotation: ValidationNotationService,
    private validationManager: ValidationManagerService,
    private notifications: NotificationsService,
    private eligibility: EligibilityService,
  ) {}

  private normalizeHistoryQuery(query: EvaluationHistoryQuery = {}): NormalizedEvaluationHistoryQuery {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    if (!Number.isSafeInteger(page) || page < 1) {
      throw new BadRequestException('Le numéro de page doit être un entier supérieur ou égal à 1');
    }
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException('La limite doit être un entier compris entre 1 et 100');
    }

    const statut = query.statut?.trim() || undefined;
    if (statut && !EVALUATION_HISTORY_STATUSES.has(statut)) {
      throw new BadRequestException(`Statut historique invalide: ${statut}`);
    }

    const typeEvaluation = query.type_evaluation?.trim() || undefined;
    if (typeEvaluation && !EVALUATION_HISTORY_TYPES.has(typeEvaluation)) {
      throw new BadRequestException(`Type d'évaluation historique invalide: ${typeEvaluation}`);
    }

    const idPeriode = query.id_periode?.trim() || undefined;
    if (idPeriode && !UUID_PATTERN.test(idPeriode)) {
      throw new BadRequestException('Identifiant de période invalide');
    }

    return {
      page,
      limit,
      statut,
      type_evaluation: typeEvaluation,
      id_periode: idPeriode,
    };
  }

  private appendHistoryFilters(
    query: NormalizedEvaluationHistoryQuery,
    params: unknown[],
  ): string[] {
    const clauses: string[] = [];
    if (query.statut) {
      params.push(query.statut);
      clauses.push(`e.statut = $${params.length}`);
    }
    if (query.type_evaluation) {
      params.push(query.type_evaluation);
      clauses.push(`e.type_evaluation = $${params.length}`);
    }
    if (query.id_periode) {
      params.push(query.id_periode);
      clauses.push(`e.id_periode = $${params.length}`);
    }
    return clauses;
  }

  async canCreate(evaluateurMatricule: string, evalueMatricule: string, idRegle?: string): Promise<boolean> {
    const evaluateur = await this.prisma.utilisateur.findUnique({ where: { matricule: evaluateurMatricule } });
    const evalue = await this.prisma.utilisateur.findUnique({ where: { matricule: evalueMatricule } });
    if (!evaluateur || !evalue) return false;

    const periodeActive = await this.pg.queryOne(
      `SELECT id_periode FROM periodes_evaluation
       WHERE statut = 'ouverte'
         AND est_ouverte = true
         AND est_cloturee = false
         AND (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala')::date
             BETWEEN date_debut AND date_fin
       ORDER BY date_debut DESC LIMIT 1`,
    );
    if (!periodeActive) return false;

    return true;
  }

  async create(evaluateurMatricule: string, evalueMatricule: string, idPeriode: string, idRegle?: string): Promise<Evaluation> {
    const evaluateur = await this.prisma.utilisateur.findUnique({ where: { matricule: evaluateurMatricule } });
    const evalue = await this.prisma.utilisateur.findUnique({ where: { matricule: evalueMatricule } });

    if (!evaluateur || !evalue) {
      throw new NotFoundException('Évaluateur ou évalué introuvable');
    }

    await this.syncUserRefs([evaluateur, evalue]);

    const periode = await this.pg.queryOne<any>(
      `SELECT * FROM periodes_evaluation
       WHERE id_periode = $1
         AND statut = 'ouverte'
         AND est_ouverte = true
         AND est_cloturee = false
         AND (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala')::date
             BETWEEN date_debut AND date_fin`,
      [idPeriode],
    );
    if (!periode) {
      throw new BadRequestException('Période non active');
    }

    const typeEvalCalcule = this.determinerType(evaluateur, evalue);
    let typeEval = typeEvalCalcule;

    if (idRegle) {
      const regle = await this.pg.queryOne<any>(
        `SELECT
           id_regle,
           nom_regle,
           description,
           criteres_evaluation_json,
           est_active,
           role_evaluateur,
           role_evalue,
           type_evaluation
         FROM regles_evaluation
         WHERE id_regle = $1`,
        [idRegle],
      );

      if (!regle) {
        throw new BadRequestException("La règle d'évaluation est introuvable");
      }

      const normalizedRule = normalizeRuleRow(regle);
      if (!normalizedRule.est_active) {
        throw new BadRequestException("La règle d'évaluation n'est pas active");
      }

      const expectedEvaluatorRole = String(normalizedRule.role_evaluateur ?? '').toUpperCase();
      const expectedTargetRole = String(normalizedRule.role_evalue ?? '').toUpperCase();
      const actualEvaluatorRole = String(evaluateur.role_nom ?? evaluateur.role ?? '').toUpperCase();
      const actualTargetRole = String(evalue.role_nom ?? evalue.role ?? '').toUpperCase();

      if (expectedEvaluatorRole && expectedEvaluatorRole !== actualEvaluatorRole) {
        throw new BadRequestException("Le rôle évaluateur ne correspond pas à la règle sélectionnée");
      }

      if (expectedTargetRole && expectedTargetRole !== actualTargetRole) {
        throw new BadRequestException("Le rôle évalué ne correspond pas à la règle sélectionnée");
      }

      const envelope = parseRuleEnvelope(normalizedRule.criteres_evaluation_json);
      const constraints = (normalizedRule.criteres_evaluation_json as any)?.constraints ?? {};

      if (constraints.meme_region_obligatoire && evaluateur.id_region !== evalue.id_region) {
        throw new BadRequestException('Cette règle impose une évaluation dans la même région');
      }

      if (constraints.meme_branche_obligatoire && evaluateur.id_branche !== evalue.id_branche) {
        throw new BadRequestException('Cette règle impose une évaluation dans la même branche');
      }

      typeEval = normalizedRule.type_evaluation ?? typeEvalCalcule;

      if (typeEval && typeEvalCalcule !== '360' && typeEval !== typeEvalCalcule) {
        throw new BadRequestException("Le type d'évaluation ne correspond pas au contexte hiérarchique");
      }

      if (envelope.criteres.length === 0) {
        throw new BadRequestException("La règle sélectionnée ne contient aucun critère exploitable");
      }
    }

    const eligibilityType = this.toEligibilityType(typeEval);
    if (eligibilityType) {
      const eligibility = await this.eligibility.canEvaluate(
        evaluateurMatricule,
        evalueMatricule,
        eligibilityType,
      );
      if (!eligibility.autorise) {
        throw new ForbiddenException(eligibility.raison ?? 'Non autorisé à créer cette évaluation');
      }
    } else if (!idRegle) {
      throw new ForbiddenException(
        "Ce type d'évaluation requiert une règle active autorisant explicitement la relation",
      );
    }

    const created = await this.pg.queryOne<Evaluation>(
      `WITH periode_active AS (
         SELECT id_periode, code_periode
         FROM periodes_evaluation
         WHERE id_periode = $6
           AND statut = 'ouverte'
           AND est_ouverte = true
           AND est_cloturee = false
           AND (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala')::date
               BETWEEN date_debut AND date_fin
         FOR UPDATE
       )
       INSERT INTO evaluations (evaluateur_matricule, evalue_matricule, id_periode, id_regle,
        date_creation, statut, notations_json, type_evaluation, periode_code, created_at, updated_at)
       SELECT $1, $2, $3, $4,
              (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala')::date,
              'brouillon', '[]', $5, p.code_periode, NOW(), NOW()
       FROM periode_active AS p
       RETURNING *`,
      [evaluateurMatricule, evalueMatricule, idPeriode, idRegle ?? null, typeEval, idPeriode],
    );
    if (!created) {
      throw new BadRequestException("Impossible de créer l'évaluation");
    }
    return created;
  }

  async findById(id: string, actor: EvaluationActor): Promise<EnrichedEvaluation> {
    const eval_ = await this.loadEvaluation(id);
    const policy = await this.loadVisibilityPolicy(eval_);
    const access = await this.assertCanViewEvaluation(eval_, actor, policy);
    const enriched = await this.enrichEvaluation(eval_);
    return redactEvaluationForVisibility(enriched, {
      policy,
      preserveDetails: access.preserveDetails,
    });
  }

  private canEditEvaluation(eval_: any): boolean {
    // brouillon and rejete are always editable by the evaluator
    if (eval_.statut === 'brouillon' || eval_.statut === 'rejete') return true;
    return false;
  }

  async updateNotes(id: string, actor: EvaluationActor, notes: any[], commentaire?: string): Promise<boolean> {
    const eval_ = await this.loadEvaluation(id);
    this.assertEvaluationOwner(eval_, actor);
    if (!this.canEditEvaluation(eval_)) {
      throw new BadRequestException("L'évaluation ne peut plus être modifiée dans son état actuel");
    }

    const normalized = this.validationNotation.normaliserNotes(notes);
    if (normalized.errors.length > 0) {
      throw new BadRequestException(normalized.errors.join('; '));
    }

    // A draft may be incomplete, but every value it contains must be valid.
    if (normalized.notes.length > 0) {
      const bornesResult = this.validationNotation.validateBornes(normalized.notes);
      if (!bornesResult.valid) {
        throw new BadRequestException(bornesResult.errors.join('; '));
      }
    }

    await this.pg.execute(
      `UPDATE evaluations SET notations_json = $1, commentaire_global = $2, updated_at = NOW()
       WHERE id_evaluation = $3`,
      [JSON.stringify(normalized.notes), commentaire ?? null, id],
    );
    return true;
  }

  async submit(id: string, actor: EvaluationActor): Promise<{ success: boolean; message: string }> {
    const eval_ = await this.loadEvaluation(id);
    this.assertEvaluationOwner(eval_, actor);

    if (eval_.statut !== 'brouillon' && eval_.statut !== 'rejete') {
      throw new BadRequestException(
        "L'évaluation ne peut être soumise que depuis le statut brouillon ou rejeté",
      );
    }

    // Verify period is still open
    const periode = await this.pg.queryOne<any>(
      `SELECT id_periode FROM periodes_evaluation
       WHERE id_periode = $1
         AND statut = 'ouverte'
         AND est_ouverte = true
         AND est_cloturee = false
         AND (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala')::date
             BETWEEN date_debut AND date_fin`,
      [eval_.id_periode],
    );
    if (!periode) {
      throw new BadRequestException('La période est fermée');
    }

    let rawNotes: unknown;
    try {
      rawNotes =
        typeof eval_.notations_json === 'string'
          ? JSON.parse(eval_.notations_json)
          : eval_.notations_json ?? [];
    } catch {
      throw new BadRequestException("Le format des notes de l'évaluation est invalide");
    }

    const normalized = this.validationNotation.normaliserNotes(rawNotes);
    if (normalized.errors.length > 0) {
      throw new BadRequestException(normalized.errors.join('; '));
    }
    const notes = normalized.notes;
    if (notes.length === 0) {
      throw new BadRequestException("L'évaluation est vide");
    }

    if (!eval_.id_regle) {
      throw new BadRequestException(
        "L'évaluation ne peut pas être soumise sans règle d'évaluation associée",
      );
    }

    const regle = await this.pg.queryOne<any>(
      `SELECT criteres_evaluation_json FROM regles_evaluation WHERE id_regle = $1`,
      [eval_.id_regle],
    );
    if (!regle) {
      throw new BadRequestException("La règle d'évaluation associée est introuvable");
    }

    const normalizedRule = normalizeRuleRow(regle);
    const envelope = parseRuleEnvelope(normalizedRule.criteres_evaluation_json);
    const criteres = envelope.criteres;
    if (criteres.length === 0) {
      throw new BadRequestException(
        "La règle d'évaluation associée ne contient aucun critère exploitable",
      );
    }

    const validResult = this.validationNotation.validatePourSoumission(notes, criteres);
    if (!validResult.valid) {
      throw new BadRequestException(validResult.errors.join('; '));
    }

    const noteGlobale = this.validationNotation.calculerNoteGlobale(notes, criteres);
    if (noteGlobale === null) {
      throw new BadRequestException(
        "La pondération de la règle ne permet pas de calculer la note globale",
      );
    }

    const criterionById = new Map(
      criteres.map((critere) => [String(critere.id).trim(), critere] as const),
    );
    const noteByCriterionId = new Map(
      notes.map((note) => [note.critere_id, note] as const),
    );
    const canonicalNotes = Array.from(criterionById.entries()).map(
      ([critereId, critere]): CanonicalEvaluationNote & { poids: number } => {
        const note = noteByCriterionId.get(critereId)!;
        return {
          critere_id: critereId,
          note: note.note,
          ...(note.commentaire !== undefined ? { commentaire: note.commentaire } : {}),
          // Stored only after validation and sourced exclusively from the published rule.
          poids: Number(critere.poids),
        };
      },
    );

    const updated = await this.pg.execute(
      `WITH periode_active AS (
         SELECT id_periode
         FROM periodes_evaluation
         WHERE id_periode = $4
           AND statut = 'ouverte'
           AND est_ouverte = true
           AND est_cloturee = false
           AND (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala')::date
               BETWEEN date_debut AND date_fin
         FOR UPDATE
       )
       UPDATE evaluations AS evaluation
       SET statut = 'soumis', date_soumission = NOW(), note_globale = $1,
           notations_json = $2, updated_at = NOW()
       FROM periode_active AS periode
       WHERE evaluation.id_evaluation = $3
         AND evaluation.id_periode = periode.id_periode
         AND evaluation.statut IN ('brouillon', 'rejete')`,
      [noteGlobale, JSON.stringify(canonicalNotes), id, eval_.id_periode],
    );
    if (updated === 0) {
      throw new BadRequestException(
        "L'état de l'évaluation ou de la période a changé pendant la soumission. Rechargez la page.",
      );
    }

    // Notify manager (non-blocking)
    const isPairs = eval_.type_evaluation === 'pairs';
    const [evaluateur, evalue] = await Promise.all([
      isPairs
        ? Promise.resolve(null)
        : this.prisma.utilisateur.findUnique({ where: { matricule: eval_.evaluateur_matricule } }),
      this.prisma.utilisateur.findUnique({ where: { matricule: eval_.evalue_matricule } }),
    ]);
    if (evalue?.manager_matricule) {
      const evaluateurNom = isPairs
        ? 'un pair anonyme'
        : [evaluateur?.prenom, evaluateur?.nom].filter(Boolean).join(' ') ||
          eval_.evaluateur_matricule;
      this.notifications.create({
        destinataire_matricule: evalue.manager_matricule,
        titre: 'Nouvelle évaluation à valider',
        message: `Une évaluation de ${evaluateurNom} pour ${evalue.prenom} ${evalue.nom} est en attente de validation.`,
        type: 'evaluation',
        id_evaluation: String(id),
        ...(isPairs ? {} : { expediteur_matricule: eval_.evaluateur_matricule }),
      }).catch(() => {});
    }

    return { success: true, message: 'Évaluation soumise avec succès' };
  }

  async validate(
    id: string,
    validateurMatricule: string,
    estValidee: boolean,
    motifRejet?: string | null,
    commentaireValidation?: string | null,
  ): Promise<{ success: boolean; message: string }> {
    const eval_ = await this.loadEvaluation(id);

    if (eval_.statut !== 'soumis') {
      throw new BadRequestException("L'évaluation n'est pas soumise");
    }

    // Check authorization: manager direct OR DR/CDTT même région
    const authResult = await this.validationManager.peutValider(validateurMatricule, eval_.evalue_matricule);
    if (!authResult.canValidate) {
      throw new ForbiddenException(authResult.reason ?? 'Non autorisé à valider cette évaluation');
    }

    // Validate motif if rejecting
    const motifResult = this.validationManager.validerMotifRejet(motifRejet, estValidee);
    if (!motifResult.valid) {
      throw new BadRequestException(motifResult.error);
    }

    const validateur = await this.prisma.utilisateur.findUnique({ where: { matricule: validateurMatricule } });
    if (!validateur) {
      throw new NotFoundException('Validateur introuvable');
    }

    await this.syncUserRefs([validateur]);

    const commentaire = commentaireValidation?.trim() || null;
    if (estValidee && !commentaire) {
      throw new BadRequestException('Un commentaire général est obligatoire pour valider une évaluation.');
    }
    const nouveauStatut = estValidee ? 'valide' : 'rejete';

    await this.pg.execute(
      `UPDATE evaluations
       SET statut = $1,
           validateur_matricule = $2,
           date_validation = NOW(),
           commentaire_validation = $3,
           motif_rejet = $4,
           updated_at = NOW()
       WHERE id_evaluation = $5`,
      [nouveauStatut, validateurMatricule, commentaire, motifRejet?.trim() ?? null, id],
    );

    if (estValidee) {
      await this.updateScores(eval_.evalue_matricule, eval_.id_periode);
    }

    // Notify evaluateur (non-blocking)
    this.notifications.create({
      destinataire_matricule: eval_.evaluateur_matricule,
      titre: estValidee ? 'Évaluation validée' : 'Évaluation rejetée',
      message: estValidee
        ? `Votre évaluation a été validée par ${validateur.prenom} ${validateur.nom}.`
        : `Votre évaluation a été rejetée. Motif : ${motifRejet?.trim() ?? commentaire ?? 'non précisé'}.`,
      type: estValidee ? 'validation' : 'warning',
      id_evaluation: String(id),
      expediteur_matricule: validateurMatricule,
    }).catch(() => {});

    const message = estValidee ? 'Évaluation validée avec succès' : 'Évaluation rejetée';
    return { success: true, message };
  }

  async getEnAttente(matricule: string): Promise<EnrichedEvaluation[]> {
    const evaluations = await this.pg.query<Evaluation>(
      `SELECT * FROM evaluations WHERE evaluateur_matricule = $1 AND statut IN ('brouillon', 'soumis')
       ORDER BY date_creation DESC`,
      [matricule],
    );
    const enriched = await this.enrichEvaluations(evaluations);
    return enriched.map((evaluation) =>
      redactEvaluationForVisibility(evaluation, {
        policy: resolveEvaluationVisibilityPolicy(evaluation.regle),
        preserveDetails: true,
      }),
    );
  }

  async getAValider(managerMatricule: string): Promise<EnrichedEvaluation[]> {
    const validationUserSelect = {
      matricule: true,
      manager_matricule: true,
      role: true,
      role_nom: true,
      id_region: true,
    } as const;
    const validateur = await this.prisma.utilisateur.findUnique({
      where: { matricule: managerMatricule },
      select: validationUserSelect,
    });
    if (!validateur) return [];

    const scopes: Array<Record<string, unknown>> = [
      { manager_matricule: managerMatricule },
    ];
    if (this.validationManager.aPorteeRegionale(validateur)) {
      scopes.push({ id_region: validateur.id_region });
    }

    const candidats = await this.prisma.utilisateur.findMany({
      where: { OR: scopes },
      select: validationUserSelect,
    });
    const evaluesAutorises = candidats.filter((evalue) =>
      this.validationManager.peutValiderUtilisateurs(validateur, evalue).canValidate,
    );

    const matricules = evaluesAutorises.map((evalue) => evalue.matricule);
    if (!matricules.length) return [];

    const evaluesByMatricule = new Map(
      evaluesAutorises.map((evalue) => [evalue.matricule, evalue]),
    );

    const placeholders = matricules.map((_: string, i: number) => `$${i + 1}`).join(',');
    const evaluations = await this.pg.query<Evaluation>(
      `SELECT e.* FROM evaluations e
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       WHERE e.statut = 'soumis'
         AND e.evalue_matricule IN (${placeholders})
         AND (${ruleVisibilitySql('manager_n1')} OR ${ruleVisibilitySql('upper_management')})
       ORDER BY date_soumission DESC`,
      matricules,
    );
    const enriched = await this.enrichEvaluations(evaluations);
    return enriched.flatMap((evaluation) => {
      const evalue = evaluesByMatricule.get(evaluation.evalue_matricule);
      if (
        !evalue ||
        !this.validationManager.peutValiderUtilisateurs(validateur, evalue).canValidate
      ) {
        return [];
      }

      const policy = resolveEvaluationVisibilityPolicy(evaluation.regle);
      const isDirectManager = evalue.manager_matricule === managerMatricule;
      const policyAllowsValidation = isDirectManager
        ? policy.manager_n1
        : policy.upper_management;
      return policyAllowsValidation
        ? [redactEvaluationForVisibility(evaluation, { policy, preserveDetails: true })]
        : [];
    });
  }

  async getPeriodesActives() {
    return this.pg.query(
      `SELECT * FROM periodes_evaluation
       WHERE statut = 'ouverte' AND est_ouverte = true AND est_cloturee = false
         AND (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala')::date
             BETWEEN date_debut AND date_fin
       ORDER BY date_debut DESC`,
    );
  }

  async getHistorique(matricule: string, query: EvaluationHistoryQuery = {}) {
    const normalized = this.normalizeHistoryQuery(query);
    const { page, limit } = normalized;
    const offset = (page - 1) * limit;
    const filterParams: unknown[] = [matricule];
    const filterClauses = this.appendHistoryFilters(normalized, filterParams);
    const filtersSql = filterClauses.length > 0 ? `AND ${filterClauses.join(' AND ')}` : '';
    const dataParams = [...filterParams, limit, offset];
    const limitParam = filterParams.length + 1;
    const offsetParam = filterParams.length + 2;

    const [evaluations, countRow] = await Promise.all([
      this.pg.query<Evaluation>(
        `SELECT e.* FROM evaluations e
         LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
         WHERE (
           e.evaluateur_matricule = $1
           OR e.validateur_matricule = $1
           OR (
             e.evalue_matricule = $1
             AND e.statut IN ('soumis', 'valide')
             AND ${EVALUATED_VISIBILITY_SQL}
           )
         )
         ${filtersSql}
         ORDER BY e.date_creation DESC LIMIT $${limitParam} OFFSET $${offsetParam}`,
        dataParams,
      ),
      this.pg.queryOne<{ total: string }>(
        `SELECT COUNT(*)::text as total FROM evaluations e
         LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
         WHERE (
           e.evaluateur_matricule = $1
           OR e.validateur_matricule = $1
           OR (
             e.evalue_matricule = $1
             AND e.statut IN ('soumis', 'valide')
             AND ${EVALUATED_VISIBILITY_SQL}
           )
         )
         ${filtersSql}`,
        filterParams,
      ),
    ]);

    const enriched = await this.enrichEvaluations(evaluations);
    const data = enriched.flatMap((evaluation) => {
      const policy = resolveEvaluationVisibilityPolicy(evaluation.regle);
      const isOwner = evaluation.evaluateur_matricule === matricule;
      const isValidator = evaluation.validateur_matricule === matricule;
      const isEvaluatedAndVisible =
        evaluation.evalue_matricule === matricule &&
        isVisibleToEvaluated(evaluation as unknown as Record<string, unknown>, policy);

      return isOwner || isValidator || isEvaluatedAndVisible
        ? [
            redactEvaluationForVisibility(evaluation, {
              policy,
              preserveDetails: isOwner || isValidator,
            }),
          ]
        : [];
    });
    const total = parseInt(countRow?.total ?? '0', 10);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        filters: {
          statut: normalized.statut ?? null,
          type_evaluation: normalized.type_evaluation ?? null,
          id_periode: normalized.id_periode ?? null,
        },
      },
    };
  }

  async getHistoriqueGlobal(query: EvaluationHistoryQuery = {}) {
    const normalized = this.normalizeHistoryQuery(query);
    const { page, limit } = normalized;
    const offset = (page - 1) * limit;
    const filterParams: unknown[] = [];
    const filterClauses = this.appendHistoryFilters(normalized, filterParams);
    const filtersSql = filterClauses.length > 0 ? `AND ${filterClauses.join(' AND ')}` : '';
    const dataParams = [...filterParams, limit, offset];
    const limitParam = filterParams.length + 1;
    const offsetParam = filterParams.length + 2;

    const [evaluations, countRow] = await Promise.all([
      this.pg.query<Evaluation>(
        `SELECT e.* FROM evaluations e
         LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
         WHERE ${ruleVisibilitySql('admin')}
         ${filtersSql}
         ORDER BY COALESCE(e.date_soumission, e.updated_at, e.created_at) DESC
         LIMIT $${limitParam} OFFSET $${offsetParam}`,
        dataParams,
      ),
      this.pg.queryOne<{ total: string }>(
        `SELECT COUNT(*)::text as total FROM evaluations e
         LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
         WHERE ${ruleVisibilitySql('admin')}
         ${filtersSql}`,
        filterParams,
      ),
    ]);

    const enriched = await this.enrichEvaluations(evaluations);
    const data = enriched.flatMap((evaluation) => {
      const policy = resolveEvaluationVisibilityPolicy(evaluation.regle);
      return policy.admin
        ? [redactEvaluationForVisibility(evaluation, { policy })]
        : [];
    });
    const total = parseInt(countRow?.total ?? '0', 10);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        filters: {
          statut: normalized.statut ?? null,
          type_evaluation: normalized.type_evaluation ?? null,
          id_periode: normalized.id_periode ?? null,
        },
      },
    };
  }

  async getEligibles(matricule: string) {
    // Get users the current user can evaluate: subordinates + peers in same region
    const user = await this.prisma.utilisateur.findUnique({ where: { matricule } });
    if (!user) return [];

    const [subordinates, peers] = await Promise.all([
      this.prisma.utilisateur.findMany({
        where: { manager_matricule: matricule, statut: 'Actif' },
        select: { matricule: true, nom: true, prenom: true, role: true, role_nom: true },
      }),
      this.prisma.utilisateur.findMany({
        where: {
          id_region: user.id_region,
          statut: 'Actif',
          matricule: { not: matricule },
          niveau_hierarchique: user.niveau_hierarchique,
        },
        select: { matricule: true, nom: true, prenom: true, role: true, role_nom: true },
      }),
    ]);

    // Include self for auto-evaluation
    return {
      auto: { matricule: user.matricule, nom: user.nom, prenom: user.prenom, role: user.role },
      subordonnes: subordinates,
      pairs: peers,
    };
  }

  async getRapport(idPeriode: string, matricule: string) {
    const periode = await this.pg.queryOne('SELECT * FROM periodes_evaluation WHERE id_periode = $1', [idPeriode]);
    if (!periode) throw new NotFoundException('Période introuvable');

    const rawEvaluations = await this.pg.query<Evaluation & Record<string, unknown>>(
      `SELECT e.*, r.criteres_evaluation_json AS ${INTERNAL_RULE_ENVELOPE_FIELD}
       FROM evaluations e
       LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
       WHERE e.id_periode = $1
         AND ${ruleVisibilitySql('admin')}
       ORDER BY e.date_creation DESC`,
      [idPeriode],
    );
    const evaluations = rawEvaluations.flatMap((evaluation) => {
      const policy = resolveEvaluationVisibilityPolicy(evaluation);
      return policy.admin
        ? [redactEvaluationForVisibility(evaluation, { policy })]
        : [];
    });

    const stats = {
      total: evaluations.length,
      brouillon: evaluations.filter(e => e.statut === 'brouillon').length,
      soumis: evaluations.filter(e => e.statut === 'soumis').length,
      valide: evaluations.filter(e => e.statut === 'valide').length,
    };

    return { periode, evaluations, stats };
  }

  async envoyerRappels(idPeriode: string) {
    const periode = await this.pg.queryOne<{ id_periode: string; nom_periode: string; date_fin: string }>(
      `SELECT * FROM periodes_evaluation WHERE id_periode = $1 AND statut = 'ouverte'`,
      [idPeriode],
    );
    if (!periode) throw new BadRequestException('Période non active');

    const dateFin = new Date(periode.date_fin);
    const joursRestants = Math.ceil((dateFin.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    // Find evaluations still in draft
    const brouillons = await this.pg.query<{ evaluateur_matricule: string }>(
      `SELECT DISTINCT evaluateur_matricule FROM evaluations
       WHERE id_periode = $1 AND statut = 'brouillon'`,
      [idPeriode],
    );

    // Send a reminder notification to each evaluator with a pending draft
    const rappelsEnvoyes: string[] = [];
    const erreurs: string[] = [];

    for (const brouillon of brouillons) {
      try {
        await this.notifications.notifierRappelEvaluation(
          brouillon.evaluateur_matricule,
          joursRestants,
        );
        rappelsEnvoyes.push(brouillon.evaluateur_matricule);
      } catch {
        erreurs.push(brouillon.evaluateur_matricule);
      }
    }

    return {
      rappels_envoyes: rappelsEnvoyes.length,
      jours_restants: joursRestants,
      matricules: rappelsEnvoyes,
      erreurs: erreurs.length > 0 ? erreurs : undefined,
    };
  }

  // --- Private helpers ---

  private determinerType(evaluateur: any, evalue: any): string {
    if (evaluateur.matricule === evalue.matricule) return 'auto';
    if (evalue.manager_matricule === evaluateur.matricule) return 'descendante';
    if (evaluateur.manager_matricule === evalue.matricule) return 'ascendante';
    if (evaluateur.niveau_hierarchique === evalue.niveau_hierarchique && evaluateur.id_region === evalue.id_region) return 'pairs';
    return '360';
  }

  private toEligibilityType(typeEvaluation: string): 'auto' | 'pairs' | 'subordonnes' | null {
    if (typeEvaluation === 'auto' || typeEvaluation === 'pairs') return typeEvaluation;
    if (typeEvaluation === 'descendante') return 'subordonnes';
    return null;
  }

  private async loadEvaluation(id: string): Promise<Evaluation> {
    const evaluation = await this.pg.queryOne<Evaluation>(
      'SELECT * FROM evaluations WHERE id_evaluation = $1',
      [id],
    );
    if (!evaluation) throw new NotFoundException('Évaluation introuvable');
    return evaluation;
  }

  private async loadVisibilityPolicy(evaluation: Evaluation): Promise<RuleVisibilityPolicy> {
    if (!evaluation.id_regle) return resolveEvaluationVisibilityPolicy(null);

    const rule = await this.pg.queryOne<{ criteres_evaluation_json: unknown }>(
      'SELECT criteres_evaluation_json FROM regles_evaluation WHERE id_regle = $1',
      [evaluation.id_regle],
    );
    return resolveEvaluationVisibilityPolicy(rule);
  }

  private isAdmin(actor: EvaluationActor): boolean {
    const role = String(actor.role_nom ?? actor.role ?? '').toUpperCase();
    return Boolean(actor.is_admin) || role === 'ADMIN';
  }

  private assertEvaluationOwner(evaluation: Evaluation, actor: EvaluationActor): void {
    if (!actor?.matricule || actor.matricule !== evaluation.evaluateur_matricule) {
      throw new ForbiddenException("Seul l'évaluateur propriétaire peut modifier ou soumettre cette évaluation");
    }
  }

  private async assertCanViewEvaluation(
    evaluation: Evaluation,
    actor: EvaluationActor,
    policy: RuleVisibilityPolicy,
  ): Promise<EvaluationViewAccess> {
    if (!actor?.matricule) throw new ForbiddenException('Identité utilisateur introuvable');
    if (actor.matricule === evaluation.evaluateur_matricule) {
      return { preserveDetails: true };
    }

    const isEvaluated = actor.matricule === evaluation.evalue_matricule;
    if (isEvaluated && policy.evaluated) {
      const visibleStatus = evaluation.statut === 'soumis' || evaluation.statut === 'valide';
      if (visibleStatus) return { preserveDetails: false };
    }

    if (this.isAdmin(actor) && policy.admin) {
      return { preserveDetails: false };
    }

    const isAssignedValidator = actor.matricule === evaluation.validateur_matricule;
    if (isAssignedValidator || evaluation.statut === 'soumis') {
      const authorization = await this.validationManager.peutValider(
        actor.matricule,
        evaluation.evalue_matricule,
      );
      if (authorization.canValidate) {
        const evalue = await this.prisma.utilisateur.findUnique({
          where: { matricule: evaluation.evalue_matricule },
          select: { manager_matricule: true },
        });
        const isDirectManager = evalue?.manager_matricule === actor.matricule;
        const policyAllowsValidator = isDirectManager
          ? policy.manager_n1
          : policy.upper_management;
        if (policyAllowsValidator) return { preserveDetails: true };
      }
    }

    throw new ForbiddenException("Accès non autorisé à cette évaluation");
  }

  private async updateScores(matricule: string, idPeriode: string): Promise<void> {
    const evaluations = await this.pg.query<Evaluation>(
      `SELECT * FROM evaluations WHERE evalue_matricule = $1 AND id_periode = $2 AND statut = 'valide'`,
      [matricule, idPeriode],
    );
    if (!evaluations.length) return;

    const evalue = await this.prisma.utilisateur.findUnique({ where: { matricule } });
    let scoreAuto: number | null = null;
    let scorePairs: number | null = null;
    let scoreManager: number | null = null;

    for (const ev of evaluations) {
      const notes = typeof ev.notations_json === 'string' ? JSON.parse(ev.notations_json) : ev.notations_json ?? [];
      const moyenne = this.calculerMoyenne(notes);
      if (moyenne === null) continue;

      if (ev.evaluateur_matricule === matricule) {
        scoreAuto = moyenne;
      } else if (evalue && ev.evaluateur_matricule === evalue.manager_matricule) {
        scoreManager = scoreManager !== null ? Math.round(((scoreManager + moyenne) / 2) * 100) / 100 : moyenne;
      } else {
        scorePairs = scorePairs !== null ? Math.round(((scorePairs + moyenne) / 2) * 100) / 100 : moyenne;
      }
    }

    // Upsert score in scores_utilisateurs (if table exists)
    try {
      await this.pg.execute(
        `INSERT INTO scores_utilisateurs (matricule, id_periode, score_auto, score_pairs, score_manager, derniere_maj)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (matricule, id_periode) DO UPDATE SET
           score_auto = EXCLUDED.score_auto, score_pairs = EXCLUDED.score_pairs,
           score_manager = EXCLUDED.score_manager, derniere_maj = NOW()`,
        [matricule, idPeriode, scoreAuto, scorePairs, scoreManager],
      );
    } catch {
      // scores_utilisateurs may be in ClickHouse — silently skip
    }
  }

  private calculerMoyenne(notes: any[]): number | null {
    if (!notes?.length) return null;
    let somme = 0;
    let poids = 0;
    for (const n of notes) {
      if (n.note != null) {
        const p = n.poids ?? n.ponderation ?? 1;
        somme += n.note * p;
        poids += p;
      }
    }
    return poids > 0 ? Math.round((somme / poids) * 4 * 100) / 100 : null;
  }

  private async enrichEvaluations(evaluations: Evaluation[]): Promise<EnrichedEvaluation[]> {
    if (!evaluations.length) return [];

    const matricules = Array.from(
      new Set(
        evaluations.flatMap((evaluation) => [
          ...(evaluation.type_evaluation === 'pairs'
            ? []
            : [evaluation.evaluateur_matricule]),
          evaluation.evalue_matricule,
          evaluation.validateur_matricule,
        ]),
      ),
    ).filter(Boolean) as string[];

    const periodesCodes = Array.from(
      new Set(evaluations.map((evaluation) => evaluation.periode_code).filter(Boolean)),
    ) as string[];
    const reglesIds = Array.from(new Set(evaluations.map((evaluation) => evaluation.id_regle).filter(Boolean))) as string[];

    const [users, periodes, regles] = await Promise.all([
      this.prisma.utilisateur.findMany({
        where: { matricule: { in: matricules } },
        select: {
          matricule: true,
          nom: true,
          prenom: true,
          email: true,
          role: true,
          role_nom: true,
          region_nom: true,
          photo_url: true,
        },
      }),
      periodesCodes.length
        ? this.pg.query<any>(
            `SELECT id_periode, nom_periode, code_periode, date_debut, date_fin, statut
             FROM periodes_evaluation
             WHERE code_periode IN (${periodesCodes.map((_, index) => `$${index + 1}`).join(',')})`,
            periodesCodes,
          )
        : Promise.resolve([]),
      reglesIds.length
        ? this.pg.query<any>(
            `SELECT
               id_regle,
               nom_regle,
               description,
               criteres_evaluation_json,
               est_active,
               role_evaluateur,
               role_evalue,
               type_evaluation
             FROM regles_evaluation
             WHERE id_regle IN (${reglesIds.map((_, index) => `$${index + 1}`).join(',')})`,
            reglesIds,
          )
        : Promise.resolve([]),
    ]);

    const usersByMatricule = new Map(users.map((user: { matricule: string; photo_url: string | null; [key: string]: unknown }) => [user.matricule, { ...user, avatar: user.photo_url }]));
    const periodesByCode = new Map(periodes.map((periode: any) => [periode.code_periode, periode]));
    const reglesById = new Map(regles.map((regle: any) => [regle.id_regle, normalizeRuleRow(regle)]));

    return evaluations.map((evaluation) => ({
      ...evaluation,
      evaluateur:
        evaluation.type_evaluation === 'pairs'
          ? null
          : usersByMatricule.get(evaluation.evaluateur_matricule) ?? null,
      evalue: usersByMatricule.get(evaluation.evalue_matricule) ?? null,
      periode: evaluation.periode_code ? periodesByCode.get(evaluation.periode_code) ?? null : null,
      regle: evaluation.id_regle ? reglesById.get(evaluation.id_regle) ?? null : null,
      validateur: evaluation.validateur_matricule
        ? usersByMatricule.get(evaluation.validateur_matricule) ?? null
        : null,
    }));
  }

  private async enrichEvaluation(evaluation: Evaluation): Promise<EnrichedEvaluation> {
    const [result] = await this.enrichEvaluations([evaluation]);
    return result;
  }

  private async syncUserRefs(users: Array<{
    matricule: string;
    nom: string;
    prenom: string;
    email: string;
    role?: string | null;
    role_nom?: string | null;
    id_region?: string | null;
    id_branche?: string | null;
    region_nom?: string | null;
    type_region?: string | null;
    est_actif?: boolean | null;
  } | null | undefined>): Promise<void> {
    const refs = users.filter(Boolean) as Array<{
      matricule: string;
      nom: string;
      prenom: string;
      email: string;
      role?: string | null;
      role_nom?: string | null;
      id_region?: string | null;
      id_branche?: string | null;
      region_nom?: string | null;
      type_region?: string | null;
      est_actif?: boolean | null;
    }>;

    for (const user of refs) {
      await this.pg.execute(
        `INSERT INTO utilisateurs_ref (
           matricule, nom, prenom, email, role, id_region, id_branche,
           region_nom, type_region, est_actif, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         ON CONFLICT (matricule) DO UPDATE SET
           nom = EXCLUDED.nom,
           prenom = EXCLUDED.prenom,
           email = EXCLUDED.email,
           role = EXCLUDED.role,
           id_region = EXCLUDED.id_region,
           id_branche = EXCLUDED.id_branche,
           region_nom = EXCLUDED.region_nom,
           type_region = EXCLUDED.type_region,
           est_actif = EXCLUDED.est_actif,
           updated_at = NOW()`,
        [
          user.matricule,
          user.nom,
          user.prenom,
          user.email,
          user.role_nom ?? user.role ?? null,
          user.id_region ?? null,
          user.id_branche ?? null,
          user.region_nom ?? null,
          user.type_region ?? null,
          user.est_actif ?? true,
        ],
      );
    }
  }
}
