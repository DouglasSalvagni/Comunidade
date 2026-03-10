import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CourseModule } from './course-module.entity';

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'modulo_id' })
  moduloId: string;

  @ManyToOne(() => CourseModule, (m) => m.aulas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'modulo_id' })
  modulo: CourseModule;

  @Column()
  titulo: string;

  @Column({ name: 'conteudo_texto', type: 'text', nullable: true })
  conteudoTexto: string;

  @Column({ name: 'video_key', nullable: true })
  videoKey: string;

  @Column({ name: 'duracao_segundos', type: 'int', default: 0 })
  duracaoSegundos: number;

  @Column({ type: 'int', default: 0 })
  ordem: number;

  @Column({ default: 'pendente' })
  status: 'pendente' | 'processando' | 'pronto' | 'erro';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
