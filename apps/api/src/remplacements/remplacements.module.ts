import { Module } from '@nestjs/common';
import { RemplacementsService } from './remplacements.service';
import { RemplacementsController } from './remplacements.controller';

@Module({
  controllers: [RemplacementsController],
  providers: [RemplacementsService],
  exports: [RemplacementsService],
})
export class RemplacementsModule {}
