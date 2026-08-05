import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabasePgService } from '../database/database-pg.service';

export interface PeriodeEvaluation {
  id_periode: string;
  code_periode: string;
  nom_periode: string;
  description: string | null;
  date_debut: string;
  date_fin: string;
  statut: string;
  est_ouverte: boolean;
  est_cloturee: boolean;
  nb_evaluations_attendues: number;
  nb_evaluations_completees: number;
  taux_completion: number;
  statistiques_json: any;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class PeriodesService {
  constructor(private pg: DatabasePgService) {}

  async findAll(): Promise<PeriodeEvaluation[]> {
    return this.pg.query<PeriodeEvaluation>('SELECT * FROM periodes_evaluation ORDER BY date_debut DESC');
  }

  async findById(id: string): Promise<PeriodeEvaluation> {
    const p = await this.pg.queryOne<PeriodeEvaluation>(
      'SELECT * FROM periodes_evaluation WHERE id_periode = $1', [id],
    );
    if (!p) throw new NotFoundException('Période introuvable');
    return p;
  }

  async findActive(): Promise<PeriodeEvaluation | null> {
    return this.pg.queryOne<PeriodeEvaluation>(
      `SELECT * FROM periodes_evaluation
       WHERE statut = 'ouverte' AND est_ouverte = true AND est_cloturee = false
         AND (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala')::date
             BETWEEN date_debut AND date_fin
       ORDER BY date_debut DESC LIMIT 1`,
    );
  }

  async create(data: { code_periode: string; nom_periode: string; description?: string; date_debut: string; date_fin: string }): Promise<PeriodeEvaluation> {
    this.validateDates(new Date(data.date_debut), new Date(data.date_fin), true);
    await this.validateNoChevauchement(new Date(data.date_debut), new Date(data.date_fin));

    // PostgreSQL génère la clé UUID canonique, ensuite propagée telle quelle
    // aux évaluations, assignations, rapports et statistiques.
    const created = await this.pg.queryOne<{ id_periode: string }>(
      `INSERT INTO periodes_evaluation (code_periode, nom_periode, description, date_debut, date_fin,
        statut, est_ouverte, est_cloturee, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'planifiee', false, false, NOW(), NOW())
       RETURNING id_periode`,
      [data.code_periode, data.nom_periode, data.description ?? null, data.date_debut, data.date_fin],
    );

    return this.findById(String(created!.id_periode));
  }

  async update(id: string, data: Partial<{ nom_periode: string; description: string; date_debut: string; date_fin: string }>): Promise<PeriodeEvaluation> {
    const periode = await this.findById(id);

    if (periode.statut !== 'planifiee' || periode.est_ouverte || periode.est_cloturee) {
      throw new BadRequestException('Cette période ne peut plus être modifiée');
    }

    if (data.date_debut || data.date_fin) {
      const debut = new Date(data.date_debut ?? periode.date_debut);
      const fin = new Date(data.date_fin ?? periode.date_fin);
      this.validateDates(debut, fin, false);
      await this.validateNoChevauchement(debut, fin, id);
    }

    // Whitelist of columns allowed in UPDATE to prevent SQL injection via key names
    const ALLOWED_COLUMNS: Record<string, string> = {
      nom_periode: 'nom_periode',
      description: 'description',
      date_debut: 'date_debut',
      date_fin: 'date_fin',
    };

    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const col = ALLOWED_COLUMNS[key];
        if (!col) continue; // skip unknown/disallowed keys
        sets.push(`${col} = $${idx}`);
        params.push(value);
        idx++;
      }
    }

    if (sets.length) {
      params.push(id);
      await this.pg.execute(
        `UPDATE periodes_evaluation SET ${sets.join(', ')}, updated_at = NOW() WHERE id_periode = $${idx}`,
        params,
      );
    }

