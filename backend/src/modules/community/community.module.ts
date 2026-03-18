import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunityService } from './community.service';
import { CommunityAccessService } from './community-access.service';
import { CommunitySpacesController } from './community-spaces.controller';
import { AdminCommunitySpacesController } from './admin-community-spaces.controller';
import { CommunityPostsController } from './community-posts.controller';
import { AdminCommunityPostsController } from './admin-community-posts.controller';
import { CommunitySpace } from './entities/community-space.entity';
import { CommunitySpacePlanAccess } from './entities/community-space-plan-access.entity';
import { CommunityPost } from './entities/community-post.entity';
import { CommunityPostAttachment } from './entities/community-post-attachment.entity';
import { CommunityPostLike } from './entities/community-post-like.entity';
import { CommunityComment } from './entities/community-comment.entity';
import { Subscription } from '@/modules/subscriptions/entities/subscription.entity';
import { CoursesModule } from '@/modules/courses/courses.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';

@Module({
  imports: [
    CoursesModule,
    NotificationsModule,
    TypeOrmModule.forFeature([
      CommunitySpace,
      CommunitySpacePlanAccess,
      CommunityPost,
      CommunityPostAttachment,
      CommunityPostLike,
      CommunityComment,
      Subscription,
    ]),
  ],
  controllers: [
    CommunitySpacesController,
    CommunityPostsController,
    AdminCommunitySpacesController,
    AdminCommunityPostsController,
  ],
  providers: [CommunityService, CommunityAccessService],
  exports: [CommunityService, CommunityAccessService],
})
export class CommunityModule {}
