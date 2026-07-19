import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    session: { deleteMany: jest.Mock };
    workTropeVote: { deleteMany: jest.Mock };
    tropeLike: { deleteMany: jest.Mock };
    workLike: { deleteMany: jest.Mock };
    userBook: { deleteMany: jest.Mock };
    workTrope: { updateMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      session: { deleteMany: jest.fn() },
      workTropeVote: { deleteMany: jest.fn() },
      tropeLike: { deleteMany: jest.fn() },
      workLike: { deleteMany: jest.fn() },
      userBook: { deleteMany: jest.fn() },
      workTrope: { updateMany: jest.fn() },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation((function_: (tx: typeof prisma) => unknown) =>
      function_(prisma),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('id로 조회', async () => {
      const user = { id: 'user-1' };
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findById('user-1');

      expect(result).toBe(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    });

    it('없으면 null', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('페이지네이션/필터 파라미터 그대로 전달', async () => {
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
    it('where 조건으로 업데이트', async () => {
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
    it('연관 레코드 정리 후 삭제', async () => {
      const user = { id: 'user-1' };
      const deleted = { id: 'user-1' };
      prisma.user.findUniqueOrThrow.mockResolvedValue(user);
      prisma.user.delete.mockResolvedValue(deleted);

      const result = await service.delete({ id: 'user-1' });

      expect(result).toBe(deleted);
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
      expect(prisma.workTropeVote.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
      expect(prisma.tropeLike.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
      expect(prisma.workLike.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
      expect(prisma.userBook.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
      expect(prisma.workTrope.updateMany).toHaveBeenCalledWith({
        where: { createdByUserId: 'user-1' },
        data: { createdByUserId: null },
      });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    });
  });
});
