import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { WorkDevTheme } from './work-dev-theme.entity';

@Entity('dev_themes')
export class DevTheme {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => WorkDevTheme, (workDevTheme) => workDevTheme.theme)
  workDevThemes: WorkDevTheme[];

  works?: any[];
}

