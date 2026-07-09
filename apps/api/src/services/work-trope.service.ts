import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, VoteType, WorkTropeSource } from '../../generated/prisma/client.js';
import { PrismaService } from './prisma.service';

function voteContribution(voteType: VoteType): number {
  return voteType === VoteType.UP ? 1 : -1;
}

@Injectable()
export class WorkTropeService {
  constructor(private prisma: PrismaService) {}

  async tropesOfWork(workId: string) {
    const work = await this.prisma.work.findUnique({ where: { id: workId } });
    if (!work) {
      throw new NotFoundException(`Book ${workId} not found`);
    }

    const workTropes = await this.prisma.workTrope.findMany({
      where: { workId },
      include: { trope: true },
    });
    return workTropes.map((wt) => wt.trope);
  }

  async worksOfTrope(tropeId: string) {
    const trope = await this.prisma.trope.findUnique({
      where: { id: tropeId },
    });
    if (!trope) {
      throw new NotFoundException(`Trope ${tropeId} not found`);
    }

    const workTropes = await this.prisma.workTrope.findMany({
      where: { tropeId },
      include: { work: true },
    });
    return workTropes.map((wt) => wt.work);
  }

  async linkTropeToWork(workId: string, tropeId: string, userId: string) {
    const [work, trope] = await Promise.all([
      this.prisma.work.findUnique({ where: { id: workId } }),
      this.prisma.trope.findUnique({ where: { id: tropeId } }),
    ]);
    if (!work) {
      throw new NotFoundException(`Book ${workId} not found`);
    }
    if (!trope) {
      throw new NotFoundException(`Trope ${tropeId} not found`);
    }

    try {
      return await this.prisma.workTrope.create({
        data: {
          workId,
          tropeId,
          source: WorkTropeSource.USER,
          createdByUserId: userId,
        },
        include: { trope: true, work: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Trope ${tropeId} is already linked to book ${workId}`);
      }
      throw error;
    }
  }

  async vote(
    workId: string,
    tropeId: string,
    userId: string,
    voteType: VoteType,
  ): Promise<{ voteScore: number }> {
    const workTrope = await this.prisma.workTrope.findUnique({
      where: { workId_tropeId: { workId, tropeId } },
    });
    if (!workTrope) {
      throw new NotFoundException(`Trope ${tropeId} is not linked to book ${workId}`);
    }

    const existingVote = await this.prisma.workTropeVote.findUnique({
      where: { userId_workId_tropeId: { userId, workId, tropeId } },
    });

    if (!existingVote) {
      const delta = voteContribution(voteType);
      const [, updated] = await this.prisma.$transaction([
        this.prisma.workTropeVote.create({
          data: { userId, workId, tropeId, voteType },
        }),
        this.prisma.workTrope.update({
          where: { workId_tropeId: { workId, tropeId } },
          data: { voteScore: { increment: delta } },
        }),
      ]);
      return { voteScore: updated.voteScore };
    }

    if (existingVote.voteType === voteType) {
      return { voteScore: workTrope.voteScore };
    }

    const delta = voteContribution(voteType) - voteContribution(existingVote.voteType);
    const [, updated] = await this.prisma.$transaction([
      this.prisma.workTropeVote.update({
        where: { userId_workId_tropeId: { userId, workId, tropeId } },
        data: { voteType },
      }),
      this.prisma.workTrope.update({
        where: { workId_tropeId: { workId, tropeId } },
        data: { voteScore: { increment: delta } },
      }),
    ]);
    return { voteScore: updated.voteScore };
  }
}
