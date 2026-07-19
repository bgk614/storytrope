import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminGuard } from '../auth/admin.guard';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { WorksController } from './works.controller';
import { WorksService } from './works.service';

describe('WorkController', () => {
  let controller: WorksController;
  let workService: {
    works: jest.Mock;
    work: jest.Mock;
    createWork: jest.Mock;
    updateWork: jest.Mock;
    deleteWork: jest.Mock;
  };

  beforeEach(async () => {
    workService = {
      works: jest.fn(),
      work: jest.fn(),
      createWork: jest.fn(),
      updateWork: jest.fn(),
      deleteWork: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorksController],
      providers: [{ provide: WorksService, useValue: workService }],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WorksController>(WorksController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('기본값: take 20, skip undefined', async () => {
      workService.works.mockResolvedValue([]);

      await controller.findAll({});

      expect(workService.works).toHaveBeenCalledWith({ skip: undefined, take: 20 });
    });

    it('skip/take 쿼리 그대로 전달', async () => {
      workService.works.mockResolvedValue([]);

      await controller.findAll({ skip: 5, take: 15 });

      expect(workService.works).toHaveBeenCalledWith({ skip: 5, take: 15 });
    });
  });

  describe('findOne', () => {
    it('작품이 없으면 NotFoundException', async () => {
      workService.work.mockResolvedValue(null);

      await expect(controller.findOne('missing')).rejects.toThrow(NotFoundException);
    });

    it('찾으면 작품 반환', async () => {
      const work = { id: 'work-1' };
      workService.work.mockResolvedValue(work);

      const result = await controller.findOne('work-1');

      expect(result).toBe(work);
      expect(workService.work).toHaveBeenCalledWith({ id: 'work-1' });
    });
  });

  describe('create', () => {
    it('workService.createWork 호출로 처리', async () => {
      const created = { id: 'work-1' };
      workService.createWork.mockResolvedValue(created);
      const dto = { title: 'title', authorNames: ['author-1'] };

      const result = await controller.create(dto);

      expect(result).toBe(created);
      expect(workService.createWork).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('workService.updateWork 호출로 처리', async () => {
      const updated = { id: 'work-1' };
      workService.updateWork.mockResolvedValue(updated);
      const dto = { title: 'new title' };

      const result = await controller.update('work-1', dto);

      expect(result).toBe(updated);
      expect(workService.updateWork).toHaveBeenCalledWith('work-1', dto);
    });
  });

  describe('remove', () => {
    it('workService.deleteWork 호출로 처리', async () => {
      workService.deleteWork.mockResolvedValue();

      await controller.remove('work-1');

      expect(workService.deleteWork).toHaveBeenCalledWith('work-1');
    });
  });
});
