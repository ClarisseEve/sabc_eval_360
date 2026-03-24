import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminStructureService } from './admin-structure.service';

@Controller('admin/structure')
@UseGuards(JwtAuthGuard)
export class AdminStructureController {
  constructor(private structureService: AdminStructureService) {}

  @Get()
  getOverview() {
    return this.structureService.getOverview();
  }

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

  @Get('branches')
  getBranches() {
    return this.structureService.getBranches();
  }
}
