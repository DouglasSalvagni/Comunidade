import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { Course } from '@/modules/courses/entities/course.entity';
import { Lesson } from '@/modules/courses/entities/lesson.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'course_id', nullable: true })
  courseId: string;

  @ManyToOne(() => Course, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'lesson_id', nullable: true })
  lessonId: string;

  @Column({ type: 'varchar', length: 50 })
  role: 'user' | 'assistant' | 'system';

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'vector' as any, length: 1536, nullable: true })
  embedding: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
