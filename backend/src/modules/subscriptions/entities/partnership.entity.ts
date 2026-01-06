import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('partnerships')
export class Partnership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({ default: 'ACTIVE' })
  status: 'ACTIVE' | 'INACTIVE';

  @Column({ name: 'discount_type' })
  discountType: 'PERCENT' | 'FIXED';

  @Column({ name: 'discount_value', type: 'decimal', precision: 10, scale: 2 })
  discountValue: string;

  @Column({ name: 'starts_at', type: 'timestamp', nullable: true })
  startsAt?: Date | null;

  @Column({ name: 'ends_at', type: 'timestamp', nullable: true })
  endsAt?: Date | null;

  @Column({ name: 'max_redemptions', type: 'int', nullable: true })
  maxRedemptions?: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

