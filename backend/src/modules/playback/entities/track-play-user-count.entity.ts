import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Profile } from '@/modules/profiles/entities/profile.entity';
import { Track } from '@/modules/catalog/entities/track.entity';

@Entity('track_play_user_count')
@Unique(['profileId', 'trackId'])
export class TrackPlayUserCount {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'profile_id' })
    profileId: string;

    @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'profile_id' })
    profile: Profile;

    @Column({ name: 'track_id' })
    trackId: string;

    @ManyToOne(() => Track, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'track_id' })
    track: Track;

    @Column({ type: 'int', default: 0 })
    count: number;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
