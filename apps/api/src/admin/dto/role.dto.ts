import { IsString, IsInt, IsBoolean, IsOptional, IsIn, Min, Max, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @MaxLength(5)
  id_role: string;

  @IsString()
  @MaxLength(50)
  nom_role: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5)
  id_branche?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(10)
  niveau_taniere?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(10)
  niveau_non_taniere?: number;

  @IsBoolean()
  @IsOptional()
  peut_auto_evaluer?: boolean;

  @IsBoolean()
  @IsOptional()
  peut_evaluer_pairs?: boolean;

  @IsBoolean()
  @IsOptional()
  peut_evaluer_subordonnes?: boolean;

  @IsBoolean()
  @IsOptional()
  peut_cross_branch?: boolean;

  @IsIn(['region', 'global'])
  @IsOptional()
  portee_geographique?: string;
}

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nom_role?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5)
  id_branche?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(10)
  niveau_taniere?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(10)
  niveau_non_taniere?: number;

  @IsBoolean()
  @IsOptional()
  peut_auto_evaluer?: boolean;

  @IsBoolean()
  @IsOptional()
  peut_evaluer_pairs?: boolean;

  @IsBoolean()
  @IsOptional()
  peut_evaluer_subordonnes?: boolean;

  @IsBoolean()
  @IsOptional()
  peut_cross_branch?: boolean;

  @IsIn(['region', 'global'])
  @IsOptional()
  portee_geographique?: string;
}
