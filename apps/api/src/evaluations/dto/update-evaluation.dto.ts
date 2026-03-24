import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateEvaluationDto {
  @IsArray()
  notes!: Array<{ note: number; poids?: number; ponderation?: number; commentaire?: string }>;

  @IsString()
  @IsOptional()
  commentaire_general?: string;
}
