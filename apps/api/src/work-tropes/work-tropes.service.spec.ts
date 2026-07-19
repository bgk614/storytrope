import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, VoteType } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { WorkTropesService } from './work-tropes.service.js';

function prismaKnownError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('mock error', {
    code,
    clientVersion: 'test',
  });
}

describe('WorkTropesService', () => {
  let service: WorkTropesService;
  let prisma: {
    work: { findUnique: jest.Mock };
    trope: { findUnique: jest.Mock };
    workTrope: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    workTropeVote: {
      findUnique: jest.Mock;
      create: jest.Mock;
      updateMany: jest.Mock;
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      work: { findUnique: jest.fn() },
      trope: { findUnique: jest.fn() },
      workTrope: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      workTropeVote: {
        findUnique: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation((argument: unknown) =>
      typeof argument === 'function'
        ? (argument as (tx: typeof prisma) => unknown)(prisma)
        : Promise.all(argument as Promise<unknown>[]),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkTropesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<WorkTropesService>(WorkTropesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('tropesOfWork', () => {
    it('작품이 없으면 예외', async () => {
      prisma.work.findUnique.mockResolvedValue(null);

      await expect(service.tropesOfWork('missing')).rejects.toThrow(NotFoundException);
    });

    it('작품에 연결된 트로프 반환', async () => {
      prisma.work.findUnique.mockResolvedValue({ id: 'work-1' });
      prisma.workTrope.findMany.mockResolvedValue([
        { trope: { id: 'trope-1' } },
        { trope: { id: 'trope-2' } },
      ]);

      const result = await service.tropesOfWork('work-1');

      expect(result).toEqual([{ id: 'trope-1' }, { id: 'trope-2' }]);
    });
  });

  describe('worksOfTrope', () => {
    it('트로프가 없으면 예외', async () => {
      prisma.trope.findUnique.mockResolvedValue(null);

      await expect(service.worksOfTrope('missing')).rejects.toThrow(NotFoundException);
    });

    it('트로프에 연결된 작품 반환', async () => {
      prisma.trope.findUnique.mockResolvedValue({ id: 'trope-1' });
      prisma.workTrope.findMany.mockResolvedValue([
        { work: { id: 'work-1' } },
        { work: { id: 'work-2' } },
      ]);

      const result = await service.worksOfTrope('trope-1');

      expect(result).toEqual([{ id: 'work-1' }, { id: 'work-2' }]);
    });
  });

  describe('linkTropeToWork', () => {
    it('작품이 없으면 예외', async () => {
      prisma.work.findUnique.mockResolvedValue(null);
      prisma.trope.findUnique.mockResolvedValue({ id: 'trope-1' });

      await expect(service.linkTropeToWork('missing', 'trope-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('트로프가 없으면 예외', async () => {
      prisma.work.findUnique.mockResolvedValue({ id: 'work-1' });
      prisma.trope.findUnique.mockResolvedValue(null);

      await expect(service.linkTropeToWork('work-1', 'missing', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('source USER로 연결 생성', async () => {
      prisma.work.findUnique.mockResolvedValue({ id: 'work-1' });
      prisma.trope.findUnique.mockResolvedValue({ id: 'trope-1' });
      const created = { workId: 'work-1', tropeId: 'trope-1' };
      prisma.workTrope.create.mockResolvedValue(created);

      const result = await service.linkTropeToWork('work-1', 'trope-1', 'user-1');

      expect(result).toBe(created);
      expect(prisma.workTrope.create).toHaveBeenCalledWith({
        data: { workId: 'work-1', tropeId: 'trope-1', source: 'USER', createdByUserId: 'user-1' },
        include: { trope: { omit: { description: true } }, work: true },
      });
    });

    it('중복 연결이면 ConflictException', async () => {
      prisma.work.findUnique.mockResolvedValue({ id: 'work-1' });
      prisma.trope.findUnique.mockResolvedValue({ id: 'trope-1' });
      prisma.workTrope.create.mockRejectedValue(prismaKnownError('P2002'));

      await expect(service.linkTropeToWork('work-1', 'trope-1', 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('무관한 에러는 그대로 던짐', async () => {
      prisma.work.findUnique.mockResolvedValue({ id: 'work-1' });
      prisma.trope.findUnique.mockResolvedValue({ id: 'trope-1' });
      const error = new Error('boom');
      prisma.workTrope.create.mockRejectedValue(error);

      await expect(service.linkTropeToWork('work-1', 'trope-1', 'user-1')).rejects.toThrow(error);
    });
  });

  describe('vote', () => {
    it('트로프가 작품에 연결 안 됐으면 예외', async () => {
      prisma.workTrope.findUnique.mockResolvedValue(null);

      await expect(service.vote('work-1', 'trope-1', 'user-1', VoteType.UP)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('신규 UP 투표, 점수 증가', async () => {
      prisma.workTrope.findUnique.mockResolvedValue({ voteScore: 0 });
      prisma.workTropeVote.findUnique.mockResolvedValue(null);
      prisma.workTropeVote.create.mockResolvedValue({});
      prisma.workTrope.update.mockResolvedValue({ voteScore: 1 });

      const result = await service.vote('work-1', 'trope-1', 'user-1', VoteType.UP);

      expect(result).toEqual({ voteScore: 1 });
      expect(prisma.workTropeVote.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', workId: 'work-1', tropeId: 'trope-1', voteType: VoteType.UP },
      });
      expect(prisma.workTrope.update).toHaveBeenCalledWith({
        where: { workId_tropeId: { workId: 'work-1', tropeId: 'trope-1' } },
        data: { voteScore: { increment: 1 } },
      });
    });

    it('신규 DOWN 투표, 점수 감소', async () => {
      prisma.workTrope.findUnique.mockResolvedValue({ voteScore: 0 });
      prisma.workTropeVote.findUnique.mockResolvedValue(null);
      prisma.workTropeVote.create.mockResolvedValue({});
      prisma.workTrope.update.mockResolvedValue({ voteScore: -1 });

      const result = await service.vote('work-1', 'trope-1', 'user-1', VoteType.DOWN);

      expect(result).toEqual({ voteScore: -1 });
      expect(prisma.workTrope.update).toHaveBeenCalledWith({
        where: { workId_tropeId: { workId: 'work-1', tropeId: 'trope-1' } },
        data: { voteScore: { increment: -1 } },
      });
    });

    it('같은 투표 재요청 시 쓰기 없이 현재 점수 반환', async () => {
      prisma.workTrope.findUnique.mockResolvedValue({ voteScore: 5 });
      prisma.workTropeVote.findUnique.mockResolvedValue({ voteType: VoteType.UP });
      prisma.workTrope.findUniqueOrThrow.mockResolvedValue({ voteScore: 5 });

      const result = await service.vote('work-1', 'trope-1', 'user-1', VoteType.UP);

      expect(result).toEqual({ voteScore: 5 });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('투표 뒤집으면 델타를 두 배로 적용', async () => {
      prisma.workTrope.findUnique.mockResolvedValue({ voteScore: 1 });
      prisma.workTropeVote.findUnique.mockResolvedValue({ voteType: VoteType.UP });
      prisma.workTropeVote.updateMany.mockResolvedValue({ count: 1 });
      prisma.workTrope.update.mockResolvedValue({ voteScore: -1 });

      const result = await service.vote('work-1', 'trope-1', 'user-1', VoteType.DOWN);

      expect(result).toEqual({ voteScore: -1 });
      expect(prisma.workTropeVote.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', workId: 'work-1', tropeId: 'trope-1', voteType: VoteType.UP },
        data: { voteType: VoteType.DOWN },
      });
      expect(prisma.workTrope.update).toHaveBeenCalledWith({
        where: { workId_tropeId: { workId: 'work-1', tropeId: 'trope-1' } },
        data: { voteScore: { increment: -2 } },
      });
    });

    it('동시 최초 투표가 이기면 변경으로 재시도', async () => {
      prisma.workTrope.findUnique.mockResolvedValue({ voteScore: 1 });
      prisma.workTropeVote.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ voteType: VoteType.UP });
      prisma.workTropeVote.create.mockRejectedValue(prismaKnownError('P2002'));
      prisma.workTropeVote.updateMany.mockResolvedValue({ count: 1 });
      prisma.workTrope.update.mockResolvedValue({ voteScore: -1 });

      const result = await service.vote('work-1', 'trope-1', 'user-1', VoteType.DOWN);

      expect(result).toEqual({ voteScore: -1 });
      expect(prisma.workTropeVote.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', workId: 'work-1', tropeId: 'trope-1', voteType: VoteType.UP },
        data: { voteType: VoteType.DOWN },
      });
    });

    it('동시 뒤집기가 이미 있었으면 델타 중복 적용 안 함', async () => {
      prisma.workTrope.findUnique.mockResolvedValue({ voteScore: 1 });
      prisma.workTropeVote.findUnique.mockResolvedValue({ voteType: VoteType.UP });
      prisma.workTropeVote.updateMany.mockResolvedValue({ count: 0 });
      prisma.workTrope.findUniqueOrThrow.mockResolvedValue({ voteScore: -1 });

      const result = await service.vote('work-1', 'trope-1', 'user-1', VoteType.DOWN);

      expect(result).toEqual({ voteScore: -1 });
      expect(prisma.workTrope.update).not.toHaveBeenCalled();
    });
  });

  describe('listAll', () => {
    it('필터/페이지네이션 전달, createdAt desc 정렬', async () => {
      const links = [{ workId: 'work-1', tropeId: 'trope-1' }];
      prisma.workTrope.findMany.mockResolvedValue(links);

      const result = await service.listAll({ skip: 5, take: 10, source: 'USER' });

      expect(result).toBe(links);
      expect(prisma.workTrope.findMany).toHaveBeenCalledWith({
        where: { source: 'USER', workId: undefined },
        include: {
          work: { select: { id: true, title: true } },
          trope: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: 5,
        take: 10,
      });
    });
  });

  describe('unlink', () => {
    it('연결이 없으면 예외', async () => {
      prisma.workTrope.findUnique.mockResolvedValue(null);

      await expect(service.unlink('work-1', 'trope-1')).rejects.toThrow(NotFoundException);
    });

    it('투표 삭제 후 연결 삭제', async () => {
      prisma.workTrope.findUnique.mockResolvedValue({ workId: 'work-1', tropeId: 'trope-1' });
      prisma.workTropeVote.deleteMany.mockResolvedValue({ count: 2 });
      prisma.workTrope.delete.mockResolvedValue({});

      await service.unlink('work-1', 'trope-1');

      expect(prisma.workTropeVote.deleteMany).toHaveBeenCalledWith({
        where: { workId: 'work-1', tropeId: 'trope-1' },
      });
      expect(prisma.workTrope.delete).toHaveBeenCalledWith({
        where: { workId_tropeId: { workId: 'work-1', tropeId: 'trope-1' } },
      });
    });
  });
});
