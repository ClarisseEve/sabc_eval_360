import { Module } from '@nestjs/common';
import { PeriodesService } from './periodes.service';
import { PeriodesController } from './periodes.controller';
import { PeriodesSchedulerService } from './periodes-scheduler.service';

@Module({
  controllers: [PeriodesController],
  providers: [PeriodesService, PeriodesSchedulerService],
  exports: [PeriodesService],
})
export class PeriodesModule {}
