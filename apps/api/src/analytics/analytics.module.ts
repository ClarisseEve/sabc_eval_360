import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  controllers: [AnalyticsController],
  providers: [Reflector, RolesGuard, AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
