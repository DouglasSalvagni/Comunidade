import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '@/modules/users/entities/user.entity';
import { Profile } from '@/modules/profiles/entities/profile.entity';
import { Work } from '@/modules/catalog/entities/work.entity';
import { Track } from '@/modules/catalog/entities/track.entity';
import { Chapter } from '@/modules/catalog/entities/chapter.entity';
import { Tag } from '@/modules/catalog/entities/tag.entity';
import { Plan } from '@/modules/subscriptions/entities/plan.entity';
import { Subscription } from '@/modules/subscriptions/entities/subscription.entity';
import { GatewayMeta } from '@/modules/subscriptions/entities/gateway-meta.entity';
import { GatewayWebhook } from '@/modules/subscriptions/entities/gateway-webhook.entity';
import { Invoice } from '@/modules/subscriptions/entities/invoice.entity';
import { Favorite } from '@/modules/catalog/entities/favorite.entity';
import { PlayEvent } from '@/modules/playback/entities/play-event.entity';
import { Download } from '@/modules/playback/entities/download.entity';
import { WorkTag } from '@/modules/catalog/entities/work-tag.entity';
import { Playlist } from '@/modules/playlists/entities/playlist.entity';
import { PlaylistItem } from '@/modules/playlists/entities/playlist-item.entity';
import { TrackPlayUserCount } from '@/modules/playback/entities/track-play-user-count.entity';
import { TrackPlayGlobalCount } from '@/modules/playback/entities/track-play-global-count.entity';

export default (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: configService.get<string>('DATABASE_URL') || 'postgresql://postgres:postgres@localhost:5433/little_tales',
  // Allow overriding SSL via env (DB_SSL/DATABASE_SSL). Default: enabled only in production.
  ssl: (() => {
    const raw = configService.get<string>('DB_SSL') ?? configService.get<string>('DATABASE_SSL');
    const shouldUseSsl = raw !== undefined
      ? ['true', '1', 'yes', 'on'].includes(String(raw).toLowerCase())
      : configService.get<string>('NODE_ENV') === 'production';
    return shouldUseSsl ? { rejectUnauthorized: false } : false;
  })(),
  entities: [
    User,
    Profile,
    Work,
    Track,
    Chapter,
    Tag,
    Plan,
    Subscription,
    GatewayMeta,
    GatewayWebhook,
    Invoice,
    Favorite,
    PlayEvent,
    Download,
    WorkTag,
    Playlist,
    PlaylistItem,
    TrackPlayUserCount,
    TrackPlayGlobalCount,
  ],
  synchronize: false,
  logging: configService.get<string>('NODE_ENV') === 'development',
  migrations: ['dist/database/migrations/*.js'],
  migrationsRun: false,
});
