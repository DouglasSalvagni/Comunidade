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
import { Plan } from '@/modules/subscriptions/entities/plan.entity';
import { Subscription } from '@/modules/subscriptions/entities/subscription.entity';
import { AdminAntiAbuseController } from './admin-anti-abuse.controller';
import { AdminAffiliatesController } from './admin-affiliates.controller';
import { AdminPartnershipsController } from './admin-partnerships.controller';
import { AdminPlansController } from './admin-plans.controller';
import { SettingsModule } from '@/modules/settings/settings.module';
import { AdminSettingsController } from './admin-settings.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Work, Tag, Affiliate, Partnership, PartnershipAffiliate, Plan, Subscription]),
    UsersModule,
    CatalogModule,
    AuthModule,
    SettingsModule,
  ],
  providers: [],
  controllers: [
    AdminAntiAbuseController,
    AdminAffiliatesController,
    AdminPartnershipsController,
    AdminPlansController,
    AdminSettingsController,
  ],
})
export class AdminModule {}
