/**
 * EligibilityModule — re-exports EvaluationsModule which provides EligibilityService.
 * Exists to satisfy app.module.ts imports; actual providers live in EvaluationsModule.
 */
import { Module } from '@nestjs/common';
import { EvaluationsModule } from '../evaluations/evaluations.module';

@Module({
  imports: [EvaluationsModule],
  exports: [EvaluationsModule],
})
export class EligibilityModule {}
