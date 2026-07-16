import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTropeDto } from './dtos/create-trope.dto.js';

@Injectable()
export class TropesService {
  constructor(private prisma: PrismaService) {}

  async tropes(parameters: { topLevelOnly?: boolean }) {
    const { topLevelOnly } = parameters;
    return this.prisma.trope.findMany({
      where: topLevelOnly ? { parentId: null } : undefined,
      orderBy: { name: 'asc' },
      omit: { description: true },
    });
  }

  async trope(where: Prisma.TropeWhereUniqueInput) {
    return this.prisma.trope.findUnique({ where, omit: { description: true } });
  }

  async createTrope(dto: CreateTropeDto) {
    try {
      return await this.prisma.trope.create({
        data: {
          name: dto.name,
          description: dto.description,
          parentId: dto.parentId,
        },
        omit: { description: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(`Trope with name "${dto.name}" already exists`);
        }
        if (error.code === 'P2003') {
          throw new BadRequestException(`Parent trope ${dto.parentId} does not exist`);
        }
      }
      throw error;
    }
  }

  async toggleLike(
    tropeId: string,
    userId: string,
  ): Promise<{ liked: boolean; likeScore: number }> {
    const trope = await this.prisma.trope.findUnique({
      where: { id: tropeId },
    });
    if (!trope) {
      throw new NotFoundException(`Trope ${tropeId} not found`);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const deleted = await tx.tropeLike.deleteMany({ where: { tropeId, userId } });
        if (deleted.count > 0) {
          const updated = await tx.trope.update({
            where: { id: tropeId },
            data: { likeScore: { decrement: deleted.count } },
          });
          return { liked: false, likeScore: updated.likeScore };
        }

        await tx.tropeLike.create({ data: { tropeId, userId } });
        const updated = await tx.trope.update({
          where: { id: tropeId },
          data: { likeScore: { increment: 1 } },
        });
        return { liked: true, likeScore: updated.likeScore };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const current = await this.prisma.trope.findUniqueOrThrow({
          where: { id: tropeId },
          select: { likeScore: true },
        });
        return { liked: true, likeScore: current.likeScore };
      }
      throw error;
    }
  }

  async children(tropeId: string) {
    const trope = await this.prisma.trope.findUnique({
      where: { id: tropeId },
    });
    if (!trope) {
      throw new NotFoundException(`Trope ${tropeId} not found`);
    }

    return this.prisma.trope.findMany({
      where: { parentId: tropeId },
      orderBy: { name: 'asc' },
      omit: { description: true },
    });
  }

  async setParent(tropeId: string, parentId: string | null) {
    const trope = await this.prisma.trope.findUnique({
      where: { id: tropeId },
    });
    if (!trope) {
      throw new NotFoundException(`Trope ${tropeId} not found`);
    }

    if (parentId !== null) {
      if (parentId === tropeId) {
        throw new BadRequestException('A trope cannot be its own parent');
      }

      let cursor = await this.prisma.trope.findUnique({
        where: { id: parentId },
      });
      if (!cursor) {
        throw new NotFoundException(`Parent trope ${parentId} not found`);
      }

      while (cursor.parentId) {
        if (cursor.parentId === tropeId) {
          throw new BadRequestException('Assigning this parent would create a circular hierarchy');
        }
        cursor = await this.prisma.trope.findUnique({
          where: { id: cursor.parentId },
        });
        if (!cursor) break;
      }
    }

    return this.prisma.trope.update({
      where: { id: tropeId },
      data: { parentId },
      omit: { description: true },
    });
  }
}
