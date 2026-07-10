import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../services/user.service';
import { UserController } from './user.controller';

describe('UserController', () => {
  let controller: UserController;
  let userService: { createUser: jest.Mock };

  beforeEach(async () => {
    userService = { createUser: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signupUser', () => {
    it('delegates to userService.createUser with the dto', async () => {
      const created = { id: 'user-1', email: 'a@b.com', nickname: 'nick' };
      userService.createUser.mockResolvedValue(created);
      const dto = { email: 'a@b.com', password: 'pw', nickname: 'nick' };

      const result = await controller.signupUser(dto);

      expect(result).toBe(created);
      expect(userService.createUser).toHaveBeenCalledWith(dto);
    });
  });
});
