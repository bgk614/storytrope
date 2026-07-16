import { Body, Controller, Delete, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './authenticated-user';
import { CurrentUser } from './decorator/current-user.decorator';
import { SignInDto } from './dto/signin.dto';
import { SignUpDto } from './dto/signup.dto';

import { UserDto } from '../users/dto/user.dto';
import { SESSION_COOKIE, SessionAuthGuard } from './session-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto): Promise<UserDto> {
    const user = await this.authService.signUp(signUpDto);
    return new UserDto(user);
  }

  @Post('login')
  async login(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ success: true }> {
    const user = await this.authService.validateUser(dto.email, dto.password);
    const { sessionId, expiresAt } = await this.authService.login(user);

    response.cookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });

    return { success: true };
  }

  @UseGuards(SessionAuthGuard)
  @Delete('logout')
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ success: true }> {
    await this.authService.logout(user.sessionId);
    response.clearCookie(SESSION_COOKIE, { path: '/' });
    return { success: true };
  }
}
