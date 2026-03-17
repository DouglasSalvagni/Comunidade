import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { CommunitySpace } from './community-space.entity';
import { Plan } from '@/modules/subscriptions/entities/plan.entity';

@Entity('community_space_plan_access')
@Unique(['spaceId', 'planId'])
export class CommunitySpacePlanAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'space_id' })
  spaceId: string;

  @ManyToOne(() => CommunitySpace, (space) => space.planAccess, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'space_id' })
  space: CommunitySpace;

  @Column({ name: 'plan_id' })
  planId: string;

  @ManyToOne(() => Plan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;
}
