import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DatabasePgService } from '../database/database-pg.service';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'crypto';
import { normalizeRuleRow, parseRuleEnvelope } from '../regles/rule-schema';
import { ValidationNotationService } from './validation-notation.service';
import { ValidationManagerService } from './validation-manager.service';
import { NotificationsService } from '../notifications/notifications.service';

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

const PERIODE_UUID_NAMESPACE = '2d9d2d7e-2c8f-4d5f-9867-334e13ef17d9';

function deterministicUuidFromString(value: string): string {
  const hex = createHash('sha1').update(`${PERIODE_UUID_NAMESPACE}:${value}`).digest('hex').slice(0, 32);
  const chars = hex.split('');
  chars[12] = '5';
  chars[16] = ((parseInt(chars[16], 16) & 0x3) | 0x8).toString(16);
  return `${chars.slice(0, 8).join('')}-${chars.slice(8, 12).join('')}-${chars.slice(12, 16).join('')}-${chars.slice(16, 20).join('')}-${chars.slice(20, 32).join('')}`;
}

@Injectable()
export class EvaluationsService {
  constructor(
    private pg: DatabasePgService,
    private prisma: PrismaService,
    private validationNotation: ValidationNotationService,
    private validationManager: ValidationManagerService,
    private notifications: NotificationsService,
  ) {}

  async canCreate(evaluateurMatricule: string, evalueMatricule: string, idRegle?: string): Promise<boolean> {
    const evaluateur = await this.prisma.utilisateur.findUnique({ where: { matricule: evaluateurMatricule } });
    const evalue = await this.prisma.utilisateur.findUnique({ where: { matricule: evalueMatricule } });
    if (!evaluateur || !evalue) return false;

    const periodeActive = await this.pg.queryOne(
      `SELECT id_periode FROM periodes_evaluation
       WHERE statut = 'ouverte' AND date_debut <= NOW() AND date_fin >= NOW()
       ORDER BY date_debut DESC LIMIT 1`,
    );
    if (!periodeActive) return false;

    const existing = await this.pg.queryOne(
      `SELECT 1 FROM evaluations
       WHERE evaluateur_matricule = $1 AND evalue_matricule = $2 AND id_periode = $3
       ${idRegle ? 'AND id_regle = $4' : ''}`,
      idRegle
        ? [evaluateurMatricule, evalueMatricule, periodeActive.id_periode, idRegle]
        : [evaluateurMatricule, evalueMatricule, periodeActive.id_periode],
    );

    return !existing;
  }

  async create(evaluateurMatricule: string, evalueMatricule: string, idPeriode: string, idRegle?: string): Promise<Evaluation> {
    const evaluateur = await this.prisma.utilisateur.findUnique({ where: { matricule: evaluateurMatricule } });
    const evalue = await this.prisma.utilisateur.findUnique({ where: { matricule: evalueMatricule } });

    if (!evaluateur || !evalue) {
      throw new NotFoundException('Évaluateur ou évalué introuvable');
    }

    await this.syncUserRefs([evaluateur, evalue]);

    const periode = await this.pg.queryOne<any>('SELECT * FROM periodes_evaluation WHERE id_periode = $1', [idPeriode]);
    if (!periode || periode.statut !== 'ouverte' || !periode.est_ouverte) {
      throw new BadRequestException('Période non active');
    }

    const evaluationPeriodeId = deterministicUuidFromString(String(periode.code_periode));

    const existing = await this.pg.queryOne(
      `SELECT * FROM evaluations WHERE evaluateur_matricule = $1 AND evalue_matricule = $2 AND id_periode = $3`,
      [evaluateurMatricule, evalueMatricule, evaluationPeriodeId],
    );
    if (existing) return existing;

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

    const created = await this.pg.queryOne<Evaluation>(
      `INSERT INTO evaluations (evaluateur_matricule, evalue_matricule, id_periode, id_regle,
        date_creation, statut, notations_json, type_evaluation, periode_code, created_at, updated_at)
       SELECT $1, $2, $3, $4, CURRENT_DATE, 'brouillon', '[]', $5, p.code_periode, NOW(), NOW()
       FROM periodes_evaluation p
       WHERE p.id_periode = $6
       RETURNING *`,
      [evaluateurMatricule, evalueMatricule, evaluationPeriodeId, idRegle ?? null, typeEval, idPeriode],
    );
    if (!created) {
      throw new BadRequestException("Impossible de créer l'évaluation");
    }
    return created;
  }

