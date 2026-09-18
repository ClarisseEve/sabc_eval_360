import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class UpdateRapportDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  titre?: string;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  sous_titre?: string;

  @IsOptional()
  @IsIn(['brouillon', 'finalise'])
  statut?: string;
}
