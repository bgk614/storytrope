import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, VoteType } from '../../generated/prisma/client.js';
import { PrismaService } from './prisma.service';
import { WorkTropeService } from './work-trope.service';

function prismaKnownError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('mock error', {
    code,
    clientVersion: 'test',
  });
}

describe('WorkTropeService', () => {
  let service: WorkTropeService;
  let prisma: {
    work: { findUnique: jest.Mock };
    trope: { findUnique: jest.Mock };
    workTrope: { findMany: jest.Mock; findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    workTropeVote: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      work: { findUnique: jest.fn() },
      trope: { findUnique: jest.fn() },
      workTrope: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      workTropeVote: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkTropeService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<WorkTropeService>(WorkTropeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('tropesOfWork', () => {
    it('throws when the book does not exist', async () => {
      prisma.work.findUnique.mockResolvedValue(null);

      await expect(service.tropesOfWork('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns the tropes linked to the book', async () => {
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
    it('throws when the trope does not exist', async () => {
      prisma.trope.findUnique.mockResolvedValue(null);

      await expect(service.worksOfTrope('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns the books linked to the trope', async () => {
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
    it('throws when the book does not exist', async () => {
      prisma.work.findUnique.mockResolvedValue(null);
      prisma.trope.findUnique.mockResolvedValue({ id: 'trope-1' });

      await expect(service.linkTropeToWork('missing', 'trope-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when the trope does not exist', async () => {
      prisma.work.findUnique.mockResolvedValue({ id: 'work-1' });
      prisma.trope.findUnique.mockResolvedValue(null);

      await expect(service.linkTropeToWork('work-1', 'missing', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('creates the link with source USER', async () => {
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

    it('maps a duplicate link to ConflictException', async () => {
      prisma.work.findUnique.mockResolvedValue({ id: 'work-1' });
      prisma.trope.findUnique.mockResolvedValue({ id: 'trope-1' });
      prisma.workTrope.create.mockRejectedValue(prismaKnownError('P2002'));

      await expect(service.linkTropeToWork('work-1', 'trope-1', 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('rethrows unrelated errors', async () => {
      prisma.work.findUnique.mockResolvedValue({ id: 'work-1' });
      prisma.trope.findUnique.mockResolvedValue({ id: 'trope-1' });
      const error = new Error('boom');
      prisma.workTrope.create.mockRejectedValue(error);

      await expect(service.linkTropeToWork('work-1', 'trope-1', 'user-1')).rejects.toThrow(error);
    });
  });

  describe('vote', () => {
    it('throws when the trope is not linked to the book', async () => {
      prisma.workTrope.findUnique.mockResolvedValue(null);

      await expect(service.vote('work-1', 'trope-1', 'user-1', VoteType.UP)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('creates a new UP vote and increments the score', async () => {
      prisma.workTrope.findUnique.mockResolvedValue({ voteScore: 0 });
      prisma.workTropeVote.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockResolvedValue([undefined, { voteScore: 1 }]);

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

    it('creates a new DOWN vote and decrements the score', async () => {
      prisma.workTrope.findUnique.mockResolvedValue({ voteScore: 0 });
      prisma.workTropeVote.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockResolvedValue([undefined, { voteScore: -1 }]);

      const result = await service.vote('work-1', 'trope-1', 'user-1', VoteType.DOWN);

      expect(result).toEqual({ voteScore: -1 });
      expect(prisma.workTrope.update).toHaveBeenCalledWith({
        where: { workId_tropeId: { workId: 'work-1', tropeId: 'trope-1' } },
        data: { voteScore: { increment: -1 } },
      });
    });

    it('is a no-op when re-casting the same vote type', async () => {
      prisma.workTrope.findUnique.mockResolvedValue({ voteScore: 5 });
      prisma.workTropeVote.findUnique.mockResolvedValue({ voteType: VoteType.UP });

      const result = await service.vote('work-1', 'trope-1', 'user-1', VoteType.UP);

      expect(result).toEqual({ voteScore: 5 });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('flips an existing vote and applies double the delta', async () => {
      prisma.workTrope.findUnique.mockResolvedValue({ voteScore: 1 });
      prisma.workTropeVote.findUnique.mockResolvedValue({ voteType: VoteType.UP });
      prisma.$transaction.mockResolvedValue([undefined, { voteScore: -1 }]);

      const result = await service.vote('work-1', 'trope-1', 'user-1', VoteType.DOWN);

      expect(result).toEqual({ voteScore: -1 });
      expect(prisma.workTropeVote.update).toHaveBeenCalledWith({
        where: {
          userId_workId_tropeId: { userId: 'user-1', workId: 'work-1', tropeId: 'trope-1' },
        },
        data: { voteType: VoteType.DOWN },
      });
      expect(prisma.workTrope.update).toHaveBeenCalledWith({
        where: { workId_tropeId: { workId: 'work-1', tropeId: 'trope-1' } },
        data: { voteScore: { increment: -2 } },
      });
    });
  });
});
