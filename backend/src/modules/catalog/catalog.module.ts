import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogService } from './catalog.service';
import { CatalogController, AdminCatalogController, AdminTagsController } from './catalog.controller';
import { Work } from './entities/work.entity';
import { Track } from './entities/track.entity';
import { Chapter } from './entities/chapter.entity';
import { Tag } from './entities/tag.entity';
import { WorkTag } from './entities/work-tag.entity';
import { Favorite } from './entities/favorite.entity';
import { MediaModule } from '@/modules/media/media.module';
import { Profile } from '@/modules/profiles/entities/profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Work, Track, Chapter, Tag, WorkTag, Favorite, Profile]), MediaModule],
  providers: [CatalogService],
  controllers: [CatalogController, AdminCatalogController, AdminTagsController],
  exports: [CatalogService],
})
export class CatalogModule {}
