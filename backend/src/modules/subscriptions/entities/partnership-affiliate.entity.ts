import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Partnership } from './partnership.entity';
import { Affiliate } from './affiliate.entity';

@Entity('partnership_affiliates')
export class PartnershipAffiliate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'partnership_id' })
  partnershipId: string;

  @ManyToOne(() => Partnership, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partnership_id' })
  partnership: Partnership;

  @Column({ name: 'affiliate_id' })
  affiliateId: string;

  @ManyToOne(() => Affiliate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'affiliate_id' })
  affiliate: Affiliate;

  @Column({ name: 'payout_type' })
  payoutType: 'PERCENT' | 'FIXED';

  @Column({ name: 'payout_value', type: 'decimal', precision: 10, scale: 2 })
  payoutValue: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

