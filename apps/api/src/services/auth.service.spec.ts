import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from './prisma.service';
import { UserService } from './user.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    session: { create: jest.Mock; deleteMany: jest.Mock; findUnique: jest.Mock };
  };
  let userService: { user: jest.Mock };
  let jwtService: { sign: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    prisma = {
      session: {
        create: jest.fn(),
        deleteMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    userService = { user: jest.fn() };
    jwtService = { sign: jest.fn() };
    configService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
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
      userService.user.mockResolvedValue(null);

      await expect(service.validateUser('a@b.com', 'pw')).rejects.toThrow(UnauthorizedException);
    });

    it('throws when the password does not match', async () => {
      userService.user.mockResolvedValue({ passwordHash: 'hash' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser('a@b.com', 'wrong')).rejects.toThrow(UnauthorizedException);
    });

    it('returns the user when the password matches', async () => {
      const user = { id: 'user-1', passwordHash: 'hash' };
      userService.user.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('a@b.com', 'correct');

      expect(result).toBe(user);
      expect(bcrypt.compare).toHaveBeenCalledWith('correct', 'hash');
    });
  });

  describe('login', () => {
    it('creates a session and signs a jwt using SESSION_DAYS', async () => {
      configService.get.mockReturnValue(14);
      prisma.session.create.mockResolvedValue({ id: 'session-1' });
      jwtService.sign.mockReturnValue('signed-token');

      const result = await service.login({ id: 'user-1' } as never);

      expect(prisma.session.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', expiresAt: expect.any(Date) as Date },
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 'user-1', sid: 'session-1' },
        { expiresIn: '14d' },
      );
      expect(result.token).toBe('signed-token');
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('defaults SESSION_DAYS to 7 when unset', async () => {
      configService.get.mockReturnValue();
      prisma.session.create.mockResolvedValue({ id: 'session-1' });
      jwtService.sign.mockReturnValue('token');

      await service.login({ id: 'user-1' } as never);

      expect(jwtService.sign).toHaveBeenCalledWith(expect.anything(), { expiresIn: '7d' });
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
