import { IsDateString, IsOptional } from 'class-validator';

export class TerminerRemplacementDto {
  @IsOptional()
  @IsDateString()
  date_fin?: string;
}
