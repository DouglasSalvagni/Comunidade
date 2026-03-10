import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Lesson } from './lesson.entity';

@Entity('lesson_attachments')
export class LessonAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'aula_id' })
  aulaId: string;

  @ManyToOne(() => Lesson, (l) => l.anexos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'aula_id' })
  aula: Lesson;

  @Column()
  nome: string;

  @Column({ name: 'file_key' })
  fileKey: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'content_type', default: 'application/octet-stream' })
  contentType: string;

  @Column({ name: 'tamanho_bytes', type: 'int', default: 0 })
  tamanhoBytes: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
