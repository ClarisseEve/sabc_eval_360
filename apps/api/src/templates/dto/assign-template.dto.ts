import { IsString, IsUUID, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignTemplateDto {
  @IsUUID()
  id_template!: string;

  @IsString()
  id_role!: string;

  @IsUUID()
  id_periode!: string;
}

class BulkAssignItem {
  @IsString()
  id_role!: string;

  @IsUUID()
  id_template!: string;
}

export class BulkAssignDto {
  @IsUUID()
  id_periode!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkAssignItem)
  assignations!: BulkAssignItem[];
}
