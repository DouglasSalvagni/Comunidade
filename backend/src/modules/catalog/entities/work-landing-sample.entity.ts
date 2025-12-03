import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Work } from './work.entity';

@Entity('work_landing_samples')
export class WorkLandingSample {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'work_id' })
  workId: string;

  @Column({ name: 'order_index', default: 0 })
  orderIndex: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Work, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_id' })
  work: Work;
}
