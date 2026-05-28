import { Controller, Get, Post, Put, Delete, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { AdminRolesService } from './admin-roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Controller('admin/roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
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
  createRole(@Body() body: CreateRoleDto, @Req() req: Request) {
    const matricule = (req.user as any)?.matricule ?? null;
    const ip = req.ip ?? '0.0.0.0';
    return this.rolesService.createRole(body, matricule, ip);
  }

  @Put(':id')
  updateRole(@Param('id') id: string, @Body() body: UpdateRoleDto, @Req() req: Request) {
    const matricule = (req.user as any)?.matricule ?? null;
    const ip = req.ip ?? '0.0.0.0';
    return this.rolesService.updateRole(id, body, matricule, ip);
  }

  @Delete(':id')
  deleteRole(@Param('id') id: string, @Req() req: Request) {
    const matricule = (req.user as any)?.matricule ?? null;
    const ip = req.ip ?? '0.0.0.0';
    return this.rolesService.deleteRole(id, matricule, ip);
  }

  // ── Evaluation Rules ──

  @Get('regles/evaluation')
  getRegles() {
    return this.rolesService.getReglesEvaluation();
  }

  @Get('regles/evaluation/:id')
  getRegle(@Param('id') id: string) {
    return this.rolesService.getRegleEvaluationById(id);
  }

  @Post('regles/evaluation')
  createRegle(@Body() body: any) {
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
