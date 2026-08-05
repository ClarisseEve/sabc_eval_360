import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { EvaluationsService } from '../evaluations/evaluations.service';

@Controller('admin/evaluations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminEvaluationsController {
  constructor(private evaluationsService: EvaluationsService) {}

  @Get('history')
  history(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('statut') statut?: string,
    @Query('type_evaluation') typeEvaluation?: string,
    @Query('id_periode') idPeriode?: string,
  ) {
    return this.evaluationsService.getHistoriqueGlobal({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      statut,
      type_evaluation: typeEvaluation,
      id_periode: idPeriode,
    });
  }

  @Get(':id')
  getOne(@Param('id') id: string, @Request() req: any) {
    return this.evaluationsService.findById(id, req.user);
  }
}