    return this.findById(id);
  }

  async ouvrir(id: string): Promise<PeriodeEvaluation> {
    return this.pg.withTransaction(async (client) => {
      // Serialize opening attempts across API replicas. A conditional UPDATE alone
      // would allow two different planned rows to be opened concurrently (write skew).
      await client.query(
        `SELECT pg_advisory_xact_lock(hashtext('sabc_eval360:periode-opening'))`,
      );

      const updated = await client.query(
        `UPDATE periodes_evaluation AS p
         SET est_ouverte = true,
             est_cloturee = false,
             statut = 'ouverte',
             updated_at = NOW()
         WHERE p.id_periode = $1
           AND p.statut = 'planifiee'
           AND p.est_ouverte = false
           AND p.est_cloturee = false
           AND (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala')::date
               BETWEEN p.date_debut AND p.date_fin
           AND NOT EXISTS (
             SELECT 1
             FROM periodes_evaluation AS active
             WHERE active.id_periode <> p.id_periode
               AND active.statut = 'ouverte'
               AND active.est_ouverte = true
               AND active.est_cloturee = false
           )
         RETURNING p.*`,
        [id],
      );

      if (updated.rows[0]) {
        return updated.rows[0] as PeriodeEvaluation;
      }

      const current = await client.query(
        `SELECT p.*,
                ((CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Douala')::date
                  BETWEEN p.date_debut AND p.date_fin) AS dans_intervalle,
                EXISTS (
                  SELECT 1
                  FROM periodes_evaluation AS active
                  WHERE active.id_periode <> p.id_periode
                    AND active.statut = 'ouverte'
                    AND active.est_ouverte = true
                    AND active.est_cloturee = false
                ) AS autre_periode_ouverte
         FROM periodes_evaluation AS p
         WHERE p.id_periode = $1`,
        [id],
      );
      const periode = current.rows[0];

      if (!periode) throw new NotFoundException('Période introuvable');
      if (periode.autre_periode_ouverte) {
        throw new BadRequestException('Une autre période est déjà ouverte');
      }
      if (periode.statut !== 'planifiee' || periode.est_ouverte || periode.est_cloturee) {
        throw new BadRequestException("Seule une période planifiée peut être ouverte");
      }
      if (!periode.dans_intervalle) {
        throw new BadRequestException("La période ne peut être ouverte qu'entre ses dates de début et de fin");
      }

      throw new BadRequestException("La période n'a pas pu être ouverte");
    });
  }

  async fermer(id: string): Promise<PeriodeEvaluation> {
    const p = await this.findById(id);
    if (p.est_cloturee) throw new BadRequestException('Période déjà fermée');

    // calculateStatistiques + state transition must be atomic to avoid a permanently
    // half-closed period if the process crashes between the two statements.
    await this.pg.withTransaction(async (client) => {
      // 1. Compute and persist statistics within the transaction
      const stats = await client.query(
        `SELECT
           COUNT(*) as nb_total,
           COUNT(*) FILTER (WHERE statut = 'brouillon') as nb_brouillon,
           COUNT(*) FILTER (WHERE statut = 'soumis') as nb_soumises,
           COUNT(*) FILTER (WHERE statut = 'valide') as nb_validees,
           COUNT(*) FILTER (WHERE statut = 'rejete') as nb_rejetees
         FROM evaluations WHERE id_periode = $1`,
        [id],
      );
      const row = stats.rows[0] ?? {};
      const nbTotal = parseInt(row.nb_total ?? '0');
      const nbValidees = parseInt(row.nb_validees ?? '0');
      const tauxCompletion = nbTotal > 0 ? Math.round((nbValidees / nbTotal) * 10000) / 100 : 0;

      await client.query(
        `UPDATE periodes_evaluation SET
           nb_evaluations_attendues = $1, nb_evaluations_completees = $2, taux_completion = $3,
           statistiques_json = $4, updated_at = NOW()
         WHERE id_periode = $5`,
        [nbTotal, nbValidees, tauxCompletion, JSON.stringify(row), id],
      );

      // 2. Close the period in the same transaction
      await client.query(
        `UPDATE periodes_evaluation SET est_ouverte = false, est_cloturee = true, statut = 'fermee', updated_at = NOW()
         WHERE id_periode = $1`,
        [id],
      );
    });

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    const count = await this.pg.queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM evaluations WHERE id_periode = $1', [id],
    );
    if (count && parseInt(count.count) > 0) {
      throw new BadRequestException('Impossible de supprimer : des évaluations existent pour cette période');
    }
    await this.pg.execute('DELETE FROM periodes_evaluation WHERE id_periode = $1', [id]);
  }

  async calculateStatistiques(id: string) {
    await this.findById(id);
    const stats = await this.pg.queryOne<any>(
      `SELECT
         COUNT(*) as nb_total,
         COUNT(*) FILTER (WHERE statut = 'brouillon') as nb_brouillon,
         COUNT(*) FILTER (WHERE statut = 'soumis') as nb_soumises,
         COUNT(*) FILTER (WHERE statut = 'valide') as nb_validees,
         COUNT(*) FILTER (WHERE statut = 'rejete') as nb_rejetees
       FROM evaluations WHERE id_periode = $1`,
      [id],
    );

    const nbTotal = parseInt(stats?.nb_total ?? '0');
    const nbValidees = parseInt(stats?.nb_validees ?? '0');
    const tauxCompletion = nbTotal > 0 ? Math.round((nbValidees / nbTotal) * 10000) / 100 : 0;

    await this.pg.execute(
      `UPDATE periodes_evaluation SET
         nb_evaluations_attendues = $1, nb_evaluations_completees = $2, taux_completion = $3,
         statistiques_json = $4, updated_at = NOW()
       WHERE id_periode = $5`,
      [nbTotal, nbValidees, tauxCompletion, JSON.stringify(stats), id],
    );

    return { ...stats, taux_completion: tauxCompletion };
  }

  // --- Validation helpers ---

  private validateDates(debut: Date, fin: Date, isCreation: boolean): void {
    if (debut >= fin) {
      throw new BadRequestException('La date de début doit être antérieure à la date de fin');
    }
    if (isCreation && debut < new Date()) {
      throw new BadRequestException('La date de début doit être dans le futur');
    }
    const diffDays = Math.round((fin.getTime() - debut.getTime()) / 86400000);
    if (diffDays < 7) throw new BadRequestException('La période doit durer au moins 7 jours');
    if (diffDays > 180) throw new BadRequestException('La période ne peut pas dépasser 180 jours');
  }

  private async validateNoChevauchement(debut: Date, fin: Date, excludeId?: string): Promise<void> {
    const params: any[] = [debut.toISOString(), fin.toISOString()];
    let exclude = '';
    if (excludeId) {
      exclude = ' AND id_periode != $3';
      params.push(excludeId);
    }
    const overlap = await this.pg.queryOne(
      `SELECT nom_periode, date_debut, date_fin FROM periodes_evaluation
       WHERE (date_debut <= $2 AND date_fin >= $1)${exclude}
       LIMIT 1`,
      params,
    );
    if (overlap) {
      throw new BadRequestException(`Chevauchement avec la période "${overlap.nom_periode}"`);
    }
  }
}
