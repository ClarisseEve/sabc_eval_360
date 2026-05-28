import { Module } from '@nestjs/common';
import { EvaluationPermissionService } from './evaluation-permission.service';
import { EvaluationPermissionGuard } from './evaluation-permission.guard';
import { EvaluationsModule } from '../evaluations/evaluations.module';

@Module({
  imports: [EvaluationsModule],
  providers: [EvaluationPermissionService, EvaluationPermissionGuard],
  exports: [EvaluationPermissionService, EvaluationPermissionGuard],
})
export class EvaluationPermissionModule {}
