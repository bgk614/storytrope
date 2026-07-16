import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Prisma, Session, User } from '../../generated/prisma/client.js';
import { PrismaService } from '../services/prisma.service';
import { UserService } from '../users/users.service.js';
import { SignUpDto } from './dto/signup.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  async login(user: User): Promise<{ sessionId: string; expiresAt: Date }> {
    const sessionDays = this.configService.get<number>('SESSION_DAYS') ?? 7;
    const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);

    const session = await this.prisma.session.create({
      data: { userId: user.id, expiresAt },
    });

    return { sessionId: session.id, expiresAt };
  }

  async signUp(dto: SignUpDto): Promise<Omit<User, 'passwordHash'>> {
    const saltOrRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltOrRounds);

    try {
      return await this.prisma.user.create({
        data: {
          email: dto.email,
          nickname: dto.nickname,
          passwordHash: passwordHash,
        },
        omit: { passwordHash: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = (error.meta?.target as string[] | undefined) ?? [];
        const field = target.includes('nickname') ? 'nickname' : 'email';
        throw new ConflictException(`A user with this ${field} already exists`);
      }
      throw error;
    }
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
