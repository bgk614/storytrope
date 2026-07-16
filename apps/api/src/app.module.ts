import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { AppController } from './controllers/app.controller';
import { RankingController } from './controllers/ranking.controller';
import { HealthController } from './health.controller';
import { AppService } from './services/app.service';
import { PrismaService } from './services/prisma.service';
import { RankingService } from './services/ranking.service';
import { TropeController } from './tropes/tropes.controller';
import { TropeService } from './tropes/tropes.service';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
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
    TropeController,
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
    TropeService,
    WorkTropesService,
    RankingService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
