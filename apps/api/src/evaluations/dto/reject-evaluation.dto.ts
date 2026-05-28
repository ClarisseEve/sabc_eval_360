import { IsBoolean, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class RejectEvaluationDto {
  @IsBoolean()
  est_validee!: boolean;

  @IsString()
  @IsOptional()
  @MinLength(20, { message: 'Le motif de rejet doit contenir au moins 20 caractères' })
  @MaxLength(1000, { message: 'Le motif de rejet ne peut pas dépasser 1000 caractères' })
  motif_rejet?: string;

  @IsString()
  @IsOptional()
  commentaire_validation?: string;
}
