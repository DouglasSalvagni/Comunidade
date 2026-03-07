import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Track } from './track.entity';
import { Chapter } from './chapter.entity';
import { Tag } from './tag.entity';
import { WorkTag } from './work-tag.entity';
import { DevTheme } from './dev-theme.entity';
import { WorkDevTheme } from './work-dev-theme.entity';
import { Favorite } from './favorite.entity';

@Entity('works')
export class Work {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  type: 'music' | 'audiobook' | 'series';

  @Column({ name: 'recommended_min_months', type: 'int', default: 0 })
  recommendedMinMonths: number;

  @Column({ name: 'recommended_max_months', type: 'int', default: 0 })
  recommendedMaxMonths: number;

  @Column({ name: 'recommended_age_label', nullable: true })
  recommendedAgeLabel: string;

  @Column({ name: 'cover_url', nullable: true })
  coverUrl: string;

  @Column({ name: 'cover_thumb_url', nullable: true })
  coverThumbUrl: string;

  @Column({ name: 'duration_seconds', nullable: true })
  durationSeconds: number;

  @Column({ name: 'artist_name', nullable: true })
  artistName: string;

  @Column({ name: 'is_premium', default: false })
  isPremium: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Track, (track) => track.work)
  tracks: Track[];

  @OneToMany(() => Chapter, (chapter) => chapter.work)
  chapters: Chapter[];

  @OneToMany(() => WorkTag, (workTag) => workTag.work)
  workTags: WorkTag[];

  @OneToMany(() => WorkDevTheme, (workDevTheme) => workDevTheme.work)
  workDevThemes: WorkDevTheme[];

  @OneToMany(() => Favorite, (favorite) => favorite.work)
  favorites: Favorite[];

  @ManyToMany(() => Tag, (tag) => tag.works)
  @JoinTable({
    name: 'work_tags',
    joinColumn: { name: 'work_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @ManyToMany(() => DevTheme, (theme) => theme.works)
  @JoinTable({
    name: 'work_dev_themes',
    joinColumn: { name: 'work_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'theme_id', referencedColumnName: 'id' },
  })
  devThemes: DevTheme[];
}
