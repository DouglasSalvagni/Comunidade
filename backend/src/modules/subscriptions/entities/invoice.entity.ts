import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Subscription } from './subscription.entity';

/**
 * Status de fatura simplificado
 * PENDING: Aguardando pagamento
 * CONFIRMED: Pagamento confirmado
 * OVERDUE: Atrasada
 * REFUNDED: Reembolsada
 */
export type InvoiceStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Subscription, { nullable: true })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @Column({ name: 'subscription_id', nullable: true })
  subscriptionId: string;

  @Column({ type: 'varchar', length: 50 })
  provider: string;

  @Column({ name: 'provider_id', type: 'varchar', length: 255 })
  providerId: string;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @Column({ type: 'varchar', length: 50 })
  status: InvoiceStatus;

  @Column({ name: 'invoice_url', type: 'text', nullable: true })
  invoiceUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
