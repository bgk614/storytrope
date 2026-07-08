import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import * as Joi from 'joi';
import { AppController } from './controllers/app.controller';
import { AuthController } from './controllers/auth.controller';
import { BookController } from './controllers/book.controller';
import { RankingController } from './controllers/ranking.controller';
import { TropeController } from './controllers/trope.controller';
import { UserController } from './controllers/user.controller';
import { AppService } from './services/app.service';
import { AuthService } from './services/auth.service';
import { PrismaService } from './services/prisma.service';
import { RankingService } from './services/ranking.service';
import { TropeService } from './services/trope.service';
import { UserService } from './services/user.service';
import { WorkService } from './services/work.service';
import { WorkTropeService } from './services/work-trope.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        BACK_URL: Joi.string().required(),
        FRONT_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        SESSION_DAYS: Joi.number().default(7),
      }),
    }),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [
    AppController,
    UserController,
    AuthController,
    BookController,
    TropeController,
    RankingController,
  ],
  providers: [
    AppService,
    PrismaService,
    UserService,
    AuthService,
    JwtStrategy,
    WorkService,
    TropeService,
    WorkTropeService,
    RankingService,
  ],
})
export class AppModule {}
