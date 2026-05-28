import { Module } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { EvaluationsController } from './evaluations.controller';
import { EligibilityService } from './eligibility.service';
import { EligibilityController } from './eligibility.controller';
import { ValidationNotationService } from './validation-notation.service';
import { ValidationManagerService } from './validation-manager.service';
import { ContreEvaluationService } from './contre-evaluation.service';
import { ContreEvaluationController } from './contre-evaluation.controller';
import { EvaluationsConsultationService } from './evaluations-consultation.service';
import { EvaluationsConsultationController } from './evaluations-consultation.controller';

@Module({
  controllers: [
    EvaluationsController,
    EligibilityController,
    ContreEvaluationController,
    EvaluationsConsultationController,
  ],
  providers: [
    EvaluationsService,
    EligibilityService,
    ValidationNotationService,
    ValidationManagerService,
    ContreEvaluationService,
    EvaluationsConsultationService,
  ],
  exports: [
    EvaluationsService,
    EligibilityService,
    ValidationNotationService,
    ValidationManagerService,
    ContreEvaluationService,
    EvaluationsConsultationService,
  ],
})
export class EvaluationsModule {}
