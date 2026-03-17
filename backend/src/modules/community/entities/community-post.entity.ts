import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { CommunitySpace } from './community-space.entity';
import { User } from '@/modules/users/entities/user.entity';
import { CommunityPostAttachment } from './community-post-attachment.entity';
import { CommunityPostLike } from './community-post-like.entity';
import { CommunityComment } from './community-comment.entity';

export type CommunityPostStatus = 'published' | 'archived';

@Entity('community_posts')
export class CommunityPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'space_id' })
  spaceId: string;

  @ManyToOne(() => CommunitySpace, (space) => space.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'space_id' })
  space: CommunitySpace;

  @Column({ name: 'author_id' })
  authorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ nullable: true })
  title: string | null;

  @Column({ name: 'content_html', type: 'text' })
  contentHtml: string;

  @Column({ name: 'is_pinned', default: false })
  isPinned: boolean;

  @Column({ name: 'pinned_at', type: 'timestamp', nullable: true })
  pinnedAt: Date | null;

  @Column({ type: 'varchar', default: 'published' })
  status: CommunityPostStatus;

  @Column({ name: 'comments_count', type: 'int', default: 0 })
  commentsCount: number;

  @Column({ name: 'likes_count', type: 'int', default: 0 })
  likesCount: number;

  @OneToMany(() => CommunityPostAttachment, (attachment) => attachment.post, { cascade: true })
  attachments: CommunityPostAttachment[];

  @OneToMany(() => CommunityPostLike, (like) => like.post, { cascade: true })
  likes: CommunityPostLike[];

  @OneToMany(() => CommunityComment, (comment) => comment.post, { cascade: true })
  comments: CommunityComment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
