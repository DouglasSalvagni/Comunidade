import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Work } from './work.entity';
import { PlayEvent } from '@/modules/playback/entities/play-event.entity';
import { Download } from '@/modules/playback/entities/download.entity';
import { Chapter } from './chapter.entity';

@Entity('tracks')
export class Track {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'work_id' })
  workId: string;

  @ManyToOne(() => Work, (work) => work.tracks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_id' })
  work: Work;

  @Column()
  title: string;

  @Column({ name: 'audio_url', nullable: true })
  audioUrl: string;

  @Column({ name: 'storage_key', nullable: true })
  storageKey: string;

  @Column({ name: 'hls_manifest_storage_key', nullable: true })
  hlsManifestStorageKey: string;

  // Novo modelo (Plano B)
  @Column({ name: 'original_object_key', nullable: true })
  originalObjectKey: string;

  @Column({ name: 'hls_master_key', nullable: true })
  hlsMasterKey: string;

  @Column({ name: 'hls_base_path', nullable: true })
  hlsBasePath: string;

  @Column('text', { name: 'bitrate_variants', array: true, nullable: true })
  bitrateVariants: string[];

  @Column({ name: 'encryption_key_id', nullable: true })
  encryptionKeyId: string;

  @Column({ name: 'hls_encrypted', default: false })
  hlsEncrypted: boolean;

  @Column({ name: 'hls_encryption_key', nullable: true })
  hlsEncryptionKey: string;

  @Column({ name: 'duration_seconds', nullable: true })
  durationSeconds: number;

  @Column({ name: 'order_index', default: 0 })
  orderIndex: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => PlayEvent, (playEvent) => playEvent.track)
  playEvents: PlayEvent[];

  @OneToMany(() => Download, (download) => download.track)
  downloads: Download[];

  @OneToMany(() => Chapter, (chapter) => chapter.track)
  chapters: Chapter[];
}
