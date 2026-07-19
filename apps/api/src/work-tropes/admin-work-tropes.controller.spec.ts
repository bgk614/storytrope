import { Test, TestingModule } from '@nestjs/testing';
import { AdminGuard } from '../auth/admin.guard';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { WorkTropeSource } from '../../generated/prisma/client.js';
import { AdminWorkTropesController } from './admin-work-tropes.controller';
import { WorkTropesService } from './work-tropes.service';

describe('AdminWorkTropesController', () => {
  let controller: AdminWorkTropesController;
  let workTropesService: { listAll: jest.Mock };

  beforeEach(async () => {
    workTropesService = { listAll: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminWorkTropesController],
      providers: [{ provide: WorkTropesService, useValue: workTropesService }],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminWorkTropesController>(AdminWorkTropesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('기본값(take=50)으로 workTropesService.listAll 호출', async () => {
      const links = [{ workId: 'work-1', tropeId: 'trope-1' }];
      workTropesService.listAll.mockResolvedValue(links);

      const result = await controller.findAll({});

      expect(result).toBe(links);
      expect(workTropesService.listAll).toHaveBeenCalledWith({
        skip: undefined,
        take: 50,
        source: undefined,
        workId: undefined,
      });
    });

    it('쿼리로 받은 source/workId/페이지네이션을 그대로 전달', async () => {
      workTropesService.listAll.mockResolvedValue([]);

      await controller.findAll({
        skip: 10,
        take: 20,
        source: WorkTropeSource.ADMIN,
        workId: 'work-1',
      });

      expect(workTropesService.listAll).toHaveBeenCalledWith({
        skip: 10,
        take: 20,
        source: WorkTropeSource.ADMIN,
        workId: 'work-1',
      });
    });
  });
});
