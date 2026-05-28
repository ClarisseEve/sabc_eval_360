import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { ReportsService } from './reports.service';
import { CreateRapportDto, UpdateRapportDto, AddSectionDto, ReorderDto } from './dto';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(@Body() dto: CreateRapportDto, @Request() req: any) {
    return this.reportsService.createRapport(dto.titre, req.user.matricule);
  }

  @Get()
  findAll(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.reportsService.findAll(Number(page), Number(limit));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRapportDto) {
    return this.reportsService.updateRapport(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reportsService.softDelete(id);
  }

  @Post(':id/sections')
  addSection(@Param('id') id: string, @Body() dto: AddSectionDto) {
    return this.reportsService.addSection(id, dto.type, dto.titre, dto.contenu);
  }

  @Patch(':id/sections/:sectionId')
  updateSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Body() updates: { titre?: string; contenu?: any },
  ) {
    return this.reportsService.updateSection(id, sectionId, updates);
  }

  @Delete(':id/sections/:sectionId')
  removeSection(@Param('id') id: string, @Param('sectionId') sectionId: string) {
    return this.reportsService.removeSection(id, sectionId);
  }

  @Patch(':id/reorder')
  reorder(@Param('id') id: string, @Body() dto: ReorderDto) {
    return this.reportsService.reorderSections(id, dto.orderedIds);
  }
}
