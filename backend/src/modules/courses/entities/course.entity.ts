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
import { User } from '@/modules/users/entities/user.entity';
import { CourseModule } from './course-module.entity';
import { CoursePlanAccess } from './course-plan-access.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ name: 'thumbnail_url', nullable: true })
  thumbnailUrl: string;

  @Column({ default: 'rascunho' })
  status: 'rascunho' | 'publicado';

  @Column({ name: 'criador_id' })
  criadorId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'criador_id' })
  criador: User;

  @OneToMany(() => CourseModule, (m) => m.curso, { cascade: true })
  modulos: CourseModule[];

  @OneToMany(() => CoursePlanAccess, (cpa) => cpa.curso, { cascade: true })
  planAccess: CoursePlanAccess[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
