import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { AdminStructureService } from './admin-structure.service';
import {
  CreateDistrictDto,
  CreateRegionDto,
  CreateSecteurDto,
  CreateServiceDto,
  UpdateRegionDto,
  UpdateServiceDto,
  UpdateDistrictDto,
  UpdateSecteurDto,
} from './dto/structure.dto';

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
  createRegion(@Body() body: CreateRegionDto) {
    return this.structureService.createRegion(body);
  }

  @Put('regions/:id')
  updateRegion(@Param('id') id: string, @Body() body: UpdateRegionDto) {
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
  createService(@Body() body: CreateServiceDto) {
    return this.structureService.createService(body);
  }

  @Put('services/:id')
  updateService(@Param('id') id: string, @Body() body: UpdateServiceDto) {
    return this.structureService.updateService(id, body);
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
  createDistrict(@Body() body: CreateDistrictDto) {
    return this.structureService.createDistrict(body);
  }

  @Put('districts/:id')
  updateDistrict(@Param('id') id: string, @Body() body: UpdateDistrictDto) {
    return this.structureService.updateDistrict(id, body);
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
  createSecteur(@Body() body: CreateSecteurDto) {
    return this.structureService.createSecteur(body);
  }

  @Put('secteurs/:id')
  updateSecteur(@Param('id') id: string, @Body() body: UpdateSecteurDto) {
    return this.structureService.updateSecteur(id, body);
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
