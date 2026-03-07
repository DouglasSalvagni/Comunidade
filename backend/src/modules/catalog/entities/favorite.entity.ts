import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { Work } from './work.entity';
import { Profile } from '@/modules/profiles/entities/profile.entity';

@Entity('favorites')
@Unique(['profileId', 'workId'])
export class Favorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'work_id' })
  workId: string;

  @ManyToOne(() => Work, (work) => work.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_id' })
  work: Work;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'profile_id', nullable: true })
  profileId: string;

  @ManyToOne(() => Profile, (profile) => profile.playEvents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;
}
