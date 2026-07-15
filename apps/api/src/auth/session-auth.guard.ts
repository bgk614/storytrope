import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from './authenticated-user';
import { AuthService } from './auth.service';

export const SESSION_COOKIE = 'session_id';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();

    const cookies = request.cookies as Record<string, string> | undefined;
    const sessionId = cookies?.[SESSION_COOKIE];
    if (!sessionId) {
      throw new UnauthorizedException('Not authenticated');
    }

    const session = await this.authService.getValidSession(sessionId);
    request.user = { userId: session.userId, sessionId: session.id };
    return true;
  }
}
