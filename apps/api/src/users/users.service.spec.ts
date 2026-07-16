import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('finds a user by id', async () => {
      const user = { id: 'user-1' };
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findById('user-1');

      expect(result).toBe(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    });

    it('returns null when no user matches', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('passes all pagination/filter parameters through', async () => {
      const users = [{ id: 'user-1' }];
      prisma.user.findMany.mockResolvedValue(users);

      const parameters = {
        skip: 5,
        take: 10,
        cursor: { id: 'user-0' },
        where: { email: { contains: 'a' } },
        orderBy: { createdAt: 'desc' as const },
      };

      const result = await service.list(parameters);

      expect(result).toBe(users);
      expect(prisma.user.findMany).toHaveBeenCalledWith(parameters);
    });
  });

  describe('update', () => {
    it('updates the user matched by where clause', async () => {
      const updated = { id: 'user-1', nickname: 'new-nick' };
      prisma.user.update.mockResolvedValue(updated);

      const result = await service.update({
        where: { id: 'user-1' },
        data: { nickname: 'new-nick' },
      });

      expect(result).toBe(updated);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { nickname: 'new-nick' },
      });
    });
  });

  describe('delete', () => {
    it('deletes the user matched by where clause', async () => {
      const deleted = { id: 'user-1' };
      prisma.user.delete.mockResolvedValue(deleted);

      const result = await service.delete({ id: 'user-1' });

      expect(result).toBe(deleted);
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    });
  });
});
