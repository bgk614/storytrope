import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { PublicUserDto } from './dto/public-user.dto';
import { UserDto } from './dto/user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}
  @Get('me')
  @UseGuards(SessionAuthGuard)
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.userService.findById(user.userId);
    if (!profile) throw new NotFoundException('Profile not found');
    return new UserDto(profile);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const profile = await this.userService.findById(id);
    if (!profile) throw new NotFoundException('User not found');
    return new PublicUserDto(profile);
  }
}
