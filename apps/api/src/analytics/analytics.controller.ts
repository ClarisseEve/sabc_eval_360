import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, Res, UseGuards, Request } from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AnalyticsService } from './analytics.service';
import { BatchMatriculesDto } from './dto/batch-matricules.dto';
import { DateRangeQueryDto } from './dto/date-range-query.dto';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class AnalyticsController {
  constructor(
    private service: AnalyticsService,
    private hierarchy: HierarchyService,
  ) {}

  /**
   * Contrôle d'accès objet : un utilisateur ne peut consulter les données analytiques
   * que de lui-même, de ses subordonnés (hiérarchie complète) ou de tous s'il est admin.
   * Empêche l'IDOR (lecture des scores/axes d'un matricule arbitraire).
   */
  private async assertCanViewMatricules(req: any, matricules: string[]): Promise<void> {
    const user = req?.user;
    if (!user) throw new ForbiddenException();
    if (user.is_admin || String(user.role ?? '').toUpperCase() === 'ADMIN') return;

    const allowed = new Set<string>([user.matricule]);
    const subordinates = await this.hierarchy.getTousSubordonnes(user.matricule);
    for (const sub of subordinates) allowed.add(sub.matricule);

    const forbidden = matricules.filter((m) => !allowed.has(m));
    if (forbidden.length > 0) {
      throw new ForbiddenException("Accès non autorisé aux données d'un ou plusieurs utilisateurs");
    }
  }

  private assertCanViewMatricule(req: any, matricule: string): Promise<void> {
    return this.assertCanViewMatricules(req, [matricule]);
  }

  /**
   * Les analytics régionales exposent des agrégats et un classement nominatif.
   * Elles restent donc limitées à la région de l'utilisateur, les rôles ayant
   * tous une portée régionale. Sans ce contrôle, tout porteur d'un JWT pouvait
   * lire le classement de n'importe quelle région.
   */
  private assertCanViewRegion(req: any, idRegion: string): void {
    const user = req?.user;
    if (!user) throw new ForbiddenException();
    if (user.is_admin || String(user.role ?? '').toUpperCase() === 'ADMIN') return;

    if (!user.id_region || user.id_region !== idRegion) {
      throw new ForbiddenException("Accès non autorisé aux données de cette région");
    }
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  dashboard(@Query() filters: DateRangeQueryDto) {
    return this.service.getDashboard(filters);
  }

  @Get('evaluations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  evaluations(@Query() filters: DateRangeQueryDto) {
    return this.service.getEvaluationsStats(filters);
  }

  @Get('performances')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  performances(@Query() filters: DateRangeQueryDto) {
    return this.service.getPerformances(filters);
  }

  @Get('region/:idRegion')
  async region(@Param('idRegion') idRegion: string, @Request() req: any) {
    this.assertCanViewRegion(req, idRegion);
    return this.service.getRegionAnalytics(idRegion);
  }

  @Get('region/:idRegion/classement')
  async classementRegional(@Param('idRegion') idRegion: string, @Request() req: any) {
    this.assertCanViewRegion(req, idRegion);
    return this.service.getClassementRegional(idRegion);
  }

  @Get('axes-amelioration')
  mesAxes(@Request() req: any) {
    return this.service.getAxesAmelioration(req.user.matricule);
  }

  @Post('axes-amelioration/batch')
  async axesAmeliorationBatch(@Body() dto: BatchMatriculesDto, @Request() req: any) {
    await this.assertCanViewMatricules(req, dto.matricules ?? []);
    return this.service.getAxesAmeliorationBatch(dto.matricules);
  }

  @Get('axes-amelioration/:matricule')
  async axesAmelioration(@Param('matricule') matricule: string, @Request() req: any) {
    await this.assertCanViewMatricule(req, matricule);
    const audience = req.user?.is_admin || String(req.user?.role ?? '').toUpperCase() === 'ADMIN'
      ? 'admin'
      : 'evaluated';
    return this.service.getAxesAmelioration(matricule, audience);
  }

  @Get('anomalies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  anomalies(
    @Query('matricule') matricule?: string,
    @Query('id_region') idRegion?: string,
  ) {
    return this.service.detecterAnomalies(matricule, idRegion);
  }

  @Get('admin/evaluation-gaps')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  evaluationGaps(@Query('matricule') matricule?: string) {
    return this.service.getEvaluationGaps(matricule);
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
  adminOverview(@Query() filters: DateRangeQueryDto) {
    return this.service.getAdminOverview(filters);
  }

  @Get('admin/export-evaluations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async exportEvaluations(
    @Query('format') format: string,
    @Query() filters: DateRangeQueryDto,
    @Res() response: Response,
  ) {
    const exportFormat = format === 'xlsx' ? 'xlsx' : 'csv';
    const file = await this.service.exportEvaluations(exportFormat, filters);
    response.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
      'Content-Length': String(file.buffer.length),
    });
    response.end(file.buffer);
  }

  @Get('admin/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminRoles(@Query() filters: DateRangeQueryDto) {
    return this.service.getAdminRoleAnalytics(filters);
  }

  @Get('admin/regions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminRegionsOverview(@Query() filters: DateRangeQueryDto) {
    return this.service.getAdminRegionsOverview(filters);
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
  async recommandations(@Param('matricule') matricule: string, @Request() req: any) {
    await this.assertCanViewMatricule(req, matricule);
    const audience = req.user?.is_admin || String(req.user?.role ?? '').toUpperCase() === 'ADMIN'
      ? 'admin'
      : 'evaluated';
    return this.service.getRecommandations(matricule, audience);
  }

  @Get('scores')
  mesScores(@Request() req: any) {
    return this.service.getScoresUtilisateur(req.user.matricule);
  }

  @Post('scores/batch')
  async scoresBatch(@Body() dto: BatchMatriculesDto, @Request() req: any) {
    await this.assertCanViewMatricules(req, dto.matricules ?? []);
    return this.service.getScoresBatch(dto.matricules);
  }

  @Get('scores/:matricule')
  async scoresUtilisateur(@Param('matricule') matricule: string, @Request() req: any) {
    await this.assertCanViewMatricule(req, matricule);
    const audience = req.user?.is_admin || String(req.user?.role ?? '').toUpperCase() === 'ADMIN'
      ? 'admin'
      : 'evaluated';
    return this.service.getScoresUtilisateur(matricule, audience);
  }

  /** Comparaison par critère: sujet vs moyenne de sa région vs top performers. */
  @Get('benchmarks/:matricule')
  async benchmarks(@Param('matricule') matricule: string, @Request() req: any) {
    await this.assertCanViewMatricule(req, matricule);
    return this.service.getBenchmarks(matricule);
  }

  /** Progression d'un agent période après période, critère par critère. */
  @Get('evolution/:matricule')
  async evolutionCriteres(@Param('matricule') matricule: string, @Request() req: any) {
    await this.assertCanViewMatricule(req, matricule);
    return this.service.getEvolutionCriteres(matricule);
  }

  /** Matrice collaborateurs × critères pour une équipe. */
  @Post('team-heatmap')
  async teamHeatmap(@Body() dto: BatchMatriculesDto, @Request() req: any) {
    await this.assertCanViewMatricules(req, dto.matricules);
    return this.service.getTeamHeatmap(dto.matricules);
  }
}
