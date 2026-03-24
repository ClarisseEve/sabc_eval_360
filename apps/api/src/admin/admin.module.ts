import { Module } from '@nestjs/common';
import { AdminStructureController } from './admin-structure.controller';
import { AdminRolesController } from './admin-roles.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminStructureService } from './admin-structure.service';
import { AdminRolesService } from './admin-roles.service';
import { AdminUsersService } from './admin-users.service';

@Module({
  controllers: [AdminStructureController, AdminRolesController, AdminUsersController],
  providers: [AdminStructureService, AdminRolesService, AdminUsersService],
  exports: [AdminStructureService, AdminRolesService, AdminUsersService],
})
export class AdminModule {}
