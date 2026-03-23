import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { RedisModule } from '@nestjs-modules/ioredis';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { BullModule } from '@nestjs/bullmq';

import { AuthModule } from './modules/auth/auth.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { AdminModule } from './modules/admin/admin.module';
import { UsersModule } from './modules/users/users.module';
import { LegalModule } from './modules/legal/legal.module';
import { AuditModule } from './modules/audit/audit.module';
import { SettingsModule } from './modules/settings/settings.module';
import { CoursesModule } from './modules/courses/courses.module';
import { CommunityModule } from './modules/community/community.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AiModule } from './modules/ai/ai.module';

import databaseConfig from './config/database.config';
// import redisConfig from './config/redis.config';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

@Module({
  imports: [
    // Configuração
    ConfigModule.forRoot({
      isGlobal: true,
      load: [],
    }),

    // Banco de dados
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),

    // Redis / BullMQ
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST', 'localhost');
        const port = configService.get<number>('REDIS_PORT', 6380);
        console.log(`[BullMQ] Connecting to Redis at ${host}:${port}`);
        return {
          connection: {
            host,
            port,
          },
        };
      },
      inject: [ConfigService],
    }),

    // Redis - desabilitado temporariamente
    // RedisModule.forRootAsync({
    //   useFactory: redisConfig,
    // }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 300,
      },
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 100,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 1000,
      },
    ]),

    // Módulos da aplicação
    AuthModule,
    UsersModule,
    ...(process.env.ENABLE_SUBSCRIPTIONS_FEATURE === 'false' ? [] : [SubscriptionsModule]),
    AdminModule,
    LegalModule,
    AuditModule,
    SettingsModule,
    NotificationsModule,
    AiModule,
    ...(process.env.ENABLE_COURSES_FEATURE === 'false' ? [] : [CoursesModule]),
    ...(process.env.ENABLE_COMMUNITY_FEATURE === 'false' ? [] : [CommunityModule]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule { }
