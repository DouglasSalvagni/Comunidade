import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { RedisModule } from '@nestjs-modules/ioredis';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './modules/auth/auth.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { AdminModule } from './modules/admin/admin.module';
import { UsersModule } from './modules/users/users.module';
import { LegalModule } from './modules/legal/legal.module';
import { AuditModule } from './modules/audit/audit.module';
import { SettingsModule } from './modules/settings/settings.module';
import { CoursesModule } from './modules/courses/courses.module';

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
    SubscriptionsModule,
    AdminModule,
    LegalModule,
    AuditModule,
    SettingsModule,
    CoursesModule,
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
