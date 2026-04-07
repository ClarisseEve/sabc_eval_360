import { Controller, Get, Post, Delete, Param, Body, UseGuards, Put } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssignTemplateDto, BulkAssignDto } from './dto/assign-template.dto';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private service: TemplatesService) {}

  @Get()
  list() {
    return this.service.listTemplates();
  }

  @Get('assignations/:idPeriode')
  getAssignations(@Param('idPeriode') idPeriode: string) {
    return this.service.getAssignationsByPeriode(idPeriode);
  }

  @Get('matrice/:idPeriode')
  getMatrice(@Param('idPeriode') idPeriode: string) {
    return this.service.getMatriceAssignations(idPeriode);
  }

  @Get(':idRole/:idPeriode')
  getForRolePeriode(@Param('idRole') idRole: string, @Param('idPeriode') idPeriode: string) {
    return this.service.getTemplateForRolePeriode(idRole, idPeriode);
  }

  @Post('assign')
  assign(@Body() dto: AssignTemplateDto) {
    return this.service.assignTemplate(dto.id_template, dto.id_role, dto.id_periode);
  }

  @Post('assign-bulk')
  assignBulk(@Body() dto: BulkAssignDto) {
    return this.service.assignBulk(dto.id_periode, dto.assignations);
  }

  @Post()
  create(@Body() dto: CreateTemplateDto) {
    return this.service.createTemplate(dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getTemplateById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.service.updateTemplate(id, dto);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.service.publishTemplate(id);
  }

  @Post(':id/unpublish')
  unpublish(@Param('id') id: string) {
    return this.service.unpublishTemplate(id);
  }

  @Delete(':idRole/:idPeriode')
  remove(@Param('idRole') idRole: string, @Param('idPeriode') idPeriode: string) {
    return this.service.deleteAssignation(idRole, idPeriode);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.deleteTemplate(id);
  }
}
