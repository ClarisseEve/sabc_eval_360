import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
  createRegion(@Body() body: { nom_region: string; code_region?: string; est_taniere?: boolean }) {
    return this.structureService.createRegion(body);
  }

  @Put('regions/:id')
  updateRegion(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.structureService.updateRegion(id, body);
  }

  @Delete('regions/:id')
  deleteRegion(@Param('id', ParseIntPipe) id: number) {
    return this.structureService.deleteRegion(id);
  }

  @Get('branches')
  getBranches() {
    return this.structureService.getBranches();
  }
}
