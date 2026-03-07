import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type GatewayType = 'asaas' | 'stripe';
export type EntityType = 'plan' | 'user' | 'subscription';

@Entity('gateway_metas')
@Index('IDX_GATEWAY_METAS_UNIQUE', ['gateway', 'entityType', 'entityId'], { unique: true })
@Index('IDX_GATEWAY_METAS_ENTITY', ['entityType', 'entityId'])
@Index('IDX_GATEWAY_METAS_GATEWAY', ['gateway'])
export class GatewayMeta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  gateway: GatewayType;

  @Column({ name: 'entity_type', type: 'varchar', length: 50 })
  entityType: EntityType;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId: string;

  @Column({ type: 'jsonb', default: {} })
  metas: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
