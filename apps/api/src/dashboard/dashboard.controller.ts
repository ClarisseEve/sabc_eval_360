import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  async getMyDashboard(@Request() req: any) {
    const user = req.user;
    const role = (user.role_nom ?? 'admin').toLowerCase();

    if (role === 'admin') {
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
    return this.dashboardService.getAdminStats(req.user.matricule);
  }
}
