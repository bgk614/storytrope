import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VoteType } from '../../generated/prisma/enums.js';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { TropeService } from '../services/trope.service';
import { WorkTropesService } from '../work-tropes/work-tropes.service.js';
import { TropeController } from './trope.controller';

describe('TropeController', () => {
  let controller: TropeController;
  let tropeService: {
    createTrope: jest.Mock;
    tropes: jest.Mock;
    trope: jest.Mock;
    children: jest.Mock;
    setParent: jest.Mock;
    toggleLike: jest.Mock;
  };
  let workTropeService: { worksOfTrope: jest.Mock; linkTropeToWork: jest.Mock; vote: jest.Mock };
  const user: AuthenticatedUser = { userId: 'user-1', sessionId: 'session-1' };

  beforeEach(async () => {
    tropeService = {
      createTrope: jest.fn(),
      tropes: jest.fn(),
      trope: jest.fn(),
      children: jest.fn(),
      setParent: jest.fn(),
      toggleLike: jest.fn(),
    };
    workTropeService = {
      worksOfTrope: jest.fn(),
      linkTropeToWork: jest.fn(),
      vote: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TropeController],
      providers: [
        { provide: TropeService, useValue: tropeService },
        { provide: WorkTropesService, useValue: workTropeService },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TropeController>(TropeController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('delegates to tropeService.createTrope', async () => {
      const created = { id: 'trope-1', name: 'Chosen One' };
      tropeService.createTrope.mockResolvedValue(created);

      const result = await controller.create({ name: 'Chosen One' });

      expect(result).toBe(created);
      expect(tropeService.createTrope).toHaveBeenCalledWith({ name: 'Chosen One' });
    });
  });

  describe('findAll', () => {
    it('treats "true" query string as topLevelOnly true', async () => {
      tropeService.tropes.mockResolvedValue([]);

      await controller.findAll('true');

      expect(tropeService.tropes).toHaveBeenCalledWith({ topLevelOnly: true });
    });

    it('treats anything else (including undefined) as false', async () => {
      tropeService.tropes.mockResolvedValue([]);

      await controller.findAll();

      expect(tropeService.tropes).toHaveBeenCalledWith({ topLevelOnly: false });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the trope does not exist', async () => {
      tropeService.trope.mockResolvedValue(null);

      await expect(controller.findOne('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns the trope when found', async () => {
      const trope = { id: 'trope-1' };
      tropeService.trope.mockResolvedValue(trope);

      const result = await controller.findOne('trope-1');

      expect(result).toBe(trope);
    });
  });

  describe('findBooks', () => {
    it('delegates to workTropeService.worksOfTrope', async () => {
      const works = [{ id: 'work-1' }];
      workTropeService.worksOfTrope.mockResolvedValue(works);

      const result = await controller.findBooks('trope-1');

      expect(result).toBe(works);
      expect(workTropeService.worksOfTrope).toHaveBeenCalledWith('trope-1');
    });
  });

  describe('findChildren', () => {
    it('delegates to tropeService.children', async () => {
      const children = [{ id: 'child-1' }];
      tropeService.children.mockResolvedValue(children);

      const result = await controller.findChildren('trope-1');

      expect(result).toBe(children);
      expect(tropeService.children).toHaveBeenCalledWith('trope-1');
    });
  });

  describe('setParent', () => {
    it('delegates to tropeService.setParent with the dto parentId', async () => {
      const updated = { id: 'trope-1', parentId: 'trope-2' };
      tropeService.setParent.mockResolvedValue(updated);

      const result = await controller.setParent('trope-1', { parentId: 'trope-2' });

      expect(result).toBe(updated);
      expect(tropeService.setParent).toHaveBeenCalledWith('trope-1', 'trope-2');
    });
  });

  describe('addBook', () => {
    it('links the book to the trope as the current user', async () => {
      const linked = { workId: 'work-1', tropeId: 'trope-1' };
      workTropeService.linkTropeToWork.mockResolvedValue(linked);

      const result = await controller.addBook('trope-1', { workId: 'work-1' }, user);

      expect(result).toBe(linked);
      expect(workTropeService.linkTropeToWork).toHaveBeenCalledWith('work-1', 'trope-1', 'user-1');
    });
  });

  describe('like', () => {
    it('delegates to tropeService.toggleLike as the current user', async () => {
      tropeService.toggleLike.mockResolvedValue({ liked: true, likeScore: 1 });

      const result = await controller.like('trope-1', user);

      expect(result).toEqual({ liked: true, likeScore: 1 });
      expect(tropeService.toggleLike).toHaveBeenCalledWith('trope-1', 'user-1');
    });
  });

  describe('vote', () => {
    it('delegates to workTropeService.vote with book id, trope id, user, and vote type', async () => {
      workTropeService.vote.mockResolvedValue({ voteScore: 1 });

      const result = await controller.vote('trope-1', 'work-1', { voteType: VoteType.UP }, user);

      expect(result).toEqual({ voteScore: 1 });
      expect(workTropeService.vote).toHaveBeenCalledWith(
        'work-1',
        'trope-1',
        'user-1',
        VoteType.UP,
      );
    });
  });
});
