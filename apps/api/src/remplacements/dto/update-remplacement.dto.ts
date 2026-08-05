import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateRemplacementDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  titulaire_matricule?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  remplacant_matricule?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  role_remplace?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  region_remplacement?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  motif?: string;

  @IsOptional()
  @IsDateString()
  date_debut?: string;

  @IsOptional()
  @IsDateString()
  date_fin?: string | null;

  @IsOptional()
  @IsInt()
  @Min(30)
  duree_prevue_jours?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  service_remplacement?: string | null;
}
