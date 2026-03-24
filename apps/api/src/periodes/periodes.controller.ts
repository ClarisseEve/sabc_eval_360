import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { PeriodesService } from './periodes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePeriodeDto } from './dto/create-periode.dto';
import { UpdatePeriodeDto } from './dto/update-periode.dto';

@Controller('periodes')
@UseGuards(JwtAuthGuard)
export class PeriodesController {
  constructor(private service: PeriodesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('active')
  findActive() {
    return this.service.findActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  create(@Body() dto: CreatePeriodeDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePeriodeDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/ouvrir')
  ouvrir(@Param('id') id: string) {
    return this.service.ouvrir(id);
  }

  @Post(':id/fermer')
  fermer(@Param('id') id: string) {
    return this.service.fermer(id);
  }

  @Get(':id/statistiques')
  statistiques(@Param('id') id: string) {
    return this.service.calculateStatistiques(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
