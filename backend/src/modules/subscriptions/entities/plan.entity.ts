import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'price_cents' })
  priceCents: number;

  @Column({ name: 'billing_period' })
  billingPeriod: 'monthly' | 'yearly';

  @Column({ type: 'jsonb', nullable: true })
  features: any;

  @Column({ name: 'courtesy_duration_months', type: 'int', nullable: true })
  courtesyDurationMonths: number | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
