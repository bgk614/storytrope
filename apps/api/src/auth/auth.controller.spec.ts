import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './authenticated-user';
import { SessionAuthGuard } from './session-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    signUp: jest.Mock;
    validateUser: jest.Mock;
    login: jest.Mock;
    logout: jest.Mock;
  };
  let response: { cookie: jest.Mock; clearCookie: jest.Mock };

  beforeEach(async () => {
    authService = {
      signUp: jest.fn(),
      validateUser: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
    };
    response = { cookie: jest.fn(), clearCookie: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('회원가입', async () => {
      authService.signUp.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
        nickname: 'nick',
        passwordHash: 'secret-hash',
      });
      const dto = { email: 'a@b.com', password: 'pw', nickname: 'nick' };

      const result = await controller.signUp(dto);

      expect(authService.signUp).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 'user-1', email: 'a@b.com', nickname: 'nick' });
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('login', () => {
    it('로그인', async () => {
      const user = { id: 'user-1' };
      const expiresAt = new Date(Date.now() + 1000);
      authService.validateUser.mockResolvedValue(user);
      authService.login.mockResolvedValue({ sessionToken: 'token-1', expiresAt });

      const result = await controller.login(
        { email: 'a@b.com', password: 'pw' },
        response as unknown as Response,
      );

      expect(authService.validateUser).toHaveBeenCalledWith('a@b.com', 'pw');
      expect(authService.login).toHaveBeenCalledWith(user);
      expect(response.cookie).toHaveBeenCalledWith(
        'session_id',
        'token-1',
        expect.objectContaining({ httpOnly: true, path: '/', expires: expiresAt }),
      );
      expect(result).toEqual({ success: true });
    });

    it('로그인 실패', async () => {
      authService.validateUser.mockRejectedValue(new Error('invalid credentials'));

      await expect(
        controller.login({ email: 'a@b.com', password: 'wrong' }, response as unknown as Response),
      ).rejects.toThrow('invalid credentials');
      expect(response.cookie).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('로그아웃', async () => {
      const user: AuthenticatedUser = { userId: 'user-1', sessionId: 'session-1' };

      const result = await controller.logout(user, response as unknown as Response);

      expect(authService.logout).toHaveBeenCalledWith('session-1');
      expect(response.clearCookie).toHaveBeenCalledWith('session_id', { path: '/' });
      expect(result).toEqual({ success: true });
    });
  });
});
