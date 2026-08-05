import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsScheduler } from './analytics.scheduler';
import { HierarchyModule } from '../hierarchy/hierarchy.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [HierarchyModule],
  controllers: [AnalyticsController],
  providers: [Reflector, RolesGuard, AnalyticsService, AnalyticsScheduler],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
