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

  private sixMonthsAgo(): string {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  }
}
