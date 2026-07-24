import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { WorksService } from './works.service';

describe('WorkService', () => {
  let service: WorksService;
  let prisma: {
    work: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    author: { findFirst: jest.Mock; create: jest.Mock };
    workAuthor: { create: jest.Mock; deleteMany: jest.Mock };
    workTrope: { deleteMany: jest.Mock };
    workTropeVote: { deleteMany: jest.Mock };
    workLike: { deleteMany: jest.Mock };
    userBook: { deleteMany: jest.Mock };
    workSubject: { deleteMany: jest.Mock };
    edition: { deleteMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      work: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      author: { findFirst: jest.fn(), create: jest.fn() },
      workAuthor: { create: jest.fn(), deleteMany: jest.fn() },
      workTrope: { deleteMany: jest.fn() },
      workTropeVote: { deleteMany: jest.fn() },
      workLike: { deleteMany: jest.fn() },
      userBook: { deleteMany: jest.fn() },
      workSubject: { deleteMany: jest.fn() },
      edition: { deleteMany: jest.fn() },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation((function_: (tx: typeof prisma) => unknown) =>
      function_(prisma),
    );

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

  describe('createWork', () => {
    it('기존 저자가 있으면 재사용', async () => {
      prisma.work.create.mockResolvedValue({ id: 'work-1' });
      prisma.author.findFirst.mockResolvedValue({
        id: 'author-1',
        name: '기존 저자',
      });
      const created = { id: 'work-1' };
      prisma.work.findUniqueOrThrow.mockResolvedValue(created);

      const result = await service.createWork({
        title: '제목',
        authorNames: ['기존 저자'],
      });

      expect(result).toBe(created);
      expect(prisma.author.create).not.toHaveBeenCalled();
      expect(prisma.workAuthor.create).toHaveBeenCalledWith({
        data: { workId: 'work-1', authorId: 'author-1' },
      });
    });

    it('저자가 없으면 새로 생성', async () => {
      prisma.work.create.mockResolvedValue({ id: 'work-1' });
      prisma.author.findFirst.mockResolvedValue(null);
      prisma.author.create.mockResolvedValue({
        id: 'author-new',
        name: '새 저자',
      });
      prisma.work.findUniqueOrThrow.mockResolvedValue({ id: 'work-1' });

      await service.createWork({ title: '제목', authorNames: ['새 저자'] });

      expect(prisma.author.create).toHaveBeenCalledWith({
        data: { name: '새 저자' },
      });
      expect(prisma.workAuthor.create).toHaveBeenCalledWith({
        data: { workId: 'work-1', authorId: 'author-new' },
      });
    });
  });

  describe('updateWork', () => {
    it('작품이 없으면 예외', async () => {
      prisma.work.findUnique.mockResolvedValue(null);

      await expect(service.updateWork('missing', { title: '제목' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('authorNames 주어지면 기존 저자 연결 전체 교체', async () => {
      prisma.work.findUnique.mockResolvedValue({ id: 'work-1' });
      prisma.author.findFirst.mockResolvedValue({
        id: 'author-1',
        name: '저자',
      });
      prisma.work.findUniqueOrThrow.mockResolvedValue({ id: 'work-1' });

      await service.updateWork('work-1', { authorNames: ['저자'] });

      expect(prisma.workAuthor.deleteMany).toHaveBeenCalledWith({
        where: { workId: 'work-1' },
      });
      expect(prisma.workAuthor.create).toHaveBeenCalledWith({
        data: { workId: 'work-1', authorId: 'author-1' },
      });
    });

    it('authorNames 생략하면 저자 연결 건드리지 않음', async () => {
      prisma.work.findUnique.mockResolvedValue({ id: 'work-1' });
      prisma.work.findUniqueOrThrow.mockResolvedValue({ id: 'work-1' });

      await service.updateWork('work-1', { title: '새 제목' });

      expect(prisma.workAuthor.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('deleteWork', () => {
    it('작품이 없으면 예외', async () => {
      prisma.work.findUnique.mockResolvedValue(null);

      await expect(service.deleteWork('missing')).rejects.toThrow(NotFoundException);
    });

    it('연관 레코드 정리 후 삭제', async () => {
      prisma.work.findUnique.mockResolvedValue({ id: 'work-1' });

      await service.deleteWork('work-1');

      expect(prisma.workAuthor.deleteMany).toHaveBeenCalledWith({
        where: { workId: 'work-1' },
      });
      expect(prisma.workTropeVote.deleteMany).toHaveBeenCalledWith({
        where: { workId: 'work-1' },
      });
      expect(prisma.workTrope.deleteMany).toHaveBeenCalledWith({
        where: { workId: 'work-1' },
      });
      expect(prisma.workLike.deleteMany).toHaveBeenCalledWith({
        where: { workId: 'work-1' },
      });
      expect(prisma.userBook.deleteMany).toHaveBeenCalledWith({
        where: { workId: 'work-1' },
      });
      expect(prisma.workSubject.deleteMany).toHaveBeenCalledWith({
        where: { workId: 'work-1' },
      });
      expect(prisma.edition.deleteMany).toHaveBeenCalledWith({
        where: { workId: 'work-1' },
      });
      expect(prisma.work.delete).toHaveBeenCalledWith({
        where: { id: 'work-1' },
      });
    });
  });
});
