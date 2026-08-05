import { Controller, Get, Post, Put, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
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
  async create(@Body() dto: CreateEvaluationDto, @Request() req: any) {
    // Always use authenticated user's matricule — never trust the body for evaluateur_matricule
    const evaluateurMatricule = req.user.matricule;
    return this.service.create(evaluateurMatricule, dto.evalue_matricule, dto.id_periode, dto.id_regle);
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
    @Query('statut') statut?: string,
    @Query('type_evaluation') typeEvaluation?: string,
    @Query('id_periode') idPeriode?: string,
  ) {
    return this.service.getHistorique(req.user.matricule, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      statut,
      type_evaluation: typeEvaluation,
      id_periode: idPeriode,
    });
  }

  @Get('rapport/:idPeriode')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async rapport(@Param('idPeriode') idPeriode: string, @Request() req: any) {
    return this.service.getRapport(idPeriode, req.user.matricule);
  }

  @Post('rappels/:idPeriode')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async rappels(@Param('idPeriode') idPeriode: string) {
    return this.service.envoyerRappels(idPeriode);
  }

  @Get(':id')
  async show(@Param('id') id: string, @Request() req: any) {
    return this.service.findById(id, req.user);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateEvaluationDto, @Request() req: any) {
    await this.service.updateNotes(id, req.user, dto.notes, dto.commentaire_general);
    return this.service.findById(id, req.user);
  }

  @Post(':id/submit')
  async submit(@Param('id') id: string, @Request() req: any) {
    return this.service.submit(id, req.user);
  }

  @Post(':id/validate')
  async validate(@Param('id') id: string, @Body() dto: ValidateEvaluationDto, @Request() req: any) {
    return this.service.validate(id, req.user.matricule, dto.est_validee, dto.motif_rejet, dto.commentaire_validation);
  }
}
