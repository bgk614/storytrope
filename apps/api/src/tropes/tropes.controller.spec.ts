import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VoteType } from '../../generated/prisma/enums.js';
import type { AuthenticatedUser } from '../auth/authenticated-user.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import { WorkTropesService } from '../work-tropes/work-tropes.service.js';
import { TropesController } from './tropes.controller';
import { TropesService } from './tropes.service.js';

describe('TropesController', () => {
  let controller: TropesController;
  let tropeService: {
    createTrope: jest.Mock;
    tropes: jest.Mock;
    trope: jest.Mock;
    children: jest.Mock;
    setParent: jest.Mock;
    toggleLike: jest.Mock;
  };
  let workTropeService: {
    worksOfTrope: jest.Mock;
    linkTropeToWork: jest.Mock;
    vote: jest.Mock;
  };
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
      controllers: [TropesController],
      providers: [
        { provide: TropesService, useValue: tropeService },
        { provide: WorkTropesService, useValue: workTropeService },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TropesController>(TropesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('tropeService.createTrope 호출로 처리', async () => {
      const created = { id: 'trope-1', name: 'Chosen One' };
      tropeService.createTrope.mockResolvedValue(created);

      const result = await controller.create({ name: 'Chosen One' });

      expect(result).toBe(created);
      expect(tropeService.createTrope).toHaveBeenCalledWith({
        name: 'Chosen One',
      });
    });
  });

  describe('findAll', () => {
    it('topLevelOnly 전달, 페이지네이션 기본값 적용', async () => {
      tropeService.tropes.mockResolvedValue([]);

      await controller.findAll({ topLevelOnly: true });

      expect(tropeService.tropes).toHaveBeenCalledWith({
        topLevelOnly: true,
        skip: undefined,
        take: 100,
      });
    });

    it('topLevelOnly 기본 false, take 최대 100', async () => {
      tropeService.tropes.mockResolvedValue([]);

      await controller.findAll({});

      expect(tropeService.tropes).toHaveBeenCalledWith({
        topLevelOnly: false,
        skip: undefined,
        take: 100,
      });
    });

    it('명시한 skip/take 전달', async () => {
      tropeService.tropes.mockResolvedValue([]);

      await controller.findAll({ skip: 10, take: 5 });

      expect(tropeService.tropes).toHaveBeenCalledWith({
        topLevelOnly: false,
        skip: 10,
        take: 5,
      });
    });
  });

  describe('findOne', () => {
    it('트로프가 없으면 NotFoundException', async () => {
      tropeService.trope.mockResolvedValue(null);

      await expect(controller.findOne('missing')).rejects.toThrow(NotFoundException);
    });

    it('찾으면 트로프 반환', async () => {
      const trope = { id: 'trope-1' };
      tropeService.trope.mockResolvedValue(trope);

      const result = await controller.findOne('trope-1');

      expect(result).toBe(trope);
    });
  });

  describe('findWorks', () => {
    it('workTropeService.worksOfTrope 호출로 처리', async () => {
      const works = [{ id: 'work-1' }];
      workTropeService.worksOfTrope.mockResolvedValue(works);

      const result = await controller.findWorks('trope-1', {});

      expect(result).toBe(works);
      expect(workTropeService.worksOfTrope).toHaveBeenCalledWith('trope-1', {
        skip: undefined,
        take: 20,
      });
    });
  });

  describe('findChildren', () => {
    it('tropeService.children 호출로 처리', async () => {
      const children = [{ id: 'child-1' }];
      tropeService.children.mockResolvedValue(children);

      const result = await controller.findChildren('trope-1', {});

      expect(result).toBe(children);
      expect(tropeService.children).toHaveBeenCalledWith('trope-1', {
        skip: undefined,
        take: 100,
      });
    });
  });

  describe('setParent', () => {
    it('dto의 parentId로 tropeService.setParent 호출로 처리', async () => {
      const updated = { id: 'trope-1', parentId: 'trope-2' };
      tropeService.setParent.mockResolvedValue(updated);

      const result = await controller.setParent('trope-1', {
        parentId: 'trope-2',
      });

      expect(result).toBe(updated);
      expect(tropeService.setParent).toHaveBeenCalledWith('trope-1', 'trope-2');
    });
  });

  describe('addWork', () => {
    it('현재 사용자로 트로프-작품 연결', async () => {
      const linked = { workId: 'work-1', tropeId: 'trope-1' };
      workTropeService.linkTropeToWork.mockResolvedValue(linked);

      const result = await controller.addWork('trope-1', { workId: 'work-1' }, user);

      expect(result).toBe(linked);
      expect(workTropeService.linkTropeToWork).toHaveBeenCalledWith('work-1', 'trope-1', 'user-1');
    });
  });

  describe('like', () => {
    it('현재 사용자로 tropeService.toggleLike 호출로 처리', async () => {
      tropeService.toggleLike.mockResolvedValue({ liked: true, likeScore: 1 });

      const result = await controller.like('trope-1', user);

      expect(result).toEqual({ liked: true, likeScore: 1 });
      expect(tropeService.toggleLike).toHaveBeenCalledWith('trope-1', 'user-1');
    });
  });

  describe('vote', () => {
    it('workId/tropeId/user/voteType으로 workTropeService.vote 호출로 처리', async () => {
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
