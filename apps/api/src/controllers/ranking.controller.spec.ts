import { Test, TestingModule } from '@nestjs/testing';
import { RankingService } from '../services/ranking.service';
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

  it('defaults to weekly period and take of 10 when omitted', async () => {
    rankingService.topTropes.mockResolvedValue([]);

    await controller.topTropes({});

    expect(rankingService.topTropes).toHaveBeenCalledWith('weekly', 10);
  });

  it('passes through a validated period and take', async () => {
    rankingService.topTropes.mockResolvedValue([]);

    await controller.topTropes({ period: 'monthly', take: 25 });

    expect(rankingService.topTropes).toHaveBeenCalledWith('monthly', 25);
  });
});
