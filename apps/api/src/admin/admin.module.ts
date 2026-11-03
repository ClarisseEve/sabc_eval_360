import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminStructureController } from './admin-structure.controller';
import { AdminRolesController } from './admin-roles.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminImportsController } from './admin-imports.controller';
import { AdminEvaluationsController } from './admin-evaluations.controller';
import { AdminStructureService } from './admin-structure.service';
import { AdminRolesService } from './admin-roles.service';
import { AdminUsersService } from './admin-users.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EvaluationsModule } from '../evaluations/evaluations.module';
import { HierarchyModule } from '../hierarchy/hierarchy.module';
import { TemplatesModule } from '../templates/templates.module';
import { AdminImportsService } from './admin-imports.service';

@Module({
  imports: [EvaluationsModule, HierarchyModule, TemplatesModule],
  controllers: [AdminStructureController, AdminRolesController, AdminUsersController, AdminImportsController, AdminEvaluationsController],
  providers: [Reflector, RolesGuard, AdminStructureService, AdminRolesService, AdminUsersService, AdminImportsService],
  exports: [AdminStructureService, AdminRolesService, AdminUsersService],
})
export class AdminModule {}
