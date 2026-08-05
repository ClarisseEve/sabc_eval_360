import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRemplacementDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  titulaire_matricule!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  remplacant_matricule!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  role_remplace!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  region_remplacement!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
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
  @MaxLength(100)
  service_remplacement?: string;
}
