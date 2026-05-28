import { Module, Global } from '@nestjs/common';
import { EscaladeScheduler } from './escalade.scheduler';
import { EscaladeService } from './escalade.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsValidationAttenteScheduler } from './notifications-validation-attente.scheduler';
import { NotificationsValidationAttenteService } from './notifications-validation-attente.service';

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsValidationAttenteService,
    NotificationsValidationAttenteScheduler,
    EscaladeService,
    EscaladeScheduler,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
