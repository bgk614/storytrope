import { HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let health: { check: jest.Mock };
  let prismaHealth: { pingCheck: jest.Mock };
  let prisma: object;

  beforeEach(async () => {
    health = { check: jest.fn() };
    prismaHealth = { pingCheck: jest.fn() };
    prisma = {};

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: health },
        { provide: PrismaHealthIndicator, useValue: prismaHealth },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('핑 체크 실행', async () => {
    const result = { status: 'ok', info: {}, error: {}, details: {} };
    health.check.mockImplementation(async (indicators: Array<() => Promise<unknown>>) => {
      await Promise.all(indicators.map((indicator) => indicator()));
      return result;
    });
    prismaHealth.pingCheck.mockResolvedValue({ database: { status: 'up' } });

    const response = await controller.check();

    expect(response).toBe(result);
    expect(prismaHealth.pingCheck).toHaveBeenCalledWith('database', prisma);
  });
});
