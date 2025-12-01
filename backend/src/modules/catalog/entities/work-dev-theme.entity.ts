import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Work } from './work.entity';
import { DevTheme } from './dev-theme.entity';

@Entity('work_dev_themes')
export class WorkDevTheme {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'work_id' })
  workId: string;

  @ManyToOne(() => Work, (work) => work.workDevThemes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_id' })
  work: Work;

  @Column({ name: 'theme_id' })
  themeId: string;

  @ManyToOne(() => DevTheme, (theme) => theme.workDevThemes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'theme_id' })
  theme: DevTheme;
}

