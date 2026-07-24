import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateWorkDto } from './dto/create-work.dto.js';
import type { UpdateWorkDto } from './dto/update-work.dto.js';

const workListInclude = {
  authors: { include: { author: true } },
  tropes: { include: { trope: { omit: { description: true } } } },
} satisfies Prisma.WorkInclude;

@Injectable()
export class WorksService {
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

  async createWork(dto: CreateWorkDto) {
    return this.prisma.$transaction(async (tx) => {
      const work = await tx.work.create({
        data: {
          title: dto.title,
          description: dto.description,
          firstPublishDate: dto.firstPublishDate,
          coverId: dto.coverId,
        },
      });

      for (const name of dto.authorNames ?? []) {
        const trimmed = name.trim();
        if (!trimmed) continue;
        const author =
          (await tx.author.findFirst({ where: { name: trimmed } })) ??
          (await tx.author.create({ data: { name: trimmed } }));
        await tx.workAuthor.create({
          data: { workId: work.id, authorId: author.id },
        });
      }

      return tx.work.findUniqueOrThrow({
        where: { id: work.id },
        include: workListInclude,
      });
    });
  }

  async updateWork(id: string, dto: UpdateWorkDto) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.work.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Work ${id} not found`);
      }

      await tx.work.update({
        where: { id },
        data: {
          title: dto.title,
          description: dto.description,
          firstPublishDate: dto.firstPublishDate,
          coverId: dto.coverId,
        },
      });

      // authorNames가 주어지면 기존 저자 연결을 전체 교체 (부분 추가/삭제는 지원하지 않음)
      if (dto.authorNames) {
        await tx.workAuthor.deleteMany({ where: { workId: id } });
        for (const name of dto.authorNames) {
          const trimmed = name.trim();
          if (!trimmed) continue;
          const author =
            (await tx.author.findFirst({ where: { name: trimmed } })) ??
            (await tx.author.create({ data: { name: trimmed } }));
          await tx.workAuthor.create({
            data: { workId: id, authorId: author.id },
          });
        }
      }

      return tx.work.findUniqueOrThrow({
        where: { id },
        include: workListInclude,
      });
    });
  }

  // 연관 레코드(저자 연결/트로프/좋아요/읽기 목록 등)를 먼저 지워야 FK 제약 없이 삭제
  async deleteWork(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.work.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Work ${id} not found`);
      }

      await tx.workAuthor.deleteMany({ where: { workId: id } });
      await tx.workTropeVote.deleteMany({ where: { workId: id } });
      await tx.workTrope.deleteMany({ where: { workId: id } });
      await tx.workLike.deleteMany({ where: { workId: id } });
      await tx.userBook.deleteMany({ where: { workId: id } });
      await tx.workSubject.deleteMany({ where: { workId: id } });
      await tx.edition.deleteMany({ where: { workId: id } });
      await tx.work.delete({ where: { id } });
    });
  }
}
