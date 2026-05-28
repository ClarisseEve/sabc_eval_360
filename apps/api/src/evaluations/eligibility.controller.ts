import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { EligibilityService } from './eligibility.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { CheckEligibilityDto } from './dto/check-eligibility.dto';

@Controller('eligibility')
@UseGuards(JwtAuthGuard)
export class EligibilityController {
  constructor(private eligibilityService: EligibilityService) {}

  /**
   * Check eligibility. The evaluateur_matricule must match the authenticated
   * user unless the caller is an admin. This prevents privilege escalation
   * where a user probes eligibility on behalf of another user.
   */
  @Post('check')
  checkEligibility(@Body() dto: CheckEligibilityDto, @Req() req: any) {
    const callerMatricule: string | undefined = req.user?.matricule ?? req.user?.sub;
    if (!callerMatricule) {
      throw new UnauthorizedException('Impossible de déterminer l\'identité de l\'appelant');
    }
    if (!req.user?.est_admin && dto.evaluateur_matricule !== callerMatricule) {
      throw new ForbiddenException(
        'Vous ne pouvez vérifier l\'éligibilité qu\'en votre propre nom',
      );
    }
    return this.eligibilityService.canEvaluate(
      dto.evaluateur_matricule,
      dto.evalue_matricule,
      dto.type_evaluation as 'auto' | 'pairs' | 'subordonnes',
    );
  }

  @Get('mes-cibles')
  getMyTargets(@Req() req: any) {
    const matricule: string | undefined = req.user?.matricule ?? req.user?.sub;
    if (!matricule) {
      throw new UnauthorizedException('Impossible de déterminer l\'identité de l\'appelant');
    }
    return this.eligibilityService.getEligibleTargets(matricule);
  }

  /**
   * Admin/RH-only: retrieve eligible targets for any given user.
   * Restricted to avoid IDOR — any authenticated user could otherwise
   * enumerate org structure for arbitrary matricules.
   */
  @Get('cibles/:matricule')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'RH')
  getTargetsFor(@Param('matricule') matricule: string) {
    return this.eligibilityService.getEligibleTargets(matricule);
  }
}
