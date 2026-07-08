import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { Prisma } from '../../generated/prisma/client.js'
import { CreateTropeDto } from '../dtos/trope.dto'
import { PrismaService } from './prisma.service'

@Injectable()
export class TropeService {
  constructor(private prisma: PrismaService) {}

  async tropes(params: { topLevelOnly?: boolean }) {
    const { topLevelOnly } = params
    return this.prisma.trope.findMany({
      where: topLevelOnly ? { parentId: null } : undefined,
      orderBy: { name: 'asc' }
    })
  }

  async trope(where: Prisma.TropeWhereUniqueInput) {
    return this.prisma.trope.findUnique({ where })
  }

  async createTrope(dto: CreateTropeDto) {
    try {
      return await this.prisma.trope.create({
        data: {
          name: dto.name,
          description: dto.description,
          parentId: dto.parentId
        }
      })
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ConflictException(`Trope with name "${dto.name}" already exists`)
        }
        if (e.code === 'P2003') {
          throw new BadRequestException(`Parent trope ${dto.parentId} does not exist`)
        }
      }
      throw e
    }
  }

  async toggleLike(
    tropeId: string,
    userId: string
  ): Promise<{ liked: boolean; likeScore: number }> {
    const trope = await this.prisma.trope.findUnique({
      where: { id: tropeId }
    })
    if (!trope) {
      throw new NotFoundException(`Trope ${tropeId} not found`)
    }

    const existingLike = await this.prisma.tropeLike.findUnique({
      where: { tropeId_userId: { tropeId, userId } }
    })

    if (existingLike) {
      const [, updated] = await this.prisma.$transaction([
        this.prisma.tropeLike.delete({
          where: { tropeId_userId: { tropeId, userId } }
        }),
        this.prisma.trope.update({
          where: { id: tropeId },
          data: { likeScore: { decrement: 1 } }
        })
      ])
      return { liked: false, likeScore: updated.likeScore }
    }

    const [, updated] = await this.prisma.$transaction([
      this.prisma.tropeLike.create({ data: { tropeId, userId } }),
      this.prisma.trope.update({
        where: { id: tropeId },
        data: { likeScore: { increment: 1 } }
      })
    ])
    return { liked: true, likeScore: updated.likeScore }
  }

  async children(tropeId: string) {
    const trope = await this.prisma.trope.findUnique({
      where: { id: tropeId }
    })
    if (!trope) {
      throw new NotFoundException(`Trope ${tropeId} not found`)
    }

    return this.prisma.trope.findMany({
      where: { parentId: tropeId },
      orderBy: { name: 'asc' }
    })
  }

  async setParent(tropeId: string, parentId: string | null) {
    const trope = await this.prisma.trope.findUnique({
      where: { id: tropeId }
    })
    if (!trope) {
      throw new NotFoundException(`Trope ${tropeId} not found`)
    }

    if (parentId !== null) {
      if (parentId === tropeId) {
        throw new BadRequestException('A trope cannot be its own parent')
      }

      let cursor = await this.prisma.trope.findUnique({
        where: { id: parentId }
      })
      if (!cursor) {
        throw new NotFoundException(`Parent trope ${parentId} not found`)
      }

      while (cursor.parentId) {
        if (cursor.parentId === tropeId) {
          throw new BadRequestException('Assigning this parent would create a circular hierarchy')
        }
        cursor = await this.prisma.trope.findUnique({
          where: { id: cursor.parentId }
        })
        if (!cursor) break
      }
    }

    return this.prisma.trope.update({
      where: { id: tropeId },
      data: { parentId }
    })
  }
}
