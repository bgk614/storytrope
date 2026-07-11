import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  // bcrypt silently truncates input beyond 72 bytes, so longer passwords add no entropy
  @MaxLength(72)
  password: string;

  @IsNotEmpty()
  @IsString()
  nickname: string;
}
