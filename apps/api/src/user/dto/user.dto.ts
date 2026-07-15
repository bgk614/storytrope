import { IsEmail, IsNotEmpty } from 'class-validator';
import type { User } from '../../../generated/prisma/client.js';

export class UserDto {
  readonly id: string;

  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  readonly nickname: string;

  //TODO role 추가하기

  constructor(user: Pick<User, 'id' | 'email' | 'nickname'>) {
    this.id = user.id;
    this.email = user.email;
    this.nickname = user.nickname;
  }
}
