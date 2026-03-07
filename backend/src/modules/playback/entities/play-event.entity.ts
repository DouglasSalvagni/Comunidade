import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Profile } from '@/modules/profiles/entities/profile.entity';
import { Track } from '@/modules/catalog/entities/track.entity';

@Entity('play_events')
export class PlayEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'profile_id', nullable: true })
  profileId: string;

  @ManyToOne(() => Profile, (profile) => profile.playEvents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @Column({ name: 'track_id' })
  trackId: string;

  @ManyToOne(() => Track, (track) => track.playEvents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'track_id' })
  track: Track;

  @Column({ name: 'event_type' })
  eventType: 'play' | 'pause' | 'complete' | 'seek';

  @Column({ name: 'position_seconds', default: 0 })
  positionSeconds: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}