import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type GatewayType = 'asaas' | 'stripe';

@Entity('gateway_webhooks')
@Index('IDX_GATEWAY_WEBHOOKS_GATEWAY', ['gateway'])
@Index('IDX_GATEWAY_WEBHOOKS_EVENT', ['event'])
@Index('IDX_GATEWAY_WEBHOOKS_CREATED', ['createdAt'])
export class GatewayWebhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  gateway: GatewayType;

  @Column({ type: 'varchar', length: 100 })
  event: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
