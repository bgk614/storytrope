import type { User } from '../../../generated/prisma/client.js';

export class PublicUserDto {
  readonly id: string;
  readonly nickname: string;

  constructor(user: Pick<User, 'id' | 'nickname'>) {
    this.id = user.id;
    this.nickname = user.nickname;
  }
}
