import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { EvaluationPermissionService } from './evaluation-permission.service';

@Injectable()
export class EvaluationPermissionGuard implements CanActivate {
  constructor(private permissionService: EvaluationPermissionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const body = request.body;

    if (!user?.matricule || !body?.evalue_matricule) {
      return true;
    }

    const typeEvaluation: 'auto' | 'pairs' | 'subordonnes' =
      body.type_evaluation ?? 'subordonnes';
    const adresseIp: string = request.ip ?? '0.0.0.0';

    await this.permissionService.validateAndLog(
      user.matricule,
      body.evalue_matricule,
      typeEvaluation,
      adresseIp,
    );

    return true;
  }
}
