import { Injectable, ForbiddenException } from '@nestjs/common';
import { EligibilityService } from '../evaluations/eligibility.service';
import { AuditLogService } from '../common/services/audit-log.service';

@Injectable()
export class EvaluationPermissionService {
  constructor(
    private eligibility: EligibilityService,
    private auditLog: AuditLogService,
  ) {}

  /**
   * Validate evaluation permission and log the attempt (success or failure).
   * Throws ForbiddenException on denial.
   */
  async validateAndLog(
    evaluateurMatricule: string,
    evalueMatricule: string,
    typeEvaluation: 'auto' | 'pairs' | 'subordonnes',
    adresseIp: string,
  ): Promise<void> {
    const result = await this.eligibility.canEvaluate(
      evaluateurMatricule,
      evalueMatricule,
      typeEvaluation,
    );

    if (result.autorise) {
      await this.auditLog.log({
        matricule_utilisateur: evaluateurMatricule,
        action: 'tentative_evaluation',
        entite: 'evaluation',
        id_entite: evalueMatricule,
        adresse_ip: adresseIp,
        details_json: {
          evalue_matricule: evalueMatricule,
          type_evaluation: typeEvaluation,
          resultat: 'succes',
        },
      });
      return;
    }

    await this.auditLog.log({
      matricule_utilisateur: evaluateurMatricule,
      action: 'tentative_evaluation_bloquee',
      entite: 'evaluation',
      id_entite: evalueMatricule,
      adresse_ip: adresseIp,
      details_json: {
        evalue_matricule: evalueMatricule,
        type_evaluation: typeEvaluation,
        resultat: 'erreur',
        raison: result.raison,
      },
    });

    throw new ForbiddenException({
      message: 'Permission refusée',
      raison: result.raison,
      code: 'EVALUATION_PERMISSION_DENIED',
    });
  }
}
