import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './controllers/app.controller';
import { AppService } from './services/app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('message', () => {
    it('should return the file content', async () => {
      await expect(appController.getMessage()).resolves.toEqual({
        message: 'StoryTrope TEST',
      });
    });
  });
});
