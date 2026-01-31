import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayEvent } from '@/modules/playback/entities/play-event.entity';
import { TrackPlayUserCount } from '@/modules/playback/entities/track-play-user-count.entity';
import { TrackPlayGlobalCount } from '@/modules/playback/entities/track-play-global-count.entity';

@Processor('play-events')
export class PlayEventsProcessor {
    constructor(
        @InjectRepository(PlayEvent)
        private readonly playEventRepository: Repository<PlayEvent>,
        @InjectRepository(TrackPlayUserCount)
        private readonly trackPlayUserCountRepository: Repository<TrackPlayUserCount>,
        @InjectRepository(TrackPlayGlobalCount)
        private readonly trackPlayGlobalCountRepository: Repository<TrackPlayGlobalCount>,
    ) {
        console.log('[PLAY_EVENTS_PROCESSOR] Initialized and ready to process play-events queue');
    }

    @Process('process-play-event')
    async handlePlayEvent(job: Job) {
        const { trackId, eventType, positionSeconds, userId, profileId } = job.data;

        // 1. Save Play Event
        const playEvent = this.playEventRepository.create({
            track: { id: trackId },
            eventType,
            positionSeconds,
            profile: profileId ? { id: profileId } : null,
        });
        await this.playEventRepository.save(playEvent);

        // Only count 'play' events
        if (eventType === 'play') {
            // 2. Update User Count
            if (profileId) {
                await this.trackPlayUserCountRepository.query(`
          INSERT INTO "track_play_user_count" ("profile_id", "track_id", "count", "updated_at")
          VALUES ($1, $2, 1, NOW())
          ON CONFLICT ("profile_id", "track_id")
          DO UPDATE SET "count" = "track_play_user_count"."count" + 1, "updated_at" = NOW()
        `, [profileId, trackId]);
            }

            // 3. Update Global Count
            await this.trackPlayGlobalCountRepository.query(`
        INSERT INTO "track_play_global_count" ("track_id", "count", "updated_at")
        VALUES ($1, 1, NOW())
        ON CONFLICT ("track_id")
        DO UPDATE SET "count" = "track_play_global_count"."count" + 1, "updated_at" = NOW()
      `, [trackId]);
        }
    }
}
