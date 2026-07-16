import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RankingService } from './ranking.service';

describe('RankingService', () => {
  let service: RankingService;
  let prisma: {
    workTropeVote: { groupBy: jest.Mock };
    tropeLike: { groupBy: jest.Mock };
    trope: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      workTropeVote: { groupBy: jest.fn() },
      tropeLike: { groupBy: jest.fn() },
      trope: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RankingService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<RankingService>(RankingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns an empty array when there are no votes or likes', async () => {
    prisma.workTropeVote.groupBy.mockResolvedValue([]);
    prisma.tropeLike.groupBy.mockResolvedValue([]);

    const result = await service.topTropes('weekly', 10);

    expect(result).toEqual([]);
    expect(prisma.trope.findMany).not.toHaveBeenCalled();
  });

  it('aggregates UP/DOWN vote counts and likes into a score, sorted descending', async () => {
    prisma.workTropeVote.groupBy.mockResolvedValue([
      { tropeId: 'trope-1', voteType: 'UP', _count: 2 },
      { tropeId: 'trope-2', voteType: 'UP', _count: 1 },
      { tropeId: 'trope-2', voteType: 'DOWN', _count: 1 },
      { tropeId: 'trope-3', voteType: 'DOWN', _count: 1 },
    ]);
    prisma.tropeLike.groupBy.mockResolvedValue([{ tropeId: 'trope-2', _count: 2 }]);
    prisma.trope.findMany.mockResolvedValue([
      { id: 'trope-1', name: 'A' },
      { id: 'trope-2', name: 'B' },
    ]);

    // trope-1 score: 2 (UP x2)
    // trope-2 score: 1 (UP) - 1 (DOWN) + 2 (likes) = 2
    // trope-3 score: -1 (DOWN)
    // trope-1 and trope-2 tie at 2; stable sort keeps insertion order (trope-1 first)
    const result = await service.topTropes('weekly', 2);

    expect(prisma.trope.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['trope-1', 'trope-2'] } },
      omit: { description: true },
    });
    expect(result).toEqual([
      { trope: { id: 'trope-1', name: 'A' }, score: 2 },
      { trope: { id: 'trope-2', name: 'B' }, score: 2 },
    ]);
  });

  it('limits results to the requested take', async () => {
    prisma.workTropeVote.groupBy.mockResolvedValue([
      { tropeId: 'trope-1', voteType: 'UP', _count: 1 },
      { tropeId: 'trope-2', voteType: 'UP', _count: 2 },
    ]);
    prisma.tropeLike.groupBy.mockResolvedValue([]);
    prisma.trope.findMany.mockResolvedValue([{ id: 'trope-2', name: 'B' }]);

    const result = await service.topTropes('monthly', 1);

    expect(prisma.trope.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['trope-2'] } },
      omit: { description: true },
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ trope: { id: 'trope-2', name: 'B' }, score: 2 });
  });

  it('queries votes/likes since the start of the requested period', async () => {
    prisma.workTropeVote.groupBy.mockResolvedValue([]);
    prisma.tropeLike.groupBy.mockResolvedValue([]);

    const before = Date.now();
    await service.topTropes('yearly', 10);
    const after = Date.now();

    const calls = prisma.workTropeVote.groupBy.mock.calls as Array<
      [{ where: { createdAt: { gte: Date } } }]
    >;
    const sinceArgument = calls[0][0].where.createdAt.gte;
    const yearMs = 365 * 24 * 60 * 60 * 1000;

    expect(sinceArgument.getTime()).toBeGreaterThanOrEqual(before - yearMs - 1000);
    expect(sinceArgument.getTime()).toBeLessThanOrEqual(after - yearMs + 1000);
  });
});
