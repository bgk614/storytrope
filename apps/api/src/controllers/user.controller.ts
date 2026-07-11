import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserModel } from '../../generated/prisma/models';
import { CreateUserDto } from '../dtos/user.dto';
import { UserService } from '../services/user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('user')
  async signupUser(@Body() createUserDto: CreateUserDto): Promise<Omit<UserModel, 'passwordHash'>> {
    return this.userService.createUser(createUserDto);
  }
}
