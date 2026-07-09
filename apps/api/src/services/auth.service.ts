import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Session, User } from '../../generated/prisma/client.js';
import { PrismaService } from './prisma.service';
import { UserService } from './user.service';

export interface JwtPayload {
  sub: string;
  sid: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userService.user({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  async login(user: User): Promise<{ token: string; expiresAt: Date }> {
    const sessionDays = this.configService.get<number>('SESSION_DAYS') ?? 7;
    const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);

    const session = await this.prisma.session.create({
      data: { userId: user.id, expiresAt },
    });

    const payload: JwtPayload = { sub: user.id, sid: session.id };
    const token = this.jwtService.sign(payload, {
      expiresIn: `${sessionDays}d`,
    });

    return { token, expiresAt };
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { id: sessionId } });
  }

  async getValidSession(sessionId: string): Promise<Session> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    return session;
  }
}
