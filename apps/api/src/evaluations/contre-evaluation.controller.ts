import { Controller, Get, Post, Param, Body, Request, UseGuards } from '@nestjs/common';
import { ContreEvaluationService } from './contre-evaluation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsOptional, IsString } from 'class-validator';

class CreateContreEvaluationDto {
  @IsString()
  @IsOptional()
  motif?: string;
}

@Controller('evaluations')
@UseGuards(JwtAuthGuard)
export class ContreEvaluationController {
  constructor(private service: ContreEvaluationService) {}

  @Post(':id/contre-evaluation')
  async create(@Param('id') id: string, @Body() dto: CreateContreEvaluationDto, @Request() req: any) {
    return this.service.createContreEvaluation(req.user.matricule, id, dto.motif);
  }

  @Get(':id/contre-evaluations')
  async list(@Param('id') id: string) {
    return this.service.getContreEvaluations(id);
  }
}
