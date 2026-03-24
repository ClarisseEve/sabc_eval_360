import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { HierarchyService } from './hierarchy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('hierarchy')
@UseGuards(JwtAuthGuard)
export class HierarchyController {
  constructor(private service: HierarchyService) {}

  @Get('region/:idRegion')
  getRegion(@Param('idRegion') idRegion: string) {
    return this.service.getHierarchieRegion(idRegion);
  }

  @Get('region/:idRegion/stats')
  getRegionStats(@Param('idRegion') idRegion: string) {
    return this.service.getRegionStats(idRegion);
  }

  @Get('subordonnes')
  getSubordonnes(@Request() req: any) {
    return this.service.getSubordonnesDirects(req.user.matricule);
  }

  @Get('tous-subordonnes')
  getTousSubordonnes(@Request() req: any) {
    return this.service.getTousSubordonnes(req.user.matricule);
  }

  @Get('chaine')
  getChaineHierarchique(@Request() req: any) {
    return this.service.getChaineHierarchique(req.user.matricule);
  }

  @Get('managers-eligibles/:matricule')
  getManagersEligibles(@Param('matricule') matricule: string) {
    return this.service.getManagersEligibles(matricule);
  }

  @Post('verifier-supervision')
  verifierSupervision(@Body() body: { superviseur_matricule: string; subordonne_matricule: string }) {
    return this.service.peutSuperviser(body.superviseur_matricule, body.subordonne_matricule);
  }

  @Post('valider-assignation')
  validerAssignation(@Body() body: { matricule: string; manager_matricule: string }) {
    return this.service.validerAssignationManager(body.matricule, body.manager_matricule);
  }

  @Post('assigner-manager')
  assignerManager(@Body() body: { matricule: string; manager_matricule: string }) {
    return this.service.assignerManager(body.matricule, body.manager_matricule);
  }
}
