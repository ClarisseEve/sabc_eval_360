import { IsString, IsOptional, IsDateString, IsInt, Min } from 'class-validator';

export class CreateRemplacementDto {
  @IsString()
  titulaire_matricule!: string;

  @IsString()
  remplacant_matricule!: string;

  @IsString()
  role_remplace!: string;

  @IsString()
  region_remplacement!: string;

  @IsString()
  motif!: string;

  @IsDateString()
  date_debut!: string;

  @IsDateString()
  @IsOptional()
  date_fin?: string;

  @IsInt()
  @Min(30)
  duree_prevue_jours!: number;

  @IsString()
  @IsOptional()
  service_remplacement?: string;
}
