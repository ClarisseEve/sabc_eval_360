import { Module } from '@nestjs/common';
import { PeriodesService } from './periodes.service';
import { PeriodesController } from './periodes.controller';

@Module({
  controllers: [PeriodesController],
  providers: [PeriodesService],
  exports: [PeriodesService],
})
export class PeriodesModule {}
