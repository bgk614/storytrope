import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from './prisma.service';
import { TropeService } from './trope.service';

function prismaKnownError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('mock error', {
    code,
    clientVersion: 'test',
  });
}

describe('TropeService', () => {
  let service: TropeService;
  let prisma: {
    trope: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    tropeLike: { findUnique: jest.Mock; delete: jest.Mock; create: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      trope: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      tropeLike: {
        findUnique: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TropeService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<TropeService>(TropeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('tropes', () => {
    it('filters to top-level tropes when requested', async () => {
      prisma.trope.findMany.mockResolvedValue([]);

      await service.tropes({ topLevelOnly: true });

      expect(prisma.trope.findMany).toHaveBeenCalledWith({
        where: { parentId: null },
        orderBy: { name: 'asc' },
        omit: { description: true },
      });
    });

    it('does not filter when topLevelOnly is falsy', async () => {
      prisma.trope.findMany.mockResolvedValue([]);

      await service.tropes({});

      expect(prisma.trope.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });
  });

  describe('trope', () => {
    it('finds a trope by where clause, omitting description', async () => {
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
    it('creates a trope from the dto', async () => {
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

    it('maps a unique constraint violation to ConflictException', async () => {
      prisma.trope.create.mockRejectedValue(prismaKnownError('P2002'));

      await expect(service.createTrope({ name: 'Dup' })).rejects.toThrow(ConflictException);
    });

    it('maps a missing foreign key to BadRequestException', async () => {
      prisma.trope.create.mockRejectedValue(prismaKnownError('P2003'));

      await expect(service.createTrope({ name: 'Orphan', parentId: 'missing' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rethrows unrelated errors', async () => {
      const error = new Error('boom');
      prisma.trope.create.mockRejectedValue(error);

      await expect(service.createTrope({ name: 'X' })).rejects.toThrow(error);
    });
  });

  describe('toggleLike', () => {
    it('throws when the trope does not exist', async () => {
      prisma.trope.findUnique.mockResolvedValue(null);

      await expect(service.toggleLike('missing', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('removes an existing like and decrements the score', async () => {
      prisma.trope.findUnique.mockResolvedValue({ id: 'trope-1' });
      prisma.tropeLike.findUnique.mockResolvedValue({ tropeId: 'trope-1', userId: 'user-1' });
      prisma.$transaction.mockResolvedValue([undefined, { likeScore: 3 }]);

      const result = await service.toggleLike('trope-1', 'user-1');

      expect(result).toEqual({ liked: false, likeScore: 3 });
      expect(prisma.tropeLike.delete).toHaveBeenCalledWith({
        where: { tropeId_userId: { tropeId: 'trope-1', userId: 'user-1' } },
      });
      expect(prisma.trope.update).toHaveBeenCalledWith({
        where: { id: 'trope-1' },
        data: { likeScore: { decrement: 1 } },
      });
    });

    it('creates a like and increments the score when none exists', async () => {
      prisma.trope.findUnique.mockResolvedValue({ id: 'trope-1' });
      prisma.tropeLike.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockResolvedValue([undefined, { likeScore: 4 }]);

      const result = await service.toggleLike('trope-1', 'user-1');

      expect(result).toEqual({ liked: true, likeScore: 4 });
      expect(prisma.tropeLike.create).toHaveBeenCalledWith({
        data: { tropeId: 'trope-1', userId: 'user-1' },
      });
    });
  });

  describe('children', () => {
    it('throws when the parent trope does not exist', async () => {
      prisma.trope.findUnique.mockResolvedValue(null);

      await expect(service.children('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns direct children ordered by name', async () => {
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
    it('throws when the trope does not exist', async () => {
      prisma.trope.findUnique.mockResolvedValue(null);

      await expect(service.setParent('missing', 'parent-1')).rejects.toThrow(NotFoundException);
    });

    it('throws when assigning itself as parent', async () => {
      prisma.trope.findUnique.mockResolvedValue({ id: 'trope-1' });

      await expect(service.setParent('trope-1', 'trope-1')).rejects.toThrow(BadRequestException);
    });

    it('throws when the parent does not exist', async () => {
      prisma.trope.findUnique.mockResolvedValueOnce({ id: 'trope-1' }).mockResolvedValueOnce(null);

      await expect(service.setParent('trope-1', 'missing-parent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when the new parent chain would create a cycle', async () => {
      // trope-1 -> setParent to trope-3, but trope-3's ancestry already leads back to trope-1
      prisma.trope.findUnique
        .mockResolvedValueOnce({ id: 'trope-1' }) // the trope itself
        .mockResolvedValueOnce({ id: 'trope-3', parentId: 'trope-2' }) // parent candidate
        .mockResolvedValueOnce({ id: 'trope-2', parentId: 'trope-1' }); // walk up the chain

      await expect(service.setParent('trope-1', 'trope-3')).rejects.toThrow(BadRequestException);
    });

    it('updates the parent when no cycle is found', async () => {
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

    it('clears the parent when parentId is null', async () => {
      prisma.trope.findUnique.mockResolvedValueOnce({ id: 'trope-1', parentId: 'trope-2' });
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
