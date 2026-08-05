import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  IsIn,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';

const emptyStringToNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? null : value;

export class CreateUserDto {
  @IsString()
  @MaxLength(5)
  matricule: string;

  @IsString()
  @MaxLength(100)
  nom: string;

  @IsString()
  @MaxLength(100)
  prenom: string;

  @IsEmail()
  @MaxLength(100)
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MaxLength(5)
  id_role: string;

  @IsString()
  @MaxLength(5)
  id_region: string;

  @Transform(emptyStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(5)
  manager_matricule?: string | null;

  @Transform(emptyStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telephone?: string | null;

  @Transform(emptyStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(10)
  id_service?: string | null;

  @Transform(emptyStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(10)
  id_district?: string | null;

  @Transform(emptyStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(10)
  id_secteur?: string | null;

  @Transform(emptyStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(10)
  sexe?: string | null;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nom?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  prenom?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  id_role?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5)
  id_region?: string;

  @Transform(emptyStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telephone?: string | null;

  @Transform(emptyStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(5)
  manager_matricule?: string | null;

  @Transform(emptyStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(10)
  id_service?: string | null;

  @Transform(emptyStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(10)
  id_district?: string | null;

  @Transform(emptyStringToNull)
  @IsOptional()
  @IsString()
  @MaxLength(10)
  id_secteur?: string | null;

  @IsOptional()
  @IsIn(['Actif', 'Inactif', 'Suspendu'])
  statut?: 'Actif' | 'Inactif' | 'Suspendu';
}
