import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { WorkService } from './work.service';

describe('WorkService', () => {
  let service: WorkService;
  let prisma: { work: { findMany: jest.Mock; findUnique: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      work: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<WorkService>(WorkService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('works', () => {
    it('passes skip/take through and orders by createdAt desc', async () => {
      const works = [{ id: 'work-1' }];
      prisma.work.findMany.mockResolvedValue(works);

      const result = await service.works({ skip: 10, take: 5 });

      expect(result).toBe(works);
      expect(prisma.work.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          authors: { include: { author: true } },
          tropes: { include: { trope: { omit: { description: true } } } },
        },
      });
    });

    it('allows skip/take to be omitted', async () => {
      prisma.work.findMany.mockResolvedValue([]);

      await service.works({});

      expect(prisma.work.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: undefined, take: undefined }),
      );
    });
  });

  describe('work', () => {
    it('returns the work matched by the unique where clause', async () => {
      const work = { id: 'work-1' };
      prisma.work.findUnique.mockResolvedValue(work);

      const result = await service.work({ id: 'work-1' });

      expect(result).toBe(work);
      expect(prisma.work.findUnique).toHaveBeenCalledWith({
        where: { id: 'work-1' },
        include: {
          authors: { include: { author: true } },
          tropes: { include: { trope: { omit: { description: true } } } },
        },
      });
    });

    it('returns null when no work matches', async () => {
      prisma.work.findUnique.mockResolvedValue(null);

      const result = await service.work({ id: 'missing' });

      expect(result).toBeNull();
    });
  });
});
