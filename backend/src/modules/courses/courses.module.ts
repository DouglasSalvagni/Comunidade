import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { CourseModule as CourseModuleEntity } from './entities/course-module.entity';
import { Lesson } from './entities/lesson.entity';
import { LessonAttachment } from './entities/lesson-attachment.entity';
import { LessonProgress } from './entities/lesson-progress.entity';
import { CoursePlanAccess } from './entities/course-plan-access.entity';
import { Subscription } from '@/modules/subscriptions/entities/subscription.entity';
import { CoursesService } from './courses.service';
import { StorageService } from './storage.service';
import { CoursesController } from './courses.controller';
import { AdminCoursesController } from './admin-courses.controller';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      CourseModuleEntity,
      Lesson,
      LessonAttachment,
      LessonProgress,
      CoursePlanAccess,
      Subscription,
    ]),
    AuthModule,
  ],
  controllers: [CoursesController, AdminCoursesController],
  providers: [CoursesService, StorageService],
  exports: [CoursesService],
})
export class CoursesModule {}
