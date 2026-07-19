import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { WorksService } from './works.service';

describe('WorkService', () => {
  let service: WorksService;
  let prisma: { work: { findMany: jest.Mock; findUnique: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      work: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [WorksService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<WorksService>(WorksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('works', () => {
    it('skip/take 전달, createdAt desc 정렬', async () => {
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

    it('skip/take 생략 가능', async () => {
      prisma.work.findMany.mockResolvedValue([]);

      await service.works({});

      expect(prisma.work.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: undefined, take: undefined }),
      );
    });
  });

  describe('work', () => {
    it('where 조건으로 작품 조회', async () => {
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

    it('없으면 null', async () => {
      prisma.work.findUnique.mockResolvedValue(null);

      const result = await service.work({ id: 'missing' });

      expect(result).toBeNull();
    });
  });
});
