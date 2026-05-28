import { Module } from '@nestjs/common';
import { NotificationsOuvertureService } from '../notifications/notifications-ouverture.service';
import { NotificationsRappelService } from '../notifications/notifications-rappel.service';
import { PeriodesController } from './periodes.controller';
import { PeriodesSchedulerService } from './periodes-scheduler.service';
import { PeriodesService } from './periodes.service';

@Module({
  controllers: [PeriodesController],
  providers: [
    PeriodesService,
    PeriodesSchedulerService,
    NotificationsRappelService,
    NotificationsOuvertureService,
  ],
  exports: [PeriodesService],
})
export class PeriodesModule {}
