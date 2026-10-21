import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class DateRangeQueryDto {
  @IsOptional()
  @IsDateString({ strict: true })
  start_date?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  end_date?: string;

  @IsOptional()
  @IsUUID()
  id_periode?: string;
}
