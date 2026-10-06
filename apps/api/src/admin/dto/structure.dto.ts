import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRegionDto {
  @IsString()
  @MaxLength(5)
  id_region!: string;

  @IsString()
  @MaxLength(100)
  nom_region!: string;

  @IsOptional()
  @IsBoolean()
  est_taniere?: boolean;
}

export class UpdateRegionDto {
  @IsOptional()
  @IsString()
  @MaxLength(5)
  id_region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nom_region?: string;

  @IsOptional()
  @IsBoolean()
  est_taniere?: boolean;
}

export class CreateServiceDto {
  @IsString()
  @MaxLength(100)
  nom_service!: string;

  @IsString()
  @MaxLength(20)
  id_region!: string;
}

export class CreateDistrictDto {
  @IsString()
  @MaxLength(100)
  nom_district!: string;

  @IsString()
  @MaxLength(20)
  id_service!: string;
}

export class CreateSecteurDto {
  @IsString()
  @MaxLength(100)
  nom_secteur!: string;

  @IsString()
  @MaxLength(20)
  id_district!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  id_service?: string;
}

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nom_service?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  id_region?: string;
}

export class UpdateDistrictDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nom_district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  id_service?: string;
}

export class UpdateSecteurDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nom_secteur?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  id_district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  id_service?: string;
}
