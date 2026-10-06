import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { AdminUsersService } from './admin-users.service';
import { CreateUserDto } from './dto/user.dto';
import { UpdateUserDto } from './dto/user.dto';

interface AuthenticatedRequest extends Request {
  user: { matricule: string; email: string; role: string; is_admin: boolean };
}

@Controller('admin/utilisateurs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUsersController {
  constructor(private usersService: AdminUsersService) {}

  @Get()
  getUsers(
    @Query('statut') statut?: string,
    @Query('role') role?: string,
    @Query('id_region') id_region?: string,
    @Query('id_branche') id_branche?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort_by') sort_by?: 'name' | 'score',
    @Query('sort_order') sort_order?: 'asc' | 'desc',
    @Query('score_type') score_type?: 'global' | 'auto' | 'pairs' | 'descendante',
  ) {
    return this.usersService.getUsers({
      statut, role, id_region, id_branche, search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      sort_by,
      sort_order,
      score_type,
    });
  }

  @Get(':matricule')
  getUser(@Param('matricule') matricule: string) {
    return this.usersService.getUserByMatricule(matricule);
  }

  @Get(':matricule/subordonnes')
  getSubordonnes(@Param('matricule') matricule: string) {
    return this.usersService.getSubordonnes(matricule);
  }

  @Get(':matricule/historique')
  getHistorique(@Param('matricule') matricule: string) {
    return this.usersService.getHistorique(matricule);
  }

  @Get(':matricule/chaine')
  getChaine(@Param('matricule') matricule: string) {
    return this.usersService.getChaine(matricule);
  }

  @Post()
  createUser(@Body() body: CreateUserDto, @Req() req: AuthenticatedRequest) {
    return this.usersService.createUser(body, req.user.matricule, req.ip ?? '');
  }

  @Put(':matricule')
  updateUser(
    @Param('matricule') matricule: string,
    @Body() body: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.updateUser(matricule, body, req.user.matricule, req.ip ?? '');
  }

  @Delete(':matricule')
  deactivateUser(@Param('matricule') matricule: string, @Req() req: AuthenticatedRequest) {
    return this.usersService.deactivateUser(matricule, req.user.matricule, req.ip ?? '');
  }

  @Post('remplacants-disponibles')
  getRemplacants(@Body() body: { matricule: string }) {
    return this.usersService.getRemplacantsDisponibles(body.matricule);
  }
}
