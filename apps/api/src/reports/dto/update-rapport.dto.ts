import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class UpdateRapportDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  titre?: string;

  @IsOptional()
  @IsIn(['brouillon', 'finalise'])
  statut?: string;
}
