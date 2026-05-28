import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardManagerService } from './dashboard-manager.service';
import { DashboardCollaborateurService } from './dashboard-collaborateur.service';
import { HierarchyModule } from '../hierarchy/hierarchy.module';

@Module({
  imports: [HierarchyModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardManagerService, DashboardCollaborateurService],
  exports: [DashboardService, DashboardManagerService, DashboardCollaborateurService],
})
export class DashboardModule {}
