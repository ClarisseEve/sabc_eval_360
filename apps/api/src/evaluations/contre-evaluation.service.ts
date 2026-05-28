import { Injectable, ForbiddenException } from '@nestjs/common';
import { DatabasePgService } from '../database/database-pg.service';
import { PrismaService } from '../prisma/prisma.service';

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
  async getContreEvaluations(evaluationId: string): Promise<any[]> {
    return this.pg.query<any>(
      `SELECT * FROM evaluations WHERE evaluation_parent_id = $1 ORDER BY created_at DESC`,
      [evaluationId],
    );
  }
}
