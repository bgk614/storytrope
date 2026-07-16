import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { PublicUserDto } from './dto/public-user.dto';
import { UserDto } from './dto/user.dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let userService: { findById: jest.Mock };

  const currentUser: AuthenticatedUser = { userId: 'user-1', sessionId: 'session-1' };

  beforeEach(async () => {
    userService = { findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: userService },
        // SessionAuthGuard depends on AuthService; stub it so the module compiles.
        { provide: AuthService, useValue: {} },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMe', () => {
    it('returns the caller profile as a UserDto (email included)', async () => {
      const user = { id: 'user-1', email: 'a@b.com', nickname: 'nick' };
      userService.findById.mockResolvedValue(user);

      const result = await controller.getMe(currentUser);

      expect(userService.findById).toHaveBeenCalledWith('user-1');
      expect(result).toBeInstanceOf(UserDto);
      expect(result).toEqual({ id: 'user-1', email: 'a@b.com', nickname: 'nick' });
    });

    it('throws NotFound when the caller no longer exists', async () => {
      userService.findById.mockResolvedValue(null);

      await expect(controller.getMe(currentUser)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('returns a public profile without sensitive fields', async () => {
      const user = { id: 'user-2', email: 'secret@b.com', nickname: 'other' };
      userService.findById.mockResolvedValue(user);

      const result = await controller.findOne('user-2');

      expect(userService.findById).toHaveBeenCalledWith('user-2');
      expect(result).toBeInstanceOf(PublicUserDto);
      expect(result).toEqual({ id: 'user-2', nickname: 'other' });
      expect(result).not.toHaveProperty('email');
    });

    it('throws NotFound when the user does not exist', async () => {
      userService.findById.mockResolvedValue(null);

      await expect(controller.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
