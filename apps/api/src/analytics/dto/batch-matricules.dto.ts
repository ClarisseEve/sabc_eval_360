import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class BatchMatriculesDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(500)
  matricules!: string[];
}
