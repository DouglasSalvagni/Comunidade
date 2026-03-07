import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Track } from '@/modules/catalog/entities/track.entity';
import { SubscriptionsModule } from '@/modules/subscriptions/subscriptions.module';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';

@Module({
  imports: [ConfigModule, BullModule.registerQueue({ name: 'transcode' }), TypeOrmModule.forFeature([Track]), SubscriptionsModule],
  providers: [MediaService],
  controllers: [MediaController],
  exports: [MediaService],
})
export class MediaModule {}
