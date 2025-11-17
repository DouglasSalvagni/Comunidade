import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '@/modules/users/users.module';
import { CatalogModule } from '@/modules/catalog/catalog.module';
import { User } from '@/modules/users/entities/user.entity';
import { Work } from '@/modules/catalog/entities/work.entity';
import { Tag } from '@/modules/catalog/entities/tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Work, Tag]), UsersModule, CatalogModule],
  providers: [],
  controllers: [],
})
export class AdminModule {}