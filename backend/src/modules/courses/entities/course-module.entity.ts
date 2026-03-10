import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Course } from './course.entity';
import { Lesson } from './lesson.entity';

@Entity('course_modules')
export class CourseModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'curso_id' })
  cursoId: string;

  @ManyToOne(() => Course, (c) => c.modulos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'curso_id' })
  curso: Course;

  @Column()
  titulo: string;

  @Column({ type: 'int', default: 0 })
  ordem: number;

  @OneToMany(() => Lesson, (l) => l.modulo, { cascade: true })
  aulas: Lesson[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
