import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '@/modules/users/entities/user.entity';
import { Plan } from '@/modules/subscriptions/entities/plan.entity';
import { Subscription } from '@/modules/subscriptions/entities/subscription.entity';
import { GatewayMeta } from '@/modules/subscriptions/entities/gateway-meta.entity';
import { GatewayWebhook } from '@/modules/subscriptions/entities/gateway-webhook.entity';
import { Invoice } from '@/modules/subscriptions/entities/invoice.entity';
import { LegalDocument } from '@/modules/legal/entities/legal-document.entity';
import { UserAgreement } from '@/modules/legal/entities/user-agreement.entity';
import { Affiliate } from '@/modules/subscriptions/entities/affiliate.entity';
import { Partnership } from '@/modules/subscriptions/entities/partnership.entity';
import { PartnershipAffiliate } from '@/modules/subscriptions/entities/partnership-affiliate.entity';
import { UserActiveCoupon } from '@/modules/subscriptions/entities/user-active-coupon.entity';
import { AuditLog } from '@/modules/audit/entities/audit-log.entity';
import { SystemSetting } from '@/modules/settings/entities/system-setting.entity';
import { Course } from '@/modules/courses/entities/course.entity';
import { CourseModule as CourseModuleEntity } from '@/modules/courses/entities/course-module.entity';
import { Lesson } from '@/modules/courses/entities/lesson.entity';
import { LessonAttachment } from '@/modules/courses/entities/lesson-attachment.entity';
import { LessonProgress } from '@/modules/courses/entities/lesson-progress.entity';
import { CoursePlanAccess } from '@/modules/courses/entities/course-plan-access.entity';
import { CommunitySpace } from '@/modules/community/entities/community-space.entity';
import { CommunitySpacePlanAccess } from '@/modules/community/entities/community-space-plan-access.entity';
import { CommunitySpaceCourseAccess } from '@/modules/community/entities/community-space-course-access.entity';
import { CommunityPost } from '@/modules/community/entities/community-post.entity';
import { CommunityPostAttachment } from '@/modules/community/entities/community-post-attachment.entity';
import { CommunityPostLike } from '@/modules/community/entities/community-post-like.entity';
import { CommunityComment } from '@/modules/community/entities/community-comment.entity';

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
    Plan,
    Subscription,
    GatewayMeta,
    GatewayWebhook,
    Invoice,
    LegalDocument,
    UserAgreement,
    Affiliate,
    Partnership,
    PartnershipAffiliate,
    UserActiveCoupon,
    AuditLog,
    SystemSetting,
    Course,
    CourseModuleEntity,
    Lesson,
    LessonAttachment,
    LessonProgress,
    CoursePlanAccess,
    CommunitySpace,
    CommunitySpacePlanAccess,
    CommunitySpaceCourseAccess,
    CommunityPost,
    CommunityPostAttachment,
    CommunityPostLike,
    CommunityComment,
  ],
  autoLoadEntities: true,
  synchronize: false,
  logging: configService.get<string>('NODE_ENV') === 'development',
  migrations: ['dist/database/migrations/*.js'],
  migrationsRun: false,
});