  async findById(id: string): Promise<EnrichedEvaluation> {
    const eval_ = await this.pg.queryOne<Evaluation>('SELECT * FROM evaluations WHERE id_evaluation = $1', [id]);
    if (!eval_) throw new NotFoundException('Évaluation introuvable');
    return this.enrichEvaluation(eval_);
  }

  private canEditEvaluation(eval_: any): boolean {
    // brouillon and rejete are always editable by the evaluator
    if (eval_.statut === 'brouillon' || eval_.statut === 'rejete') return true;
    return false;
  }

  async updateNotes(id: string, notes: any[], commentaire?: string): Promise<boolean> {
    const eval_ = await this.findById(id);
    if (!this.canEditEvaluation(eval_)) {
      throw new BadRequestException("L'évaluation ne peut plus être modifiée dans son état actuel");
    }

    // Validate note bounds and mandatory comments before saving
    if (notes && notes.length > 0) {
      const bornesResult = this.validationNotation.validateBornes(notes);
      if (!bornesResult.valid) {
        throw new BadRequestException(bornesResult.errors.join('; '));
      }
      const commentairesResult = this.validationNotation.validateCommentaires(notes);
      if (!commentairesResult.valid) {
        throw new BadRequestException(commentairesResult.errors.join('; '));
      }
    }

    await this.pg.execute(
      `UPDATE evaluations SET notations_json = $1, commentaire_global = $2, updated_at = NOW()
       WHERE id_evaluation = $3`,
      [JSON.stringify(notes), commentaire ?? null, id],
    );
    return true;
  }

