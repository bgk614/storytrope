import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(cookieParser());

  const configService = app.get(ConfigService);

  // 리버스 프록시(nginx/로드밸런서) 뒤에서는 X-Forwarded-For 기준으로 클라이언트 IP를
  // 식별해야 rate limit이 사용자별로 걸린다. 프록시 없이 직접 노출될 때(기본값 0)는
  // 헤더 위조로 제한을 우회할 수 있으므로 꺼둔다.
  const trustProxyHops = configService.get<number>('TRUST_PROXY_HOPS') ?? 0;
  if (trustProxyHops > 0) {
    app.set('trust proxy', trustProxyHops);
  }

  const config = new DocumentBuilder()
    .setTitle('Story Trope API')
    .setDescription('https://storytrope.com 서버 API 문서')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.enableCors({
    origin: configService.get<string>('FRONT_URL'),
    credentials: true,
  });

  await app.listen(configService.get<number>('PORT') ?? 3000);
}

void bootstrap();
