import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { PlaybackService } from './playback.service';
import { PlaybackController } from './playback.controller';
import { PlayEvent } from './entities/play-event.entity';
import { Download } from './entities/download.entity';
import { TrackPlayUserCount } from './entities/track-play-user-count.entity';
import { TrackPlayGlobalCount } from './entities/track-play-global-count.entity';
import { Track } from '@/modules/catalog/entities/track.entity';
import { SubscriptionsModule } from '@/modules/subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlayEvent,
      Download,
      Track,
      TrackPlayUserCount,
      TrackPlayGlobalCount
    ]),
    SubscriptionsModule,
    BullModule.registerQueue({
      name: 'play-events',
    }),
  ],
  providers: [PlaybackService],
  controllers: [PlaybackController],
  exports: [PlaybackService],
})
export class PlaybackModule { }
