import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { PlayEventsProcessor } from './processors/play-events.processor';
import { PlayEvent } from '@/modules/playback/entities/play-event.entity';
import { TrackPlayUserCount } from '@/modules/playback/entities/track-play-user-count.entity';
import { TrackPlayGlobalCount } from '@/modules/playback/entities/track-play-global-count.entity';
import databaseConfig from '@/config/database.config';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [],
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: databaseConfig,
            inject: [ConfigService],
        }),
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
        TypeOrmModule.forFeature([PlayEvent, TrackPlayUserCount, TrackPlayGlobalCount]),
        BullModule.registerQueue({
            name: 'play-events',
        }),
    ],
    providers: [PlayEventsProcessor],
})
export class WorkerModule { }
