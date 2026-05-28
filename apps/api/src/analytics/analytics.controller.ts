import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 30, ttl: 60_000 } })
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

  @Get('anomalies/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  anomaliesHistory(
    @Query('severite') severite?: string,
    @Query('type') type?: string,
    @Query('resolue') resolue?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getAnomaliesHistory({ severite, type, resolue, limit: limit ? parseInt(limit, 10) : undefined });
  }

  @Post('anomalies/run-detection')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  runAnomalyDetection() {
    return this.service.runAnomalyDetectionBatch();
  }

  @Patch('anomalies/:id/acknowledge')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  acknowledgeAnomalie(@Param('id') id: string) {
    return this.service.acknowledgeAnomalie(id);
  }

  @Post('recommandations/run-generation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  runRecommandationsGeneration() {
    return this.service.runRecommandationsBatch();
  }

  @Get('admin/recommandations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminRecommandations(
    @Query('statut') statut?: string,
    @Query('type') type?: string,
    @Query('matricule') matricule?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getAdminRecommandations({ statut, type, matricule, limit: limit ? parseInt(limit, 10) : undefined });
  }

  @Patch('recommandations/:id/validate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  validateRecommandation(@Param('id') id: string, @Request() req: any) {
    return this.service.validateRecommandation(id, req.user.matricule);
  }

  @Patch('recommandations/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  rejectRecommandation(
    @Param('id') id: string,
    @Body('motif') motif: string,
    @Request() req: any,
  ) {
    return this.service.rejectRecommandation(id, req.user.matricule, motif ?? '');
  }

  @Get('admin/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminOverview() {
    return this.service.getAdminOverview();
  }

  @Get('admin/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminRoles() {
    return this.service.getAdminRoleAnalytics();
  }

  @Get('admin/regions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminRegionsOverview() {
    return this.service.getAdminRegionsOverview();
  }

  @Get('admin/regions/:idRegion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminRegionDetail(@Param('idRegion') idRegion: string) {
    return this.service.getAdminRegionDetail(idRegion);
  }

  @Get('tendances')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  tendances(
    @Query('id_region') idRegion?: string,
    @Query('role') role?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getTendancesMultiPeriodes({
      id_region: idRegion,
      role,
      limit: limit ? parseInt(limit, 10) : 6,
    });
  }

  @Get('admin/plans-amelioration')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  improvementPlans(
    @Query('role') role?: string,
    @Query('id_region') idRegion?: string,
    @Query('type') type?: string,
  ) {
    return this.service.getImprovementPlans({ role, id_region: idRegion, type });
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
