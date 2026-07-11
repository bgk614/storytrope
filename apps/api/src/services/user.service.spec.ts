import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from './prisma.service';
import { UserService } from './user.service';

jest.mock('bcrypt');

function uniqueViolation(target: string[]) {
  return new Prisma.PrismaClientKnownRequestError('mock error', {
    code: 'P2002',
    clientVersion: 'test',
    meta: { target },
  });
}

describe('UserService', () => {
  let service: UserService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('user', () => {
    it('finds a user by the unique where clause', async () => {
      const user = { id: 'user-1' };
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.user({ email: 'a@b.com' });

      expect(result).toBe(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
    });
  });

  describe('users', () => {
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

      const result = await service.users(parameters);

      expect(result).toBe(users);
      expect(prisma.user.findMany).toHaveBeenCalledWith(parameters);
    });
  });

  describe('createUser', () => {
    it('hashes the password before storing the user', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      const created = { id: 'user-1' };
      prisma.user.create.mockResolvedValue(created);

      const result = await service.createUser({
        email: 'a@b.com',
        password: 'plain-pw',
        nickname: 'nick',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('plain-pw', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: 'a@b.com', nickname: 'nick', passwordHash: 'hashed-pw' },
        omit: { passwordHash: true },
      });
      expect(result).toBe(created);
    });

    it('maps a duplicate email to ConflictException', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      prisma.user.create.mockRejectedValue(uniqueViolation(['email']));

      const dto = { email: 'a@b.com', password: 'pw', nickname: 'nick' };
      await expect(service.createUser(dto)).rejects.toThrow(ConflictException);
      await expect(service.createUser(dto)).rejects.toThrow(
        'A user with this email already exists',
      );
    });

    it('maps a duplicate nickname to ConflictException', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      prisma.user.create.mockRejectedValue(uniqueViolation(['nickname']));

      await expect(
        service.createUser({ email: 'a@b.com', password: 'pw', nickname: 'nick' }),
      ).rejects.toThrow('A user with this nickname already exists');
    });

    it('rethrows unknown errors untouched', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      const boom = new Error('db down');
      prisma.user.create.mockRejectedValue(boom);

      await expect(
        service.createUser({ email: 'a@b.com', password: 'pw', nickname: 'nick' }),
      ).rejects.toBe(boom);
    });
  });

  describe('updateUser', () => {
    it('updates the user matched by where clause', async () => {
      const updated = { id: 'user-1', nickname: 'new-nick' };
      prisma.user.update.mockResolvedValue(updated);

      const result = await service.updateUser({
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

  describe('deleteUser', () => {
    it('deletes the user matched by where clause', async () => {
      const deleted = { id: 'user-1' };
      prisma.user.delete.mockResolvedValue(deleted);

      const result = await service.deleteUser({ id: 'user-1' });

      expect(result).toBe(deleted);
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    });
  });
});
