import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as compression from 'compression';
import * as helmet from 'helmet';
import * as cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { DevExceptionFilter } from './common/filters/dev-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const corsEnabledRaw = configService.get<string>('CORS_ENABLED');
  const corsEnabled = corsEnabledRaw !== undefined
    ? ['true', '1', 'yes', 'on'].includes(String(corsEnabledRaw).toLowerCase())
    : true;

  const httpAdapter = app.getHttpAdapter();
  const instance = httpAdapter?.getInstance?.();
  if (instance?.set) {
    instance.set('trust proxy', 1);
  }

  // Security
  app.use(helmet.default({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  if (corsEnabled) {
    app.enableCors({
      origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });
  }

  // Compression
  app.use(compression());

  // Cookies
  app.use(cookieParser());

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation (only in development)
  if (nodeEnv === 'development') {
    // Detailed errors in development
    app.useGlobalFilters(new DevExceptionFilter());

    const config = new DocumentBuilder()
      .setTitle('Little Tales API')
      .setDescription('API para app de músicas e audiobooks infantis')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/v1/docs', app, document);
  }

  // Global prefix
  app.setGlobalPrefix('api/v1');

  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
  
  if (nodeEnv === 'development') {
    console.log(`📚 API Documentation: http://localhost:${port}/api/v1/docs`);
  }
}

bootstrap();
