import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { AdminStructureService } from './admin-structure.service';

@Controller('admin/structure')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminStructureController {
  constructor(private structureService: AdminStructureService) {}

  @Get()
  getOverview() {
    return this.structureService.getOverview();
  }

  // ── Regions ──

  @Get('regions')
  getRegions() {
    return this.structureService.getRegions();
  }

  @Post('regions')
  createRegion(@Body() body: { id_region: string; nom_region: string; est_taniere?: boolean }) {
    return this.structureService.createRegion(body);
  }

  @Put('regions/:id')
  updateRegion(@Param('id') id: string, @Body() body: { nom_region?: string; est_taniere?: boolean }) {
    return this.structureService.updateRegion(id, body);
  }

  @Delete('regions/:id')
  deleteRegion(@Param('id') id: string) {
    return this.structureService.deleteRegion(id);
  }

  // ── Services Commerciaux ──

  @Get('services')
  getServices() {
    return this.structureService.getServices();
  }

  @Post('services')
  createService(@Body() body: { nom_service: string; id_region: string }) {
    return this.structureService.createService(body);
  }

  @Delete('services/:id')
  deleteService(@Param('id') id: string) {
    return this.structureService.deleteService(id);
  }

  // ── Districts ──

  @Get('districts')
  getDistricts() {
    return this.structureService.getDistricts();
  }

  @Post('districts')
  createDistrict(@Body() body: { nom_district: string; id_service: string }) {
    return this.structureService.createDistrict(body);
  }

  @Delete('districts/:id')
  deleteDistrict(@Param('id') id: string) {
    return this.structureService.deleteDistrict(id);
  }

  // ── Secteurs ──

  @Get('secteurs')
  getSecteurs() {
    return this.structureService.getSecteurs();
  }

  @Post('secteurs')
  createSecteur(@Body() body: { nom_secteur: string; id_district: string; id_service?: string }) {
    return this.structureService.createSecteur(body);
  }

  @Delete('secteurs/:id')
  deleteSecteur(@Param('id') id: string) {
    return this.structureService.deleteSecteur(id);
  }

  // ── Branches ──

  @Get('branches')
  getBranches() {
    return this.structureService.getBranches();
  }
}
