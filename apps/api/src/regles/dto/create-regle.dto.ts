import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNumber,
  IsObject,
  ArrayMinSize,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class EchelleDto {
  @IsNumber() min!: number;
  @IsNumber() max!: number;
}

class CritereInputDto {
  @IsString() nom!: string;
  @IsString() description!: string;
  @IsNumber() ponderation!: number;
  @IsObject() @ValidateNested() @Type(() => EchelleDto) echelle!: EchelleDto;
  @IsString() categorie!: string;
}

export class CreateRegleDto {
  @IsString()
  @MaxLength(150)
  nom_regle!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  role_evaluateur?: string;

  @IsOptional()
  @IsString()
  role_evalue?: string;

  @IsOptional()
  @IsString()
  type_evaluation?: string;

  @IsArray()
  @ArrayMinSize(5)
  @ValidateNested({ each: true })
  @Type(() => CritereInputDto)
  criteres!: CritereInputDto[];

  @IsOptional()
  @IsBoolean()
  est_active?: boolean;
}
