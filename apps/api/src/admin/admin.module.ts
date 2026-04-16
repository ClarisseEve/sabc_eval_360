import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminStructureController } from './admin-structure.controller';
import { AdminRolesController } from './admin-roles.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminEvaluationsController } from './admin-evaluations.controller';
import { AdminStructureService } from './admin-structure.service';
import { AdminRolesService } from './admin-roles.service';
import { AdminUsersService } from './admin-users.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EvaluationsModule } from '../evaluations/evaluations.module';
import { HierarchyModule } from '../hierarchy/hierarchy.module';

@Module({
  imports: [EvaluationsModule, HierarchyModule],
  controllers: [AdminStructureController, AdminRolesController, AdminUsersController, AdminEvaluationsController],
  providers: [Reflector, RolesGuard, AdminStructureService, AdminRolesService, AdminUsersService],
  exports: [AdminStructureService, AdminRolesService, AdminUsersService],
})
export class AdminModule {}
