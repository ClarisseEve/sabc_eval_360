import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private service: AnalyticsService) {}

  @Get('dashboard')
  dashboard(@Query() filters: { start_date?: string; end_date?: string }) {
    return this.service.getDashboard(filters);
  }

  @Get('evaluations')
  evaluations(@Query() filters: { start_date?: string; end_date?: string }) {
    return this.service.getEvaluationsStats(filters);
  }

  @Get('performances')
  performances(@Query() filters: { start_date?: string; end_date?: string }) {
    return this.service.getPerformances(filters);
  }

  @Get('region/:idRegion')
  region(@Param('idRegion') idRegion: string) {
    return this.service.getRegionAnalytics(idRegion);
  }
}
