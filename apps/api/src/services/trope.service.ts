import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { CreateTropeDto } from '../dtos/trope.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class TropeService {
  constructor(private prisma: PrismaService) {}

  async tropes(params: { topLevelOnly?: boolean }) {
    const { topLevelOnly } = params;
    return this.prisma.trope.findMany({
      where: topLevelOnly ? { parentId: null } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async trope(where: Prisma.TropeWhereUniqueInput) {
    return this.prisma.trope.findUnique({ where });
  }

  async createTrope(dto: CreateTropeDto) {
    try {
      return await this.prisma.trope.create({
        data: {
          name: dto.name,
          description: dto.description,
          parentId: dto.parentId,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ConflictException(
            `Trope with name "${dto.name}" already exists`,
          );
        }
        if (e.code === 'P2003') {
          throw new BadRequestException(
            `Parent trope ${dto.parentId} does not exist`,
          );
        }
      }
      throw e;
    }
  }
}
