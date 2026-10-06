import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';

class TemplateLevelDescriptionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  niveau!: number;

  @IsString()
  @MaxLength(2000)
  description!: string;
}

class TemplateCompetenceDto {
  @IsString()
  libelle!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  niveau_requis?: number;

  @IsArray()
  @ArrayMinSize(5)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => TemplateLevelDescriptionDto)
  niveaux!: TemplateLevelDescriptionDto[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ordre?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100)
  poids!: number;
}

class TemplateSectionDto {
  @IsString()
  titre!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ordre?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateCompetenceDto)
  competences!: TemplateCompetenceDto[];
}

export class CreateTemplateDto {
  @IsString()
  @MaxLength(150)
  titre!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MaxLength(50)
  categorie!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  version?: string;

  @IsOptional()
  @IsBoolean()
  est_actif?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TemplateSectionDto)
  sections!: TemplateSectionDto[];
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  titre?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  categorie?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  version?: string;

  @IsOptional()
  @IsBoolean()
  est_actif?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TemplateSectionDto)
  sections?: TemplateSectionDto[];
}
