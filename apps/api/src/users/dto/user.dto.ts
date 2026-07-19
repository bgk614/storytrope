import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { Role, type User } from '../../../generated/prisma/client.js';

export class UserDto {
  readonly id: string;

  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  readonly nickname: string;

  @IsEnum(Role)
  readonly role: Role;

  constructor(user: Pick<User, 'id' | 'email' | 'nickname' | 'role'>) {
    this.id = user.id;
    this.email = user.email;
    this.nickname = user.nickname;
    this.role = user.role;
  }
}
