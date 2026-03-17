import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { CommunitySpace } from './community-space.entity';
import { Course } from '@/modules/courses/entities/course.entity';

@Entity('community_space_course_access')
@Unique(['spaceId', 'courseId'])
export class CommunitySpaceCourseAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'space_id' })
  spaceId: string;

  @ManyToOne(() => CommunitySpace, (space) => space.courseAccess, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'space_id' })
  space: CommunitySpace;

  @Column({ name: 'course_id' })
  courseId: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;
}
