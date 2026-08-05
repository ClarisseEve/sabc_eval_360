import { Controller, Get, UseGuards, Request, ForbiddenException, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { DashboardManagerService } from './dashboard-manager.service';
import { DashboardCollaborateurService } from './dashboard-collaborateur.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private dashboardService: DashboardService,
    private dashboardManagerService: DashboardManagerService,
    private dashboardCollaborateurService: DashboardCollaborateurService,
  ) {}

  @Get()
  async getMyDashboard(@Request() req: any) {
    const user = req.user;
    const claimedRole = String(user.role_nom ?? user.role ?? '').trim().toLowerCase();
    const isAdmin = Boolean(user.is_admin) || claimedRole === 'admin';
    const role = isAdmin ? 'admin' : claimedRole || 'collaborateur';

    if (isAdmin) {
      return {
        role,
        title: this.dashboardService.getRoleTitle(role),
        stats: await this.dashboardService.getAdminStats(user.matricule),
      };
    }

    return {
      role,
      title: this.dashboardService.getRoleTitle(role),
      stats: await this.dashboardService.getStats(user.matricule),
    };
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    return this.dashboardService.getStats(req.user.matricule);
  }

  @Get('admin')
  async getAdminDashboard(@Request() req: any) {
    const role = String(req.user?.role_nom ?? req.user?.role ?? '').toUpperCase();
    const isAdmin = Boolean(req.user?.is_admin) || role === 'ADMIN';
    if (!isAdmin) {
      throw new ForbiddenException("Accès réservé à l'administrateur");
    }
    return this.dashboardService.getAdminStats(req.user.matricule);
  }

  @Get('manager')
  async getManagerDashboard(@Request() req: any, @Query('id_periode') idPeriode?: string) {
    return this.dashboardManagerService.getProgressionEquipe(req.user.matricule, idPeriode);
  }

  @Get('manager/validations')
  async getManagerValidations(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('evaluateur_matricule') evaluateurMatricule?: string,
    @Query('priorite') priorite?: string,
    @Query('id_periode') idPeriode?: string,
  ) {
    return this.dashboardManagerService.getValidationsAttente(req.user.matricule, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      evaluateur_matricule: evaluateurMatricule,
      priorite,
      id_periode: idPeriode,
    });
  }

  @Get('collaborateur')
  async getCollaborateurDashboard(@Request() req: any) {
    return this.dashboardCollaborateurService.getStatutPersonnel(req.user.matricule);
  }
}
