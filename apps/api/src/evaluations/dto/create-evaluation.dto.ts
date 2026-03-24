import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateEvaluationDto {
  @IsString()
  evaluateur_matricule!: string;

  @IsString()
  evalue_matricule!: string;

  @IsUUID()
  id_periode!: string;

  @IsUUID()
  @IsOptional()
  id_regle?: string;
}
