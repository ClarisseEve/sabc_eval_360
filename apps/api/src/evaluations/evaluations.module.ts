import { Module } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { EvaluationsController } from './evaluations.controller';
import { EligibilityService } from './eligibility.service';
import { EligibilityController } from './eligibility.controller';

@Module({
  controllers: [EvaluationsController, EligibilityController],
  providers: [EvaluationsService, EligibilityService],
  exports: [EvaluationsService, EligibilityService],
})
export class EvaluationsModule {}
