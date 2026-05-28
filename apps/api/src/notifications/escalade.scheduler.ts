import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EscaladeService } from './escalade.service';

@Injectable()
export class EscaladeScheduler {
  private readonly logger = new Logger(EscaladeScheduler.name);

  constructor(private escaladeService: EscaladeService) {}

  @Cron('0 8 * * *', { timeZone: 'Africa/Douala' })
  async traiterEscalade(): Promise<void> {
    this.logger.log('[5.4] Cron démarré: traitement des escalades automatiques');
    try {
      const result = await this.escaladeService.traiterEscalade();
      this.logger.log(
        `[5.4] Cron terminé — L1:${result.l1} L2:${result.l2} L3:${result.l3} L4:${result.l4}`,
      );
    } catch (err) {
      this.logger.error(`[5.4] Erreur cron escalade: ${err}`);
    }
  }
}
