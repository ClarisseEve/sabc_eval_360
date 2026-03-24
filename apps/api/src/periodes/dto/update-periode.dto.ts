import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdatePeriodeDto {
  @IsString()
  @IsOptional()
  nom_periode?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  date_debut?: string;

  @IsDateString()
  @IsOptional()
  date_fin?: string;
}
