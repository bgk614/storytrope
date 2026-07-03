import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppController } from './controllers/app.controller';
import { UserController } from './controllers/user.controller';
import { AppService } from './services/app.service';
import { PrismaService } from './services/prisma.service';
import { UserService } from './services/user.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        BACK_URL: Joi.string().required(),
        FRONT_URL: Joi.string().required(),
      }),
    }),
  ],
  controllers: [AppController, UserController],
  providers: [AppService, PrismaService, UserService],
})
export class AppModule {}
