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
        // SessionAuthGuard가 AuthService에 의존하므로 모듈 컴파일을 위해 스텁 처리
        { provide: AuthService, useValue: {} },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMe', () => {
    it('본인 프로필 조회 (이메일 포함)', async () => {
      const user = { id: 'user-1', email: 'a@b.com', nickname: 'nick' };
      userService.findById.mockResolvedValue(user);

      const result = await controller.getMe(currentUser);

      expect(userService.findById).toHaveBeenCalledWith('user-1');
      expect(result).toBeInstanceOf(UserDto);
      expect(result).toEqual({ id: 'user-1', email: 'a@b.com', nickname: 'nick' });
    });

    it('탈퇴한 사용자면 NotFound', async () => {
      userService.findById.mockResolvedValue(null);

      await expect(controller.getMe(currentUser)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('공개 프로필 조회 (민감 정보 제외)', async () => {
      const user = { id: 'user-2', email: 'secret@b.com', nickname: 'other' };
      userService.findById.mockResolvedValue(user);

      const result = await controller.findOne('user-2');

      expect(userService.findById).toHaveBeenCalledWith('user-2');
      expect(result).toBeInstanceOf(PublicUserDto);
      expect(result).toEqual({ id: 'user-2', nickname: 'other' });
      expect(result).not.toHaveProperty('email');
    });

    it('존재하지 않는 사용자면 NotFound', async () => {
      userService.findById.mockResolvedValue(null);

      await expect(controller.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
