import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { Partnership } from './partnership.entity';

@Entity('user_active_coupons')
export class UserActiveCoupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'partnership_id' })
  partnershipId: string;

  @ManyToOne(() => Partnership, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'partnership_id' })
  partnership: Partnership;

  @Column()
  status: 'ACTIVE' | 'PENDING_CHECKOUT' | 'USED' | 'CANCELLED' | 'EXPIRED';

  @Column({ name: 'activated_at', type: 'timestamp' })
  activatedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt?: Date | null;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt?: Date | null;

  @Column({ name: 'last_checkout_id', type: 'varchar', nullable: true })
  lastCheckoutId?: string | null;

  @Column({ name: 'snapshot_discount_type', type: 'varchar', nullable: true })
  snapshotDiscountType?: 'PERCENT' | 'FIXED' | null;

  @Column({
    name: 'snapshot_discount_value',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  snapshotDiscountValue?: string | null;

  @Column({ name: 'snapshot_splits_json', type: 'jsonb', nullable: true })
  snapshotSplitsJson?: any | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

