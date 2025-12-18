import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { LegalDocument } from './legal-document.entity';

@Entity('user_agreements')
export class UserAgreement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'document_id', type: 'uuid' })
  documentId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => LegalDocument, (doc) => doc.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document: LegalDocument;
}

