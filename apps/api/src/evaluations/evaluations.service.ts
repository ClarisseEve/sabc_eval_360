import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DatabasePgService } from '../database/database-pg.service';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';

export interface Evaluation {
  id_evaluation: string;
  evaluateur_matricule: string;
  evalue_matricule: string;
  id_periode: string;
  id_regle: string | null;
  date_evaluation: string;
  date_soumission: string | null;
  statut: string;
  notations_json: any;
  commentaire_general: string | null;
  note_globale: number | null;
  type_evaluation: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class EvaluationsService {
  constructor(
    private pg: DatabasePgService,
    private prisma: PrismaService,
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

    const periode = await this.pg.queryOne('SELECT * FROM periodes_evaluation WHERE id_periode = $1', [idPeriode]);
    if (!periode || periode.statut !== 'ouverte' || !periode.est_ouverte) {
      throw new BadRequestException('Période non active');
    }

    const existing = await this.pg.queryOne(
      `SELECT * FROM evaluations WHERE evaluateur_matricule = $1 AND evalue_matricule = $2 AND id_periode = $3`,
      [evaluateurMatricule, evalueMatricule, idPeriode],
    );
    if (existing) return existing;

    const id = randomUUID();
    const typeEval = this.determinerType(evaluateur, evalue);

    await this.pg.execute(
      `INSERT INTO evaluations (id_evaluation, evaluateur_matricule, evalue_matricule, id_periode, id_regle,
        date_evaluation, statut, notations_json, type_evaluation, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), 'brouillon', '[]', $6, NOW(), NOW())`,
      [id, evaluateurMatricule, evalueMatricule, idPeriode, idRegle ?? null, typeEval],
    );

    return (await this.pg.queryOne('SELECT * FROM evaluations WHERE id_evaluation = $1', [id]))!;
  }

  async findById(id: string): Promise<Evaluation> {
    const eval_ = await this.pg.queryOne<Evaluation>('SELECT * FROM evaluations WHERE id_evaluation = $1', [id]);
    if (!eval_) throw new NotFoundException('Évaluation introuvable');
    return eval_;
  }

  async updateNotes(id: string, notes: any[], commentaire?: string): Promise<boolean> {
    const eval_ = await this.findById(id);
    if (eval_.statut !== 'brouillon') {
      throw new BadRequestException("L'évaluation n'est pas en brouillon");
    }

    await this.pg.execute(
      `UPDATE evaluations SET notations_json = $1, commentaire_general = $2, updated_at = NOW()
       WHERE id_evaluation = $3`,
      [JSON.stringify(notes), commentaire ?? null, id],
    );
    return true;
  }

  async submit(id: string): Promise<{ success: boolean; message: string }> {
    const eval_ = await this.findById(id);

    if (eval_.statut !== 'brouillon') {
      return { success: false, message: "L'évaluation n'est pas en brouillon" };
    }

    const notes = typeof eval_.notations_json === 'string'
      ? JSON.parse(eval_.notations_json)
      : eval_.notations_json ?? [];

    if (!notes.length) {
      return { success: false, message: "L'évaluation est vide" };
    }

    await this.pg.execute(
      `UPDATE evaluations SET statut = 'soumis', date_soumission = NOW(), updated_at = NOW()
       WHERE id_evaluation = $1`,
      [id],
    );

    return { success: true, message: 'Évaluation soumise avec succès' };
  }

  async validate(id: string, validateurMatricule: string, estValidee: boolean): Promise<{ success: boolean; message: string }> {
    const eval_ = await this.findById(id);

    if (eval_.statut !== 'soumis') {
      return { success: false, message: "L'évaluation n'est pas soumise" };
    }

    const evalue = await this.prisma.utilisateur.findUnique({ where: { matricule: eval_.evalue_matricule } });
    if (!evalue || evalue.manager_matricule !== validateurMatricule) {
      throw new ForbiddenException('Non autorisé à valider cette évaluation');
    }

    const nouveauStatut = estValidee ? 'valide' : 'brouillon';
    await this.pg.execute(
      'UPDATE evaluations SET statut = $1, updated_at = NOW() WHERE id_evaluation = $2',
      [nouveauStatut, id],
    );

    if (estValidee) {
      await this.updateScores(eval_.evalue_matricule, eval_.id_periode);
    }

    const message = estValidee ? 'Évaluation validée avec succès' : 'Évaluation renvoyée en brouillon';
    return { success: true, message };
  }

  async getEnAttente(matricule: string): Promise<Evaluation[]> {
    return this.pg.query<Evaluation>(
      `SELECT * FROM evaluations WHERE evaluateur_matricule = $1 AND statut IN ('brouillon', 'soumis')
       ORDER BY date_evaluation DESC`,
      [matricule],
    );
  }

  async getAValider(managerMatricule: string): Promise<Evaluation[]> {
    const subordonnes = await this.prisma.utilisateur.findMany({
      where: { manager_matricule: managerMatricule },
      select: { matricule: true },
    });

    const matricules = subordonnes.map(s => s.matricule);
    if (!matricules.length) return [];

    const placeholders = matricules.map((_, i) => `$${i + 1}`).join(',');
    return this.pg.query<Evaluation>(
      `SELECT * FROM evaluations WHERE statut = 'soumis' AND evalue_matricule IN (${placeholders})
       ORDER BY date_soumission DESC`,
      matricules,
    );
  }

  async getPeriodesActives() {
    return this.pg.query(
      `SELECT * FROM periodes_evaluation
       WHERE statut = 'ouverte' AND est_ouverte = true AND est_cloturee = false
         AND date_debut <= NOW() AND date_fin >= NOW()
       ORDER BY date_debut DESC`,
    );
  }

  async getHistorique(matricule: string): Promise<Evaluation[]> {
    return this.pg.query<Evaluation>(
      `SELECT * FROM evaluations
       WHERE evaluateur_matricule = $1 OR evalue_matricule = $1
       ORDER BY date_evaluation DESC`,
      [matricule],
    );
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
}
