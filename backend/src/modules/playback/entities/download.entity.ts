import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Profile } from '@/modules/profiles/entities/profile.entity';
import { Track } from '@/modules/catalog/entities/track.entity';

@Entity('downloads')
@Unique(['profileId', 'trackId', 'deviceId'])
export class Download {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'profile_id' })
  profileId: string;

  @ManyToOne(() => Profile, (profile) => profile.downloads, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @Column({ name: 'track_id' })
  trackId: string;

  @ManyToOne(() => Track, (track) => track.downloads, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'track_id' })
  track: Track;

  @Column({ name: 'license_expires_at', nullable: true })
  licenseExpiresAt: Date;

  @Column({ name: 'device_id' })
  deviceId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}