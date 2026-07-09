import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from './prisma.service';

const workListInclude = {
  authors: { include: { author: true } },
  tropes: { include: { trope: true } },
} satisfies Prisma.WorkInclude;

@Injectable()
export class WorkService {
  constructor(private prisma: PrismaService) {}

  async works(parameters: { skip?: number; take?: number }) {
    const { skip, take } = parameters;
    return this.prisma.work.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: workListInclude,
    });
  }

  async work(where: Prisma.WorkWhereUniqueInput) {
    return this.prisma.work.findUnique({
      where,
      include: workListInclude,
    });
  }
}
