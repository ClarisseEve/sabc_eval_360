import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateEvaluationDto {
  @IsString()
  evaluateur_matricule!: string;

  @IsString()
  evalue_matricule!: string;

  @Transform(({ value }) => String(value))
  @IsNotEmpty()
  id_periode!: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null ? undefined : String(value)))
  id_regle?: string;
}
