import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Profile } from '@/modules/profiles/entities/profile.entity';
import { Subscription } from '@/modules/subscriptions/entities/subscription.entity';
import { Favorite } from '@/modules/catalog/entities/favorite.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'auth_provider', default: 'local' })
  authProvider: 'local' | 'google';

  @Column()
  name: string;

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

  @OneToMany(() => Profile, (profile) => profile.user)
  profiles: Profile[];

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions: Subscription[];

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites: Favorite[];
}