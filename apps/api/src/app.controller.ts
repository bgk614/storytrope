import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserModel } from '../generated/prisma/models';
import { AppService } from './app.service';
import { UserService } from './user.service';

@Controller()
export class AppController {
  constructor(
    private readonly userService: UserService,
    private readonly appService: AppService,
  ) {}

  @Get('message')
  getMessage() {
    return this.appService.getMessage();
  }

  @Post('user')
  async signupUser(
    @Body() userData: { nickname: string; email: string; passwordHash: string },
  ): Promise<UserModel> {
    return this.userService.createUser(userData);
  }
}
