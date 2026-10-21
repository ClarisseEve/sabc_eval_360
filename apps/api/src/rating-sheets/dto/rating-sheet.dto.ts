import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { RATING_SHEET_CATEGORIES } from '../rating-sheet-calculation';
import type { RatingSheetCategory } from '../rating-sheet-calculation';

export class RatingSheetCategoryDto {
  @IsString()
  @IsIn([...RATING_SHEET_CATEGORIES])
  type!: RatingSheetCategory;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100)
  poids!: number;
}

export class SaveRatingSheetConfigurationDto {
  @IsString()
  @IsIn(['moyenne', 'ponderee'])
  methode_calcul!: 'moyenne' | 'ponderee';

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => RatingSheetCategoryDto)
  categories!: RatingSheetCategoryDto[];
}

export class PublishRatingSheetsDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5000)
  @IsString({ each: true })
  matricules?: string[];
}
