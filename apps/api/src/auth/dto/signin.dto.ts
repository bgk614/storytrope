import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class SignInDto {
  @IsEmail()
  readonly email!: string;

  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(100)
  readonly password!: string;
}
