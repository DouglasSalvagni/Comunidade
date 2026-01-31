import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { RedisModule } from '@nestjs-modules/ioredis';
import { BullModule } from '@nestjs/bull';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { PlaybackModule } from './modules/playback/playback.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { AdminModule } from './modules/admin/admin.module';
import { MediaModule } from './modules/media/media.module';
import { UsersModule } from './modules/users/users.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { PlaylistsModule } from './modules/playlists/playlists.module';
import { LegalModule } from './modules/legal/legal.module';
import { AuditModule } from './modules/audit/audit.module';

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

    // Bull Queue para processamento assíncrono
    BullModule.forRoot({
      redis: ((): any => {
        const url = process.env.REDIS_URL;
        let host = process.env.REDIS_HOST || 'ninaro_redis';  // Use 'redis' as fallback (Docker container name)
        let port = parseInt(process.env.REDIS_PORT || '6379');
        let password = process.env.REDIS_PASSWORD;
        if (url) {
          try {
            const u = new URL(url);
            host = u.hostname || host;
            port = (u.port && parseInt(u.port)) || port;
            password = u.password || password;
          } catch { }
        }
        return { host, port, password };
      })(),
    }),

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
    ProfilesModule,
    PlaylistsModule,
    CatalogModule,
    PlaybackModule,
    SubscriptionsModule,
    AdminModule,
    MediaModule,
    LegalModule,
    AuditModule,
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
