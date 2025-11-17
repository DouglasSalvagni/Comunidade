import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaybackService } from './playback.service';
import { PlaybackController } from './playback.controller';
import { PlayEvent } from './entities/play-event.entity';
import { Download } from './entities/download.entity';
import { Track } from '@/modules/catalog/entities/track.entity';
import { SubscriptionsModule } from '@/modules/subscriptions/subscriptions.module';

@Module({
  imports: [TypeOrmModule.forFeature([PlayEvent, Download, Track]), SubscriptionsModule],
  providers: [PlaybackService],
  controllers: [PlaybackController],
  exports: [PlaybackService],
})
export class PlaybackModule {}
