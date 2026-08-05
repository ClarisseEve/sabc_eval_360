import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RemplacementsService } from './remplacements.service';
import { RemplacementsController } from './remplacements.controller';
import { RemplacementsScheduler } from './remplacements.scheduler';

@Module({
  controllers: [RemplacementsController],
  providers: [
    Reflector,
    RolesGuard,
    RemplacementsService,
    RemplacementsScheduler,
  ],
  exports: [RemplacementsService],
})
export class RemplacementsModule {}
