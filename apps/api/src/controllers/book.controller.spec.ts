import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WorkService } from '../services/work.service';
import { WorkTropeService } from '../services/work-trope.service';
import type { AuthenticatedUser } from '../strategies/jwt.strategy';
import { BookController } from './book.controller';

describe('BookController', () => {
  let controller: BookController;
  let workService: { works: jest.Mock; work: jest.Mock };
  let workTropeService: { tropesOfWork: jest.Mock; linkTropeToWork: jest.Mock };

  beforeEach(async () => {
    workService = { works: jest.fn(), work: jest.fn() };
    workTropeService = { tropesOfWork: jest.fn(), linkTropeToWork: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookController],
      providers: [
        { provide: WorkService, useValue: workService },
        { provide: WorkTropeService, useValue: workTropeService },
      ],
    }).compile();

    controller = module.get<BookController>(BookController);
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
    it('throws NotFoundException when the book does not exist', async () => {
      workService.work.mockResolvedValue(null);

      await expect(controller.findOne('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns the book when found', async () => {
      const work = { id: 'work-1' };
      workService.work.mockResolvedValue(work);

      const result = await controller.findOne('work-1');

      expect(result).toBe(work);
      expect(workService.work).toHaveBeenCalledWith({ id: 'work-1' });
    });
  });

  describe('findTropes', () => {
    it('delegates to workTropeService.tropesOfWork', async () => {
      const tropes = [{ id: 'trope-1' }];
      workTropeService.tropesOfWork.mockResolvedValue(tropes);

      const result = await controller.findTropes('work-1');

      expect(result).toBe(tropes);
      expect(workTropeService.tropesOfWork).toHaveBeenCalledWith('work-1');
    });
  });

  describe('addTrope', () => {
    it('links the trope to the book as the current user', async () => {
      const linked = { workId: 'work-1', tropeId: 'trope-1' };
      workTropeService.linkTropeToWork.mockResolvedValue(linked);
      const user: AuthenticatedUser = { userId: 'user-1', sessionId: 'session-1' };

      const result = await controller.addTrope('work-1', { tropeId: 'trope-1' }, user);

      expect(result).toBe(linked);
      expect(workTropeService.linkTropeToWork).toHaveBeenCalledWith('work-1', 'trope-1', 'user-1');
    });
  });
});
