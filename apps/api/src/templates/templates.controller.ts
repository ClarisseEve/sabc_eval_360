import { Controller, Get, Post, Delete, Param, Body, UseGuards, Put } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
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
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  assign(@Body() dto: AssignTemplateDto) {
    return this.service.assignTemplate(dto.id_template, dto.id_role, dto.id_periode);
  }

  @Post('assign-bulk')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  assignBulk(@Body() dto: BulkAssignDto) {
    return this.service.assignBulk(dto.id_periode, dto.assignations);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateTemplateDto) {
    return this.service.createTemplate(dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getTemplateById(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.service.updateTemplate(id, dto);
  }

  @Post(':id/publish')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  publish(@Param('id') id: string) {
    return this.service.publishTemplate(id);
  }

  @Post(':id/unpublish')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  unpublish(@Param('id') id: string) {
    return this.service.unpublishTemplate(id);
  }

  @Delete(':idRole/:idPeriode')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('idRole') idRole: string, @Param('idPeriode') idPeriode: string) {
    return this.service.deleteAssignation(idRole, idPeriode);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  delete(@Param('id') id: string) {
    return this.service.deleteTemplate(id);
  }
}
