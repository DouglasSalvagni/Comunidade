import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { CommunitySpacePlanAccess } from './community-space-plan-access.entity';
import { CommunitySpaceCourseAccess } from './community-space-course-access.entity';
import { CommunityPost } from './community-post.entity';

export type CommunitySpaceVisibility = 'public' | 'restricted';

@Entity('community_spaces')
export class CommunitySpace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', default: 'public' })
  visibility: CommunitySpaceVisibility;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => CommunitySpacePlanAccess, (access) => access.space, { cascade: true })
  planAccess: CommunitySpacePlanAccess[];

  @OneToMany(() => CommunitySpaceCourseAccess, (access) => access.space, { cascade: true })
  courseAccess: CommunitySpaceCourseAccess[];

  @OneToMany(() => CommunityPost, (post) => post.space, { cascade: true })
  posts: CommunityPost[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
