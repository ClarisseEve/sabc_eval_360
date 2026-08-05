import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DatabasePgService } from '../database/database-pg.service';
import { PrismaService } from '../prisma/prisma.service';
import type { EvaluationActor } from './evaluations.service';
import {
  INTERNAL_RULE_ENVELOPE_FIELD,
  isVisibleToEvaluated,
  redactEvaluationForVisibility,
  resolveEvaluationVisibilityPolicy,
} from './evaluation-visibility';

@Injectable()
export class ContreEvaluationService {
  constructor(
    private pg: DatabasePgService,
    private prisma: PrismaService,
  ) {}

  /**
   * Check if a manager can trigger a contre-evaluation for a given evaluation.
   * The manager must have been the validator of the original evaluation (validateur_matricule = managerMatricule)
   * OR be the direct manager of the evaluated user.
   */
  async canCreateContreEvaluation(
    managerMatricule: string,
    evaluationId: string,
  ): Promise<{ canCreate: boolean; reason?: string }> {
    const evaluation = await this.pg.queryOne<any>(
      `SELECT id_evaluation, statut, evalue_matricule, validateur_matricule, id_periode, id_regle, periode_code
       FROM evaluations
       WHERE id_evaluation = $1`,
      [evaluationId],
    );

    if (!evaluation) {
      return { canCreate: false, reason: 'Évaluation introuvable' };
    }

    if (evaluation.statut !== 'valide') {
      return {
        canCreate: false,
        reason: "Seules les évaluations validées peuvent faire l'objet d'une contre-évaluation",
      };
    }

    // Check if manager is the validateur of the original evaluation
    const isValidateur = evaluation.validateur_matricule === managerMatricule;

    // If not the validateur, check if manager is the direct MySQL manager of the evaluated
    let isDirectManager = false;
    if (!isValidateur) {
      const evalue = await this.prisma.utilisateur.findUnique({
        where: { matricule: evaluation.evalue_matricule },
      });
      isDirectManager = evalue?.manager_matricule === managerMatricule;
    }

    if (!isValidateur && !isDirectManager) {
      return { canCreate: false, reason: 'Non autorisé à créer une contre-évaluation' };
    }

    // Check if a contre-evaluation already exists for this evaluation
    const existing = await this.pg.queryOne<any>(
      `SELECT 1 FROM evaluations WHERE evaluation_parent_id = $1`,
      [evaluationId],
    );

    if (existing) {
      return { canCreate: false, reason: 'Une contre-évaluation existe déjà pour cette évaluation' };
    }

    return { canCreate: true };
  }

  /**
   * Create a contre-evaluation linked to the original evaluation.
   * The contre-evaluator is the manager, the evaluated is the same as the original.
   * The evaluation is linked via evaluation_parent_id column.
   */
  async createContreEvaluation(managerMatricule: string, evaluationId: string, motif?: string): Promise<any> {
    const { canCreate, reason } = await this.canCreateContreEvaluation(managerMatricule, evaluationId);
    if (!canCreate) {
      throw new ForbiddenException(reason);
    }

    const original = await this.pg.queryOne<any>(
      `SELECT * FROM evaluations WHERE id_evaluation = $1`,
      [evaluationId],
    );

    const created = await this.pg.queryOne<any>(
      `INSERT INTO evaluations
         (evaluateur_matricule, evalue_matricule, id_periode, id_regle,
          type_evaluation, statut, evaluation_parent_id, notations_json, periode_code, commentaire_global)
       VALUES ($1, $2, $3, $4, 'descendante', 'brouillon', $5, '[]', $6, $7)
       RETURNING *`,
      [
        managerMatricule,
        original.evalue_matricule,
        original.id_periode,
        original.id_regle,
        evaluationId,
        original.periode_code ?? null,
        motif?.trim() ?? null,
      ],
    );

    return created;
  }

  /**
   * List contre-evaluations for a given original evaluation.
   */
  async getContreEvaluations(evaluationId: string, actor: EvaluationActor): Promise<any[]> {
    const [original, contreEvaluations] = await Promise.all([
      this.pg.queryOne<any>(
        `SELECT id_evaluation, evaluateur_matricule, evalue_matricule, validateur_matricule
         FROM evaluations WHERE id_evaluation = $1`,
        [evaluationId],
      ),
      this.pg.query<any>(
        `SELECT e.*, r.criteres_evaluation_json AS ${INTERNAL_RULE_ENVELOPE_FIELD}
         FROM evaluations e
         LEFT JOIN regles_evaluation r ON r.id_regle = e.id_regle
         WHERE e.evaluation_parent_id = $1
         ORDER BY e.created_at DESC`,
        [evaluationId],
      ),
    ]);

    if (!original) throw new NotFoundException('Évaluation introuvable');
    if (!actor?.matricule) throw new ForbiddenException('Identité utilisateur introuvable');

    const role = String(actor.role_nom ?? actor.role ?? '').toUpperCase();
    const isAdmin = Boolean(actor.is_admin) || role === 'ADMIN';

    const isParticipant = [
      original.evaluateur_matricule,
      original.evalue_matricule,
      original.validateur_matricule,
    ].includes(actor.matricule);
    const ownsContreEvaluation = contreEvaluations.some(
      (evaluation) => evaluation.evaluateur_matricule === actor.matricule,
    );

    let isDirectManager = false;
    if (!isParticipant && !ownsContreEvaluation) {
      const evalue = await this.prisma.utilisateur.findUnique({
        where: { matricule: original.evalue_matricule },
        select: { manager_matricule: true },
      });
      isDirectManager = evalue?.manager_matricule === actor.matricule;
    }

    if (!isAdmin && !isParticipant && !ownsContreEvaluation && !isDirectManager) {
      throw new ForbiddenException('Non autorisé à consulter ces contre-évaluations');
    }

    return contreEvaluations.flatMap((evaluation) => {
      const policy = resolveEvaluationVisibilityPolicy(evaluation);
      const isOwner = evaluation.evaluateur_matricule === actor.matricule;
      const statusIsVisible =
        evaluation.statut === 'soumis' || evaluation.statut === 'valide';

      if (isOwner) {
        return [redactEvaluationForVisibility(evaluation, { policy, preserveDetails: true })];
      }
      if (isAdmin) {
        return policy.admin
          ? [redactEvaluationForVisibility(evaluation, { policy })]
          : [];
      }
      if (evaluation.evalue_matricule === actor.matricule) {
        return isVisibleToEvaluated(evaluation, policy)
          ? [redactEvaluationForVisibility(evaluation, { policy })]
          : [];
      }
      if (!statusIsVisible) return [];
      if (isDirectManager && !policy.manager_n1) return [];

      return [redactEvaluationForVisibility(evaluation, { policy })];
    });
  }
}
