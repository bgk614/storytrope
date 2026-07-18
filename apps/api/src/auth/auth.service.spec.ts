import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { hashSessionToken } from './session-token';

jest.mock('bcrypt');

type SessionCreateMock = jest.Mock<
  Promise<unknown>,
  [{ data: { id: string; userId: string; expiresAt: Date } }]
>;

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    session: {
      create: SessionCreateMock;
      deleteMany: jest.Mock;
      findUnique: jest.Mock;
    };
    user: { findUnique: jest.Mock };
  };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    prisma = {
      session: {
        create: jest.fn() as SessionCreateMock,
        deleteMany: jest.fn(),
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };
    configService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('미가입 이메일', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser('a@b.com', 'pw')).rejects.toThrow(UnauthorizedException);
    });

    it('비밀번호 불일치', async () => {
      prisma.user.findUnique.mockResolvedValue({ passwordHash: 'hash' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser('a@b.com', 'wrong')).rejects.toThrow(UnauthorizedException);
    });

    it('비밀번호 일치', async () => {
      const user = { id: 'user-1', passwordHash: 'hash' };
      prisma.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('a@b.com', 'correct');

      expect(result).toBe(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('correct', 'hash');
    });
  });

  describe('login', () => {
    it('세션 생성', async () => {
      configService.get.mockReturnValue(14);
      prisma.session.create.mockResolvedValue({});

      const result = await service.login({ id: 'user-1' } as never);

      expect(prisma.session.create).toHaveBeenCalledWith({
        data: {
          id: expect.any(String) as string,
          userId: 'user-1',
          expiresAt: expect.any(Date) as Date,
        },
      });
      expect(typeof result.sessionToken).toBe('string');
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('해시만 저장', async () => {
      configService.get.mockReturnValue(14);
      prisma.session.create.mockResolvedValue({});

      const result = await service.login({ id: 'user-1' } as never);

      const createArguments = prisma.session.create.mock.calls[0][0] as { data: { id: string } };
      expect(createArguments.data.id).not.toBe(result.sessionToken);
      expect(createArguments.data.id).toBe(hashSessionToken(result.sessionToken));
    });

    it('토큰 매번 다름', async () => {
      configService.get.mockReturnValue(14);
      prisma.session.create.mockResolvedValue({});

      const first = await service.login({ id: 'user-1' } as never);
      const second = await service.login({ id: 'user-1' } as never);

      expect(first.sessionToken).not.toBe(second.sessionToken);
    });

    it('SESSION_DAYS 반영', async () => {
      configService.get.mockReturnValue(14);
      prisma.session.create.mockResolvedValue({});

      const before = Date.now();
      const result = await service.login({ id: 'user-1' } as never);
      const expectedMin = before + 13 * 24 * 60 * 60 * 1000;

      expect(result.expiresAt.getTime()).toBeGreaterThan(expectedMin);
    });

    it('SESSION_DAYS 기본값 7일', async () => {
      configService.get.mockReturnValue(void 0);
      prisma.session.create.mockResolvedValue({});

      const before = Date.now();
      const result = await service.login({ id: 'user-1' } as never);
      const eightDays = before + 8 * 24 * 60 * 60 * 1000;

      expect(result.expiresAt.getTime()).toBeLessThan(eightDays);
    });
  });

  describe('logout', () => {
    it('세션 삭제', async () => {
      prisma.session.deleteMany.mockResolvedValue({ count: 1 });

      await service.logout('session-1');

      expect(prisma.session.deleteMany).toHaveBeenCalledWith({ where: { id: 'session-1' } });
    });
  });

  describe('getValidSession', () => {
    it('세션 없음', async () => {
      prisma.session.findUnique.mockResolvedValue(null);

      await expect(service.getValidSession('missing')).rejects.toThrow(UnauthorizedException);
    });

    it('세션 만료', async () => {
      prisma.session.findUnique.mockResolvedValue({
        id: hashSessionToken('token-1'),
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.getValidSession('token-1')).rejects.toThrow(UnauthorizedException);
    });

    it('해시로 조회', async () => {
      const session = {
        id: hashSessionToken('token-1'),
        expiresAt: new Date(Date.now() + 1000),
      };
      prisma.session.findUnique.mockResolvedValue(session);

      const result = await service.getValidSession('token-1');

      expect(result).toBe(session);
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: hashSessionToken('token-1') },
      });
    });
  });
});
