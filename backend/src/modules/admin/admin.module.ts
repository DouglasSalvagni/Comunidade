import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '@/modules/users/users.module';
import { CatalogModule } from '@/modules/catalog/catalog.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { User } from '@/modules/users/entities/user.entity';
import { Work } from '@/modules/catalog/entities/work.entity';
import { Tag } from '@/modules/catalog/entities/tag.entity';
import { Affiliate } from '@/modules/subscriptions/entities/affiliate.entity';
import { Partnership } from '@/modules/subscriptions/entities/partnership.entity';
import { PartnershipAffiliate } from '@/modules/subscriptions/entities/partnership-affiliate.entity';
import { AdminAntiAbuseController } from './admin-anti-abuse.controller';
import { AdminAffiliatesController } from './admin-affiliates.controller';
import { AdminPartnershipsController } from './admin-partnerships.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Work, Tag, Affiliate, Partnership, PartnershipAffiliate]),
    UsersModule,
    CatalogModule,
    AuthModule,
  ],
  providers: [],
  controllers: [AdminAntiAbuseController, AdminAffiliatesController, AdminPartnershipsController],
})
export class AdminModule {}
