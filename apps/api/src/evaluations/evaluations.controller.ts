import { Controller, Get, Post, Put, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { ValidateEvaluationDto } from './dto/validate-evaluation.dto';

@Controller('evaluations')
@UseGuards(JwtAuthGuard)
export class EvaluationsController {
  constructor(private service: EvaluationsService) {}

  @Get()
  async index(@Request() req: any) {
    const matricule = req.user.matricule;
    const [enAttente, aValider] = await Promise.all([
      this.service.getEnAttente(matricule),
      this.service.getAValider(matricule),
    ]);
    return { en_attente: enAttente, a_valider: aValider };
  }

  @Post()
  async create(@Body() dto: CreateEvaluationDto) {
    return this.service.create(dto.evaluateur_matricule, dto.evalue_matricule, dto.id_periode, dto.id_regle);
  }

  @Get('periodes-actives')
  async periodesActives() {
    return this.service.getPeriodesActives();
  }

  @Get('eligibles')
  async eligibles(@Request() req: any) {
    return this.service.getEligibles(req.user.matricule);
  }

  @Get('historique')
  async historique(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getHistorique(req.user.matricule, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('rapport/:idPeriode')
  async rapport(@Param('idPeriode') idPeriode: string, @Request() req: any) {
    return this.service.getRapport(idPeriode, req.user.matricule);
  }

  @Post('rappels/:idPeriode')
  async rappels(@Param('idPeriode') idPeriode: string) {
    return this.service.envoyerRappels(idPeriode);
  }

  @Get(':id')
  async show(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateEvaluationDto) {
    await this.service.updateNotes(id, dto.notes, dto.commentaire_general);
    return this.service.findById(id);
  }

  @Post(':id/submit')
  async submit(@Param('id') id: string) {
    return this.service.submit(id);
  }

  @Post(':id/validate')
  async validate(@Param('id') id: string, @Body() dto: ValidateEvaluationDto, @Request() req: any) {
    return this.service.validate(id, req.user.matricule, dto.est_validee, dto.commentaire_validation);
  }
}
