import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class AnalyticsScheduler {
  private readonly logger = new Logger(AnalyticsScheduler.name);

  constructor(private analyticsService: AnalyticsService) {}

  @Cron('0 2 * * *', { timeZone: 'Africa/Douala' })
  async runAnomalyDetection(): Promise<void> {
    this.logger.log('[7C] Cron démarré: détection des anomalies');
    try {
      const result = await this.analyticsService.runAnomalyDetectionBatch();
      this.logger.log(`[7C] Cron terminé — total:${result.total} critical:${result.critical} inserted:${result.inserted}`);
    } catch (err) {
      this.logger.error(`[7C] Erreur cron anomalies: ${err}`);
    }
  }

  @Cron('0 3 * * *', { timeZone: 'Africa/Douala' })
  async runRecommandationsGeneration(): Promise<void> {
    this.logger.log('[7C] Cron démarré: génération des recommandations');
    try {
      const result = await this.analyticsService.runRecommandationsBatch();
      this.logger.log(`[7C] Cron terminé — inserted:${result.inserted}`);
    } catch (err) {
      this.logger.error(`[7C] Erreur cron recommandations: ${err}`);
    }
  }
}
