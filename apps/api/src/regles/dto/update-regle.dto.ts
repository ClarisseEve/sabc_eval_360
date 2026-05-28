import { IsString, IsOptional, IsBoolean, IsArray, IsNumber, IsObject, ValidateNested, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

class EchelleUpdateDto {
  @IsNumber() min!: number;
  @IsNumber() max!: number;
}

class CritereUpdateDto {
  @IsString() nom!: string;
  @IsString() description!: string;
  @IsNumber() ponderation!: number;
  @IsObject() @ValidateNested() @Type(() => EchelleUpdateDto) echelle!: EchelleUpdateDto;
  @IsString() categorie!: string;
}

export class UpdateRegleDto {
  @IsOptional() @IsString() @MaxLength(150) nom_regle?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() role_evaluateur?: string;
  @IsOptional() @IsString() role_evalue?: string;
  @IsOptional() @IsString() type_evaluation?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CritereUpdateDto) criteres?: CritereUpdateDto[];
  @IsOptional() @IsBoolean() est_active?: boolean;
}
