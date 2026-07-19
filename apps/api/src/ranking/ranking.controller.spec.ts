import { Test, TestingModule } from '@nestjs/testing';

import { RankingService } from './ranking.service';
import { RankingController } from './ranking.controller';

describe('RankingController', () => {
  let controller: RankingController;
  let rankingService: { topTropes: jest.Mock };

  beforeEach(async () => {
    rankingService = { topTropes: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RankingController],
      providers: [{ provide: RankingService, useValue: rankingService }],
    }).compile();

    controller = module.get<RankingController>(RankingController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('기본값: weekly, take 10', async () => {
    rankingService.topTropes.mockResolvedValue([]);

    await controller.topTropes({});

    expect(rankingService.topTropes).toHaveBeenCalledWith('weekly', 10);
  });

  it('period/take 그대로 전달', async () => {
    rankingService.topTropes.mockResolvedValue([]);

    await controller.topTropes({ period: 'monthly', take: 25 });

    expect(rankingService.topTropes).toHaveBeenCalledWith('monthly', 25);
  });
});
