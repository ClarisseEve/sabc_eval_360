import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreatePeriodeDto {
  @IsString()
  code_periode!: string;

  @IsString()
  nom_periode!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  date_debut!: string;

  @IsDateString()
  date_fin!: string;
}
