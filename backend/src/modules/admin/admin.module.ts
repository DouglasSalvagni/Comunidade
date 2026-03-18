import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '@/modules/users/users.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { User } from '@/modules/users/entities/user.entity';
import { Affiliate } from '@/modules/subscriptions/entities/affiliate.entity';
import { Partnership } from '@/modules/subscriptions/entities/partnership.entity';
import { PartnershipAffiliate } from '@/modules/subscriptions/entities/partnership-affiliate.entity';
import { Plan } from '@/modules/subscriptions/entities/plan.entity';
import { Subscription } from '@/modules/subscriptions/entities/subscription.entity';
import { AdminAntiAbuseController } from './admin-anti-abuse.controller';
import { AdminAffiliatesController } from './admin-affiliates.controller';
import { AdminPartnershipsController } from './admin-partnerships.controller';
import { AdminPlansController } from './admin-plans.controller';
import { AdminSettingsController } from './admin-settings.controller';
import { SettingsModule } from '@/modules/settings/settings.module';
import { CoursesModule } from '@/modules/courses/courses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Affiliate, Partnership, PartnershipAffiliate, Plan, Subscription]),
    UsersModule,
    AuthModule,
    SettingsModule,
    CoursesModule,
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
