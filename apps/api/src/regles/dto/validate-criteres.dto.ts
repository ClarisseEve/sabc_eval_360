import { IsArray, ValidateNested, IsString, IsNumber, IsObject, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class EchelleDto {
  @IsNumber()
  min!: number;

  @IsNumber()
  max!: number;
}

class CritereDto {
  @IsString()
  nom!: string;

  @IsString()
  description!: string;

  @IsNumber()
  ponderation!: number;

  @IsObject()
  @ValidateNested()
  @Type(() => EchelleDto)
  echelle!: EchelleDto;

  @IsString()
  categorie!: string;
}

export class ValidateCriteresDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CritereDto)
  criteres!: CritereDto[];
}
