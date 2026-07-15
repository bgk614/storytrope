import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SignUpDto {
  @IsEmail()
  readonly email!: string;

  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(100)
  readonly password!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  readonly nickname!: string;
}
