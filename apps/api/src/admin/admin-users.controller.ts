import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { AdminUsersService } from './admin-users.service';

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
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.getUsers({
      statut, role, id_region, search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
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
  createUser(@Body() body: any) {
    return this.usersService.createUser(body);
  }

  @Put(':matricule')
  updateUser(@Param('matricule') matricule: string, @Body() body: any) {
    return this.usersService.updateUser(matricule, body);
  }

  @Delete(':matricule')
  deactivateUser(@Param('matricule') matricule: string) {
    return this.usersService.updateUser(matricule, { statut: 'Inactif', est_actif: false });
  }

  @Post('remplacants-disponibles')
  getRemplacants(@Body() body: { matricule: string }) {
    return this.usersService.getRemplacantsDisponibles(body.matricule);
  }
}
