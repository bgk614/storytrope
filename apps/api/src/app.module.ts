import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { RankingModule } from './ranking/ranking.module';
import { TropesModule } from './tropes/tropes.module';
import { UsersModule } from './users/users.module';
import { WorkTropesModule } from './work-tropes/work-tropes.module';
import { WorksModule } from './works/works.module';

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
    PrismaModule,
    AuthModule,
    RankingModule,
    TropesModule,
    UsersModule,
    WorkTropesModule,
    WorksModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
