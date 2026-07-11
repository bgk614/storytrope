import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export type RankingPeriod = 'weekly' | 'monthly' | 'yearly';

const PERIOD_MS: Record<RankingPeriod, number> = {
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
  yearly: 365 * 24 * 60 * 60 * 1000,
};

@Injectable()
export class RankingService {
  constructor(private prisma: PrismaService) {}

  async topTropes(period: RankingPeriod, take: number) {
    const since = new Date(Date.now() - PERIOD_MS[period]);

    const [voteGroups, likeGroups] = await Promise.all([
      this.prisma.workTropeVote.groupBy({
        by: ['tropeId', 'voteType'],
        where: { createdAt: { gte: since } },
        _count: true,
      }),
      this.prisma.tropeLike.groupBy({
        by: ['tropeId'],
        where: { createdAt: { gte: since } },
        _count: true,
      }),
    ]);

    const scoreByTropeId = new Map<string, number>();
    for (const group of voteGroups) {
      const delta = (group.voteType === 'UP' ? 1 : -1) * group._count;
      scoreByTropeId.set(group.tropeId, (scoreByTropeId.get(group.tropeId) ?? 0) + delta);
    }
    for (const group of likeGroups) {
      scoreByTropeId.set(group.tropeId, (scoreByTropeId.get(group.tropeId) ?? 0) + group._count);
    }

    const topTropeIds = [...scoreByTropeId.entries()]
      .toSorted((a, b) => b[1] - a[1])
      .slice(0, take)
      .map(([tropeId]) => tropeId);

    if (topTropeIds.length === 0) {
      return [];
    }

    const tropes = await this.prisma.trope.findMany({
      where: { id: { in: topTropeIds } },
      omit: { description: true },
    });
    const tropeById = new Map(tropes.map((t) => [t.id, t]));

    return topTropeIds.map((tropeId) => ({
      trope: tropeById.get(tropeId),
      score: scoreByTropeId.get(tropeId) ?? 0,
    }));
  }
}
