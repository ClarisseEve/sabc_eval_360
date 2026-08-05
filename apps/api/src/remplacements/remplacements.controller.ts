import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { RemplacementsService } from './remplacements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { CreateRemplacementDto } from './dto/create-remplacement.dto';
import { UpdateRemplacementDto } from './dto/update-remplacement.dto';
import { TerminerRemplacementDto } from './dto/terminer-remplacement.dto';

interface AuthenticatedRequest extends Request {
  user: {
    matricule: string;
    email: string;
    role: string;
    is_admin: boolean;
  };
}

@Controller('remplacements')
@UseGuards(JwtAuthGuard)
export class RemplacementsController {
  constructor(private service: RemplacementsService) {}

  @Get('actifs')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getActifs() {
    return this.service.getActifs();
  }

  @Get('a-venir')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getAVenir() {
    return this.service.getAVenir();
  }

  @Get('historique')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getHistorique(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.service.getHistorique(limit);
  }

  @Get('par-utilisateur')
  getPourUtilisateur(@Req() req: AuthenticatedRequest) {
    return this.service.getPourUtilisateur(req.user.matricule);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateRemplacementDto, @Req() req: AuthenticatedRequest) {
    return this.service.create({ ...dto, cree_par: req.user.matricule });
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRemplacementDto,
  ) {
    return this.service.update(id, dto);
  }

  @Post(':id/terminer')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  terminer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TerminerRemplacementDto,
  ) {
    return this.service.terminer(id, dto.date_fin);
  }
}
