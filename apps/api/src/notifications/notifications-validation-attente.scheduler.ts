import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationsValidationAttenteService } from './notifications-validation-attente.service';

@Injectable()
export class NotificationsValidationAttenteScheduler {
  private readonly logger = new Logger(NotificationsValidationAttenteScheduler.name);

  constructor(
    private notificationsValidationAttenteService: NotificationsValidationAttenteService,
  ) {}

  @Cron('0 10 * * *', { timeZone: 'Africa/Douala' })
  async notifierManagersEnAttente(): Promise<void> {
    this.logger.log('[5.3] Cron démarré: vérification managers avec validations en attente');
    try {
      const count = await this.notificationsValidationAttenteService.notifierManagersAttente();
      this.logger.log(`[5.3] Cron terminé: ${count} managers notifiés`);
    } catch (err) {
      this.logger.error(`[5.3] Erreur cron validation attente: ${err}`);
    }
  }
}
