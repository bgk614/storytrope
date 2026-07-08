import { Injectable } from '@nestjs/common'
import { PrismaService } from './prisma.service'

export type RankingPeriod = 'weekly' | 'monthly' | 'yearly'

const PERIOD_MS: Record<RankingPeriod, number> = {
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
  yearly: 365 * 24 * 60 * 60 * 1000
}

@Injectable()
export class RankingService {
  constructor(private prisma: PrismaService) {}

  async topTropes(period: RankingPeriod, take: number) {
    const since = new Date(Date.now() - PERIOD_MS[period])

    const [votes, likes] = await Promise.all([
      this.prisma.workTropeVote.findMany({
        where: { createdAt: { gte: since } },
        select: { tropeId: true, voteType: true }
      }),
      this.prisma.tropeLike.findMany({
        where: { createdAt: { gte: since } },
        select: { tropeId: true }
      })
    ])

    const scoreByTropeId = new Map<string, number>()
    for (const vote of votes) {
      const delta = vote.voteType === 'UP' ? 1 : -1
      scoreByTropeId.set(vote.tropeId, (scoreByTropeId.get(vote.tropeId) ?? 0) + delta)
    }
    for (const like of likes) {
      scoreByTropeId.set(like.tropeId, (scoreByTropeId.get(like.tropeId) ?? 0) + 1)
    }

    const topTropeIds = [...scoreByTropeId.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, take)
      .map(([tropeId]) => tropeId)

    if (topTropeIds.length === 0) {
      return []
    }

    const tropes = await this.prisma.trope.findMany({
      where: { id: { in: topTropeIds } }
    })
    const tropeById = new Map(tropes.map((t) => [t.id, t]))

    return topTropeIds.map((tropeId) => ({
      trope: tropeById.get(tropeId),
      score: scoreByTropeId.get(tropeId) ?? 0
    }))
  }
}
