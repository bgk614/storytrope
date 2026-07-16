import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    session: { create: jest.Mock; deleteMany: jest.Mock; findUnique: jest.Mock };
    user: { findUnique: jest.Mock };
  };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    prisma = {
      session: {
        create: jest.fn(),
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
    it('throws when no user matches the email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser('a@b.com', 'pw')).rejects.toThrow(UnauthorizedException);
    });

    it('throws when the password does not match', async () => {
      prisma.user.findUnique.mockResolvedValue({ passwordHash: 'hash' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser('a@b.com', 'wrong')).rejects.toThrow(UnauthorizedException);
    });

    it('returns the user when the password matches', async () => {
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
    it('creates a session and returns the session id', async () => {
      configService.get.mockReturnValue(14);
      prisma.session.create.mockResolvedValue({ id: 'session-1' });

      const result = await service.login({ id: 'user-1' } as never);

      expect(prisma.session.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', expiresAt: expect.any(Date) as Date },
      });
      expect(result.sessionId).toBe('session-1');
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('honors SESSION_DAYS when computing the expiry', async () => {
      configService.get.mockReturnValue(14);
      prisma.session.create.mockResolvedValue({ id: 'session-1' });

      const before = Date.now();
      const result = await service.login({ id: 'user-1' } as never);
      const expectedMin = before + 13 * 24 * 60 * 60 * 1000;

      expect(result.expiresAt.getTime()).toBeGreaterThan(expectedMin);
    });

    it('defaults SESSION_DAYS to 7 when unset', async () => {
      configService.get.mockReturnValue(void 0);
      prisma.session.create.mockResolvedValue({ id: 'session-1' });

      const before = Date.now();
      const result = await service.login({ id: 'user-1' } as never);
      const eightDays = before + 8 * 24 * 60 * 60 * 1000;

      expect(result.expiresAt.getTime()).toBeLessThan(eightDays);
    });
  });

  describe('logout', () => {
    it('deletes the session by id', async () => {
      prisma.session.deleteMany.mockResolvedValue({ count: 1 });

      await service.logout('session-1');

      expect(prisma.session.deleteMany).toHaveBeenCalledWith({ where: { id: 'session-1' } });
    });
  });

  describe('getValidSession', () => {
    it('throws when the session does not exist', async () => {
      prisma.session.findUnique.mockResolvedValue(null);

      await expect(service.getValidSession('missing')).rejects.toThrow(UnauthorizedException);
    });

    it('throws when the session has expired', async () => {
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-1',
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.getValidSession('session-1')).rejects.toThrow(UnauthorizedException);
    });

    it('returns the session when still valid', async () => {
      const session = { id: 'session-1', expiresAt: new Date(Date.now() + 1000) };
      prisma.session.findUnique.mockResolvedValue(session);

      const result = await service.getValidSession('session-1');

      expect(result).toBe(session);
    });
  });
});
