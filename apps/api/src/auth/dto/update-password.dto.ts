import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  current_password?: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(8)
  password_confirmation!: string;
}
