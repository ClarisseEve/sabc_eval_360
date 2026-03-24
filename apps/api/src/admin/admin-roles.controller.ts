import { Controller, Get, Post, Put, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminRolesService } from './admin-roles.service';

@Controller('admin/roles')
@UseGuards(JwtAuthGuard)
export class AdminRolesController {
  constructor(private rolesService: AdminRolesService) {}

  @Get()
  getRoles() {
    return this.rolesService.getRoles();
  }

  @Get(':id')
  getRole(@Param('id') id: string) {
    return this.rolesService.getRoleById(id);
  }

  @Post()
  createRole(@Body() body: {
    id_role: string;
    nom_role: string;
    id_branche: string;
    description?: string;
  }) {
    return this.rolesService.createRole(body);
  }

  @Put(':id')
  updateRole(@Param('id') id: string, @Body() body: any) {
    return this.rolesService.updateRole(id, body);
  }

  @Delete(':id')
  deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
  }

  // ── Evaluation Rules ──

  @Get('regles/evaluation')
  getRegles() {
    return this.rolesService.getReglesEvaluation();
  }

  @Post('regles/evaluation')
  createRegle(@Body() body: { nom: string; description?: string; criteres: any[]; est_active?: boolean }) {
    return this.rolesService.createRegleEvaluation(body);
  }

  @Put('regles/evaluation/:id')
  updateRegle(@Param('id') id: string, @Body() body: any) {
    return this.rolesService.updateRegleEvaluation(id, body);
  }

  @Patch('regles/evaluation/:id/toggle')
  toggleRegle(@Param('id') id: string) {
    return this.rolesService.toggleRegleActive(id);
  }
}
