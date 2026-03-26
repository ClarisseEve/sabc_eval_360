import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
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

  @Get('region/:idRegion/classement')
  classementRegional(@Param('idRegion') idRegion: string) {
    return this.service.getClassementRegional(idRegion);
  }

  @Get('axes-amelioration')
  mesAxes(@Request() req: any) {
    return this.service.getAxesAmelioration(req.user.matricule);
  }

  @Get('axes-amelioration/:matricule')
  axesAmelioration(@Param('matricule') matricule: string) {
    return this.service.getAxesAmelioration(matricule);
  }

  @Get('anomalies')
  anomalies(
    @Query('matricule') matricule?: string,
    @Query('id_region') idRegion?: string,
  ) {
    return this.service.detecterAnomalies(matricule, idRegion);
  }

  @Get('recommandations')
  mesRecommandations(@Request() req: any) {
    return this.service.getRecommandations(req.user.matricule);
  }

  @Get('recommandations/:matricule')
  recommandations(@Param('matricule') matricule: string) {
    return this.service.getRecommandations(matricule);
  }

  @Get('scores')
  mesScores(@Request() req: any) {
    return this.service.getScoresUtilisateur(req.user.matricule);
  }

  @Get('scores/:matricule')
  scoresUtilisateur(@Param('matricule') matricule: string) {
    return this.service.getScoresUtilisateur(matricule);
  }
}
