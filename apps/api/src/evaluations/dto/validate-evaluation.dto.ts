import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ValidateEvaluationDto {
  @IsBoolean()
  est_validee!: boolean;

  @IsString()
  @IsOptional()
  commentaire_validation?: string;
}
