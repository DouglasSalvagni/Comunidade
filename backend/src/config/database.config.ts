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

export default (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: configService.get<string>('DATABASE_URL') || 'postgresql://postgres:postgres@localhost:5433/little_tales',
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
  ],
  synchronize: false,
  logging: configService.get<string>('NODE_ENV') === 'development',
  ssl: configService.get<string>('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
  migrations: ['dist/database/migrations/*.js'],
  migrationsRun: false,
});