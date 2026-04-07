import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { RemplacementsService } from './remplacements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRemplacementDto } from './dto/create-remplacement.dto';

@Controller('remplacements')
@UseGuards(JwtAuthGuard)
export class RemplacementsController {
  constructor(private service: RemplacementsService) {}

  @Get('actifs')
  getActifs() {
    return this.service.getActifs();
  }

  @Get('a-venir')
  getAVenir() {
    return this.service.getAVenir();
  }

  @Get('historique')
  getHistorique(@Query('limit') limit?: string) {
    return this.service.getHistorique(limit ? parseInt(limit) : 50);
  }

  @Get('par-utilisateur')
  getPourUtilisateur(@Request() req: any) {
    return this.service.getPourUtilisateur(req.user.matricule);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(parseInt(id));
  }

  @Post()
  create(@Body() dto: CreateRemplacementDto, @Request() req: any) {
    return this.service.create({ ...dto, cree_par: req.user.matricule });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(parseInt(id), body);
  }

  @Post(':id/terminer')
  terminer(@Param('id') id: string, @Body() body: { date_fin?: string }) {
    return this.service.terminer(parseInt(id), body.date_fin);
  }
}
