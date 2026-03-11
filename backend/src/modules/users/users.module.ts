import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Subscription } from '@/modules/subscriptions/entities/subscription.entity';
import { CoursesModule } from '@/modules/courses/courses.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Subscription]), CoursesModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
