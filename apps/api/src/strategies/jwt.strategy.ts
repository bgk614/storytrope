import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { AuthService, JwtPayload } from '../services/auth.service';

function extractJwtFromCookie(request: Request): string | null {
  const cookies = request?.cookies as Record<string, string> | undefined;
  return cookies?.['access_token'] ?? null;
}

export interface AuthenticatedUser {
  userId: string;
  sessionId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: extractJwtFromCookie,
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    await this.authService.getValidSession(payload.sid);
    return { userId: payload.sub, sessionId: payload.sid };
  }
}
