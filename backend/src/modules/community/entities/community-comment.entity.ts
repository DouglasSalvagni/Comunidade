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
import { CommunityPost } from './community-post.entity';
import { User } from '@/modules/users/entities/user.entity';

export type CommunityCommentStatus = 'published' | 'deleted';

@Entity('community_comments')
export class CommunityComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'post_id' })
  postId: string;

  @ManyToOne(() => CommunityPost, (post) => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: CommunityPost;

  @Column({ name: 'author_id' })
  authorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ name: 'parent_comment_id', nullable: true })
  parentCommentId: string | null;

  @ManyToOne(() => CommunityComment, (comment) => comment.replies, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parent_comment_id' })
  parentComment: CommunityComment | null;

  @OneToMany(() => CommunityComment, (comment) => comment.parentComment)
  replies: CommunityComment[];

  @Column({ name: 'content_html', type: 'text' })
  contentHtml: string;

  @Column({ type: 'varchar', default: 'published' })
  status: CommunityCommentStatus;

  @Column({ name: 'likes_count', type: 'int', default: 0 })
  likesCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
