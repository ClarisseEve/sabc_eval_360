import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { EvaluationsConsultationService } from './evaluations-consultation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('evaluations')
@UseGuards(JwtAuthGuard)
export class EvaluationsConsultationController {
  constructor(private service: EvaluationsConsultationService) {}

  @Get('recues')
  async recues(@Request() req: any, @Query() query: any) {
    return this.service.getRecues(req.user.matricule, {
      id_periode: query.id_periode,
      type_evaluation: query.type_evaluation,
      statut: query.statut,
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
    });
  }

  @Get('donnees')
  async donnees(@Request() req: any, @Query() query: any) {
    return this.service.getDonnees(req.user.matricule, {
      id_periode: query.id_periode,
      type_evaluation: query.type_evaluation,
      statut: query.statut,
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
    });
  }

  @Get('recues/stats')
  async statsRecues(@Request() req: any) {
    return this.service.getStatsRecues(req.user.matricule);
  }

  @Get('donnees/stats')
  async statsDonnees(@Request() req: any) {
    return this.service.getStatsDonnees(req.user.matricule);
  }
}
