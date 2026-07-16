import { Controller, Get, Query } from '@nestjs/common';
import { TopTropesQueryDto } from './ranking.dto';
import { RankingService } from './ranking.service';

@Controller('rankings')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('tropes')
  async topTropes(@Query() query: TopTropesQueryDto) {
    return this.rankingService.topTropes(query.period ?? 'weekly', query.take ?? 10);
  }
}
