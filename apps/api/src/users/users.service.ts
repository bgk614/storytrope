import { Injectable } from '@nestjs/common';
import { Prisma, User } from '../../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async list(parameters: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = parameters;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async update(parameters: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = parameters;
    return this.prisma.user.update({
      data,
      where,
    });
  }
  // 세션/투표/좋아요 등 연관 레코드를 먼저 정리해야 FK 제약에 걸리지 않고 삭제할 수 있음
  // 사용자가 만든 WorkTrope 링크 자체는 유효한 콘텐츠이므로 삭제하지 않고 작성자만 null 처리
  async delete(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where });

      await tx.session.deleteMany({ where: { userId: user.id } });
      await tx.workTropeVote.deleteMany({ where: { userId: user.id } });
      await tx.tropeLike.deleteMany({ where: { userId: user.id } });
      await tx.workLike.deleteMany({ where: { userId: user.id } });
      await tx.userBook.deleteMany({ where: { userId: user.id } });
      await tx.workTrope.updateMany({
        where: { createdByUserId: user.id },
        data: { createdByUserId: null },
      });

      return tx.user.delete({ where: { id: user.id } });
    });
  }
}
