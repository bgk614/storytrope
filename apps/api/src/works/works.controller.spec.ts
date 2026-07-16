import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { WorksController } from './works.controller';
import { WorksService } from './works.service';

describe('WorkController', () => {
  let controller: WorksController;
  let workService: { works: jest.Mock; work: jest.Mock };

  beforeEach(async () => {
    workService = { works: jest.fn(), work: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorksController],
      providers: [{ provide: WorksService, useValue: workService }],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WorksController>(WorksController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('defaults take to 20 and leaves skip undefined when not provided', async () => {
      workService.works.mockResolvedValue([]);

      await controller.findAll({});

      expect(workService.works).toHaveBeenCalledWith({ skip: undefined, take: 20 });
    });

    it('passes through validated skip/take query params', async () => {
      workService.works.mockResolvedValue([]);

      await controller.findAll({ skip: 5, take: 15 });

      expect(workService.works).toHaveBeenCalledWith({ skip: 5, take: 15 });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the work does not exist', async () => {
      workService.work.mockResolvedValue(null);

      await expect(controller.findOne('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns the work when found', async () => {
      const work = { id: 'work-1' };
      workService.work.mockResolvedValue(work);

      const result = await controller.findOne('work-1');

      expect(result).toBe(work);
      expect(workService.work).toHaveBeenCalledWith({ id: 'work-1' });
    });
  });
});
