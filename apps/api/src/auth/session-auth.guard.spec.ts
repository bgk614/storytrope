import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { SessionAuthGuard, SESSION_COOKIE } from './session-auth.guard';

function contextWithCookies(cookies?: Record<string, string>): ExecutionContext {
  const request: { cookies?: Record<string, string>; user?: unknown } = { cookies };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('SessionAuthGuard', () => {
  let guard: SessionAuthGuard;
  let authService: { getValidSession: jest.Mock };

  beforeEach(async () => {
    authService = { getValidSession: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionAuthGuard, { provide: AuthService, useValue: authService }],
    }).compile();

    guard = module.get<SessionAuthGuard>(SessionAuthGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('세션 쿠키가 없으면 UnauthorizedException', async () => {
    await expect(guard.canActivate(contextWithCookies())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(authService.getValidSession).not.toHaveBeenCalled();
  });

  it('세션이 유효하면 통과, request.user 채움', async () => {
    const context = contextWithCookies({ [SESSION_COOKIE]: 'raw-token' });
    authService.getValidSession.mockResolvedValue({ id: 'session-1', userId: 'user-1' });

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(authService.getValidSession).toHaveBeenCalledWith('raw-token');
    const request = context.switchToHttp().getRequest<{ user?: unknown }>();
    expect(request.user).toEqual({ userId: 'user-1', sessionId: 'session-1' });
  });

  it('세션이 만료/존재하지 않으면 UnauthorizedException을 던짐', async () => {
    const context = contextWithCookies({ [SESSION_COOKIE]: 'raw-token' });
    authService.getValidSession.mockRejectedValue(new UnauthorizedException('Session expired'));

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
