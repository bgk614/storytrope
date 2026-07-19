import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';
import { AdminGuard } from './admin.guard';

function contextWithUserId(userId?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: userId ? { userId } : undefined }),
    }),
  } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let prisma: { user: { findUnique: jest.Mock } };

  beforeEach(async () => {
    prisma = { user: { findUnique: jest.fn() } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminGuard, { provide: PrismaService, useValue: prisma }],
    }).compile();

    guard = module.get<AdminGuard>(AdminGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ADMIN이면 통과', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: Role.ADMIN });

    await expect(guard.canActivate(contextWithUserId('user-1'))).resolves.toBe(true);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { role: true },
    });
  });

  it('USER면 ForbiddenException', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: Role.USER });

    await expect(guard.canActivate(contextWithUserId('user-1'))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('세션 유저 정보가 없으면 ForbiddenException', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(contextWithUserId())).rejects.toBeInstanceOf(ForbiddenException);
  });
});
