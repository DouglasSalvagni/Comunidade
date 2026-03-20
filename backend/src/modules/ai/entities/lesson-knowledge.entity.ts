import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Lesson } from '@/modules/courses/entities/lesson.entity';
import { Course } from '@/modules/courses/entities/course.entity';
import { LessonAttachment } from '@/modules/courses/entities/lesson-attachment.entity';

@Entity('lesson_knowledge')
export class LessonKnowledge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'course_id' })
  courseId: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'lesson_id' })
  lessonId: string;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;

  @Column({ name: 'attachment_id', nullable: true })
  attachmentId: string;

  @ManyToOne(() => LessonAttachment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attachment_id' })
  attachment: LessonAttachment;

  @Column({ type: 'varchar', length: 50 })
  type: 'video' | 'text' | 'attachment';

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'vector' as any, length: 1536, nullable: true })
  embedding: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