  async submit(id: string): Promise<{ success: boolean; message: string }> {
    const eval_ = await this.findById(id);

    if (eval_.statut !== 'brouillon' && eval_.statut !== 'rejete') {
      return { success: false, message: "L'évaluation ne peut être soumise que depuis le statut brouillon ou rejeté" };
    }

    // Verify period is still open
    const periode = await this.pg.queryOne<any>(
      `SELECT statut FROM periodes_evaluation WHERE id_periode = $1`,
      [eval_.id_periode],
    );
    if (!periode || periode.statut !== 'ouverte') {
      return { success: false, message: 'La période est fermée' };
    }

    const notes = typeof eval_.notations_json === 'string'
      ? JSON.parse(eval_.notations_json)
      : eval_.notations_json ?? [];

    // Load criteres from rule if available
    let criteres: any[] = [];
    if (eval_.id_regle) {
      const regle = await this.pg.queryOne<any>(
        `SELECT criteres_evaluation_json FROM regles_evaluation WHERE id_regle = $1`,
        [eval_.id_regle],
      );
      if (regle) {
        const normalized = normalizeRuleRow(regle);
        const envelope = parseRuleEnvelope(normalized.criteres_evaluation_json);
        criteres = envelope.criteres;
      }
    }

    if (!notes.length && !criteres.length) {
      return { success: false, message: "L'évaluation est vide" };
    }

    const validResult = this.validationNotation.validatePourSoumission(notes, criteres);
    if (!validResult.valid) {
      return { success: false, message: validResult.errors.join('; ') };
    }

    const noteGlobale = this.validationNotation.calculerNoteGlobale(notes);

    await this.pg.execute(
      `UPDATE evaluations SET statut = 'soumis', date_soumission = NOW(), note_globale = $1, updated_at = NOW()
       WHERE id_evaluation = $2`,
      [noteGlobale, id],
    );

    // Notify manager (non-blocking)
    const evalue = await this.prisma.utilisateur.findUnique({ where: { matricule: eval_.evalue_matricule } });
    if (evalue?.manager_matricule) {
      this.notifications.create({
        destinataire_matricule: evalue.manager_matricule,
        titre: 'Nouvelle évaluation à valider',
        message: `Une évaluation de ${eval_.evaluateur?.prenom ?? ''} ${eval_.evaluateur?.nom ?? ''} pour ${evalue.prenom} ${evalue.nom} est en attente de validation.`,
        type: 'evaluation',
        id_evaluation: String(id),
        expediteur_matricule: eval_.evaluateur_matricule,
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
    const eval_ = await this.findById(id);

    if (eval_.statut !== 'soumis') {
      return { success: false, message: "L'évaluation n'est pas soumise" };
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
    return this.enrichEvaluations(evaluations);
  }

  async getAValider(managerMatricule: string): Promise<EnrichedEvaluation[]> {
    const subordonnes = await this.prisma.utilisateur.findMany({
      where: { manager_matricule: managerMatricule },
      select: { matricule: true },
    });

    const matricules = subordonnes.map((s: { matricule: string }) => s.matricule);
    if (!matricules.length) return [];

    const placeholders = matricules.map((_: string, i: number) => `$${i + 1}`).join(',');
    const evaluations = await this.pg.query<Evaluation>(
      `SELECT * FROM evaluations WHERE statut = 'soumis' AND evalue_matricule IN (${placeholders})
       ORDER BY date_soumission DESC`,
      matricules,
    );
    return this.enrichEvaluations(evaluations);
  }

  async getPeriodesActives() {
    return this.pg.query(
      `SELECT * FROM periodes_evaluation
       WHERE statut = 'ouverte' AND est_ouverte = true AND est_cloturee = false
         AND date_debut <= NOW() AND date_fin >= NOW()
       ORDER BY date_debut DESC`,
    );
  }

  async getHistorique(matricule: string, pagination?: { page?: number; limit?: number }) {
    const page = Math.max(1, pagination?.page ?? 1);
    const limit = Math.min(100, Math.max(1, pagination?.limit ?? 20));
    const offset = (page - 1) * limit;

    const [evaluations, countRow] = await Promise.all([
      this.pg.query<Evaluation>(
        `SELECT * FROM evaluations
         WHERE evaluateur_matricule = $1 OR evalue_matricule = $1
         ORDER BY date_creation DESC LIMIT $2 OFFSET $3`,
        [matricule, limit, offset],
      ),
      this.pg.queryOne<{ total: string }>(
        `SELECT COUNT(*)::text as total FROM evaluations
         WHERE evaluateur_matricule = $1 OR evalue_matricule = $1`,
        [matricule],
      ),
    ]);

    const data = await this.enrichEvaluations(evaluations);
    const total = parseInt(countRow?.total ?? '0');
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getHistoriqueGlobal(pagination?: { page?: number; limit?: number }) {
    const page = Math.max(1, pagination?.page ?? 1);
    const limit = Math.min(100, Math.max(1, pagination?.limit ?? 20));
    const offset = (page - 1) * limit;

    const [evaluations, countRow] = await Promise.all([
      this.pg.query<Evaluation>(
        `SELECT * FROM evaluations
         ORDER BY COALESCE(date_soumission, updated_at, created_at) DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      this.pg.queryOne<{ total: string }>(
        `SELECT COUNT(*)::text as total FROM evaluations`,
      ),
    ]);

    const data = await this.enrichEvaluations(evaluations);
    const total = parseInt(countRow?.total ?? '0');
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
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

    const evaluations = await this.pg.query<Evaluation>(
      `SELECT * FROM evaluations WHERE id_periode = $1 ORDER BY date_creation DESC`,
      [idPeriode],
    );

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

    return {
      rappels_envoyes: brouillons.length,
      jours_restants: joursRestants,
      matricules: brouillons.map(b => b.evaluateur_matricule),
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
    return poids > 0 ? Math.round((somme / poids) * 100) / 100 : null;
  }

  private async enrichEvaluations(evaluations: Evaluation[]): Promise<EnrichedEvaluation[]> {
    if (!evaluations.length) return [];

    const matricules = Array.from(
      new Set(
        evaluations.flatMap((evaluation) => [
          evaluation.evaluateur_matricule,
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
      evaluateur: usersByMatricule.get(evaluation.evaluateur_matricule) ?? null,
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
