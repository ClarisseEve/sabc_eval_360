import { IsArray, IsIn, IsOptional, IsString, IsUUID, ArrayNotEmpty } from 'class-validator';

export class SendBulkNotificationDto {
  @IsString()
  titre!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsIn(['role', 'region', 'individu', 'tous'])
  cible!: 'role' | 'region' | 'individu' | 'tous';

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  id_region?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  matricules?: string[];
}
