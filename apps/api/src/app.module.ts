import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { AppController } from './controllers/app.controller';
import { HealthController } from './health.controller';
import { RankingController } from './ranking/ranking.controller';
import { RankingService } from './ranking/ranking.service';
import { AppService } from './services/app.service';
import { PrismaService } from './services/prisma.service';
import { TropesController } from './tropes/tropes.controller';
import { TropesService } from './tropes/tropes.service';
import { UserController } from './users/users.controller';
import { UserService } from './users/users.service';
import { WorkTropesController } from './work-tropes/work-tropes.controller';
import { WorkTropesService } from './work-tropes/work-tropes.service';
import { WorksController } from './works/works.controller';
import { WorksService } from './works/works.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        BACK_URL: Joi.string().required(),
        FRONT_URL: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),
        SESSION_DAYS: Joi.number().default(7),
        TRUST_PROXY_HOPS: Joi.number().integer().min(0).default(0),
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    TerminusModule.forRoot(),
  ],
  controllers: [
    AppController,
    AuthController,
    WorksController,
    WorkTropesController,
    TropesController,
    RankingController,
    HealthController,
    UserController,
  ],
  providers: [
    AppService,
    PrismaService,
    UserService,
    AuthService,
    WorksService,
    TropesService,
    WorkTropesService,
    RankingService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
