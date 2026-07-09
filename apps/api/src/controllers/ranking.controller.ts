import { Controller, Get, Query } from '@nestjs/common'
import { RankingPeriod, RankingService } from '../services/ranking.service'

const VALID_PERIODS: Set<RankingPeriod> = new Set(['weekly', 'monthly', 'yearly'])

@Controller('rankings')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('tropes')
  async topTropes(@Query('period') period?: string, @Query('take') take?: string) {
    const resolvedPeriod: RankingPeriod = VALID_PERIODS.has(period as RankingPeriod)
      ? (period as RankingPeriod)
      : 'weekly'

    return this.rankingService.topTropes(resolvedPeriod, take ? Number(take) : 10)
  }
}
