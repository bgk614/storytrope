import { Test, TestingModule } from '@nestjs/testing';
import { AdminGuard } from '../auth/admin.guard';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { WorkTropesController } from './work-tropes.controller';
import { WorkTropesService } from './work-tropes.service';

describe('WorkTropesController', () => {
  let controller: WorkTropesController;
  let workTropesService: {
    tropesOfWork: jest.Mock;
    linkTropeToWork: jest.Mock;
    unlink: jest.Mock;
  };

  beforeEach(async () => {
    workTropesService = { tropesOfWork: jest.fn(), linkTropeToWork: jest.fn(), unlink: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkTropesController],
      providers: [{ provide: WorkTropesService, useValue: workTropesService }],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WorkTropesController>(WorkTropesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findTropes', () => {
    it('workTropesService.tropesOfWork 호출로 처리', async () => {
      const tropes = [{ id: 'trope-1' }];
      workTropesService.tropesOfWork.mockResolvedValue(tropes);

      const result = await controller.findTropes('work-1', {});

      expect(result).toBe(tropes);
      expect(workTropesService.tropesOfWork).toHaveBeenCalledWith('work-1', {
        skip: undefined,
        take: 100,
      });
    });
  });

  describe('addTrope', () => {
    it('현재 사용자로 트로프-작품 연결', async () => {
      const linked = { workId: 'work-1', tropeId: 'trope-1' };
      workTropesService.linkTropeToWork.mockResolvedValue(linked);
      const user: AuthenticatedUser = { userId: 'user-1', sessionId: 'session-1' };

      const result = await controller.addTrope('work-1', { tropeId: 'trope-1' }, user);

      expect(result).toBe(linked);
      expect(workTropesService.linkTropeToWork).toHaveBeenCalledWith('work-1', 'trope-1', 'user-1');
    });
  });

  describe('removeTrope', () => {
    it('workTropesService.unlink 호출로 처리', async () => {
      workTropesService.unlink.mockResolvedValue();

      await controller.removeTrope('work-1', 'trope-1');

      expect(workTropesService.unlink).toHaveBeenCalledWith('work-1', 'trope-1');
    });
  });
});
