import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from './prisma.service';
import { UserService } from './user.service';

jest.mock('bcrypt');

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
      });
      expect(result).toBe(created);
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
