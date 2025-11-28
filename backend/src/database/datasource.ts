import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { ConfigModule } from '@nestjs/config'
import { User } from '@/modules/users/entities/user.entity'
import { Profile } from '@/modules/profiles/entities/profile.entity'
import { Work } from '@/modules/catalog/entities/work.entity'
import { Track } from '@/modules/catalog/entities/track.entity'
import { Chapter } from '@/modules/catalog/entities/chapter.entity'
import { Tag } from '@/modules/catalog/entities/tag.entity'
import { Plan } from '@/modules/subscriptions/entities/plan.entity'
import { Subscription } from '@/modules/subscriptions/entities/subscription.entity'
import { GatewayMeta } from '@/modules/subscriptions/entities/gateway-meta.entity'
import { GatewayWebhook } from '@/modules/subscriptions/entities/gateway-webhook.entity'
import { Invoice } from '@/modules/subscriptions/entities/invoice.entity'
import { Favorite } from '@/modules/catalog/entities/favorite.entity'
import { PlayEvent } from '@/modules/playback/entities/play-event.entity'
import { Download } from '@/modules/playback/entities/download.entity'
import { WorkTag } from '@/modules/catalog/entities/work-tag.entity'
import { Playlist } from '@/modules/playlists/entities/playlist.entity'
import { PlaylistItem } from '@/modules/playlists/entities/playlist-item.entity'
import * as path from 'path'

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/little_tales'
const isProd = process.env.NODE_ENV === 'production'
const rawSsl = process.env.DB_SSL || process.env.DATABASE_SSL
const useSsl = rawSsl !== undefined
  ? ['true', '1', 'yes', 'on'].includes(String(rawSsl).toLowerCase())
  : isProd

const AppDataSource = new DataSource({
  type: 'postgres',
  url: dbUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
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
  migrations: ['src/database/migrations/*.ts'],
})

export default AppDataSource
