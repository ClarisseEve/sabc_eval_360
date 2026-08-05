import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { RemplacementsService } from './remplacements.service';

@Injectable()
export class RemplacementsScheduler {
  private readonly logger = new Logger(RemplacementsScheduler.name);

  constructor(
    private readonly remplacements: RemplacementsService,
    private readonly config: ConfigService,
  ) {}

  @Cron('5 0 * * *', {
    timeZone: 'Africa/Douala',
    waitForCompletion: true,
  })
  async synchronize(): Promise<{ activated: number; closed: number }> {
    if (!this.isSchedulerEnabled()) return { activated: 0, closed: 0 };

    const result = await this.remplacements.synchronizeScheduledReplacements();
    this.logger.log(
      `Remplacements synchronisés — activés: ${result.activated}, clôturés: ${result.closed}`,
    );
    return result;
  }

  private isSchedulerEnabled(): boolean {
    return (
      String(this.config.get('SCHEDULER_ENABLED', 'true'))
        .trim()
        .toLowerCase() === 'true'
    );
  }
}
