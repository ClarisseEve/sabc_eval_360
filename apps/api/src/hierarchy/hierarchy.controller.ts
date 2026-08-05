import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { HierarchyService } from './hierarchy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';

@Controller('hierarchy')
@UseGuards(JwtAuthGuard)
export class HierarchyController {
  constructor(private service: HierarchyService) {}

  @Get('region/:idRegion')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getRegion(@Param('idRegion') idRegion: string) {
    return this.service.getHierarchieRegion(idRegion);
  }

  @Get('region/:idRegion/stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
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
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getManagersEligibles(@Param('matricule') matricule: string) {
    return this.service.getManagersEligibles(matricule);
  }

  @Post('verifier-supervision')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  verifierSupervision(
    @Body()
    body: {
      superviseur_matricule: string;
      subordonne_matricule: string;
    },
  ) {
    return this.service.peutSuperviser(
      body.superviseur_matricule,
      body.subordonne_matricule,
    );
  }

  @Post('valider-assignation')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  validerAssignation(
    @Body() body: { matricule: string; manager_matricule: string },
  ) {
    return this.service.validerAssignationManager(
      body.matricule,
      body.manager_matricule,
    );
  }

  @Post('assigner-manager')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  assignerManager(
    @Body() body: { matricule: string; manager_matricule: string },
  ) {
    return this.service.assignerManager(body.matricule, body.manager_matricule);
  }
}
