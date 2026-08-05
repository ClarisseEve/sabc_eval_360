import { Expose, Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class EvaluationNoteDto {
  /**
   * `id` and `id_critere` were emitted by older clients. They are accepted at
   * the boundary, but every downstream layer only receives `critere_id`.
   */
  @Expose()
  @Transform(({ value, obj }) => {
    const identifier = value ?? obj?.id_critere ?? obj?.id;
    return identifier === undefined || identifier === null
      ? identifier
      : String(identifier).trim();
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  critere_id!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  note!: number;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  commentaire?: string;
}

export class UpdateEvaluationDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => EvaluationNoteDto)
  notes!: EvaluationNoteDto[];

  @IsString()
  @IsOptional()
  @MaxLength(10000)
  commentaire_general?: string;
}
