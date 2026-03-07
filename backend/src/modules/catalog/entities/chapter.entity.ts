import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Work } from './work.entity';
import { Track } from './track.entity';

@Entity('chapters')
export class Chapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'work_id' })
  workId: string;

  @ManyToOne(() => Work, (work) => work.chapters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_id' })
  work: Work;

  @Column({ name: 'track_id', nullable: true })
  trackId: string;

  @ManyToOne(() => Track, (track) => track.chapters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'track_id' })
  track: Track;

  @Column()
  title: string;

  @Column({ name: 'start_time_seconds', default: 0 })
  startTimeSeconds: number;

  @Column({ name: 'duration_seconds', nullable: true })
  durationSeconds: number;

  @Column({ name: 'order_index', default: 0 })
  orderIndex: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}