import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { Lesson } from './lesson.entity';

@Entity('lesson_progress')
@Unique(['usuarioId', 'aulaId'])
export class LessonProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id' })
  usuarioId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @Column({ name: 'aula_id' })
  aulaId: string;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'aula_id' })
  aula: Lesson;

  @Column({ default: false })
  concluida: boolean;

  @Column({ name: 'tempo_assistido', type: 'int', default: 0 })
  tempoAssistido: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
