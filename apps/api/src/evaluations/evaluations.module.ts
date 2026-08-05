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
    // EvaluationsConsultationController partage le préfixe 'evaluations' et
    // expose des chemins littéraux (recues, donnees). Il doit être enregistré
    // avant EvaluationsController, dont le @Get(':id') capturerait sinon
    // « recues » et « donnees » comme identifiants et renverrait une 404.
    EvaluationsConsultationController,
    EligibilityController,
    ContreEvaluationController,
    EvaluationsController,
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
