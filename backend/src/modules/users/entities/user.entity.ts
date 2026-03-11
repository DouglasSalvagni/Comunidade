import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Subscription } from '@/modules/subscriptions/entities/subscription.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'auth_provider', default: 'local' })
  authProvider: 'local' | 'google' | 'apple';

  @Column()
  name: string;

  @Column({ name: 'bio', type: 'text', nullable: true })
  bio?: string | null;

  @Column({ name: 'profile_links', type: 'jsonb', nullable: true })
  profileLinks?: Array<{ label: string; url: string }> | null;

  @Column({ name: 'avatar_key', type: 'varchar', nullable: true })
  avatarKey?: string | null;

  @Column({ default: 'user' })
  role: 'user' | 'admin';

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions: Subscription[];

  @Column({ name: 'apple_user_id', type: 'varchar', nullable: true, unique: true })
  appleUserId?: string | null;

  @Column({ name: 'password_reset_token_hash', type: 'varchar', nullable: true })
  passwordResetTokenHash?: string | null;

  @Column({ name: 'password_reset_expires_at', type: 'timestamp', nullable: true })
  passwordResetExpiresAt?: Date | null;

  @Column({ name: 'email_verification_token_hash', type: 'varchar', nullable: true })
  emailVerificationTokenHash?: string | null;

  @Column({ name: 'email_verification_expires_at', type: 'timestamp', nullable: true })
  emailVerificationExpiresAt?: Date | null;
}
