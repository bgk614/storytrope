import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { PaginationQueryDto } from '../common/pagination-query.dto';
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

  @Get()
  @UseGuards(SessionAuthGuard, AdminGuard)
  async findAll(@Query() query: PaginationQueryDto) {
    const users = await this.userService.list({ skip: query.skip, take: query.take ?? 50 });
    return users.map((user) => new UserDto(user));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const profile = await this.userService.findById(id);
    if (!profile) throw new NotFoundException('User not found');
    return new PublicUserDto(profile);
  }

  @Delete(':id')
  @UseGuards(SessionAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.userService.delete({ id });
  }
}
