import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TropesService } from './tropes.service';

function prismaKnownError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('mock error', {
    code,
    clientVersion: 'test',
  });
}

describe('TropeService', () => {
  let service: TropesService;
  let prisma: {
    trope: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    tropeLike: { deleteMany: jest.Mock; create: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      trope: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      tropeLike: {
        deleteMany: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation((argument: unknown) =>
      typeof argument === 'function'
        ? (argument as (tx: typeof prisma) => unknown)(prisma)
        : Promise.all(argument as Promise<unknown>[]),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [TropesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<TropesService>(TropesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('tropes', () => {
    it('요청 시 최상위 트로프만 필터링', async () => {
      prisma.trope.findMany.mockResolvedValue([]);

      await service.tropes({ topLevelOnly: true });

      expect(prisma.trope.findMany).toHaveBeenCalledWith({
        where: { parentId: null },
        orderBy: { name: 'asc' },
        omit: { description: true },
      });
    });

    it('topLevelOnly가 falsy면 필터링 안 함', async () => {
      prisma.trope.findMany.mockResolvedValue([]);

      await service.tropes({});

      expect(prisma.trope.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });
  });

  describe('trope', () => {
    it('where 조건으로 조회, description 제외', async () => {
      const trope = { id: 'trope-1' };
      prisma.trope.findUnique.mockResolvedValue(trope);

      const result = await service.trope({ id: 'trope-1' });

      expect(result).toBe(trope);
      expect(prisma.trope.findUnique).toHaveBeenCalledWith({
        where: { id: 'trope-1' },
        omit: { description: true },
      });
    });
  });

  describe('createTrope', () => {
    it('dto로 트로프 생성', async () => {
      const created = { id: 'trope-1', name: 'Chosen One' };
      prisma.trope.create.mockResolvedValue(created);

      const result = await service.createTrope({
        name: 'Chosen One',
        description: 'desc',
        parentId: 'parent-1',
      });

      expect(result).toBe(created);
      expect(prisma.trope.create).toHaveBeenCalledWith({
        data: { name: 'Chosen One', description: 'desc', parentId: 'parent-1' },
        omit: { description: true },
      });
    });

    it('유니크 제약 위반이면 ConflictException', async () => {
      prisma.trope.create.mockRejectedValue(prismaKnownError('P2002'));

      await expect(service.createTrope({ name: 'Dup' })).rejects.toThrow(ConflictException);
    });

    it('외래키 누락이면 BadRequestException', async () => {
      prisma.trope.create.mockRejectedValue(prismaKnownError('P2003'));

      await expect(service.createTrope({ name: 'Orphan', parentId: 'missing' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('무관한 에러는 그대로 던짐', async () => {
      const error = new Error('boom');
      prisma.trope.create.mockRejectedValue(error);

      await expect(service.createTrope({ name: 'X' })).rejects.toThrow(error);
    });
  });

  describe('toggleLike', () => {
    it('트로프가 없으면 예외', async () => {
      prisma.trope.findUnique.mockResolvedValue(null);

      await expect(service.toggleLike('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('기존 좋아요 삭제, 점수 감소', async () => {
      prisma.trope.findUnique.mockResolvedValue({ id: 'trope-1' });
      prisma.tropeLike.deleteMany.mockResolvedValue({ count: 1 });
      prisma.trope.update.mockResolvedValue({ likeScore: 3 });

      const result = await service.toggleLike('trope-1', 'user-1');

      expect(result).toEqual({ liked: false, likeScore: 3 });
      expect(prisma.tropeLike.deleteMany).toHaveBeenCalledWith({
        where: { tropeId: 'trope-1', userId: 'user-1' },
      });
      expect(prisma.trope.update).toHaveBeenCalledWith({
        where: { id: 'trope-1' },
        data: { likeScore: { decrement: 1 } },
      });
    });

    it('좋아요 없으면 생성, 점수 증가', async () => {
      prisma.trope.findUnique.mockResolvedValue({ id: 'trope-1' });
      prisma.tropeLike.deleteMany.mockResolvedValue({ count: 0 });
      prisma.tropeLike.create.mockResolvedValue({});
      prisma.trope.update.mockResolvedValue({ likeScore: 4 });

      const result = await service.toggleLike('trope-1', 'user-1');

      expect(result).toEqual({ liked: true, likeScore: 4 });
      expect(prisma.tropeLike.create).toHaveBeenCalledWith({
        data: { tropeId: 'trope-1', userId: 'user-1' },
      });
    });

    it('동시 중복 좋아요는 이미 좋아요한 것으로 처리', async () => {
      prisma.trope.findUnique.mockResolvedValue({ id: 'trope-1' });
      prisma.tropeLike.deleteMany.mockResolvedValue({ count: 0 });
      prisma.tropeLike.create.mockRejectedValue(prismaKnownError('P2002'));
      prisma.trope.findUniqueOrThrow.mockResolvedValue({ likeScore: 5 });

      const result = await service.toggleLike('trope-1', 'user-1');

      expect(result).toEqual({ liked: true, likeScore: 5 });
      expect(prisma.trope.update).not.toHaveBeenCalled();
    });
  });

  describe('children', () => {
    it('부모 트로프가 없으면 예외', async () => {
      prisma.trope.findUnique.mockResolvedValue(null);

      await expect(service.children('missing')).rejects.toThrow(NotFoundException);
    });

    it('하위 트로프를 이름순으로 반환', async () => {
      prisma.trope.findUnique.mockResolvedValue({ id: 'trope-1' });
      const children = [{ id: 'child-1' }];
      prisma.trope.findMany.mockResolvedValue(children);

      const result = await service.children('trope-1');

      expect(result).toBe(children);
      expect(prisma.trope.findMany).toHaveBeenCalledWith({
        where: { parentId: 'trope-1' },
        orderBy: { name: 'asc' },
        omit: { description: true },
      });
    });
  });

  describe('setParent', () => {
    it('트로프가 없으면 예외', async () => {
      prisma.trope.findUnique.mockResolvedValue(null);

      await expect(service.setParent('missing', 'parent-1')).rejects.toThrow(NotFoundException);
    });

    it('자기 자신을 부모로 지정하면 예외', async () => {
      prisma.trope.findUnique.mockResolvedValue({ id: 'trope-1' });

      await expect(service.setParent('trope-1', 'trope-1')).rejects.toThrow(BadRequestException);
    });

    it('부모 트로프가 없으면 예외', async () => {
      prisma.trope.findUnique.mockResolvedValueOnce({ id: 'trope-1' }).mockResolvedValueOnce(null);

      await expect(service.setParent('trope-1', 'missing-parent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('새 부모 체인이 순환을 만들면 예외', async () => {
      // trope-1을 trope-3의 자식으로 설정하려 하지만, trope-3의 조상 체인이 이미 trope-1로 이어짐
      prisma.trope.findUnique
        .mockResolvedValueOnce({ id: 'trope-1' }) // 트로프 자신
        .mockResolvedValueOnce({ id: 'trope-3', parentId: 'trope-2' }) // 부모 후보
        .mockResolvedValueOnce({ id: 'trope-2', parentId: 'trope-1' }); // 체인을 따라 올라감

      await expect(service.setParent('trope-1', 'trope-3')).rejects.toThrow(BadRequestException);
    });

    it('순환이 없으면 부모 갱신', async () => {
      prisma.trope.findUnique
        .mockResolvedValueOnce({ id: 'trope-1' })
        .mockResolvedValueOnce({ id: 'trope-2', parentId: null });
      const updated = { id: 'trope-1', parentId: 'trope-2' };
      prisma.trope.update.mockResolvedValue(updated);

      const result = await service.setParent('trope-1', 'trope-2');

      expect(result).toBe(updated);
      expect(prisma.trope.update).toHaveBeenCalledWith({
        where: { id: 'trope-1' },
        data: { parentId: 'trope-2' },
        omit: { description: true },
      });
    });

    it('parentId가 null이면 부모 해제', async () => {
      prisma.trope.findUnique.mockResolvedValueOnce({
        id: 'trope-1',
        parentId: 'trope-2',
      });
      const updated = { id: 'trope-1', parentId: null };
      prisma.trope.update.mockResolvedValue(updated);

      const result = await service.setParent('trope-1', null);

      expect(result).toBe(updated);
      expect(prisma.trope.update).toHaveBeenCalledWith({
        where: { id: 'trope-1' },
        data: { parentId: null },
        omit: { description: true },
      });
    });
  });
});
