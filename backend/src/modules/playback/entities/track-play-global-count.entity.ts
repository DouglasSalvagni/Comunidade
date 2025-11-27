import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { Track } from '@/modules/catalog/entities/track.entity';

@Entity('track_play_global_count')
export class TrackPlayGlobalCount {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'track_id', unique: true })
    trackId: string;

    @OneToOne(() => Track, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'track_id' })
    track: Track;

    @Column({ type: 'int', default: 0 })
    count: number;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
