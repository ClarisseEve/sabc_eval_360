import { IsString, Length } from 'class-validator';

export class CreateRapportDto {
  @IsString()
  @Length(1, 200)
  titre: string;
}
