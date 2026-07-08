import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WorkTropeSource } from '../../generated/prisma/client.js';
import { PrismaService } from './prisma.service';

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
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          `Trope ${tropeId} is already linked to book ${workId}`,
        );
      }
      throw e;
    }
  }
}
