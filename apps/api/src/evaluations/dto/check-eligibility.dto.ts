import { IsString, IsIn } from 'class-validator';

export class CheckEligibilityDto {
  @IsString() evaluateur_matricule!: string;
  @IsString() evalue_matricule!: string;
  @IsString() @IsIn(['auto', 'pairs', 'subordonnes']) type_evaluation!: string;
}
