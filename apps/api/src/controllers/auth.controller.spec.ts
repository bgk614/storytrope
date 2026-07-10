import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { AuthService } from '../services/auth.service';
import type { AuthenticatedUser } from '../strategies/jwt.strategy';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { validateUser: jest.Mock; login: jest.Mock; logout: jest.Mock };
  let response: { cookie: jest.Mock; clearCookie: jest.Mock };

  beforeEach(async () => {
    authService = {
      validateUser: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
    };
    response = { cookie: jest.fn(), clearCookie: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('validates credentials, logs in, and sets the access token cookie', async () => {
      const user = { id: 'user-1' };
      const expiresAt = new Date(Date.now() + 1000);
      authService.validateUser.mockResolvedValue(user);
      authService.login.mockResolvedValue({ token: 'jwt-token', expiresAt });

      const result = await controller.login(
        { email: 'a@b.com', password: 'pw' },
        response as unknown as Response,
      );

      expect(authService.validateUser).toHaveBeenCalledWith('a@b.com', 'pw');
      expect(authService.login).toHaveBeenCalledWith(user);
      expect(response.cookie).toHaveBeenCalledWith(
        'access_token',
        'jwt-token',
        expect.objectContaining({ httpOnly: true, path: '/', expires: expiresAt }),
      );
      expect(result).toEqual({ success: true });
    });

    it('propagates errors from validateUser without setting a cookie', async () => {
      authService.validateUser.mockRejectedValue(new Error('invalid credentials'));

      await expect(
        controller.login({ email: 'a@b.com', password: 'wrong' }, response as unknown as Response),
      ).rejects.toThrow('invalid credentials');
      expect(response.cookie).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('logs out the current session and clears the cookie', async () => {
      const user: AuthenticatedUser = { userId: 'user-1', sessionId: 'session-1' };

      const result = await controller.logout(user, response as unknown as Response);

      expect(authService.logout).toHaveBeenCalledWith('session-1');
      expect(response.clearCookie).toHaveBeenCalledWith('access_token', { path: '/' });
      expect(result).toEqual({ success: true });
    });
  });
});
