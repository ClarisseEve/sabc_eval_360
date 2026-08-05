import { IsDateString, IsOptional } from 'class-validator';

export class DateRangeQueryDto {
  @IsOptional()
  @IsDateString({ strict: true })
  start_date?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  end_date?: string;
}
