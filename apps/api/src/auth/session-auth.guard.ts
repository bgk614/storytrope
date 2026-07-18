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
    const sessionToken = cookies?.[SESSION_COOKIE];
    if (!sessionToken) {
      throw new UnauthorizedException('Not authenticated');
    }

    const session = await this.authService.getValidSession(sessionToken);
    request.user = { userId: session.userId, sessionId: session.id };
    return true;
  }
}
