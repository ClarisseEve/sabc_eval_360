import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabasePgService } from '../database/database-pg.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly serviceUrl: string;
  private readonly serviceKey: string;
  private readonly enabled: boolean;

  constructor(
    private config: ConfigService,
    private pg: DatabasePgService,
  ) {
    this.serviceUrl = config.get('ANALYTICS_SERVICE_URL', 'http://analytics-service:8080');
    this.serviceKey = config.get('ANALYTICS_SERVICE_KEY', 'internal-service-key');
    this.enabled = config.get('ANALYTICS_MICROSERVICE_ENABLED', 'false') === 'true';
  }

  async getDashboard(filters: { start_date?: string; end_date?: string } = {}) {
    if (this.enabled) {
      try {
        const res = await fetch(`${this.serviceUrl}/api/v2/analytics`, {
          headers: { 'X-Service-Key': this.serviceKey },
        });
        if (res.ok) {
          const payload = await res.json();
          return payload.data;
        }
      } catch (e: any) {
        this.logger.warn(`Analytics microservice failed: ${e.message}`);
      }
    }
    return this.getDashboardFallback(filters);
  }

  async getEvaluationsStats(filters: { start_date?: string; end_date?: string } = {}) {
    const startDate = filters.start_date ?? this.sixMonthsAgo();
    const endDate = filters.end_date ?? new Date().toISOString().split('T')[0];

    return this.pg.query(
      `SELECT statut, COUNT(*) as count
       FROM evaluations
       WHERE date_evaluation BETWEEN $1 AND $2
       GROUP BY statut`,
      [startDate, endDate],
    );
  }

  async getPerformances(filters: { start_date?: string; end_date?: string } = {}) {
    const startDate = filters.start_date ?? this.sixMonthsAgo();
    const endDate = filters.end_date ?? new Date().toISOString().split('T')[0];

    return this.pg.query(
      `SELECT type_evaluation as channel,
              AVG(note_globale) as average_score,
              COUNT(*) as count
       FROM evaluations
       WHERE date_evaluation BETWEEN $1 AND $2 AND note_globale IS NOT NULL
       GROUP BY type_evaluation`,
      [startDate, endDate],
    );
  }

  async getRegionAnalytics(idRegion: string) {
    return this.pg.query(
      `SELECT
         COUNT(*) as total_evaluations,
         COUNT(*) FILTER (WHERE statut = 'valide') as validees,
         AVG(note_globale) FILTER (WHERE note_globale IS NOT NULL) as score_moyen
       FROM evaluations
       WHERE evalue_matricule IN (
         SELECT matricule FROM utilisateurs WHERE id_region = $1
       )`,
      [idRegion],
    );
  }

  // Fallback when microservice is unavailable
  private async getDashboardFallback(filters: { start_date?: string; end_date?: string }) {
    const startDate = filters.start_date ?? this.sixMonthsAgo();
    const endDate = filters.end_date ?? new Date().toISOString().split('T')[0];

    const kpis = await this.pg.queryOne<any>(
      `SELECT
         COUNT(*) as total_evaluations,
         COUNT(DISTINCT evalue_matricule) as unique_users,
         AVG(note_globale) as average_score
       FROM evaluations
       WHERE date_evaluation BETWEEN $1 AND $2`,
      [startDate, endDate],
    );

    const channels = await this.pg.query(
      `SELECT type_evaluation as channel, COUNT(*) as total, AVG(note_globale) as average_score
       FROM evaluations
       WHERE date_evaluation BETWEEN $1 AND $2
       GROUP BY type_evaluation`,
      [startDate, endDate],
    );

    const trends = await this.pg.query(
      `SELECT TO_CHAR(date_evaluation, 'YYYY-MM') as period,
              AVG(note_globale) as score, COUNT(*) as count
       FROM evaluations
       WHERE date_evaluation BETWEEN $1 AND $2
       GROUP BY TO_CHAR(date_evaluation, 'YYYY-MM')
       ORDER BY period`,
      [startDate, endDate],
    );

    return {
      kpis: {
        total_evaluations: parseInt(kpis?.total_evaluations ?? '0'),
        unique_users: parseInt(kpis?.unique_users ?? '0'),
        average_score: parseFloat(kpis?.average_score ?? '0'),
      },
      channel_distribution: channels,
      performance_trend: trends,
    };
  }

  // ─── Axes d'amélioration pour un utilisateur ─────────────────────────────
  async getAxesAmelioration(matricule: string) {
    const evaluations = await this.pg.query<any>(
      `SELECT notations_json, type_evaluation, note_globale
       FROM evaluations
       WHERE evalue_matricule = $1 AND statut = 'valide' AND notations_json IS NOT NULL
       ORDER BY date_evaluation DESC LIMIT 20`,
      [matricule],
    );

    if (!evaluations.length) return { axes: [], message: 'Aucune évaluation validée trouvée' };

    // Aggregate scores by criteria
    const criteriaScores: Record<string, { total: number; count: number; comments: string[] }> = {};

    for (const ev of evaluations) {
      const notes = typeof ev.notations_json === 'string' ? JSON.parse(ev.notations_json) : ev.notations_json ?? [];
      for (const note of notes) {
        const key = note.nom ?? note.critere ?? note.categorie ?? `critere_${Object.keys(criteriaScores).length}`;
        if (!criteriaScores[key]) criteriaScores[key] = { total: 0, count: 0, comments: [] };
        if (note.note != null) {
          criteriaScores[key].total += note.note;
          criteriaScores[key].count++;
        }
        if (note.commentaire && note.note < 3) {
          criteriaScores[key].comments.push(note.commentaire);
        }
      }
    }

    // Identify weak areas (moyenne < 3/5)
    const axes = Object.entries(criteriaScores)
      .map(([critere, data]) => ({
        critere,
        moyenne: data.count > 0 ? Math.round((data.total / data.count) * 100) / 100 : 0,
        nb_evaluations: data.count,
        commentaires: data.comments.slice(0, 3),
      }))
      .filter(a => a.moyenne < 3)
      .sort((a, b) => a.moyenne - b.moyenne);

    // Generate suggestions
    const suggestions = axes.map(axe => ({
      critere: axe.critere,
      score_actuel: axe.moyenne,
      priorite: axe.moyenne < 2 ? 'haute' : 'moyenne',
      suggestion: this.genererSuggestion(axe.critere, axe.moyenne),
      objectif_smart: this.genererObjectifSmart(axe.critere, axe.moyenne),
      commentaires_evaluateurs: axe.commentaires,
    }));

    // Strengths (score >= 4)
    const forces = Object.entries(criteriaScores)
      .map(([critere, data]) => ({
        critere,
        moyenne: data.count > 0 ? Math.round((data.total / data.count) * 100) / 100 : 0,
      }))
      .filter(a => a.moyenne >= 4)
      .sort((a, b) => b.moyenne - a.moyenne);

    return { axes_amelioration: suggestions, forces, total_criteres: Object.keys(criteriaScores).length };
  }

  // ─── Détection d'anomalies ───────────────────────────────────────────────
  async detecterAnomalies(matricule?: string, idRegion?: string) {
    const anomalies: Array<{
      type: string;
      description: string;
      severite: 'info' | 'warning' | 'critical';
      matricule?: string;
      details: Record<string, any>;
    }> = [];

    // All queries below use parameterized $1 placeholders — never string interpolation.
    const params = matricule ? [matricule] : [];

    // 1. Divergence auto-évaluation vs évaluations des autres (seuil: 1.5 pts)
    const divergences = await this.pg.query<any>(
      `SELECT
         e_auto.evalue_matricule as matricule,
         AVG(e_auto.note_globale) as score_auto,
         AVG(e_autres.note_globale) as score_autres,
         ABS(AVG(e_auto.note_globale) - AVG(e_autres.note_globale)) as divergence
       FROM evaluations e_auto
       JOIN evaluations e_autres ON e_auto.evalue_matricule = e_autres.evalue_matricule
         AND e_auto.id_periode = e_autres.id_periode
       WHERE e_auto.type_evaluation = 'auto' AND e_auto.statut = 'valide'
         AND e_autres.type_evaluation != 'auto' AND e_autres.statut = 'valide'
         AND e_auto.note_globale IS NOT NULL AND e_autres.note_globale IS NOT NULL
         ${matricule ? 'AND e_auto.evalue_matricule = $1' : ''}
       GROUP BY e_auto.evalue_matricule
       HAVING ABS(AVG(e_auto.note_globale) - AVG(e_autres.note_globale)) > 1.5`,
      params,
    );

    for (const d of divergences) {
      anomalies.push({
        type: 'divergence_auto_vs_autres',
        description: `Écart significatif entre l'auto-évaluation (${parseFloat(d.score_auto).toFixed(1)}) et les évaluations externes (${parseFloat(d.score_autres).toFixed(1)})`,
        severite: parseFloat(d.divergence) > 2.5 ? 'critical' : 'warning',
        matricule: d.matricule,
        details: {
          score_auto: parseFloat(d.score_auto),
          score_autres: parseFloat(d.score_autres),
          ecart: parseFloat(d.divergence),
        },
      });
    }

    // 2. Baisse de performance (progression < -1 pt sur 3 mois)
    const baisses = await this.pg.query<any>(
      `WITH recent AS (
         SELECT evalue_matricule, AVG(note_globale) as score_recent
         FROM evaluations
         WHERE statut = 'valide' AND note_globale IS NOT NULL
           AND date_evaluation >= NOW() - INTERVAL '3 months'
           ${matricule ? 'AND evalue_matricule = $1' : ''}
         GROUP BY evalue_matricule
       ),
       ancien AS (
         SELECT evalue_matricule, AVG(note_globale) as score_ancien
         FROM evaluations
         WHERE statut = 'valide' AND note_globale IS NOT NULL
           AND date_evaluation < NOW() - INTERVAL '3 months'
           AND date_evaluation >= NOW() - INTERVAL '6 months'
           ${matricule ? 'AND evalue_matricule = $1' : ''}
         GROUP BY evalue_matricule
       )
       SELECT r.evalue_matricule as matricule,
              r.score_recent, a.score_ancien,
              r.score_recent - a.score_ancien as progression
       FROM recent r JOIN ancien a ON r.evalue_matricule = a.evalue_matricule
       WHERE r.score_recent - a.score_ancien < -1`,
      params,
    );

    for (const b of baisses) {
      anomalies.push({
        type: 'baisse_performance',
        description: `Baisse de performance de ${Math.abs(parseFloat(b.progression)).toFixed(1)} points sur 3 mois`,
        severite: parseFloat(b.progression) < -2 ? 'critical' : 'warning',
        matricule: b.matricule,
        details: {
          score_recent: parseFloat(b.score_recent),
          score_ancien: parseFloat(b.score_ancien),
          progression: parseFloat(b.progression),
        },
      });
    }

    // 3. Uniformité des évaluations (variance < 0.5 = manque de différenciation)
    const uniformites = await this.pg.query<any>(
      `SELECT evaluateur_matricule as matricule,
              COUNT(*) as nb_evaluations,
              VARIANCE(note_globale) as variance_notes,
              AVG(note_globale) as moyenne_notes
       FROM evaluations
       WHERE statut = 'valide' AND note_globale IS NOT NULL AND type_evaluation != 'auto'
         ${matricule ? 'AND evaluateur_matricule = $1' : ''}
       GROUP BY evaluateur_matricule
       HAVING COUNT(*) >= 3 AND VARIANCE(note_globale) < 0.5`,
      params,
    );

    for (const u of uniformites) {
      anomalies.push({
        type: 'uniformite_evaluations',
        description: `Évaluations trop uniformes (variance: ${parseFloat(u.variance_notes).toFixed(2)}) — manque de différenciation`,
        severite: 'warning',
        matricule: u.matricule,
        details: {
          nb_evaluations: parseInt(u.nb_evaluations),
          variance: parseFloat(u.variance_notes),
          moyenne: parseFloat(u.moyenne_notes),
        },
      });
    }

    // 4. Biais évaluateur (moyenne systématiquement haute/basse vs moyenne globale)
    const biaisResult = await this.pg.query<any>(
      `WITH global_avg AS (
         SELECT AVG(note_globale) as avg_global FROM evaluations
         WHERE statut = 'valide' AND note_globale IS NOT NULL AND type_evaluation != 'auto'
       )
       SELECT e.evaluateur_matricule as matricule,
              AVG(e.note_globale) as moyenne_evaluateur,
              g.avg_global,
              AVG(e.note_globale) - g.avg_global as ecart_vs_global,
              COUNT(*) as nb_evaluations
       FROM evaluations e, global_avg g
       WHERE e.statut = 'valide' AND e.note_globale IS NOT NULL AND e.type_evaluation != 'auto'
         ${matricule ? 'AND e.evaluateur_matricule = $1' : ''}
       GROUP BY e.evaluateur_matricule, g.avg_global
       HAVING COUNT(*) >= 3 AND ABS(AVG(e.note_globale) - g.avg_global) > 1`,
      params,
    );

    for (const b of biaisResult) {
      const direction = parseFloat(b.ecart_vs_global) > 0 ? 'haute' : 'basse';
      anomalies.push({
        type: 'biais_evaluateur',
        description: `Notation systématiquement ${direction} (${parseFloat(b.ecart_vs_global).toFixed(1)} pts vs moyenne globale)`,
        severite: Math.abs(parseFloat(b.ecart_vs_global)) > 1.5 ? 'critical' : 'warning',
        matricule: b.matricule,
        details: {
          moyenne_evaluateur: parseFloat(b.moyenne_evaluateur),
          moyenne_globale: parseFloat(b.avg_global),
          ecart: parseFloat(b.ecart_vs_global),
          direction,
          nb_evaluations: parseInt(b.nb_evaluations),
        },
      });
    }

    return {
      anomalies,
      total: anomalies.length,
      par_severite: {
        critical: anomalies.filter(a => a.severite === 'critical').length,
        warning: anomalies.filter(a => a.severite === 'warning').length,
        info: anomalies.filter(a => a.severite === 'info').length,
      },
    };
  }

  // ─── Recommandations personnalisées ─────────────────────────────────────
  async getRecommandations(matricule: string) {
    const [axes, scores, user] = await Promise.all([
      this.getAxesAmelioration(matricule),
      this.getScoresUtilisateur(matricule),
      this.pg.queryOne<any>(
        `SELECT u.matricule, u.nom, u.prenom, u.role, u.id_region, u.niveau_hierarchique
         FROM utilisateurs u WHERE u.matricule = $1`,
        [matricule],
      ),
    ]);

    const recommandations: Array<{
      type: 'formation' | 'mentorat' | 'mobilite' | 'plan_developpement';
      priorite: 'haute' | 'moyenne' | 'basse';
      titre: string;
      description: string;
      details: Record<string, any>;
    }> = [];

    // 1. Formations basées sur critères faibles (< 3/5)
    if (axes.axes_amelioration) {
      for (const axe of axes.axes_amelioration) {
        recommandations.push({
          type: 'formation',
          priorite: axe.priorite as 'haute' | 'moyenne',
          titre: `Formation : ${axe.critere}`,
          description: `Score actuel de ${axe.score_actuel}/5. ${axe.suggestion}`,
          details: {
            critere: axe.critere,
            score_actuel: axe.score_actuel,
            objectif: axe.objectif_smart,
          },
        });
      }
    }

    // 2. Mentorat : matching experts/apprenants dans la même région
    if (scores.score_global !== null && scores.score_global < 3 && user) {
      const mentors = await this.pg.query<any>(
        `SELECT DISTINCT e.evalue_matricule as matricule, u.nom, u.prenom, u.role,
                AVG(e.note_globale) as score_moyen
         FROM evaluations e
         JOIN utilisateurs u ON e.evalue_matricule = u.matricule
         WHERE e.statut = 'valide' AND e.note_globale IS NOT NULL
           AND u.id_region = $1 AND u.est_actif = true
           AND e.evalue_matricule != $2
         GROUP BY e.evalue_matricule, u.nom, u.prenom, u.role
         HAVING AVG(e.note_globale) >= 4
         ORDER BY AVG(e.note_globale) DESC LIMIT 3`,
        [user.id_region, matricule],
      );

      if (mentors.length) {
        recommandations.push({
          type: 'mentorat',
          priorite: 'haute',
          titre: 'Programme de mentorat recommandé',
          description: `Score global de ${scores.score_global.toFixed(1)}/5. Un accompagnement par un pair performant est conseillé.`,
          details: {
            score_actuel: scores.score_global,
            mentors_suggerees: mentors.map((m: any) => ({
              matricule: m.matricule,
              nom_complet: `${m.prenom} ${m.nom}`,
              role: m.role,
              score_moyen: parseFloat(m.score_moyen).toFixed(1),
            })),
          },
        });
      }
    }

    // 3. Mobilité : talents avec forte progression et score élevé
    if (scores.score_global !== null && scores.score_global >= 4 && scores.progression > 0.5) {
      recommandations.push({
        type: 'mobilite',
        priorite: 'moyenne',
        titre: 'Potentiel de mobilité identifié',
        description: `Score élevé (${scores.score_global.toFixed(1)}/5) avec progression positive (+${scores.progression.toFixed(1)}). Ce collaborateur pourrait bénéficier de responsabilités élargies.`,
        details: {
          score_global: scores.score_global,
          progression: scores.progression,
          suggestion: user?.niveau_hierarchique > 1
            ? 'Considérer pour un poste de niveau supérieur'
            : 'Proposer des missions transversales ou inter-régions',
        },
      });
    }

    // 4. Plan de développement basé sur les faiblesses
    if (axes.axes_amelioration && axes.axes_amelioration.length > 0) {
      recommandations.push({
        type: 'plan_developpement',
        priorite: axes.axes_amelioration.some((a: any) => a.priorite === 'haute') ? 'haute' : 'moyenne',
        titre: 'Plan de développement personnalisé',
        description: `${axes.axes_amelioration.length} axe(s) d'amélioration identifié(s). Objectifs SMART générés.`,
        details: {
          nb_axes: axes.axes_amelioration.length,
          objectifs: axes.axes_amelioration.map((a: any) => ({
            critere: a.critere,
            objectif: a.objectif_smart,
            echeance: '3 mois',
          })),
          forces: axes.forces?.slice(0, 3) ?? [],
        },
      });
    }

    return {
      matricule,
      recommandations,
      total: recommandations.length,
      par_type: {
        formation: recommandations.filter(r => r.type === 'formation').length,
        mentorat: recommandations.filter(r => r.type === 'mentorat').length,
        mobilite: recommandations.filter(r => r.type === 'mobilite').length,
        plan_developpement: recommandations.filter(r => r.type === 'plan_developpement').length,
      },
    };
  }

  // ─── Scores détaillés utilisateur ────────────────────────────────────────
  async getScoresUtilisateur(matricule: string) {
    const recent = await this.pg.queryOne<any>(
      `SELECT AVG(note_globale) as score_recent
       FROM evaluations
       WHERE evalue_matricule = $1 AND statut = 'valide' AND note_globale IS NOT NULL
         AND date_evaluation >= NOW() - INTERVAL '6 months'`,
      [matricule],
    );

    const ancien = await this.pg.queryOne<any>(
      `SELECT AVG(note_globale) as score_ancien
       FROM evaluations
       WHERE evalue_matricule = $1 AND statut = 'valide' AND note_globale IS NOT NULL
         AND date_evaluation < NOW() - INTERVAL '6 months'
         AND date_evaluation >= NOW() - INTERVAL '12 months'`,
      [matricule],
    );

    const parType = await this.pg.query<any>(
      `SELECT type_evaluation, AVG(note_globale) as moyenne, COUNT(*) as nb
       FROM evaluations
       WHERE evalue_matricule = $1 AND statut = 'valide' AND note_globale IS NOT NULL
       GROUP BY type_evaluation`,
      [matricule],
    );

    const scoreGlobal = recent?.score_recent ? parseFloat(recent.score_recent) : null;
    const scoreAncien = ancien?.score_ancien ? parseFloat(ancien.score_ancien) : null;

    // Calcul pondéré selon règles SABC : auto 20%, pairs 40%, manager 40%
    const autoScore = parType.find((p: any) => p.type_evaluation === 'auto');
    const pairsScore = parType.find((p: any) => p.type_evaluation === 'pairs');
    const managerScore = parType.find((p: any) => p.type_evaluation === 'descendante');

    let scorePondere: number | null = null;
    if (autoScore || pairsScore || managerScore) {
      let total = 0;
      let poids = 0;
      if (autoScore) { total += parseFloat(autoScore.moyenne) * 0.2; poids += 0.2; }
      if (pairsScore) { total += parseFloat(pairsScore.moyenne) * 0.4; poids += 0.4; }
      if (managerScore) { total += parseFloat(managerScore.moyenne) * 0.4; poids += 0.4; }
      scorePondere = poids > 0 ? Math.round((total / poids) * 100) / 100 : null;
    }

    return {
      score_global: scoreGlobal ? Math.round(scoreGlobal * 100) / 100 : null,
      score_pondere: scorePondere,
      progression: scoreGlobal && scoreAncien ? Math.round((scoreGlobal - scoreAncien) * 100) / 100 : 0,
      par_type: parType.map((p: any) => ({
        type: p.type_evaluation,
        moyenne: Math.round(parseFloat(p.moyenne) * 100) / 100,
        nb_evaluations: parseInt(p.nb),
      })),
    };
  }

  // ─── Classement régional (anonymisé) ────────────────────────────────────
  async getClassementRegional(idRegion: string) {
    const classement = await this.pg.query<any>(
      `SELECT
         e.evalue_matricule,
         AVG(e.note_globale) as score_moyen,
         COUNT(*) as nb_evaluations
       FROM evaluations e
       JOIN utilisateurs u ON e.evalue_matricule = u.matricule
       WHERE u.id_region = $1 AND e.statut = 'valide' AND e.note_globale IS NOT NULL
       GROUP BY e.evalue_matricule
       HAVING COUNT(*) >= 2
       ORDER BY AVG(e.note_globale) DESC`,
      [idRegion],
    );

    return {
      region: idRegion,
      total_evalues: classement.length,
      moyenne_region: classement.length > 0
        ? Math.round(classement.reduce((s: number, c: any) => s + parseFloat(c.score_moyen), 0) / classement.length * 100) / 100
        : null,
      distribution: {
        excellent: classement.filter((c: any) => parseFloat(c.score_moyen) >= 4).length,
        bon: classement.filter((c: any) => parseFloat(c.score_moyen) >= 3 && parseFloat(c.score_moyen) < 4).length,
        moyen: classement.filter((c: any) => parseFloat(c.score_moyen) >= 2 && parseFloat(c.score_moyen) < 3).length,
        faible: classement.filter((c: any) => parseFloat(c.score_moyen) < 2).length,
      },
    };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private genererSuggestion(critere: string, score: number): string {
    const critLower = critere.toLowerCase();
    if (critLower.includes('leadership') || critLower.includes('management'))
      return 'Formation en leadership et gestion d\'équipe recommandée. Participer à des ateliers de coaching.';
    if (critLower.includes('communication'))
      return 'Développer les compétences en communication orale et écrite. Exercices de prise de parole.';
    if (critLower.includes('technique') || critLower.includes('compétence'))
      return 'Programme de mise à niveau technique. Formations certifiantes dans le domaine concerné.';
    if (critLower.includes('autonomie'))
      return 'Confier progressivement des tâches avec moins de supervision. Suivi régulier des résultats.';
    if (critLower.includes('équipe') || critLower.includes('collaboration'))
      return 'Participer à des projets transversaux. Exercices de team-building.';
    if (critLower.includes('innovation'))
      return 'Encourager la proposition d\'idées nouvelles. Participer à des hackathons internes.';
    if (critLower.includes('résolution') || critLower.includes('problème'))
      return 'Formations en pensée analytique et résolution de problèmes complexes.';
    if (critLower.includes('performance') || critLower.includes('résultat'))
      return 'Définir des objectifs SMART clairs avec suivi hebdomadaire.';
    return score < 2
      ? 'Accompagnement prioritaire avec suivi rapproché et plan d\'action à 30 jours.'
      : 'Formation ciblée et mentorat recommandés pour progresser sur cet axe.';
  }

  private genererObjectifSmart(critere: string, score: number): string {
    const objectifScore = Math.min(score + 1, 5);
    return `Atteindre un score de ${objectifScore.toFixed(1)}/5 sur "${critere}" d'ici 3 mois, `
      + `mesuré par les évaluations du prochain cycle, `
      + `via un plan d'action incluant formation et suivi mensuel.`;
  }

  private sixMonthsAgo(): string {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  }
}
