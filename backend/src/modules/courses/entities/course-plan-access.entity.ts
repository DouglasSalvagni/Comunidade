import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Course } from './course.entity';
import { Plan } from '@/modules/subscriptions/entities/plan.entity';

@Entity('course_plan_access')
@Unique(['cursoId', 'planId'])
export class CoursePlanAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'curso_id' })
  cursoId: string;

  @ManyToOne(() => Course, (c) => c.planAccess, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'curso_id' })
  curso: Course;

  @Column({ name: 'plan_id' })
  planId: string;

  @ManyToOne(() => Plan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;
}
